# Manual Test Analysis 002

## Test Case ID
`TC-ANALYSIS-002`

## Title
Hexagon Comparison and Viewing Analysis

## Tested By
`stella`

## Test Date
`2025-06-13`

## Summary
Select different cases of hexagon comparison and viewing the associated analysis. The cases include:
- disjoint groups
- intersecting groups
- Groups from different zoom levels
- Equal groups

## Preconditions
n/a

## Test Steps
1. Open map page, open the options and select comparing hexagons.
2. Select two groups consisting of multiple hexagons that are disjoint and click select to view analysis
3. Select groups consisting of multiple hexagons with some hexagons in common (intersecting) and click select to view analysis
4. Select groups consisting of multiple hexagons at different zoom levels and click select to view analysis
5. Select the same group of hexagons twice and click select to view analysis.

## Test Data
n/a

## Expected Result
For disjoint:
- the correct distribution for both groups is shown and all measurements belong to only one group
For intersecting:
- the correct distribution for both groups is shown and there are some measurements belonging to both groups
For different zoom levels:
- the correct distribution for both groups is shown and the correct hexagons are highlighted
For the same group:
- the correct distribution is shown and the same for both groups

## Actual Result
As expected

## Status
- Pass

## Severity (if failed)
n/a

## Environment
| Detail       | Value            |
|--------------|------------------|
| Browser      |  Firefox      |
| OS           |  Windows     |
| Device       |  Laptop         |
| Environment  |  Production         |


## Related Requirement / User Story
#129

## Attachments

## Additional Notes
