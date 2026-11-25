// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FocusLock from 'react-focus-lock'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'
import { useIsBelowLgViewport } from '@/hooks/useIsBelowLgViewport'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useWorkshopStore, isWorkshopPinning } from '@/store/useWorkshopStore'
import { useModelAssistantFallback } from '@/services/featureFlags'
import { useEmbedState } from '@/embed/EmbedProvider'
import { AssistantConversation } from '../Assistant/AssistantConversation'
import { COPY } from '../Assistant/copy'
import { useAssistantLayout } from '../Assistant/useAssistantLayout'
import { PanelHeader } from './PanelHeader'

const BookmarksPanel = React.lazy(() =>
  import('./BookmarksPanel').then((m) => ({ default: m.BookmarksPanel }))
)

const FAQPage = React.lazy(() =>
  import('@/components/FAQ/FAQPage').then((m) => ({ default: m.FAQPage }))
)

const WorkshopPanel = React.lazy(() =>
  import('./WorkshopPanel').then((m) => ({ default: m.WorkshopPanel }))
)

// The old model chat. Reached only through the hidden rollback switch, and loaded only then: the
// default path never fetches this file or the model services it imports.
const LegacyChatPanel = React.lazy(() =>
  import('./ChatPanelContent').then((m) => ({ default: m.ChatPanelContent }))
)

const Spinner = (
  <div className="flex-1 flex items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
)

export const RightPanel: React.FC = () => {
  const { isOpen, activeTab, close } = useRightPanelStore()
  const workshopMode = useWorkshopStore((s) => s.mode)
  const workshopActive = isWorkshopPinning(workshopMode)
  const belowLg = useIsBelowLgViewport()
  const layout = useAssistantLayout()
  const sheet = layout === 'sheet'
  const modelFallback = useModelAssistantFallback()
  const embedState = useEmbedState()
  const assistantTitle = embedState.isEmbedded
    ? (embedState.policy?.features?.assistantTitle ?? COPY.title)
    : COPY.title

  // The Assistant and Bookmarks sit beside the page without a focus lock (non-modal, desktop).
  // The guided workshop keeps its own rule: modeless only while it runs on a wide screen.
  // The phone sheet always holds focus until it is closed.
  const modeless = sheet ? false : activeTab === 'workshop' ? workshopActive && !belowLg : true

  // Escape closes the drawer — disabled while a guided workshop is pinned (running or video).
  useOverlayEscape(isOpen, close, { isBlocked: () => workshopActive })

  // Force the drawer open while a workshop is running so it cannot be closed by accident.
  useEffect(() => {
    if (workshopActive && !isOpen) {
      useRightPanelStore.setState({ isOpen: true, isMinimized: false, activeTab: 'workshop' })
    }
  }, [workshopActive, isOpen])

  // On a phone the sheet takes over the screen: lock the page's own scroll while it is open.
  useEffect(() => {
    if (!isOpen || !sheet) return
    const scrollContainer = document.getElementById('main-content')?.parentElement
    if (!scrollContainer) return
    const prevOverflow = scrollContainer.style.overflow
    scrollContainer.style.overflow = 'hidden'
    return () => {
      scrollContainer.style.overflow = prevOverflow
    }
  }, [isOpen, sheet])

  // A drawer without a focus lock still returns focus to what opened it (the top bar's toggle).
  // Captured while rendering, before the drawer's own content moves focus into its input.
  const [opener] = useState<Element | null>(() =>
    typeof document === 'undefined' ? null : document.activeElement
  )
  useEffect(
    () => () => {
      if (opener instanceof HTMLElement && opener.isConnected && opener !== document.body) {
        opener.focus()
      }
    },
    [opener]
  )

  // A region beside the page; a dialog when it is a modal sheet or the guided workshop.
  const isDialog = sheet || activeTab === 'workshop'

  const title =
    activeTab === 'chat'
      ? assistantTitle
      : activeTab === 'faq'
        ? COPY.faqTitle
        : activeTab === 'workshop'
          ? COPY.workshopTitle
          : COPY.bookmarksTitle

  const widthClass = sheet
    ? 'w-full'
    : activeTab === 'workshop'
      ? 'sm:w-[40vw] sm:min-w-[360px]'
      : 'w-[400px]'

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusLock disabled={modeless} returnFocus={!modeless}>
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed top-0 right-0 bottom-0 ${sheet ? 'z-dialog' : 'z-panel'} bg-background shadow-2xl flex flex-col overflow-hidden print:hidden border-l border-border ${sheet ? '' : 'rounded-l-xl'} ${widthClass}`}
            role={isDialog ? 'dialog' : 'region'}
            aria-modal={isDialog ? (modeless ? false : sheet || undefined) : undefined}
            aria-label={title}
            data-assistant-layout={layout}
            onClick={(e) => e.stopPropagation()}
          >
            <PanelHeader
              title={title}
              activeTab={activeTab}
              onClose={sheet && !workshopActive ? close : undefined}
              showObjective={!modelFallback}
            />
            <div className="flex min-h-0 flex-1 flex-col">
              {activeTab === 'chat' &&
                (modelFallback ? (
                  <React.Suspense fallback={Spinner}>
                    <LegacyChatPanel />
                  </React.Suspense>
                ) : (
                  <AssistantConversation />
                ))}
              {activeTab === 'workshop' && (
                <React.Suspense fallback={Spinner}>
                  <WorkshopPanel />
                </React.Suspense>
              )}
              {activeTab === 'bookmarks' && (
                <React.Suspense fallback={Spinner}>
                  <BookmarksPanel />
                </React.Suspense>
              )}
              {activeTab === 'faq' && (
                <React.Suspense fallback={Spinner}>
                  <div className="flex-1 overflow-y-auto max-md:overscroll-y-contain">
                    <FAQPage inDrawer />
                  </div>
                </React.Suspense>
              )}
            </div>
          </motion.div>
        </FocusLock>
      )}
    </AnimatePresence>
  )
}
