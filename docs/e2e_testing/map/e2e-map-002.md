# End-to-End Test Map 002

## Test Case ID
`E2E-MAP-002`

## Title
Apply Time Range Filters to Map

## Tested By
`stella`

## Test Description
Add measurements in different months and open the legend to toggle the months of measurements being shown.

## Preconditions
Two measurements:
- Measurement 1:
    - timestamp: "2025-05-26T14:30:00Z",
    - localDate: "2025-05-26",
    - localTime: "14:30:00",
    - latitude: 52.0,
    - longitude: 4.0,
    - waterSource: "well",
    - temperature: 
        - sensor: "Analog Thermometer",
        - value: 30,
        - time_waited: 5,
- Measurement 2:
    - timestamp: "2025-05-26T14:30:00Z",
    - localDate: "2025-05-26",
    - localTime: "14:30:00",
    - latitude: 52.0,
    - longitude: 4.0,
    - waterSource: "well",
    - temperature: 
        - sensor: "Analog Thermometer",
        - value: 10,
        - time_waited: 5,
        
- Measurement 3:
    - timestamp: "2025-05-26T14:30:00Z",
    - localDate: "2025-03-26",
    - localTime: "14:30:00",
    - latitude: 52.0,
    - longitude: 4.0,
    - waterSource: "well",
    - temperature: 
        - sensor: "Analog Thermometer",
        - value: 19,
        - time_waited: 5,
    

## Test Steps
1. Add precondition measurements
2. Open map options
3. Open legend
4. Select May from time range
5. Verify that the hexagon at the latitude 52 and longitude 4 has the correct summary stats
6. Open legend
7. Select March from time range
8. Verify that the hexagon at the latitude 52 and longitude 4 has the correct summary stats
9. Open legend
10. Select May from time range (so that it is filtering by May only)
11. Verify that the hexagon at the latitude 52 and longitude 4 only has the stats of the may measurement

## Test Data
n/a

## Expected Result
The two March measurements should only be included in the summary statistics when March is selected from the time filters, same with the one May measurement.

## Browser(s) Tested
Chromium and Firefox

## Related Requirement / User Story
#103

## Attachments

## Related Test File
`/frontend/tests/e2e/map-flows.spec.ts`

## Additional Notes
