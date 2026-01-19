import { entityRegistry } from '../salescloud/entities.js';
import type { EntityDefinition, EntityProperty, NavigationPropertyDefinition } from '../salescloud/types.js';
import { ODATA_NAMESPACE, ODATA_CONTAINER_NAME } from '../constants.js';

/**
 * Generate OData V4 EDMX metadata document
 * 
 * Supports:
 * - EntityTypes with Properties
 * - NavigationProperties for 1:1 relationships (SAC drill-down)
 * - NavigationPropertyBinding in EntityContainer
 */
export function generateMetadata(_baseUrl: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="${ODATA_NAMESPACE}">
${entityRegistry.filter((e) => !e.isDisabled).map((e) => generateEntityType(e)).join('\n')}
      <EntityContainer Name="${ODATA_CONTAINER_NAME}">
${entityRegistry.filter((e) => !e.isDisabled).map((e) => generateEntitySet(e)).join('\n')}
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;
}

/**
 * Generate EntityType definition for a single entity
 * Includes Properties and NavigationProperties
 */
function generateEntityType(entity: EntityDefinition): string {
    const keyProperty = entity.properties.find((p) => p.isKey);

    const properties = entity.properties
        .map((p) => generateProperty(p))
        .join('\n');

    // Generate NavigationProperty elements for 1:1 relationships
    const navProperties = entity.navigationProperties
        ?.map((nav) => generateNavigationProperty(nav))
        .join('\n') || '';

    const hasNavProps = navProperties.length > 0;

    return `      <EntityType Name="${entity.name}">
        <Key>
          <PropertyRef Name="${keyProperty?.name || entity.keyProperty}" />
        </Key>
${properties}${hasNavProps ? '\n' + navProperties : ''}
      </EntityType>`;
}

/**
 * Generate Property definition for EntityType
 */
function generateProperty(prop: EntityProperty): string {
    const attrs: string[] = [
        `Name="${prop.name}"`,
        `Type="${prop.type}"`,
    ];

    if (prop.nullable !== undefined) {
        attrs.push(`Nullable="${prop.nullable}"`);
    }

    if (prop.maxLength !== undefined) {
        attrs.push(`MaxLength="${prop.maxLength}"`);
    }

    return `        <Property ${attrs.join(' ')} />`;
}

/**
 * Generate NavigationProperty element for 1:1 relationships
 */
function generateNavigationProperty(nav: NavigationPropertyDefinition): string {
    return `        <NavigationProperty Name="${nav.name}" Type="${ODATA_NAMESPACE}.${nav.targetType}" Nullable="true" />`;
}

/**
 * Generate EntitySet with NavigationPropertyBinding if applicable
 */
function generateEntitySet(entity: EntityDefinition): string {
    const hasNavProps = entity.navigationProperties && entity.navigationProperties.length > 0;

    if (!hasNavProps) {
        // Simple EntitySet without bindings
        return `        <EntitySet Name="${entity.setName}" EntityType="${ODATA_NAMESPACE}.${entity.name}" />`;
    }

    // EntitySet with NavigationPropertyBinding for each navigation property
    const bindings = entity.navigationProperties!
        .map((nav) => `          <NavigationPropertyBinding Path="${nav.name}" Target="${nav.targetEntitySet}" />`)
        .join('\n');

    return `        <EntitySet Name="${entity.setName}" EntityType="${ODATA_NAMESPACE}.${entity.name}">
${bindings}
        </EntitySet>`;
}

/**
 * Generate service document (root endpoint)
 */
export function generateServiceDocument(baseUrl: string): object {
    return {
        '@odata.context': `${baseUrl}/$metadata`,
        'value': entityRegistry.filter((e) => !e.isDisabled).map((e) => ({
            name: e.setName,
            kind: 'EntitySet',
            url: e.setName,
        })),
    };
}
