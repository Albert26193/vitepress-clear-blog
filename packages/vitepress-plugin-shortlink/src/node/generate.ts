/** Escapes a string for safe use inside HTML text and attribute contexts. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * Renders a static redirect page that lands on `target`. Three mechanisms make
 * the redirect work even when scripts are blocked: a JS `location.replace`
 * (seamless, not added to history), a meta-refresh fallback, and a plain anchor
 * link. Pages are marked `noindex` so short URLs never compete with the real
 * article in search results.
 */
export const renderRedirectPage = (
  target: string,
  delaySeconds = 0
): string => {
  const escaped = escapeHtml(target)
  const jsTarget = JSON.stringify(target)
  const delay = Math.max(0, delaySeconds)
  const refresh = delay > 0 ? `${delay}; url=${escaped}` : `0; url=${escaped}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="${refresh}">
<script>location.replace(${jsTarget})</script>
</head>
<body>
<p><a href="${escaped}">Redirecting…</a></p>
</body>
</html>
`
}
