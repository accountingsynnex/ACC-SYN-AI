# Frontend Architecture

## Design goal

Preserve the approved standalone prototype while giving the backend team clear code ownership and migration boundaries. This is intentionally framework-free so the team can either connect it directly or port the pages into React, Vue, Angular or another internal stack.

## Script loading model

The application uses ordered classic scripts. This keeps the existing shared lexical bindings working without bundling. `index.html` is the source of truth for dependency order.

| Area | File | Responsibility |
|---|---|---|
| Core | `core/constants.js` | status definitions, routes, theme state and shared utilities |
| Data | `data/local-state.js` | seeded demo data, localStorage and master data synchronization |
| Domain | `domain/task-service.js` | client-side permission helpers, workflow targets and LocalTaskService |
| Shared UI | `ui/shared.js` | shell rendering, reusable table/chip helpers and common dialogs |
| Task detail | `ui/task-detail.js` | drawer, checklist, files and task editor |
| Pages | `pages/*.js` | one workspace per file |
| Runtime | `ui/runtime.js` | notifications, selects, scrolling, diagnostics and bootstrap |
| Backend adapter | `services/api-task-service.js` | asynchronous API repository matching `docs/OPENAPI.yaml` |

## Async repository boundary

`domain/task-service.js` exposes two repositories:

- `TaskService` — the synchronous `LocalTaskService` the legacy pages still read from directly.
- `AsyncTaskRepository` — a thin async wrapper (`list`/`get`/`transition`/`updateChecklistItem` return
  Promises). During integration, point its `repo` field at an `ApiTaskService` instance and any page
  or mutation already going through it keeps working unchanged.

All five workspace pages (Dashboard, My Tasks, Team Board, Review Queue, Closing Calendar) load through
one shared helper, `renderAsyncPage(root, requestKey, eyebrow, title, onReady)` in `ui/shared.js`. It
owns the loading skeleton (`pageSkeleton`), the `await AsyncTaskRepository.list()`, the stale-response
guard (keyed by `requestKey`, so a slower fetch from a page the user has since navigated away from
never overwrites what's on screen), and the error/retry state (`pageErrorState`). Each page's
`renderX(root)` is a one-line call into this helper — **do not** re-implement the request-id/skeleton/
retry boilerplate inside a page file; add to `renderAsyncPage` itself if the shared shape needs to
change.

The two kanban boards (My Tasks board view, Team Board) similarly share one renderer,
`renderBoardColumns(tasks, { withLoadMore, showTeamOnCard, scrollLabel })` in `ui/shared.js` — the
per-status columns, cards, empty state and horizontal-scroll wrapper are identical between the two;
only pagination ("load more" chip) and whether the team chip shows on each card differ.

Async mutations follow the same rule: route user-triggered writes (workflow transitions, checklist
updates) through `runAsyncAction(triggerElement, () => AsyncTaskRepository.xyz(...), { onConflict })`
in `ui/shared.js`, not by mutating local state directly. It disables the trigger while the call is in
flight, reverts optimistic UI on failure, and routes an HTTP 409 to a blocking "reload the task"
dialog (`showConflictModal`, `#conflictModal` in `index.html`) instead of a generic error toast. See
`ui/task-detail.js` for the reference wiring on checklist items and transition buttons.

The pages currently still read from the synchronous `state` cache to render each view (initial-load
migration only). The remaining integration step is to move the other mutations (bulk edits,
create/update, master data, annual tasks) through `AsyncTaskRepository`/`ApiTaskService` +
`runAsyncAction` the same way, then retire `LocalTaskService`.

## Backend migration path

1. Implement authentication and `GET /me`.
2. Hydrate a client cache from `GET /tasks` and master-data endpoints.
3. Replace LocalTaskService mutations one feature at a time with `ApiTaskService` calls.
4. Add loading, empty, retry and field-error states around each migrated page.
5. Remove the demonstration role selector when real identity is available.
6. Move all authorization and workflow decisions to the server; keep browser checks for guidance only.
7. Add end-to-end tests before consolidating the remaining historical CSS cascade.

## Coding rules for new work

- Do not append versioned patch blocks.
- Keep dark-theme changes in `theme-dark.css`.
- Add API calls only through a service/repository, never directly inside render functions.
- Treat every API field as untrusted input and escape text before HTML insertion.
- Use server-provided IDs and concurrency tokens.
- Return structured error codes and field errors from the API.
