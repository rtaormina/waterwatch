# Function: createSVGContainer()

> **createSVGContainer**(`el`, `width`, `height`, `margin`): `Selection`\<`SVGGElement`, `unknown`, `null`, `undefined`\>

Defined in: src/composables/Analysis/DataVisualizationLogic.ts:48

Utility: Creates an SVG container and a top‐level <g> group translated by the margins.

## Parameters

### el

`HTMLElement`

The HTML element to append the <svg> to.

### width

`number`

The inner width (excluding left/right margins).

### height

`number`

The inner height (excluding top/bottom margins).

### margin

An object with { top, right, bottom, left } margins.

#### bottom

`number`

#### left

`number`

#### right

`number`

#### top

`number`

## Returns

`Selection`\<`SVGGElement`, `unknown`, `null`, `undefined`\>

The top‐level <g> group.
