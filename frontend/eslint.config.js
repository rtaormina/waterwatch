import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import pluginPrettier from "eslint-plugin-prettier";
import jsdoc from "eslint-plugin-jsdoc";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.js"], languageOptions: { sourceType: "script" } },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },

  // Enforce prettier formatting
  prettier,
  {
    plugins: { prettier: pluginPrettier },
    rules: { "prettier/prettier": "error" },
  },

  // Enforce TypeDoc style
  {
    plugins: { jsdoc },
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
          enableFixer: false,
        },
      ],
    },
  },

  // Ignore rules
  {
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
]);
