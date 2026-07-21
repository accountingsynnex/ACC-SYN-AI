# Role and Permission Matrix

All rules in this table must be enforced by the backend. Frontend checks are not security controls.

| Capability | Staff | Reviewer | Team Leader | Accounting Manager |
|---|---:|---:|---:|---:|
| View unrestricted task in own scope | Yes | Yes | Yes | Yes |
| View restricted task | Assigned/reviewer only | Assigned/reviewer only | Own team | All |
| Create task | Self and own team | Own team | Own team | All teams |
| Edit task fields | Assigned task in editable state | Assigned task in editable state | Own team | All |
| Update checklist | Assigned task in editable state | Assigned task in editable state | Own team | All |
| Submit Ready for Review | Assigned task; required checklist complete | Same if assigned | Own team | All |
| Recall Ready for Review | Assigned task before review | Same if assigned | Own team | All |
| Start review | No | Assigned reviewer | Own team | All |
| Return for revision | No | Assigned reviewer | Own team | All |
| Approve | No | Assigned reviewer | Own team | All |
| Download file | Own team | Own team | Own team | All |
| Delete file | Upload owner or approved policy | Review scope | Own team | All |
| Manage teams/categories | No | No | No | Yes |
| Manage annual tasks | No | Yes | Yes | Yes |

## Workflow states

`assigned → in-progress → ready-review → under-review → approved`

Revision path:

`under-review → revision → in-progress → ready-review`

Recall path:

`ready-review → in-progress` before review begins.

The server should reject any transition not represented above and should return `WORKFLOW_NOT_ALLOWED` with a user-readable reason.
