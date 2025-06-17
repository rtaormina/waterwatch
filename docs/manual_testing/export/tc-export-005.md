# Manual Test Export 005

## Test Case ID
`TC-EXPORT-005`

## Title
Export with Filters and View in Map

## Tested By
`stella`

## Test Date
`2025-06-17`

## Summary
Apply filters on the export page and visualize the filtered data on the map.

## Preconditions
3+ measurements in different continents with different temperatures.

## Test Steps
1. Open the export page
2. Filter by a continent that has measurements
3. Select view in map
4. Toggle legend to count
5. Toggle time range
6. Click go back

## Test Data
n/a

## Expected Result
The matching filtered data should appear on the map with no other data. When toggling the legend should function normally and the time range should work to filter out measurements by month. Going back should maintain the preselected filters.

## Actual Result
Mostly working, there are some issues with the legend.

## Status
- Fail

## Severity (if failed)
- Low:
The time range defaults to past 30 days which can be misleading for users who are filtering by a date that was not in the past 30 days, as it then appears that there were no results for the filter they set. Additionally the legend pointer is not pointing to the legend button but the go back button.

## Environment
| Detail       | Value            |
|--------------|------------------|
| Browser      |  Firefox      |
| OS           |  Windows     |
| Device       |  Laptop         |
| Environment  |  Development         |


## Related Requirement / User Story
#134

## Attachments

## Additional Notes
- another manual test for production should be carried out once this feature is added to production.