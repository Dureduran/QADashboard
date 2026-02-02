import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components,
 * logs them, and displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Something went wrong</span>
                    </div>

                    <p className="text-sm text-slate-400 mb-4 text-center max-w-xs">
                        This section couldn't be loaded. Try refreshing or contact support if the issue persists.
                    </p>

                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mt-4 text-xs text-slate-500 max-w-full overflow-auto">
                            <summary className="cursor-pointer hover:text-slate-400">Error details</summary>
                            <pre className="mt-2 p-2 bg-slate-900 rounded text-red-400 whitespace-pre-wrap">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
