# End-to-End Test Map 001

## Test Case ID
`E2E-MAP-001`

## Title
Add a Measurement and View Hexagon Details

## Tested By
`stella and pieter`

## Test Description
Add a measurement manually. Select the hexagon that the measurement should be added in and ensure that the summary statistics shown are correct. Select view details to ensure that global stats open.

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
        

## Test Steps
1. Add precondition measurements.
2. Navigate to map page.
3. Click add measurement.
4. Fill in the test data.
5. Select submit and click submit on the modal.
6. Navigate to the hexagon at 52,4 latitude longitude.
7. Select hexagon.
8. Verify that the summary statistics are correct.
9. Select 'see details'.
10. Confirm analysis page is open.
11. Close analysis page.
12. Verify that summary statistics are also closed.

## Test Data
Location: latitude 52 longitude 4
Water Source: Well
Sensor: Analog Thermometer
Temperature: 20
Time waited: 5 minutes

## Expected Result
The hexagon should have min of 10 degrees, max 30, and average 25. It should say that there are 3 measurements present.

## Browser(s) Tested
Chromium and Firefox

## Related Requirement / User Story
#103

## Attachments

## Related Test File
`/frontend/tests/e2e/map-flows.spec.ts`

## Additional Notes
