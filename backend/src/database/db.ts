import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { SCHEMA } from './schema';

let db: Database | null = null;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/wordquest.db');
const DATA_DIR = path.dirname(DB_PATH);

export async function initializeDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize schema
  const statements = SCHEMA.split(';').filter(stmt => stmt.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      db.run(statement);
    }
  }

  // Save database
  saveDatabase();

  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function saveDatabase(): void {
  if (!db) return;

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

export function queryOne<T>(sql: string, params: any[] = []): T | null {
  const db = getDatabase();
  const results = query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export function queryAll<T>(sql: string, params: any[] = []): T[] {
  return query<T>(sql, params);
}

export function query<T>(sql: string, params: any[] = []): T[] {
  const db = getDatabase();
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('Query error:', sql, params, error);
    throw error;
  }
}

export function execute(sql: string, params: any[] = []): void {
  const db = getDatabase();
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    saveDatabase();
  } catch (error) {
    console.error('Execute error:', sql, params, error);
    throw error;
  }
}

export function executeBatch(statements: Array<{ sql: string; params: any[] }>): void {
  const db = getDatabase();
  try {
    for (const { sql, params } of statements) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
    }
    saveDatabase();
  } catch (error) {
    console.error('Batch execute error:', error);
    throw error;
  }
}
