# Function: drawHistogramWithKDE()

> **drawHistogramWithKDE**(`el`, `data`, `barColor`, `lineColor`, `options?`): `void`

Defined in: src/composables/Analysis/DataVisualizationLogic.ts:155

Draws a single‐group histogram with an overlaid KDE curve.

## Parameters

### el

`HTMLElement`

The container HTMLElement.

### data

`number`[]

An array of numeric values (e.g. temperatures).

### barColor

`string`

CSS color for the histogram bars (e.g. "#1f449c").

### lineColor

`string`

CSS color for the KDE curve (e.g. "#f05039").

### options?

#### bandwidth?

`number`

#### barOpacity?

`number`

#### numBins?

`number`

#### numKdePoints?

`number`

## Returns

`void`
