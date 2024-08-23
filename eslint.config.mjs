import tsParser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import pkg from '@eslint/js';
const { configs } = pkg;
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'dist/**'],
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...configs.recommended.rules, // ESLint recommended rules
      ...tseslint.configs['recommended'].rules, // TypeScript ESLint recommended rules
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-unused-vars': 'warn',
      'react/prop-types': 'off'
    },
    settings: {
    }
  }
];

