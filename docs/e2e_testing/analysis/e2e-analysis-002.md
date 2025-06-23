# End-to-End Test Analysis 002

## Test Case ID
`E2E-ANALYSIS-002`

## Title
Global analytics

## Tested By
`Pieter`

## Test Description
Add 2 measurements, then open the global analytics and check if graph shows up

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
1. Open global analytics
2. Confirm that it opens global analytics
3. Confirm that closing works.

## Test Data
Location: latitude 52 longitude 4
Water Source: Well
Sensor: Analog Thermometer
Temperature: 20
Time waited: 5 minutes

## Expected Result
Global analytics should work

## Browser(s) Tested
Chromium and Firefox

## Related Requirement / User Story
#46

## Attachments

## Related Test File
`/frontend/tests/e2e/map-analysis.spec.ts`

## Additional Notes
