# Accounting Task — Backend Ready Handoff v2

This package reorganizes the approved Accounting Task prototype into a feature-based frontend handoff. The screen behavior and Soft Graphite night mode are preserved, while code is separated so a backend team can find domain rules, repositories, pages, and runtime utilities without reading one 400 KB HTML file.

## Run locally

```bash
python -m http.server 8080
# open http://localhost:8080/accounting-task-backend-ready-v2/
```

Opening `index.html` directly is also supported for the local prototype, but an HTTP server better matches backend integration.

## Project structure

```text
assets/
  css/
    app.css                 Light theme and approved component/layout rules
    theme-dark.css          Soft Graphite dark-theme overrides only
  js/
    core/                   constants, configuration and theme bootstrap
    data/                   local demo data and persistence
    domain/                 permissions, workflow and local task service
    pages/                  one file per application workspace
    services/               HTTP client and API repository example
    ui/                     shared rendering, task detail and runtime behavior
docs/
  OPENAPI.yaml              machine-readable backend contract
  DATABASE_SCHEMA.sql       suggested PostgreSQL schema
  FRONTEND_ARCHITECTURE.md  source map and integration boundaries
  ROLE_PERMISSION_MATRIX.md server-side permission requirements
  BACKEND_HANDOFF_CHECKLIST.md
reference/
  prototype-single-file.html approved visual/functional reference
```

## Important boundary

The default prototype still uses `LocalTaskService` and browser storage so every approved screen works without a server. `ApiTaskService` is provided as the target backend adapter. Production integration must migrate view operations to asynchronous calls and show loading, retry and error states.

The browser permission helpers are UX guards only. The backend must independently enforce visibility, editing, file access and workflow transitions.

## Validation

```bash
npm run validate
```

The validator checks file references, duplicate static IDs, JavaScript syntax, script order, inline event handlers and required handoff documents.
