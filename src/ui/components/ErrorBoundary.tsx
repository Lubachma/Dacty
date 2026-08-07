import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useT } from '@/i18n';

interface Props {
  children: ReactNode;
  /** changer cette valeur réinitialise le boundary (ex : pathname de la route) */
  resetKey: string;
}

interface State {
  hasError: boolean;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div role="alert" className="py-16 text-center">
      <p className="text-lg font-bold text-err">{t('error.title')}</p>
      <p className="mt-2 text-sm text-muted">{t('error.dataSafe')}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-accent-strong px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          {t('error.retry')}
        </button>
        <Link
          to="/"
          className="rounded-lg border border-line px-4 py-1.5 text-sm font-bold transition-colors hover:border-accent"
        >
          {t('error.home')}
        </Link>
      </div>
    </div>
  );
}

/** Confine une erreur de rendu à la page : header et navigation restent utilisables. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('[dacty] erreur de rendu', error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
  }
}
