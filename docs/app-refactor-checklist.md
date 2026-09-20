# App Refactor Plan and Checklist

## Objective

Refactor the current Class Notes product into focused feature modules without changing user-visible behavior or database data.

The old goal of splitting `src/App.jsx` is complete. The current refactor target is the workspace data layer, route composition, active page boundaries, and global CSS.

## Canonical Product Boundary

### Active product

- Public Teacher Codex landing page.
- Authentication, password recovery, profile, and local preferences.
- Teacher home.
- Classes, class subjects, rosters, class journal entries, and student profiles.
- Activity assessments and their student-profile history.
- Attendance sessions and attendance entries.
- Group generation and separation rules.
- Random picker and custom rotations.
- Useful links.

These routes are canonical:

| Route | Feature |
| --- | --- |
| `/` | Teacher home |
| `/classes` | Class list |
| `/classes/:classId` | Class detail and roster |
| `/classes/:classId/assess-activity` | New activity assessment |
| `/classes/:classId/assess-activity/:activityAssessmentId` | Existing activity assessment |
| `/attendance` | Attendance sessions |
| `/attendance/:sessionId` | Attendance session detail |
| `/groups` | Group generator |
| `/random` | Random picker |
| `/students/:studentId` | Student profile |
| `/useful-links` | Useful links |
| `/profile` | Account and preferences |

### Retained for possible return

- Running Records is not an active route, but its implementation and database data should be preserved until a future product decision.
- During Phase 1, move it behind a clear dormant/legacy boundary so it does not complicate or inflate the active application.

### Retired and approved for removal

- Traditional assessments and assessment detail pages.
- Units and standalone subject detail pages. Class subject management remains active.
- Rubrics and rubric-based development tracking.
- Calendar and diary pages.
- Classroom timer.
- Superseded dashboard, class, class-detail, and student-detail pages.

Do not delete database migrations or production data as part of the frontend refactor. Database retirement requires a separate, explicit plan.

Group generation currently reads historical traditional-assessment data. Phase 1 must decouple that dependency deliberately, preserving current grouping behavior until activity-assessment or academic-profile inputs replace it.

## Refactor Phases

### Phase 0 — Baseline and product boundary

- [x] Record the canonical active routes.
- [x] Classify dormant and retired features.
- [x] Update the smoke checklist to match the active product.
- [x] Add focused coverage for the attendance-list create/open workflow.
- [x] Run and record lint, unit/UI tests, production build, and bundle checks.
- [x] Keep the working tree stable while collecting baseline numbers.

#### Phase 0 baseline — 2026-09-09

Environment: Node 24.13.1 and npm 11.8.0.

| Check | Result | Notes |
| --- | --- | --- |
| Node unit tests | Pass | 12 tests passed. |
| Targeted UI test | Pass | The existing class-editing route test passed twice in 1.21 seconds before host contention began. |
| Full UI suite | Blocked | Vitest workers later timed out before transform/setup/import. Both thread and fork pools were affected, including the previously passing test, so no application assertion failed. Rerun when the host is no longer resource-constrained. |
| ESLint | Blocked | A targeted `App.jsx` lint passed in 0.49 seconds; later full and targeted runs stopped making progress under the same host contention and were interrupted. Rerun before Phase 1. |
| Production build | Pass | 549 modules transformed; build completed in 2m 24s while the host was resource-constrained. |
| Bundle check | Expected fail | Initial JS is 460.1 KiB. Largest CSS is 187.0 KiB against a 175.8 KiB limit. CSS cleanup is a defined refactor target. |

The environment stabilized during Phase 1 validation; the full lint and UI suites now complete successfully.

### Phase 1 — Remove or quarantine inactive functionality

- [x] Remove retired frontend pages, tests, actions, translations, and feature styles from the active source tree.
- [x] Quarantine Running Records as dormant functionality.
- [x] Preserve database migrations and data.
- [x] Decouple Groups from retired traditional-assessment UI and domain code.
- [x] Remove inactive feature code from the production dependency graph.

#### Phase 1 result — 2026-09-09

