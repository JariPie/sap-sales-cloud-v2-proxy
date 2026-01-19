import { FastifyInstance } from 'fastify';

export async function registerSecurityHeaders(app: FastifyInstance) {
    app.addHook('onSend', async (request, reply, _payload) => {
        // Add security headers
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('X-Frame-Options', 'DENY');

        // HSTS: Add if enabled (typically when behind HTTPS termination)
        if (process.env.ENABLE_HSTS === 'true') {
            reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Add Cache-Control for authenticated responses
        if (request.headers.authorization) {
            reply.header('Cache-Control', 'no-store');
        }

        return _payload;
    });
}
