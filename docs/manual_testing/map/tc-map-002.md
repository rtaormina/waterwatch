# Manual Test Map 002

## Test Case ID
`TC-MAP-002`

## Title
Select single hexagon to view data

## Tested By
`stella`

## Test Date
`2025-06-13`

## Summary
Select a hexagon to see the basic data overview and click see details to open analytics.

## Preconditions
n/a

## Test Steps
1. Open map page
2. Select a hexagon, test the different ways of closing the popup. Select the hexagon again.
3. Confirm that the measurements existing in the database in the past 30 days are represented in the overview of the hexagon data
4. Click see details and confirm that analytics bar opens.

## Test Data
n/a

## Expected Result
The correct details should be shown on the selected hexagon and the hexagon should be highlighted. When show details is clicked the popup closes, and when clicking away or on the x the popup also closes. When zooming in and out the popup should close. When show details is clicked the analytics should be opened.

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
| OS           |   Windows    |
| Device       |   Laptop        |
| Environment  |   Production        |


## Related Requirement / User Story
#103

## Attachments

## Additional Notes
