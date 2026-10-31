// SPDX-License-Identifier: AGPL-3.0-only
//
// Command Center panel for the architect: edit the pack's own artifacts
// (scope, decision records, test plan) and download every saved architecture
// artifact as one document, with the missing ones listed and linked to the
// tool that produces each. Works with nothing saved — the pack is then a
// checklist.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronDown, ChevronRight, FileDown, FileText, Loader2, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModuleStore } from '@/store/useModuleStore'
import { bundleFilename, downloadBlob } from '@/services/exportBundle'
import {
  ARCHITECTURE_PACK_PANEL_PATH,
  ARCHITECTURE_PACK_SECTIONS,
  ARCHITECTURE_PACK_TITLE,
  buildArchitecturePack,
} from '@/services/architecturePack'
import {
  decisionMarkdown,
  DECISION_TEMPLATES,
  scopeSummary,
  type ArchitectureScopeInputs,
  type DecisionRecordInputs,
  type DecisionTopic,
} from '@/services/architectureArtifacts'
import type { ExecutiveDocument } from '@/services/storage/types'
import { logBusinessToolExport } from '@/utils/analytics'
import { ScopeEditor } from './architecturePack/ScopeEditor'
import { DecisionEditor } from './architecturePack/DecisionEditor'
import { TestPlanEditor } from './architecturePack/TestPlanEditor'

const EMPTY: ExecutiveDocument[] = []

type Editor = 'scope' | 'decisions' | 'tests'

const EDITORS: { id: Editor; label: string }[] = [
  { id: 'scope', label: 'Scope' },
  { id: 'decisions', label: 'Decision records' },
  { id: 'tests', label: 'Test plan' },
]

/** Which in-panel editor produces each of the pack's own artifact types. */
const EDITOR_FOR_TYPE: Partial<Record<ExecutiveDocument['type'], Editor>> = {
  'architecture-scope': 'scope',
  'architecture-decision-record': 'decisions',
  'architecture-test-plan': 'tests',
}

const chipCls =
  'inline-flex rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary/60 hover:text-foreground'

const isTopic = (v: string | null): v is DecisionTopic =>
  !!v && DECISION_TEMPLATES.some((t) => t.topic === v)

export function ArchitecturePackPanel() {
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments ?? EMPTY)
  const [params] = useSearchParams()
  // `?adr=<topic>` (from a Learn module) opens a new decision from that template.
  const adrTopic = params.get('adr')
  const [open, setOpen] = useState<Editor | null>(isTopic(adrTopic) ? 'decisions' : null)
  const [author, setAuthor] = useState('')
  const [busy, setBusy] = useState<'md' | 'pdf' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (isTopic(adrTopic) || window.location.hash === '#architecture-pack') {
      ref.current?.scrollIntoView({ block: 'start' })
    }
  }, [adrTopic])

  const preview = useMemo(() => buildArchitecturePack({ documents }), [documents])
  const total = ARCHITECTURE_PACK_SECTIONS.length

  /** Build the full pack: decision records are re-rendered so each cited
   * Library reference shows its state today, not when it was saved. */
  const build = async () => {
    const { loadEvidenceResolver } = await import('@/services/libraryEvidence')
    const resolve = await loadEvidenceResolver()
    const origin = window.location.origin
    const scopeDoc = documents.find((d) => d.type === 'architecture-scope')
    return buildArchitecturePack({
      documents,
      author,
      scope: scopeDoc ? scopeSummary(scopeDoc.inputs as ArchitectureScopeInputs) : undefined,
      origin,
      appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null,
      renderDocument: (d) =>
        d.type === 'architecture-decision-record' && d.inputs
          ? decisionMarkdown(d.inputs as DecisionRecordInputs, { origin, resolve })
          : undefined,
    })
  }

  const run = (kind: 'md' | 'pdf') => async () => {
    setError(null)
    setBusy(kind)
    try {
      const { markdown } = await build()
      if (kind === 'md') {
        downloadBlob(
          new Blob([markdown], { type: 'text/markdown' }),
          bundleFilename('architecture-pack', 'md')
        )
      } else {
        const { markdownToPdf } = await import('@/services/export/pdfExport')
        const filename = bundleFilename('architecture-pack', 'pdf').replace(/\.pdf$/, '')
        await markdownToPdf(markdown, filename, ARCHITECTURE_PACK_TITLE, { wideTable: true })
      }
      logBusinessToolExport('architecture-pack', kind)
    } catch (e) {
      setError(`Download failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section
      ref={ref}
      id="architecture-pack"
      className="mb-6 scroll-mt-20 rounded-xl border border-primary/30 bg-card p-4"
      data-testid="architecture-pack"
      aria-labelledby="architecture-pack-title"
    >
      <h2
        id="architecture-pack-title"
        className="flex items-center gap-2 font-semibold text-primary"
      >
        <PackageCheck size={16} /> {ARCHITECTURE_PACK_TITLE}
      </h2>
      <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
        One document for a design review: your scope, every architecture artifact you have saved,
        your decision records and your test plan, in a fixed order with their review status.
        Anything not yet produced is listed with the tool that produces it. It is built in your
        browser and nothing is uploaded.
      </p>

      <p className="mt-3 text-sm" data-testid="architecture-pack-count">
        <span className="font-semibold">
          {preview.present.length} of {total}
        </span>{' '}
        sections saved
      </p>

      {preview.missing.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Missing sections">
          {preview.missing.map((m) => (
            <li key={m.type}>
              {m.toolPath === ARCHITECTURE_PACK_PANEL_PATH && EDITOR_FOR_TYPE[m.type] ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${chipCls} h-auto`}
                  onClick={() => setOpen(EDITOR_FOR_TYPE[m.type] ?? null)}
                >
                  {m.label}
                </Button>
              ) : m.toolPath ? (
                <Link to={m.toolPath} className={chipCls}>
                  {m.label}
                </Link>
              ) : (
                <span className="inline-flex rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  {m.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2">
        {EDITORS.map((ed) => {
          const isOpen = open === ed.id
          return (
            <div key={ed.id} className="rounded-lg border border-border">
              <Button
                variant="ghost"
                className="flex h-9 w-full items-center justify-start gap-2 px-3 text-sm font-medium"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : ed.id)}
                data-testid={`architecture-pack-open-${ed.id}`}
              >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {ed.label}
              </Button>
              {isOpen && (
                <div className="border-t border-border p-3">
                  {ed.id === 'scope' && <ScopeEditor />}
                  {ed.id === 'decisions' && (
                    <DecisionEditor initialTopic={isTopic(adrTopic) ? adrTopic : null} />
                  )}
                  {ed.id === 'tests' && <TestPlanEditor />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:max-w-sm">
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <label htmlFor="architecture-pack-author">Author (optional)</label>
          <Input
            id="architecture-pack-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            className="h-8 text-xs"
            data-testid="architecture-pack-author"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={run('md')}
          disabled={busy !== null}
          data-testid="architecture-pack-md"
        >
          {busy === 'md' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          Download Markdown
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={run('pdf')}
          disabled={busy !== null}
          data-testid="architecture-pack-pdf"
        >
          {busy === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
          Download PDF
        </Button>
      </div>
      {error && <p className="mt-2 text-[11px] text-status-error">{error}</p>}
    </section>
  )
}
