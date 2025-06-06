# End-to-end Test Export 3

## Test Case ID
`E2E-EXPORT-003`

## Title
Modal Shows when Export Fails

## Tested By
`Nico Hammer`

## Test Description
Search for measurements and intercept incoming requests for downloading data to replicate export failure.

## Preconditions
n/a

## Test Steps
1. Go to export page
2. Click search button
3. Intercept any further requests to /api/measurements/search
4. Click download button
5. Ensure export failed shows as an error message

## Test Data

## Expected Result
- Error message is shown
## Browser(s) Tested
- Chromium
- Firefox
## Related Requirement / User Story
#9

## Attachments

## Related Test File
`/frontend/tests/e2e/measurement-export.spec.ts`

## Additional Notes
