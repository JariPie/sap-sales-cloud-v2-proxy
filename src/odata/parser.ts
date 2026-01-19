import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';
import { validateQueryLimits, isFilterContentSafe } from '../utils/security.js';
import type { ODataQueryOptions } from '../salescloud/types.js';


/**
 * Parse OData V4 query parameters from URL query string.
 * 
 * Handles standard OData query options:
 * - `$select` - Comma-separated field names to return
 * - `$filter` - Filter expression (validated for security)
 * - `$top` - Maximum records per page (capped at SC V2 max)
 * - `$skip` - Number of records to skip
 * - `$orderby` - Sort expression
 * - `$count` - Include total count in response
 * - `$expand` - Navigation properties to expand
 * - `$skiptoken` - Opaque pagination token
 * 
 * @param query - Raw query string parameters from the request
 * @returns Parsed and validated OData query options
 * @throws Error if query parameters exceed security limits
 * 
 * @example
 * const options = parseODataQuery({
 *   '$select': 'name,id',
 *   '$top': '100',
 *   '$filter': "status eq 'active'"
 * });
 */
export function parseODataQuery(query: Record<string, string | string[] | undefined>): ODataQueryOptions {
    // Security check: validate input length limits
    const validationError = validateQueryLimits(query);
    if (validationError) {
        throw new Error(validationError);
    }

    const options: ODataQueryOptions = {};

    // $select - comma-separated field names
    const select = getQueryParam(query, '$select');
    if (select) {
        options.select = select.split(',').map((s) => s.trim());
    }

    // $filter - pass through as-is (we'll translate in transformer)
    const filter = getQueryParam(query, '$filter');
    if (filter) {
        options.filter = filter;
    }

    // $top - integer pagination limit
    // Cap at MAX_PAGE_SIZE to stay within SC V2 limits
    const top = getQueryParam(query, '$top');
    if (top) {
        const parsed = parseInt(top, 10);
        if (!isNaN(parsed) && parsed > 0) {
            options.top = Math.min(parsed, MAX_PAGE_SIZE);
        }
    } else {
        // Default page size if not specified
        options.top = DEFAULT_PAGE_SIZE;
    }

    // $skip - integer pagination offset
    const skip = getQueryParam(query, '$skip');
    if (skip) {
        const parsed = parseInt(skip, 10);
        if (!isNaN(parsed) && parsed >= 0) {
            options.skip = parsed;
        }
    }

    // $orderby - field asc/desc
    const orderby = getQueryParam(query, '$orderby');
    if (orderby) {
        options.orderby = orderby;
    }

    // $count - boolean to include count
    // Default to true for pagination support
    const count = getQueryParam(query, '$count');
    if (count?.toLowerCase() === 'true') {
        options.count = true;
    } else if (count?.toLowerCase() === 'false') {
        options.count = false;
    } else {
        // Default: include count for pagination
        options.count = true;
    }

    // $expand - comma-separated navigation properties
    const expand = getQueryParam(query, '$expand');
    if (expand) {
        options.expand = expand.split(',').map((s) => s.trim());
    }

    // $skiptoken - opaque pagination token
    const skiptoken = getQueryParam(query, '$skiptoken');
    if (skiptoken) {
        options.skiptoken = skiptoken;
    }

    return options;
}

/**
 * Parse $skiptoken from query parameters
 * @returns The raw skiptoken string or undefined
 */
export function parseSkiptoken(query: Record<string, string | string[] | undefined>): string | undefined {
    return getQueryParam(query, '$skiptoken');
}

/**
 * Get single query parameter value
 */
function getQueryParam(query: Record<string, string | string[] | undefined>, key: string): string | undefined {
    const value = query[key];
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}



/**
 * Validate filter syntax and content security
 */
export function validateFilter(filter: string): { valid: boolean; error?: string } {
    // Check for dangerous injection patterns first
    if (!isFilterContentSafe(filter)) {
        return { valid: false, error: 'Filter contains invalid or dangerous characters' };
    }

    // Check for balanced parentheses
    let depth = 0;
    for (const char of filter) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (depth < 0) {
            return { valid: false, error: 'Unbalanced parentheses in filter' };
        }
    }
    if (depth !== 0) {
        return { valid: false, error: 'Unbalanced parentheses in filter' };
    }

    // Check for balanced quotes
    const singleQuotes = (filter.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
        return { valid: false, error: 'Unbalanced quotes in filter' };
    }

    return { valid: true };
}
