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
- `POST /students/bulk-provision` multipart `file` = CSV with header `email,fullName,studentIndex,registrationNumber,batch,department` (registration number optional; **batch required**) → `{batchId, created, skipped[], invalid[]}`. The index column also accepts `indexNumber` or the original `studentId`. **`year` was dropped 2026-08-23** — nothing read it and it was stale within a year.
- `GET /students/provisioning/:batchId` → `{batchId, total, sent, failed, queued, students[]}` — poll this for email delivery status after a bulk upload.

### Lecturers (`/lecturers`)
- `POST /lecturers/register` (public) `{email, fullName, password}` — full password policy required (no forced-change flow for lecturers).
- `GET /lecturers/pending` (SYSTEM_ADMIN) — list awaiting approval.
- `POST /lecturers/:id/approve` / `POST /lecturers/:id/reject` (SYSTEM_ADMIN).

### Courses / CPIs (`/courses`) — Course Coordinator only, except invite-response
- `POST /courses` `{name, projectType, participationMode, department, batch, academicYear}` → creates a course as a **DRAFT**. `batch` is required and decides which students ever see it. `projectType` ∈ `FYP | DATA_MANAGEMENT | HPC | INNOVATION_CHALLENGE`. `participationMode` ∈ `GROUP | INDIVIDUAL`.
- `GET /courses` — coordinator's own CPIs. `GET /courses/:cpiId` — detail.
- `PUT /courses/:cpiId/timeline` `{phases: [{phase, startDate, endDate}, ...]}` — replace-all over **any subset** of the 10 phases (minimum 1); order is validated among whichever are sent, and an omitted phase simply leaves its gated actions closed. Full order: `STUDENT_REGISTRATION, SUPERVISOR_ADDITION, IDEA_ANNOUNCEMENT, PROJECT_SELECTION, PROJECT_REGISTRATION, EVALUATION_CONFIG, PROPOSAL_SUBMISSION, AVAILABILITY_SUBMISSION, EVALUATION_EXECUTION, FINAL_SUBMISSION`. (This section is the 2026-07-14 reference; entries below it were corrected for Waves 1–3 where they had gone stale, but treat the source as authoritative over anything here.)
- `POST /courses/:cpiId/supervisors` `{lecturerUserId}` — invite (only valid during `SUPERVISOR_ADDITION` phase window; **first invite sent flips the CPI into SUPERVISOR_LED mode**).
- `POST /courses/:cpiId/supervisors/respond` (the invited lecturer) `{decision: "ACCEPT"|"DECLINE"}`.
- `POST /courses/:cpiId/preset` `{mode: "SUPERVISOR_LED" | "COORDINATOR_MANAGED"}` — applies a preset **at any time**, not only at creation. Writes the five settings the preset has an opinion about and leaves every other one alone. Added 2026-08-16.
- `POST /courses/:cpiId/coordinator-managed-preset` — the original single-preset route, now a delegate of the above. (Was `finalize-coordinator-managed`, which locked the CPI into a mode; **nothing locks a mode any more** — since Wave 1 the mode is only a preset label.)
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
- `PUT /availability/template` (Coordinator, **not** phase-gated — the form must exist before anyone can fill it in) `{windowStart, windowEnd, slots: [{name, startTime, endTime}]}` — replace-all definition of the grid: dates are the columns, named day-parts the rows. Republishing drops removed slots and the answers given against them.
- `GET /availability/template` (any authenticated user) — the grid's shape plus its `dates[]`. Answers are not included.
- `PUT /availability` (any evaluator / accepted supervisor / seated panelist, phase = `AVAILABILITY_SUBMISSION`) `{entries: [{templateSlotId, slotDate, status, note?}]}` where `status ∈ AVAILABLE | TENTATIVE | UNAVAILABLE`. **Bulk replace-all** — an omitted cell is cleared, which is how a slot is withdrawn.
- `GET /availability/mine` — this lecturer's own answers plus a `required` flag from `CpiPolicy.availabilityRequiredFrom`.
- `GET /availability` (Coordinator) — every answer, plus `outstanding[]`: people the policy expected who have not replied.
- `POST /sessions/generate` (Coordinator, phase = `AVAILABILITY_SUBMISSION`) — one `evaluation_session` per allocated group × stage, seeding each session's panel. Idempotent.
- `PUT /sessions/:sessionId/schedule` (Coordinator) `{scheduledStart, scheduledEnd, location?, allocatedMinutes?}` → `{session, conflicts[]}`. **Not phase-gated at the route** — scheduling opens with `AVAILABILITY_SUBMISSION` and stays open, so a session can still be moved afterwards. Conflicts are typed (`PANELIST_DOUBLE_BOOKED`, `GROUP_DOUBLE_BOOKED`, `ROOM_DOUBLE_BOOKED`, `OUTSIDE_AVAILABILITY`, `REQUIRED_PANELIST_MISSING`) and always advisory — render them as warnings, never as a failure.
- `PUT /sessions/schedule` (Coordinator) `{entries: [{sessionId, ...schedule fields}]}` — lay out a block of sessions in one call.
- `GET /sessions/:sessionId/alternative-slots` (Coordinator) — slots where every panelist the stage *requires* is free, ranked by least disturbance. Fetch on demand, after a conflict has been seen.
- `GET /schedule-sheet?stageId=` (Coordinator only) — the printable handout: per group, `No | Index Number | Name`, date, time range, venue. Coordinator-only because it names every student on every group.
- `GET /sessions` — the coordinator sees all; **a student sees their own group's**; a supervisor sees every group they supervise; a panelist sees their seated sessions.
- `GET /sessions/:sessionId/timer` — light payload for ~1s polling: `{running, elapsedSeconds, currentSegmentIndex, segments[]}`. Use this for the clock, never the session list.
- `POST /sessions/:sessionId/timer` `{action}` where `action ∈ start | pause | next | previous | stop | reset`. **Nothing advances on reaching a target** — the segment keeps counting and reports `overranSeconds`; `next` is the manual advance.
- `POST /sessions/:sessionId/segments/:segmentId/timeliness` `{timeliness}` — override the computed `ON_TIME | OVERTIME | UNDER` verdict.

### Scoring (`/courses/:cpiId`) — added Week 7, phase = `EVALUATION_EXECUTION`
- `POST /sessions/:sessionId/scores` (assigned evaluator) `{scores: [{criterionId, score, comment?}, ...]}` — submit per-criterion scores for a session. Session auto-flips to `AWAITING_HEAD_JUDGE` once every assigned evaluator has scored every criterion.
- `GET /sessions/:sessionId/scores` — **evaluator isolation is enforced server-side here**: an evaluator sees only their own scores until the session is FINALIZED; the Head Judge sees everyone's; the coordinator only sees scores after FINALIZED. Render exactly what comes back, don't try to merge/cache scores across users client-side.

### Head Judge (`/courses/:cpiId`) — added Week 7, phase = `EVALUATION_EXECUTION`
- `GET /sessions/:sessionId/review` (Head Judge) — all evaluators' scores side-by-side, with a deviation flag when the spread exceeds 20% of a criterion's max score.
- `POST /sessions/:sessionId/approve` — requires session status `AWAITING_HEAD_JUDGE` and all scores `FINALIZED`; locks the session.
- `POST /sessions/:sessionId/request-correction` `{evaluatorUserId, reason}` — reopens that one evaluator's scores for correction.

