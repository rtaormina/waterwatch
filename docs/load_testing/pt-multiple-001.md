# Performance Test Application 1
## Test Case ID
`PT-MULTIPLE-001`

## Title
Normal application load

## Tested By
`Nico Hammer`

## Test Date
`2025-06-15`

## Summary
Test that the application works under normal user loads.

Options used:
- Max Users: 300
- Ramp up: 15/sec

## Involved test classes
- `WebsiteSubmitter`
- `APISubmitter`
- `CampaignsGetter`
- `TravelerUser`
- `ResearcherUser`
- `DataAnalysisUser`

## Involved endpoints
- `/api/login/`
- `/api/measurements/search/`
- `/api/campaigns/active/`
- `/api/measurements/aggregated/`
- `/contact/`
- `/about/`
- `/tutorial`
- `/export/`
- `/api/measurements/`
- `/`

## Expected Result
The application can function with a small failure rate under normal workloads.

## Actual Result
The application can function with a small failure rate under normal workloads.

## Status
- Pass

## Attachments
![Full API Load Test Graphs](attachments/pt-multiple-001-1.png)
![Full API Failure](attachments/pt-multiple-001-2.png)
