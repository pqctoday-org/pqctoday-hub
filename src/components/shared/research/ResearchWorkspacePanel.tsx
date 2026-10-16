// SPDX-License-Identifier: GPL-3.0-only
/**
 * The researcher's evidence workspace on the Command Center (Layer 2 of the
 * evidence workspace): the research question, collections of Library records
 * with the state saved with each one, what changed since, the claim matrix and
 * reproduction records. Everything stays in the browser; the evidence bundle above
 * carries it out.
 */
import { useEffect, useRef, type FC, type ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'
import { CollectionsList } from './CollectionsList'
import { BookmarksToCollection } from './BookmarksToCollection'
import { ChangedSinceSaved } from './ChangedSinceSaved'
import { ResearchQuestionForm } from './ResearchQuestionForm'
import { ClaimMatrixEditor } from './ClaimMatrixEditor'
import { CompareRuns } from './CompareRuns'
import { BundleReviewer } from './BundleReviewer'

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
          Your own working notes: your question, the sources you collected and the state each one
          was in when you saved it. They stay in your browser and go into the evidence bundle. Best
          used on a larger screen.
        </p>
      </div>

      <Block
        title="Research question"
        testId="research-question"
        intro="What you are checking, what kind of question it is, which sources count and which do not, and how much evidence is enough."
      >
        <ResearchQuestionForm />
      </Block>

      <Block
        title="Changed since you saved"
        testId="research-changes"
        intro="Each visit compares your collections with the current Library: a new revision, a lifecycle change, a new successor, deprecation, a newer last-verified date, or removal."
      >
        <ChangedSinceSaved placement="workspace" />
      </Block>

      <Block
        title="Collections"
        testId="research-collections"
        intro="Named sets of Library records, each with your annotation and its revision, lifecycle, successor and last-verified date as saved."
      >
        <BookmarksToCollection testId="workspace-bookmarks-to-collection" />
        <CollectionsList />
      </Block>

      <Block
        title="Claim matrix"
        testId="research-claims"
        intro="Atomic claims, each with the status you give it (fact, estimate, scenario or recommendation), the Library records for and against it, why you are confident, and what is still open."
      >
        <ClaimMatrixEditor />
      </Block>

      <Block
        title="Compare runs"
        testId="research-reproductions"
        intro="Two saved runs of the same tool side by side: what differed in how they ran and in their results. Add a second implementation's result, your conclusion and what would falsify it."
      >
        <CompareRuns />
      </Block>

      <Block
        title="Open a bundle (read-only)"
        testId="research-bundle-reviewer"
        intro="For a reviewer: open an evidence bundle zip someone sent you to read its question, collections, claims, reproductions and runs, and see which records changed in the Library since it was made. Nothing is saved and the file stays in your browser."
      >
        <BundleReviewer />
      </Block>
    </section>
  )
}