### Marks (`/courses/:cpiId/marks`) — reshaped for per-student marks and per-stage publishing
- `POST /aggregate` (Coordinator) — works out every group's and every student's marks from FINALIZED session scores. Per criterion: combine the panel's scores, turn that into a percentage of the maximum, weight by the criterion's weight; GROUP criteria give every member the same share, INDIVIDUAL criteria give each their own. The stage total is weighted by the stage's weight. The group's figure is the average of its members'. Requires every session FINALIZED first (409 otherwise).
- `POST /publish` (Coordinator) `{stageId, publishMarks, publishComments}` — `stageId: null` sets the whole course, a stage id sets that stage. Marks and comments are separate switches and **either can be set back to false**. A stage's own row wins; otherwise the course-wide row applies. 409 if marks have not been aggregated.
- `GET /publications` (Coordinator) — the current switches, per stage and course-wide.
- `PUT /grade-bands` (Coordinator) `{bands: [{label, minPercent}]}` — replace-all; only applied when the course policy has `gradingEnabled`. `GET /grade-bands` for any participant.
- `GET /sheet` (Coordinator only) — the CA sheet: one row per student with surname and initials split out, one column per stage, a `weights` map summing to 1.00, a total, and `zeroTotal` flags. Coordinator only because it lists every student in the course.
- `GET /` → `{gradingEnabled, caContributionPercent, pendingStages[], groups[]}`. The coordinator sees every group and every student. **A student gets 200 even before anything is published** — `groups` is empty and `pendingStages` names what is still to come. Do not build a UI that treats 403 as "not published"; that was the Week 8 behaviour and it is gone. A student sees only their own breakdown, never a group-mate's.

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

**Search, roles and the packed coordinator screens (2026-08-25).** `tsc -b` + `vite build` + lint + `npm test` clean (**77 tests / 12 files**); backend **147 tests / 19 suites**.

- **The schedule sheet is a real PDF, not `window.print()`.** There was no `@media print` rule anywhere, so printing produced the whole page — rail, top bar and all. `scheduleSheetPdf.ts` builds an A4 landscape document laid out like the faculty's own lab sheets: two columns of group tables, `Group | No | Index Number | Name | Date & Time`, with the group and the time merged down their rows, a running header and a page count. jsPDF is `import()`ed at click time, so its 390 kB stays out of the main bundle.
  - `buildScheduleSheetPdf` returns the document and `downloadScheduleSheet` saves it, which is what let the layout be generated and inspected outside a browser. Worth keeping: the first attempt reset the band tracking inside `didDrawPage`, which also fires for the *first* table, so tables drew over the title and over each other. Page breaks are now decided before drawing, from a height measured with `splitTextToSize` at the same font and column width autoTable uses. Verified on 6 and 16 groups: 1 and 2 pages, lowest drawn content 69pt and 134pt against a 39.7pt bottom margin.
  - `CpiMarks` still calls `window.print()` for the CA sheet and has the same problem.
- **`shortName` keeps a title whole** — "Dr. Krishanth Mohan" is `Dr. K.Mohan`, never `D.K.Mohan`. Leading honorifics are held aside before the initials are taken.
- **The directory billed administrators as lecturers.** The card asked only `isStudent ? 'Student' : 'Lecturer'`, so every other role fell through to Lecturer. `profileShape` already carries a label and a badge tone per role and is now what the card reads. Administrators are also gone from the directory itself — it exists to find a supervisor or a teammate, and an admin is neither.
- **A long name is written the way it is written down.** `shortName` turns "Dulina Hansa Nimsara" into "D.H.Nimsara", and leaves anything already short untouched, so it can be applied wherever space is tight without flattening every name. Applied to cards, chips and comma-joined lists — not to `<option>`s, where the list is wide and you are picking one specific person, and not to a profile heading. The full name stays in `title`.
- **Profile art carries who someone is.** Green academic, blue student, violet outside guest, slate administrator — the last so an admin does not read as a lecturer, which is the confusion above. One `.avatar-art` gradient over four token sets, so a tone is one class and the glow follows it rather than being a background plus a matching shadow to keep in step. White initials clear 4.5:1 at the centre on all three new tones.
- **A promoted lecturer lost every course they supervised.** `/lecturer` was gated to `allowedRoles={['LECTURER']}` and the coordinator rail had no link to it, so promotion made all of it unreachable. The backend never lost anything — supervision lives on the course, not the account. The section now admits `COURSE_COORDINATOR`, and a **workspace switcher** carries the reader between the two hats.
- **A coordinator could reach Supervising but not leave it.** A rail link was only half a fix: `/lecturer` rendered `LecturerLayout`, which hardcoded the *lecturer* rail, so arriving there replaced every link back to `/coordinator`. Role no longer picks one nav for the whole session. `workspaces.ts` gives a coordinator two — **Coordinating** and **Supervising** — and `WorkspaceSwitcher` sits above the rail's nav with both on screen and the current one lit, so switching back is one click and which hat you are wearing is never something to remember. The five section layouts are now one line each over `RoleShell`, which also remembers the last workspace for `/directory` and `/profile`, routes that belong to neither.
  - The sliding pill is placed by arithmetic (`translateX(index * 100%)`), which is only true if the segments are equal. Under `flex-1` they were not — a flex item will not shrink below a `whitespace-nowrap` label, so **Coordinating** stole 9px from **Supervising** and the pill sat off its label. `grid auto-cols-fr` makes the columns genuinely equal. Measured at 320–414 wide: aligned, nothing clipped, no sideways scroll. Contrast on the tray is 5.77 light / 5.41 dark.
- **Scheduling and Marks were flush against each other.** Both wrapped everything in `<Card className="space-y-3">` — but `Card` renders its children inside a padded `<div>`, so the spacing applied to nothing, and the tiles, panels and buttons stacked with no gap. It also nested cards inside a card. Both are now the page's own `space-y-5` stack with real `Card`s as siblings.
- **The Ctrl+K badge is gone** from the search field. The shortcut still works; the badge was clutter.
- **A student is no longer asked for a Designation.** `profileShape` carries `designationLabel` — null for a student, "Designation" for an academic, "Office or role" for an administrator — and the editor omits the field from the payload when it never showed it.
- **Admin → Coordinators gained Remove the role**, and the supervisor's interest list replaces **Take this group** with "You took this group" or "Already on <project>" once that group is placed.

**Evaluation screen, timer window and colour system COMPLETE as of 2026-08-23 (uncommitted).** `tsc -b` + `vite build` + lint + `npm test` clean (**59 tests / 10 suites**, unchanged). Follows the visual-refresh pass below.

