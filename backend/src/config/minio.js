const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin'
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'residuos-images';

// Crear bucket si no existe
(async () => {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');

            // Configurar política pública para lectura
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
                    }
                ]
            };

            await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
            console.log(`✅ Bucket '${BUCKET_NAME}' creado y configurado`);
        } else {
            console.log(`✅ Conectado a MinIO - Bucket '${BUCKET_NAME}'`);
        }
    } catch (error) {
        console.error('❌ Error configurando MinIO:', error);
    }
})();

module.exports = { minioClient, BUCKET_NAME };
