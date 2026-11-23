import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(): void {
    // Do not send health or user-entered data to a remote logging service.
    // A production deployment can connect a privacy-reviewed error monitor here.
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="fatal-screen">
          <div className="fatal-card">
            <div className="brand-mark"><span>✿</span></div>
            <h1>Something interrupted the page</h1>
            <p>Your saved tracker data has not been intentionally changed. Reload the app to try again.</p>
            <button className="button button-primary" onClick={this.handleReload}>Reload CycleCue</button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
