/**
 * Apply a Supabase SQL migration file using a direct Postgres connection.
 *
 * Requires one of:
 *   DATABASE_URL=postgresql://...
 *   SUPABASE_DB_PASSWORD=...  (uses NEXT_PUBLIC_SUPABASE_URL from .env.local)
 *
 * Or use the Supabase CLI after `supabase login`:
 *   npx supabase db query -f <file> --linked
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

function projectRefFromUrl(url) {
  const match = String(url ?? "").match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

function resolveConnectionString(env) {
  if (env.DATABASE_URL?.trim()) return env.DATABASE_URL.trim();

  const password = env.SUPABASE_DB_PASSWORD?.trim() || process.env.SUPABASE_DB_PASSWORD?.trim();
  const projectRef = projectRefFromUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  if (!password || !projectRef) return null;

  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`;
}

async function main() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error("Usage: node scripts/apply-supabase-migration.mjs <path-to.sql>");
    process.exit(1);
  }

  const sqlPath = path.resolve(root, migrationFile);
  if (!fs.existsSync(sqlPath)) {
    console.error(`Migration file not found: ${sqlPath}`);
    process.exit(1);
  }

  const env = {
    ...loadEnvFile(path.join(root, ".env.local")),
    ...loadEnvFile(path.join(root, ".env")),
    ...process.env
  };

  const connectionString = resolveConnectionString(env);
  if (!connectionString) {
    console.error(
      [
        "Missing database credentials.",
        "Add DATABASE_URL or SUPABASE_DB_PASSWORD to .env.local,",
        "or run: npx supabase login && npx supabase link --project-ref <ref>",
        "then: npx supabase db query -f <file> --linked"
      ].join("\n")
    );
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  console.log(`Applying migration: ${migrationFile}`);
  await client.connect();
  try {
    await client.query(sql);
    console.log("Migration applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
