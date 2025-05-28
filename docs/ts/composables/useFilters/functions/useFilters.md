[**frontend**](../../../README.md)

***

[frontend](../../../modules.md) / [composables/useFilters](../README.md) / useFilters

# Function: useFilters()

> **useFilters**(`selectedContinents`, `selectedCountries`, `selectedWaterSources`, `temperatureEnabled`, `temperature`, `dateRange`, `times`): `object`

Defined in: src/composables/useFilters.ts:48

Composable for managing filters for the export page.

## Parameters

### selectedContinents

`MaybeRefOrGetter`\<`string`[]\>

The selected continents.

### selectedCountries

`MaybeRefOrGetter`\<`string`[]\>

The selected countries.

### selectedWaterSources

`MaybeRefOrGetter`\<`string`[]\>

The selected water sources.

### temperatureEnabled

`MaybeRefOrGetter`\<`boolean`\>

Whether the temperature filter is enabled.

### temperature

`MaybeRefOrGetter`\<[`TemperatureFilter`](../interfaces/TemperatureFilter.md)\>

The temperature filter settings.

### dateRange

`MaybeRefOrGetter`\<[`DateRangeFilter`](../interfaces/DateRangeFilter.md)\>

The date range filter settings.

### times

`MaybeRefOrGetter`\<[`TimeSlot`](../interfaces/TimeSlot.md)[]\>

The time slots for filtering measurements.

## Returns

An object containing methods and computed properties for managing filters.

### addSlot()

> **addSlot**: () => `void`

Adds a new time slot to the list of time slots.

This function adds a new time slot with empty 'from' and 'to' values
if the current number of time slots is less than 3.

#### Returns

`void`

### allCountries

> **allCountries**: `ComputedRef`\<`string`[]\>

### allSlotsValid

> **allSlotsValid**: `ComputedRef`\<`boolean`\>

### continentPlaceholder

> **continentPlaceholder**: `ComputedRef`\<`""` \| `"Select continents"`\>

### continents

> **continents**: `Ref`\<`string`[], `string`[]\>

### countriesByContinent

> **countriesByContinent**: `Ref`\<`Record`\<`string`, `string`[]\>, `Record`\<`string`, `string`[]\>\>

### countryPlaceholder

> **countryPlaceholder**: `ComputedRef`\<`""` \| `"Select countries"`\>

### dateRangeValid

> **dateRangeValid**: `ComputedRef`\<`boolean`\>

### formatContinentSelectionText()

> **formatContinentSelectionText**: () => `string`

Formats the selected continent text for display.

#### Returns

`string`

The formatted text.

### formatCountrySelectionText()

> **formatCountrySelectionText**: () => `string`

Formats the selected country text for display.

#### Returns

`string`

The formatted text.

### formatWaterSourceSelectionText()

> **formatWaterSourceSelectionText**: () => `string`

Formats the selected water source text for display.

#### Returns

`string`

The formatted text.

### getSearchParams()

> **getSearchParams**: (`query?`) => [`MeasurementSearchParams`](../../useSearch/interfaces/MeasurementSearchParams.md)

Generates search parameters based on the current filter selections.
This function constructs a `MeasurementSearchParams` object
containing the selected filters and their values.

#### Parameters

##### query?

`string`

The search query string.

#### Returns

[`MeasurementSearchParams`](../../useSearch/interfaces/MeasurementSearchParams.md)

The search parameters object.

### loadLocations()

> **loadLocations**: () => `Promise`\<`void`\>

Loads the available locations (continents and countries) from the API.
This function fetches the locations and populates the `continents` and `countriesByContinent` reactive variables.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the locations are loaded.

#### Throws

If the API request fails.

### loadWaterSources()

> **loadWaterSources**: () => `Promise`\<`void`\>

Loads the available water sources from the API.
This function fetches the water sources and populates the `waterSources` reactive variable.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the water sources are loaded.

### removeSlot()

> **removeSlot**: (`index`) => `void`

Removes a time slot at the specified index.

This function removes the time slot at the given index from the list of time slots.

#### Parameters

##### index

`number`

The index of the time slot to remove.

#### Returns

`void`

### slotsNonOverlapping

> **slotsNonOverlapping**: `ComputedRef`\<`boolean`\>

### slotValid()

> **slotValid**: (`slot`) => `boolean`

Checks if a time slot is valid.

A time slot is considered valid if both 'from' and 'to' are defined and 'to' is greater than or equal to 'from'.

#### Parameters

##### slot

[`TimeSlot`](../interfaces/TimeSlot.md)

The time slot to validate.

#### Returns

`boolean`

True if the slot is valid, false otherwise.

### tempRangeValid

> **tempRangeValid**: `ComputedRef`\<`boolean`\>

### toggleAllContinents()

> **toggleAllContinents**: (`list`) => `string`[]

Toggles the selection of all continents in the given list.

#### Parameters

##### list

`string`[]

The list of selected items.

#### Returns

`string`[]

The updated list of selected items.

### toggleAllCountries()

> **toggleAllCountries**: (`list`) => `string`[]

Toggles the selection of all countries in the given list.

#### Parameters

##### list

`string`[]

The list of selected items.

#### Returns

`string`[]

The updated list of selected items.

### toggleAllWaterSources()

> **toggleAllWaterSources**: (`list`) => `string`[]

Toggles the selection of all water sources in the given list.

#### Parameters

##### list

`string`[]

The list of selected water sources.

#### Returns

`string`[]

The updated list of selected water sources.

### toggleContinent()

> **toggleContinent**: (`list`, `continent`) => `string`[]

Toggles the selection of a continent in the given list.

#### Parameters

##### list

`string`[]

The list of selected items.

##### continent

`string`

The continent to toggle.

#### Returns

`string`[]

The updated list of selected items.

### toggleCountry()

> **toggleCountry**: (`list`, `country`) => `string`[]

Toggles the selection of a country in the given list.

#### Parameters

##### list

`string`[]

The list of selected items.

##### country

`string`

The country to toggle.

#### Returns

`string`[]

The updated list of selected items.

### toggleWaterSource()

> **toggleWaterSource**: (`list`, `ws`) => `string`[]

Toggles the selection of a water source in the given list.

#### Parameters

##### list

`string`[]

The list of selected water sources.

##### ws

`string`

The water source to toggle.

#### Returns

`string`[]

The updated list of selected water sources.

### waterSourcePlaceholder

> **waterSourcePlaceholder**: `ComputedRef`\<`""` \| `"Select water sources"`\>

### waterSources

> **waterSources**: `Ref`\<`string`[], `string`[]\>
