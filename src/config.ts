/**
 * Environment configuration with validation
 */

interface Config {
    // Sales Cloud V2 Connection
    salesCloudBaseUrl: string;
    scUsername: string;
    scPassword: string;
    scRequestTimeoutMs: number;

    // Proxy Authentication (SAC → Proxy)
    proxyUsername: string;
    proxyPassword: string;

    // Security
    allowedOrigin: string;
    skiptokenSecret: string;

    // Server
    port: number;
    nodeEnv: string;
    publicUrl?: string;
}

function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

function getOptionalEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${key} must be a number`);
    }
    return parsed;
}

export function loadConfig(): Config {
    return {
        // Sales Cloud V2 Connection
        salesCloudBaseUrl: getRequiredEnv('SALES_CLOUD_BASE_URL').replace(/\/$/, ''),
        scUsername: getRequiredEnv('SC_USERNAME'),
        scPassword: getRequiredEnv('SC_PASSWORD'),
        scRequestTimeoutMs: Number(process.env.SC_REQUEST_TIMEOUT_MS) || 300000,

        // Proxy Authentication
        proxyUsername: getRequiredEnv('PROXY_USERNAME'),
        proxyPassword: getRequiredEnv('PROXY_PASSWORD'),

        // Security
        allowedOrigin: getOptionalEnv('ALLOWED_ORIGIN', 'https://my-tenant.hcs.cloud.sap'),
        // REQUIRED: Must be set for HMAC signing of skiptokens
        // Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
        skiptokenSecret: getRequiredEnv('SKIPTOKEN_SECRET'),

        // Server
        port: getOptionalEnvNumber('PORT', 3000),
        nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
        publicUrl: process.env.PUBLIC_URL?.replace(/\/$/, ''),
    };
}

export type { Config };
