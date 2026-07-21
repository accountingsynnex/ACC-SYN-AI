# Review & Cleanup Changes

Summary of the frontend review pass before backend handoff. All changes verified against
`npm run validate` (60/60) and a jsdom functional harness (workflow, permissions, persistence).

## Bug fixes

- **`uid()` collision** (`core/constants.js`) — the previous `Date.now()+random(4)` scheme
  collided ~3 times per 5,000 IDs generated in a tight loop (e.g. bulk template generation).
  Added a monotonic counter segment so IDs are unique within the same millisecond.
- **Inconsistent date parsing** (`core/constants.js`) — `daysBetween()` mixed local-time and
  UTC-midnight parsing. Added `toLocalMidnight()` so date-only strings are always parsed at
  local midnight, preventing off-by-one-day results in non-UTC timezones (e.g. UTC+7).

## Backend-readiness

- **`AsyncTaskRepository`** (`domain/task-service.js`) — new Promise-returning wrapper over the
  repository boundary. Point its `repo` at an `ApiTaskService` during integration.
- **All five workspace pages** (Dashboard, My Tasks, Team Board, Review Queue, Closing Calendar)
  migrated to the async initial-load pattern: loading skeleton, success render, error notice +
  retry, and a stale-response guard (`requestId`). Shared scaffolding lives in `ui/shared.js`
  (`pageSkeleton`, `pageErrorState`). Mutations still run synchronously — that is the next
  integration step for the backend team.
- Skeleton styles added to `app.css` (`.skeleton-kpi`).

## UX

- **`bulkAction()`** (`pages/team-board.js`) — replaced the three `prompt()`/`window.prompt`
  dialogs (priority, assignee, due date) with a proper in-app modal reusing `#taskModal`.
  `prompt()` is blocked in some browsers/iframes and looked unpolished; the modal validates
  input and shows the number of affected rows. No remaining `prompt()` calls in the codebase.
- **Modal footer clipping** (`app.css`) — tall modals (e.g. Annual Task editor) pushed the
  confirm button below the 90vh modal bounds where `overflow:hidden` clipped it. Made
  `.modal-body` a shrinkable scrolling flex child (`flex:1 1 auto;min-height:0;overflow-y:auto`)
  and pinned `.modal-foot` with `position:sticky`, so the footer stays visible and the body
  scrolls internally.
- **Popup background blur** (`app.css`, `ui/runtime.js`) — strengthened the modal/drawer
  backdrop blur, and added a blurred backdrop behind the notification panel (toggled via a
  `notif-open` class on `<html>`) so any popup clearly focuses over a dimmed page.
- **Stacked modal blur** (`app.css`, `ui/task-detail.js`, `pages/settings.js`) — when a child
  modal (e.g. Annual Task editor) opens over the Setting modal, the Setting modal underneath now
  blurs/dims too (via a `nested-modal-open` class on `<html>`), instead of staying sharp behind
  the child. Cleared on close of either the child or the whole Setting modal.
- **Editor modal proportions** (`app.css`) — widened the task/annual-task editor modals to 720px,
  increased grid gap and body padding, and gave the checklist/required-files textareas taller,
  better-balanced heights so long forms don't feel cramped.
- **Removed the "สถานะ" field from the Annual Task editor** (`pages/settings.js`) — it was the
  field pushed outside the modal bounds, and it's redundant: the table already has a dedicated
  enable/disable toggle per row. New templates default to active; editing preserves whatever
  active state the row already had (no accidental reactivation on save).

## Cleanup (no behavioral change)

- Removed leftover "next section" comment banners at the end of page files (artifacts of
  splitting one large file into modules).
- Removed duplicated/truncated comment lines in `settings.js`, `dashboard.js`, `runtime.js`.
- Collapsed the identical multi-line boilerplate header on every JS file to a single
  descriptive line.

## Known non-issues

- `console.warn`/`console.error` calls are legitimate error handling in catch blocks; retained.
