# PSEMS Frontend — Context for Claude Code

## What this is
Frontend for PSEMS (Project Scoring, Evaluation & Management System) — a CO3554 university project that must launch as a **real single-department faculty pilot by end of September 2026**. Full spec in `docs/` (`PSEMS_Comprehensive_Specification_v2.docx` for full detail; `PSEMS_Delivery_Roadmap.md` for the week-by-week plan and current cross-repo status).

## Stack
React 18 + TypeScript + Vite, Tailwind CSS, TanStack Query (server state), Zustand (session/notifications), React Hook Form + Zod validation, Chart.js/Recharts for analytics (later), React Router.

## Repo layout reality
One of four separate repos (polyrepo): `psems-backend`, `psems-frontend` (this repo), `psems-ml-service`, `psems-infra`. Backend is a modular monolith exposing a REST API on `http://localhost:4000` (see `.env.example` → `VITE_API_BASE_URL`). This frontend is a pure API consumer — no direct DB or ML access.

## THE SITUATION — read this first
As of 2026-07-14, **backend has shipped 6 full weeks (Weeks 1–6) and this repo has zero application code.** That gap is the single biggest risk to the whole project right now — six weeks of tested backend logic exists with no way for anyone, including the developer, to click through it in a browser. This session's job is to close that gap, not to start a from-scratch slow-and-steady frontend build. Prioritize breadth (a thin, ugly, working screen for every major flow) over depth (polishing one screen) until the full lifecycle is clickable end to end. Styling/UX polish is explicitly Phase 2.

## How the developer wants to work
Wants to **learn the stack hands-on** (this is mostly new to them) — explain reasoning, let them drive, don't silently generate everything. Given the urgency of the frontend gap above, it's reasonable to generate more scaffolding directly than usual to close the gap fast — but still narrate *why* each piece is built the way it is as you go, rather than just dropping finished files.

---

## Backend API reference (verified directly from source, 2026-07-14)

