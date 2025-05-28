# SearchResultsComponent

## Props

| Prop name        | Description | Type                               | Values | Default |
| ---------------- | ----------- | ---------------------------------- | ------ | ------- |
| results          |             | { count: number; avgTemp: number } | -      |         |
| searched         |             | boolean                            | -      |         |
| showModal        |             | boolean                            | -      |         |
| filtersOutOfSync |             | boolean                            | -      |         |
| temperatureUnit  |             | union                              | -      |         |
| format           |             | union                              | -      |         |

## Events

| Event name    | Properties | Description |
| ------------- | ---------- | ----------- |
| update:format |            |
| download      |            |
| close-modal   |            |

## Expose

### avgTempConverted

> Computes the converted average temperature.

### modelFormat

> Two-way bound computed property for the download format.

---
