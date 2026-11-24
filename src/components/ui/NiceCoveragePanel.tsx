// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LEARN_MODULE_BY_ID } from '@/data/generated/learnModules.generated'
import { NICE_COMPETENCY_AREAS, NICE_WORK_ROLES } from '@/data/niceFramework'

/** Work roles named on the closed line before "+k". */
const ROLES_SHOWN = 3

type StatementText = Readonly<Record<string, string>>

/** The wording of the statements is a separate chunk: fetched the first time a panel is opened. */
let statementTextPromise: Promise<StatementText> | undefined
function loadStatementText(): Promise<StatementText> {
  statementTextPromise ??= import('@/data/generated/niceStatementText.generated').then(
    (m) => m.NICE_STATEMENT_TEXT
  )
  return statementTextPromise
}

function StatementList({
  heading,
  ids,
  text,
}: {
  heading: string
  ids: readonly string[]
  text: StatementText | undefined
}) {
  if (ids.length === 0) return null
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
      <ul className="mt-1 space-y-1">
        {ids.map((id) => (
          <li key={id} className="min-w-0 text-sm text-foreground/80">
            <span className="font-mono text-xs font-semibold text-foreground">{id}</span>{' '}
            {/* eslint-disable-next-line security/detect-object-injection */}
            <span className="break-words">{text?.[id] ?? ''}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Which NICE Framework v2.2.0 statements a lesson teaches and which a reader practises in its
 * Workshop, as a closed one-line summary that opens into the two lists. Statements the lesson only
 * mentions are not shown. Nothing is rendered for a lesson whose text has not been read against NICE.
 */
export function NiceCoveragePanel({ moduleId }: { moduleId: string }) {
  const lesson = LEARN_MODULE_BY_ID[moduleId] // eslint-disable-line security/detect-object-injection
  const [open, setOpen] = useState(false)
  const [text, setText] = useState<StatementText>()
  const bodyId = useId()

  useEffect(() => {
    if (!open || text) return
    let cancelled = false
    void loadStatementText().then((loaded) => {
      if (!cancelled) setText(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [open, text])

  if (!lesson || !lesson.niceRead || !lesson.niceTier) return null

  const taught = lesson.niceStatementsTaught
  const practised = lesson.niceStatementsPractised
  const roles = lesson.niceWorkRoles.map((id) => NICE_WORK_ROLES[id].title) // eslint-disable-line security/detect-object-injection
  const areas = lesson.niceCompetencyAreas.map((id) => NICE_COMPETENCY_AREAS[id].title) // eslint-disable-line security/detect-object-injection
  const roleSummary =
    roles.length > ROLES_SHOWN
      ? `${roles.slice(0, ROLES_SHOWN).join(', ')} +${roles.length - ROLES_SHOWN}`
      : roles.join(', ')

  return (
    <section
      aria-label="NICE coverage"
      data-testid="nice-coverage-panel"
      className="mt-3 min-w-0 rounded-lg border border-border bg-card text-sm"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
        className="h-auto min-h-11 w-full justify-between gap-2 whitespace-normal px-3 py-2 text-left font-normal text-muted-foreground"
      >
        <span className="min-w-0">
          <span className="font-semibold text-foreground">NICE skills:</span> teaches{' '}
          {taught.length} · practise {practised.length}
          {roleSummary ? <> · roles: {roleSummary}</> : null}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-primary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </Button>
      {open ? (
        <div id={bodyId} className="space-y-4 border-t border-border px-3 py-3">
          <StatementList heading="Teaches" ids={taught} text={text} />
          <StatementList heading="Practise (in the Workshop)" ids={practised} text={text} />
          {areas.length > 0 ? (
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Competency areas</h3>
              <p className="mt-1 text-foreground/80">{areas.join(' · ')}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
