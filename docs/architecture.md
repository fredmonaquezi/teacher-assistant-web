# Class Notes Architecture

## Purpose

Class Notes is a React single-page application for a teacher's private classroom workflow. Supabase provides authentication and persistent data, React Query owns remote state in the browser, and React Router owns the active workspace route.

This document is the source of truth for code ownership after the six-phase refactor. The product boundary and smoke checklist remain in `docs/app-refactor-checklist.md`.

## Runtime boundaries

```text
main.jsx
  -> App.jsx                         public/authenticated boundary
     -> TeacherWorkspaceApp.jsx      router boundary
        -> TeacherWorkspaceShell     layout + active-class synchronization
           -> WorkspaceRoutes        lazy routes + page prop wiring
              -> pages/*             route-level presentation
                 -> features/*       controllers, models, actions, repositories
                    -> Supabase      authentication and persistent data
```

The shell may own only concerns shared by every workspace route: layout, routing, the signed-in user, active-class selection, and the compatibility composition performed by `useTeacherWorkspaceData`.

## Source ownership

| Path | Responsibility |
| --- | --- |
| `src/routing` | Route definitions, lazy page loading, and route-to-class synchronization. |
| `src/pages` | Route-level UI and event wiring. Pages do not build Supabase queries. |
| `src/features/<domain>` | Domain repositories, mutations, controllers, and pure models. |
| `src/features/shared` | Small query and mutation primitives used by more than one domain. |
| `src/components` | Reusable visual components with no route ownership. |
| `src/styles/core/foundation.css` | Canonical tokens, reset, shell, and shared primitives. |
| `src/styles` | Feature-owned CSS loaded by a route or component. |
| `src/dormant/running-records` | Preserved, inactive Running Records code; never imported by production routes. |
| `supabase/migrations` | Append-only database history. Frontend cleanup must not remove migrations or production data. |

## Server-state flow

1. A route activates only the domains returned by `getFeatureDomainsForPath`.
2. A feature hook calls its repository through `useFeatureQuery`.
3. The repository is the only layer that constructs Supabase read queries and returns rows plus domain-specific errors.
4. A feature action performs a write through `runMutation` or `runOptimisticMutation`.
5. Successful writes refresh or invalidate the owning React Query key. Failed optimistic writes restore their snapshot.
6. Pages receive data and commands; they do not duplicate server state in local component state.

React Query keys must include the signed-in user ID. This prevents one account's cached data from being reused after an account change.

## Local state

- Route-local form drafts and editor state belong to the owning page or feature controller.
- Active class selection is global workspace state and is persisted per user.
- Profile display preferences are local-only and stored in browser storage.
- Authentication state comes from Supabase Auth and is cleared together with the React Query cache on sign-out.

## Styling

There is one token/foundation layer. A route imports its own stylesheet so unused feature CSS does not enter the initial bundle. New shared rules belong in the foundation only when at least two active features genuinely use them; otherwise they stay with the owning feature.

## Testing strategy

- Node unit tests cover pure utilities.
- Vitest and Testing Library cover components, routes, feature controllers, repositories, and mutation failure behavior.
- Playwright smoke tests cover the public authentication entry and a signed-in teacher's critical data-loading and navigation path. Supabase is intercepted with deterministic fixtures; smoke tests never read or mutate production data.
- Migration policy checks enforce ordered, transactional, append-only migration files.

Run the complete local quality gate with:

```bash
npm run lint
npm test
npm run test:smoke
npm run build
npm run check:bundle
npm run check:migrations
```

GitHub Actions runs the same gates for pull requests and pushes to the main branches.

## Change rules

- Add a server read to the owning repository and expose it through the owning feature query hook.
- Add a server write to a feature action and cover both success and failure/rollback behavior.
- Add a route in `WorkspaceRoutes`; update `getFeatureDomainsForPath` when it activates a lazy domain.
- Keep pages presentational and avoid direct Supabase access from pages or shared visual components.
- Preserve dormant Running Records and all database migrations unless a separate product/data-retirement plan explicitly authorizes removal.
