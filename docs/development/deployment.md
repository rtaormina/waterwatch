# Deployment to Production

```{eval-rst}
.. tip::
  Currently a production build exists already and is available at [https://waterwatch.tudelft.nl](https://waterwatch.tudelft.nl).
```

This section will go over the steps and details needed to deploy to a production environment.

```{contents} Table of Contents
:depth: 3
```

## Setting Up a Server from Scratch

This section will outline the requirements needed to setup a server to be ready to serve WATERWATCH. If you work on the primary server of WATERWATCH this is already setup and you can continue to the next sections.

### Setting Up Docker

As WATERWATCH runs in docker containers, docker needs to be installed. For more information about this see the [docker installation manual](https://docs.docker.com/engine/install/).

WATERWATCH uses the Docker Swarm engine with docker Stacks in order to allow for easy rollback of deployments, and while currently not yet supported this also allows for potentially zero-downtime deployements in the future. In order to setup the Docker engine to run in Swarm mode execute the following command:

```bash
docker swarm init
```

#### Setting up the registry

Docker Stack does not allow building images, so the images need to first be built and stored, this is done by utilizing a local registry. In order to spin up a new local registry that is available at port 5000 run:

```bash
docker service create --name registry --publish published=5000,target=5000 registry:2
```

### Enabling HTTPS

The production deployment reroutes all http request to https for better security. In order to allow users to access the website via https you need to acquire SSL certificates. With WATERWATCH these SSL certificates come from [Let's Encrypt](https://letsencrypt.org) with the help of the [certbot ACME client](https://certbot.eff.org).

Then all you need to do is update the servernames in `production/production.nginx` to your domain name.

```{eval-rst}
.. note::
  WATERWATCH expects the SSL certificates to be at `/etc/letsencrypt/` so if they are stored somewhere else either move them or update the `production/production.nginx` settings. Also make sure that the docker container is allowed to read them.
```

```{eval-rst}
.. tip::
  SSL certificates have expiration dates, so in order to make sure that they are never expired setup a cronjob that runs before the expiration data and renews the SSL certificates.
```

### Cloning the Git Repository

In order to deploy WATERWATCH on a server the full project needs to be present. This can be done by cloning the git repository on to the server. In order to conserve space, this can be a shallow clone of only the commit that you want to deploy.

## Deploying to the Server

The following steps will asume that there exists a server with all requirements setup.

### Setup on First Deployement

With a server setup ready to deploy WATERWATCH, there are a few extra steps that need to be taken when it is the first time that a version of WATERWATCH is deployed.
For simplicity a script exists at `production/setup.sh` that executes all of the steps below so there is no need to run all the commands manually. The rest of this section will explain what the script does and what steps are taken.

First a basic deployment is made, this builds the images, pushes them to the registry and then uses docker stack to deploy the images to the production stack.

```bash
docker compose -f docker-compose.prod.stack.yaml build

docker compose -f docker-compose.prod.stack.yaml push

docker stack deploy -c docker-compose.prod.stack.yaml production --prune --detach=false
```

```{eval-rst}
.. note::
  WATERWATCH needs a countries.sql to be aware of the continent and country borders. The countries.sql file can be downloaded from [https://waterwatch.tudelft.nl/countries.sql](https://waterwatch.tudelft.nl/countries.sql) and then needs to be stored in the root assets folder.

```

After the services are running, the database needs to load in the countries.sql file. The following commands copy the sql file to the container and then load in the database, this needs to be done only once as this data will persists in the volume.

```bash
docker cp ../assets/countries.sql $DATABASE:/countries.sql
docker exec "$DATABASE" psql -U admin -d pg4django -f countries.sql
```

Then the database migrations will be made if they were not committed to the codebase already and the database will apply these migrations, creating the tables and indices required.

```bash
docker exec "$BACKEND" python manage.py makemigrations
docker exec "$BACKEND" python manage.py migrate
```

Finally, the next command creates two standard users.

```bash
docker exec "$BACKEND" python manage.py groups
```

An Admin

- username: admin
- password: admin

A Researcher

- username: researcher
- password: researcher

```{eval-rst}
.. warning::
  In order to protect user accounts in the production environment make sure to change these passwords immediately after running the script.
```

### Updating Deployment to a New Version.

If a new version is ready to be deployed, first this version needs to be present on the server. If the git repository was cloned this can be done by pulling in these new changes. Then running the `production/deploy.sh` script will build new images and update the stack with these new images.

```bash
docker compose -f docker-compose.prod.stack.yaml build

docker compose -f docker-compose.prod.stack.yaml push

docker stack deploy -c docker-compose.prod.stack.yaml production --prune --detach=false
```

The script will also rerun the migrations and apply them if anything changed

```bash
docker exec "$BACKEND" python manage.py makemigrations
docker exec "$BACKEND" python manage.py migrate
```

### Clean up

Every time a new deployment is made some data is stored such as the previous containers or local build cache. This can accumulate overtime to quite a significant amount of data. In order to inspect disk usage or prune unnecessary data. The following commands can be run.

```bash
docker system df

docker system prune -af
```
