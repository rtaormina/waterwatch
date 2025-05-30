[**frontend**](../../README.md)

***

[frontend](../../README.md) / [useSearch](../README.md) / useSearch

# Function: useSearch()

> **useSearch**(): `object`

Defined in: src/composables/useSearch.ts:34

Composable for searching measurements with various filters.
This composable provides methods to search for measurements based on
user-defined filters, and returns the results including count and average temperature.

## Returns

An object containing:
- `hasSearched`: A computed property indicating if a search has been performed.
- `results`: A computed property containing the search results (count and average temperature).
- `searchMeasurements`: A method to perform the search with given parameters.
- `resetSearch`: A method to reset the search state.
- `flattenSearchParams`: A utility method to flatten nested search parameters for API requests.

### flattenSearchParams()

> **flattenSearchParams**: (`params`) => `Record`\<`string`, `undefined` \| `string` \| `string`[]\>

Flattens the nested search parameters for use in API requests.
This function converts the structured search parameters into a flat object
suitable for URL query parameters.

#### Parameters

##### params

[`MeasurementSearchParams`](../interfaces/MeasurementSearchParams.md)

The search parameters to flatten.

#### Returns

`Record`\<`string`, `undefined` \| `string` \| `string`[]\>

A flat object containing the search parameters.

### hasSearched

> **hasSearched**: `ComputedRef`\<`boolean`\>

### resetSearch()

> **resetSearch**: () => `void`

Resets the search state.
This method clears the search results and resets the state to its initial values.

#### Returns

`void`

### results

> **results**: `ComputedRef`\<\{ `avgTemp`: `number`; `count`: `number`; \}\>

### searchMeasurements()

> **searchMeasurements**: (`params`) => `Promise`\<`void`\>

Searches for measurements with the given parameters.

#### Parameters

##### params

[`MeasurementSearchParams`](../interfaces/MeasurementSearchParams.md)

The search parameters to use.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the search is complete.
