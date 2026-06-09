import { dbClient, SCHEMA } from '../../utils/db';

export default defineEventHandler(async (event) => {
  const results: Record<string, any> = {};

  try {
    // 1. Current search_path
    const spRes = await dbClient.query('SHOW search_path');
    results.searchPath = spRes.rows[0]?.search_path;

    // 2. Schema being used
    results.configuredSchema = SCHEMA;

    // 3. Check if schema exists
    const schemaRes = await dbClient.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [SCHEMA],
    );
    results.schemaExists = schemaRes.rows.length > 0;

    // 4. Tables in the schema
    const tablesRes = await dbClient.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name`,
      [SCHEMA],
    );
    results.tables = tablesRes.rows.map((r) => r.table_name);

    // 5. Users count by status
    const usersRes = await dbClient.query(
      `SELECT status, COUNT(*)::int AS count FROM ${SCHEMA}.users GROUP BY status ORDER BY status`,
    );
    results.usersByStatus = usersRes.rows;

    // 6. Total users
    const totalUsers = await dbClient.query(`SELECT COUNT(*)::int AS count FROM ${SCHEMA}.users`);
    results.totalUsers = totalUsers.rows[0]?.count;

    // 7. Matches count by group
    const matchesRes = await dbClient.query(
      `SELECT "group", COUNT(*)::int AS count FROM ${SCHEMA}.matches WHERE phase = 'GROUP' GROUP BY "group" ORDER BY "group"`,
    );
    results.matchesByGroup = matchesRes.rows;

    // 8. Total matches
    const totalMatches = await dbClient.query(`SELECT COUNT(*)::int AS count FROM ${SCHEMA}.matches`);
    results.totalMatches = totalMatches.rows[0]?.count;

    // 9. Teams count
    const teamsRes = await dbClient.query(`SELECT COUNT(*)::int AS count FROM ${SCHEMA}.teams`);
    results.totalTeams = teamsRes.rows[0]?.count;

    // 10. Predictions count
    const predsRes = await dbClient.query(`SELECT COUNT(*)::int AS count FROM ${SCHEMA}.match_predictions`);
    results.totalPredictions = predsRes.rows[0]?.count;

    // 11. Pool status
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
