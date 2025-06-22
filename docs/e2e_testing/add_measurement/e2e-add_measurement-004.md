## Test Case ID
`E2E-ADD_MEASUREMENT-004`

## Title
Clear button clears the form

## Tested By
`Erik Koprivanacz`

## Test Description
Fills out the measurement form and clicks on the clear button to check it clears it, then it clicks the submit button and clicks on the clear button again to check clear button clears errors as well.

## Preconditions
There are no other measurements in the database

## Test Steps
1. Go to home page
2. Close first time visitor pop up
3. Click on add measurement button
4. Fill out the form with the data below
6. Click on clear button
7. Click on submit button
8. Click on clear button

## Test Data
- Water Source: Network
- Sensor Type: Analog Thermometer
- Water Temperature: 21.4
- Celsius
- Time Waited: 2min

## Expected Result
The clear button clears the filled out data, then it clears the errors that showed up from clicking on the submit button without any data filled out.

## Browser(s) Tested
- Chromium
- Firefox

## Related Requirement / User Story
#1

## Attachments

## Related Test File
`/frontend/tests/e2e/add-measurement.spec.ts`

## Additional Notes
It is currently failing, however there is fixed on another branch already so no fixes were implemented here.
