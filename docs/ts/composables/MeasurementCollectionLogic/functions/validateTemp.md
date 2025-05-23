[**frontend**](../../../README.md)

***

[frontend](../../../modules.md) / [composables/MeasurementCollectionLogic](../README.md) / validateTemp

# Function: validateTemp()

> **validateTemp**(`val`, `errors`, `tempRef`): `void`

Defined in: src/composables/MeasurementCollectionLogic.ts:11

Validates if the input in the temperature field is a number, and not too large.

## Parameters

### val

`string`

the current value of the temperature input

### errors

the current error state of the temperature input

#### sensor

`null` \| `string`

#### temp

`null` \| `string`

### tempRef

`Ref`\<`undefined` \| `HTMLInputElement`\>

the reference to the input element

## Returns

`void`
