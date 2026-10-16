// SPDX-License-Identifier: GPL-3.0-only
//
// Command Center panel for the architect: download every saved architecture
// artefact as one document, with the missing ones listed and linked to the
// tool that produces each. Works with nothing saved — the pack is then a
// checklist.

import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { FileDown, FileText, Loader2, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useModuleStore } from '@/store/useModuleStore'
import { bundleFilename, downloadBlob } from '@/services/exportBundle'
import {
  ARCHITECTURE_PACK_SECTIONS,
  ARCHITECTURE_PACK_TITLE,
  buildArchitecturePack,
} from '@/services/architecturePack'

const EMPTY: never[] = []

export function ArchitecturePackPanel() {
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments ?? EMPTY)
  const [author, setAuthor] = useState('')
  const [scope, setScope] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const build = () =>
    buildArchitecturePack({
      documents,
      author,
      scope,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null,
    })

  // Only the counts and the missing list drive the panel itself.
  const preview = useMemo(() => buildArchitecturePack({ documents }), [documents])
  const total = ARCHITECTURE_PACK_SECTIONS.length

  const onMarkdown = () => {
    setError(null)
    const { markdown } = build()
    downloadBlob(
      new Blob([markdown], { type: 'text/markdown' }),
      bundleFilename('architecture-pack', 'md')
    )
  }

  const onPdf = async () => {
    setError(null)
    setPdfBusy(true)
    try {
      const { markdownToPdf } = await import('@/services/export/pdfExport')
      const { markdown } = build()
      const filename = bundleFilename('architecture-pack', 'pdf').replace(/\.pdf$/, '')
      await markdownToPdf(markdown, filename, ARCHITECTURE_PACK_TITLE, { wideTable: true })
    } catch (e) {
      setError(`PDF export failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <section
      className="mb-6 rounded-xl border border-primary/30 bg-card p-4"
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
        One document for a design review: every architecture artifact you have saved, in a fixed
        order, with its review status. Anything not yet produced is listed with the tool that
        produces it. It is built in your browser and nothing is uploaded.
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
              {m.toolPath ? (
                <Link
                  to={m.toolPath}
                  className="inline-flex rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary/60 hover:text-foreground"
                >
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

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
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
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <label htmlFor="architecture-pack-scope">Scope (optional)</label>
          <Input
            id="architecture-pack-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="For example: payments platform, EU region"
            className="h-8 text-xs"
            data-testid="architecture-pack-scope"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onMarkdown}
          data-testid="architecture-pack-md"
        >
          <FileText size={14} /> Download Markdown
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onPdf}
          disabled={pdfBusy}
          data-testid="architecture-pack-pdf"
        >
          {pdfBusy ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
          Download PDF
        </Button>
      </div>
      {error && <p className="mt-2 text-[11px] text-status-error">{error}</p>}
    </section>
  )
}
