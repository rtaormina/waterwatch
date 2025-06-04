## Test Case ID
`PT-EXPORT-001`

## Title
Export API Performance Test

## Tested By
`Erik Koprivanacz`

## Test Date
`2025-06-04`

## Summary
Test that the API endpoint that is used for searching and downloading measurements on the export page is performant enough to serve multiple researcher user's downloads at the same time.

Options used:
- Max Users: 10
- Ramp up: 1/sec

## Involved test classes
- `ResearcherUser`

## Involved endpoints
- `/api/login/`
- `/api/measurements/search/`


## Expected Result
The endpoint is able to serve the searches and downloads of at least 10 researcher users simultaneously.

## Actual Result
The normal search requests that only show aggregated data and do not download anything get served properly, however the downloads time out.

## Status
- Fail

## Severity (if failed)
- High

## Description of failure
The API endpoint is unable to collect all the data and parse it to the proper format. Adding DB optimization and/or changing how downloading a file works is necessary.

## Attachments
![Export API Load Test Graphs](attachments/pt-export-001-1.png)

![Export API Load Test Table](attachments/pt-export-001-2.png)

## Additional Notes
