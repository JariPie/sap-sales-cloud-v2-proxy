/**
 * Object utility functions
 */

/**
 * Get a nested property value from an object using dot notation.
 * e.g., getNestedValue(obj, "defaultAddress.country") returns obj.defaultAddress.country
 * 
 * @param obj - The source object
 * @param path - Dot-separated path to the property
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
        if (current === null || current === undefined) {
            return undefined;
        }
        if (typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }

    return current;
}