- **The evaluation page was ~1,500 lines of controls on one scroll.** It is three areas now — **Rubric / Live settings / Panels** — chosen with a `Segmented`, each carrying a count so the switcher says what is behind it. They answer different questions at different points in the course.
- **Inside the rubric, one stage is open at a time, and one *area* of that stage at a time.** Folding the stages was not enough: an open stage still put five forms on screen (name, dates, panel, running order, criteria). Each is now its own tab within the stage, with the criteria total shown on the tab because it is the thing that blocks saving.
- **Stages can be reordered.** Up/down on the summary row. Safe by construction: `evaluations.service.ts` derives `orderIndex` from the array index on the config PUT, so moving an item here *is* how a stage is reordered. Not drag-and-drop — the list is three or four items and a drag target has no keyboard equivalent without building one.
- **`Disclosure`, `Meter` and `InfoTip` are new primitives.** The fold pattern had been hand-written twice (`CourseSettingsPanel`, `StageLiveSettings`) and already drifted. `Meter` puts the weights-must-total-100 rule next to the fields that decide it instead of as red text at the foot of a long form. `InfoTip` is the round "i" — click, not hover, because hover help is unreachable on touch and from the keyboard.
- **`Disclosure`'s header is a flex row, not a button.** `aside` is a slot callers put controls in, and a button inside a button is invalid markup the browser resolves however it likes.
- **The grounds are sage, not grey and not green-washed.** A green tint over the whole page left nothing for the green to *mean*; flat grey had no relationship to the brand and clashed with the white rail and top bar. The canvas is now a desaturated sage a clear step below white (contrast **1.30:1** light, **1.28:1** dark), so white chrome and white cards float on it. Green is back to being a signal colour only.
- **`--canvas-sunken` was inverted on the dark theme.** It is used for insets *on* a card — table heads, editor rows, the segmented track — so on dark it must be **lighter** than the surface. It was darker, which read as a hole punched in the card.
- **Every consequential button now says what it does and whether it can be undone.** Finalize, Reopen and Generate carry an `InfoTip`; the full list lives in **`pages/guide/guideActions.ts`** and renders in the guide as **What each button does**, filtered to the role being read and folded by default. Plain data, like `markingExplainer.ts` — add a line there, not a component change.
- **Every "Remove" in the app was invisible as a destructive control.** They were `variant="ghost"` plus `className="text-critical-700"` — two `text-*` utilities on one element, and `cn` concatenates, so which won was decided by Tailwind's output order. The grey one won. There is a **`danger-quiet`** variant now (tinted ground, red border, red text) and the overrides are gone; 11 more red-underlined-text buttons across 8 screens became real controls too.
- **Info tips are portalled to `document.body`.** `Disclosure` and `Card` both clip their contents, so a tip opened near the foot of a card was cut in half by the panel it belonged to. Position is measured, flips up when it would overflow the bottom, and is then **clamped on both axes** — flipping alone still leaves it off-screen when the trigger itself is. Verified fully visible in a 420px-tall window.
- **Tips were pruned from 9 to 5 in the rubric.** Four in one small area is noise. A tip is kept only where the label does not say what the setting does *and* there is no hint line under the field; "Weight" had a hint already, "Maximum" became one.
- **Presentation is now an explicit per-stage choice.** There is no `hasPresentation` column — only the optional `timerSegments` — so a stage with no running order read as "presentation, untimed" rather than "no presentation". The switch stores the decision in the data that already exists: **no segments means no presentation, one or more means there is one.** Turning it on seeds a 10-minute `Presentation` segment. `PresentationTimer` returns null for a segment-less session, so a report-marked stage no longer offers a clock or a projector window. **No migration.** The one state this cannot express is "presentation, deliberately untimed", which would need a real column.

- **The timer window matches the app without joining its theme.** It takes the shapes — brand gradient, pill, eyebrow, the icon set — and keeps its own always-dark ground, because it is read across a room. New: a crest header, a Running/Paused pill, a progress bar under the clock (four digits do not read from the back row), and icons on the controls with the brand fill on whichever of start/pause is actually the next action.
- **Verified in a throwaway harness** with the query cache seeded and XHR stubbed for the timer's one-second poll, then deleted. Contrast ratios measured in both themes. **Still not verified signed in** — passwords are not typed into forms here.

**Visual refresh COMPLETE as of 2026-08-23 (uncommitted).** `tsc -b` + `vite build` + lint + `npm test` clean (**59 tests / 10 suites**, unchanged — this pass touched presentation only, no routes, hooks or API calls). 65 files.

- **The footer is a fixed status bar, not a block at the end of the page.** It used to sit after the content, so on a short screen it floated mid-page and on a long one it was a scroll away — the two things people hunt for moved around. It is now `fixed` at the bottom edge, one line tall (`--footer-h: 2.75rem`), and on every screen including the signed-out ones: sign-in, register, forgotten password, forced password change, and the guest scoring link. **The projector view is the one exception** — it is chrome-free on purpose.
- **The footer's links follow the session.** Signed in it offers the guide; signed out it offers `/forgot-password`, because the guide sits behind `ProtectedRoute` and would only have bounced someone back to the sign-in page they were already on.
- **Three variables keep the fixed bar aligned with the page**: `--rail-w` and `--content-max`, republished by `AppShell` when the rail collapses, and `--footer-h`, which the content padding reads. Content, the page header's tick and the footer wordmark share one left edge in both rail states. Verified at 375, 1280 and 1600 wide.
- **`main` states its bottom padding as `pb-[calc(var(--footer-h)+1.5rem)]`, not a custom `.pb-footer` class.** Tailwind sorts responsive variants after plain utilities inside a layer, so `lg:py-8` beat the custom class and the last card sat under the bar. A top-only `pt-6 lg:pt-8` plus an arbitrary `pb-` cannot collide.
- **Tokens: a `canvas-sunken` ground, a `surface-raised` one, and three gradient stops** (`--brand-grad-a|b|c`) that invert with the theme, so `.bg-brand-gradient` is not a light-mode wash painted on a dark page. The canvas carries two very faint fixed brand washes; a flat fill is what made the app read as grey. Green is unchanged — `#3DB166`, still sampled from eng.sjp.ac.lk.
- **Bare form controls are styled at the element, not per input.** Roughly a hundred hand-rolled inputs across 18 files gave themselves a border and a radius and nothing else — no ground, no ink colour, no hover, no focus — so on the dark theme they were transparent boxes. One `@layer base` rule fixes all of them, and being `base` it still loses to any utility on a given input. Checkboxes and radios take `accent-color`; the scrollbar follows the theme.
- **`.data-table` carries the whole table treatment** — sunken eyebrow header, even row rhythm, full-row hover, tabular figures. Five tables had each drawn their own, so two on one screen never lined up.
- **Every raw Tailwind palette colour is gone from `src/pages`** — 9 files were using `amber-*` and `red-*`, which have no dark-mode counterpart and so vanished on the dark theme. `TimerWindowPage` keeps its own red/white: it is deliberately outside the token system.
- **Tailwind's default border colour now points at the `line` token.** Preflight paints every element with `borderColor.DEFAULT`, which ships as a light grey, so a `border` or `divide-y` written without a colour drew a pale rule that stayed pale on the dark theme — six lists were doing exactly that. The default is themed now, which makes an omitted colour correct rather than a leak. Verified in the built CSS: `border-color: rgb(var(--line) / 1)`, no unresolved `<alpha-value>`.
- **The last 11 hand-rolled buttons are gone.** Secondary actions across eight screens wrote their own border, padding and hover — each slightly different, none with a disabled cursor or the shared height. All are `Button variant="secondary" size="sm"` now. `grep` for a hand-rolled button in `src/pages` returns zero.
- **`PageHeader` gained an `eyebrow`** and a brand tick to the left of the title; 15 screens now name the section they belong to, so three near-identical "My courses" headings read as three different places. The department and academic year moved out of the badge row into the eyebrow on all three course layouts — a badge should carry something you might act on.
- **The guide is laid out as a document.** Gradient title block with the crest and the role switcher on its fold, a numbered spine down the steps, and the ten marking rules as a two-column grid instead of one divided list. **Not a word of `guideContent.ts` or `markingExplainer.ts` changed.**
- **Administrators no longer get a lecturer's profile.** `features/profiles/profileShape.ts` gives three shapes — student, academic, administrator. A System Admin or Super Admin was previously shown research areas, a publications list and a "Projects supervised" tab, none of which an account holding no course powers can ever have, and was badged "Lecturer". They now get identity and contact only. **The editor omits `interests` and `outputs` from the payload for them rather than sending empty arrays** — both lists are replace-all on the server, so sending them would wipe whatever is stored.
- **Not verified signed in.** The backend was running locally, but passwords are not typed into forms here. The shell, the guide and the primitives were checked in a throwaway Vite harness with a seeded store, then the harness was deleted; the sign-in and guest screens were checked directly. Behaviour is covered by the existing 59 tests, which were not modified.
- **Two measurement traps worth knowing** if you verify in the in-app browser: it does not composite frames, so any property with a CSS transition reads frozen at its old value — `getComputedStyle` will tell you dark mode did not apply when it did. Inject `*{transition:none!important}` before measuring.

