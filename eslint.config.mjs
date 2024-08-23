// eslint.config.mjs
import pkg from 'eslint';
const { defineConfig } = pkg;

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
    'no-console': 'warn',  // Warn about console statements
    'no-unused-vars': 'warn',  // Warn about variables that are declared but not used
  },
});
