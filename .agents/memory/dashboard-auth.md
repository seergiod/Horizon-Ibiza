---
name: Dashboard authentication
description: How employee dashboard auth works — no user table, env-var passwords.
---

# Dashboard Auth

## Approach
No users table. Two hardcoded roles:
- `admin` — password from `DASHBOARD_ADMIN_PASS` env var, default `admin123`
- `empleado` — password from `DASHBOARD_EMPLOYEE_PASS` env var, default `empleado123`

**Why:** Simple restaurant use-case with 2 known users. DB user management adds complexity with no benefit here.

**How to apply:** To change credentials in production, set `DASHBOARD_ADMIN_PASS` and `DASHBOARD_EMPLOYEE_PASS` secrets. The defaults are only for dev and shown in the login hint.

## JWT
- Secret: `JWT_SECRET` env var, default `horizon-dashboard-secret-dev`
- Expiry: 12h
- Stored: `localStorage` key `hz_token`
- Header: `Authorization: Bearer <token>`

## Production hardening needed
Set all three env vars as Replit secrets before deploying.
