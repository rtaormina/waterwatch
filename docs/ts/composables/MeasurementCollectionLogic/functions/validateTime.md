[**frontend**](../../../README.md)

***

[frontend](../../../modules.md) / [composables/MeasurementCollectionLogic](../README.md) / validateTime

# Function: validateTime()

> **validateTime**(`errors`, `time`): `void`

Defined in: src/composables/MeasurementCollectionLogic.ts:56

Validates if the input in the time fields (minutes and seconds) are numbers, and within the valid range.

## Parameters

### errors

the current error state of the time inputs

#### mins

`null` \| `string`

#### sec

`null` \| `string`

#### sensor

`null` \| `string`

#### temp

`null` \| `string`

### time

the current values of the time inputs

#### mins

`string`

#### sec

`string`

## Returns

`void`
