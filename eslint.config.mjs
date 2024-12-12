import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import pkg from "@eslint/js";
const { configs } = pkg;
import globals from "globals";
import jest from "eslint-plugin-jest";

export default [
  {
    ignores: ["node_modules/**", "dist/**"],
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
        tsconfigRootDir: ".",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jest,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      jest: jest,
    },
    rules: {
      ...configs.recommended.rules,
      ...tseslint.configs["recommended"].rules,
      indent: ["error", 2],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "single"],
      semi: ["error", "always"],
      "@typescript-eslint/no-unused-vars": ["warn"],
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
      "jest/consistent-test-it": [
        "error",
        { fn: "test", withinDescribe: "it" },
      ],
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/prefer-to-have-length": "warn",
      "jest/valid-expect": "error",
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
          semi: true,
          singleQuote: true,
          trailingComma: "es5",
        },
      ],
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
  },
];
