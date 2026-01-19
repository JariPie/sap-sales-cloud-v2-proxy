import type { Config } from '../config.js';
import type { ScApiResponse, ScQueryParams } from './types.js';
import { getScHeaders } from '../auth/sc-auth.js';
import { getEntityBySetName } from './entities.js';
import { logger } from '../utils/logger.js';
import { sleep } from '../utils/async.js';
import { sanitizeUrlForLogging } from '../utils/security.js';
import { SC_MAX_RETRIES, SC_RETRY_BASE_DELAY_MS, SC_V2_ENDPOINT_PATTERN } from '../constants.js';

/**
 * Sales Cloud V2 API client with retry logic and timeout handling.
 * 
 * Features:
 * - Automatic retry with exponential backoff for 5xx errors and network failures
 * - Configurable request timeout
 * - Always requests `$count=true` for pagination accuracy
 * - Validates endpoint format against expected SC V2 patterns
 * 
 * @example
 * const client = new SalesCloudClient(config);
 * const accounts = await client.fetchEntitySet<Account>('Accounts', { $top: 100 });
 */
export class SalesCloudClient {
    private config: Config;
    private headers: Record<string, string>;

    /**
     * Create a new Sales Cloud V2 API client.
     * @param config - Application configuration with SC V2 credentials and settings
     * @param requestId - Optional request ID for end-to-end tracing
     */
    constructor(config: Config, requestId?: string) {
        this.config = config;
        this.headers = getScHeaders(config, requestId);
    }

    /**
     * Fetch a collection of entities from Sales Cloud V2.
     * 
     * @typeParam T - The entity record type
     * @param entitySetName - Name of the OData entity set (e.g., "Accounts", "Leads")
     * @param queryParams - Optional SC V2 query parameters ($filter, $top, $skip, etc.)
     * @returns Promise resolving to SC V2 API response with value array and optional count
     * @throws Error if entity set is unknown or API request fails
     */
    async fetchEntitySet<T>(
        entitySetName: string,
        queryParams: ScQueryParams = {}
    ): Promise<ScApiResponse<T>> {
        const entity = getEntityBySetName(entitySetName);
        if (!entity) {
            throw new Error(`Unknown entity set: ${entitySetName}`);
        }

        // Validate endpoint format
        if (!SC_V2_ENDPOINT_PATTERN.test(entity.endpoint)) {
            logger.warn({
                entitySet: entitySetName,
                endpoint: entity.endpoint
            }, 'Endpoint does not match expected Sales Cloud V2 pattern: /sap/c4c/api/v1/{service}-service/{entity}');
        }

        const url = this.buildUrl(entity.endpoint, queryParams);

        // Log the full URL for debugging
        logger.debug({
            entitySet: entitySetName,
            endpoint: entity.endpoint,
            fullUrl: url
        }, 'Constructed Sales Cloud V2 URL');

        return this.fetchWithRetry<ScApiResponse<T>>(url);
    }

    /**
     * Fetch a single entity by its primary key from Sales Cloud V2.
     * 
     * @typeParam T - The entity record type
     * @param entitySetName - Name of the OData entity set
     * @param key - Primary key value of the entity to fetch
     * @returns Promise resolving to the entity, or null if not found (404)
     * @throws Error if entity set is unknown or API request fails (non-404)
     */
    async fetchEntity<T>(
        entitySetName: string,
        key: string
    ): Promise<T | null> {
        const entity = getEntityBySetName(entitySetName);
        if (!entity) {
            throw new Error(`Unknown entity set: ${entitySetName}`);
        }

        const url = `${this.config.salesCloudBaseUrl}${entity.endpoint}/${key}`;
        try {
            return await this.fetchWithRetry<T>(url);
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Build URL with query parameters
     * IMPORTANT: Always include $count=true for pagination accuracy
     */
    private buildUrl(endpoint: string, params: ScQueryParams): string {
        const url = new URL(`${this.config.salesCloudBaseUrl}${endpoint}`);

        if (params.$select) url.searchParams.set('$select', params.$select);
        if (params.$filter) url.searchParams.set('$filter', params.$filter);
        if (params.$top !== undefined) url.searchParams.set('$top', String(params.$top));
        if (params.$skip !== undefined) url.searchParams.set('$skip', String(params.$skip));
        if (params.$orderby) url.searchParams.set('$orderby', params.$orderby);
        if (params.$expand) url.searchParams.set('$expand', params.$expand);

        // Always request count for pagination
        url.searchParams.set('$count', 'true');

        return url.toString();
    }

    /**
     * Fetch with retry logic and timeout
     */
    private async fetchWithRetry<T>(url: string, retryCount = 0): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.scRequestTimeoutMs);

        try {
            logger.debug({ url, retryCount }, 'Fetching from Sales Cloud');
            const startTime = Date.now();

            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers,
                signal: controller.signal,
            });

            const elapsed = Date.now() - startTime;
            logger.debug({ url, status: response.status, elapsed }, 'Sales Cloud response');

            if (!response.ok) {
                // Retry on 5xx errors
                if (response.status >= 500 && retryCount < SC_MAX_RETRIES) {
                    const backoffMs = Math.pow(2, retryCount) * SC_RETRY_BASE_DELAY_MS;
                    logger.warn({ url: sanitizeUrlForLogging(url), status: response.status, backoffMs }, 'Retrying after 5xx error');
                    await sleep(backoffMs);
                    return this.fetchWithRetry<T>(url, retryCount + 1);
                }

                const errorBody = await response.text();
                // Log sanitized URL; only include error body in non-production
                logger.error({
                    url: sanitizeUrlForLogging(url),
                    status: response.status,
                    ...(process.env.NODE_ENV !== 'production' && { errorBody })
                }, 'Sales Cloud API error');

                // Throw sanitized error to client
                throw new Error(`Sales Cloud API error: ${response.status}`);
            }

            const data = await response.json() as T;

            // DEBUG: Log raw response to see count values
            const rawResponse = data as Record<string, unknown>;
            logger.info({
                url: url.substring(url.indexOf('/sap')), // Just the path part
                count: rawResponse.count,
                odataCount: rawResponse['@odata.count'],
                valueLength: Array.isArray(rawResponse.value) ? rawResponse.value.length : 'not-array',
            }, 'SC V2 raw response');

            return data;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Sales Cloud request timeout after ${this.config.scRequestTimeoutMs}ms`);
            }

            // Retry on network errors
            if (retryCount < SC_MAX_RETRIES && error instanceof TypeError) {
                const backoffMs = Math.pow(2, retryCount) * SC_RETRY_BASE_DELAY_MS;
                logger.warn({ url: sanitizeUrlForLogging(url), error: String(error), backoffMs }, 'Retrying after network error');
                await sleep(backoffMs);
                return this.fetchWithRetry<T>(url, retryCount + 1);
            }

            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

}
