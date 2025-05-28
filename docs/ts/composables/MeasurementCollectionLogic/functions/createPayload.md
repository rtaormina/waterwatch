[**frontend**](../../../README.md)

***

[frontend](../../../modules.md) / [composables/MeasurementCollectionLogic](../README.md) / createPayload

# Function: createPayload()

> **createPayload**(`tempUnit`, `selectedMetrics`, `temperature`, `tempVal`, `time`, `waterSource`, `longitude`, `latitude`): `object`

Defined in: src/composables/MeasurementCollectionLogic.ts:114

Creates a payload object for measurement collection.

## Parameters

### tempUnit

`string`

The unit of temperature measurement ("C" for Celsius or "F" for Fahrenheit).

### selectedMetrics

`string`[]

An array of selected metric names to include in the payload.

### temperature

An object containing temperature information

#### sensor

`string`

#### time_waited

`string`

#### value

`number`

### tempVal

`string`

The raw temperature value as a string (to be parsed and converted).

### time

An object containing the time waited for the measurement

#### mins

`string`

#### sec

`string`

### waterSource

`string`

The water source.

### longitude

The longitude coordinate

`undefined` | `number`

### latitude

The latitude coordinate

`undefined` | `number`

## Returns

`object`

the payload

### local\_date

> **local\_date**: `undefined` \| `string`

### local\_time

> **local\_time**: `undefined` \| `string`

### location

> **location**: `object`

#### location.coordinates

> **coordinates**: (`undefined` \| `number`)[]

#### location.type

> **type**: `string` = `"Point"`

### temperature

> **temperature**: `object`

#### temperature.sensor

> **sensor**: `string`

#### temperature.time\_waited

> **time\_waited**: `string`

#### temperature.value

> **value**: `number`

### timestamp

> **timestamp**: `string`

### water\_source

> **water\_source**: `string` = `waterSource`
