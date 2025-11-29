import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
                    <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center border border-gray-700">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
                        <p className="text-gray-300 mb-6">
                            An unexpected error occurred. Please try reloading the page.
                        </p>
                        {this.state.error && (
                            <pre className="text-xs text-left bg-gray-900 p-4 rounded mb-6 overflow-auto max-h-40 text-red-300">
                                {this.state.error.toString()}
                            </pre>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
