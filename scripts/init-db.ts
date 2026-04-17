import "dotenv/config";
import "../src/env.js";

import { conn, db } from "~/server/db";
import { configTable } from "~/server/db/schema";

async function initDb() {
  const existingConfig = await db.query.configTable.findFirst();

  if (existingConfig) {
    console.log("Config row already exists", { id: existingConfig.id });
    return;
  }

  const [config] = await db.insert(configTable).values({}).returning({
    id: configTable.id,
  });

  console.log("Created default config row", { id: config?.id });
}

initDb()
  .then(() => {
    console.log("Database initialization complete");
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await conn.end();
  });
