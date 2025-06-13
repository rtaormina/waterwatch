# Manual Test Export 001

## Test Case ID
`TC-EXPORT-001`

## Title
Initial export all data test

## Tested By
`Stella`

## Test Date
`2025-05-26`

## Summary
From homescreen, navigate to Data page and export entire dataset.

## Preconditions
Only two measurements with the associated temperature data should be in the database as follows:

Measurement 1:
Location: TU Delft library (manually selected)
Water Source: well
Metric type: temperature
Sensor Type: analog thermometer
Temperature value: 30 (celsius)
Time waited: 1 min 15 sec

Measurement 2:
Location: EEMCS (manually selected)
Water Source: well
Metric type: temperature
Sensor Type: digital thermometer
Temperature value: 12 (celsius)
Time waited: 0 min 32 sec


## Test Steps
1. Click the Data button on the nav bar to open export page
2. Log in as researcher
3. open data page and check temperature box
4. Select CSV, download
5. Select XML, download
6. Select JSON, download
7. Select GeoJSON, download

## Test Data
n/a

## Expected Result
In the initial attempt to export, the user should be blocked as they do not have the researcher role. After logging in, the user should be able to download CSV, XML, JSON, and GeoJSON files containing the two measurements and temperatures detailed in the preconditions in the appropriate data format.

## Actual Result
Matches expected

## Status
- Pass


## Severity (if failed)
n/a

## Environment
| Detail       | Value            |
|--------------|------------------|
| Browser      |   Chrome     |
| OS           |   Windows    |
| Device       |   Laptop        |
| Environment  |   Development        |


## Related Requirement / User Story
#5

## Attachments

## Additional Notes
