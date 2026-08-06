import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router';

interface Props {
  children: ReactNode;
  /** changer cette valeur réinitialise le boundary (ex : pathname de la route) */
  resetKey: string;
}

interface State {
  hasError: boolean;
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
    return (
      <div role="alert" className="py-16 text-center">
        <p className="text-lg font-bold text-err">Une erreur est survenue sur cette page.</p>
        <p className="mt-2 text-sm text-muted">Tes données locales ne sont pas perdues.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Réessayer
          </button>
          <Link
            to="/"
            className="rounded-lg border border-line px-4 py-1.5 text-sm font-bold transition-colors hover:border-accent"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
}
