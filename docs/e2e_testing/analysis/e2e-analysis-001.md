# End-to-End Test Analysis 001

## Test Case ID
`E2E-ANALYSIS-001`

## Title
Compare hexagons

## Tested By
`Pieter`

## Test Description
Add 2 measurements, then open the compare hexagons menu and select the added hexagons for comparing, then check if stats are correct

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
3. Click open menu.
4. Click compare hexagons.
5. Zoom to right level
6. Move to correct coordinates.
7. Click on the first hexagon.
8. Confirm that it is selected.
9. Click next group.
10. Move and click on other hexagon.
11. Click compare.
12. Assert that compare menu and the graph pops up.
13. Check that closing works

## Test Data
Location: latitude 52 longitude 4
Water Source: Well
Sensor: Analog Thermometer
Temperature: 20
Time waited: 5 minutes

## Expected Result
The comparison graph should work

## Browser(s) Tested
Chromium and Firefox

## Related Requirement / User Story
#129

## Attachments

## Related Test File
`/frontend/tests/e2e/map-analysis.spec.ts`

## Additional Notes
