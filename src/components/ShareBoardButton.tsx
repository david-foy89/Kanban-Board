import { useState } from 'react';
import {
  buildShareUrl,
  getRoomIdFromUrl,
  isCollabHost,
  isCollabServerConfigured,
  isProductionWithoutCollabServer,
  navigateToRoom,
  startCollabSession,
  startNewShareSession,
} from '../collaboration/collabSession';
import { useCollaboration } from '../collaboration/CollaborationProvider';
import { useToast } from './Toast';

export function ShareBoardButton() {
  const collab = useCollaboration();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (isProductionWithoutCollabServer()) {
      showToast(
        'Live share on GitHub Pages needs a sync server. Deploy collab-server and set COLLAB_WS_URL — see README.',
        'info',
      );
      return;
    }

    if (!isCollabServerConfigured()) {
      showToast('Sync server not available. Run npm run dev to start the local server.', 'info');
      return;
    }

    let url: string;

    const existingRoom = getRoomIdFromUrl();
    if (existingRoom) {
      if (!collab.roomId) {
        navigateToRoom(existingRoom, isCollabHost());
        startCollabSession(existingRoom);
      }
      url = buildShareUrl(existingRoom);
    } else {
      startNewShareSession();
      url = buildShareUrl(getRoomIdFromUrl()!);
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('Share link copied — anyone with the link can edit live');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Copy this link to share: ' + url, 'info');
    }
  };

  const statusLabel =
    collab.status === 'connecting'
      ? 'Connecting...'
      : collab.status === 'connected'
        ? collab.peerCount > 0
          ? `${collab.peerCount + 1} editing`
          : 'Link ready'
        : collab.status === 'disconnected' && collab.roomId
          ? 'Offline'
          : null;

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-300 transition hover:border-violet-500/60 hover:bg-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30 sm:text-sm"
      title={
        isProductionWithoutCollabServer()
          ? 'Deploy collab-server and set COLLAB_WS_URL for live share on GitHub Pages'
          : 'Create a link others can use to edit this board in real time'
      }
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
      </svg>
      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share live'}</span>
      <span className="sm:hidden">{copied ? 'Copied' : 'Share'}</span>
      {statusLabel && collab.roomId && (
        <span
          className={`hidden rounded-full px-1.5 py-0.5 text-[10px] lg:inline ${
            collab.status === 'connected'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {statusLabel}
        </span>
      )}
    </button>
  );
}
