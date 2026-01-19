import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { Config } from '../config.js';

export async function registerODataRoutes(app: FastifyInstance, config: Config): Promise<void> {

    app.get('/$metadata', async (request: FastifyRequest, reply: FastifyReply) => {
        // Implementation:
        // - Serves standard OData V4 XML metadata
        // - Dynamically generated from entity definitions
        throw new Error('Implementation not included - see README');
    });

    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        // Implementation:
        // - Serves Service Document (JSON) listing available entity sets
        throw new Error('Implementation not included - see README');
    });

    app.get<{
        Params: { entitySet: string };
        Querystring: Record<string, string | string[] | undefined>;
    }>('/:entitySet', async (request, reply) => {
        // Implementation handles:
        // - Route for all entity collections (e.g. /Accounts)
        // - OData query parsing ($filter, $select, $top, $skip)
        // - Cache lookup (prefetch and pagination cache)
        // - SC V2 API calls
        // - Response transformation
        //
        // See blog post for detailed architecture.
        throw new Error('Implementation not included - see README');
    });

    app.get<{ Params: { '*': string } }>('/*', async (request, reply) => {
        // Implementation handles:
        // - Single entity by key (e.g. /Accounts(123))
        // - Regex matching for key extraction
        throw new Error('Implementation not included - see README');
    });
}