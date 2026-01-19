import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { loadConfig } from './config.js';
import { registerBasicAuth } from './auth/basic-auth.js';
import { registerODataRoutes } from './odata/handlers.js';
import { registerSecurityHeaders } from './middleware/security.js';
import { logger } from './utils/logger.js';

async function main() {
    // Load and validate configuration
    const config = loadConfig();

    // Create Fastify instance with logging
    const app = Fastify({
        logger: {
            level: config.nodeEnv === 'production' ? 'info' : 'debug',
        },
        requestIdLogLabel: 'requestId',
        genReqId: () => crypto.randomUUID(),
    });

    // Public health check
    app.get('/health', async (_request, reply) => {
        return reply.send({ status: 'ok' });
    });

    // API Context - Strict Security
    await app.register(async (api) => {
        // 1. CORS Configuration
        // Requests without an Origin header are allowed (required for SAC integration)
        await api.register(cors, {
            origin: (origin, cb) => {
                if (!origin) {
                    cb(null, true);
                    return;
                }
                if (origin !== config.allowedOrigin) {
                    cb(new Error('Not allowed by CORS'), false);
                    return;
                }
                cb(null, true);
            },
            credentials: true,
        });

        // 2. Security Headers
        await registerSecurityHeaders(api);

        // 3. Basic Auth
        await registerBasicAuth(api, config);

        // Require Basic Auth for all routes in this context
        api.addHook('onRequest', api.basicAuth);

        // 4. Register OData routes
        await registerODataRoutes(api, config);
    });

    // Request logging
    app.addHook('onResponse', async (request, reply) => {
        logger.info({
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            responseTime: reply.elapsedTime,
        }, 'Request completed');
    });

    // Start server
    try {
        await app.listen({ port: config.port, host: '0.0.0.0' });
        logger.info({ port: config.port }, 'OData V4 Proxy server started');
    } catch (err) {
        logger.error({ err }, 'Failed to start server');
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