- Running Records now lives under `src/dormant/running-records` with its UI test and standalone reader. It is not imported by the active application.
- Active subject reads use a dedicated subjects domain; class, student, and group routes no longer fetch traditional assessments, units, or Running Records.
- Group academic profiles now use Activity Assessment outcomes and teacher overrides only.
- Retired pages, frontend actions/readers, tests, translations, default rubric catalogs, calendar/timer code, and feature-only CSS were removed. Supabase migrations were unchanged.
- ESLint passes.
- Node unit tests pass: 7 tests.
- Full UI suite passes: 107 tests across 29 files (single-worker validation was used to avoid the Phase 0 host contention).
- Production build passes: 541 modules transformed in 0.82 seconds.
- Bundle check passes: initial JS 460.0 KiB; largest CSS 169.5 KiB, down from 187.0 KiB.

### Phase 2 — Feature-oriented data layer

- [x] Make React Query the single source of truth for server state.
- [x] Replace the workspace-wide read/action hooks with feature query and mutation hooks.
- [x] Move form state and errors into the route or feature that owns them.
- [x] Move direct page-level Supabase persistence into domain repositories.
- [x] Refactor one active feature per reversible change.

#### Phase 2 result — 2026-09-09

- Active data code is organized under `src/features` by classroom, subjects, attendance, groups, random picker, useful links, students, activity assessments, profile, and auth.
- Route-aware feature hooks own React Query reads, mutations, cache updates, local forms, and feature errors. Only classroom data loads globally; route-specific domains load when their owning route is active.
- `useTeacherWorkspaceData` is now a thin compatibility composer for route props. The former workspace-wide readers and actions were removed.
- Class journals, student notes, activity history/editing, profile updates, and authentication no longer build Supabase queries inside UI components; repositories own those persistence details.
- Deep-linked class and student pages distinguish pending classroom data from genuine not-found states.
- ESLint passes.
- Node unit tests pass: 7 tests.
- Full UI suite passes: 107 tests across 29 files.
- Production build passes: 552 modules transformed in 0.84 seconds.
- Bundle check passes: initial JS 462.9 KiB; largest CSS 169.5 KiB.

### Phase 3 — Application shell and routes

- [x] Extract route configuration from `TeacherWorkspaceApp`.
- [x] Isolate active-class route synchronization.
- [x] Remove the unused workspace context.
- [x] Keep only authentication, routing, layout, and truly global selection state in the shell.

#### Phase 3 result — 2026-09-10

- `TeacherWorkspaceApp` is now a 14-line router boundary; layout and global class selection composition live in `TeacherWorkspaceShell`.
- Lazy page imports, route definitions, route fallbacks, and page prop wiring live in `src/routing/WorkspaceRoutes.jsx`.
- Route-to-class resolution and synchronization live in dedicated routing modules, including class, student, attendance, and `classId` query-string routes.
- The unused workspace provider, context object, and selector hooks were removed after confirming there were no consumers.
- Focused shell and route synchronization coverage passes: 13 tests across 3 files.
- ESLint passes.
- Node unit tests pass: 7 tests.
- Full UI suite passes: 116 tests across 30 files.
- Production build passes: 565 modules transformed in 8.82 seconds.
- Bundle check passes: initial JS 462.9 KiB; largest CSS 169.5 KiB.

### Phase 4 — Active page decomposition

- [x] Activity Assessment.
- [x] Groups.
- [x] Random Picker.
- [x] Useful Links.
- [x] Student Profile.

Separate domain calculations, editor/form state, persistence controllers, and presentational sections.

#### Phase 4 result — 2026-09-09

- Each target page now delegates derived data, editor/form state, and async workflow coordination to a feature-owned controller hook.
- Pure display/domain helpers were extracted into feature models for activity assessments, groups, random picker, student profiles, and useful links.
- Route pages are presentation boundaries and no longer own React Query, mutation, or persistence orchestration.
- The five page files were reduced from 2,471 to 1,541 lines while keeping the existing UI structure and route contracts intact.
- Focused Phase 4 UI coverage passes: 21 tests across the five target page suites.
- ESLint passes.
- Node unit tests pass: 7 tests.
- Full UI suite passes: 107 tests across 29 files.
- Production build passes: 561 modules transformed in 0.78 seconds after host contention cleared.
- Bundle check passes: initial JS 462.9 KiB; largest CSS 169.5 KiB.

### Phase 5 — CSS consolidation

