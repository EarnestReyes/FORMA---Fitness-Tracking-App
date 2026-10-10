const parser = require('@typescript-eslint/parser');
module.exports = [
  { ignores: ['node_modules/**', '.expo/**', 'dist/**', 'vendor/**', '.npm-cache/**'] },
  { files: ['src/**/*.ts', 'src/**/*.tsx'], languageOptions: { parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } }, rules: { 'no-debugger': 'error', 'no-constant-condition': 'error', 'no-duplicate-case': 'error', 'no-empty': ['error', { allowEmptyCatch: true }], 'no-unreachable': 'error', 'valid-typeof': 'error' } },
];
