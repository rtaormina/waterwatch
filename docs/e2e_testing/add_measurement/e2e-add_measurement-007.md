## Test Case ID
`E2E-ADD_MEASUREMENT-007`

## Title
Try to fill out incorrect temperature

## Tested By
`Erik Koprivanacz`

## Test Description
Checks if the correct error messages show up when trying to enter too low or too high temperature values.

## Preconditions

## Test Steps
1. Go to home page
2. Close first time visitor pop up
3. Click on add measurement button
4. Fill out 100 for temperature
5. Fill out 99.9 for temperature
6. Fill out 0 for temperature
7. Fill out for 0.1 for temperature

## Test Data

## Expected Result
The appropriate error messages show up for 100 and 0, and they disappear when filling out a valid value

## Browser(s) Tested
- Chromium
- Firefox

## Related Requirement / User Story
#1

## Attachments

## Related Test File
`/frontend/tests/e2e/add-measurement.spec.ts`

## Additional Notes
