# Installation
This section outlines the steps to install WATERWATCH.

## Development

Requirements before install:
- python
- docker

Linux:
```bash
./setup.sh
```
After installation the project will run at [localhost](http://127.0.0.1/).


There are two standard users:

Admin
    - username: admin
    - password: admin

Researcher
    - username: researcher
    - password: researcher

Create and activate the python virtual environment with the following commands:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

## Production
Requirements before install:
- docker


```{eval-rst}
.. note::
 In order to be able to access the production build when the host is not equal to 'waterwatch.tudelft.nl' make sure to modify the server_name of the production.nginx from 'waterwatch.tudelft.nl' to the name of the host you will be using (e.g. localhost) before running the script.
```

Linux:
```bash
./production/setup.sh
```
After installation the project will run at [localhost](http://127.0.0.1/).


There are two standard users after executing the script.

Admin
- username: admin
- password: admin

Researcher

- username: researcher
- password: researcher


```{eval-rst}
.. warning::
  In order to protect user accounts in the production environment make sure to change these passwords immediately after running the script.
```