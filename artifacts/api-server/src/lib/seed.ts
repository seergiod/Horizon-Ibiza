import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

const DEFAULT_ADMIN_PASS    = process.env.DASHBOARD_ADMIN_PASS    ?? "admin123";
const DEFAULT_EMPLOYEE_PASS = process.env.DASHBOARD_EMPLOYEE_PASS ?? "empleado123";

export async function seedDefaultUsers() {
  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, "admin"))
      .limit(1);

    if (existing) {
      logger.info("Seed: usuarios ya existen, saltando");
      return;
    }

    await db.insert(usersTable).values([
      {
        nombre:        "Admin",
        apellidos:     "Sistema",
        dni:           "00000000A",
        email:         "admin@horizon.com",
        username:      "admin",
        telefono:      null,
        password_hash: await bcrypt.hash(DEFAULT_ADMIN_PASS, 10),
        rol:           "admin",
        estado:        "activo",
      },
      {
        nombre:        "Empleado",
        apellidos:     "Demo",
        dni:           "00000001A",
        email:         "empleado@horizon.com",
        username:      "empleado",
        telefono:      null,
        password_hash: await bcrypt.hash(DEFAULT_EMPLOYEE_PASS, 10),
        rol:           "empleado",
        estado:        "activo",
      },
    ]);

    logger.info("Seed: usuarios admin y empleado creados");
  } catch (err) {
    logger.error({ err }, "Seed: error al crear usuarios por defecto");
  }
}
