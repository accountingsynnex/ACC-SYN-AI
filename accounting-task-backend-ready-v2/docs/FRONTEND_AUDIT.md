# Frontend Code Audit

## Executive assessment

The current file is a strong interactive prototype and can communicate the required workflow to a backend team. It should **not** be treated as production-ready source without integration work.

## Static checks performed

- HTML parsed successfully.
- No duplicate IDs in the static shell.
- Main JavaScript passes Node syntax validation.
- CSS parses successfully.
- No inline `onclick` or `onchange` attributes in the HTML shell.
- User-provided values are generally escaped before insertion into rendered HTML.

## Measured complexity in the source prototype

- Single HTML file: about 426 KB and 6,292 lines.
- CSS: about 5,026 lines, 1,994 rules.
- CSS uses about 1,958 `!important` declarations.
- 405 selectors are declared more than once because revisions were appended as override layers.
- Main JavaScript: about 156 KB, 1,219 lines, and roughly 159 named functions.
- The UI writes rendered templates with `innerHTML` in multiple places.

## Findings

### High — client-side permissions are not security
Role, ownership, file access, and workflow checks currently run in the browser. They are useful for the demo but can be bypassed. The backend must repeat all checks.

### High — browser storage is the source of truth
Tasks, templates, notifications, and master data use localStorage; demo file content uses browser storage. There is no server synchronization, concurrency handling, authentication, or recoverable API error state.

### Medium — monolithic rendering and data logic
Rendering, domain rules, storage, and events live in one script. The new handoff separates files and establishes a TaskService boundary, but a production implementation should continue splitting by feature.

### Medium — accumulated CSS overrides
The prototype evolved through many visual patches. It works through cascade priority and extensive `!important`. Avoid extending this pattern. A later frontend refactor should consolidate tokens and component rules after backend behavior is stable.

### Medium — HTML-string rendering
The code normally uses the `esc()` helper for user-facing text, which is good. Backend data must still be treated as untrusted, and a strict Content Security Policy is recommended. Avoid introducing unescaped values into templates.

### Medium — no automated regression suite
The built-in `AccountingTaskQA.run()` checks data invariants, but there are no browser-level tests for navigation, drag/drop, permissions, forms, or theme contrast.

## Can a backend developer continue from this?

Yes, when this package is used as:

1. a visual and workflow specification;
2. a reference for field names and states;
3. a starting point for API wiring using `docs/API_CONTRACT.md`.

No, if the expectation is to connect a few URLs and deploy immediately. The synchronous local service must be replaced, UI calls must support asynchronous loading/errors, and authorization must move to the server.

## Recommended implementation order

1. Authentication and `GET /me`.
2. Task list/detail and server-side permissions.
3. Create/update and checklist changes.
4. Workflow transition endpoint with audit trail.
5. File upload/download storage and security.
6. Master data and annual tasks.
7. Notifications and dashboard aggregates.
8. Browser end-to-end tests and CSS consolidation.