**Hosted, plus a guide, a footer and the Super Admin screens, as of 2026-08-23 (committed, not pushed).** `tsc -b` + `vite build` + lint + `npm test` clean (**59 tests / 10 suites**). The SPA runs at `psems-foe-usj.tech`, talking to `api.psems-foe-usj.tech`. Backend half in `psems-backend/CLAUDE.md`.

- **A reload signed everyone out, and it would have done so on localhost too.** The access token is held in memory, so a reload starts with none, and `ProtectedRoute` redirected to the login page **before anything could use the refresh cookie** — so the cookie was only ever spent by the timer window, the one screen that called `bootstrapSession`. `useSessionRestore` now runs once at startup and the router renders a skeleton while that attempt is in flight, rather than reading "no token yet" as "signed out". `refreshAccessToken` sets the whole session, not just the token, because the router needs the user before it can route.
- **`VITE_API_BASE_URL` is compiled in, not read at runtime.** The first Vercel build had it unset, so the bundle carried no API address at all and every call went to the SPA's own origin, which answered `405`. Changing it needs a redeploy, not a restart.
- **`vercel.json` is required, not optional** — without the rewrite every deep link 404s, because `BrowserRouter` expects the server to serve `index.html` for any path.
- **The notifications popover only closed via the bell.** It now closes on an outside pointer-down and on Escape, which is what makes it feel like a popover rather than a trap.
- **Changing your own password was reachable from nowhere.** `ChangePasswordPage` already handled the voluntary case — it asks for the current password when the forced flag is not set — and the backend already accepted it. It only ever appeared through the forced-reset redirect. Now linked from your own profile.
- **`/forgot-password`** replaces the line that told people to go and ask someone. It posts to an unauthenticated endpoint and shows the same confirmation either way, so the screen cannot be used to discover which addresses have accounts.
- **`/guide`** is one page written per role, opening on the reader's own and switchable — the person looking up how a student does something is usually the coordinator being asked. It carries a **How marking works** section shown to every role, kept in step with `marks.service.ts`: the weighted mean (three markers at 50/25/25 all giving 80 produce 80, not 40), criterion → stage → course weighting, group versus per-student criteria, unscored criteria counting as zero, walk-in markers pooling into one capped contribution, grade bands, and per-stage reversible release. A student who cannot see how a figure was reached has no way to question it. Steps render a screenshot when one exists in `public/guide/` and plain text when it does not — **none exist yet**.
- **`SiteFooter`** sits under every signed-in screen carrying what the rail does not: the guide, the faculty site, and who the system belongs to. It deliberately does **not** repeat "My profile" or "Directory" — the shell test caught them as a second target for the same thing.
- **The Super Admin section** at `/super-admin`: administrators, accounts, password requests, audit log. Adding `SUPER_ADMIN` to the `Role` union made the compiler demand an entry in every `Record<Role, …>`, which is how the nav, the home redirect and the role labels were all found. A temporary password is shown once and never again, so `OneTimePassword` states that rather than using a toast that could be dismissed unread. Acting on your own account is hidden, matching the API's refusal.
- **`useDebounced`** extracted from `DirectoryPage`, which had hand-rolled it, and reused by the account search.


**Course visibility COMPLETE as of 2026-08-22 (uncommitted).** `tsc -b` + `vite build` + lint + `npm test` clean (**59 tests / 10 suites**). Backend half in `psems-backend/CLAUDE.md`.

- **The student's course list splits into Current and Past.** Archived courses are ones they took and finished; they stay readable but do not belong beside the work in front of them. Each card carries its batch.
- **`OtherBatches` on the same page** — a repeated student can see active courses for other batches by name and batch only, never contents, and ask to join one with a reason. Their request's state is shown back to them rather than leaving them wondering.
- **`CpiRoster.tsx`** on the coordinator's Setup tab: everyone in the batch with what they are doing, four counts led by **not started**, and the group flagged when it is over or under the target size. **A roster of zero says the batch is wrong** — which is the only way a mistyped batch surfaces, since the students would otherwise just see nothing and assume the course is not ready.
- **`CourseStatePanel.tsx`** — publish, archive, back to draft, each saying plainly who can see the course in that state.
- **Join requests** are approved or declined from the roster panel, with an optional note that reaches the student.
- **Create a course** now takes a batch, suggested from the ones already used in the department via a datalist. Typed free, normalised on the server — a fixed pattern would block a special or repeat intake, which is why `projectType` was freed from its enum in the first place.
- **Course settings** gained **pass mark** (with the line saying PSEMS will not tell the student) and **group size** (a guide, not a limit).
- **The CA sheet** highlights and counts students below the pass mark alongside the existing zero-total flag.
- **`StageWeights`** in `StageLiveSettings` — the credit split, editable after submissions until marks are aggregated, refusing to save unless the weights still total 100.
- **The student upload sample and description** carry the new `batch` column.

**Titles and shell layout COMPLETE as of 2026-08-17 (uncommitted).** `tsc -b` + `vite build` + lint + `npm test` clean (**46 tests / 7 suites**).

