// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { StoryButton } from '@/components/storybook'
import { GlossaryContent } from '@/components/common/Glossary'
import { UserManualContent } from '@/components/common/UserManualContent'
import { SourcesContent } from '@/components/ui/SourcesContent'
import { FAQPage } from '@/components/FAQ/FAQPage'
import { COPY } from '@/components/Assistant/copy'
import { useDrawerPageStore } from '@/store/useDrawerPageStore'
import { useGlossaryDrawerStore } from '@/store/useGlossaryDrawerStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useAssistantLayout } from '@/components/Assistant/useAssistantLayout'

/**
 * The drawer's Glossary, Guide, Sources and FAQ views. Each shows the same content component the
 * modal panels use (embedded mode keeps those), so there is one copy of every panel's content.
 */

/** Puts focus into a view when it opens: its first text box if it has one, else the view itself. */
function useFocusOnOpen<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const box = ref.current?.querySelector<HTMLElement>('input, textarea, [tabindex="0"]')
    const timer = setTimeout(() => (box ?? ref.current)?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])
  return ref
}

/** The Glossary, on the term the address or an answer named, if any. */
export function GlossaryDrawerView() {
  const focusTerm = useGlossaryDrawerStore((s) => s.focusTerm)
  const fromAnswer = useGlossaryDrawerStore((s) => s.fromAnswer)
  const token = useGlossaryDrawerStore((s) => s.token)
  const clear = useGlossaryDrawerStore((s) => s.clear)
  const open = useRightPanelStore((s) => s.open)

  // A term is asked for once: leaving the view (or closing the drawer) forgets it.
  useEffect(() => clear, [clear])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {fromAnswer && (
        <div className="shrink-0 border-b border-border bg-highlight px-4 py-1 text-sm text-heading">
          <StoryButton
            variant="quiet"
            onClick={() => {
              open('chat')
            }}
            className="gap-1"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            {COPY.backToAnswer}
          </StoryButton>
        </div>
      )}
      <GlossaryContent key={token} active focusTerm={focusTerm ?? undefined} />
    </div>
  )
}

/** The current page's guide. The layout closes this view when the page has none. */
export function GuideDrawerView() {
  const pageId = useDrawerPageStore((s) => s.guidePageId)
  const ref = useFocusOnOpen<HTMLDivElement>()
  if (!pageId) return null
  return (
    <div ref={ref} className="flex min-h-0 flex-1 flex-col">
      <UserManualContent pageId={pageId} />
    </div>
  )
}

/** The current page's authoritative sources. The layout closes this view when the page has none. */
export function SourcesDrawerView() {
  const viewType = useDrawerPageStore((s) => s.sourcesViewType)
  const dataSource = useDrawerPageStore((s) => s.sourcesDataSource)
  const ref = useFocusOnOpen<HTMLDivElement>()
  if (!viewType) return null
  return (
    <div
      ref={ref}
      role="region"
      aria-label="Sources for this page"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region with no focusable content is unreachable by keyboard; axe's `scrollable-region-focusable` fires without it (same pattern as ui/ScrollFadeContainer.tsx).
      tabIndex={0}
      className="flex-1 overflow-y-auto p-4"
    >
      <SourcesContent viewType={viewType} dataSource={dataSource} />
    </div>
  )
}

/** The FAQ list, with a plain link to the full page. */
export function FaqDrawerView() {
  const sheet = useAssistantLayout() === 'sheet'
  const ref = useFocusOnOpen<HTMLDivElement>()
  return (
    <div ref={ref} tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
      <div className="shrink-0 border-b border-border px-4 py-2 text-sm">
        <Link
          to="/faq"
          className="font-semibold text-primary-legible underline underline-offset-4"
          onClick={() => {
            // On the phone the sheet covers the page, so it closes; beside the page it stays.
            if (sheet) useRightPanelStore.getState().close()
          }}
        >
          {COPY.faqFullPage}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto max-md:overscroll-y-contain">
        <FAQPage inDrawer />
      </div>
    </div>
  )
}
