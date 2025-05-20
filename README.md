
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

#  WATERWATCH
WATERWATCH is global citizen science platform for tracking water temperatures and climate change impacts.
## Live Website
The live production version of [WATERWATCH](https://waterwatch.tudelft.nl)

## Documentation
View the documentation for WATERWATCH [here](https://waterwatch.tudelft.nl/docs).

## Installation

### Development

Requirements before install:
- python
- docker

Linux:
```bash
./setup.sh
```
After installation the project will run at [localhost](http://127.0.0.1/).

There are two standard users
Admin
    -username: admin
    -password: admin
Researcher
    -username: researcher
    -password: researcher

### Production
TODO

## Running Tests

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


## Support

### Troubleshooting common issues
- If something appears to be broken, start troubleshooting by running:
    ```bash
    docker compose down
    docker compose up
    ```
    If this doesn't fix the issue, try rebuilding the project by running:
    ```bash
    docker compose down
    docker compose build --no-cache
    docker compose up
    ```
- If the database cannot be found, make sure no other instance of postgres is currently running
- If hot-reloading is not working, add the following into `/frontend/vite.config.ts` after `plugins`:

    ```bash
    server: {
        watch: {
            usePolling: true,
        },
    },
    ```
- If a service is not terminating, run the following:
    ```bash
    docker ps
    docker stop {container_name}
    docker rm {container_name}
    ```
- If bash cannot find setup.sh, run the following:
    ```bash
    sudo apt-get install dos2unix
    dos2unix setup.sh
    ./setup.sh
    ```

## Contributing
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


## License
[MIT](./LICENSE)

## Authors and Acknowledgment

### Development Team:
- Thomas Bood
- Nico Hammer
- Pieter van den Haspel
- Erik Koprivanacz
- Stella Schultz
### Domain Experts:
- Mirjam Blokker
- Andrea Cominola
- Demetris Eliades
- Riccardo Taormina
### Additional Support:
- Ivo van Kreveld
- Alexandra Marcu


> Additional thanks to everyone who helped in any way, shape, or form.
