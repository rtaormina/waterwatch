## Test Case ID
`ST-ANALYTICS-001`

## Title
Test retrieving aggregate data

## Tested By
``

## Test Date
`2025-06-04`

## Summary
Test that it is still possible to retrieve aggregate data if the workload is elevated in the application.

Options used:
- Max Users: 100
- Ramp up: 10/sec

## Involved test classes
- `DataAnalysisUser`

## Involved endpoints
- `/api/measurements/aggregated/`

## Expected Result
The application is able to serve the requests with minimal failure rate.

## Actual Result


## Status
- Pass
- Fail

## Severity (if failed)
- High
- Moderate
- Low

## Description of failure


## Attachments


## Additional Notes
