---
name: Dashboard authentication
description: How employee dashboard auth works — DB-backed bcrypt users, seeded on startup.
---

# Dashboard Auth

## Approach
`usersTable` in PostgreSQL. `authenticate()` is async — checks DB by username, email, OR dni.
**The login route MUST `await authenticate()`** — it's async. Forgetting `await` returns a Promise truthy value, causing false-positive auth.

**Why:** Migrated from hardcoded users to DB-backed users to support user management panel.

## Seed
`seedDefaultUsers()` runs at startup in `index.ts`. Creates admin/empleado if none exist.
- admin: username=admin, email=admin@horizon.com, pass=DASHBOARD_ADMIN_PASS (default: admin123)
- empleado: username=empleado, email=empleado@horizon.com, pass=DASHBOARD_EMPLOYEE_PASS (default: empleado123)

## JWT
- Secret: `JWT_SECRET` env var, default `horizon-dashboard-secret-dev`
- Expiry: 12h — stored in `localStorage` key `hz_token`
- Payload: `{ username, role, userId }`

## Production hardening
Set `DASHBOARD_ADMIN_PASS`, `DASHBOARD_EMPLOYEE_PASS`, `JWT_SECRET` as Replit secrets.
