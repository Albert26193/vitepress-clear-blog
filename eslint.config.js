import pluginJs from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  // Specify file matching patterns and language options
  { files: ['**/*.{js,mjs,cjs,ts,vue}'] }, //["**/*.vue"]

  // Specify global variables and environment
  {
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 12, // Use latest ECMAScript syntax
      sourceType: 'module', // Code is ECMAScript module
      parserOptions: { parser: tseslint.parser } // Use TypeScript parser
    }
  },

  // Used extension configurations and parser options
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  eslintPluginPrettierRecommended,
  // Custom rules
  {
    rules: {
      // 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // Warn about console usage in production, off in development
      // 'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // Warn about debugger usage in production, off in development
      // indent: ['warn', 2], // Use 2 spaces for indentation instead of 4
      // 'linebreak-style': ['warn', 'unix'], // Use Unix-style line endings
      // quotes: ['warn', 'single'], // Use single quotes
      // semi: ['warn', 'never'], // No semicolons at the end of statements
      'no-unused-vars': 'off', // Turn off unused variables warning
      '@typescript-eslint/no-unused-vars': 'off', // Turn off unused variables warning for TypeScript
      'vue/multi-word-component-names': 'off', // Vue component names should be multi-word for better readability and maintainability
      'prettier/prettier': ['error', { singleQuote: true }]
    }
  },
  // Ignored files
  {
    ignores: [
      '**/dist',
      './src/main.ts',
      '.vscode',
      '.idea',
      '*.sh',
      '**/node_modules',
      '*.md',
      '*.woff',
      '*.woff',
      '*.ttf',
      'yarn.lock',
      'package-lock.json',
      '/public',
      '/docs',
      '**/output',
      '.husky',
      '.local',
      '/bin',
      'Dockerfile'
    ]
  }
]
