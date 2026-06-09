import { dbClient } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const schema = process.env.DB_SCHEMA || 'polla_flesan';
  const results: Record<string, any> = {};

  try {
    // 1. Current search_path
    const spRes = await dbClient.query('SHOW search_path');
    results.searchPath = spRes.rows[0]?.search_path;

    // 2. Check if schema exists
    const schemaRes = await dbClient.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [schema],
    );
    results.schemaExists = schemaRes.rows.length > 0;

    // 3. Tables in the schema
    const tablesRes = await dbClient.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
      [schema],
    );
    results.tables = tablesRes.rows.map((r) => r.table_name);

    // 4. Users count by status
    const usersRes = await dbClient.query(
      `SELECT status, COUNT(*)::int AS count FROM users GROUP BY status ORDER BY status`,
    );
    results.usersByStatus = usersRes.rows;

    // 5. Total users
    const totalUsers = await dbClient.query('SELECT COUNT(*)::int AS count FROM users');
    results.totalUsers = totalUsers.rows[0]?.count;

    // 6. Matches count by group
    const matchesRes = await dbClient.query(
      `SELECT "group", COUNT(*)::int AS count FROM matches WHERE phase = 'GROUP' GROUP BY "group" ORDER BY "group"`,
    );
    results.matchesByGroup = matchesRes.rows;

    // 7. Total matches
    const totalMatches = await dbClient.query('SELECT COUNT(*)::int AS count FROM matches');
    results.totalMatches = totalMatches.rows[0]?.count;

    // 8. Teams count
    const teamsRes = await dbClient.query('SELECT COUNT(*)::int AS count FROM teams');
    results.totalTeams = teamsRes.rows[0]?.count;

    // 9. Predictions count
    const predsRes = await dbClient.query('SELECT COUNT(*)::int AS count FROM match_predictions');
    results.totalPredictions = predsRes.rows[0]?.count;

    // 10. Pool status
    results.pool = {
      totalCount: dbClient.totalCount,
      idleCount: dbClient.idleCount,
      waitingCount: dbClient.waitingCount,
    };

    results.ok = true;
  } catch (err: any) {
    results.ok = false;
    results.error = err.message;
  }

  return results;
});
