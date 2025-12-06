import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo?: ErrorInfo // Optional errorInfo
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: undefined,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ errorInfo }) // Store errorInfo in state
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
          <div className="max-w-md w-full bg-card rounded-lg shadow-xl p-8 text-center border border-border">
            <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>

            {this.state.error && (
              <div className="mb-6 text-left">
                <p className="text-sm font-semibold mb-1 text-muted-foreground">Error Details:</p>
                <pre className="text-xs text-left bg-muted p-4 rounded overflow-auto max-h-40 text-destructive-foreground">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <br />
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
