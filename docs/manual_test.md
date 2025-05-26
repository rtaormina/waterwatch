# Manual Testing
To ensure software quality and website usability, WATERWATCH conducts manual tests. These tests follow a [template](manual_testing/template.md) that must be filled out.


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

### Severity

Severity of the bug should be recorded and is defined as follows:
- High: The recorded bug breaks essential functionality and renders the website unusable once the bug has been triggered.
- Medium: The recorded bug disrupts core functionality but a user can recover from or work around it. The website is still usable, although potentially impaired.
- Low: The recorded bug affects the UI or some nonessential feature but not in a way that impacts core functionality.

### Related Requirement / User Story

In this section provide the related epic, issue, or requireement that the bug relates to.

## Manual Test Records
```{eval-rst}
.. toctree::
   :maxdepth: 1

   manual_testing/index.md
```
