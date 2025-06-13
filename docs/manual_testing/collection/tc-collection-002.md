# Manual Test Collection 002

## Test Case ID
`TC-COLLECTION-002`

## Title
Add Measurement with Specific Date and Time

## Tested By
`stella`

## Test Date
`2025-06-13`

## Summary
Test the user flow where a user is entering a measurement that they took in the past. Ensure that this measurement is immediately visible on the map and persists correctly.

## Preconditions
n/a

## Test Steps
1. Click + button to add measurement
2. Fill in temperature data
3. Press clear
4. Fill in temperature data again
5. Press submit
6. Press confirm
7. Select 'December' from the legend dropdown and confirm that the measurement is visible on the hex map.

## Test Data
Measurement data:
Location: TU Delft library (manually selected)
Water Source: well
Metric type: temperature
Sensor Type: analog thermometer
Temperature value: 30
Time waited: 1 min 15 sec
Date and Time: December 5, 2024 at 13:15

## Expected Result
When toggling to December the measurement should appear on the hex map. It should not appear initially as the default value for the time range is Past 30 Days.

## Actual Result
As expected.

## Status
- Pass

## Severity (if failed)
n/a

## Environment
| Detail       | Value            |
|--------------|------------------|
| Browser      |  Firefox      |
| OS           |   Windows    |
| Device       |   Laptop        |
| Environment  |    Production       |


## Related Requirement / User Story
#1

## Attachments

## Additional Notes
- The scroll bar from the measurement component still appears with the popup to confirm user submission, ideally it would not be visible as this can be confusing. It does not break anything it is just visual.