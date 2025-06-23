# SearchBarComponent

## Props

| Prop name      | Description | Type    | Values | Default |
| -------------- | ----------- | ------- | ------ | ------- |
| query          |             | string  | -      |         |
| searchDisabled |             | boolean | -      |         |

## Events

| Event name   | Properties | Description |
| ------------ | ---------- | ----------- |
| search       |            |
| apply-preset |            |

## Expose

### clearSearch

> Clears the search input and hides the dropdown.
> This function is called when the clear button is clicked.

### applyPreset

> Applies the selected preset and emits an event to the parent component.
> This function is called when a preset is clicked in the dropdown.

### handleSearch

> Handles the search action when the search button is clicked or Enter key is pressed.
> This emits a search event to the parent component.

### handleFocus

> Handles input focus event to show the dropdown and load presets if not already loaded.

### handleBlur

> Handles input blur event to hide the dropdown after a short delay.
> This allows for click events on dropdown items to register before hiding.

### handleKeydown

> Handles keyboard events for the search input.

---
