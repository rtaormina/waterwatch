# Installation
This section outlines the steps to install WATERWATCH mobile.

## Development

Requirements before install:
- python
- docker

To set up the development environment in VSCode, follow the these steps:
- Download and unpack flutter sdk 3.19.6. You can find all the sdk versions [here](https://docs.flutter.dev/install/archive).
- Install the Flutter VSCode extension
- Hit `Ctrl + Shift + P`, type `flutter` and start creating a new project. VSCode will prompt you that it is missing the Flutter sdk, from that message you can set the path to the sdk to where you saved it in the first step.
- In the terminal, run the following command: 
    ```bash
    flutter pub get
    ``` 
    This installs all necessary dependencies.