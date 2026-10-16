// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Download evidence bundle": one zip with the researcher's bookmarked Library
 * records (table, CSV, BibTeX, CSL-JSON), every run record saved to "my
 * evidence", a methods-and-limitations section and a list of what is missing,
 * each gap linked to the tool that fills it. Shown on the researcher's Command
 * Center and on the Library's bookmarks view. Works with nothing saved: the
 * bundle then lists every missing section.
 *
 * The bundle builder, the Library data and the PDF library load on click, so
 * neither page pays for them up front.
 */
import { useEffect, useRef, useState, type FC } from 'react'
import { Link } from 'react-router'
import { FileArchive, Loader2, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument } from '@/services/storage/types'
import { FIRST_RUN_TOOL } from '@/data/runTools'
import type { IndexableRecord } from '@/services/research/collectionChanges'

const EMPTY: ExecutiveDocument[] = []

interface EvidenceBundlePanelProps {
  /** Where the panel sits; sets its id, test ids and wording. */
  placement: 'command-center' | 'library'
}

const chipCls =
  'inline-flex rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary/60 hover:text-foreground'

/** Build the bundle from the current stores and download it as one zip. */
async function downloadEvidenceBundle(opts: {
  bookmarkIds: string[]
  documents: ExecutiveDocument[]
  title?: string
  author?: string
}): Promise<void> {
  const [libraryMod, bundleMod, exportMod, pdfMod, changesMod] = await Promise.all([
    import('@/data/libraryData'),
    import('@/services/evidenceBundle'),
    import('@/services/exportBundle'),
    import('@/services/export/pdfExport'),
    import('@/services/research/collectionChanges'),
  ])
  const { libraryData } = libraryMod
  const { records, missingIds } = bundleMod.recordsForBookmarks(libraryData, opts.bookmarkIds)
  const bundle = bundleMod.buildEvidenceBundle({
    records,
    missingBookmarkIds: missingIds,
    documents: opts.documents,
    title: opts.title,
    author: opts.author,
    origin: window.location.origin,
    // Collections show each record's current state next to the saved one.
    libraryIndex: changesMod.buildLibraryIndex(
      libraryData as unknown as IndexableRecord[],
      libraryMod.REFERENCE_ID_ALIASES ?? {}
    ),
  })
  const title = opts.title?.trim() || bundleMod.EVIDENCE_BUNDLE_TITLE
  const pdf = pdfMod.buildArtifactPdf(bundle.markdown, title, { wideTable: true }).output('blob')
  const blob = await exportMod.buildZipBundle(bundleMod.evidenceBundleFiles(bundle, { pdf }))
  exportMod.downloadBlob(blob, exportMod.bundleFilename('evidence-bundle', 'zip'))
}

export const EvidenceBundlePanel: FC<EvidenceBundlePanelProps> = ({ placement }) => {
  const bookmarkIds = useBookmarkStore((s) => s.libraryBookmarks)
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments ?? EMPTY)
  const runCount = documents.filter((d) => d.type === 'run-manifest').length
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLElement>(null)
  const id = placement === 'command-center' ? 'evidence-bundle' : 'library-evidence-bundle'

  useEffect(() => {
    if (window.location.hash === `#${id}`) ref.current?.scrollIntoView({ block: 'start' })
  }, [id])

  const onDownload = async () => {
    setError(null)
    setBusy(true)
    try {
      await downloadEvidenceBundle({ bookmarkIds, documents, title, author })
    } catch (e) {
      setError(`Download failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const missing: { label: string; to: string }[] = [
    ...(bookmarkIds.length === 0 ? [{ label: 'Bookmark Library records', to: '/library' }] : []),
    ...(runCount === 0
      ? [{ label: `Save a run from ${FIRST_RUN_TOOL.title}`, to: FIRST_RUN_TOOL.path }]
      : []),
  ]

  return (
    <section
      ref={ref}
      id={id}
      className="mb-6 scroll-mt-20 rounded-xl border border-primary/30 bg-card p-4"
      data-testid={`${id}`}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="flex items-center gap-2 font-semibold text-primary">
        <PackageCheck size={16} aria-hidden="true" /> Evidence bundle
      </h2>
      <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
        One zip you can cite or hand to a reviewer: your research question, your bookmarked and
        collected Library records with their revision, lifecycle and last-verified date (and the
        state you saved them in), their BibTeX and CSL-JSON, your claim matrix, every run record and
        reproduction you saved, the methods and limitations, and what is still missing. It is your
        own working record, not a PQC Today assessment or a validation. It is built in your browser
        and nothing is uploaded.
      </p>

      <p className="mt-3 text-sm" data-testid={`${id}-count`}>
        <span className="font-semibold">{bookmarkIds.length}</span> bookmarked record
        {bookmarkIds.length === 1 ? '' : 's'} · <span className="font-semibold">{runCount}</span>{' '}
        saved run record
        {runCount === 1 ? '' : 's'}
      </p>

      {missing.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Missing from the bundle">
          {missing.map((m) => (
            <li key={m.to}>
              <Link to={m.to} className={chipCls}>
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 md:max-w-xl md:grid-cols-2">
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <label htmlFor={`${id}-name`}>Title (optional)</label>
          <Input
            id={`${id}-name`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Evidence bundle"
            className="h-8 text-xs"
            data-testid={`${id}-name`}
          />
        </div>
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <label htmlFor={`${id}-author`}>Author (optional)</label>
          <Input
            id={`${id}-author`}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            className="h-8 text-xs"
            data-testid={`${id}-author`}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onDownload}
          disabled={busy}
          data-testid={`${id}-download`}
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <FileArchive size={14} aria-hidden="true" />
          )}
          Download evidence bundle
        </Button>
      </div>
      {error && <p className="mt-2 text-[11px] text-status-error">{error}</p>}
    </section>
  )
}
