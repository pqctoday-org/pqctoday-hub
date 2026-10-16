// SPDX-License-Identifier: GPL-3.0-only
/**
 * The researcher's evidence workspace on the Command Center (Layer 2 of the
 * evidence workspace): collections of Library records with the state saved
 * with each one. Everything stays in the browser; the evidence bundle above
 * carries it out.
 */
import { useEffect, useRef, type FC, type ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'
import { CollectionsList } from './CollectionsList'
import { BookmarksToCollection } from './BookmarksToCollection'

const PANEL_ID = 'research-workspace'

const Block: FC<{ title: string; intro: string; children: ReactNode; testId: string }> = ({
  title,
  intro,
  children,
  testId,
}) => (
  <section className="space-y-2 border-t border-border pt-3" data-testid={testId}>
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    <p className="max-w-3xl text-xs text-muted-foreground">{intro}</p>
    {children}
  </section>
)

export const ResearchWorkspacePanel: FC = () => {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (window.location.hash === `#${PANEL_ID}`) ref.current?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <section
      ref={ref}
      id={PANEL_ID}
      className="mb-6 scroll-mt-20 space-y-3 rounded-xl border border-border bg-card p-4"
      data-testid={PANEL_ID}
      aria-labelledby={`${PANEL_ID}-title`}
    >
      <div>
        <h2 id={`${PANEL_ID}-title`} className="flex items-center gap-2 font-semibold text-primary">
          <FlaskConical size={16} aria-hidden="true" /> Research workspace
        </h2>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          Your own working notes: the sources you collected and the state each one was in when you
          saved it. They stay in your browser and go into the evidence bundle. Best used on a larger
          screen.
        </p>
      </div>

      <Block
        title="Collections"
        testId="research-collections"
        intro="Named sets of Library records, each with your annotation and its revision, lifecycle, successor and last-verified date as saved."
      >
        <BookmarksToCollection testId="workspace-bookmarks-to-collection" />
        <CollectionsList />
      </Block>
    </section>
  )
}
