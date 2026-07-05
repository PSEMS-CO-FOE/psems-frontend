# PSEMS Frontend — Context for Claude Code

## What this is
Frontend for PSEMS (Project Scoring, Evaluation & Management System) — a CO3554 university project that must launch as a **real single-department faculty pilot by end of September 2026**. Full spec in `docs/` (`PSEMS_Comprehensive_Specification_v2.docx` for full detail — 7 roles, 12-step CPI lifecycle, ML features; `PSEMS_Delivery_Roadmap.md` for the week-by-week build plan).

## Stack
React 18 + TypeScript + Vite, Tailwind CSS, TanStack Query (server state), Zustand (lightweight global state — session/notifications), React Hook Form + Zod validation, Chart.js/Recharts for analytics, React Router.

## Repo layout reality
One of **four separate repos** (polyrepo): `psems-backend`, `psems-frontend` (this repo), `psems-ml-service`, `psems-infra`. Backend is a modular monolith exposing a REST API — this frontend is a pure API consumer, no direct DB or ML access. `VITE_API_BASE_URL` in `.env` points at the backend.

## Critical UI constraint
This platform has **7 distinct roles** (Super Admin, System Admin, Course Coordinator, Supervisor, Evaluator, Head Judge, Student) each with different dashboards and visibility rules — e.g., students must never see other groups' ideas or unpublished marks, evaluators must never see other evaluators' scores before Head Judge review. The backend enforces this server-side, but the frontend must not leak restricted data via over-fetching or client-side state that outlives a role switch. Given solo development, favor a shared, table/form-driven component approach over bespoke designs per screen — there isn't time for 7 custom-designed dashboards.

## Build approach — vertical slices, not "all backend then all frontend"
The roadmap builds one lifecycle module per week, backend + minimal working UI together, so there's always a demoable slice rather than a frontend backlog. Don't get ahead of backend modules that don't exist yet — check `docs/PSEMS_Delivery_Roadmap.md` for what's actually been built before assuming an API endpoint exists.

## How the developer wants to work
Building this hands-on specifically to learn the stack (most of this — TanStack Query, Zustand, this scale of RBAC-aware frontend — is new to them). Explain reasoning and let them drive implementation rather than silently generating large chunks of UI code.

## Current phase
Not started yet as of 2026-07-06 — waiting on backend's first CPI/auth modules (Weeks 1–4 of the roadmap) before there's a real API to build against. Scaffolding the Vite project itself can happen anytime.
