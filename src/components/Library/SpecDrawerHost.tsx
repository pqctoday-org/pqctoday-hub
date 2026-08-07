// SPDX-License-Identifier: GPL-3.0-only
/**
 * SpecDrawerHost — opens the library's document drawer *in place*, on whatever
 * page you're already on, from a `?spec=<library reference_id>` param.
 *
 * Mounted once at the router level (App.tsx), so any surface can deep-link a
 * specification without sending the reader to /library and losing their scroll
 * position, filters and table state. The URL carries the state, so Back closes
 * the drawer and the link stays copy-pasteable.
 *
 * Everything heavy — LibraryDetailDrawer and the ~900KB library CSV it reads —
 * is behind a dynamic import, deliberately: routes are code-split, and a static
 * import here would pull the whole library dataset into every page's bundle.
 * The cost is paid only once someone actually opens a spec.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import type { LibraryItem } from '@/data/libraryData'
import type { LibraryDetailDrawer as LibraryDetailDrawerType } from './redesign/LibraryDetailDrawer'

interface LoadedSpec {
  ref: string
  Drawer: typeof LibraryDetailDrawerType
  item: LibraryItem
}

export function SpecDrawerHost() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const specRef = params.get('spec')
  const [loaded, setLoaded] = useState<LoadedSpec | null>(null)
  const libraryBookmarks = useBookmarkStore((s) => s.libraryBookmarks)
  const toggleLibraryBookmark = useBookmarkStore((s) => s.toggleLibraryBookmark)

  useEffect(() => {
    if (!specRef) {
      setLoaded(null)
      return
    }
    let cancelled = false
    // Unknown or unloadable reference: fall back to the full library page
    // rather than leaving the reader with an empty overlay.
    const fallback = () => {
      if (!cancelled) navigate(`/library?ref=${encodeURIComponent(specRef)}`, { replace: true })
    }
    Promise.all([import('./redesign/LibraryDetailDrawer'), import('@/data/libraryData')])
      .then(([drawerMod, dataMod]) => {
        if (cancelled) return
        const item = dataMod.findLibraryItemByRef(specRef)
        if (!item) return fallback()
        setLoaded({ ref: specRef, Drawer: drawerMod.LibraryDetailDrawer, item })
      })
      .catch(fallback)
    return () => {
      cancelled = true
    }
  }, [specRef, navigate])

  // Render nothing until the *current* ref has resolved, so switching specs
  // never flashes the previous document.
  if (!specRef || !loaded || loaded.ref !== specRef) return null

  const { Drawer, item } = loaded
  return (
    <Drawer
      item={item}
      bookmarked={libraryBookmarks.includes(item.referenceId)}
      onToggleBookmark={toggleLibraryBookmark}
      onClose={() => {
        const next = new URLSearchParams(params)
        next.delete('spec')
        // replace, not push: Back should leave the page, not reopen the drawer.
        setParams(next, { replace: true })
      }}
    />
  )
}
