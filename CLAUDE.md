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

### Not yet built (don't call these)
Scheduling, evaluation execution/scoring, Head Judge review, mark aggregation/publishing, notifications, all 7 ML endpoints. These are backend Weeks 7–11 — build frontend for them as each lands, not before.

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
As of 2026-07-21, build-order steps 1–4 are done (2 commits: `dcdd130` scaffold+auth+System Admin screens, `6db84ad` Course Coordinator CPI screens — creation, timeline, supervisor/evaluator/head-judge assignments). Remaining to fully catch up to backend Week 6:
- **Step 5 (next):** Student — group creation/invite/accept, idea browsing + posting, EOI/selection flow.
- **Step 6:** Coordinator — allocation review/override/finalize screen, evaluation config builder (stages + rubric criteria, live weight-sum validation).
- **Step 7:** Student — proposal file upload.

Once Step 7 lands, frontend is caught up to backend Week 6 and the project resumes backend Week 7 (scheduling, evaluation execution w/ evaluator isolation, Head Judge review) — building its frontend alongside it this time, not after.
