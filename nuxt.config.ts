export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: [
    'nuxt-auth-utils',
    '@pinia/nuxt',
  ],

  alias: {
    '~types': './types',
  },

  imports: {
    dirs: ['stores', 'composables'],
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ||'postgresql://postgres.wqwdtpmwzpmuwqzixrmj:ndlZfn1vf7vvSynl@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || '',
    },
    auth: {
      secret: process.env.AUTH_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://mundial2026.grupoflesan.com/api/auth/google/callback',
    },
    oauthStateSecret: process.env.OAUTH_STATE_SECRET || process.env.AUTH_SECRET,
    footballData: {
      apiToken: process.env.API_TOKEN,
      baseUrl: process.env.FOOTBALL_DATA_BASE_URL || 'https://api.football-data.org/v4',
      worldCupCompetitionId: Number(process.env.FOOTBALL_DATA_COMPETITION_ID) || 2000,
    },
    emailApi: {
      url: process.env.EMAIL_API_URL || 'https://apinotificaciones.grupoflesan.com/api/v1/notifications/email-custom',
      apiKey: process.env.EMAIL_API_KEY || '',
    },
    liveSyncInterval: process.env.LIVE_SYNC_INTERVAL_MS || '180000',
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Polla Flesan DVC',
      groupPhaseLockDate: process.env.GROUP_PHASE_LOCK_DATE || '2026-06-11T00:00:00Z',
    },
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  typescript: {
    strict: true,
  },

  routeRules: {
    '/admin/**': { ssr: true },
  },
  devServer: {
    port: 3002,
  }
})
