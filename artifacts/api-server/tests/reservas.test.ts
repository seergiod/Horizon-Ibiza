/**
 * Test suite para rutas de reservas
 */

import { describe, it, beforeAll, afterAll } from "node:test";
import assert from "node:assert";
import app from "../src/app.js";
import { db, reservasTable, usersTable } from "@workspace/db";
import { signToken } from "../src/lib/auth.js";
import { hashPassword } from "../src/lib/auth.js";

let testToken: string;
let reservationId: number;

describe("Reservas Routes", () => {
  beforeAll(async () => {
    // Crear usuario admin para obtener token
    const [user] = await db
      .insert(usersTable)
      .values({
        nombre: "Test Admin",
        apellidos: "Admin",
        email: "test-admin@example.com",
        username: "test-admin",
        password_hash: await hashPassword("admin123"),
        rol: "admin",
        estado: "activo",
      })
      .returning();

    testToken = signToken({
      username: user.username,
      role: "admin",
      userId: user.id,
    });
  });

  afterAll(async () => {
    // Cleanup: eliminar reservas de prueba
    await db.delete(reservasTable).where({ cliente: "Test Client" });
    // Eliminar usuario de prueba
    await db.delete(usersTable).where({ email: "test-admin@example.com" });
  });

  it("POST /api/reservas - create reservation", async () => {
    const response = await app.request("/api/reservas", {
      method: "POST",
      body: JSON.stringify({
        cliente: "Test Client",
        fecha_reserva: "2026-06-15",
        hora_reserva: "20:00",
        personas: 4,
        telefono: "+34 666 123 456",
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
    });

    assert.strictEqual(response.status, 201, "Should return 201");
    const data = await response.json();
    assert.ok(data.id, "Should return reservation ID");
    assert.strictEqual(data.cliente, "Test Client");
    reservationId = data.id;
  });

  it("GET /api/reservas - list with pagination", async () => {
    const response = await app.request("/api/reservas?limit=10&offset=0", {
      headers: { Authorization: `Bearer ${testToken}` },
    });

    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(typeof data.total === "number", "Should have total count");
    assert.ok(Array.isArray(data.items), "Should have items array");
    assert.ok(typeof data.hasMore === "boolean", "Should have hasMore flag");
  });

  it("GET /api/reservas/:id - get single reservation", async () => {
    const response = await app.request(`/api/reservas/${reservationId}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });

    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.strictEqual(data.id, reservationId);
  });

  it("PUT /api/reservas/:id - update reservation", async () => {
    const response = await app.request(`/api/reservas/${reservationId}`, {
      method: "PUT",
      body: JSON.stringify({
        estado: "confirmada",
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
    });

    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.strictEqual(data.estado, "confirmada");
  });

  it("DELETE /api/reservas/:id - delete reservation", async () => {
    const response = await app.request(`/api/reservas/${reservationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${testToken}` },
    });

    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.strictEqual(data.ok, true);
  });

  it("GET /api/reservas/:id - returns 404 for non-existent", async () => {
    const response = await app.request("/api/reservas/99999", {
      headers: { Authorization: `Bearer ${testToken}` },
    });

    assert.strictEqual(response.status, 404);
    const data = await response.json();
    assert.strictEqual(data.code, "NOT_FOUND");
  });

  it("POST /api/reservas - requires authentication", async () => {
    const response = await app.request("/api/reservas", {
      method: "POST",
      body: JSON.stringify({
        cliente: "Unauthorized",
        fecha_reserva: "2026-06-15",
        hora_reserva: "20:00",
        personas: 2,
        telefono: "+34 666 123 456",
      }),
      headers: { "Content-Type": "application/json" },
    });

    assert.strictEqual(response.status, 401);
  });
});
