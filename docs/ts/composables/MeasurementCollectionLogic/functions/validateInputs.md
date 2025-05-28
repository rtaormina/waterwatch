[**frontend**](../../../README.md)

***

[frontend](../../../modules.md) / [composables/MeasurementCollectionLogic](../README.md) / validateInputs

# Function: validateInputs()

> **validateInputs**(`longitude`, `latitude`, `waterSource`, `sensor`, `tempVal`, `selectedMetrics`, `errors`, `time`, `tempUnit`): `boolean`

Defined in: src/composables/MeasurementCollectionLogic.ts:58

Validates the input values required for a measurement collection operation.

## Parameters

### longitude

The longitude value, or `undefined` if not provided.

`undefined` | `number`

### latitude

The latitude value, or `undefined` if not provided.

`undefined` | `number`

### waterSource

`string`

The name or identifier of the water source.

### sensor

`string`

The sensor identifier or name.

### tempVal

`string`

The temperature value as a string.

### selectedMetrics

`string`[]

An array of selected metric names.

### errors

An object containing possible error messages for temperature, sensor, minutes, and seconds.

#### mins

`null` \| `string`

#### sec

`null` \| `string`

#### sensor

`null` \| `string`

#### temp

`null` \| `string`

### time

An object containing the minutes and seconds as strings.

#### mins

`string`

#### sec

`string`

### tempUnit

`string`

The unit of temperature measurement ("C" for Celsius or "F" for Fahrenheit).

## Returns

`boolean`

`true` if all required inputs are valid; otherwise, `false`.
