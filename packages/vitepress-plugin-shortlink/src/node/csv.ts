/** RFC 4180-style escaping for a single CSV cell. */
const escapeCell = (value: string | number): string => {
  const str = String(value)
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

/**
 * Serializes rows to CSV. Ids are arbitrary user strings, so cells that contain
 * a comma, quote or newline are quoted and embedded quotes are doubled.
 */
export const toCsv = (rows: (string | number)[][]): string =>
  rows.map((row) => row.map(escapeCell).join(',')).join('\n') + '\n'
