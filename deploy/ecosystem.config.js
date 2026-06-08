module.exports = {
    apps: [
        {
            name: 'polla_flesan',
            script: './server/index.mjs',
            instances: 'max', // Utiliza todos los núcleos de la CPU (Modo Cluster)
            exec_mode: 'cluster',
            watch: false, // En producción siempre false
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                HOST: '127.0.0.1',
                API_BASE_URL: 'https:/polla.grupoflesan.com',
                NUXT_PUBLIC_API_BASE: 'https:/polla.grupoflesan.com',
                NUXT_API_INTERNAL_URL: 'http://localhost:3500',
                NUXT_API_VERSION: '/api/v1',
                NUXT_PUBLIC_GOOGLE_CLIENT_ID: "481142070803-hr1vf64asb29jtgea9b26gi99e3n8muq.apps.googleusercontent.com"
            }
        }
    ]
}