// SPDX-License-Identifier: GPL-3.0-only
import { Link, useLocation } from 'react-router-dom'
import {
  Bookmark,
  BookmarkX,
  Library,
  Package,
  Download,
  Trash2,
  ExternalLink,
  GraduationCap,
  Globe,
  ShieldAlert,
  Wrench,
} from 'lucide-react'
import { Button } from '../ui/button'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { downloadCsv } from '@/utils/csvExport'
import { MODULE_CATALOG } from '../PKILearning/moduleData'
import { WORKSHOP_TOOLS } from '../Playground/workshopRegistry'
import { softwareData } from '@/data/migrateData'

export const BookmarksPanel = () => {
  const {
    libraryBookmarks,
    toggleLibraryBookmark,
    myLearnModules,
    toggleMyLearnModule,
    myTimelineCountries,
    toggleMyTimelineCountry,
    myThreats,
    toggleMyThreat,
    myPlaygroundTools,
    toggleMyPlaygroundTool,
    clearAll,
  } = useBookmarkStore()

  const location = useLocation()
  const isEmbedded = location.pathname.startsWith('/embed')

  const getHref = (path: string, searchParams: string = '') => {
    if (isEmbedded) {
      const existing = new URLSearchParams(location.search)
      const additional = new URLSearchParams(searchParams)
      additional.forEach((v, k) => existing.set(k, v))
      const qs = existing.toString()
      return `/embed${path}${qs ? `?${qs}` : ''}`
    }
    return `${path}${searchParams}`
  }

  const myProducts = useMigrateSelectionStore((s) => s.myProducts)
  const toggleMyProduct = useMigrateSelectionStore((s) => s.toggleMyProduct)
  const clearMyProducts = useMigrateSelectionStore((s) => s.clearMyProducts)

  const totalCount =
    libraryBookmarks.length +
    myProducts.length +
    myLearnModules.length +
    myTimelineCountries.length +
    myThreats.length +
    myPlaygroundTools.length

  const handleClearAll = () => {
    clearAll()
    clearMyProducts()
  }

  const getProductName = (key: string) => {
    const product = softwareData.find((s) => s.productId === key)
    return product?.softwareName ?? key
  }

  const handleExportJson = () => {
    const data = {
      libraryBookmarks,
      migrateProducts: myProducts.map(getProductName),
      myLearnModules,
      myTimelineCountries,
      myThreats,
      myPlaygroundTools,
      exportedAt: new Date().toISOString(),
    }
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
      ...myProducts.map((k) => `migrate,${getProductName(k)}`),
      ...myLearnModules.map((id) => `learn,${id}`),
      ...myTimelineCountries.map((name) => `timeline,${name}`),
      ...myThreats.map((id) => `threats,${id}`),
      ...myPlaygroundTools.map((id) => `playground,${id}`),
    ]
    downloadCsv(rows.join('\n'), 'pqc-bookmarks.csv')
  }

  if (totalCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Bookmark size={32} className="text-muted-foreground mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">No bookmarks yet</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Bookmark items across Library, Migrate, Learn, Timeline, Threats, and Playground to save
          them here for quick access.
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
            onClick={handleClearAll}
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
                    to={getHref('/library', `?ref=${encodeURIComponent(refId)}`)}
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
        {myProducts.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Package size={14} />
              Migrate ({myProducts.length})
            </h3>
            <div className="space-y-1">
              {myProducts.map((key) => {
                const name = getProductName(key)
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                  >
                    <Link
                      to={getHref('/migrate', `?q=${encodeURIComponent(name)}`)}
                      className="flex-1 flex items-center gap-2 min-w-0 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <span className="truncate">{name}</span>
                      <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleMyProduct(key)}
                      aria-label={`Remove ${name} bookmark`}
                    >
                      <BookmarkX size={14} className="text-muted-foreground" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Learn bookmarks */}
        {myLearnModules.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <GraduationCap size={14} />
              Learn ({myLearnModules.length})
            </h3>
            <div className="space-y-1">
              {myLearnModules.map((id) => {
                const mod = MODULE_CATALOG[id]
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                  >
                    <Link
                      to={getHref(`/learn/${encodeURIComponent(id)}`)}
                      className="flex-1 flex items-center gap-2 min-w-0 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <span className="truncate">{mod?.title ?? id}</span>
                      <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleMyLearnModule(id)}
                      aria-label={`Remove ${mod?.title ?? id} bookmark`}
                    >
                      <BookmarkX size={14} className="text-muted-foreground" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Timeline bookmarks */}
        {myTimelineCountries.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Globe size={14} />
              Timeline ({myTimelineCountries.length})
            </h3>
            <div className="space-y-1">
              {myTimelineCountries.map((country) => (
                <div
                  key={country}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <Link
                    to={getHref('/timeline', `?country=${encodeURIComponent(country)}`)}
                    className="flex-1 flex items-center gap-2 min-w-0 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <span className="truncate">{country}</span>
                    <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => toggleMyTimelineCountry(country)}
                    aria-label={`Remove ${country} bookmark`}
                  >
                    <BookmarkX size={14} className="text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Threats bookmarks */}
        {myThreats.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <ShieldAlert size={14} />
              Threats ({myThreats.length})
            </h3>
            <div className="space-y-1">
              {myThreats.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <Link
                    to={getHref('/threats', `?id=${encodeURIComponent(id)}`)}
                    className="flex-1 flex items-center gap-2 min-w-0 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <span className="font-mono text-xs truncate">{id}</span>
                    <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => toggleMyThreat(id)}
                    aria-label={`Remove ${id} bookmark`}
                  >
                    <BookmarkX size={14} className="text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Playground bookmarks */}
        {myPlaygroundTools.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Wrench size={14} />
              Playground ({myPlaygroundTools.length})
            </h3>
            <div className="space-y-1">
              {myPlaygroundTools.map((id) => {
                const tool = WORKSHOP_TOOLS.find((t) => t.id === id)
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                  >
                    <Link
                      to={getHref(`/playground/${encodeURIComponent(id)}`)}
                      className="flex-1 flex items-center gap-2 min-w-0 text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <span className="truncate">{tool?.name ?? id}</span>
                      <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleMyPlaygroundTool(id)}
                      aria-label={`Remove ${tool?.name ?? id} bookmark`}
                    >
                      <BookmarkX size={14} className="text-muted-foreground" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