- **Collapsing the rail now widens the content.** `main` was `mx-auto max-w-content` — a fixed 72rem cap — so retracting the rail freed 11rem that `mx-auto` turned straight back into gutter, and the page looked identical. The cap now follows the rail: `max-w-content` (1152px) expanded, **`max-w-wide` (1376px)** collapsed, which on a 1440px screen means the content fills the space instead of leaving it blank. A cap still exists in both states — unbounded line length is why it was there.
- **`SectionHeader` added, and it is not a second `PageHeader`.** All three CPI sub-layouts (`CpiLayout`, `StudentCpiLayout`, `LecturerCpiLayout`) already render the page's `h1` with the course name plus the tab bar. The `PageHeader` I put on the student schedule and marks pages therefore produced **two `h1`s on one page**; both are `SectionHeader` now — an `h2`, and deliberately **no `useSetShellTitle`**, so the top bar keeps naming the course rather than flickering to the tab name and back to the role label when moving between tabs that do and do not set it.
- **`PageHeader` on the eight top-level pages that had no title**: student and lecturer course lists, coordinator course list, lecturer course discovery, all three admin screens, and edit-profile (which also gained a back control).
- **Jargon out of the UI.** The coordinator list said "Create a course instance (CPI)" and "My CPIs"; the rest of the app has always said courses.
- **`EnterCpiPage` rewritten** — the card row was a `<button onClick={navigate}>`, so a student could not open a course in a new tab. It is a `Link` now, and the page picked up the skeleton and empty state the earlier sweep missed because its loading text read "Loading your courses…".
- **17 of 20 remaining screens are titled by their layout or a titled `Card`** and were left alone; only `ReviewPage` and `CpiAllocation` genuinely had no heading, and both now do. `TimerWindowPage` stays bare on purpose — it is the projector.

**Navigation and screen-quality pass COMPLETE as of 2026-08-17 (uncommitted).** `tsc -b` + `vite build` + lint + `npm test` clean (**46 tests / 7 suites**).

- **Profile and the directory were rendering outside every layout.** `/profile/:userId`, `/profile/edit` and `/directory` sat as bare routes: no rail, no top bar, no page container, and **no way back** — while all three role rails link to `/directory`, so following that link dropped the reader out of the app. New `RoleShell` mounts them in the shell of whoever is signed in. The four role navs moved to one file; they were duplicated across four layouts and had already drifted (admin had no directory link at all). *(Since superseded by `workspaces.ts`, which keys the nav to a workspace rather than a role.)*
- **The rail header and the top bar now share a height.** The rail's brand block was `py-4` around a 36px crest (68px) against a `h-14` top bar, so their bottom borders drew two lines at different heights. Both are `h-14`; the crest is 32px.
- **`LinkButton`** added — a navigation that looks like a button but stays an anchor, so middle-click and open-in-new-tab keep working. Several pages had been hand-rolling the button classes onto a `Link`.
- **`PageHeader.back` no longer needs a destination.** Omit `to` and it steps back through history — a profile is reached from the directory, from a past project and from search, so a fixed target is wrong more often than right.
- **`Avatar`** added, with `initialsFrom` living in `lib/name.ts` beside `personName` rather than being exported from a component file (the fast-refresh rule again, fixed rather than silenced).
- **Profile** rebuilt: identity card with avatar, role badge and contact; tabs on the shared `Segmented` (so they are a real tablist — the tests moved from `role="button"` to `role="tab"`); one edit affordance instead of two, one of which was bare underlined text at the foot of the page.
- **Directory** rebuilt: **search debounced at 250ms** (it fired a request per keystroke), area filters as proper chips, a result count, avatars, and a four-card skeleton instead of one.
- **Schedule** rebuilt: it had no header at all, raw loading text, a hand-rolled empty state, hand-rolled cards, and the status printed as raw lowercase. Now grouped **Upcoming / Not yet timetabled / Completed**, with stat tiles led by the next session.
- **Marks** rebuilt: the pending stages were stated **three times** (a tile, an empty-state hint and a trailing paragraph) and the student's own mark twice. Stage breakdown is now a table with tabular numerals rather than a run-on list, since this is the one figure a student checks against a printed sheet.
- **The states sweep is finished.** The earlier pass matched exact wording and so missed 10 dashed-border empty states and 2 loading strings ("Loading pending lecturers…", "Loading stages…"). Now **zero** hand-rolled empty states, error blocks or loading text anywhere in `src/pages`.

**Phases 4 and 5 COMPLETE as of 2026-08-16 (uncommitted). The frontend plan is finished — all five phases.** `tsc -b` + `vite build` + `npm run lint` + `npm test` clean, **46 tests / 7 suites**.

- **One error voice.** 37 hand-rolled `bg-critical-50` blocks became zero; 31 `Notice` uses. `Notice` took an explicit `size` prop rather than accepting a className override, because `cn` plainly concatenates and `text-xs` against `text-sm` would have been decided by Tailwind's output order, not by intent. Inline status pills (late / overdue / deviation) became `Badge` — a pill is not a message.
- **One loading treatment.** Zero `Loading…` paragraphs left. `SkeletonCard` for a whole page; **`SkeletonText`** added for a panel that already has card chrome, so loading never nests a card inside a card.
- **Empty states carry a next step.** 22 uses, each written for its own screen rather than a generic "nothing here". `density="compact"` keeps the same voice inside dense panels.
- **Availability grid: arrow keys, Home and End.** Every cell stays tabbable, so Tab still escapes the grid — this is an addition, not a roving-tabindex replacement. Each cell gained an `aria-label` naming its date and slot; the visible text is only the status, so the grid used to read as "–, –, –". Three tests cover movement, edge clamping and the labels; the label test asserts the parts the component owns, not the runtime locale's date wording.
- **Projector view.** Clock scales with the viewport (`clamp(6rem, 20vw, 22rem)`). **Deliberately outside the theme** — always black, verified as black with the `dark` class both on and off — because the app's tokens describe a document on a white page. Controls fade after 4s idle and return on any input; Space starts/pauses and the arrows move between segments, which is what makes hiding them acceptable. `focus-within` restores them so a keyboard user never lands on an invisible button. Overrun rings the whole screen rather than only recolouring the numerals.
- **Two plan items were already satisfied** and the plan was stale: visible focus states, and the grid's "second cue" for free/maybe/busy — the cells always rendered the words, and the coordinator's heat grid always rendered a count. The real gap was arrow-key movement.

**Role-derived profiles COMPLETE as of 2026-08-16 (uncommitted).** The second half of Phase 3 in `FRONTEND_PLAN.md`; the directory was the first. `tsc` + `vite build` + lint + `npm test` clean (**43 tests / 7 files**).

- **Tabs come from the person, not from a fixed array.** `ProfilePage` rendered the same three — About / Research / Projects supervised — for everyone, so every student was shown two tabs that could only ever be empty. A lecturer now gets **About · Research · Projects supervised**; a student gets **About · Skills and interests · Projects done**.
- **A tab with nothing in it is hidden**, not shown blank. With one tab there is no choice to make, so the tab bar disappears entirely; with none, an `EmptyState` says so — and says what to do about it if the profile is your own.
- **The model did not change.** A student’s competition entry and a lecturer’s paper are both a `ResearchOutput`; only the words differ. `EditProfilePage` follows the same split, so a student is asked for "skills and interests" and "work and achievements" rather than research areas and publications, with placeholders to match.
- **"Edit my profile" only appears on your own profile.** It was previously shown on everyone’s, including profiles you cannot edit.
- `ProfilePage.test.tsx` covers all four cases: a student never sees a supervising tab, a lecturer gets lecturer wording, an empty tab is hidden, and an empty profile says so.

