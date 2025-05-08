
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
python -m venv .venv
source .venv/bin/activate

pip install --no-cache-dir -r requirements/requirements.txt 
docker compose up -d

python backend/manage.py makemigrations && python backend/manage.py migrate
python backend/manage.py runserver

cd frontend
npm install
npm run build

cd ..
```

Windows:
```bash
python -m venv .venv
.venv/Scripts/activate

pip install --no-cache-dir -r requirements/requirements.txt 
docker compose up -d

python backend/manage.py makemigrations && python backend/manage.py migrate
python backend/manage.py runserver

cd frontend
npm install
npm run build

cd ..
```


## Usage
After installation the project will run at [localhost:8000](http://127.0.0.1:8000/).


## Support

### Troubleshooting common issues
- If it cannot find the database make sure no other instance of postgres is currently running

## Contributing

## License
[MIT](./LICENSE)


## Roadmap

## Authors and acknowledgment
