# End-to-end Test Export 2

## Test Case ID
`E2E-EXPORT-002`

## Title
Add Measurement and Search with All Filters and Download

## Tested By
`Nico Hammer`

## Test Description
On the export page filters are selected, a search is performed and the search results are noted. Measurements are added to the database, search with same filters is performed again and data is downloaded. 

## Preconditions
n/a

## Test Steps
1. Go to export page
2. Select Europe from continent dropdown
3. Deselect all countries from country dropdown
4. Select the Netherlands from country dropdown
5. Select well from water source dropdown
6. Check temperature checkbox
7. Switch unit to fahrenheit
8. Filter between 68 and 68 degrees fahrenheit
9. Filter from 2024-01-01 to 2024-01-01
10. Add one time slot from 09:00-09:00
11. Click search and note the number of search results and average temperature
12. Add measurements from test data via API
13. Click search on export page again
14. Ensure that the number of measurements and average have been changed according to added measurements
15. Click format selection button
16. Select JSON
17. Click download button
18. Ensure measurement added via API is included in the downloaded file

## Test Data
Measurements added:
```typescript
        measurementTheHague = {
            timestamp: "2024-01-01T09:00:00Z",
            localDate: "2024-01-01",
            localTime: "09:00:00",
            latitude: 52.08,
            longitude: 4.32,
            waterSource: "well",
            temperature: { sensor: "analog thermometer", value: 20.0, time_waited: 3 },
        };
```
## Expected Result
- Number of measurements increases by 1
- Average is reported accurately based on preexisting measurements in database and new measurements added
- Measurement included in downloaded file
## Browser(s) Tested
- Chromium
- Firefox
## Related Requirement / User Story
#9

## Attachments

## Related Test File
`/frontend/tests/e2e/measurement-export.spec.ts`

## Additional Notes
