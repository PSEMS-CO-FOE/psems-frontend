# PSEMS Frontend — Design and Structure Plan

**Written 2026-08-16, after the full lifecycle became functional.**

---

## Why now

The frontend was built deliberately fast. The note in `CLAUDE.md` from July said it plainly:

> *"Prioritize breadth (a thin, ugly, working screen for every major flow) over depth... Styling/UX polish is explicitly Phase 2."*

That was the right call — six weeks of backend had no way to be clicked. Breadth is now finished: every part of the lifecycle works end to end. Phase 2 never happened, and the cost of that is measurable.

### What is actually there (measured, not estimated)

| | |
|---|---|
| Pages | 44 files, 6,656 lines |
| Shared components | **3** — and one is a notification bell, one is a test |
| `rounded-lg border bg-white p-4` hand-copied | **40 times** |
| Design tokens in `tailwind.config.js` | **none** — `theme.extend` is empty |
| Responsive breakpoints in the entire app | **1** |
| Pages hard-locked to `max-w-4xl` | 9 |
| Panels stacked on the coordinator's course page | **11**, one scroll |
| University crest | committed to `assets/`, outside `src/`, **imported by nothing** |

None of this is neglect. It is the debt that "breadth first" always creates, and it is now due.

---

## The two questions this plan answers

### "Why is there a Course settings screen?"

Because roughly two dozen rules had to be editable somewhere, and one stacked panel was the fastest way to expose them. It is wrong in two specific ways:

1. **It is a wall.** Fifteen checkboxes with nothing to say which of them matter during the phase the course is actually in.
2. **It is far from where it bites.** You tick *"Only the group leader posts the group's idea"* here, and discover what it did on the Ideas screen, days later.

**The fix is not to delete it.** These settings genuinely are cross-cutting, and a coordinator setting up a course wants to see them together. Instead — all three done, 2026-08-16:

- **One settings route**, with the settings grouped by lifecycle phase; the group whose phase is open is expanded on arrival and badged, and the rest stay folded. The screen opens as five headings rather than seventeen boxes.
- **Preset first.** `presetFor()` already seeded a policy at creation from Supervisor-led or Coordinator-managed, but nothing could re-apply one afterwards and only one of the two had an endpoint. `POST /courses/:id/preset` now takes either, names the five settings it will write before writing them, and leaves every other setting untouched.
- **The governing setting is echoed inline, read-only, where it takes effect** — `PolicyNote` states "Only your group leader can post the group's idea" on the Ideas screen, with a link to change it for coordinators only. The setting stays in one place; its consequence becomes visible where the consequence lives.

Six policy fields were editable through the API with **no control anywhere in the UI**: `allowLecturerIdeas`, `maxIdeasPerGroup`, `maxInterestsPerGroup`, `allowLecturerInterestInGroupIdeas`, `allowCoSupervisionInterest` and `caContributionPercent`. All six now have one. `caContributionPercent` was the live bug — the student marks page reads it to show what a project contributes to its module, so with nothing able to set it that figure could never appear.

### "The profile pages aren't the same for all"

They *are* all the same, and that is the bug. `ProfilePage.tsx` renders a fixed three-tab array — About / Research / Projects supervised — for every person. A student therefore always sees an empty **Research** tab and an empty **Projects supervised** tab.

**Fix — done 2026-08-16:** derive the tabs from the person.

| | Tabs |
|---|---|
| Lecturer | About · Research · Projects supervised |
| Student | About · Skills and interests · Projects done |

A tab with nothing in it is hidden rather than shown empty. The underlying model does not change — `ResearchOutput` already covers a student's competition entries — only what is labelled and shown.

---

## The plan

### Phase 1 — Foundation — **done, 2026-08-16**

Design tokens and a small set of primitives. No behaviour changes; almost entirely mechanical, so it is safe to do first and everything after gets easier.

