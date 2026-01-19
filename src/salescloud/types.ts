/**
 * TypeScript types for Sales Cloud V2 entities and API responses
 */

/**
 * Generic API response wrapper from Sales Cloud
 */
export interface ScApiResponse<T> {
    value: T[];
    '@odata.count'?: number;  // Keep for OData compatibility
    count?: number;           // SC V2 returns count here
    '@odata.nextLink'?: string;
}

/**
 * Complex type property definition (for nested objects)
 */
export interface ComplexTypeProperty {
    name: string;
    /** Can be Edm.* primitive type or a ComplexType name */
    type: string;
    nullable?: boolean;
    maxLength?: number;
    /** True if this is a collection of the type */
    isCollection?: boolean;
}

/**
 * Complex type definition for metadata generation
 */
export interface ComplexTypeDefinition {
    name: string;
    properties: ComplexTypeProperty[];
    /** If true, this is an open type (allows dynamic properties) */
    isOpenType?: boolean;
}

/**
 * Entity property definition for metadata generation
 */
export interface EntityProperty {
    name: string;
    /** Can be Edm.* primitive type or a ComplexType name */
    type: string;
    nullable?: boolean;
    maxLength?: number;
    isKey?: boolean;
    /** True if this is a collection of the type */
    isCollection?: boolean;
}

/**
 * Field mapping from SC V2 response to OData schema
 */
export interface FieldMapping {
    /** Source path in SC V2 response, e.g., "defaultAddress.country" */
    from: string;
    /** Target property name in OData schema, e.g., "countryCode" */
    to: string;
    /** Optional fallback source path if primary is null/undefined */
    fallback?: string;
    /** If true, pass through the value as-is (for complex types/objects) */
    passthrough?: boolean;
}

/**
 * Navigation property definition for 1:1 relationships
 * Used to expose nested objects as drillable EntityTypes in SAC
 */
export interface NavigationPropertyDefinition {
    /** Property name as exposed in OData (e.g., 'defaultAddress') */
    name: string;
    /** Target EntityType name (e.g., 'AccountDefaultAddress') */
    targetType: string;
    /** Target EntitySet name (e.g., 'AccountDefaultAddresses') */
    targetEntitySet: string;
    /** Source path in SC V2 response to extract the nested object */
    sourcePath: string;
    /** Key property on the target entity (typically 'parentAccountId') */
    targetKeyProperty: string;
    /** Property on parent entity that provides the key value (e.g., 'accountId') */
    parentKeySource: string;
}

/**
 * Entity definition for the registry
 */
export interface EntityDefinition {
    name: string;
    setName: string;
    endpoint: string;
    /** OData property name for the primary key (exposed to clients) */
    keyProperty: string;
    /** SC V2 property name for the primary key (used in API requests) */
    scKeyProperty: string;
    properties: EntityProperty[];
    /** Field mappings from SC V2 to OData schema */
    fieldMappings: FieldMapping[];
    /** Complex type definitions used by this entity - DEPRECATED, use flat properties instead */
    complexTypes?: ComplexTypeDefinition[];
    /** 1:1 Navigation properties for SAC drill-down support */
    navigationProperties?: NavigationPropertyDefinition[];

    // ─────────────────────────────────────────────────────────────────────────
    // Virtual Entity Support (for entities extracted from parent responses)
    // ─────────────────────────────────────────────────────────────────────────

    /** If true, this entity is extracted from a parent entity's response */
    isVirtualEntity?: boolean;
    /** The parent entity set name (e.g., 'Accounts') */
    parentEntitySet?: string;
    /** The property path on parent to extract items from (e.g., 'addresses') */
    sourceProperty?: string;
    /** The property name to use for the parent FK (e.g., 'accountId') */
    parentKeyProperty?: string;

    // ─────────────────────────────────────────────────────────────────────────
    // Navigation Target Support (EntityTypes that exist for metadata only)
    // ─────────────────────────────────────────────────────────────────────────

    /** If true, this entity is a navigation target (metadata-only, no direct query) */
    isNavigationTarget?: boolean;

    // ─────────────────────────────────────────────────────────────────────────
    // Query Configuration
    // ─────────────────────────────────────────────────────────────────────────

    /** SC V2 $expand value for fetching related arrays (e.g., 'addresses,notes') */
    scExpand?: string;

    /** If true, pass through raw source object without field mapping (for dynamic fields like extensions) */
    isPassthrough?: boolean;

    // ─────────────────────────────────────────────────────────────────────────
    // Visibility Control
    // ─────────────────────────────────────────────────────────────────────────

    /** If true, this entity is disabled and not exposed in metadata or queries */
    isDisabled?: boolean;
}

/**
 * OData error response format
 */
export interface ODataError {
    error: {
        code: string;
        message: string;
        target?: string;
        details?: Array<{
            code: string;
            message: string;
            target?: string;
        }>;
    };
}

/**
 * Parsed OData query options
 */
export interface ODataQueryOptions {
    select?: string[];
    filter?: string;
    top?: number;
    skip?: number;
    orderby?: string;
    count?: boolean;
    expand?: string[];
    skiptoken?: string;
}

/**
 * Sales Cloud query parameters (for REST API)
 */
export interface ScQueryParams {
    $select?: string;
    $filter?: string;
    $top?: number;
    $skip?: number;
    $orderby?: string;
    $count?: boolean;
    $expand?: string;
}
