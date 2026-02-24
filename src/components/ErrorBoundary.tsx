import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private isChunkLoadError(error: Error | null): boolean {
    if (!error) return false
    const msg = error.message.toLowerCase()
    return (
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch') ||
      msg.includes('loading chunk') ||
      msg.includes('loading css chunk')
    )
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <h2 className="text-destructive text-lg font-semibold">Something went wrong</h2>
            <p className="text-destructive/80 mt-2">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-destructive/20 text-destructive rounded hover:bg-destructive/30"
              onClick={() => {
                if (this.isChunkLoadError(this.state.error)) {
                  window.location.reload()
                } else {
                  this.setState({ hasError: false, error: null })
                }
              }}
            >
              Try again
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
