import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LEGACY_STORAGE_KEY, PROJECTS_STORAGE_KEY } from '../store/boardPersistence';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Kanban] Render error:', error, info.componentStack);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem(PROJECTS_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
        <h1 className="text-lg font-semibold text-zinc-100">Something went wrong</h1>
        <p className="max-w-md text-sm text-zinc-500">{this.state.message}</p>
        <button
          type="button"
          onClick={this.handleReset}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          Clear saved data and reload
        </button>
      </div>
    );
  }
}