- [x] Establish one canonical token and foundation layer.
- [x] Fold notebook, Apple, and Ocean overrides into owned component/feature styles.
- [x] Load feature CSS with its route.
- [x] Remove inactive selectors and reduce `!important` usage.
- [x] Restore a passing bundle-size check with useful headroom.

#### Phase 5 result — 2026-09-10

- Design tokens now have one canonical `:root` definition in `src/styles/core/foundation.css`; the sequential notebook, Apple, and Ocean redesign layers were removed.
- Shared shell and primitive rules remain in the foundation, while home, classes, activity assessments, attendance, groups, random picker, student profile, useful links, profile, authentication, and English meter styles load from their owning page or component.
- The two catch-all page stylesheets were removed, and 570 rules used only by retired frontend features were discarded during the ownership migration.
- `!important` usage fell from 102 declarations to 32; the remaining declarations cover final theme accents, focused feature exceptions, and reduced-motion guarantees.
- Global application CSS fell from 169.5 KiB to 26.2 KiB. The largest route CSS chunk is 29.3 KiB, providing substantial headroom under the existing bundle limit.
- ESLint passes.
- Node unit tests pass: 7 tests.
- Full UI suite passes: 116 tests across 30 files.
- Production build passes: 570 modules transformed in 12.72 seconds.
- Bundle check passes: initial JS remains 462.9 KiB; largest CSS is 29.3 KiB.

### Phase 6 — Hardening

- [x] Add query/repository and mutation failure-path tests.
- [x] Add browser smoke coverage for critical teacher workflows.
- [x] Update architecture documentation.
- [x] Enforce lint, test, build, bundle, and migration checks in CI.

#### Phase 6 result — 2026-09-18

- Shared query and mutation contracts now cover repository errors, fallback messages, failed refreshes, and optimistic rollback. Repository coverage verifies partial failures and the legacy student-schema fallback.
- Playwright smoke coverage runs in desktop Chrome against an isolated Vite server. It verifies the public sign-in entry and a signed-in teacher loading an active class and navigating to Attendance; deterministic request fixtures ensure it never reads or writes production Supabase data.
- `docs/architecture.md` records the runtime boundaries, source ownership, server-state flow, styling rules, test layers, and change rules established by the refactor.
- Pull requests and main-branch pushes enforce lint, unit/UI tests, browser smoke tests, production build, bundle limits, the production dependency audit, and migration policy checks.
- ESLint passes.
- Node unit tests pass: 7 tests.
- Full UI suite passes: 128 tests across 33 files, including 11 new failure-path tests.
- Browser smoke suite passes: 2 tests.
- Production build passes: 570 modules transformed in 0.86 seconds.
- Bundle check passes: initial JS is 462.9 KiB; largest CSS is 29.3 KiB.
- Migration policy check passes for all 19 migration files.
- The configured high-severity production audit gate passes; npm currently reports three moderate React Router dependency advisories.

## Working Rules

- Keep changes small and reversible.
- Separate code movement from behavior changes.
- Refactor one vertical feature at a time.
- Do not combine frontend cleanup with destructive database changes.
- Run the quality gates after each change.

## Quality Gates

```bash
npm run lint
npm test
npm run build
npm run check:bundle
```

## Active Product Smoke Checklist

- Landing and auth:
  - Public landing renders.
  - Sign in, password recovery, and sign out work.
- Home and navigation:
  - Teacher home renders.
  - Sidebar and active-class navigation reach every active tool.
- Classes:
  - List, create, edit, and delete a class.
  - Open class detail and manage subjects.
  - Add a student and open the student profile.
  - Add and delete a class journal entry.
- Activity assessments:
  - Create an activity assessment.
  - Edit an existing activity assessment.
  - Confirm history appears on class and student profiles.
- Attendance:
  - List attendance sessions.
  - Create or open a session.
  - Update a student's attendance status and note.
- Groups:
  - Generate groups.
  - Add and remove a separation rule.
  - Update a student's academic profile.
- Random picker:
  - Pick and reset students.
  - Create/delete a custom rotation.
- Useful links:
  - Create, edit, reorder, open, and delete a link.
- Profile:
  - Update account information and password.
  - Save date, time, activity-assessment, and English-meter preferences.

## Rollback Plan

- Revert the smallest failing refactor change.
- Re-run all quality gates and the relevant smoke workflow.
- Re-apply the extraction using a smaller feature boundary.
