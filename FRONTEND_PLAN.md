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

**The fix is not to delete it.** These settings genuinely are cross-cutting, and a coordinator setting up a course wants to see them together. Instead:

- Keep **one settings route**, but group the settings by lifecycle phase and mark which phase the course is currently in, so the relevant few stand out from the rest.
- **Surface the governing setting inline, read-only, where it takes effect** — the Ideas screen states "Only the group leader may post" with a link to change it. The setting stays in one place; its consequence becomes visible where the consequence lives.

### "The profile pages aren't the same for all"

They *are* all the same, and that is the bug. `ProfilePage.tsx` renders a fixed three-tab array — About / Research / Projects supervised — for every person. A student therefore always sees an empty **Research** tab and an empty **Projects supervised** tab.

**Fix:** derive the tabs from the person.

| | Tabs |
|---|---|
| Lecturer | About · Research · Projects supervised |
| Student | About · Skills and interests · Projects done |

A tab with nothing in it is hidden rather than shown empty. The underlying model does not change — `ResearchOutput` already covers a student's competition entries — only what is labelled and shown.

---

## The plan

### Phase 1 — Foundation

Design tokens and a small set of primitives. No behaviour changes; almost entirely mechanical, so it is safe to do first and everything after gets easier.

- Real tokens in `tailwind.config.js`: colour scale (including the crest's palette), spacing, radius, type scale
- Primitives in `src/components/ui/`: `Card`, `PageHeader`, `Button`, `Field`, `Select`, `Badge`, `EmptyState`, `ErrorText`, `Skeleton`
- Replace the 40 hand-copied card divs and the ad-hoc button classes
- Put the crest into `src/assets/` and into the app header

### Phase 2 — Information architecture

Split the coordinator's 11-panel page into routes that follow the lifecycle, so the page stops being one endless scroll and each area becomes linkable and bookmarkable.

```
/coordinator/:cpiId/setup        timeline · course settings · people
                   /ideas        moderation
                   /selection    interest and confirmations
                   /allocation   pairings
                   /evaluation   rubric config · panels
                   /schedule     availability · timetable
                   /marks        aggregate · publish · sheet
```

Each tab shows whether its phase is open, closed or not yet started — the timeline already knows this and the UI currently ignores it.

### Phase 3 — Profiles and the supervisor directory

- Role-derived tabs, as above
- A **supervisor directory** students can browse and filter by research area. `GET /profiles/search` and `GET /profiles/areas` already exist and **nothing calls them** — the search feature is built but unreachable.

### Phase 4 — Projector view only (phone support deferred)

**Decided 2026-08-16: no phone layout for now.** Evaluators mark on a laptop, so the app stays desktop-first and the one-breakpoint state is accepted rather than fixed.

What remains in scope is the **projector**: the timer window goes on a second monitor for a room to read, so it needs much larger type, high contrast and no chrome. That is one route, not a responsive pass over 44 pages.

Two consequences worth stating, so nobody is surprised later:

- An evaluator opening PSEMS on a phone will get a usable-but-cramped desktop layout, not a broken one — the pages are narrow (`max-w-4xl`) rather than wide.
- The availability grid and the scoring form are the two screens that would need real work if phones are ever wanted. Neither is blocked by anything in Phases 1–3, so this can be picked up later without rework.

### Phase 5 — States, then polish

- One loading treatment (skeletons), one empty-state component that says what to do next, error text in a single voice
- Visible focus states; keyboard navigation on the availability grid, which is currently mouse-only
- Status never conveyed by colour alone — the availability grid's free/maybe/busy needs a second cue

---

## Rough effort

| Phase | Effort |
|---|---|
| 1 — Foundation | 3–4 days |
| 2 — Information architecture | 3–4 days |
| 3 — Profiles and directory | 2 days |
| 4 — Projector view | 0.5 day |
| 5 — States and polish | 2–3 days |

**~2 weeks**, and it can stop after any phase with the app in a better state than before.

---

## What this plan does not do

- **No component library.** Tailwind plus a handful of local primitives is enough at this size; adding MUI or shadcn now means re-learning 44 pages.
- **No rewrite.** Every page keeps its logic. This is presentation, structure and consistency.
- **No new features.** The two exceptions are things already built and unreachable: the supervisor directory, and the crest.
