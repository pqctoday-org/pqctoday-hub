// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Open a bundle" (read-only): a reviewer picks an evidence bundle zip and
 * sees its research question, collections (with the state at bundle time
 * and what has changed in the Library since), claim matrices, reproduction
 * records and run records. Nothing is saved; the file never leaves the
 * browser.
 */
import { useMemo, useState, type FC } from 'react'
import { Link } from 'react-router'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CLAIM_STATUS_LABELS } from '@/services/research/claimMatrix'
import { questionTypeLabel } from '@/services/research/researchQuestion'
import { MODE_TEXT } from '@/services/runManifest'
import type { ImportedBundle } from '@/services/research/bundleImport'
import { asLibraryCollection } from '@/services/research/bundleSections'
import { collectionChanges } from '@/services/research/collectionChanges'
import { libraryRecordPath } from '@/data/researchWorkspace'
import { useLibraryIndex } from './useLibraryIndex'

export const BundleReviewer: FC = () => {
  const [bundle, setBundle] = useState<ImportedBundle | null>(null)
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const index = useLibraryIndex()

  const sinceBundle = useMemo(() => {
    if (!bundle || !index) return new Map<string, string[]>()
    return new Map(
      collectionChanges(
        bundle.collections.map((c) => ({
          moduleId: c.moduleId,
          collection: asLibraryCollection(c),
        })),
        index
      ).map((x) => [`${x.collectionModuleId}:${x.referenceId}`, x.changes.map((c) => c.text)])
    )
  }, [bundle, index])

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    setBundle(null)
    setFileName(file.name)
    try {
      const { readEvidenceBundleZip } = await import('@/services/research/bundleImport')
      setBundle(await readEvidenceBundleZip(file))
    } catch (e) {
      setError(`Could not open ${file.name}: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const r = bundle?.research
  return (
    <div className="space-y-3" data-testid="bundle-reviewer">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="bundle-reviewer-file" className="text-[11px] text-muted-foreground">
          Evidence bundle zip
        </label>
        <Input
          id="bundle-reviewer-file"
          type="file"
          accept=".zip,application/zip"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="h-9 w-72 text-xs"
          data-testid="bundle-reviewer-file"
        />
        {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      </div>
      {error && <p className="text-[11px] text-status-error">{error}</p>}

      {bundle && (
        <div className="space-y-3 text-xs" data-testid="bundle-reviewer-result">
          <p className="text-foreground">
            <span className="font-semibold">{bundle.title ?? fileName}</span> — read-only; nothing
            from this file is saved. {bundle.runs.length} run record
            {bundle.runs.length === 1 ? '' : 's'} · {bundle.collections.length} collection
            {bundle.collections.length === 1 ? '' : 's'}
            {r
              ? ` · ${r.questions.length} question(s) · ${r.claimMatrices.length} claim matri${r.claimMatrices.length === 1 ? 'x' : 'ces'} · ${r.reproductions.length} reproduction record(s)`
              : ''}
          </p>
          {bundle.problems.length > 0 && (
            <ul className="ml-4 list-disc text-status-warning">
              {bundle.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}

          {r?.questions.map((q, i) => (
            <div key={`q${i}`}>
              <p className="font-semibold text-foreground">
                Question ({questionTypeLabel(q.type)}, {q.status})
              </p>
              <p className="text-foreground">{q.question}</p>
              <p className="text-muted-foreground">
                Inclusion: {q.inclusion || 'not stated'} · Exclusion: {q.exclusion || 'not stated'}{' '}
                · Threshold: {q.threshold || 'not stated'}
              </p>
            </div>
          ))}

          {bundle.collections.map((c) => (
            <div key={c.moduleId}>
              <p className="font-semibold text-foreground">
                Collection: {c.name} ({c.entries.length} records, {c.status})
              </p>
              <ul className="ml-4 list-disc">
                {c.entries.map((e) => {
                  const later = sinceBundle.get(`${c.moduleId}:${e.referenceId}`) ?? []
                  return (
                    <li key={e.referenceId}>
                      <Link
                        to={libraryRecordPath(e.currentId ?? e.referenceId)}
                        className="text-primary hover:underline"
                      >
                        {e.referenceId}
                      </Link>{' '}
                      {e.saved.title}
                      {e.annotation && <span className="text-foreground"> — {e.annotation}</span>}
                      {e.changes.length > 0 && (
                        <span className="text-muted-foreground">
                          {' '}
                          (changed before the bundle: {e.changes.map((x) => x.text).join('; ')})
                        </span>
                      )}
                      {later.length > 0 && (
                        <span className="text-status-warning">
                          {' '}
                          (changed since the bundle: {later.join('; ')})
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {r?.claimMatrices.map((m, i) => (
            <div key={`m${i}`}>
              <p className="font-semibold text-foreground">
                Claim matrix: {m.title || 'untitled'} ({m.claims.length} claims, {m.status})
              </p>
              <ul className="ml-4 list-disc">
                {m.claims.map((c) => (
                  <li key={c.id}>
                    {c.id} [{CLAIM_STATUS_LABELS[c.status] ?? c.status}] {c.claim}
                    <span className="text-muted-foreground">
                      {' '}
                      — for: {c.supporting.join(', ') || 'none'}; against:{' '}
                      {c.contrary.join(', ') || 'none'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {r?.reproductions.map((x, i) => (
            <div key={`r${i}`}>
              <p className="font-semibold text-foreground">Reproduction: {x.title}</p>
              <p className="text-muted-foreground">
                {x.comparison.sameResults
                  ? 'Same results.'
                  : `${x.comparison.cases.length} case difference(s).`}{' '}
                Falsified by: {x.falsification || 'not stated'}
              </p>
            </div>
          ))}

          {bundle.runs.length > 0 && (
            <div>
              <p className="font-semibold text-foreground">Run records</p>
              <ul className="ml-4 list-disc">
                {bundle.runs.map(({ path, manifest: m }) => (
                  <li key={path}>
                    {m.tool.title} · {m.runtime.finishedAt} · {m.summary.passed} passed /{' '}
                    {m.summary.failed} failed · site {m.site.appVersion || 'unknown'} commit{' '}
                    {m.site.commit ? m.site.commit.slice(0, 12) : 'unknown'}
                    <span className="text-muted-foreground">
                      {' '}
                      — {MODE_TEXT[m.executionMode] ?? m.executionMode}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground">A vector match is not a CAVP/ACVP validation.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