**Reachability pass COMPLETE as of 2026-08-16 (uncommitted).** Every backend route was cross-checked against every frontend call. Nine exported hooks had **zero importers** — nine features built, tested and reachable from no screen. All are wired now; **one unused hook remains and it was a duplicate, so it was deleted**. `tsc --noEmit` + `vite build` + lint + `npm test` clean (39 tests).

- **The walk-in mark share was the live defect.** `pooledSharePercent` could only be set by `POST /stages/:id/pooled-share`, which had no UI and — unlike `panelRules` and `timerSegments` — is **not** part of the config PUT, so there was no path to it from anywhere in the app. Aggregation reads `pooledSharePercent ?? 0`, so an invited industry judge could score, the coordinator could read the marks, and they contributed **exactly nothing, silently**. Now set from `StageLiveSettings`, with the unset state called out rather than left to be discovered.
- **`StageLiveSettings.tsx` carries everything that has to stay changeable once a course is running** — pooled share, panel composition (`PUT panel-rules`), stage name and score visibility (`PATCH /stages/:id`), and presentation segments (`PUT timer-segments`). These targeted endpoints were built in Wave 1 precisely because the replace-all config PUT **409s as soon as any submission exists**; none of them had a screen, so the answer to "restaff a panel on evaluation day" was that you could not.
- **Walk-in joining**, on the lecturer sessions page: a lecturer holding no seat on an open evaluation gets a join control with a role picker; one holding no seat on a closed one is told plainly that they cannot mark here. The scoring form is held closed without a seat rather than failing on submit.
- **Allocation reopen**, on the allocation panel, prompting for the reason the backend requires.
- **Removing a co-supervisor.** Inviting one was always possible; undoing it was not, so a mistaken invite stuck permanently.
- **`DirectoryPage`** at `/directory`, in all three role rails — browse people, filter by research area. `useProfileSearch` and `useResearchAreas` both existed and **nothing had ever called them**, so a student picking a supervisor had no way to search by subject, which is the entire reason interests are stored as tags rather than prose. This was Phase 3 of `FRONTEND_PLAN.md`; the directory half is now done, role-derived profile tabs are not.
- **Block layout** on scheduling: place every unplaced session back to back from a start time, with a slot length and gap. Clashes are reported, never blocked.
- Four endpoints still have no caller and are left deliberately: `GET /users/me` (the login response already carries it), `GET /courses/:cpiId/groups/:groupId`, `POST /sessions/:id/presentation-duration` (superseded by the segment timer, kept for manual entry), and `GET /profiles/areas`’ sibling paths. **No TODO or FIXME exists in either repo.**

**Course settings and coordinator information architecture COMPLETE as of 2026-08-16 (uncommitted).** This is Phase 2 of `FRONTEND_PLAN.md` plus the settings rebuild that prompted it. `tsc --noEmit` + `vite build` + lint + `npm test` clean (**39 tests / 6 files**). Backend half: one route, see `psems-backend/CLAUDE.md`.

- **The coordinator's course page is eight routes, not eleven stacked panels.** `/coordinator/:cpiId/{setup,ideas,selection,allocation,evaluation,submissions,schedule,marks}` under `CpiLayout`, each area linkable and bookmarkable. `/coordinator/:cpiId` redirects to `setup`, so every existing link still lands. `CpiDetailPage.tsx` is deleted; the timeline editor it carried is now `CpiTimelinePanel.tsx`.
- **Eight tabs, not the seven the plan sketched.** Submissions had been left out and belongs to its own two phases (`PROPOSAL_SUBMISSION` / `FINAL_SUBMISSION`) rather than to evaluation.
- **Tabs finally carry phase status.** `TabNav` had accepted a `status` prop since Phase 1 that nothing passed. `features/courses/phaseStatus.ts` derives it from the timeline the layout already fetches; a tab covering several phases takes the most active one, and a tab whose phases the course never enabled gets **no dot rather than a misleading one**. **The last day of a phase counts as open** — windows are stored as dates, so treating them as instants would shut people out a day early.
- **Course settings is preset-first.** `CourseSettingsPanel.tsx` (replaces `CpiPolicyPanel.tsx`) opens with the two presets and five folded groups; the group whose phase is running is expanded on arrival and badged. Clicking a preset **names the five settings it will write before writing them** and says the rest is untouched. The old panel was 15 checkboxes and 2 dropdowns in one flat card with nothing to say which mattered.
- **All six orphaned policy fields now have a control.** `allowLecturerIdeas`, `maxIdeasPerGroup`, `maxInterestsPerGroup`, `allowLecturerInterestInGroupIdeas`, `allowCoSupervisionInterest` and `caContributionPercent` were editable through the API and reachable from nowhere. **`caContributionPercent` was a live defect** — `MarksPage` reads it to show what a project contributes to its module, so with nothing able to set it that figure could never appear.
- **Number settings commit on blur**, not per keystroke; typing "10" must not first save a limit of 1. Blank means "no limit" (or "this course is the whole module" for the contribution field).
- **`components/PolicyNote.tsx` states the governing setting where it bites.** A student on the Ideas page reads "Only your group leader can post the group's idea" instead of pressing Post and getting a refusal they cannot explain. Read-only; the "Change in course settings" link renders **for coordinators only**. On seven screens across all three roles. Renders nothing when no line applies, rather than an empty heading.
- **Tests added:** `CourseSettingsPanel.test.tsx` (which group opens, preset named before applied, blur-not-keystroke saving), `PolicyNote.test.tsx`, `phaseStatus.test.ts`. `policyKey` is exported so tests seed the query cache instead of mocking transport.
- **Not verified in a browser.** The dev server picked the changes up and the app boots with no console errors, but reaching a coordinator screen needs a sign-in and passwords are not typed into forms here. Behaviour is covered by the tests above instead.
- Still open from the plan: profile tabs are role-independent (Phase 3), the projector view is unstyled (Phase 4), and states/polish are untouched (Phase 5). **Phone support is deliberately deferred.**

**Shell, theming and dashboard patterns COMPLETE as of 2026-08-16 (uncommitted).** `tsc -b` + `vite build` + `npm run lint` + `npm test` clean (24 tests). Design reference was **PES** (`pes-usj.vercel.app`), the faculty's student performance system — its 124-variable token layer was read directly off its stylesheet.

