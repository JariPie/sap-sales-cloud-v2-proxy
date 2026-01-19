# Sales Cloud V2 → SAC OData Proxy (Reference Architecture)

This repository accompanies my blog post on connecting SAP Sales Cloud V2 to a standalone SAP Analytics Cloud instance using a lightweight REST-to-OData proxy.

## What's Included

- Architecture documentation
- Type definitions
- Configuration constants
- Skeleton entity registry

## What's Not Included (and Why)

The production implementation contains customer-specific configurations, field mappings, and custom extensions that I can't publish. This includes:

- Keyset pagination with signed skiptokens
- Parallel prefetch caching
- Virtual entity flattening
- Complete entity mappings for specific SC V2 tenants

The code in this repository demonstrates the *structure* and *approach*—enough to understand how the pieces fit together if you want to build your own implementation.

## Read the Full Story

[Blog Post: Connecting SAP Sales Cloud V2 to Standalone SAC](#)

The blog post walks through the challenges (the 999-record limit, the $skip 10k wall, nested object flattening) and explains the solutions in detail.

## Questions?

If you're facing a similar integration challenge, feel free to [reach out](https://pietsch.solutions). Happy to discuss approaches or help with an implementation.
