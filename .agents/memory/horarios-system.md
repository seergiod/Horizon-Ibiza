---
name: Horarios system
description: Employee schedule system — OCR image upload, DB storage, employee view, optional SMS
---

# Horarios System

## Architecture
- OCR runs client-side in the browser using **tesseract.js v7** (free, no API key)
- Admin uploads image → browser extracts text → editable table → save to API
- DB: `horario_versiones` (schedule versions) + `turnos` (individual shifts per employee/day)
- Route: `POST /api/horarios/versiones` (admin) / `GET /api/horarios/mios` (employee)

## DB Schema (lib/db/src/schema/horarios.ts)
- `horario_versiones`: id, semana_inicio (YYYY-MM-DD), nombre, notas, creado_por, fecha_creacion
- `turnos`: id, version_id (cascade delete), empleado_nombre, user_id, dia, seccion, hora_inicio, hora_fin, estado (trabaja/libre/modificado), turno_tipo, notas, es_cambio

## Change detection
- When saving a new version for the same semana_inicio, the backend auto-compares with the previous version
- Changed shifts get estado="modificado" and es_cambio=true
- Returns list of changed employee/day pairs

## SMS (Twilio, optional)
- Install: twilio already in artifacts/api-server
- Env vars needed: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
- If env vars missing, SMS is silently skipped — does not block the save
- SMS sent to employees whose phone number is in the users table

## Frontend routes
- `/dashboard/horarios` — HorarioView (all roles): employees see their schedule; admin sees full grid + tab to switch
- `/dashboard/admin/horarios` — HorarioUpload (admin only): image upload + OCR + editable table + save

**Why Tesseract.js:** Free tier constraint — Replit AI integrations unavailable. Tesseract runs in browser. OCR accuracy is limited for complex colored tables, so the UI allows manual correction before saving.
