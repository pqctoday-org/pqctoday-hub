import { StrictMode, Suspense, lazy } from 'react'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load App to catch evaluation errors
const App = lazy(() => import('./App.tsx'))

export default function AppRoot() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <Suspense
          fallback={
            <main
              role="main"
              className="min-h-screen flex items-center justify-center bg-background text-foreground"
            >
              <div className="text-center" role="status" aria-label="Loading application">
                <h1 className="text-xl font-bold mb-2">PQC Today</h1>
                <p className="text-muted-foreground">Initializing application modules...</p>
              </div>
            </main>
          }
        >
          <App />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>
  )
}
