// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Save to my evidence": keeps a run record (run manifest) in the artifact
 * store as a `run-manifest` document, so the evidence bundle can include it.
 * The stored record holds digests and per-case results, never the vectors.
 * Saving the same run again updates the same document.
 */
import { useState, type FC } from 'react'
import { Link, useInRouterContext } from 'react-router'
import { Check, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSaveArtifact } from '@/components/BusinessCenter/architecturePack/saveArtifact'
import { runManifestSaveRequest } from '@/services/runEvidence'
import type { RunManifest } from '@/services/runManifest'
import { EVIDENCE_BUNDLE_LINK } from '@/data/runTools'

interface SaveRunToEvidenceProps {
  /** Builds this run's manifest at click time; null when there is no run. */
  getManifest: () => RunManifest | null | Promise<RunManifest | null>
  /** Identifies the run when `getManifest` is not memoised: a new key means
   * a new, unsaved run. Defaults to the `getManifest` function itself. */
  runKey?: string
  disabled?: boolean
  testId?: string
}

export const SaveRunToEvidence: FC<SaveRunToEvidenceProps> = ({
  getManifest,
  runKey,
  disabled,
  testId = 'run-record',
}) => {
  const save = useSaveArtifact()
  const inRouter = useInRouterContext()
  // The run that was last saved: a different one means a new, unsaved run.
  const runId: unknown = runKey ?? getManifest
  const [savedFor, setSavedFor] = useState<{ id: unknown } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saved = savedFor?.id === runId

  const onSave = async () => {
    setError(null)
    setBusy(true)
    try {
      const manifest = await getManifest()
      if (!manifest) return
      save(await runManifestSaveRequest(manifest))
      setSavedFor({ id: runId })
    } catch (e) {
      setError(`Could not save: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const linkCls = 'text-[11px] text-primary hover:underline'
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onSave}
        disabled={disabled || busy || saved}
        data-testid={`${testId}-save`}
        title="Keeps this run record in your browser so the evidence bundle can include it"
      >
        {busy ? (
          <Loader2 size={14} className="mr-1 animate-spin" aria-hidden="true" />
        ) : saved ? (
          <Check size={14} className="mr-1" aria-hidden="true" />
        ) : (
          <Save size={14} className="mr-1" aria-hidden="true" />
        )}
        {saved ? 'Saved to my evidence' : 'Save to my evidence'}
      </Button>
      {saved &&
        (inRouter ? (
          <Link to={EVIDENCE_BUNDLE_LINK} className={linkCls} data-testid={`${testId}-bundle-link`}>
            Download the evidence bundle
          </Link>
        ) : (
          <a href={EVIDENCE_BUNDLE_LINK} className={linkCls} data-testid={`${testId}-bundle-link`}>
            Download the evidence bundle
          </a>
        ))}
      {error && <span className="text-[11px] text-status-error">{error}</span>}
    </span>
  )
}
