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
- `AsyncTaskRepository` — a thin async wrapper (`list`/`get`/`transition` return Promises). During integration, point its `repo` field at an `ApiTaskService` instance and any page already awaiting it keeps working unchanged.

`pages/my-tasks.js` is the original **reference implementation** of a migrated page. All five workspace pages (Dashboard, My Tasks, Team Board, Review Queue, Closing Calendar) now follow the same shape: render a loading skeleton (`pageSkeleton` in `ui/shared.js`), `await AsyncTaskRepository.list()`, render the view on success, and render a notice + retry button (`pageErrorState`) on failure. Each page has a `requestId` guard that discards stale responses when the user navigates/filters before a fetch resolves.

Currently these pages await the fetch and then still read from the synchronous `state` cache to render (initial-load migration). The remaining integration step is to make the **mutations** (transitions, checklist toggles, bulk edits, create/update) go through `AsyncTaskRepository`/`ApiTaskService` too, then retire `LocalTaskService`.

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
