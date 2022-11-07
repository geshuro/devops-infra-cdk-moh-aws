module.exports = {
  extends: [
    'plugin:jest/recommended',
    'airbnb-base',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    "plugin:you-dont-need-lodash-underscore/compatible"
  ],
  plugins: ['jest', 'prettier', 'react', '@typescript-eslint', 'you-dont-need-lodash-underscore'],
  rules: {
    // 'prettier/prettier': ['error'], // TODO: throws errors on "import type {"
    'prefer-destructuring': 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',
    'no-useless-constructor': 'off',
    'no-shadow': 'off',
    'no-new': 'off',
    'no-unused-vars': 'off',
    'no-await-in-loop': 'off',
    'class-methods-use-this': 'off',
    'guard-for-in': 'off',
    'no-use-before-define': 'off',
    'no-restricted-syntax': 'off',
    'lines-between-class-members': 'off',
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'jest/no-standalone-expect': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/jsx-filename-extension': 'off',
    'react/destructuring-assignment': 'off',
    'react/sort-comp': 'off',
    'react/prop-types': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/array-type': [
      'error',
      {
        default: 'array',
      },
    ],
  },
  env: {
    'jest/globals': true,
    'es6': true,
  },
  parser: '@typescript-eslint/parser',
  settings: {
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'jest': {
      version: 26,
    },
  },
};
