/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost', 'minio'],
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '9000',
                pathname: '/**',
            },
        ],
    },
    // Configuración para desarrollo
    reactStrictMode: true,
    // Deshabilitar telemetría
    telemetry: false,
}

module.exports = nextConfig
