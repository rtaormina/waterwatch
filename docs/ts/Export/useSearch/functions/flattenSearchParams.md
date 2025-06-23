# Function: flattenSearchParams()

> **flattenSearchParams**(`params`): `Record`\<`string`, `string` \| `string`[] \| `undefined`\>

Defined in: src/composables/Export/useSearch.ts:117

Flattens the nested search parameters for use in API requests.
This function converts the structured search parameters into a flat object
suitable for URL query parameters.

## Parameters

### params

[`MeasurementSearchParams`](../interfaces/MeasurementSearchParams.md)

The search parameters to flatten.

## Returns

`Record`\<`string`, `string` \| `string`[] \| `undefined`\>

A flat object containing the search parameters.
