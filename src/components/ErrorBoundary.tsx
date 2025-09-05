import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>Something went wrong</h2>
            <p>The application encountered an unexpected error. Please try refreshing the page.</p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '1rem' }}>
                <summary>Error Details (Development)</summary>
                <pre style={{ 
                  background: '#f8f9fa', 
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  overflow: 'auto',
                  fontSize: '0.8rem'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      <br />
                      <br />
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            <button 
              onClick={() => window.location.reload()} 
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginTop: '1rem',
                fontWeight: '600'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
