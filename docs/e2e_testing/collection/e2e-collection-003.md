## Test Case ID
`E2E-COLLECTION-003`

## Title
Add a measurement with manual location set

## Tested By
`Erik Koprivanacz`

## Test Description
Adds a measurement with location manually set, checks if the confirmation pop up contains the right text, and checks if the measurement appears on the map in the right location.

## Preconditions
There are no other measurements in the database

## Test Steps
1. Go to home page
2. Close first time visitor pop up
3. Click on add measurement button
4. Fill out the form with the data below
5. Click on a location in the Netherlands in the location fallback
6. Click on submit button
7. Click confirm

## Test Data
- Water Source: Network
- Sensor Type: Analog Thermometer
- Water Temperature: 21.4
- Celsius
- Time Waited: 2min
- Manual Location: lat: 53.0 lon: 4.0

## Expected Result
The measurement gets added without problem and to the right location

## Browser(s) Tested
- Chromium
- Firefox

## Related Requirement / User Story
#1

## Attachments

## Related Test File
`/frontend/tests/e2e/add-measurement.spec.ts`

## Additional Notes
