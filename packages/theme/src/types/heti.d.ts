// Declare the Heti module
declare module 'heti/umd/heti-addon.min.js' {
  // No concrete content needed; only declare that the module exists
}

// Declare the Heti type
interface HetiConstructor {
  new (selector: string): {
    autoSpacing: () => void
  }
}

// Augment the global Window interface
declare global {
  interface Window {
    Heti: HetiConstructor
  }
}

export {}
