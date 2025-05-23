# Troubleshooting Common Issues
This section contains information on some common issues and how to solve them. If you are encountering an issue that is not covered in this section, consider filling in a [bug report](contribution_guide.md#reporting-bugs).

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
- If bash cannot find setup.sh (bad interpreter, no such file or directory), run the following:
    ```bash
    sudo apt-get install dos2unix
    dos2unix setup.sh
    ./setup.sh
    ```
