FROM python:3.13-slim

WORKDIR /home/requirements

# Install GeoDjango dependencies
COPY requirements/packages.txt .
RUN apt-get update && xargs apt-get install -y < packages.txt 

# Install backend dependencies
COPY requirements/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install backend dev dependencies
COPY requirements/dev-requirements.txt .
RUN pip install --no-cache-dir -r dev-requirements.txt

# Default command when running the container without any arguments
CMD [ "python3" ]
