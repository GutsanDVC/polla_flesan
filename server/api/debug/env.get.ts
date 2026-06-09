export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  return {
    google: {
      redirectUri: config.google.redirectUri,
      clientIdDefined: !!config.google.clientId,
      clientSecretDefined: !!config.google.clientSecret,
    },
    auth: {
      origin: process.env.NUXT_AUTH_ORIGIN || 'NOT SET',
      secretDefined: !!config.auth?.secret,
    },
    session: {
      passwordDefined: !!config.session?.password,
      passwordLength: config.session?.password?.length ?? 0,
    },
    database: {
      urlDefined: !!process.env.DATABASE_URL,
      schema: process.env.DB_SCHEMA || 'polla_flesan (default)',
    },
    footballData: {
      apiTokenDefined: !!config.footballData?.apiToken,
      baseUrl: config.footballData?.baseUrl,
      competitionId: config.footballData?.worldCupCompetitionId,
    },
    app: {
      name: config.public?.appName,
      groupPhaseLockDate: config.public?.groupPhaseLockDate,
    },
    nodeEnv: process.env.NODE_ENV,
    nitroPort: process.env.PORT || process.env.NITRO_PORT,
  };
});
