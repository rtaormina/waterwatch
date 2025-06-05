# End-to-end Test Export 1

## Test Case ID
`E2E-EXPORT-001`

## Title
Add Measurement and Search with No Filters

## Tested By
`Nico Hammer`

## Test Description
On the export page a search with no filters is performed and the search results are noted. Measurements are added to the database, search without filters is performed again. 

## Preconditions
n/a

## Test Steps
1. Go to export page
2. Click search
3. Note the number of search results and average temperature
4. Add measurements from test data via API
5. Click search on export page again
6. Ensure that the number of measurements and average have been changed according to added measurements

## Test Data
Measurements added:
```typescript
        measurementWithTemp = {
            timestamp: "2024-01-01T09:00:00Z",
            localDate: "2024-01-01",
            localTime: "09:00:00",
            latitude: 52.0,
            longitude: 5.0,
            waterSource: "well",
            temperature: { sensor: "analog thermometer", value: 12.5, time_waited: 3 },
        };

        measurementWithoutTemp = {
            timestamp: "2024-06-01T15:30:00Z",
            localDate: "2024-06-01",
            localTime: "15:30:00",
            latitude: 52.1,
            longitude: 5.1,
            waterSource: "network",
        };
```
## Expected Result
- Number of measurements increases by 2
- Average is reported accurately based on preexisting measurements in database and new measurements added
## Browser(s) Tested
- Chromium
- Firefox
## Related Requirement / User Story
#9

## Attachments

## Related Test File
![test file](./../../frontend/tests/e2e/measurement-export.spec.ts)

## Additional Notes
