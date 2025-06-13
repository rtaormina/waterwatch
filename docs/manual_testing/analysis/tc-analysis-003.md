# Manual Test Analysis 003

## Test Case ID
`TC-ANALYSIS-003`

## Title
Viewing Global Analysis

## Tested By
`stella`

## Test Date
`2025-06-13`

## Summary
View the global analysis for the past 30 days, Febraury, and all time.

## Preconditions
n/a

## Test Steps
1. Select the global analysis button in the map view for past 30 days (should be active by default)
2. Confirm that all relevant measurements are represented in the analysis
3. Select February and view global analysis
4. Confirm that all relevant measurements are represented in the analysis
5. Select all months and view global analysis
6. Confirm that all relevant measurements are represented in the analysis

## Test Data
n/a

## Expected Result
All measurements visualized and collected in the time frames should be represented in the global analysis when selected.

## Actual Result
There is an issue with displaying the data for analysis. Some data is missing or not included in the final graph for some reason.

## Status
- Fail

## Severity (if failed)
- Medium: feature is still usable and some data is displayed but there is data missing which is misleading.


## Environment
| Detail       | Value            |
|--------------|------------------|
| Browser      |  Firefox      |
| OS           |  Windows     |
| Device       |  Laptop         |
| Environment  |  Production         |


## Related Requirement / User Story
#46

## Attachments

## Additional Notes