- **Tokens that flip are now CSS variables** holding raw RGB channels (`--canvas: 245 248 246`), so Tailwind's `/<alpha-value>` still works and `bg-line/60` keeps functioning. Shades that read correctly on either ground — solid button fills, accent borders, chart series — stay literal hex, which keeps the variable list to 18 rather than the whole palette.
- **Dark theme** on `.dark` (`darkMode: 'class'`). Ground is a green-tinted near-black (`#0E1512`), not pure black, so surfaces read as raised cards. Preference is light / dark / **system**, persisted, and `watchSystemTheme()` keeps following the OS while set to system rather than sampling it once at load. An inline script in `index.html` applies the class before first paint so a dark reload never flashes white.
- **PES-derived token upgrades:** radius up to `1rem` cards / `0.625rem` controls; slate-tinted (`#101828`) three-step elevation; **motion tokens** (`duration-fast|base|slow`, `ease-standard`), which did not exist before; a fixed five-colour **chart series** ready for analytics.
- **New primitives:** `StatTile` / `StatRow` (the 4-up metric row), `Segmented` (in-place view switch — use `TabNav` when the choice deserves a URL), and `Icon`, **8 inline SVGs rather than an icon package**.
- **Shell rebuilt:** collapsible rail (persisted; collapsed links keep their accessible name via `title`), page title + faculty subtitle in the top bar, theme toggle, and **global search** over courses and people. Search uses `useProfileSearch`, which already existed and **nothing had ever called** — no backend work was needed.
- **`PageHeader` registers its own title** into the top bar via `shellTitle.ts`, so pages get it for free; a non-string title falls back to the role name. Hooks live in a `.ts` file separate from the provider component, matching the `cellKey` fast-refresh fix rather than silencing the rule.
- **Stat tiles are wired in**, not just built: coordinator marks (groups, students, stages released, awaiting release — using the same stage-wins-over-course-wide rule as the backend), coordinator scheduling (sessions, placed, overdue, finalized), and the student marks page, which also gained a real header and empty state.
- `vitest` setup now polyfills **`matchMedia`** (jsdom ships none) and clears `localStorage` plus the `dark` class between tests.

**Design foundation COMPLETE as of 2026-08-16 (uncommitted).** `tsc -b` + `vite build` + `npm run lint` + `npm test` all clean (20 tests). This is Phase 1 of `FRONTEND_PLAN.md` — presentation only, no logic or route changes.

- **Tokens exist.** `tailwind.config.js` `theme.extend` was empty; it now carries the palette, type, radius and shadow scales. The brand green is `#3DB166`, sampled from the Faculty of Engineering site (eng.sjp.ac.lk) rather than invented, with a 50–950 scale around it. Neutrals are `ink` / `line` / `canvas` / `surface`; status colours (`positive` / `caution` / `critical` / `info`) are deliberately desaturated so the green stays the loudest thing on a screen. **Poppins** is the type family, also matching the faculty site.
- **`src/components/ui/`** holds the primitives: `Card`, `Button`, `Field` / `Select` / `Textarea`, `Badge`, `PageHeader`, `TabNav`, `EmptyState`, `Notice` / `ErrorText`, `Skeleton` / `SkeletonCard`. **45 hand-copied card divs and 69 hand-written button class strings are gone** — every card and button now comes from the primitive.
- **`components/layout/AppShell.tsx`** replaces four near-identical role headers. Light shell: white rail, brand-green active state, crest in the header, user + log out at the foot. `StudentLayout`, `LecturerLayout`, `CoordinatorLayout` and `AdminLayout` are each ~10 lines now. Below `lg` the rail's links move into the top bar rather than becoming unreachable.
- **The crest is finally used** — `src/assets/crest.png` in the shell, `public/crest.png` as the favicon. It had been sitting in `assets/`, outside `src/`, imported by nothing.
- **Focus is visible app-wide** — one `:focus-visible` ring in `index.css` rather than per-control opt-in.
- **`TimerWindowPage` is deliberately untouched.** It is the projector view on a black background, where the light-shell neutrals would destroy contrast. It gets its own pass in Phase 4.
- Still open from the plan: the coordinator's 11-panel page is still one scroll (Phase 2), profile tabs are still role-independent (Phase 3), and `TabNav` accepts a per-tab phase `status` that nothing passes yet — `CpiSummary` does not carry the timeline.


**Collaboration screens COMPLETE as of 2026-08-10 (uncommitted).** `tsc -b` + `vite build` clean. Matching backend notes in `psems-backend/CLAUDE.md`.

- New: `features/profiles/useProfiles.ts`, `features/courses/useSupervisorRequests.ts`; `pages/profile/ProfilePage.tsx` (About / Research / Projects-supervised tabs) and `EditProfilePage.tsx`; `pages/lecturer/DiscoverCoursesPage.tsx`; `pages/coordinator/CpiSupervisorRequests.tsx`.
- **Profiles are not role-gated** — `/profile/:userId` and `/profile/edit` sit outside every role layout, since a student reading a supervisor's profile and a lecturer reading a student's are the same page. "My profile" is linked from all three layout headers.
- `SelectionPage` **drops the rank picker** (interest is flat now) and gains a withdraw button per interest. `SupervisorSelectionPage` gains withdraw, "I'm interested" and "Offer to co-supervise".
- `LecturerIdeasPage` shows each idea's supervisor list with its invitation state (accepted / not yet accepted / declined) and lets the idea's own supervisor invite a co-supervisor.
- `CpiSessionPanels` gains a **per-stage "Apply to all groups"** block — the usual starting point, with per-session edits below it. It surfaces what the server kept and why, since anyone who already submitted marks is never removed.
- `GroupPage` gains "Continue without a group"; `LecturerApprovalPage` gains the lecturer CSV upload.
- **Course settings**: the toggles for co-supervisors, interest withdrawal, self-requests and individual participation are now live. Grading and availability remain disabled with a label saying what they wait on — a coordinator should never flip something that does nothing. *(Superseded 2026-08-16: availability was enabled once scheduling shipped, and the whole panel was rebuilt as `CourseSettingsPanel` — every setting is live now.)*

**Restructure Wave 1 COMPLETE as of 2026-08-09 (uncommitted).** `tsc -b` + `vite build` clean. Matching backend notes in `psems-backend/CLAUDE.md`; full plan in `PSEMS_Restructure_Plan.md`.

