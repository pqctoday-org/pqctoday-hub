// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FocusLock from 'react-focus-lock'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { PanelHeader } from './PanelHeader'
import { ChatPanelContent } from './ChatPanelContent'

const HistoryPanel = React.lazy(() =>
  import('./HistoryPanel').then((m) => ({ default: m.HistoryPanel }))
)

const GraphPanel = React.lazy(() => import('./GraphPanel').then((m) => ({ default: m.GraphPanel })))

const BookmarksPanel = React.lazy(() =>
  import('./BookmarksPanel').then((m) => ({ default: m.BookmarksPanel }))
)

export const RightPanel: React.FC = () => {
  const { isOpen, activeTab, setTab, close, minimize, toggle } = useRightPanelStore()
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  // E2E UI Bypass
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-expect-error E2E test bypass — global injected for Playwright
      window.__e2e_toggle_panel = toggle
    }
  }, [toggle])

  const panelLabel =
    activeTab === 'chat'
      ? 'PQC Assistant'
      : activeTab === 'history'
        ? 'Journey History'
        : activeTab === 'bookmarks'
          ? 'Bookmarks'
          : 'Knowledge Graph'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Right-side panel — slides in from right, no backdrop, 40% width */}
          <FocusLock returnFocus>
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-panel bg-background shadow-2xl flex flex-col overflow-hidden print:hidden border-l border-border rounded-l-xl w-full sm:w-[40vw] sm:min-w-[360px]"
              role="dialog"
              aria-label={panelLabel}
              onClick={(e) => e.stopPropagation()}
            >
              <PanelHeader
                activeTab={activeTab}
                onTabChange={setTab}
                onClose={close}
                onMinimize={minimize}
              />

              {activeTab === 'chat' && <ChatPanelContent />}
              {activeTab === 'history' && (
                <React.Suspense
                  fallback={
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  }
                >
                  <HistoryPanel />
                </React.Suspense>
              )}
              {activeTab === 'graph' && (
                <React.Suspense
                  fallback={
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  }
                >
                  <GraphPanel />
                </React.Suspense>
              )}
              {activeTab === 'bookmarks' && (
                <React.Suspense
                  fallback={
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  }
                >
                  <BookmarksPanel />
                </React.Suspense>
              )}
            </motion.div>
          </FocusLock>
        </>
      )}
    </AnimatePresence>
  )
}
