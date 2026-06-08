import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("ADVERTENCIA: DATABASE_URL no está definida.");
}

export const dbClient = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true
  } : false,
});

dbClient.on('connect', (client) => {
  client.query('SET search_path TO polla_flesan');
});
