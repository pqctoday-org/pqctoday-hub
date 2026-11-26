// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FocusLock from 'react-focus-lock'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'
import { useIsBelowLgViewport } from '@/hooks/useIsBelowLgViewport'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useDrawerPageStore } from '@/store/useDrawerPageStore'
import { useWorkshopStore, isWorkshopPinning } from '@/store/useWorkshopStore'
import { useEmbedState } from '@/embed/EmbedProvider'
import { AssistantConversation } from '../Assistant/AssistantConversation'
import { COPY } from '../Assistant/copy'
import { useAssistantLayout } from '../Assistant/useAssistantLayout'
import { usePageModal } from '../Assistant/usePageModal'
import { PanelHeader } from './PanelHeader'

const BookmarksPanel = React.lazy(() =>
  import('./BookmarksPanel').then((m) => ({ default: m.BookmarksPanel }))
)

const GlossaryView = React.lazy(() =>
  import('./DrawerViews').then((m) => ({ default: m.GlossaryDrawerView }))
)
const GuideView = React.lazy(() =>
  import('./DrawerViews').then((m) => ({ default: m.GuideDrawerView }))
)
const SourcesView = React.lazy(() =>
  import('./DrawerViews').then((m) => ({ default: m.SourcesDrawerView }))
)
const FaqView = React.lazy(() =>
  import('./DrawerViews').then((m) => ({ default: m.FaqDrawerView }))
)

const WorkshopPanel = React.lazy(() =>
  import('./WorkshopPanel').then((m) => ({ default: m.WorkshopPanel }))
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
  // A dialog the page opens (a record's detail drawer, say) is the learner's focus: while one is
  // open the docked drawer steps behind it, so the record is fully visible and usable. The drawer
  // comes back, with its answer, when the dialog closes or "Back to your answer" is used.
  const pageDialogOpen = usePageModal(isOpen && !sheet) !== null
  const stepBehind = !sheet && pageDialogOpen
  const embedState = useEmbedState()
  const assistantTitle = embedState.isEmbedded
    ? (embedState.policy?.features?.assistantTitle ?? COPY.title)
    : COPY.title

  // The Assistant and Bookmarks sit beside the page without a focus lock (non-modal, desktop).
  // The guided workshop keeps its own rule: modeless only while it runs on a wide screen.
  // The phone sheet always holds focus until it is closed.
  const modeless = sheet ? false : activeTab === 'workshop' ? workshopActive && !belowLg : true

  // The page's guide and sources follow the route; a route that has none closes that view rather than
  // showing an empty one.
  const hasGuide = useDrawerPageStore((s) => s.guidePageId !== null)
  const hasSources = useDrawerPageStore((s) => s.sourcesViewType !== null)
  useEffect(() => {
    if ((activeTab === 'guide' && !hasGuide) || (activeTab === 'sources' && !hasSources)) close()
  }, [activeTab, hasGuide, hasSources, close])

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

  // A drawer without a focus lock still returns focus: to the top bar button of the view that was
  // showing (so Escape on Glossary lands on Glossary), else to what opened it.
  // Captured while rendering, before the drawer's own content moves focus into its input.
  const [opener] = useState<Element | null>(() =>
    typeof document === 'undefined' ? null : document.activeElement
  )
  const tabRef = useRef(activeTab)
  useEffect(() => {
    tabRef.current = activeTab
  }, [activeTab])
  useEffect(
    () => () => {
      const button = document.querySelector<HTMLElement>(`[data-drawer-toggle="${tabRef.current}"]`)
      const target = button?.isConnected ? button : opener
      if (target instanceof HTMLElement && target.isConnected && target !== document.body) {
        target.focus()
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
        : activeTab === 'glossary'
          ? COPY.glossaryTitle
          : activeTab === 'guide'
            ? COPY.guideTitle
            : activeTab === 'sources'
              ? COPY.sourcesTitle
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
            className={`fixed top-0 right-0 bottom-0 ${sheet ? 'z-dialog' : stepBehind ? 'z-panel-behind' : 'z-panel'} bg-background shadow-2xl flex flex-col overflow-hidden print:hidden border-l border-border ${sheet ? '' : 'rounded-l-xl'} ${widthClass}`}
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
            />
            <div className="flex min-h-0 flex-1 flex-col">
              {activeTab === 'chat' && <AssistantConversation />}
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
                  <FaqView />
                </React.Suspense>
              )}
              {activeTab === 'glossary' && (
                <React.Suspense fallback={Spinner}>
                  <GlossaryView />
                </React.Suspense>
              )}
              {activeTab === 'guide' && (
                <React.Suspense fallback={Spinner}>
                  <GuideView />
                </React.Suspense>
              )}
              {activeTab === 'sources' && (
                <React.Suspense fallback={Spinner}>
                  <SourcesView />
                </React.Suspense>
              )}
            </div>
          </motion.div>
        </FocusLock>
      )}
    </AnimatePresence>
  )
}
