/// <reference types="vite/client" />

declare module 'y-webrtc' {
  import type * as Y from 'yjs';

  export class WebrtcProvider {
    constructor(
      roomName: string,
      doc: Y.Doc,
      options?: {
        signaling?: string[];
        password?: string | null;
        awareness?: unknown;
        maxConns?: number;
        filterBcConns?: boolean;
        peerOpts?: Record<string, unknown>;
      },
    );
    on(event: 'synced', callback: (event: { synced: boolean }) => void): void;
    on(
      event: 'peers',
      callback: (event: {
        added: string[];
        removed: string[];
        webrtcPeers: Array<unknown>;
        bcPeers: Array<unknown>;
      }) => void,
    ): void;
    destroy(): void;
  }
}
