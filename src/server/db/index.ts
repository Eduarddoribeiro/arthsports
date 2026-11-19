import { mkdirSync } from "node:fs";
import path from "node:path";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

// Os comandos rodam sempre a partir da raiz do projeto (npm run ...).
const raiz = process.cwd();
const pastaMigracoes = path.join(raiz, "drizzle");

/**
 * Produção (Render): PostgreSQL via DATABASE_URL.
 * Desenvolvimento sem DATABASE_URL: Postgres embutido (PGlite) em .data/pglite.
 * As duas opções rodam as mesmas migrações do Drizzle.
 */
export async function conectar(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const local = /localhost|127\.0\.0\.1/.test(url);
    const pool = new Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: pastaMigracoes });
    return db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const pasta = path.join(raiz, ".data", "pglite");
  mkdirSync(pasta, { recursive: true });
  const db = drizzle(new PGlite(pasta), { schema });
  await migrate(db, { migrationsFolder: pastaMigracoes });
  console.log("Banco: PGlite local em .data/pglite (defina DATABASE_URL para usar PostgreSQL)");
  return db as unknown as Db;
}
