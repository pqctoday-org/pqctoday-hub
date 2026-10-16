// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Save bookmarks as a collection": turns the user's Library bookmarks into a
 * named collection, each record with its state as it is now. Bookmarks stay
 * as they are. The Library data loads on click.
 */
import { useState, type FC } from 'react'
import { FolderInput } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useSaveArtifact } from '@/components/BusinessCenter/architecturePack/saveArtifact'
import {
  collectionFromRecords,
  collectionSaveRequest,
  newCollectionModuleId,
  recordsForBookmarks,
} from '@/services/research/libraryCollection'

export const BookmarksToCollection: FC<{ testId?: string }> = ({
  testId = 'bookmarks-to-collection',
}) => {
  const bookmarkIds = useBookmarkStore((s) => s.libraryBookmarks)
  const save = useSaveArtifact()
  const [name, setName] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSave = async () => {
    setBusy(true)
    setNote(null)
    try {
      const { libraryData } = await import('@/data/libraryData')
      const { records, missingIds } = recordsForBookmarks(libraryData, bookmarkIds)
      const c = collectionFromRecords(name || 'Bookmarked records', records)
      save(collectionSaveRequest(c, newCollectionModuleId(), 'Saved from bookmarks'))
      setName('')
      setNote(
        `Saved "${c.name}" with ${records.length} record${records.length === 1 ? '' : 's'}.` +
          (missingIds.length
            ? ` ${missingIds.length} bookmark${missingIds.length === 1 ? ' is' : 's are'} no longer in the Library and ${missingIds.length === 1 ? 'was' : 'were'} left out.`
            : '')
      )
    } catch (e) {
      setNote(`Could not save: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={testId}>
      <Input
        aria-label="Collection name"
        placeholder="Collection name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 w-56 text-xs"
        data-testid={`${testId}-name`}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={onSave}
        disabled={busy || bookmarkIds.length === 0}
        data-testid={`${testId}-save`}
        title="Keeps your bookmarked records, with their state today, as a named collection"
      >
        <FolderInput size={14} aria-hidden="true" />
        Save {bookmarkIds.length} bookmark{bookmarkIds.length === 1 ? '' : 's'} as a collection
      </Button>
      {note && (
        <span className="text-[12px] text-muted-foreground" role="status">
          {note}
        </span>
      )}
    </div>
  )
}
