// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { Bookmark, BookmarkX, Library, Package, Download, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { downloadCsv } from '@/utils/csvExport'

export const BookmarksPanel = () => {
  const {
    libraryBookmarks,
    migrateBookmarks,
    toggleLibraryBookmark,
    toggleMigrateBookmark,
    clearAll,
  } = useBookmarkStore()

  const totalCount = libraryBookmarks.length + migrateBookmarks.length

  const handleExportJson = () => {
    const data = { libraryBookmarks, migrateBookmarks, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pqc-bookmarks.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCsv = () => {
    const rows = [
      'type,id',
      ...libraryBookmarks.map((id) => `library,${id}`),
      ...migrateBookmarks.map((name) => `migrate,${name}`),
    ]
    downloadCsv(rows.join('\n'), 'pqc-bookmarks.csv')
  }

  if (totalCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Bookmark size={32} className="text-muted-foreground mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">No bookmarks yet</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Bookmark documents in the Library or products in Migrate to save them here for quick
          access.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header with export + clear */}
      <div className="flex items-center justify-between px-4 md:px-12 py-3 border-b border-border">
        <span className="text-xs text-muted-foreground">
          {totalCount} bookmark{totalCount !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={handleExportJson}
          >
            <Download size={12} />
            JSON
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleExportCsv}>
            <Download size={12} />
            CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
            onClick={clearAll}
          >
            <Trash2 size={12} />
            Clear
          </Button>
        </div>
      </div>

      <div className="px-4 md:px-12 py-4 space-y-6 max-w-4xl mx-auto">
        {/* Library bookmarks */}
        {libraryBookmarks.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Library size={14} />
              Library ({libraryBookmarks.length})
            </h3>
            <div className="space-y-1">
              {libraryBookmarks.map((refId) => (
                <div
                  key={refId}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <Link
                    to={`/library?ref=${encodeURIComponent(refId)}`}
                    className="flex-1 flex items-center gap-2 min-w-0 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <span className="font-mono text-xs truncate">{refId}</span>
                    <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => toggleLibraryBookmark(refId)}
                    aria-label={`Remove ${refId} bookmark`}
                  >
                    <BookmarkX size={14} className="text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Migrate bookmarks */}
        {migrateBookmarks.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Package size={14} />
              Migrate ({migrateBookmarks.length})
            </h3>
            <div className="space-y-1">
              {migrateBookmarks.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <Link
                    to={`/migrate?q=${encodeURIComponent(name)}`}
                    className="flex-1 flex items-center gap-2 min-w-0 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <span className="truncate">{name}</span>
                    <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => toggleMigrateBookmark(name)}
                    aria-label={`Remove ${name} bookmark`}
                  >
                    <BookmarkX size={14} className="text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
