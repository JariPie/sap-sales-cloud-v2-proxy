import { timingSafeEqual } from 'crypto';

/**
 * Timing-safe string comparison to prevent timing attacks on authentication
 */
export function secureCompare(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a, 'utf-8');
    const bBuffer = Buffer.from(b, 'utf-8');

    // Pad buffers to same length to prevent timing leaks from length comparison
    const maxLength = Math.max(aBuffer.length, bBuffer.length);
    const aPadded = Buffer.alloc(maxLength);
    const bPadded = Buffer.alloc(maxLength);
    aBuffer.copy(aPadded);
    bBuffer.copy(bPadded);

    // Compare padded buffers, then verify lengths match
    const lengthMatch = aBuffer.length === bBuffer.length;
    return timingSafeEqual(aPadded, bPadded) && lengthMatch;
}

/**
 * Maximum allowed lengths for OData query parameters
 */
export const QUERY_LIMITS = {
    /** Maximum $filter expression length */
    MAX_FILTER_LENGTH: 4096,
    /** Maximum $select field list length */
    MAX_SELECT_LENGTH: 2048,
    /** Maximum $orderby expression length */
    MAX_ORDERBY_LENGTH: 512,
    /** Maximum $skiptoken length */
    MAX_SKIPTOKEN_LENGTH: 1024,
    /** Maximum overall query string length */
    MAX_QUERY_STRING_LENGTH: 8192,
} as const;

/**
 * Validate query parameter lengths
 * Returns error message if validation fails, undefined if OK
 */
export function validateQueryLimits(query: Record<string, string | string[] | undefined>): string | undefined {
    const getParam = (key: string): string | undefined => {
        const val = query[key];
        return Array.isArray(val) ? val[0] : val;
    };

    const filter = getParam('$filter');
    if (filter && filter.length > QUERY_LIMITS.MAX_FILTER_LENGTH) {
        return `$filter exceeds maximum length of ${QUERY_LIMITS.MAX_FILTER_LENGTH} characters`;
    }

    const select = getParam('$select');
    if (select && select.length > QUERY_LIMITS.MAX_SELECT_LENGTH) {
        return `$select exceeds maximum length of ${QUERY_LIMITS.MAX_SELECT_LENGTH} characters`;
    }

    const orderby = getParam('$orderby');
    if (orderby && orderby.length > QUERY_LIMITS.MAX_ORDERBY_LENGTH) {
        return `$orderby exceeds maximum length of ${QUERY_LIMITS.MAX_ORDERBY_LENGTH} characters`;
    }

    const skiptoken = getParam('$skiptoken');
    if (skiptoken && skiptoken.length > QUERY_LIMITS.MAX_SKIPTOKEN_LENGTH) {
        return `$skiptoken exceeds maximum length of ${QUERY_LIMITS.MAX_SKIPTOKEN_LENGTH} characters`;
    }

    return undefined;
}

/**
 * Characters/patterns that are NOT allowed in OData filter values.
 * These could be used for injection attacks.
 * 
 * EXPORTED for use in filter validation across modules.
 * Note: No global flag needed - we only check for existence, not all matches.
 */
export const DANGEROUS_FILTER_PATTERNS: RegExp[] = [
    /;/,               // Statement separator
    /--/,              // SQL comment
    /\/\*/,            // Block comment start
    /\*\//,            // Block comment end
    /\x00/,            // Null byte
    /\\x[0-9a-f]{2}/i, // Hex escapes
];

/**
 * Check if a string contains dangerous patterns.
 * 
 * @param value - The string to check
 * @returns true if the string is safe (no dangerous patterns), false otherwise
 */
function isDangerousFreeString(value: string): boolean {
    for (const pattern of DANGEROUS_FILTER_PATTERNS) {
        if (pattern.test(value)) {
            return false;
        }
    }
    return true;
}

/**
 * Validate an OData filter expression for dangerous injection patterns.
 * This is separate from structural validation (parentheses, quotes).
 * 
 * @param filter - The filter expression to validate
 * @returns true if safe, false if contains dangerous patterns
 */
export function isFilterContentSafe(filter: string): boolean {
    return isDangerousFreeString(filter);
}

/**
 * Sanitize a value for safe inclusion in an OData filter expression
 * This goes beyond just escaping quotes - it validates the entire value
 */
export function sanitizeFilterValue(value: string): { valid: boolean; sanitized: string; error?: string } {
    // Check for dangerous patterns
    if (!isDangerousFreeString(value)) {
        return { valid: false, sanitized: '', error: 'Invalid characters in filter value' };
    }

    // Check for reasonable length (GUIDs are 36 chars, allow some margin)
    if (value.length > 100) {
        return { valid: false, sanitized: '', error: 'Filter value too long' };
    }

    // Escape single quotes for OData
    const sanitized = value.replace(/'/g, "''");

    return { valid: true, sanitized };
}

/**
 * Build a keyset pagination filter condition safely
 * 
 * @param fieldName - The SC V2 field name to filter on
 * @param operator - Comparison operator (must be 'gt' or 'lt')
 * @param value - The value to compare against
 * @returns Safe filter expression or throws on invalid input
 */
export function buildKeysetCondition(
    fieldName: string,
    operator: 'gt' | 'lt',
    value: string
): string {
    // Validate field name (alphanumeric + underscore only)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName)) {
        throw new Error('Invalid field name for keyset pagination');
    }

    // Sanitize value
    const { valid, sanitized, error } = sanitizeFilterValue(value);
    if (!valid) {
        throw new Error(error || 'Invalid value for keyset pagination');
    }

    return `${fieldName} ${operator} '${sanitized}'`;
}

/**
 * Safely combine filter expressions with AND
 * @param filters - Array of filter expressions (already validated)
 */
export function combineFilters(filters: string[]): string {
    const nonEmpty = filters.filter(f => f && f.trim());
    if (nonEmpty.length === 0) return '';
    if (nonEmpty.length === 1) return nonEmpty[0];
    return nonEmpty.map(f => `(${f})`).join(' and ');
}

/**
 * Mask sensitive values for logging
 */
export function maskSensitive(value: string, visibleChars = 4): string {
    if (value.length <= visibleChars) {
        return '*'.repeat(value.length);
    }
    return value.substring(0, visibleChars) + '*'.repeat(Math.min(value.length - visibleChars, 8));
}

/**
 * Sanitize error messages before returning to client
 * Removes sensitive information like file paths, stack traces, and internal details
 */
export function sanitizeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        const message = error.message;

        // Remove file paths
        const sanitized = message
            .replace(/\/[^\s:]+\.(ts|js)/g, '[path]')
            .replace(/at\s+[^\n]+/g, '')
            .replace(/\n+/g, ' ')
            .trim();

        // Truncate long messages
        return sanitized.length > 200 ? sanitized.substring(0, 200) + '...' : sanitized;
    }

    return 'An unexpected error occurred';
}

/**
 * Sanitize URL for logging (remove query params which may contain sensitive data)
 */
export function sanitizeUrlForLogging(url: string): string {
    try {
        const parsed = new URL(url);
        return `${parsed.pathname}${parsed.search ? '?[params]' : ''}`;
    } catch {
        return '[invalid-url]';
    }
}