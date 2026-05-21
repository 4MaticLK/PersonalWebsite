import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ChartErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FIN 285A charts]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="portfolio-chart portfolio-chart--error" role="alert">
          <p>
            <strong>{this.props.label ?? 'Chart'}</strong> could not render.
          </p>
          <p className="portfolio-chart__error-detail">{this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
