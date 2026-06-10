/**
 * Test suite para rutas de autenticación
 * Ejecutar: node --test tests/auth.test.ts
 */

import { describe, it, beforeAll, afterAll } from "node:test";
import assert from "node:assert";
import app from "../src/app.js";
import { db, usersTable } from "@workspace/db";
import { hashPassword } from "../src/lib/auth.js";

let testUserId: number;
let testToken: string;

describe("Auth Routes", () => {
  // Setup: crear usuario de prueba
  beforeAll(async () => {
    const [user] = await db
      .insert(usersTable)
      .values({
        nombre: "Test User",
        apellidos: "Test",
        email: "test-auth@example.com",
        username: "test-auth",
        password_hash: await hashPassword("password123"),
        rol: "admin",
        estado: "activo",
      })
      .returning();
    testUserId = user.id;
  });

  // Cleanup
  afterAll(async () => {
    await db.delete(usersTable).where({ id: testUserId });
  });

  it("POST /api/auth/login - success with valid credentials", async () => {
    const response = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: "test-auth",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    assert.strictEqual(response.status, 200, "Should return 200");
    const data = await response.json();
    assert.ok(data.token, "Should return token");
    assert.strictEqual(data.role, "admin", "Should return role");
    testToken = data.token;
  });

  it("POST /api/auth/login - failure with invalid password", async () => {
    const response = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: "test-auth",
        password: "wrong-password",
      }),
      headers: { "Content-Type": "application/json" },
    });

    assert.strictEqual(response.status, 401, "Should return 401");
    const data = await response.json();
    assert.strictEqual(data.code, "UNAUTHORIZED", "Should have UNAUTHORIZED code");
  });

  it("POST /api/auth/login - failure with missing credentials", async () => {
    const response = await app.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "test-auth" }),
      headers: { "Content-Type": "application/json" },
    });

    assert.strictEqual(response.status, 400, "Should return 400");
  });

  it("POST /api/auth/login - rate limiting after 5 attempts", async () => {
    const attempts = Array.from({ length: 6 });
    for (const _ of attempts) {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: "test-auth",
          password: "wrong",
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (_ === 5) {
        assert.strictEqual(
          response.status,
          429,
          "Should return 429 on 6th attempt",
        );
        const data = await response.json();
        assert.strictEqual(data.code, "RATE_LIMIT_EXCEEDED");
      }
    }
  });
});
