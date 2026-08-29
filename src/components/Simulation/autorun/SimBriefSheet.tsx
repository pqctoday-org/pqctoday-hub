// SPDX-License-Identifier: GPL-3.0-only
/**
 * SimBriefSheet (sim-mobile-full-play WS-2/WS-3) — the phone "read it, answer
 * one check, file it" screen shared by two step kinds:
 *
 *  - `activity` steps (plan §4.2, "Brief + check"): body is the generated,
 *    sector-aware Markdown document the narrated auto-run already files
 *    (autorun/demoDocs.ts, derivedFinancialDocs.ts, realToolDocs.ts) — the
 *    SAME content, just read instead of built in a Business tool.
 *  - `workshop` steps (plan §4.4, "workshop result cards"): body is a
 *    pre-computed result card instead of a document (the live playground
 *    tool can't run on a phone), same read → check → credit shape.
 *
 * This component is intentionally dumb about WHICH kind it's serving — the
 * caller supplies the body (children), the check question (or null to skip
 * straight to filing), and the credit action. Reuses QuizGateModal (fixed in
 * WS-0 to scroll + keep its action button reachable on a phone) for the
 * check itself rather than a second question-rendering UI.
 */
import { useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuizGateModal } from '../QuizGateModal'
import type { QuizQuestion } from '@/components/PKILearning/modules/Quiz/types'

export interface SimBriefSheetProps {
  /** Small uppercase eyebrow above the title (e.g. "Generated brief · Program Charter"). */
  kicker: string
  title: string
  /** Body content — markdown-rendered document or a result-card layout. */
  children: ReactNode
  /** Title shown on the check dialog (QuizGateModal's `moduleTitle`). */
  checkTitle: string
  /** The check question, or null to skip straight to filing (no quiz coverage found). */
  question: QuizQuestion | null
  /** Primary action label when there's no check to pass first. */
  fileLabel: string
  /** Called once the step should be credited — after a passed check, or
   *  immediately if there's no question. */
  onFile: () => void
  onClose: () => void
}

export function SimBriefSheet({
  kicker,
  title,
  children,
  checkTitle,
  question,
  fileLabel,
  onFile,
  onClose,
}: SimBriefSheetProps) {
  const [checking, setChecking] = useState(false)
  return (
    <div
      className="fixed inset-0 z-[72] flex flex-col bg-background text-foreground"
      data-testid="sim-brief-sheet"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          {/* Not truncated to one line — this line carries the "on a laptop
              you'd build this in the {tool} tool" honesty note, which reads
              as broken with the tool name silently cut off. */}
          <p className="text-[10.5px] font-bold uppercase leading-snug tracking-wide text-primary">
            {kicker}
          </p>
          <h2 className="truncate text-sm font-bold text-foreground">{title}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">{children}</div>
      <div className="shrink-0 border-t border-border bg-card p-4">
        {question ? (
          <Button
            type="button"
            variant="gradient"
            className="w-full"
            onClick={() => setChecking(true)}
          >
            Take the check to file this
          </Button>
        ) : (
          <Button type="button" variant="gradient" className="w-full" onClick={onFile}>
            {fileLabel}
          </Button>
        )}
      </div>
      {checking && question && (
        <QuizGateModal
          question={question}
          moduleTitle={checkTitle}
          onCancel={() => setChecking(false)}
          onPass={() => {
            setChecking(false)
            onFile()
          }}
        />
      )}
    </div>
  )
}
