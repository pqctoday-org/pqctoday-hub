// SPDX-License-Identifier: AGPL-3.0-only
//
// Command Center panel for IT operations: edit the pack's own artifacts
// (scope, test plan) and download every saved operations artifact as one
// document, with the missing ones listed and linked to the tool that produces
// each. Works with nothing saved — the pack is then a checklist of what to
// produce. The zip adds every table as a CSV.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ChevronDown,
  ChevronRight,
  FileArchive,
  FileDown,
  FileText,
  Loader2,
  PackageCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModuleStore } from '@/store/useModuleStore'
import { buildZipBundle, bundleFilename, downloadBlob } from '@/services/exportBundle'
import {
  buildOperationsPack,
  OPERATIONS_PACK_MODULE_ID,
  OPERATIONS_PACK_PANEL_PATH,
  OPERATIONS_PACK_SECTIONS,
  OPERATIONS_PACK_TITLE,
  operationsPackFiles,
} from '@/services/operationsPack'
import { opsScopeSummary, type OpsScopeInputs } from '@/services/opsArtifacts'
import type { ExecutiveDocument } from '@/services/storage/types'
import { logBusinessToolExport } from '@/utils/analytics'
import { OpsScopeEditor } from './operationsPack/OpsScopeEditor'
import { TestPlanEditor } from './architecturePack/TestPlanEditor'

const EMPTY: ExecutiveDocument[] = []

type Editor = 'scope' | 'tests'

const EDITORS: { id: Editor; label: string }[] = [
  { id: 'scope', label: 'Scope' },
  { id: 'tests', label: 'Test plan' },
]

/** Which in-panel editor produces each of the pack's own artifact types. */
const EDITOR_FOR_TYPE: Partial<Record<ExecutiveDocument['type'], Editor>> = {
  'ops-scope': 'scope',
  'ops-test-plan': 'tests',
}

const chipCls =
  'inline-flex rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary/60 hover:text-foreground'

type Busy = 'md' | 'pdf' | 'zip' | null

export function OperationsPackPanel() {
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments ?? EMPTY)
  const [open, setOpen] = useState<Editor | null>(null)
  const [author, setAuthor] = useState('')
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (window.location.hash === '#operations-pack') {
      ref.current?.scrollIntoView({ block: 'start' })
    }
  }, [])

  const preview = useMemo(() => buildOperationsPack({ documents }), [documents])
  const total = OPERATIONS_PACK_SECTIONS.length

  const build = () => {
    const scopeDoc = documents.find(
      (d) => d.type === 'ops-scope' && d.moduleId === OPERATIONS_PACK_MODULE_ID
    )
    return buildOperationsPack({
      documents,
      author,
      scope: scopeDoc?.inputs ? opsScopeSummary(scopeDoc.inputs as OpsScopeInputs) : undefined,
      origin: window.location.origin,
      appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null,
    })
  }

  const run = (kind: Exclude<Busy, null>) => async () => {
    setError(null)
    setBusy(kind)
    try {
      const { markdown } = build()
      if (kind === 'md') {
        downloadBlob(
          new Blob([markdown], { type: 'text/markdown' }),
          bundleFilename('operations-pack', 'md')
        )
      } else if (kind === 'zip') {
        const blob = await buildZipBundle(operationsPackFiles(markdown))
        downloadBlob(blob, bundleFilename('operations-pack', 'zip'))
      } else {
        const { markdownToPdf } = await import('@/services/export/pdfExport')
        const filename = bundleFilename('operations-pack', 'pdf').replace(/\.pdf$/, '')
        await markdownToPdf(markdown, filename, OPERATIONS_PACK_TITLE, { wideTable: true })
      }
      logBusinessToolExport('operations-pack', kind)
    } catch (e) {
      setError(`Download failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section
      ref={ref}
      id="operations-pack"
      className="mb-6 scroll-mt-20 rounded-xl border border-primary/30 bg-card p-4"
      data-testid="operations-pack"
      aria-labelledby="operations-pack-title"
    >
      <h2 id="operations-pack-title" className="flex items-center gap-2 font-semibold text-primary">
        <PackageCheck size={16} /> {OPERATIONS_PACK_TITLE}
      </h2>
      <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
        One document for a change board or an on-call team: your scope, renewal and refresh windows,
        capacity plans, configuration fragments, rollout playbook, rehearsal, test plan, thresholds
        and closure evidence, in a fixed order with their review status. Anything not yet produced
        is listed with the tool that produces it. It is built in your browser and nothing is
        uploaded.
      </p>

      <p className="mt-3 text-sm" data-testid="operations-pack-count">
        <span className="font-semibold">
          {preview.present.length} of {total}
        </span>{' '}
        sections saved
      </p>

      {preview.missing.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Missing sections">
          {preview.missing.map((m) => (
            <li key={m.type}>
              {m.toolPath === OPERATIONS_PACK_PANEL_PATH && EDITOR_FOR_TYPE[m.type] ? (
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
                data-testid={`operations-pack-open-${ed.id}`}
              >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {ed.label}
              </Button>
              {isOpen && (
                <div className="border-t border-border p-3">
                  {ed.id === 'scope' && <OpsScopeEditor />}
                  {ed.id === 'tests' && (
                    <TestPlanEditor
                      checklistRole="ops"
                      type="ops-test-plan"
                      moduleId={OPERATIONS_PACK_MODULE_ID}
                      title="Operations test plan"
                      testId="ops-test-plan"
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:max-w-sm">
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <label htmlFor="operations-pack-author">Author (optional)</label>
          <Input
            id="operations-pack-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            className="h-8 text-xs"
            data-testid="operations-pack-author"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={run('zip')}
          disabled={busy !== null}
          data-testid="operations-pack-zip"
        >
          {busy === 'zip' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <FileArchive size={14} />
          )}
          Download zip (Markdown + CSV tables)
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={run('md')}
          disabled={busy !== null}
          data-testid="operations-pack-md"
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
          data-testid="operations-pack-pdf"
        >
          {busy === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
          Download PDF
        </Button>
      </div>
      {error && <p className="mt-2 text-[11px] text-status-error">{error}</p>}
    </section>
  )
}
