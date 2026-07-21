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
| AI review adapter | `services/ai-review-service.js` | client for the separate task-board-worker AI file-review endpoint |

## AI file review (task-board-worker)

[`task-board-worker`](https://github.com/accountingsynnex/task-board-worker) is a separate
Cloudflare Worker (its own repo) that compares a submitted file against admin-uploaded reference
examples with Gemini and returns `{status: 'pass'|'fail', reason}`. It also runs its own tiny
task board — but this app only borrows the AI-comparison feature, not that board or its task
schema/status vocabulary (`assigned`/`in-process`/`under-review`/`revision`/`complete`), which
would collide with the richer model here (checklist, team, reviewer, `STATUS_ORDER`, etc.).

The integration point is `POST /ai-review` on that worker (merged into its `main` in
[PR #1](https://github.com/accountingsynnex/task-board-worker/pull/1), live at
`task-board-worker.accountingsynnex.workers.dev` via Cloudflare Workers Builds' Git integration):
takes `{taskType, file}`, returns the verdict, and never touches the worker's own task storage.
Wired up on this side:

- `core/config.js` → `ACCOUNTING_TASK_CONFIG.aiReview` (`enabled`, `baseUrl`) — currently
  `enabled: true` pointing at the live worker above. Set `enabled: false` to turn this off without
  touching any other file.
- `services/ai-review-service.js` → `AiReviewService` (thin wrapper, same `AccountingTaskApiClient`
  used for the main API) and the `AiReview` singleton (`AiReview.enabled` / `AiReview.service`).
- `ui/task-detail.js` → `runAiReview(t, file)` fires (not awaited) right after a file upload
  succeeds, using `t.category` as the worker's `taskType`. It never blocks the upload or changes
  `t.status` — the verdict is stored on `t.aiReview` and rendered as an advisory notice
  (`aiReviewNotice`) in the Files tab, plus one activity log line. The human reviewer in Review
  Queue still makes the real approve/revision call.

The worker's KV namespaces and `GEMINI_API_KEY` secret were configured directly in the Cloudflare
dashboard (Workers Builds auto-deploys on push to its `main`, no local `wrangler` needed). Still
open: its `CORS_HEADERS` allows `Access-Control-Allow-Origin: *` — tighten that to this app's
actual GitHub Pages origin once this app has a stable custom domain or is otherwise final.

## Async repository boundary

`domain/task-service.js` exposes two repositories:

- `TaskService` — the synchronous `LocalTaskService`.
- `AsyncTaskRepository` — a thin async wrapper (`list`/`get`/`create`/`update`/`transition`/
  `updateChecklistItem` return Promises). Every method forwards to `this.repo` with the same
  name and argument shape that `ApiTaskService` (`services/api-task-service.js`) implements, so
  `AsyncTaskRepository.repo = new ApiTaskService(client)` is the entire integration step for
  task CRUD/workflow — no call-site changes anywhere in `ui/` or `pages/`. Keep any new
  `LocalTaskService` method's name and argument order identical in `ApiTaskService` when you add
  one, or this parity breaks silently.

All task mutations the user can trigger (transitions, checklist toggles, create/update, bulk
edits) go through `AsyncTaskRepository` wrapped in `runAsyncAction(triggerElement, action,
{ onConflict })` (`ui/shared.js`) — never by mutating a task object directly. This is what gives
every mutation the same disable-while-pending / revert-on-failure / conflict-modal behavior
instead of each page inventing its own. See `ui/task-detail.js` (checklist, transitions, task
editor), `pages/review-queue.js` (approve/take/reject), `pages/team-board.js` (drag-and-drop via
`moveTaskToStatus` in `ui/shared.js`, bulk edit) and `pages/settings.js` (generate task from
Annual Task) for the reference wiring — they were four different ad-hoc implementations of the
same "change a task, handle failure" logic before this pass; add new mutations the same way
rather than writing a fifth.

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

`runAsyncAction` (not just `#conflictModal` — see above) disables the trigger while the call is in
flight, reverts optimistic UI on failure instead of trusting it, and routes an HTTP 409 to the
blocking `showConflictModal()` reload prompt instead of a generic error toast.

The pages still read from the synchronous `state` cache to render each view once the initial load
succeeds (only the *mutations* are async so far, not the render path). What's still outside this
pattern: master data (teams/categories) and Annual Task template CRUD in `pages/settings.js` mutate
`state.masterData`/`state.templates` directly — there is no `LocalTaskService`-equivalent repository
for them yet. Add one (`MasterDataService`, `AsyncMasterDataRepository`, mirrored in
`ApiTaskService` or a sibling class) before wiring those through `runAsyncAction`, rather than
special-casing direct state mutation inside `runAsyncAction` calls.

## Backend migration path

1. Implement authentication and `GET /me`.
2. Hydrate a client cache from `GET /tasks` and master-data endpoints.
3. Swap `AsyncTaskRepository.repo` for a real `ApiTaskService` instance — task list/get/create/
   update/transition/checklist already route through it from every page, so this is the point
   where the app starts talking to the real backend for tasks.
4. Add a matching repository + `ApiTaskService`-equivalent methods for master data (teams,
   categories, Annual Task templates) and migrate `pages/settings.js` onto it the same way.
5. Add field-level error display for structured validation failures (currently only the top-level
   error message surfaces via `runAsyncAction`'s retry toast).
6. Remove the demonstration role selector when real identity is available.
7. Move all authorization and workflow decisions to the server; keep browser checks for guidance only.
8. Add end-to-end tests before consolidating the remaining historical CSS cascade.

## Coding rules for new work

- Do not append versioned patch blocks.
- Keep dark-theme changes in `theme-dark.css`.
- Add API calls only through a service/repository, never directly inside render functions.
- Treat every API field as untrusted input and escape text before HTML insertion.
- Use server-provided IDs and concurrency tokens.
- Return structured error codes and field errors from the API.
