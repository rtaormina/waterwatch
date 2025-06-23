# Function: kernelDensityEstimator()

> **kernelDensityEstimator**(`kernel`, `X`): (`V`) => \[`number`, `number`\][]

Defined in: src/composables/Analysis/DataVisualizationLogic.ts:33

Creates a kernel density estimator function.

## Parameters

### kernel

(`x`) => `number`

A kernel function (e.g. kernelEpanechnikov(bandwidth)).

### X

`number`[]

An array of x-values at which to evaluate the density.

## Returns

A function that takes an array of values V and returns an array of [x, density] pairs.

> (`V`): \[`number`, `number`\][]

### Parameters

#### V

`number`[]

### Returns

\[`number`, `number`\][]
