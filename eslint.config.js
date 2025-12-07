import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import security from 'eslint-plugin-security'
import eslintConfigPrettier from 'eslint-config-prettier'
import testingLibrary from 'eslint-plugin-testing-library'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  { ignores: ['dist', 'public/dist', 'src/wasm', 'public/wasm', '**/*.min.js'] },

  // Base JS rules
  js.configs.recommended,
  security.configs.recommended,

  // TypeScript rules - ONLY for TS files
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),

  // React/Browser config for src
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  // Node config for root files, scripts, and e2e
  {
    files: [
      '*.{js,cjs,mjs,ts}',
      'scripts/**/*.{js,ts}',
      'e2e/**/*.{ts,js}',
      'test-improvements.cjs',
    ],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },

  // Test files config
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: {
      'testing-library': testingLibrary,
    },
    rules: {
      ...testingLibrary.configs.react.rules,
      'testing-library/no-node-access': 'warn', // Downgrade to warn or keep error but allow suppression
    },
  },

  eslintConfigPrettier,
])
