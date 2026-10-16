// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Add to collection" in the Library drawer: keeps this record in one of the
 * user's named collections, with a free-text annotation and the record's
 * state as it is now (revision, lifecycle, superseded-by, last verified), so a
 * later visit can show what changed since it was saved.
 */
import { useMemo, useState, type FC } from 'react'
import { Link } from 'react-router'
import { Check, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useModuleStore } from '@/store/useModuleStore'
import { useSaveArtifact } from '@/components/BusinessCenter/architecturePack/saveArtifact'
import type { ExecutiveDocument } from '@/services/storage/types'
import {
  addToCollection,
  collectionSaveRequest,
  emptyCollection,
  newCollectionModuleId,
  savedCollections,
  type RecordStateSource,
} from '@/services/research/libraryCollection'
import { RESEARCH_WORKSPACE_PATH } from '@/data/researchWorkspace'

const EMPTY: ExecutiveDocument[] = []
const NEW = '__new__'

export const AddToCollection: FC<{ record: RecordStateSource }> = ({ record }) => {
  const documents = useModuleStore((s) => s.artifacts.executiveDocuments ?? EMPTY)
  const collections = useMemo(() => savedCollections(documents), [documents])
  const save = useSaveArtifact()
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<string>(NEW)
  const [name, setName] = useState('')
  const [annotation, setAnnotation] = useState('')
  const [note, setNote] = useState<string | null>(null)

  const memberOf = collections.filter((c) =>
    c.collection.entries.some((e) => e.referenceId === record.referenceId)
  )
  const items = [
    ...collections.map((c) => ({
      id: c.doc.moduleId,
      label: `${c.collection.name} (${c.collection.entries.length})`,
    })),
    { id: NEW, label: 'New collection…' },
  ]

  const choose = (id: string) => {
    setTarget(id)
    const existing = collections
      .find((c) => c.doc.moduleId === id)
      ?.collection.entries.find((e) => e.referenceId === record.referenceId)
    setAnnotation(existing?.annotation ?? '')
    setNote(null)
  }

  const onOpen = () => {
    setOpen(true)
    choose(collections.length ? collections[collections.length - 1].doc.moduleId : NEW)
  }

  const onSave = () => {
    if (target === NEW) {
      const c = addToCollection(emptyCollection(name), record, annotation)
      const moduleId = newCollectionModuleId()
      save(collectionSaveRequest(c, moduleId))
      setTarget(moduleId)
      setNote(`Added to the new collection "${c.name}".`)
      return
    }
    const found = collections.find((c) => c.doc.moduleId === target)
    if (!found) return
    const already = found.collection.entries.some((e) => e.referenceId === record.referenceId)
    const c = addToCollection(found.collection, record, annotation)
    save(
      collectionSaveRequest(
        c,
        found.doc.moduleId,
        already ? `Annotation on ${record.referenceId} edited` : `${record.referenceId} added`
      )
    )
    setNote(already ? 'Annotation saved.' : `Added to "${c.name}".`)
  }

  return (
    <div className="space-y-2" data-testid="add-to-collection">
      {memberOf.length > 0 && (
        <p className="text-[12px] text-muted-foreground" data-testid="add-to-collection-member">
          In your collection{memberOf.length === 1 ? '' : 's'}:{' '}
          {memberOf.map((c) => c.collection.name).join(', ')}.{' '}
          <Link to={RESEARCH_WORKSPACE_PATH} className="text-primary hover:underline">
            Open your research workspace
          </Link>
        </p>
      )}
      {!open ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onOpen}
          data-testid="add-to-collection-open"
        >
          <FolderPlus size={14} aria-hidden="true" />
          Add to collection
        </Button>
      ) : (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[12px] text-muted-foreground">
            The collection keeps this record&apos;s revision, lifecycle, successor and last-verified
            date as they are today, so you can see later what changed. It stays in your browser.
          </p>
          <FilterDropdown
            items={items}
            selectedId={target}
            onSelect={choose}
            ariaLabel="Collection"
            defaultLabel="Choose a collection"
            size="sm"
            noContainer
            hideDefaultOption
          />
          {target === NEW && (
            <Input
              aria-label="New collection name"
              placeholder="Collection name, e.g. ML-KEM hybrid drafts"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
              data-testid="add-to-collection-name"
            />
          )}
          <Textarea
            aria-label="Your annotation"
            placeholder="Why this record matters to your question (optional)"
            value={annotation}
            onChange={(e) => setAnnotation(e.target.value)}
            rows={2}
            className="text-xs"
            data-testid="add-to-collection-annotation"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="gradient"
              onClick={onSave}
              disabled={target === NEW && !name.trim()}
              data-testid="add-to-collection-save"
            >
              Save to collection
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Done
            </Button>
            {note && (
              <span className="inline-flex items-center gap-1 text-[12px] text-status-success">
                <Check size={12} aria-hidden="true" />
                {note}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
