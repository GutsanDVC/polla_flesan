import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const schema = process.env.DB_SCHEMA || 'polla_flesan';

if (!connectionString) {
  console.error("ADVERTENCIA: DATABASE_URL no está definida.");
}

export const dbClient = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
  async afterCreate(client: pg.PoolClient, done: (err: Error | null, client?: pg.PoolClient) => void) {
    try {
      await client.query(`SET search_path TO ${schema}`);
      done(null, client);
    } catch (err) {
      done(err as Error, client);
    }
  },
} as pg.PoolConfig);