- ~~Real tokens in `tailwind.config.js`~~ — palette, type, radius, shadow. Brand green is **`#3DB166`**, sampled from eng.sjp.ac.lk rather than invented; **Poppins** matches it too.
- ~~Primitives in `src/components/ui/`~~ — plus `TabNav`, `Textarea` and `Notice`.
- ~~Replace the hand-copied card divs and the ad-hoc button classes~~ — 45 cards and 69 buttons, all now from the primitives.
- ~~Put the crest into `src/assets/` and into the app header~~ — and `public/crest.png` as the favicon.
- Added beyond the original list: one `AppShell` behind all four role layouts (the plan had not noticed they were four copies of the same header), and an app-wide `:focus-visible` ring.

The count in the table above had drifted by the time the work started: 52 occurrences of the card class, not 40.

### Phase 2 — Information architecture — **done, 2026-08-16**

The coordinator's 11-panel page is now routes that follow the lifecycle, so it is no longer one endless scroll and each area is linkable and bookmarkable.

```
/coordinator/:cpiId/setup        course settings · timeline · people
                   /ideas        moderation
                   /selection    interest · confirmations · supervisor requests
                   /allocation   pairings
                   /evaluation   rubric config · panels
                   /submissions  every group's stage uploads
                   /schedule     availability · timetable
                   /marks        aggregate · publish · sheet
```

Eight tabs, not the seven planned: submissions had been left out of the sketch and belongs to its own pair of phases rather than to evaluation.

Each tab carries a dot for whether its phase is open, closed or not yet started — the timeline always knew this and the UI ignored it. `statusOfPhases` derives it, and treats the last day of a phase as still open, since the windows are stored as dates. `/coordinator/:cpiId` redirects to `setup`, so existing links keep working.

### Phase 3 — Profiles and the supervisor directory — **done, 2026-08-16**

- ~~Role-derived tabs~~ — a lecturer gets About · Research · Projects supervised, a student gets About · Skills and interests · Projects done. An empty tab is hidden; one tab shows no bar; no tabs shows an empty state. The backend needed `ownProjects` for this — `supervisedProjects` reads the `Lecturer` row and was always empty for a student, which is what made the old tab permanently blank.
- ~~A **supervisor directory**~~ — `/directory`, in all three role rails, filterable by research area. `GET /profiles/search` and `GET /profiles/areas` had existed since Wave 2 and **nothing had ever called them**.
- Added beyond the original list: `EditProfilePage` uses the same role-aware wording, and "Edit my profile" now only appears on your own profile rather than on everyone’s.

### Phase 4 — Projector view only (phone support deferred) — **done, 2026-08-16**

**Decided 2026-08-16: no phone layout for now.** Evaluators mark on a laptop, so the app stays desktop-first and the one-breakpoint state is accepted rather than fixed.

The **projector** is done. The timer window sits on a second monitor for a room to read, so:

- Type scales with the viewport (`clamp(6rem, 20vw, 22rem)` on the clock) rather than a fixed size, since a projector is not a laptop.
- It is **deliberately outside the light/dark theme** — always black, always maximum contrast. The app's tokens describe a document on a white page, which is the wrong instrument here. Verified: the ground stays black with the theme class both on and off.
- **No chrome, but still driveable.** The controls fade out after four seconds idle and return on any input, the way a video player does it. Space starts and pauses, arrows move between segments — driving it from the keyboard is what lets the buttons hide at all. `focus-within` brings them back, so a keyboard user never lands on an invisible button.
- Overrun takes the **whole screen** (an inset red ring), not just the numerals, because a colour change on one number is easy to miss from the back row.

Two consequences worth stating, so nobody is surprised later:

- An evaluator opening PSEMS on a phone will get a usable-but-cramped desktop layout, not a broken one — the pages are narrow (`max-w-4xl`) rather than wide.
- The availability grid and the scoring form are the two screens that would need real work if phones are ever wanted. Neither is blocked by anything in Phases 1–3, so this can be picked up later without rework.

### Phase 5 — States, then polish — **done, 2026-08-16**

