import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        marked: 'readonly',
        DOMPurify: 'readonly',
        search: 'readonly',
        modal: 'readonly',
        render: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      'no-console': 'off',
      'no-undef': 'error',
      'no-empty': 'off',
      'no-irregular-whitespace': 'off',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'semi': 'off',
      'quotes': 'off',
      'indent': 'off',
      'eqeqeq': 'off',
      'no-eval': 'error',
      'no-implied-eval': 'error'
    }
  }
];