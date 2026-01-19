/**
 * Centralized constants for the OData V4 proxy
 * 
 * This eliminates magic numbers scattered throughout the codebase
 * and provides a single source of truth for configuration values.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Sales Cloud V2 API Constraints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SC V2 returns a maximum of 999 records per request, not 1000.
 * This is a hard limit enforced by the Sales Cloud API.
 */
export const SC_MAX_PAGE_SIZE = 999;

/**
 * SC V2 does not allow $skip values >= 10,000.
 * Requests with $skip >= 10000 return an error.
 * We use keyset pagination to work around this.
 */
export const SC_MAX_SKIP = 10000;

// ─────────────────────────────────────────────────────────────────────────────
// Pagination Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default page size when client doesn't specify $top
 */
export const DEFAULT_PAGE_SIZE = SC_MAX_PAGE_SIZE;

/**
 * Maximum page size we allow clients to request
 * (capped at SC V2's limit)
 */
export const MAX_PAGE_SIZE = SC_MAX_PAGE_SIZE;

// ─────────────────────────────────────────────────────────────────────────────
// Cache Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prefetch cache TTL in milliseconds (5 minutes)
 * SAC imports should complete within this time
 */
export const PREFETCH_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Pagination cache TTL in milliseconds (1 hour)
 */
export const PAGINATION_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Collection cache TTL in milliseconds (10 minutes)
 */
export const COLLECTION_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Maximum entries in the pagination cache
 */
export const MAX_PAGINATION_CACHE_ENTRIES = 100;

/**
 * Delay between prefetch requests to avoid hammering SC V2 (milliseconds)
 */
export const PREFETCH_DELAY_MS = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Timeout Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default timeout for SC V2 requests (milliseconds)
 */
export const DEFAULT_SC_REQUEST_TIMEOUT_MS = 30000;

/**
 * Timeout for waiting on cache to be populated (milliseconds)
 */
export const CACHE_WAIT_TIMEOUT_MS = 60000;

/**
 * Extended cache wait timeout for collection fetches (milliseconds)
 */
export const COLLECTION_CACHE_WAIT_TIMEOUT_MS = 300000;

// ─────────────────────────────────────────────────────────────────────────────
// OData Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * OData V4 namespace for metadata
 */
export const ODATA_NAMESPACE = 'SalesCloudProxy';

/**
 * OData V4 entity container name
 */
export const ODATA_CONTAINER_NAME = 'DefaultContainer';

// ─────────────────────────────────────────────────────────────────────────────
// Logging Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maximum length for logging string values (truncation point)
 */
export const LOG_STRING_TRUNCATE_LENGTH = 20;

/**
 * Maximum length for logging URL paths
 */
export const LOG_URL_TRUNCATE_LENGTH = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Retry Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maximum number of retries for SC V2 requests
 */
export const SC_MAX_RETRIES = 2;

/**
 * Base delay for exponential backoff (milliseconds)
 */
export const SC_RETRY_BASE_DELAY_MS = 500;

// ─────────────────────────────────────────────────────────────────────────────
// Request Limits
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maximum URL path length for entity requests
 * Prevents ReDoS attacks via crafted long paths
 */
export const MAX_PATH_LENGTH = 512;

// ─────────────────────────────────────────────────────────────────────────────
// Memory Monitoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Memory usage threshold (MB) that triggers cache cleanup
 */
export const MEMORY_WARNING_MB = 512;

// ─────────────────────────────────────────────────────────────────────────────
// API Validation Patterns
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expected endpoint pattern for Sales Cloud V2 API endpoints
 * Format: /sap/c4c/api/v1/{service}-service/{entity}
 */
export const SC_V2_ENDPOINT_PATTERN = /^\/sap\/c4c\/api\/v1\/[a-z-]+-service\/[a-z]+$/;