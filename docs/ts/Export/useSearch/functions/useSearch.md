# Function: useSearch()

> **useSearch**(): `object`

Defined in: src/composables/Export/useSearch.ts:36

Composable for searching measurements with various filters.

This composable provides methods to search for measurements based on
user-defined filters, and returns the results including count and average temperature.

## Returns

An object containing:
- `isLoading`: A computed property indicating if a search is currently in progress.
- `results`: A computed property containing the search results (count and average temperature).
- `searchMeasurements`: A method to perform the search with given parameters.
- `resetSearch`: A method to reset the search state.
- `flattenSearchParams`: A utility method to flatten nested search parameters for API requests.

### isLoading

> **isLoading**: `ComputedRef`\<`boolean`\>

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
