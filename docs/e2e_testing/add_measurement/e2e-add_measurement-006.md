## Test Case ID
`E2E-ADD_MEASUREMENT-006`

## Title
Try to add a measurement with some data

## Tested By
`Erik Koprivanacz`

## Test Description
Tries to fill out the form partially, but still expects errors to pop up

## Preconditions

## Test Steps
1. Go to home page
2. Close first time visitor pop up
3. Click on add measurement button
4. Fill out the form with the data below
5. Click on submit button

## Test Data
- Water Source: Network
- Water Temperature: 21.4
- Celsius

## Expected Result
The measurement isn't submitted and the appropriate errors show up

## Browser(s) Tested
- Chromium
- Firefox

## Related Requirement / User Story
#1

## Attachments

## Related Test File
`/frontend/tests/e2e/add-measurement.spec.ts`

## Additional Notes
