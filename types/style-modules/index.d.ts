declare module '*.css'
declare module '*.scss'
// Side-effect imports of package style bundles (e.g. 'vitepress-theme-link/styles');
// TS 6 requires a declaration for these bare subpath imports (TS2882).
declare module '*/styles'
