[**frontend**](../../README.md)

***

[frontend](../../README.md) / [MeasurementCollectionLogic](../README.md) / createPayload

# Function: createPayload()

> **createPayload**(`data`, `selectedMetrics`): `object`

Defined in: src/composables/MeasurementCollectionLogic.ts:176

Creates a payload object for measurement collection.

## Parameters

### data

`MaybeRefOrGetter`\<[`MeasurementData`](../type-aliases/MeasurementData.md)\>

The measurement data containing location, water source, and temperature information.

### selectedMetrics

`MaybeRefOrGetter`\<`"temperature"`[]\>

An array of selected metrics to include in the payload.

## Returns

`object`

the payload

### local\_date

> **local\_date**: `string`

### local\_time

> **local\_time**: `string`

### location

> **location**: `object`

#### location.coordinates

> **coordinates**: `number`[]

#### location.type

> **type**: `string` = `"Point"`

### temperature

> **temperature**: `undefined` \| \{ `sensor`: `undefined` \| [`TemperatureSensor`](../type-aliases/TemperatureSensor.md); `time_waited`: `string`; `value`: `undefined` \| `number`; \}

### timestamp

> **timestamp**: `string`

### water\_source

> **water\_source**: `undefined` \| [`WaterSource`](../type-aliases/WaterSource.md) = `measurementData.waterSource`
