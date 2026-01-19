import type { EntityDefinition, FieldMapping } from '../salescloud/types.js';

/**
 * Transform a single SC V2 entity to OData schema format
 *
 * This function:
 * 1. Maps field names from SC V2 to OData schema
 * 2. Flattens nested objects
 * 3. Only outputs properties declared in the entity definition
 * 4. Handles null/missing values gracefully
 * 5. Includes navigation properties as nested objects with parent key
 */
export function transformEntity(
    source: Record<string, unknown>,
    entityDefinition: EntityDefinition
): Record<string, unknown> {
    // Implementation:
    // - Flattens nested SC V2 structures
    // - Applies field mappings (rename, type cast)
    // - Handles navigation properties
    throw new Error('Implementation not included - see README');
}

/**
 * Transform an array of SC V2 entities to OData schema format
 */
export function transformEntityCollection(
    sources: Record<string, unknown>[],
    entityDefinition: EntityDefinition
): Record<string, unknown>[] {
    throw new Error('Implementation not included - see README');
}

/**
 * Transform SC V2 response for a specific entity set
 * Convenience function that looks up the entity definition by set name
 */
export function transformForEntitySet(
    sources: Record<string, unknown>[],
    entitySetName: string
): Record<string, unknown>[] {
    throw new Error('Implementation not included - see README');
}

/**
 * Transform a single SC V2 entity for a specific entity set
 * Convenience function that looks up the entity definition by set name
 */
export function transformSingleForEntitySet(
    source: Record<string, unknown>,
    entitySetName: string
): Record<string, unknown> {
    throw new Error('Implementation not included - see README');
}

/**
 * Build a reverse mapping from OData property names to SC V2 field paths
 * Used for translating $select and $filter parameters
 */
export function buildReverseFieldMapping(entityDefinition: EntityDefinition): Map<string, string> {
    throw new Error('Implementation not included - see README');
}
