const configPrettier = {
  printWidth: 80,
  tabWidth: 2, // Specify the number of spaces per indentation-level.
  useTabs: false, // Indent lines with tabs instead of spaces.
  semi: false, // true (default): Add a semicolon at the end of every statement. false: Only add semicolons at the beginning of lines that may introduce ASI failures.
  vueIndentScriptAndStyle: true, // Indent script and style tags in Vue files
  singleQuote: true, // Use single quotes instead of double quotes
  quoteProps: 'as-needed', // Only add quotes around object properties where required.
  bracketSpacing: true, // Print spaces between brackets in object literals.
  trailingComma: 'none', // "none": No trailing commas. "es5": Trailing commas where valid in ES5 (objects, arrays, etc.). "all": Trailing commas wherever possible (including function arguments).
  bracketSameLine: false, // Put the > of a multi-line HTML element at the end of the last line instead of being alone on the next line (does not apply to self closing elements).
  jsxSingleQuote: false, // Use single quotes instead of double quotes in JSX.
  arrowParens: 'always', // Always include parens around a sole arrow function parameter.
  insertPragma: false, // Insert @format pragma into file's first docblock comment.
  requirePragma: false, // Require @prettier pragma to be present in the file's first docblock comment for the file to be formatted.
  proseWrap: 'never', // Wrap prose if it exceeds the print width.
  htmlWhitespaceSensitivity: 'strict', // All whitespace in and around all tags is considered significant.
  endOfLine: 'lf', // Ensure to use only (\n) line endings in text files, common on Linux and macOS as well as inside git repos.
  rangeStart: 0, // Format only a segment of a file, starting at the beginning of the file.
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: ['^@core/(.*)$', '^@server/(.*)$', '^@ui/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true
}

export default configPrettier
