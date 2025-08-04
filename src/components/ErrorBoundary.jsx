import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="container">
            <div className="error-content">
              <h2>Oops! Something went wrong</h2>
              <p>We're sorry, but something unexpected happened. Please try refreshing the page.</p>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Refresh Page
              </button>
            </div>
          </div>
          <style jsx>{`
            .error-boundary {
              min-height: 50vh;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
            }
            
            .error-content {
              max-width: 500px;
              padding: 48px;
            }
            
            .error-content h2 {
              margin-bottom: 16px;
              color: var(--color-ultramarine);
            }
            
            .error-content p {
              margin-bottom: 32px;
              color: #666;
            }
            
            .error-content button {
              padding: 12px 24px;
              background-color: var(--color-ultramarine);
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 500;
            }
            
            .error-content button:hover {
              opacity: 0.9;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
