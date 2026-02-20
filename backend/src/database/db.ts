import { Pool, types } from 'pg';
import { SCHEMA } from './schema';

// Parse INT8 (BIGINT) as JavaScript number instead of string.
// This ensures COUNT(*) returns a number, not a string.
types.setTypeParser(20, (val: string) => parseInt(val, 10));

let pool: Pool | null = null;

// Auto-convert SQLite ? placeholders to PostgreSQL $1, $2, $3...
function convertPlaceholders(sql: string): string {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

export async function initializeDatabase(): Promise<void> {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });

  // Run schema statements
  const statements = SCHEMA.split(';').filter(stmt => stmt.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      await pool.query(statement);
    }
  }
}

function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

export async function queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
  const p = getPool();
  const result = await p.query(convertPlaceholders(sql), params);
  return result.rows.length > 0 ? (result.rows[0] as T) : null;
}

export async function queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const p = getPool();
  const result = await p.query(convertPlaceholders(sql), params);
  return result.rows as T[];
}

export async function execute(sql: string, params: any[] = []): Promise<void> {
  const p = getPool();
  await p.query(convertPlaceholders(sql), params);
}

export async function executeBatch(statements: Array<{ sql: string; params: any[] }>): Promise<void> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    for (const { sql, params } of statements) {
      await client.query(convertPlaceholders(sql), params);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
