#!/bin/bash
set -e

npx typedoc \
  --plugin typedoc-plugin-markdown \
  --plugin typedoc-plugin-vue \
  --tsconfig tsconfig.app.json \
  --entryPointStrategy expand \
  --excludeExternals \
  --readme none \
  src/composables \
  --out ../docs/ts




npx vue-docgen src/components ../docs/vue-components
npx vue-docgen src/views ../docs/vue-views

cd ../docs/ts

rm -f README.md

cd ../vue-views

(
  echo "# Vue Views"
  echo "this is a list of all Vue views in the application."
  echo "\```\```\```{eval-rst}"
  echo ".. toctree::"
  echo "   :maxdepth: 4"
  echo
  find . -maxdepth 4 -type f -name '*.md' ! -name 'modules.md' \
    | sort \
    | sed -E 's#^\./(.+)\.md#   \1#'
  echo "\```\```\```"
) > modules.md

cd ../vue-components

(
  echo "# Vue Components"
  echo "this is a list of all Vue components in the application."
  echo "\```\```\```{eval-rst}"
  echo ".. toctree::"
  echo "   :maxdepth: 4"
  echo
  find . -maxdepth 4 -type f -name '*.md' ! -name 'modules.md' \
    | sort \
    | sed -E 's#^\./(.+)\.md#   \1#'
  echo "\```\```\```"
) > modules.md

cd ../ts

(
  echo "# Composables"
  echo "this is a list of all composables in the application."
  echo "\```\```\```{eval-rst}"
  echo ".. toctree::"
  echo "   :maxdepth: 4"
  echo
  find . -maxdepth 2 -type f -name '*.md' ! -name 'modules.md' \
    | sort \
    | sed -E 's#^\./(.+)\.md#   \1#'
  echo "\```\```\```"
) > modules.md