- One loading treatment. `Loading…` paragraphs went from 13 to zero: `SkeletonCard` for a page, `SkeletonText` for a panel that already has its own card chrome.
- One empty-state component **that says what to do next** — the hint is the point, not the box. 22 uses, each written for its context ("Press Aggregate once every panel has finished scoring"), and `density="compact"` so a dense panel gets the same voice without a second dashed card.
- Error text in a single voice: **37 hand-rolled `bg-critical-50` blocks became zero**, 31 `Notice` uses. `Notice` gained an explicit `size` prop rather than a className override, because `cn` concatenates and two type-scale classes would have collided unpredictably. Inline status pills ("late", "overdue", "deviation") became `Badge` instead — a different concern from a message.
- Visible focus states — one `:focus-visible` ring applied once in `index.css`, rather than every control opting in.
- **Keyboard navigation on the availability grid.** Arrow keys, Home and End move between cells; every cell stays tabbable so Tab still escapes the grid. Each cell also gained an `aria-label` naming its date and slot — the visible text is only the status, so the grid previously read as "–, –, –" to a screen reader.

**Two items in this list were already satisfied when the work started**, and the plan was stale on them: focus states, and the grid's second cue. The editable cells already render the words *Free / Maybe / Busy*, and the coordinator's heat grid already renders a count. Neither was colour-alone. What was actually missing was arrow-key movement, not a second cue.

---

## Rough effort

| Phase | Effort |
|---|---|
| 1 — Foundation | ~~3–4 days~~ done |
| 2 — Information architecture | ~~3–4 days~~ done |
| 3 — Profiles and directory | ~~2 days~~ done |
| 4 — Projector view | ~~0.5 day~~ done |
| 5 — States and polish | ~~2–3 days~~ done |

**All five phases are done as of 2026-08-16.**

---

## What this plan does not do

- **No component library.** Tailwind plus a handful of local primitives is enough at this size; adding MUI or shadcn now means re-learning 44 pages.
- **No rewrite.** Every page keeps its logic. This is presentation, structure and consistency.
- **No new features.** The two exceptions are things already built and unreachable: the supervisor directory, and the crest.

---

## After the plan — the 2026-08-25 interface pass

All five phases were done. Running the system in production with real people showed the
polish had gone on evenly rather than where it was needed, so a second pass landed:

- **Grounds and separation.** The canvas was two percent off white, so a white card on it had
  no edge and every panel ran into the next. Four grounds now sit far enough apart to be told
  apart at a glance, on a **sage** tint rather than a green wash — a green page left nothing
  for the green to mean, and flat grey had no relationship to the brand and clashed with the
  white rail. Measured: page-to-card **1.30:1** light, **1.28:1** dark.
- **The evaluation screen.** About fifteen hundred lines of controls on one scroll. Now three
  areas, one stage open at a time, one area of that stage at a time, with weights shown as
  meters beside the fields that set them and stages reorderable.
- **New primitives** — `Disclosure`, `Meter`, `InfoTip`. The fold pattern had been written by
  hand twice and had already drifted.
- **Real bugs the pass surfaced**, each fixed at the root rather than the call site: every
  "Remove" in the app was invisible because two `text-*` classes collided and Tailwind's output
  order picked the grey one; `divide-y` with no colour fell back to a grey that ignored the
  theme, so the default border colour now points at the token; `Card`'s `space-y` was applied to
  its outer section while children render inside a padded div, so Scheduling and Marks stacked
  flush.
- **Role-aware profiles.** An administrator is no longer asked for research areas, and a student
  is no longer asked for a designation.
- **A guide that cannot drift.** The text behind each consequential button lives in
  `pages/guide/guideActions.ts` and drives both the in-app reference and the round "i" beside
  the control.

**Still open:** none of this has been verified signed in by the person who wrote it — passwords
are not typed into forms in that workflow — so it rests on typecheck, lint, build, tests and DOM
measurement in a throwaway harness. A click-through by a real user is the outstanding step.
