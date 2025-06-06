# End-to-end Test Export 4

## Test Case ID
`E2E-EXPORT-004`

## Title
Selecting Preset in Export Page Applies Filters Correctly
## Tested By
`Nico Hammer`

## Test Description
Add preset as admin with various filters selected, apply preset in export page.

## Preconditions
n/a

## Test Steps
1. Go to admin page
2. Add preset
3. Go to export page
4. Click on search bar
5. Search for name of preset
6. Ensure the preset appears
7. Select the preset
8. Ensure the filters applied in the filter panel are the same as those added in the admin console.

## Test Data
```typescript
const presetOptsAllFilters: AddPresetOpts = {
        name: "All Filters",
        description: "This is a test preset for export functionality.",
        isPublic: true,
        filters: {
            continents: ["Europe"],
            countries: ["Netherlands"],
            waterSources: ["Well"],
            temperatureEnabled: true,
            temperatureRange: [10, 30],
            temperatureUnit: "C",
            dateRange: ["2025-01-01", "2025-12-31"],
            timeSlots: [
                { start: "08:00", end: "10:00" },
                { start: "14:00", end: "16:00" },
                { start: "18:00", end: "20:00" },
            ],
        },
    };
```
## Expected Result
- Preset is applied correctly
## Browser(s) Tested
- Chromium
- Firefox
## Related Requirement / User Story
#9
#127
#132

## Attachments

## Related Test File
`/frontend/tests/e2e/export-presets.spec.ts`

## Additional Notes
