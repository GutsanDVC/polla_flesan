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
                HOST: '127.0.0.1',
                DB_SCHEMA: 'polla_flesan',
                NUXT_PUBLIC_APP_NAME: 'Polla Flesan DVC',
            }
        }
    ]
}
