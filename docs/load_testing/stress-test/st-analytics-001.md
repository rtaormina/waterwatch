# Stress Test Analytics Endpoint 1
## Test Case ID
`ST-ANALYTICS-001`

## Title
Test retrieving aggregate data

## Tested By
`Nico Hammer`

## Test Date
`2025-06-15`

## Summary
Test that it is still possible to retrieve aggregate data if the workload is elevated in the application.

Options used:
- Max Users: 300
- Ramp up: 15/sec

## Involved test classes
- `DataAnalysisUser`

## Involved endpoints
- `/api/measurements/aggregated/`

## Expected Result
The application can serve the requests with minimal failure rate.

## Actual Result
The application can serve the requests with minimal failure rate.

## Status
- Pass


## Attachments
![Analysis API Load Test Graphs](attachments/pt-export-002-1.png)
