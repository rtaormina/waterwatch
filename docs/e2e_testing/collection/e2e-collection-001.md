## Test Case ID
`E2E-COLLECTION-001`

## Title
Add a measurement with normal data

## Tested By
`Erik Koprivanacz`

## Test Description
Adds a measurement with normal data, checks if the confirmation pop up contains the right text, and checks if the measurement appears on the map.

## Preconditions
There are no other measurements in the database

## Test Steps
1. Go to home page
2. Close first time visitor pop up
3. Click on add measurement button
4. Fill out the form with the data below
5. Click on submit button
6. Click confirm

## Test Data
- Water Source: Network
- Sensor Type: Analog Thermometer
- Water Temperature: 21.4
- Celsius
- Time Waited: 2min

## Expected Result
The measurement gets added without problem

## Browser(s) Tested
- Chromium
- Firefox

## Related Requirement / User Story
#1

## Attachments

## Related Test File
`/frontend/tests/e2e/add-measurement.spec.ts`

## Additional Notes
