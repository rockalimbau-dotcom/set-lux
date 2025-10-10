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

export class ErrorBoundary extends Component<Props, State> {
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
        <div className='space-y-4'>
          <div className='text-sm text-red-400 border border-red-800 rounded-xl p-4 bg-red-950/30'>
            <h3 className='font-semibold mb-2'>Error en la aplicación</h3>
            <p className='mb-3'>
              Ha ocurrido un error inesperado. Por favor, recarga la página.
            </p>
            <div className='flex gap-2'>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                }}
                className='px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm'
              >
                Reintentar
              </button>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className='px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm'
              >
                Recargar página
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mt-4 text-xs'>
                <summary className='cursor-pointer text-red-300'>Detalles del error</summary>
                <pre className='mt-2 p-2 bg-black/50 rounded text-red-200 overflow-auto'>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
