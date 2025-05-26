# Manual Test Collection 001

## Test Case ID
`TC-COLLECTION-001`

## Title
Initial adding measurement with temperature test

## Tested By
`Stella`

## Test Date
`2025-05-26`

## Summary
From homescreen, navigate to add measurement page and add a measurement.

## Preconditions
n/a

## Test Steps
1. Click + button to add measurement
2. Fill in temperature data
3. Press clear
4. Fill in temperature data again
5. Press submit
6. Press confirm

## Test Data
Measurement data:
Location: TU Delft library (manually selected)
Water Source: well
Metric type: temperature
Sensor Type: analog thermometer
Temperature value: 30
Time waited: 1 min 15 sec

## Expected Result

- Measurement should be added to database meaning a temperature entry and measurement entry are present
- We should be returned to the map screen and the add measurement screen should be reset

## Actual Result

- Measurement was added but the measurement screen was not reset, meaning that the text "sensor type is required" stayed on the page.
- Measurements with time waited of 0 were able to be added.

## Status
- Fail

## Severity (if failed)
- Medium

## Environment
| Detail       | Value            |
|--------------|------------------|
| Browser      |    Chrome   |
| OS           |    Windows   |
| Device       |    Laptop       |
| Environment  |    Development       |


## Related Requirement / User Story
#1

## Attachments

## Additional Notes

- The UI goes all the way to the edges of the screen, it would be nice to add some margin.
