import type { Config } from '../config.js';

/**
 * Build Basic Auth header for Sales Cloud V2 API requests
 */
export function buildScAuthHeader(config: Config): string {
    const credentials = Buffer.from(`${config.scUsername}:${config.scPassword}`).toString('base64');
    return `Basic ${credentials}`;
}

/**
 * Get standard headers for Sales Cloud V2 requests
 * @param config - Application configuration
 * @param requestId - Optional request ID for end-to-end tracing
 */
export function getScHeaders(config: Config, requestId?: string): Record<string, string> {
    return {
        'Authorization': buildScAuthHeader(config),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'DataServiceVersion': '2.0',
        ...(requestId && { 'X-Request-ID': requestId }),
    };
}
