/**
 * xiaoshazi Server ESLint Configuration
 * Node.js/Express Server with CommonJS
 */
'use strict';

module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'commonjs',
  },
  rules: {
    // Error handling
    'no-console': 'off', // Allow console for logging in server
    'no-debugger': 'warn',
    
    // Variables
    'no-unused-vars': ['error', { 
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
    }],
    'no-var': 'error',
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'dot-notation': 'warn',
    'no-empty-function': ['warn', { 
      allow: ['constructors', 'methods'] 
    }],
    
    // Node.js specific
    'node/no-missing-require': 'off',
    'node/no-unpublished-require': 'off',
    
    // Style
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2, { 
      SwitchCase: 1,
      VariableDeclarator: 1,
      outerIIFEBody: 1,
      FunctionDeclaration: { parameters: 1, body: 1 },
      FunctionExpression: { parameters: 1, body: 1 },
      CallExpression: { arguments: 1 },
      ArrayExpression: 1,
      ObjectExpression: 1,
      ImportDeclaration: 1,
      flatTernaryExpressions: false,
      ignoredComments: [],
    }],
    'comma-dangle': ['error', 'always-multiline'],
    'arrow-spacing': ['error', { before: true, after: true }],
    'keyword-spacing': ['error', { before: true, after: true }],
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always',
    }],
    
    // Prettier compatibility (disable conflicting rules)
    'brace-style': 'off',
    'comma-spacing': 'off',
    'default-case': 'off',
    'dot-location': 'off',
    'handle-callback-err': 'off',
    'indent': 'off',
    'linebreak-style': 'off',
    'new-cap': 'off',
    'new-parens': 'off',
    'newline-after-var': 'off',
    'no-buffer-constructor': 'off',
    'no-confusing-arrow': 'off',
    'no-extra-parens': 'off',
    'no-extra-semi': 'off',
    'no-floating-decimal': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    'no-multiple-empty-lines': 'off',
    'no-path-concat': 'off',
    'no-spaced-func': 'off',
    'no-tabs': 'off',
    'no-trailing-spaces': 'off',
    'no-unneeded-ternary': 'off',
    'object-curly-spacing': 'off',
    'one-var': 'off',
    'padded-blocks': 'off',
    'quote-props': 'off',
    'require-jsdoc': 'off',
    'semi': 'off',
    'semi-spacing': 'off',
    'space-after-function-name': 'off',
    'space-after-keyword': 'off',
    'space-before-blocks': 'off',
    'space-before-function-parentheses': 'off',
    'space-before-keyword': 'off',
    'space-in-parens': 'off',
    'space-infix-ops': 'off',
    'space-return-throw-case': 'off',
    'space-unary-ops': 'off',
    'spaced-comment': 'off',
    'switch-colon-spacing': 'off',
    'template-curly-spacing': 'off',
    'wrap-iife': 'off',
    'yield-star-spacing': 'off',
  },
  overrides: [
    // Test files
    {
      files: ['**/*.test.js', '**/*.spec.js', 'test/**/*.js'],
      env: {
        mocha: true,
        node: true,
      },
      rules: {
        'no-unused-expressions': 'off',
      },
    },
    // Scripts
    {
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
