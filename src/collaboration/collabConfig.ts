const COLLAB_WS_PORT = 1234;

function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/** WebSocket URL baked in at build time for production (GitHub Pages, etc.). */
export function getBuiltInCollabWsUrl(): string | undefined {
  const configured = (import.meta.env.VITE_COLLAB_WS_URL as string | undefined)?.trim();
  return configured ? configured.replace(/\/$/, '') : undefined;
}

/** Resolve the sync server URL for the current environment, or null if unavailable. */
export function resolveCollabWsUrl(): string | null {
  const builtIn = getBuiltInCollabWsUrl();
  if (builtIn) return builtIn;

  if (typeof window === 'undefined') return null;

  const { hostname, protocol } = window.location;
  if (isLocalDevHost(hostname)) {
    const wsProtocol = protocol === 'https:' ? 'wss' : 'ws';
    return `${wsProtocol}://${hostname}:${COLLAB_WS_PORT}`;
  }

  return null;
}

export function isCollabServerConfigured(): boolean {
  if (resolveCollabWsUrl() !== null) return true;
  return supportsBroadcastChannelSync();
}

/** True when the published site has no remote WebSocket URL configured. */
export function isProductionWithoutCollabServer(): boolean {
  if (typeof window === 'undefined') return false;
  if (getBuiltInCollabWsUrl()) return false;
  return !isLocalDevHost(window.location.hostname);
}

export function supportsBroadcastChannelSync(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}
