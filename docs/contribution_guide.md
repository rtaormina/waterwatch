# Contribution Guide

Outlined in this section are the guidelines for contributing to WATERWATCH.

## Requirements Installation
To avoid having to run individual installation commands, run:
```bash
python -m pip install -r requirements/dev-requirements.txt
```

## Documentation Guidelines
For python files, [numpy documentation style](https://numpydoc.readthedocs.io/en/latest/format.html) must be used.

For files containing typescript, [TypeDoc style](https://typedoc.org/) must be used.

## Style-checking
To ensure consistent code style, contributors will need [ruff](https://docs.astral.sh/ruff/) installed. This can be done by running
```bash
python -m pip install ruff==0.11.8
```
To style-check code, run:
```bash
ruff check --fix
ruff format
```

## Pre-commit
For additional code style checking, contributors must ensure that [pre-commit](https://pre-commit.com/) is installed. This can be done via the installation of `dev-requirements` or by running
```bash
python -m pip install pre-commit
```
After pre-commit is installed, to create the commit hook:
```bash
pre-commit install
```
This makes sure that the pre-commit hooks will be run before commiting.

## Commit Messages
Commit messages should be concise but descriptive and contain information about the changes that can be found in the commit.

## Merging into Main
Changes should never be merged directly into main. Contributions should always be merged into dev first by creating a merge request, and dev is regularly merged into main. When creating a merge request, contributors must use the provided merge request template.

## Testing
Contributions should generally be supported by unit tests. Frontend unit testing is done using [vitest](https://vitest.dev/), backend unit testing is done using django [unittest](https://docs.djangoproject.com/en/5.2/topics/testing/).

Where applicable, end to end testing should also be carried out. End to end testing is done using [Playwright](https://playwright.dev/). Generally if significant changes to the UI/frontend are made these should be supported by an end to end test.

The following commands can be used to run tests:
### Frontend
Unit Tests:
```bash
docker exec frontend npm run test
```
End-to-End Tests:
```bash
docker exec frontend npm run e2e
```

### Backend
```bash
docker exec backend python manage.py test
```
