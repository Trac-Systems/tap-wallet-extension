import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import _import from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import {fixupPluginRules} from '@eslint/compat';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import js from '@eslint/js';
import {FlatCompat} from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends(
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ),
  {
    plugins: {
      react,
      'react-hooks': fixupPluginRules(reactHooks),
      '@typescript-eslint': typescriptEslint,
      import: fixupPluginRules(_import),
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.jest,
        Buffer: true,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      'import/resolver': {
        typescript: {},
      },

      react: {
        version: 'detect',
      },
    },

    rules: {
      quotes: [1, 'single'],
      'no-debugger': 2,
      semi: 0,
      'no-control-regex': 2,
      'linebreak-style': [0, 'error', 'windows'],
      'array-bracket-spacing': [2, 'never'],
      'no-irregular-whitespace': 0,
      'no-trailing-spaces': 1,
      'eol-last': 0,

      'no-unused-vars': [
        1,
        {
          vars: 'all',
          args: 'after-used',
        },
      ],

      'no-underscore-dangle': 0,
      'no-lone-blocks': 0,
      'no-class-assign': 2,
      'no-floating-decimal': 2,
      'no-loop-func': 1,
      'no-cond-assign': 2,
      'no-delete-var': 2,
      'no-dupe-keys': 2,
      'no-duplicate-case': 2,
      'no-dupe-args': 2,
      'no-empty': 2,
      'no-func-assign': 2,
      'no-invalid-this': 0,
      'no-this-before-super': 0,
      'no-undef': 1,
      'no-use-before-define': 0,
      camelcase: 0,
      '@typescript-eslint/no-var-requires': 0,
      'react/display-name': 0,
      'react/react-in-jsx-scope': 0,
      'react/no-unescaped-entities': 0,
      'unused-imports/no-unused-imports': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.tsx'],

    rules: {
      'react/prop-types': 'off',
    },
  },
];
