const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Conectado a Redis');
});

// Conectar al iniciar
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Error conectando a Redis:', error);
    }
})();

module.exports = redisClient;
