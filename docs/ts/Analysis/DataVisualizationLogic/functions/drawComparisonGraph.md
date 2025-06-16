[**frontend**](../../../README.md)

***

[frontend](../../../README.md) / [Analysis/DataVisualizationLogic](../README.md) / drawComparisonGraph

# Function: drawComparisonGraph()

> **drawComparisonGraph**(`el`, `vals1`, `vals2`, `options?`): `void`

Defined in: src/composables/Analysis/DataVisualizationLogic.ts:247

Draws two semi‐transparent histograms (Group 1 + Group 2) plus their overlaid KDE curves.

## Parameters

### el

`HTMLElement`

The container HTMLElement.

### vals1

`number`[]

Numeric values for Group 1 (e.g. [11, 12, 12, 13, …]).

### vals2

`number`[]

Numeric values for Group 2 (e.g. [20, 21, 22, …]).

### options?

#### bandwidth?

`number`

#### barColor1?

`string`

#### barColor2?

`string`

#### barOpacity?

`number`

#### lineColor1?

`string`

#### lineColor2?

`string`

#### numBins?

`number`

#### numKdePoints?

`number`

## Returns

`void`
