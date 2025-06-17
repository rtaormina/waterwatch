# Contribution Guide
Thank you for your interest in contributing!
In this section you will find the guidelines for contributing and offering suggestions to improve WATERWATCH.


```{contents} Table of Contents
:depth: 3
```

## Reporting Bugs
This section contains resources on how to report a bug for WATERWATCH.

Bugs are tracked as [issues](https://gitlab.ewi.tudelft.nl/cse2000-software-project/2024-2025/cluster-e/06c/06c/-/issues) on the WATERWATCH gitlab. Reporting bugs is done by creating an issue and filling in the [bug report template](https://gitlab.ewi.tudelft.nl/cse2000-software-project/2024-2025/cluster-e/06c/06c/-/blob/main/.gitlab/issue_templates/bugreport.md?ref_type=heads). When reporting bugs, try to include as many relevant details as possible to help the community and maintainers understand, reproduce, and fix the behaviors observed.

```{eval-rst}
.. tip::
Before you submit the report, be sure to check out our `troubleshooting steps <troubleshooting.html>`_ to see if the problem is something you can already fix yourself.
```

## Suggesting Improvements
WATERWATCH welcomes suggestions from the community! This section contains information on how to suggest potential improvements to the website.

Suggesting potential features or improvements is done by creating an [issue](https://gitlab.ewi.tudelft.nl/cse2000-software-project/2024-2025/cluster-e/06c/06c/-/issues) and filling in the [feature request template](https://gitlab.ewi.tudelft.nl/cse2000-software-project/2024-2025/cluster-e/06c/06c/-/blob/main/.gitlab/issue_templates/featuresuggestions.md?ref_type=heads). Please provide as many details as possible when filling in this template so that contributors will understand your suggestion and the motivation behind making it.

## Code Contributions
This section contains information on how to contribute to the WATERWATCH code base.

### Requirements Installation
To avoid having to run individual installation commands, run:
```bash
python -m pip install -r requirements/dev-requirements.txt
```

### Documentation Guidelines
For python files, [numpy documentation style](https://numpydoc.readthedocs.io/en/latest/format.html) must be used.

For files containing typescript, [TypeDoc style](https://typedoc.org/) must be used.

### Style-checking
To ensure consistent code style, contributors will need [ruff](https://docs.astral.sh/ruff/) installed. This can be done by running
```bash
python -m pip install ruff==0.11.8
```
To style-check code, run:
```bash
ruff check --fix
ruff format
```

### Pre-commit
For additional code style checking, contributors must ensure that [pre-commit](https://pre-commit.com/) is installed. This can be done via the installation of `dev-requirements` or by running
```bash
python -m pip install pre-commit
```
After pre-commit is installed, to create the commit hook:
```bash
pre-commit install
```
This makes sure that the pre-commit hooks will be run before commiting.

### Commit Messages
Commit messages should be concise but descriptive and contain information about the changes that can be found in the commit.

### Merging into Main
Changes should never be merged directly into main. Contributions should always be merged into dev first by creating a merge request, and dev is regularly merged into main. When creating a merge request, contributors must use the provided merge request template.

### Testing
Contributions should generally be supported by unit tests and manual tests. Frontend unit testing is done using [vitest](https://vitest.dev/), backend unit testing is done using django [unittest](https://docs.djangoproject.com/en/5.2/topics/testing/). Where applicable, fill in a the [manual testing template](../manual_testing/template.md) to record manual tests.

Where applicable, end-to-end testing should also be carried out. End-to-end testing is done using [Playwright](https://playwright.dev/). Generally if significant changes to the UI/frontend are made these should be supported by an end to end test. To ensure that data modified during end-to-end testing does not affect the production database, a separate docker-compose file is used. See below for how to run the test version of WATERWATCH.

The following commands can be used to run tests.
#### Frontend
#### Unit Tests
```bash
docker exec frontend npm run test
```
#### End-to-End Tests:
In case you have a non-test version of WATERWATCH running:
```bash
docker compose down
```
Then:
```bash
./test-setup.sh
cd frontend
npm run e2e
```
In case you want to reset the test database to its initial state, run:
```bash
./test-reset-db.sh
```

#### Backend
```bash
docker exec backend python manage.py test
```

#### Performance tests
To run tests, while to project is running in a Docker container, run the following command in the backend folder:

```bash
locust --host http://localhost --class-picker
```

Following this you can go to [localhost:8089](http://localhost:8089) to conduct the tests in the Locust GUI.
