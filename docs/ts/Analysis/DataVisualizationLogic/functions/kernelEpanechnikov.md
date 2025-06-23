# Function: kernelEpanechnikov()

> **kernelEpanechnikov**(`bandwidth`): (`v`) => `number`

Defined in: src/composables/Analysis/DataVisualizationLogic.ts:15

Creates an Epanechnikov kernel function with a specified bandwidth.

## Parameters

### bandwidth

`number`

The smoothing bandwidth (h). Larger h → smoother curve.

## Returns

A kernel function that takes a value v and returns the kernel density estimate.

> (`v`): `number`

### Parameters

#### v

`number`

### Returns

`number`
