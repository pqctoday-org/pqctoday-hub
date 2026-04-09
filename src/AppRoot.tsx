// SPDX-License-Identifier: GPL-3.0-only
import { StrictMode, Suspense, lazy } from 'react'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GoogleAuthProvider } from './contexts/GoogleAuthContext'
import { useSyncEffect } from './hooks/useSyncEffect'
import { EmbedProvider } from './embed/EmbedProvider'
import { getEmbedState } from './embed/embedContext'

// Lazy load App to catch evaluation errors
const App = lazy(() => import('./App.tsx'))

function SyncMount() {
  useSyncEffect()
  return null
}

export default function AppRoot() {
  const isEmbedded = getEmbedState().isEmbedded

  const content = (
    <>
      <SyncMount />
      <MotionConfig reducedMotion="user">
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
      </MotionConfig>
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
    </>
  )

  return (
    <StrictMode>
      <ErrorBoundary>
        <EmbedProvider>
          {isEmbedded ? content : <GoogleAuthProvider>{content}</GoogleAuthProvider>}
        </EmbedProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}
