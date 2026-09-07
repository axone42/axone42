import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const sql = neon(process.env.DATABASE_URL);
const migration = await readFile(new URL('../database/001-inquiries.sql', import.meta.url), 'utf8');
await sql.transaction(migration.split(';').map(s => s.trim()).filter(Boolean).map(s => sql.query(s)));
console.log('Inquiry database migration completed.');
