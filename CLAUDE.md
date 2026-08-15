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

**Collaboration screens COMPLETE as of 2026-08-10 (uncommitted).** `tsc -b` + `vite build` clean. Matching backend notes in `psems-backend/CLAUDE.md`.

- New: `features/profiles/useProfiles.ts`, `features/courses/useSupervisorRequests.ts`; `pages/profile/ProfilePage.tsx` (About / Research / Projects-supervised tabs) and `EditProfilePage.tsx`; `pages/lecturer/DiscoverCoursesPage.tsx`; `pages/coordinator/CpiSupervisorRequests.tsx`.
- **Profiles are not role-gated** — `/profile/:userId` and `/profile/edit` sit outside every role layout, since a student reading a supervisor's profile and a lecturer reading a student's are the same page. "My profile" is linked from all three layout headers.
- `SelectionPage` **drops the rank picker** (interest is flat now) and gains a withdraw button per interest. `SupervisorSelectionPage` gains withdraw, "I'm interested" and "Offer to co-supervise".
- `LecturerIdeasPage` shows each idea's supervisor list with its invitation state (accepted / not yet accepted / declined) and lets the idea's own supervisor invite a co-supervisor.
- `CpiSessionPanels` gains a **per-stage "Apply to all groups"** block — the usual starting point, with per-session edits below it. It surfaces what the server kept and why, since anyone who already submitted marks is never removed.
- `GroupPage` gains "Continue without a group"; `LecturerApprovalPage` gains the lecturer CSV upload.
- **Course settings**: the toggles for co-supervisors, interest withdrawal, self-requests and individual participation are now live. Grading and availability remain disabled with a label saying what they wait on — a coordinator should never flip something that does nothing.

**Restructure Wave 1 COMPLETE as of 2026-08-09 (uncommitted).** `tsc -b` + `vite build` clean. Matching backend notes in `psems-backend/CLAUDE.md`; full plan in `PSEMS_Restructure_Plan.md`.

- New `features/policy/usePolicy.ts` (course settings), `features/panel/usePanel.ts` (session panels, guests, roles), `features/panel/useGuest.ts` (link-authenticated guest calls), `features/review/useReview.ts`. **`features/headjudge/` deleted** — review is no longer head-judge-specific.
- New screens: `pages/coordinator/CpiPolicyPanel.tsx` (every behavioural setting, grouped), `pages/coordinator/CpiSessionPanels.tsx` (per-session panel editor + guest invites), `pages/guest/GuestScoringPage.tsx`. Both coordinator panels are wired into `CpiDetailPage`.
- **`/guest?token=…` sits outside `ProtectedRoute` and every role layout** — the link is the credential. The issued link is shown once, on invite, with a warning: only its hash is stored server-side.
- `CpiEvaluationConfig` builds **panel rules** (role, min, max, mark-counting, open-to-all) instead of a single `evaluatorsRequired` number, plus per-stage score visibility. `LecturerSessionsPage` gained the **mandatory overall-comment box** (submit is disabled without it) and an amber banner when a stage's scores are open to the whole panel. `ReviewPage` shows overall comments, targets corrections by **panelist seat** rather than user id (so a guest with no account can be asked to revise), and carries the three manual actions: **Close scoring**, **Approve & finalize**, **Reopen**. It also shows per-role readiness (`3/2 evaluators`) as information — nothing advances by itself, so the reviewer decides when marking ends.
- `SessionStatus` union: `AWAITING_HEAD_JUDGE` → `AWAITING_REVIEW`.
- **Known pre-existing gap, not introduced here:** the frontend has no ESLint config at all, so `npm run lint` has never worked (the backend has one). Everything here is verified by `tsc -b` + `vite build` only.
**Customizability pass COMPLETE as of 2026-07-25 (uncommitted).** Frontend for four new features (`tsc -b` + `vite build` clean): **(A)** create-CPI project type is a free-text input with a datalist of suggestions (`PROJECT_TYPE_SUGGESTIONS`), no longer a fixed dropdown; **(B)** idea revise/resubmit — student `IdeasPage` shows the revision note and an inline edit/resubmit form on their own idea; coordinator `CpiIdeasModeration` and supervisor `SupervisorSelectionPage` have a "Request revision" note+button (`useUpdateIdea`, `useRequestIdeaRevision`); **(C)** `LecturerSessionsPage` timer is now server-driven and polled (`useControlTimer`, `useSessions(cpiId, { refetchInterval: 3000 })`) so all evaluators share one live clock; **(D)** `CpiEvaluationConfig` has optional per-stage submission + scoring (execution) datetime windows, and `CpiDetailPage`'s timeline editor has per-phase enable checkboxes so a CPI can use any subset of phases. New hook exports: `useStudentCpis`/`useLecturerCpis`/`useCpiSummary`, `useUpdateIdea`/`useRequestIdeaRevision`, `useControlTimer`.

