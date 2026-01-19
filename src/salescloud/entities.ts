import type { EntityDefinition, EntityProperty, FieldMapping } from './types.js';

/**
 * Common ID property used across most entities
 */
const idProperty = (name: string): EntityProperty => ({
    name,
    type: 'Edm.Guid',
    nullable: false,
    isKey: true,
});

/**
 * Entity registry - defines all exposed entities with their SC endpoints, properties, and field mappings
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

export const entityRegistry: EntityDefinition[] = [
    // ═══════════════════════════════════════════════════════════════════════
    // ACCOUNT (Example Entity)
    // ═══════════════════════════════════════════════════════════════════════
    {
        name: 'Account',
        setName: 'Accounts',
        endpoint: '/sap/c4c/api/v1/account-service/accounts',
        keyProperty: 'accountId',
        scKeyProperty: 'id',
        properties: [
            // Primary key
            idProperty('accountId'),

            // Core scalar properties (same names as SC V2)
            { name: 'displayId', type: 'Edm.String', nullable: true, maxLength: 40 },
            { name: 'formattedName', type: 'Edm.String', nullable: true, maxLength: 255 },
            { name: 'lifeCycleStatus', type: 'Edm.String', nullable: true, maxLength: 40 },
        ],
        fieldMappings: [
            // Map SC V2 'id' to OData 'accountId'
            { from: 'id', to: 'accountId' },
            // Direct passthrough for all other scalar properties
            { from: 'displayId', to: 'displayId' },
            { from: 'formattedName', to: 'formattedName' },
            { from: 'lifeCycleStatus', to: 'lifeCycleStatus' },
        ],
        navigationProperties: [],
    },

    // Add your entity definitions here - see blog post for guidance on structure
];
