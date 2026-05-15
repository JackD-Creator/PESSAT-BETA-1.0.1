import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', padding: '20px', fontFamily: 'sans-serif', textAlign: 'center',
          color: '#333', background: '#fafafa'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#d32f2f' }}>Something went wrong</h1>
          <p style={{ fontSize: '14px', marginBottom: '16px', color: '#666' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', fontSize: '14px', border: 'none', borderRadius: '8px',
              background: '#059669', color: 'white', cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
