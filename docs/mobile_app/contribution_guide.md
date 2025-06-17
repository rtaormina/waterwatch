# Contribution Guide
Thank you for your interest in contributing!
In this section you will find the guidelines for contributing and offering suggestions to improve WATERWATCH mobile.

## Contributing
Running `flutter pub get` should install all the necessary dependencies needed to start coding in the project. To start committing code, you also need to install `pre-commit`, instructions on this can be found in the section called [Pre-commit](#Pre-Commit).

### Pre-commit
For additional code style checking, contributors must ensure that [pre-commit](https://pre-commit.com/) is installed. This can be done by running:
```bash
python -m pip install pre-commit
```
After pre-commit is installed, to create the commit hook:
```bash
pre-commit install
```
This makes sure that the pre-commit hooks will be run before commiting.

Sometimes on Windows, the above command will fail and you will get a error such as:
```
'pre-commit' is not recognized as an internal or external command,
operable program or batch file.
```

To resolve this issue run:
```bash
python -m pre_commit install
```

## Commit Messages
Commit messages should be concise but descriptive and contain information about the changes that can be found in the commit.

## Merging into Main
Changes should never be merged directly into main. Contributions should always be merged into dev first by creating a merge request, and dev is regularly merged into main. When creating a merge request, contributors must use the provided merge request template.

## Testing
Testing the mobile app is done using [flutter_test](https://api.flutter.dev/flutter/flutter_test/). Unit and widget tests are used to ensure software quality. 

### Unit Tests
Contributions are expected to be supported with unit tests. Unit tests should test functions in isolation. For more information on unit testing flutter apps see [Flutter docs](https://docs.flutter.dev/testing/overview#unit-tests).

### Widget Tests
Contributions are expected to be supported with widget tests where applicable. Widget tests should test widgets in isolation. For more information on widget testing flutter apps see [Flutter docs](https://docs.flutter.dev/testing/overview#widget-tests).

### Integration Tests
WATERWATCH mobile uses integration tests to test workflows. Integration tests are not required with all contributions but should be conducted in the case of large functionality or workflow changes. For more information on integration testing flutter apps see [Flutter docs](https://docs.flutter.dev/testing/overview#integration-tests).

To run tests please first run:
```bash
docker compose up -d
```
This starts a docker container with the image that will later be used in the pipeline.

To run the unit tests in the project run:
```bash
docker exec mobile-app flutter test test/unit_tests
```

To run the widget tests in the project run:
```bash
docker exec mobile-app flutter test test/widget_tests
```

To run integration tests in the project run:
```bash
fluter test integration_test/{filename}
```

To get coverage information on the project
```bash
docker exec mobile-app ./coverage-tests.sh
```
You can view the results by opening `coverage/index.html`. This can be done by running `start coverage/index.html` on Windows or `open coverage/index.html` on Linux.
