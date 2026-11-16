/** True when the browser can create a WebGL context. */
export function hasWebGL() {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

/** True when the browser can render WebGL and the visitor hasn't asked for less motion or data. */
export function canRun3D() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return false;
  return hasWebGL();
}
