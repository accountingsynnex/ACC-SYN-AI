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

- [ ] No production role switcher
- [ ] Loading and retry states visible
- [ ] API failures do not silently overwrite local state
- [ ] Stale-version conflicts are surfaced to the user
- [ ] Theme choice remains client-side and persists
- [ ] Light and dark tables pass contrast review
- [ ] Mobile layout remains usable