Base URL: `VITE_API_BASE_URL` (default `http://localhost:4000`). All protected routes require `Authorization: Bearer <accessToken>`. Login/refresh also set an **httpOnly cookie** (`psems_refresh_token`) — API calls that hit `/auth/refresh` or `/auth/logout` need `credentials: 'include'` (fetch) or `withCredentials: true` (axios) so the cookie is sent; the access token itself you store in memory/Zustand, never localStorage (it's short-lived by design, 15 min).

### Auth (`/auth`) — no CPI context
- `POST /auth/login` `{email, password}` → `{accessToken, forcePasswordChange, user:{id,email,role}}`. Sets refresh cookie.
- `POST /auth/change-password` (auth) `{currentPassword, newPassword}` — password policy: min 10 chars, upper, lower, digit, special char.
- `POST /auth/refresh` (cookie) → `{accessToken}`. Rotates the cookie.
- `POST /auth/logout` (cookie) — clears cookie, revokes server-side session.

### Users (`/users`)
- `GET /users/me` (auth) → `{user: {user_id, role, email}}`. Blocked (403, `code: "FORCE_PASSWORD_CHANGE"`) until password changed if `forcePasswordChange` was true at login.
- `POST /users/:id/assign-coordinator` (SYSTEM_ADMIN) — promotes an approved lecturer to Course Coordinator.

### Students (`/students`) — System Admin only
- `POST /students/bulk-provision` multipart `file` = CSV with header `email,fullName,studentId,department,year` → `{batchId, created, skipped[], invalid[]}`.
- `GET /students/provisioning/:batchId` → `{batchId, total, sent, failed, queued, students[]}` — poll this for email delivery status after a bulk upload.

### Lecturers (`/lecturers`)
- `POST /lecturers/register` (public) `{email, fullName, password}` — full password policy required (no forced-change flow for lecturers).
- `GET /lecturers/pending` (SYSTEM_ADMIN) — list awaiting approval.
- `POST /lecturers/:id/approve` / `POST /lecturers/:id/reject` (SYSTEM_ADMIN).

### Courses / CPIs (`/courses`) — Course Coordinator only, except invite-response
- `POST /courses` `{name, projectType, participationMode, department, academicYear}` → creates CPI. `projectType` ∈ `FYP | DATA_MANAGEMENT | HPC | INNOVATION_CHALLENGE`. `participationMode` ∈ `GROUP | INDIVIDUAL`.
- `GET /courses` — coordinator's own CPIs. `GET /courses/:cpiId` — detail.
- `PUT /courses/:cpiId/timeline` `{phases: [{phase, startDate, endDate}, ...]}` — **all 10 phases must be sent together, in order**: `STUDENT_REGISTRATION, SUPERVISOR_ADDITION, IDEA_ANNOUNCEMENT, PROJECT_SELECTION, PROJECT_REGISTRATION, EVALUATION_CONFIG, PROPOSAL_SUBMISSION, AVAILABILITY_SUBMISSION, EVALUATION_EXECUTION, FINAL_SUBMISSION`.
- `POST /courses/:cpiId/supervisors` `{lecturerUserId}` — invite (only valid during `SUPERVISOR_ADDITION` phase window; **first invite sent flips the CPI into SUPERVISOR_LED mode**).
- `POST /courses/:cpiId/supervisors/respond` (the invited lecturer) `{decision: "ACCEPT"|"DECLINE"}`.
- `POST /courses/:cpiId/finalize-coordinator-managed` — no supervisors invited → locks CPI into COORDINATOR_MANAGED mode.
- `POST /courses/:cpiId/evaluators` `{lecturerUserId}`, `POST /courses/:cpiId/head-judge` `{lecturerUserId}`.

### Groups (`/courses/:cpiId/groups`) — Student, phase = `STUDENT_REGISTRATION`
- `POST /` `{name}` — creates group, caller becomes leader. `POST /:groupId/invite` `{email}`. `POST /:groupId/respond` `{decision}`.
- `GET /mine` — caller's group in this CPI. `GET /:groupId`.

### Ideas (`/courses/:cpiId/ideas`) — phase = `IDEA_ANNOUNCEMENT`
- `POST /` `{title, description}` — actor type (supervisor/coordinator/student) determined server-side by caller's role/membership, not by a body field.
- `GET /` — **visibility is enforced server-side per caller**: students see public ideas + their own group's only, never other groups'. Just render what comes back.
- `POST /:ideaId/approve` / `POST /:ideaId/reject` (Coordinator, Coordinator-Managed mode).

### Selection / EOI (`/courses/:cpiId/selection`) — phase = `PROJECT_SELECTION`
- `POST /interest` `{ideaId, rank: 1-3}` (Supervisor-Led). `POST /seeking-supervisor` `{ideaId}`. `POST /willing` `{ideaId}` (supervisor).
- `POST /select` `{ideaId, supervisorUserId?}` — group's final choice; `supervisorUserId` only needed if picking their own idea with multiple willing supervisors (conflict resolution — group picks).
- `POST /:selectionId/respond` `{decision}` (the chosen supervisor, or coordinator in Coordinator-Managed).
- `GET /` — full current selection state for the CPI.

### Allocation (`/courses/:cpiId/allocations`) — Coordinator, phase = `PROJECT_REGISTRATION`
- `GET /` — allocation map + unmatched groups. `POST /generate` — seed from ACCEPTED selections. `PUT /:groupId` `{ideaId, supervisorUserId?}` — override. `POST /finalize` — locks (further edits → 409).

### Evaluations config (`/courses/:cpiId/evaluations`) — Coordinator, phase = `EVALUATION_CONFIG`
- `PUT /config` `{stages: [{name, weight, evaluatorsRequired, submissionRequired, criteria: [{name, description?, weight, maxScore}]}]}` — **stage weights must sum to 100; each stage's criteria weights must sum to 100.** Replace-all semantics.
- `POST /stages/:stageId/evaluators` `{lecturerUserId}`.
- `GET /config` — any CPI participant, not phase-gated (students can see the rubric).

### Files (`/courses/:cpiId/stages/:stageId/submission`) — Student
- `POST /` multipart `file` field, 20MB max — proposal upload. Soft-deadline: accepted any time after `PROPOSAL_SUBMISSION` opens, flags `isLate` if past the window end (not hard-blocked).
- `GET /courses/:cpiId/submissions` — list.

### Scheduling (`/courses/:cpiId`) — added Week 7, verified 2026-07-22
- `POST /availability` (any evaluator/supervisor, phase = `AVAILABILITY_SUBMISSION`) `{slotStart, slotEnd}` — submit an available time slot.
- `GET /availability` (Coordinator) — all submitted slots, for building the timetable.
- `POST /sessions/generate` (Coordinator, same phase) — creates one `evaluation_session` per allocated group × evaluation stage. Idempotent (safe to re-call).
- `PUT /sessions/:sessionId/schedule` (Coordinator, same phase) `{scheduledStart, scheduledEnd}` — assign a time to a generated session.
- `GET /sessions` (any participant) — list sessions for the CPI.

### Scoring (`/courses/:cpiId`) — added Week 7, phase = `EVALUATION_EXECUTION`
- `POST /sessions/:sessionId/scores` (assigned evaluator) `{scores: [{criterionId, score, comment?}, ...]}` — submit per-criterion scores for a session. Session auto-flips to `AWAITING_HEAD_JUDGE` once every assigned evaluator has scored every criterion.
- `GET /sessions/:sessionId/scores` — **evaluator isolation is enforced server-side here**: an evaluator sees only their own scores until the session is FINALIZED; the Head Judge sees everyone's; the coordinator only sees scores after FINALIZED. Render exactly what comes back, don't try to merge/cache scores across users client-side.

### Head Judge (`/courses/:cpiId`) — added Week 7, phase = `EVALUATION_EXECUTION`
- `GET /sessions/:sessionId/review` (Head Judge) — all evaluators' scores side-by-side, with a deviation flag when the spread exceeds 20% of a criterion's max score.
- `POST /sessions/:sessionId/approve` — requires session status `AWAITING_HEAD_JUDGE` and all scores `FINALIZED`; locks the session.
- `POST /sessions/:sessionId/request-correction` `{evaluatorUserId, reason}` — reopens that one evaluator's scores for correction.

### Marks (`/courses/:cpiId/marks`) — added Week 8
- `POST /aggregate` (Coordinator) — computes each group's marks from FINALIZED session scores (criterion % of maxScore → weighted by criterion weight → stage % → weighted by stage weight → overall 0–100). Requires every session FINALIZED first (409 otherwise).
- `POST /publish` (Coordinator) — makes marks visible to students (409 if not aggregated yet).
- `GET /` — Coordinator sees all groups' marks; a student sees **only their own group's, and only after publish** (403 before publish — don't build a UI state that assumes marks exist pre-publish).

### Notifications (`/notifications`) — added Week 8
- `GET /` (any authed user) — the caller's notifications, newest presumably first.
- `POST /:id/read` — mark one as read.
- Already wired server-side into: supervisor invites, allocation finalization, Head Judge approve/request-correction, marks publish. The frontend just needs to display/poll these, not trigger them.

### Not yet built (don't call these)
Coordinator's full analytical summary (grade distribution, evaluator consistency — likely lands with the `analytics` module alongside ML), all 7 ML endpoints. These are backend Weeks 9–11 — build frontend for them as each lands, not before.

---

## Recommended build order (catch-up, then keep pace with backend)

Build **thin, ugly, functional screens first** — no design system, no polish — so the whole lifecycle becomes clickable, then circle back to make it look decent. Suggested sequence, each one a real vertical slice against the API above:

1. **Foundation:** Vite+React+TS+Tailwind scaffold, API client (axios/fetch wrapper with the Bearer token + 401→refresh retry logic), Zustand auth store, React Router with a protected-route wrapper that checks role.
2. **Auth:** login screen, forced-password-change screen (must intercept `FORCE_PASSWORD_CHANGE` responses globally, not per-screen).
3. **System Admin:** CSV upload for bulk student provisioning + a simple batch status view; lecturer approval queue.
4. **Course Coordinator:** create CPI form, timeline setup (10 phase date pickers), supervisor/evaluator/head judge invite screens.
5. **Student:** group creation/invite/accept, idea browsing + posting, EOI/selection flow.
6. **Coordinator:** allocation review/override/finalize screen, evaluation config builder (stages + nested rubric criteria with live weight-sum validation — mirror the backend's own validation client-side for good UX, but the backend is still the enforcement point).
7. **Student:** proposal file upload.

Steps 2–3 alone make Weeks 1–2 of backend demoable — don't wait until the whole list is done to show progress.

## Non-negotiables carried over from backend
Students must never see other groups' ideas or marks, evaluators must never see each other's scores before Head Judge review (not relevant yet — Week 7). The backend already enforces this server-side; the frontend's job is to not defeat it by over-fetching, caching stale cross-role data in Zustand, or leaving a previous user's state visible after a role switch/logout (clear all client state on logout).

## Current phase
**Gap reopened, catch-up round 2 needed (2026-07-22).** Round 1 caught this repo up to backend Week 6 (2026-07-21, 5 commits — see below). But backend then shipped Weeks 7–8 (scheduling, evaluator-isolated scoring, Head Judge review, mark aggregation/publishing, notifications — see the API reference above) with **no matching frontend again**, same pattern as the first gap. That means the entire scoring/results half of the platform is currently backend-only.

**This session's job:** build screens for Weeks 7–8, in this order:
1. **Evaluator scoring interface** — list assigned sessions, submit per-criterion scores. Must respect the isolation rule: don't show or cache other evaluators' scores anywhere client-side, even after the session is FINALIZED for non-HJ/non-coordinator roles.
2. **Coordinator scheduling screens** — view submitted availability, generate sessions, assign times.
3. **Head Judge review screen** — side-by-side scores with deviation flags, approve / request-correction actions.
4. **Coordinator marks screens** — trigger aggregate, trigger publish, view all groups' marks.
5. **Student marks view** — own group's marks, only rendered post-publish (handle the pre-publish 403 gracefully, don't treat it as an error state).
6. **Notifications** — a simple list/bell + mark-as-read, available globally across all roles (not tied to one dashboard).

Once these six land, the entire 12-step lifecycle is clickable end to end, not just backend-tested — that's the actual milestone, not just "backend is done."

**Also still outstanding from round 1 (2026-07-21), not yet done:** an independent end-to-end click-through of Weeks 1–6 to confirm it actually works, not just that the commits/files exist. Worth doing once round 2 is far enough along to test the whole thing in one pass rather than twice.

### Round 1 (2026-07-21, for reference)
Fully caught up to backend Week 6 across 5 commits: `dcdd130` (scaffold+auth+System Admin), `6db84ad` (Coordinator CPI/timeline/assignments), `ffb21d3` (Student groups, ideas, project selection), `6cdc180` (Coordinator allocation + evaluation config, Student proposal upload).
