# Backend Handoff Checklist

## Required before UAT

- [ ] Authentication and current-user endpoint
- [ ] Server-side role/team permissions
- [ ] Task list, detail, create and update endpoints
- [ ] Workflow transition endpoint with audit trail
- [ ] Checklist update endpoint with concurrency control
- [ ] File upload, malware scan, authorized download and retention rules
- [ ] Team/category master data
- [ ] Annual task generation with idempotency
- [ ] Dashboard aggregate endpoints
- [ ] Notification persistence
- [ ] Structured API errors and field validation
- [ ] Database migration and backups
- [ ] End-to-end tests for every role
- [ ] Logging, monitoring and incident ownership

## Frontend integration acceptance

- [ ] **No production role switcher** — kept intentionally for this handoff so the backend
      team can exercise every role against the same session without re-logging in. It must be
      removed or hidden behind a build/environment flag before this ships to real users; it is
      not a security control and must never be reachable in production.
- [x] Loading and retry states visible — `runAsyncAction()` in `assets/js/ui/shared.js` disables
      the trigger and shows a pending label while a call is in flight, and surfaces a retry
      action on failure. Wired into checklist updates and workflow transitions in
      `assets/js/ui/task-detail.js`; extend the same helper to any other view migrated onto
      `ApiTaskService`.
- [x] API failures do not silently overwrite local state — checklist checkboxes and workflow
      buttons only apply the change locally after the call resolves; on failure the checkbox
      reverts to the last known-good value instead of trusting the optimistic UI state.
- [x] Stale-version conflicts are surfaced to the user — an HTTP 409 response routes to
      `showConflictModal()` (`#conflictModal` in `index.html`), which blocks further edits until
      the user reloads the task. The backend must return 409 with the current version on a
      version mismatch for this to trigger.
- [x] Theme choice remains client-side and persists — unchanged, still `localStorage`-backed.
- [x] Light and dark tables pass contrast review — computed WCAG contrast for every
      text/background token pair used in tables and small labels in both themes. Two failures
      found and fixed: `--faint` (used for tiny uppercase labels, ~2.6–4.1:1 in both themes) and
      the hardcoded `.task-id`/`.subtext` gray (~3.6–4.0:1 in light) were darkened to clear
      4.5:1; everything else already passed.
- [x] Mobile layout remains usable — reviewed the CSS breakpoints (down to 375–480px) covering
      sidebar collapse, table/card restacking and full-width filters; not verified with an
      actual device/browser screenshot in this pass — do a quick manual pass on a real phone
      before sign-off.
