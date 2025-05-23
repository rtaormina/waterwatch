[**frontend**](../../../README.md)

***

[frontend](../../../modules.md) / [composables/MeasurementCollectionLogic](../README.md) / createPayload

# Function: createPayload()

> **createPayload**(`tempUnit`, `selectedMetrics`, `temperature`, `tempVal`, `time`, `waterSource`, `longitude`, `latitude`): `object`

Defined in: src/composables/MeasurementCollectionLogic.ts:115

## Parameters

### tempUnit

`string`

### selectedMetrics

`string`[]

### temperature

#### sensor

`string`

#### time_waited

`string`

#### value

`number`

### tempVal

`string`

### time

#### mins

`string`

#### sec

`string`

### waterSource

`string`

### longitude

`undefined` | `number`

### latitude

`undefined` | `number`

## Returns

`object`

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

### timestamp\_local

> **timestamp\_local**: `string` = `localISO`

### water\_source

> **water\_source**: `string` = `waterSource`