**No-UUID pass COMPLETE as of 2026-07-25 (uncommitted).** Removed every raw-UUID/id text input in the app — nothing requires typing an id anymore:
- **Student `EnterCpiPage`** and **lecturer `LecturerEnterCpiPage`** are now clickable course lists (new `useStudentCpis`/`useLecturerCpis` → `GET /courses/mine/student` [department + joined CPIs] and `/courses/mine/lecturer` [accepted supervisor + evaluator/HJ roles]). The lecturer page keeps the supervisor-invites card above the list.
- **`CpiAllocation`** override/assign: group + idea + supervisor **dropdowns** (allocation map now returns `ideas` and accepted `supervisors` with userId).
- **`CpiEvaluationConfig`** stage-evaluator assign: dropdown of the CPI evaluator pool (`useCpiDetail`; CPI-detail evaluators now carry `user.id`).
- **`ReviewPage`** request-correction: dropdown of the session's evaluators (review scores now include evaluator `id`).
- **`SelectionPage`** own-idea supervisor pick: dropdown of willing supervisors (selection supervisor refs now include `user.id`).
Verified: frontend `tsc -b` + `vite build` clean; backend `tsc`+lint clean, 38 tests/10 suites green.

**Full gap-closure pass COMPLETE as of 2026-07-25 (uncommitted).** Built the frontend for every actionable item in `docs/E2E_TEST_GUIDE.md` 4.2 (items 1–16; 17–18 accepted; no ML). `tsc -b` typecheck + `vite build` both clean. What shipped: `RegisterPage.tsx` (public `/register` lecturer self-registration, linked from login) [#1]; pending supervisor-invites list + Accept/Decline on `LecturerEnterCpiPage` [#2]; `SupervisorSelectionPage.tsx` at `/lecturer/cpi/:id/selection` — mark willing + accept/decline selections, with a new "Selection (supervisor)" tab [#3]; lecturer name/email **picker** (`useApprovedLecturers`) replacing raw-UUID inputs in `CpiAssignments` [#4]; real pending group-invites list on `GroupPage` replacing the UUID paste [#5]; score inputs now lock at `AWAITING_HEAD_JUDGE`/`FINALIZED` in `LecturerSessionsPage` [#6]; session **location** input + read-only display, **overdue** tag, and scheduling **conflict** warnings in `CpiScheduling` + `LecturerSessionsPage` [#14–16]; unmatched supervisor ideas + Coordinator-Managed "Confirm pairing" workflow in `CpiAllocation` [#9, #11]; **presentation-day timer** (start/pause/resume/stop, save-once) on `LecturerSessionsPage` with read-only duration in `ReviewPage` [#12]; forced first-login change hides the current-password field [#13]. New hooks: `useSupervisorInvites`, `useApprovedLecturers`/`useRegisterLecturer`, `usePendingGroupInvites`, `useMarkWilling`, `useSetPresentationDuration`, `useConfirmAllocation`. Next: Week 9 ML UI alongside the ML service.

**Round 2 COMPLETE as of 2026-07-22 (`4b025ce`).** Evaluator scoring, coordinator scheduling, Head Judge review, coordinator + student marks, and notifications all shipped. A `lecturer` role section was introduced (`LecturerLayout`, `LecturerCpiLayout`) reflecting that supervisor/evaluator/Head Judge are all CPI-scoped roles on one lecturer account, matching the backend's own design.

**The full 12-step lifecycle should now be clickable end to end.** Still genuinely unverified: nobody has walked the whole thing in one real pass (create CPI → timeline → supervisor → group → idea → selection → allocation → eval config → scheduling → scoring → HJ approval → mark aggregation → publish → student sees marks). This is now the highest-value next action — more valuable than starting ML, since it's the only way to know if Weeks 1–8 actually work together or just individually pass their own tests.

**Next after that verification:** Week 9 in `psems-ml-service` (idea suggestion + plagiarism warning), and this repo picks up the matching ML-feature UI once that's ready — same alongside-not-after discipline as this round.

### Round 2 gap history (for reference, resolved 2026-07-22)
Backend shipped Weeks 7–8 (2026-07-22) with no matching frontend, reopening the same gap pattern as round 1. Closed same day.

### Reclassified 2026-07-25 — user wants these fixed (previously logged as accepted tradeoffs)
- **Password re-ask on forced first-login change**: hide/omit the "current password" field on `ChangePasswordPage` specifically when arriving via the forced-change path (backend change paired with this — see `psems-backend/CLAUDE.md`).
- **Session location**: once the backend adds `location` to `EvaluationSession` (see backend notes), display it in `CpiScheduling.tsx`'s "set time" flow (as an optional input alongside start/end) and read-only wherever a session shows up for students/lecturers.
- **Overdue sessions**: once the backend exposes (or compute client-side) an `isOverdue` flag, show it clearly in `CpiScheduling.tsx` and `LecturerSessionsPage.tsx` — e.g. a red "overdue, not yet scored" tag next to the status badge.
- Scheduling conflict warnings (backend-driven, see backend notes) should surface as a visible error/warning in `CpiScheduling.tsx`'s "set time" action, not just a raw error string.

### New feature proposed 2026-07-25 (user's own idea, not in original spec): presentation-day timer
Evaluators need a start/pause/resume/stop stopwatch on `LecturerSessionsPage` while a student presents, so actual presenting time is known and can inform marking (e.g. a Time Management rubric criterion the coordinator can already add via Evaluation Config — no new mechanism needed there). Design (see `psems-backend/CLAUDE.md` for the matching backend piece): purely client-side ticking while running, only the final elapsed seconds get saved once via one API call — don't try to live-sync a clock across multiple evaluators' browsers, unnecessary complexity for a pilot. Read-only display of the saved duration should also show up in `ReviewPage` for the Head Judge. Full gap list consolidated in `docs/E2E_TEST_GUIDE.md` section 4.2.

### Gap #20 found during live re-test, 2026-07-26
`SelectionPage.tsx`'s "Interest (Supervisor-Led)" panel stays visible/clickable after the group already has a selection (`state.selection` set) — only the "Select a project" section above it is conditionally hidden then. Not harmful, just confusing (implies more action needed). Fix: wrap the Interest panel in the same `{!state.selection && (...)}` condition.

### Gap #19 found + fixed 2026-07-25: no frontend page for a supervisor to post an idea
`LecturerIdeasPage.tsx` added at `/lecturer/cpi/:id/ideas` (code-reviewed, correctly wired: route, nav tab, `usePostIdea`/`useIdeas` reused). Backend already supported this (`POST /courses/:cpiId/ideas` authorizes by actor capacity, not role) — was purely a missing frontend screen. Two bonus additions landed alongside it, also clean: `AdminCoordinatorsPage.tsx` (`/admin/coordinators`, promote an approved lecturer to Course Coordinator via the pre-existing `/users/:id/assign-coordinator` endpoint, previously no frontend) and `CpiSubmissions.tsx` (coordinator can now see every group's submissions with late flags, previously no visibility at all). All uncommitted as of this note — see `RETEST_GUIDE_v2.md` for the live re-test plan covering these plus everything else.

### Missing feature found during end-to-end pilot test (2026-07-23) — bigger than the others below
**The entire supervisor side of EOI/Mutual Confirmation (Step F, Supervisor-Led mode) has no frontend UI.** `useSelection.ts`'s `SelectionState` type already has a `role: 'SUPERVISOR'` union branch (`willingByMe`, `pendingSelections`) and the backend endpoints exist (`POST /selection/willing`, `POST /selection/:id/respond`), but no page calls either — `SelectionPage.tsx` only handles the `STUDENT` and (via `CpiSelections.tsx`) `COORDINATOR` branches. A real supervisor in Supervisor-Led mode currently cannot mark themselves willing to supervise an idea, nor confirm/decline a group's selection, through the app at all. Worked around during testing via direct API calls (PowerShell `Invoke-RestMethod`). **This is a functional gap in the core pilot flow, not a nice-to-have** — needs a lecturer-facing page (e.g. `/lecturer/cpi/:id/selection`) showing pending selections awaiting this supervisor's response, and ideas they could mark willing on, mirroring the existing `CpiSelections.tsx` pattern.

### Bug found during end-to-end pilot test (2026-07-23)
**Pattern: raw UUID copy-paste with no lookup, in both the coordinator Assignments panel AND the student group-invite flow.** Group invite "Accept/Decline" (`GroupPage.tsx` `RespondInviteCard`) asks for a raw group id with no way to discover it — group invites don't notify (backend gap, see `psems-backend/CLAUDE.md`) and the leader's own group view never displays the group id either. Needs: a lecturer search/picker replacing UUID pastes in `CpiAssignments.tsx`, and a real pending-invites list on `GroupPage` so an invitee never touches a UUID. Same root cause as the supervisor-invite gap below — worth fixing as one pass across both.

**No UI for a lecturer to accept/decline a supervisor invite.** `POST /courses/:cpiId/supervisors/respond` exists and works on the backend; nothing in this repo calls it. `LecturerEnterCpiPage` only accepts a CPI id the lecturer already knows and routes straight to `/sessions` — there's no pending-invites list. This blocks a real supervisor from ever accepting an invite through the app (worked around in testing via direct curl calls). **Fix before relying on this flow for a real cohort.** Suggested shape: a pending-invites section on `LecturerEnterCpiPage` (or its own route) listing CPIs with a PENDING `cpi_supervisors` row for the logged-in lecturer, each with Accept/Decline buttons — same pattern as the student group-invite UI on `GroupPage`. Worth checking while there whether the equivalent evaluator-side accept flow (if any) has the same gap. Round 1 caught this repo up to backend Week 6 (2026-07-21, 5 commits — see below). But backend then shipped Weeks 7–8 (scheduling, evaluator-isolated scoring, Head Judge review, mark aggregation/publishing, notifications — see the API reference above) with **no matching frontend again**, same pattern as the first gap. That means the entire scoring/results half of the platform is currently backend-only.

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
