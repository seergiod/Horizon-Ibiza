---
name: Dashboard routing
description: How /dashboard sub-routes are structured in React Router.
---

# Dashboard Routing

## App.tsx
`/dashboard/*` matched by wildcard, rendered by `<Dashboard />` component.
The public site uses `isDashboard = pathname.startsWith("/dashboard")` to skip SiteHeader/Footer.

## Dashboard.tsx
- Renders `<LoginScreen>` if unauthenticated
- Renders `<DashboardLayout>` with `<Routes>` when authenticated
- Sub-routes are relative (no `/dashboard` prefix inside the nested Routes)

## Sub-routes
- `reservas` → ReservasList
- `calendar` → CalendarView
- `admin/users` → AdminUsers (admin only)
- `admin/import` → AdminImport (admin only)
- `*` → Navigate to `/dashboard/reservas`

## Role gating
Admin-only routes rendered conditionally: `{role === "admin" && <Route .../>}`
Sidebar items filtered by `adminOnly` flag.

## Key lesson
The `<Route path="/dashboard/*">` wildcard in App.tsx is essential — without it, nested paths like `/dashboard/calendar` won't match.
