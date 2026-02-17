import { StrictMode, Suspense, lazy } from 'react'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/ErrorBoundary'

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
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'glass-panel',
            style: {
              background: 'var(--color-card)',
              color: 'var(--color-foreground)',
              border: '1px solid var(--color-border)',
            },
            success: {
              iconTheme: {
                primary: 'var(--color-primary)',
                secondary: 'var(--color-card)',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'var(--color-card)',
              },
            },
          }}
        />
      </ErrorBoundary>
    </StrictMode>
  )
}
