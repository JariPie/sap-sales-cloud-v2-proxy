import { secureCompare } from '../utils/security.js';
import type { FastifyInstance } from 'fastify';
import fastifyBasicAuth from '@fastify/basic-auth';
import type { Config } from '../config.js';

/**
 * Register Basic Auth plugin for inbound SAC requests
 */
export async function registerBasicAuth(app: FastifyInstance, config: Config): Promise<void> {
    await app.register(fastifyBasicAuth, {
        validate: async (username, password, _req, _reply) => {
            const usernameValid = secureCompare(username, config.proxyUsername);
            const passwordValid = secureCompare(password, config.proxyPassword);

            if (!usernameValid || !passwordValid) {
                throw new Error('Invalid credentials');
            }
        },
        authenticate: { realm: 'SAC OData Proxy' },
    });
}
