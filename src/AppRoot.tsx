import { StrictMode, Suspense, lazy } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './components/theme-provider'

// Lazy load App to catch evaluation errors
const App = lazy(() => import('./App.tsx'))

export default function AppRoot() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-gray-900 text-foreground">
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">System Loading...</h2>
                  <p className="text-gray-400">Initializing application modules.</p>
                </div>
              </div>
            }
          >
            <App />
          </Suspense>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}
