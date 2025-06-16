[**frontend**](../../../README.md)

***

[frontend](../../../README.md) / [Export/usePresets](../README.md) / usePresets

# Function: usePresets()

> **usePresets**(): `object`

Defined in: src/composables/Export/usePresets.ts:44

Composable to manage presets in the application.
This composable provides functionality to load presets from the server,
filter them based on a search query, and handle loading and error states.

## Returns

The presets state and actions.

### error

> **error**: `Ref`\<`null` \| `string`, `null` \| `string`\>

### filterPresets()

> **filterPresets**: (`query`) => [`Preset`](../interfaces/Preset.md)[]

Filters the presets based on a search query.

#### Parameters

##### query

`string`

The search query to filter presets.

#### Returns

[`Preset`](../interfaces/Preset.md)[]

An array of filtered presets.

### loading

> **loading**: `Ref`\<`boolean`, `boolean`\>

### loadPresets()

> **loadPresets**: () => `Promise`\<`void`\>

Loads presets from the server.
This function fetches presets from the API and populates the `presets` reactive variable.
It handles loading state and errors appropriately.

#### Returns

`Promise`\<`void`\>

A promise that resolves when presets are loaded.

#### Throws

If the fetch operation fails or if the response is not ok.

### presets

> **presets**: `Ref`\<`object`[], [`Preset`](../interfaces/Preset.md)[] \| `object`[]\>
