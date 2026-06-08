export interface FootballDataConfig {
  apiToken: string;
  baseUrl: string;
  worldCupCompetitionId: number;
}

export function getFootballDataConfig(): FootballDataConfig {
  const config = useRuntimeConfig();
  const token = (config as any).footballData?.apiToken ?? process.env.API_TOKEN;

  if (!token) {
    throw new Error('API_TOKEN no está definido en las variables de entorno');
  }

  return {
    apiToken: token,
    baseUrl: process.env.FOOTBALL_DATA_BASE_URL || 'https://api.football-data.org/v4',
    worldCupCompetitionId: Number(process.env.FOOTBALL_DATA_COMPETITION_ID) || 2000,
  };
}
