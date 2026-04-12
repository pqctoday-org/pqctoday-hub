// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const { isOpen, activeTab, setTab, close, minimize } = useRightPanelStore()
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

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
          {/* Bottom drawer — slides up, no backdrop, all modes */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="z-panel bg-background shadow-2xl flex flex-col overflow-hidden print:hidden border-t border-border rounded-t-xl"
            style={{ height: '50%', minHeight: '300px' }}
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
        </>
      )}
    </AnimatePresence>
  )
}
