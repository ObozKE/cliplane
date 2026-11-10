import { describe, it, expect } from "vitest";
import { newDb, DataType } from "pg-mem";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

describe("Database Migrations & Schema Integrity", () => {
  it("applies the schema tables, foreign keys, check constraints and indexes without errors", async () => {
    const db = newDb();

    // Register gen_random_uuid
    db.public.registerFunction({
      name: "gen_random_uuid",
      returns: DataType.uuid,
      implementation: () => crypto.randomUUID(),
    });

    const pg = db.adapters.createPg();
    const client = new pg.Client();
    await client.connect();

    // Create auth and storage mock schemas
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL
      );

      CREATE SCHEMA IF NOT EXISTS storage;
      CREATE TABLE IF NOT EXISTS storage.buckets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        public BOOLEAN DEFAULT false,
        file_size_limit BIGINT,
        allowed_mime_types TEXT[]
      );
      CREATE TABLE IF NOT EXISTS storage.objects (
        id UUID PRIMARY KEY,
        bucket_id TEXT NOT NULL REFERENCES storage.buckets(id),
        name TEXT NOT NULL,
        owner UUID,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Read the SQL migration file
    const migrationPath = path.resolve(__dirname, "../../../../supabase/migrations/20261110000000_init_schema.sql");
    const rawSql = fs.readFileSync(migrationPath, "utf-8");

    // Remove single-line comments, plpgsql blocks, triggers, extensions, and policies for pure DDL execution
    const ddlSql = rawSql
      .replace(/--.*$/gm, "")
      .replace(/timezone\('utc'::text,\s*now\(\)\)/g, "now()")
      .replace(/CREATE EXTENSION[\s\S]*?;/gi, "")
      .replace(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$;/gi, "")
      .replace(/DROP TRIGGER[\s\S]*?;/gi, "")
      .replace(/CREATE TRIGGER[\s\S]*?;/gi, "")
      .replace(/ALTER TABLE[\s\S]*?ENABLE ROW LEVEL SECURITY;/gi, "")
      .replace(/CREATE POLICY[\s\S]*?;/gi, "");

    const statements = ddlSql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await client.query(stmt);
    }

    // Verify all 7 core tables exist
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = res.rows.map((row: any) => row.table_name);
    expect(tables).toContain("profiles");
    expect(tables).toContain("jobs");
    expect(tables).toContain("clips");
    expect(tables).toContain("payments");
    expect(tables).toContain("tutorial_progress");
    expect(tables).toContain("takedown_requests");
    expect(tables).toContain("audit_log");

    // Create auth user first
    const userId = "00000000-0000-0000-0000-000000000001";
    await client.query(`
      INSERT INTO auth.users (id, email)
      VALUES ('${userId}', 'test@example.com')
    `);

    // Valid profile insert succeeds
    await client.query(`
      INSERT INTO public.profiles (id, email, role)
      VALUES ('${userId}', 'test@example.com', 'user')
    `);

    // Valid job insert succeeds
    await client.query(`
      INSERT INTO public.jobs (user_id, source_type, status, lane)
      VALUES ('${userId}', 'upload', 'queued', 'free')
    `);

    // Invalid status violates CHECK constraint
    await expect(
      client.query(`
        INSERT INTO public.jobs (user_id, source_type, status, lane)
        VALUES ('${userId}', 'upload', 'invalid_status', 'free')
      `),
    ).rejects.toThrow();

    // Invalid lane violates CHECK constraint
    await expect(
      client.query(`
        INSERT INTO public.jobs (user_id, source_type, status, lane)
        VALUES ('${userId}', 'upload', 'queued', 'unsupported_lane')
      `),
    ).rejects.toThrow();

    // Foreign key constraint: invalid user_id fails
    await expect(
      client.query(`
        INSERT INTO public.jobs (user_id, source_type, status, lane)
        VALUES ('99999999-9999-9999-9999-999999999999', 'upload', 'queued', 'free')
      `),
    ).rejects.toThrow();

    await client.end();
  });
});
