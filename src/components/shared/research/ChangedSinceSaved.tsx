// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Changed since you saved": on each visit, every record in the user's
 * collections is compared with the current Library (new revision, lifecycle
 * change, newly superseded or deprecated, newer last-verified date, renamed,
 * removed). The list links to the record and to its entries in the
 * correction log. "Mark as seen" moves the saved state on.
 *
 * Shown on the Library page (only when something changed) and in the
 * researcher's research workspace. The Library data loads on mount.
 */
import { useMemo, type FC } from 'react'
import { Link } from 'react-router'
import { BellDot, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useModuleStore } from '@/store/useModuleStore'
import { useSaveArtifact } from '@/components/BusinessCenter/architecturePack/saveArtifact'
import type { ExecutiveDocument } from '@/services/storage/types'
import {
  collectionSaveRequest,
  markSeen,
  savedCollections,
} from '@/services/research/libraryCollection'
import {
  collectionChanges,
  indexLookup,
  type ChangedRecord,
} from '@/services/research/collectionChanges'
import { useLibraryIndex } from './useLibraryIndex'
import {
  libraryRecordPath,
  recordRevisionsPath,
  RESEARCH_WORKSPACE_PATH,
} from '@/data/researchWorkspace'

const EMPTY: ExecutiveDocument[] = []

interface ChangedSinceSavedProps {
  placement: 'library' | 'workspace'
}

export const ChangedSinceSaved: FC<ChangedSinceSavedProps> = ({ placement }) => {
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments ?? EMPTY)
  const collections = useMemo(() => savedCollections(documents), [documents])
  const index = useLibraryIndex()
  const save = useSaveArtifact()
  const changed = useMemo<ChangedRecord[]>(
    () =>
      index
        ? collectionChanges(
            collections.map((c) => ({ moduleId: c.doc.moduleId, collection: c.collection })),
            index
          )
        : [],
    [collections, index]
  )
  const testId = `changed-since-saved-${placement}`

  if (collections.length === 0) return null
  if (placement === 'library' && changed.length === 0) return null
  if (!index) return null

  const seen = (moduleIds: string[], ids?: string[]) => {
    for (const c of collections) {
      if (!moduleIds.includes(c.doc.moduleId)) continue
      const targets =
        ids ??
        changed.filter((x) => x.collectionModuleId === c.doc.moduleId).map((x) => x.referenceId)
      save(
        collectionSaveRequest(
          markSeen(c.collection, targets, indexLookup(index)),
          c.doc.moduleId,
          `Marked ${targets.length} change${targets.length === 1 ? '' : 's'} as seen`
        )
      )
    }
  }

  if (changed.length === 0) {
    return (
      <p className="text-xs text-muted-foreground" data-testid={testId}>
        Nothing in your collections has changed since you saved it.
      </p>
    )
  }

  const allModules = [...new Set(changed.map((c) => c.collectionModuleId))]
  return (
    <section
      className={
        placement === 'library'
          ? 'mb-4 rounded-lg border border-status-warning/40 bg-status-warning/5 p-3'
          : 'space-y-2'
      }
      data-testid={testId}
      aria-label="Changed since you saved"
    >
      <div className="flex flex-wrap items-center gap-2">
        <BellDot size={14} className="text-status-warning" aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground">
          {changed.length} record{changed.length === 1 ? '' : 's'} in your collections changed since
          you saved {changed.length === 1 ? 'it' : 'them'}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-[11px]"
          onClick={() => seen(allModules)}
          data-testid={`${testId}-seen-all`}
        >
          <Check size={12} aria-hidden="true" /> Mark all as seen
        </Button>
        {placement === 'library' && (
          <Link to={RESEARCH_WORKSPACE_PATH} className="text-[11px] text-primary hover:underline">
            Open your research workspace
          </Link>
        )}
      </div>
      <ul className="mt-2 space-y-1.5 text-xs">
        {changed.map((c) => (
          <li
            key={`${c.collectionModuleId}:${c.referenceId}`}
            className="flex flex-wrap items-start gap-x-2"
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground">{c.referenceId}</span>{' '}
              <span className="text-muted-foreground">
                ({c.collectionName}) {c.title}
              </span>
              <ul className="ml-3 list-disc text-foreground">
                {c.changes.map((ch) => (
                  <li key={ch.kind}>{ch.text}</li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2">
              {c.currentId && (
                <Link to={libraryRecordPath(c.currentId)} className="text-primary hover:underline">
                  Open record
                </Link>
              )}
              <Link
                to={recordRevisionsPath(c.referenceId)}
                className="text-primary hover:underline"
              >
                Revisions
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => seen([c.collectionModuleId], [c.referenceId])}
                aria-label={`Mark ${c.referenceId} as seen`}
              >
                Mark as seen
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
