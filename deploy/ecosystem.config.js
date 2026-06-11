module.exports = {
    apps: [
        {
            name: 'polla_flesan',
            script: './server/index.mjs',
            instances: 'max',
            exec_mode: 'cluster',
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                NITRO_PORT: 3001,
                HOST: '127.0.0.1',
                NITRO_HOST: '127.0.0.1',
                DATABASE_URL: process.env.DATABASE_URL || 'CHANGE_ME',
                NUXT_DATABASE_URL: process.env.NUXT_DATABASE_URL || 'CHANGE_ME',
                GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'CHANGE_ME',
                GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'CHANGE_ME',
                NUXT_GOOGLE_REDIRECT_URI: 'https://mundial2026.grupoflesan.com/api/auth/google/callback',
                NUXT_AUTH_ORIGIN: 'https://mundial2026.grupoflesan.com',
                AUTH_SECRET: process.env.AUTH_SECRET || 'CHANGE_ME',
                NUXT_SESSION_PASSWORD: process.env.NUXT_SESSION_PASSWORD || 'CHANGE_ME',
                NUXT_PUBLIC_APP_NAME: 'Polla Flesan DVC',
                GROUP_PHASE_LOCK_DATE: '2026-06-12T00:00:00Z',
                EMAIL_API_URL: 'https://apinotificaciones.grupoflesan.com/api/v1/notifications/email-custom',
                EMAIL_API_KEY: process.env.EMAIL_API_KEY || 'CHANGE_ME',
                API_MATCH: 'https://api.football-data.org/v4/competitions/2000/matches',
                API_TOKEN: process.env.API_TOKEN || 'CHANGE_ME',
                LIVE_SYNC_INTERVAL_MS: '180000',
            }
        }
    ]
}
