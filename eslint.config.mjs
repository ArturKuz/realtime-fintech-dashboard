// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// File conventions: imports across folders go through path aliases, never "../".
const noParentImports = {
  group: ['../*'],
  message: 'Use a path alias (@core, @shared, @features, @worker, @testing) instead of "../".',
};
const noTestingInAppCode = {
  group: ['@testing/*'],
  message: 'Test builders, fixtures and fakes may only be imported from spec files.',
};

export default defineConfig([
  globalIgnores(['dist/', 'coverage/', '.angular/', 'public/']),
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      // Project conventions: signals, inject(), @Service(), host metadata.
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/prefer-service-decorator': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/computed-must-return': 'error',
      '@angular-eslint/relative-url-prefix': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'no-restricted-imports': ['error', { patterns: [noParentImports] }],
    },
  },
  {
    // Application code must not depend on test-only code.
    files: ['src/app/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noParentImports, noTestingInAppCode] }],
    },
  },
  {
    files: ['**/*.model.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration, VariableDeclaration, ClassDeclaration',
          message: 'Model files hold interfaces and types only.',
        },
      ],
    },
  },
  {
    files: ['**/*.constants.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration, ArrowFunctionExpression, FunctionExpression',
          message: 'Constant files hold values only; move functions to a *.utils.ts file.',
        },
      ],
    },
  },
  {
    // Node build scripts and tool configs.
    files: ['**/*.mjs'],
    extends: [eslint.configs.recommended],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly' },
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-class-binding': 'error',
      '@angular-eslint/template/prefer-style-binding': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/eqeqeq': 'error',
    },
  },
  prettier,
]);
