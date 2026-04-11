// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { PanelHeader } from './PanelHeader'
import { ChatPanelContent } from './ChatPanelContent'
import { useEmbedState } from '@/embed/EmbedProvider'
import clsx from 'clsx'

const HistoryPanel = React.lazy(() =>
  import('./HistoryPanel').then((m) => ({ default: m.HistoryPanel }))
)

const GraphPanel = React.lazy(() => import('./GraphPanel').then((m) => ({ default: m.GraphPanel })))

const BookmarksPanel = React.lazy(() =>
  import('./BookmarksPanel').then((m) => ({ default: m.BookmarksPanel }))
)

export const RightPanel: React.FC = () => {
  const { isOpen, activeTab, setTab, close } = useRightPanelStore()
  const { isEmbedded } = useEmbedState()

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  // Lock body scroll when panel is open (mobile drawer, standard mode only)
  useEffect(() => {
    if (isEmbedded) return
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, isEmbedded])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 z-panel bg-black/60 backdrop-blur-sm print:hidden`}
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={clsx(
              'z-panel w-full md:w-[60vw] bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden print:hidden',
              isEmbedded
                ? 'absolute right-0 top-[48px] rounded-bl-xl border-b'
                : 'fixed right-0 top-0 bottom-0'
            )}
            style={isEmbedded ? { height: 'min(800px, calc(100% - 48px))' } : {}}
            role="dialog"
            aria-label={
              activeTab === 'chat'
                ? 'PQC Assistant'
                : activeTab === 'history'
                  ? 'Journey History'
                  : activeTab === 'bookmarks'
                    ? 'Bookmarks'
                    : 'Knowledge Graph'
            }
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <PanelHeader activeTab={activeTab} onTabChange={setTab} onClose={close} />

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
