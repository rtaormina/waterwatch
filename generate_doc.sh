#!/bin/bash
set -e

npx typedoc \
  --plugin typedoc-plugin-markdown \
  --plugin typedoc-plugin-vue \
  --tsconfig frontend/tsconfig.app.json \
  --entryPointStrategy expand \
  frontend/src \
  --out docs/ts


npx vue-docgen frontend/src/components docs/vue-components
npx vue-docgen frontend/src/views docs/vue-views

cd docs/vue-components

(   echo "# Vue Components";   echo;   find . -maxdepth 4 -type f -name '*.md' ! -name 'modules.md'     | sort     | sed -E 's#^\./(.+)\.md#- [\1](\1.md)#'; ) > modules.md

cd ../vue-views

(   echo "# Vue Views";   echo;   find . -maxdepth 4 -type f -name '*.md' ! -name 'modules.md'     | sort     | sed -E 's#^\./(.+)\.md#- [\1](\1.md)#'; ) > modules.md
