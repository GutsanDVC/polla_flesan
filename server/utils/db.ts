import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
export const SCHEMA = process.env.DB_SCHEMA || 'polla_flesan';

if (!connectionString) {
  console.error("ADVERTENCIA: DATABASE_URL no está definida.");
}

export const dbClient = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
});
