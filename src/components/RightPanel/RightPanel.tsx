// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FocusLock from 'react-focus-lock'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useWorkshopStore, isWorkshopPinning } from '@/store/useWorkshopStore'
import { PanelHeader } from './PanelHeader'
import { ChatPanelContent } from './ChatPanelContent'

const HistoryPanel = React.lazy(() =>
  import('./HistoryPanel').then((m) => ({ default: m.HistoryPanel }))
)

const BookmarksPanel = React.lazy(() =>
  import('./BookmarksPanel').then((m) => ({ default: m.BookmarksPanel }))
)

const FAQPage = React.lazy(() =>
  import('@/components/FAQ/FAQPage').then((m) => ({ default: m.FAQPage }))
)

const WorkshopPanel = React.lazy(() =>
  import('./WorkshopPanel').then((m) => ({ default: m.WorkshopPanel }))
)

const WorkshopPanel = React.lazy(() =>
  import('./WorkshopPanel').then((m) => ({ default: m.WorkshopPanel }))
)

export const RightPanel: React.FC = () => {
  const { isOpen, activeTab, setTab, close, minimize, toggle } = useRightPanelStore()
  const workshopMode = useWorkshopStore((s) => s.mode)
  const workshopActive = isWorkshopPinning(workshopMode)

  // Close on Escape — disabled while workshop is pinned (running or video).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (workshopActive) return
      if (e.key === 'Escape') close()
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close, workshopActive])

  // Force panel open while workshop is running so the user cannot accidentally close it.
  useEffect(() => {
    if (workshopActive && !isOpen) {
      // Re-open the panel and switch to the workshop tab.
      useRightPanelStore.setState({ isOpen: true, isMinimized: false, activeTab: 'workshop' })
    }
  }, [workshopActive, isOpen])

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
        : activeTab === 'faq'
          ? 'FAQ'
          : activeTab === 'workshop'
            ? 'Workshop'
            : 'Bookmarks'

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
                onClose={workshopActive ? () => {} : close}
                onMinimize={workshopActive ? undefined : minimize}
              />

              {activeTab === 'chat' && <ChatPanelContent />}
              {activeTab === 'workshop' && (
                <React.Suspense
                  fallback={
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  }
                >
                  <WorkshopPanel />
                </React.Suspense>
              )}
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
              {activeTab === 'faq' && (
                <React.Suspense
                  fallback={
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  }
                >
                  <div className="flex-1 overflow-y-auto">
                    <FAQPage />
                  </div>
                </React.Suspense>
              )}
            </motion.div>
          </FocusLock>
        </>
      )}
    </AnimatePresence>
  )
}
