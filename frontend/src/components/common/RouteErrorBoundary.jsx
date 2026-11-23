// MAK Tours & Travels ERP - Resilient Route Error Boundary
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button';

export class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            margin: '1.5rem',
            border: '1px solid #fee2e2'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}
          >
            <AlertTriangle size={32} />
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.5rem 0' }}>
            Page Render Recovery
          </h2>

          <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '460px', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
            A temporary issue occurred while rendering this module. You can reload this view or return to the main dashboard.
          </p>

          {this.state.error && (
            <div
              style={{
                maxWidth: '650px',
                width: '100%',
                marginBottom: '1.25rem',
                textAlign: 'left',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                color: '#991b1b',
                overflowX: 'auto',
                fontFamily: 'monospace'
              }}
            >
              <strong>Diagnostic Message:</strong> {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={this.handleReset}
              style={{ backgroundColor: '#2C3480', borderColor: '#2C3480' }}
            >
              <RefreshCw size={14} style={{ marginRight: '0.35rem' }} /> Reload Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleHome}
            >
              <Home size={14} style={{ marginRight: '0.35rem' }} /> Go to Gateway
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
