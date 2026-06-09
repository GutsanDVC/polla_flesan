import { dbClient, SCHEMA } from '../utils/db';
import type { Team } from '~~/types/domain';

export class TeamRepository {
  async upsert(team: Team): Promise<Team> {
    const query = `
      INSERT INTO ${SCHEMA}.teams (id, name, short_name, tla, crest_url, country_code, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        short_name = EXCLUDED.short_name,
        tla = EXCLUDED.tla,
        crest_url = EXCLUDED.crest_url,
        country_code = EXCLUDED.country_code,
        updated_at = NOW()
      RETURNING id, name, short_name, tla, crest_url, country_code
    `;
    const values = [
      team.id,
      team.name,
      team.short_name,
      team.tla,
      team.crest_url,
      team.country_code,
    ];
    const res = await dbClient.query(query, values);
    return res.rows[0];
  }

  async getById(id: number): Promise<Team | null> {
    const res = await dbClient.query(
      `SELECT id, name, short_name, tla, crest_url, country_code FROM ${SCHEMA}.teams WHERE id = $1`,
      [id],
    );
    return res.rows[0] ?? null;
  }

  async getByIds(ids: number[]): Promise<Team[]> {
    if (ids.length === 0) return [];
    const res = await dbClient.query(
      `SELECT id, name, short_name, tla, crest_url, country_code FROM ${SCHEMA}.teams WHERE id = ANY($1)`,
      [ids],
    );
    return res.rows;
  }

  async getAll(): Promise<Team[]> {
    const res = await dbClient.query(
      `SELECT id, name, short_name, tla, crest_url, country_code FROM ${SCHEMA}.teams ORDER BY name ASC`,
    );
    return res.rows;
  }
}
