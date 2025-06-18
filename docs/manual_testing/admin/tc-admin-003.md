# Manual Test Admin 002

## Test Case ID
`TC-ADMIN-003`

## Title
Manage Presets as Admin 2

## Tested By
`stella`

## Test Date
`2025-06-17`

## Summary

## Preconditions
n/a 

## Test Steps
1. Open to the admin login and enter the username admin and password admin
2. Select the preset section and select add preset.
3. Enter the test data for the preset and save
4. Navigate to export page and select dropdown to confirm preset is not yet public. Edit preset to make it public in the admin console.
5. Navigate back to the export page and select the dropdown to confirm the preset exists. Select the preset and confirm it is correct.
6. Navigate to admin console
7. Select the preset that was just added and edit with the edited test data
8. Navigate to the export page and select the dropdown to confirm the preset exists. Select the preset and confirm it is correct.
9. Navigate to admin console
10. Select the preset that was added and delete it
11. Navigate to the export page and select the dropdown to confirm the preset does not exist. 

## Test Data
Initial Preset:
Name: Test Preset
Description: This is a test preset
Created by: admin
Private (then switched to public in step 4)
Continents: Europe
Water source: all


Edited Preset (only changed fields included):
Name: Test Preset 2.0
Created by: researcher
Continents: North America, Asia
Temp range: 50-99
Water source: Network, well

## Expected Result
Admin console:
- Upon adding the preset, it should appear in the database and also be visible on the admin console
- Edits to the preset should also be reflected in the admin console and database
- Once the preset is deleted, it should disappear from the admin console and database.
- There should be a prompt when deleting the preset that confirms this action
Export page:
- The initial preset should appear as an option when selecting filters and should apply with the same presets selected 
- Once edited, the preset should still appear as an option with the filters modified to match the change
- Once deleted, the export page should not display the preset

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
| Environment  |   Production       |


## Related Requirement / User Story
#127 #132

## Attachments

## Additional Notes
