[**frontend**](../../../README.md)

***

[frontend](../../../modules.md) / [composables/useExportData](../README.md) / useExportData

# Function: useExportData()

> **useExportData**(): `object`

Defined in: src/composables/useExportData.ts:15

Composables for exporting data from the API.
This is used by the export button in the export data page.
It allows the user to export data in different formats (CSV, JSON, etc.) and with different filters applied.
It uses the `useSearch` composable to flatten the search parameters and the `file-saver` library to save the file.

## Returns

An object containing the `exportData` function.

### exportData()

> **exportData**: (`format`, `filters?`) => `Promise`\<`boolean`\>

Exports data from the API in the specified format and with the given filters.

#### Parameters

##### format

`any`

The format to export the data in (e.g., "csv", "json").

##### filters?

[`MeasurementSearchParams`](../../useSearch/interfaces/MeasurementSearchParams.md)

Optional filters to apply to the data export.

#### Returns

`Promise`\<`boolean`\>

- Returns a promise that resolves to true if the export was successful, or false if it failed.
