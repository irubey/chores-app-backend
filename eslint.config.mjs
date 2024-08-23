// eslint.config.mjs
import { defineConfig } from 'eslint';

export default defineConfig({
  parser: '@babel/eslint-parser',
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
  },
  plugins: [
  ],
});
