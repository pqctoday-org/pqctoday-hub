// SPDX-License-Identifier: GPL-3.0-only
/**
 * The user's saved Library collections: each record with its annotation and
 * the state saved with it. Records can be removed; a collection can be
 * deleted (with a confirmation). Annotations are edited from the record's
 * Library drawer ("Add to collection").
 */
import { useMemo, useState, type FC } from 'react'
import { Link } from 'react-router'
import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useModuleStore } from '@/store/useModuleStore'
import { useSaveArtifact } from '@/components/BusinessCenter/architecturePack/saveArtifact'
import type { ExecutiveDocument } from '@/services/storage/types'
import {
  collectionSaveRequest,
  removeFromCollection,
  savedCollections,
} from '@/services/research/libraryCollection'
import { libraryRecordPath } from '@/data/researchWorkspace'

const EMPTY: ExecutiveDocument[] = []

export const CollectionsList: FC = () => {
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments ?? EMPTY)
  const remove = useModuleStore((s) => s.deleteExecutiveDocument)
  const collections = useMemo(() => savedCollections(documents), [documents])
  const save = useSaveArtifact()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (collections.length === 0) {
    return (
      <p className="text-xs text-muted-foreground" data-testid="collections-empty">
        No collections yet. Open a record in the{' '}
        <Link to="/library" className="text-primary hover:underline">
          Library
        </Link>{' '}
        and choose &quot;Add to collection&quot;, or save your bookmarks as one.
      </p>
    )
  }

  return (
    <ul className="space-y-2" data-testid="collections-list">
      {collections.map(({ doc, collection }) => (
        <li key={doc.id} className="rounded-lg border border-border bg-background/50">
          <details>
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm">
              <span className="font-semibold text-foreground">{collection.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {collection.entries.length} record{collection.entries.length === 1 ? '' : 's'} ·{' '}
                {doc.approvalStatus ?? 'draft'}
              </span>
            </summary>
            <div className="space-y-2 px-3 pb-3">
              {collection.entries.length === 0 ? (
                <p className="text-xs text-muted-foreground">This collection is empty.</p>
              ) : (
                <ul className="divide-y divide-border text-xs">
                  {collection.entries.map((e) => (
                    <li key={e.referenceId} className="flex items-start gap-2 py-1.5">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={libraryRecordPath(e.referenceId)}
                          className="font-medium text-primary hover:underline"
                        >
                          {e.referenceId}
                        </Link>{' '}
                        <span className="text-foreground">{e.saved.title}</span>
                        <div className="text-[11px] text-muted-foreground">
                          Saved: {e.saved.revision} · {e.saved.lifecycle || 'no lifecycle'} ·{' '}
                          {e.saved.lastVerified
                            ? `verified ${e.saved.lastVerified}`
                            : 'not re-verified'}
                          {e.saved.supersededBy.length
                            ? ` · superseded by ${e.saved.supersededBy.join(', ')}`
                            : ''}
                        </div>
                        {e.annotation && <p className="mt-0.5 text-foreground">{e.annotation}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground"
                        aria-label={`Remove ${e.referenceId} from ${collection.name}`}
                        onClick={() =>
                          save(
                            collectionSaveRequest(
                              removeFromCollection(collection, e.referenceId),
                              doc.moduleId,
                              `${e.referenceId} removed`
                            )
                          )
                        }
                      >
                        <X size={12} aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {confirmId === doc.id ? (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-foreground">Delete this collection?</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-7"
                    onClick={() => {
                      remove(doc.id)
                      setConfirmId(null)
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => setConfirmId(null)}
                  >
                    Keep
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
                  onClick={() => setConfirmId(doc.id)}
                >
                  <Trash2 size={12} aria-hidden="true" /> Delete collection
                </Button>
              )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  )
}
