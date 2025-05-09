
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

#  WATERWATCH
WATERWATCH is global citizen science platform for tracking water temperatures and climate change impacts.
## Live website
The live production version of [WATERWATCH](https://waterwatch.tudelft.nl)

## Installation
Requirements before install:
- python
- docker

Install required packages:
```bash
sudo apt-get update && sudo xargs apt-get install -y < packages.txt
```


Linux:
```bash
docker compose up -d
```

The first time after running execute the following to setup the database and create an admin user.
```bash
docker exec backend python manage.py makemigrations
docker exec backend python manage.py migrate
docker exec -it backend python manage.py createsuperuser
```

For development run in a different terminal:
```bash
npm run build -w
```
This makes sure that the frontend pages of the Nginx server are updated whenever there are changes.


## Usage
After installation the project will run at [localhost](http://127.0.0.1/).


## Support

### Troubleshooting common issues
- If it cannot find the database make sure no other instance of postgres is currently running

## Contributing

### Pre-commit
For contributing to ensure a consitent formatting and quality of the code make sure that [pre-commit](https://pre-commit.com/) is installed. This can be done via the installation of `dev-requirements`. Or by running `python -m pip install pre-commit`.
After pre-commit is installed. run `pre-commit install` to create the commit hook. This makes sure that the pre-commit hooks will be run before commiting.


## License
[MIT](./LICENSE)


## Roadmap

## Authors and acknowledgment
