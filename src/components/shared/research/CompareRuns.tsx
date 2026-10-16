// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Compare runs": pick two saved run records of the same tool, see what
 * differed in how they ran and in their results, add a second
 * implementation's result, a conclusion and what would falsify it, and save
 * it as a reproduction record.
 */
import { useMemo, useState, type FC } from 'react'
import { Link } from 'react-router'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useModuleStore } from '@/store/useModuleStore'
import { useSaveArtifact } from '@/components/BusinessCenter/architecturePack/saveArtifact'
import type { ExecutiveDocument } from '@/services/storage/types'
import { readRunManifest } from '@/services/runEvidence'
import { FIRST_RUN_TOOL } from '@/data/runTools'
import {
  compareRuns,
  newReproductionModuleId,
  readReproduction,
  REPRODUCTION_LIMITATION,
  REPRODUCTION_SCHEMA,
  reproductionSaveRequest,
} from '@/services/research/reproductionRecord'

const EMPTY: ExecutiveDocument[] = []

export const CompareRuns: FC = () => {
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments ?? EMPTY)
  const remove = useModuleStore((s) => s.deleteExecutiveDocument)
  const save = useSaveArtifact()
  const runs = useMemo(
    () =>
      documents
        .filter((d) => d.type === 'run-manifest')
        .sort((a, b) => (a.updatedAt ?? a.createdAt) - (b.updatedAt ?? b.createdAt))
        .flatMap((doc) => {
          const m = readRunManifest(doc)
          return m ? [{ doc, m }] : []
        }),
    [documents]
  )
  const records = useMemo(
    () =>
      documents.flatMap((doc) => {
        const r = readReproduction(doc)
        return r ? [{ doc, r }] : []
      }),
    [documents]
  )
  const [aId, setAId] = useState('')
  const [bId, setBId] = useState('')
  const [secondImplementation, setSecond] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [falsification, setFalsification] = useState('')
  const [note, setNote] = useState<string | null>(null)
  // Re-saving the same comparison updates the record instead of adding one.
  const [savedId, setSavedId] = useState<string | null>(null)

  const a = runs.find((r) => r.doc.moduleId === aId)
  const b = runs.find((r) => r.doc.moduleId === bId)
  const sameToolRuns = a ? runs.filter((r) => r.m.tool.id === a.m.tool.id && r !== a) : []
  const comparison = a && b ? compareRuns(a.m, b.m) : null

  const label = (r: (typeof runs)[number]) => r.doc.title

  if (runs.length < 2) {
    return (
      <p className="text-xs text-muted-foreground" data-testid="compare-runs-empty">
        Save two runs of the same tool to compare them (you have {runs.length}). Start with the{' '}
        <Link to={FIRST_RUN_TOOL.path} className="text-primary hover:underline">
          {FIRST_RUN_TOOL.title}
        </Link>{' '}
        known-answer check and choose &quot;Save to my evidence&quot;.
      </p>
    )
  }

  const onSave = () => {
    if (!a || !b || !comparison) return
    const id = savedId ?? newReproductionModuleId()
    save(
      reproductionSaveRequest(
        {
          schema: REPRODUCTION_SCHEMA,
          runs: [
            { moduleId: a.doc.moduleId, title: a.doc.title, finishedAt: a.m.runtime.finishedAt },
            { moduleId: b.doc.moduleId, title: b.doc.title, finishedAt: b.m.runtime.finishedAt },
          ],
          comparison,
          secondImplementation,
          conclusion,
          falsification,
        },
        id,
        savedId !== null
      )
    )
    if (!savedId) setSavedId(id)
    setNote('Reproduction record saved.')
  }

  return (
    <div className="space-y-3" data-testid="compare-runs">
      {records.length > 0 && (
        <ul className="space-y-1 text-xs">
          {records.map(({ doc, r }) => (
            <li key={doc.id} className="flex items-center gap-2">
              <span className="text-foreground">{doc.title}</span>
              <span className="text-[11px] text-muted-foreground">
                {r.falsification.trim() ? '' : 'no falsification condition · '}
                {doc.approvalStatus ?? 'draft'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground"
                aria-label={`Delete reproduction record ${doc.title}`}
                onClick={() => remove(doc.id)}
              >
                <Trash2 size={12} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Run A:</span>
          <FilterDropdown
            items={runs.map((r) => ({ id: r.doc.moduleId, label: label(r) }))}
            selectedId={aId}
            onSelect={(id) => {
              setAId(id)
              setBId('')
              setSavedId(null)
              setNote(null)
            }}
            ariaLabel="Run A"
            defaultLabel="Choose a saved run"
            size="sm"
            noContainer
            hideDefaultOption
          />
          <span className="text-[11px] text-muted-foreground">Run B:</span>
          <FilterDropdown
            items={sameToolRuns.map((r) => ({ id: r.doc.moduleId, label: label(r) }))}
            selectedId={bId}
            onSelect={(id) => {
              setBId(id)
              setSavedId(null)
              setNote(null)
            }}
            ariaLabel="Run B"
            defaultLabel={a ? 'Choose a run of the same tool' : 'Choose run A first'}
            size="sm"
            noContainer
            hideDefaultOption
            disabled={!a || sameToolRuns.length === 0}
          />
        </div>
        {a && sameToolRuns.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            No other saved run of {a.m.tool.title}. Run it again and save it to compare.
          </p>
        )}

        {comparison && (
          <div className="space-y-2 text-xs" data-testid="compare-runs-result">
            <p className="font-medium text-foreground">
              {comparison.sameResults
                ? 'Same cases, same results and same outputs.'
                : `${comparison.cases.length} case difference(s), ${comparison.negativeControls.length} negative-control difference(s).`}{' '}
              A: {comparison.summary.a.passed} passed / {comparison.summary.a.failed} failed · B:{' '}
              {comparison.summary.b.passed} passed / {comparison.summary.b.failed} failed
            </p>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                How the runs differed
              </p>
              {comparison.setup.length === 0 ? (
                <p className="text-muted-foreground">
                  Same tool version, site build, vectors and inputs.
                </p>
              ) : (
                <ul className="ml-4 list-disc">
                  {comparison.setup.map((d) => (
                    <li key={d.field} className="break-all">
                      {d.field}: {d.a} → {d.b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!comparison.sameResults && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Differences in results
                </p>
                <ul className="ml-4 list-disc">
                  {[...comparison.cases, ...comparison.negativeControls].map((d) => (
                    <li key={`${d.kind}:${d.id}`} className="break-all">
                      {d.id}: {d.kind.replace(/-/g, ' ')} ({d.a || '—'} → {d.b || '—'})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">{REPRODUCTION_LIMITATION}</p>

            <label
              htmlFor="compare-runs-second"
              className="block text-[11px] text-muted-foreground"
            >
              Second implementation&apos;s result (optional)
            </label>
            <Textarea
              id="compare-runs-second"
              rows={2}
              placeholder="e.g. the same vectors through another library, with its version and result"
              value={secondImplementation}
              onChange={(e) => setSecond(e.target.value)}
              className="text-xs"
            />
            <label
              htmlFor="compare-runs-conclusion"
              className="block text-[11px] text-muted-foreground"
            >
              Conclusion
            </label>
            <Textarea
              id="compare-runs-conclusion"
              rows={2}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              className="text-xs"
            />
            <label
              htmlFor="compare-runs-falsification"
              className="block text-[11px] text-muted-foreground"
            >
              What would falsify it
            </label>
            <Textarea
              id="compare-runs-falsification"
              rows={2}
              placeholder="e.g. any vector in the pinned file failing on a different build"
              value={falsification}
              onChange={(e) => setFalsification(e.target.value)}
              className="text-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="gradient" onClick={onSave} data-testid="compare-runs-save">
                Save reproduction record
              </Button>
              {note && (
                <span className="text-[11px] text-status-success" role="status">
                  {note}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
