# Performance Test Export Endpoint 2
## Test Case ID
`PT-EXPORT-002`

## Title
Export API Performance Test

## Tested By
`Nico Hammer`

## Test Date
`2025-11-06`

## Summary
Test that the API endpoint used for searching and downloading measurements on the export page is performant enough to serve multiple researcher users' downloads simultaneously. This follows the changes that have been made to the database and the backend for measurement exporting.

Options used:
- Max Users: 10
- Ramp up: 1/sec

## Involved test classes
- `ResearcherUser`

## Involved endpoints
- `/api/login/`
- `/api/measurements/search/`

## Expected Result
The endpoint is capable of serving searches and downloads for at least 10 researcher users simultaneously.

## Actual Result
The endpoint is capable of serving searches and downloads for at least 10 researcher users simultaneously.

## Status
- Pass

## Attachments
![Export API Load Test Graphs](attachments/pt-export-002-1.png)

## Additional Notes
The changes to the database and backend for measurement exporting proved successful in improving performance.
