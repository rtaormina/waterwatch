[**frontend**](../../README.md)

***

[frontend](../../README.md) / [MeasurementCollectionLogic](../README.md) / getTemperatureInCelsius

# Function: getTemperatureInCelsius()

> **getTemperatureInCelsius**(`temperature`): `undefined` \| `number`

Defined in: src/composables/MeasurementCollectionLogic.ts:35

Converts a temperature value to Celsius, rounding to one decimal place.

If the temperature is already in Celsius ("C"), it returns the value rounded to one decimal.
If the temperature is in Fahrenheit ("F"), it converts it to Celsius and rounds to one decimal.
If the unit is unrecognized, returns `undefined`.

## Parameters

### temperature

[`Temperature`](../type-aliases/Temperature.md)

An object containing the temperature value and its unit ("C" or "F").

## Returns

`undefined` \| `number`

The temperature in Celsius rounded to one decimal place, or `undefined` if the unit is not supported.
