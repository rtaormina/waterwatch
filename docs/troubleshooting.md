# Troubleshooting Common Issues
This section contains information on some common issues and how to solve them. If you are encountering an issue that is not covered in this section, consider filling in a [bug report](contribution_guide.md#reporting-bugs).

```{contents} Table of Contents
:depth: 3
```

## General Issues

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
- If the following error arises when committing in WSL venv:
    ```bash
    An unexpected error has occurred: CalledProcessError: command: ('/usr/bin/bash', '/mnt/c/Program Files/nodejs/npm', 'pack') 
    return code: 1 
    stdout: (none) 
    stderr: 
        npm error code ERR_INVALID_URL 
        npm error Invalid URL

    ```
    Run the following in WSL venv:
    ```bash
    # Update package list
    sudo apt update 
    # Install Node.js and npm 
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - 
    sudo apt-get install -y nodejs
    ```
- If the following error arises when running npm install:
    ```bash
    npm ERR! code ENOENT
    npm ERR! path 
    ```
    Windows: open Powershell as administrator and navigate to frontend. Run the following:
    ```bash
    # 1) Wipe node_modules and package-lock.json
    npx rimraf node_modules
    del package-lock.json

    # 2) Clear npm’s cache
    npm cache clean --force
    ```
- If the following error occurs when linting backend javascript files while in frontend (e.g. npx eslint --fix backend/measurement_export/static/measurement_export/js/preset_admin.js):
    ```bash

    0:0  warning  File ignored because outside of base path

    ✖ 1 problem (0 errors, 1 warning)

    ```
    Run the following:
    ```bash
    cd ..
    npx eslint --config frontend/eslint.config.js --fix backend/measurement_export/static/measurement_export/js/preset_admin.js
    ````


## Issues with Shell Script (.sh) Files
- If bash cannot find a .sh file, start by running:
    ```bash
    sudo apt-get install dos2unix
    ```
- If bash cannot find setup.sh (bad interpreter, no such file or directory), run the following:
    ```bash
    dos2unix setup.sh
    ./setup.sh
    ```
- If bash cannot find test-setup.sh (bad interpreter, no such file or directory), run the following:
    ```bash
    dos2unix test-setup.sh
    ./test-setup.sh
    ```
- If bash cannot find test-reset-db.sh (bad interpreter, no such file or directory), run the following:
    ```bash
    dos2unix test-reset-db.sh
    ./test-reset-db.sh
    ```
- If the following issue arises when running setup.sh:
    ```bash
    EINTEGRITY 109.3 npm error
    ```
    Run the following:
    ```bash
    npm cache clean --force
    rm -rf node_modules package-lock.json
    docker compose down -v
    ./setup.sh
    ```