- New `features/policy/usePolicy.ts` (course settings), `features/panel/usePanel.ts` (session panels, guests, roles), `features/panel/useGuest.ts` (link-authenticated guest calls), `features/review/useReview.ts`. **`features/headjudge/` deleted** — review is no longer head-judge-specific.
- New screens: `pages/coordinator/CpiPolicyPanel.tsx` (every behavioural setting, grouped), `pages/coordinator/CpiSessionPanels.tsx` (per-session panel editor + guest invites), `pages/guest/GuestScoringPage.tsx`. Both coordinator panels are wired into `CpiDetailPage`.
- **`/guest?token=…` sits outside `ProtectedRoute` and every role layout** — the link is the credential. The issued link is shown once, on invite, with a warning: only its hash is stored server-side.
- `CpiEvaluationConfig` builds **panel rules** (role, min, max, mark-counting, open-to-all) instead of a single `evaluatorsRequired` number, plus per-stage score visibility. `LecturerSessionsPage` gained the **mandatory overall-comment box** (submit is disabled without it) and an amber banner when a stage's scores are open to the whole panel. `ReviewPage` shows overall comments, targets corrections by **panelist seat** rather than user id (so a guest with no account can be asked to revise), and carries the three manual actions: **Close scoring**, **Approve & finalize**, **Reopen**. It also shows per-role readiness (`3/2 evaluators`) as information — nothing advances by itself, so the reviewer decides when marking ends.
- `SessionStatus` union: `AWAITING_HEAD_JUDGE` → `AWAITING_REVIEW`.
- **Known gap at the time, fixed in Wave 4:** the frontend had no ESLint config, so `npm run lint` had never worked. Everything in this pass was verified by `tsc -b` + `vite build` only.
**Customizability pass COMPLETE as of 2026-07-25 (uncommitted).** Frontend for four new features (`tsc -b` + `vite build` clean): **(A)** create-CPI project type is a free-text input with a datalist of suggestions (`PROJECT_TYPE_SUGGESTIONS`), no longer a fixed dropdown; **(B)** idea revise/resubmit — student `IdeasPage` shows the revision note and an inline edit/resubmit form on their own idea; coordinator `CpiIdeasModeration` and supervisor `SupervisorSelectionPage` have a "Request revision" note+button (`useUpdateIdea`, `useRequestIdeaRevision`); **(C)** `LecturerSessionsPage` timer is now server-driven and polled (`useControlTimer`, `useSessions(cpiId, { refetchInterval: 3000 })`) so all evaluators share one live clock; **(D)** `CpiEvaluationConfig` has optional per-stage submission + scoring (execution) datetime windows, and `CpiDetailPage`'s timeline editor has per-phase enable checkboxes so a CPI can use any subset of phases. New hook exports: `useStudentCpis`/`useLecturerCpis`/`useCpiSummary`, `useUpdateIdea`/`useRequestIdeaRevision`, `useControlTimer`.

**No-UUID pass COMPLETE as of 2026-07-25 (uncommitted).** Removed every raw-UUID/id text input in the app — nothing requires typing an id anymore:
- **Student `EnterCpiPage`** and **lecturer `LecturerEnterCpiPage`** are now clickable course lists (new `useStudentCpis`/`useLecturerCpis` → `GET /courses/mine/student` [department + joined CPIs] and `/courses/mine/lecturer` [accepted supervisor + evaluator/HJ roles]). The lecturer page keeps the supervisor-invites card above the list.
- **`CpiAllocation`** override/assign: group + idea + supervisor **dropdowns** (allocation map now returns `ideas` and accepted `supervisors` with userId).
- **`CpiEvaluationConfig`** stage-evaluator assign: dropdown of the CPI evaluator pool (`useCpiDetail`; CPI-detail evaluators now carry `user.id`).
- **`ReviewPage`** request-correction: dropdown of the session's evaluators (review scores now include evaluator `id`).
- **`SelectionPage`** own-idea supervisor pick: dropdown of willing supervisors (selection supervisor refs now include `user.id`).
Verified: frontend `tsc -b` + `vite build` clean; backend `tsc`+lint clean, 38 tests/10 suites green.

**Restructure Wave 4 frontend COMPLETE as of 2026-08-16 (uncommitted).** What shipped:

- **`CpiMarks.tsx` rebuilt** from two buttons into the real screen: aggregate, a publish matrix (marks and comments, per stage and for the whole course, each switchable off), a grade-band editor, and the CA sheet with a **Download CSV** button and a print view. Zero-total rows are highlighted.
- **`features/marks/export.ts`** builds the CSV — a pure function, so it is unit-tested rather than click-tested. Uses a blob URL, not a data URL, since a full cohort exceeds what a URL may hold, and writes a BOM so Excel reads UTF-8 rather than guessing.
- **`MarksPage.tsx`** shows the student's own mark, the group's, and for a stage with per-student criteria the split between group work and their own. Stages not yet released are **named as pending** rather than hidden, and the CA contribution line says what share of the module this is worth. The old 403 handling is gone — the API returns 200 with an empty list now.
- **`CpiEvaluationConfig.tsx`** gained a whole group / per student selector on each criterion.
- **`LecturerSessionsPage.tsx`** scoring grid is keyed by criterion **and** student, so a per-student criterion renders one row per member. It warns when a stage is scored per student but the group has no accepted members.
- **Course settings**: the grading toggle is live. The "not active until X ships" marker is gone entirely — every setting on that screen now does something.

**Tooling added this pass (plan risk #4 is closed):**
- **ESLint now works.** There was no config at all, so `npm run lint` had never run. `eslint.config.js` is flat config with typescript-eslint and the React hooks rules; it is ESM because this package is `"type": "module"` (the backend's is CommonJS). The one warning it found was real — `cellKey` exported from a component file breaks fast refresh — and was fixed by moving it to `features/scheduling/useScheduling.ts` rather than silenced.
- **Vitest + Testing Library + jsdom.** `npm test` runs; `vitest.config.ts` is separate from `vite.config.ts` so build config stays free of test settings. 16 tests: the availability grid's click-cycling, read-only and summary modes, and the CSV export's escaping, weight row, blank handling and grade column.

**Restructure Wave 3 frontend COMPLETE as of 2026-08-16 (uncommitted).** `tsc -b` + `vite build` clean. What shipped:

- **`components/AvailabilityGrid.tsx`** - one component, two modes. Read-write for a lecturer (click a cell to cycle blank -> free -> maybe -> busy; a dropdown per cell would be unusable across a fortnight of slots), and a read-only heat grid for the coordinator showing a count per cell. **Blank is its own state**, distinct from busy: "has not answered" and "cannot make it" mean different things to someone deciding whether to wait.
- **`AvailabilityPage.tsx` rewritten** from two datetime boxes to the grid, with local edits saved in one replace-all call rather than a request per cell. The **Availability tab is no longer evaluator-only** - supervisors submit too now.
- **`CpiScheduling.tsx`** - grid builder (window + named day-parts), the coordinator heat grid with a "still to answer" list, per-session move controls prefilled from the current time, typed conflict warnings, and **"Find a slot everyone can make"**, which appears once a conflict has been seen and moves the group in one click.
- **`ScheduleSheetPanel.tsx`** - the printable handout (`No | Index Number | Name` per group, date, time range, venue header), printed from the app rather than published in it.
- **`pages/student/SchedulePage.tsx`** + Schedule tab + route - students could not see the schedule at all before.
- **`pages/lecturer/TimerWindowPage.tsx`** at `/timer/:cpiId/:sessionId` - chrome-free, for a second monitor: huge current-segment label, huge clock counting down and then up in red, segment list, controls. **It sits outside `ProtectedRoute` and every role layout on purpose**: `window.open` gives it a tab with no in-memory access token, so it mints its own via `bootstrapSession()` (`POST /auth/refresh`) from the shared httpOnly cookie. No cross-window token plumbing.
- **`features/scheduling/useTimer.ts`** - its own light polling hook, separate from `useSessions`. `LecturerSessionsPage` gained Previous / Next segment / Open timer window and a per-segment log with a hand-override for the verdict; `ReviewPage` shows the segment log read-only so time management is marked against real data.
- **`CpiEvaluationConfig.tsx`** gained a per-stage running-order editor (name + minutes). Leaving it empty runs one clock, which is the old behaviour.

**Verification here is now `tsc -b` + `vite build` + `npm run lint` + `npm test`.** ESLint and Vitest were added in Wave 4; before that neither existed.

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
