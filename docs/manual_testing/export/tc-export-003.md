# Manual Test Export 003

## Test Case ID
`TC-EXPORT-003`

## Title
Export with Presets

## Tested By
`stella`

## Test Date
`2025-06-15`

## Summary
Apply a preset when exporting and only get the filtered data included in the preset.

## Preconditions
- At least 2 measurements in Europe, one between 0-50 C and one 50-100 C and at least one measurement not in Europe (other details are not important)
- One preset detailed in test data.

## Test Steps
1. Open export page
2. Select 'Europe Warm' from preset list
3. Select search
4. Verify results of search
5. Export as CSV

## Test Data
Preset (any omitted fields can be left blank when preset is created):
Name: Europe Warm
Description: This is a test preset
Created by: admin
Public
Continents: Europe
Enable temperature filtering
Temperature range: 50-100C

## Expected Result
The preset should appear visibly applied once selected in the preset dropdown. Only the measurements in europe with temperature in the 50-100 range should be in the downloaded CSV.

## Actual Result
As expected.

## Status
- Pass

## Severity (if failed)
n/a

## Environment
| Detail       | Value            |
|--------------|------------------|
| Browser      |   Firefox     |
| OS           |   Windows    |
| Device       |   Laptop        |
| Environment  |   Development        |


## Related Requirement / User Story
#127 #132

## Attachments

## Additional Notes
This needs to be tested in production still as the preset adding functionality is currently broken in production 