import { buildShareUrl } from '../collaboration/collabSession';
import { useCollaboration } from '../collaboration/CollaborationProvider';
import { useToast } from './Toast';

export function CollabBanner() {
  const collab = useCollaboration();
  const { showToast } = useToast();

  if (!collab.roomId) return null;

  const copyLink = async () => {
    const url = buildShareUrl(collab.roomId!);
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      showToast(url, 'info');
    }
  };

  const editors =
    collab.status === 'connected'
      ? collab.peerCount > 0
        ? `${collab.peerCount + 1} people editing`
        : 'Waiting for others to join'
      : 'Connecting to live session…';

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs text-violet-200 sm:px-6 sm:text-sm print:hidden">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            collab.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
          }`}
          aria-hidden
        />
        <span>
          <strong className="font-medium text-violet-100">Live board</strong> · {editors}
        </span>
      </div>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-md border border-violet-500/30 px-2.5 py-1 text-[11px] font-medium text-violet-200 transition hover:bg-violet-500/20 sm:text-xs"
      >
        Copy share link
      </button>
    </div>
  );
}
