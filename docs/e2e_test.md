# End-to-end Testing
To test common user flows, WATERWATCH conducts end-to-end tests. These tests ensure that the all parts of the application are functioning correctly when completing the user flows. These tests follow a [template](e2e_testing/template.md) that must be filled out.


## Filling out the Testing Template

### Test Case ID
When recording the test case ID, the following modules are recognized:
- `<Login>`
   - This module refers to testing related to signing in/out or logging in/out as a researcher or admin.
- `<Admin>`
   - This module refers to testing related to the admin console or admin functionality.
- `<Export>`
   - This module refers to testing related to exporting water measurement data.
- `<Collection>`
   - This module refers to testing related to collecting measurement data.
- `<Map>`
   - This module refers to testing related to the map visualizations on the website homepage.
- `<Data-Analysis>`
   - This module refers to testing related to data analysis presented on the homepage when interacting with the map.

### Browsers Tested

In this section provide the browsers this end-to-end test was run in. End-to-end tests are expected to pass in at least Firefox and Chromium.

### Related Requirement / User Story

In this section provide the related epic, issue, or requirement that the bug relates to.

### Related Test File

In this section provide a path or link to the file containing the relevant end-to-end test.

## End-to-end Test Records
```{eval-rst}
.. toctree::
   :maxdepth: 1

   e2e_testing/index.md
```
