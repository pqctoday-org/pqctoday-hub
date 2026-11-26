// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What the current route offers the drawer's Guide and Sources views: the page's guide id, the kind
 * of sources it lists, and the data file it is built from. The layout writes it as the route changes;
 * the drawer reads it, so those two views follow the route and a route with none has none.
 * In memory only.
 */
import { create } from 'zustand'
import type { PageId } from '@/data/userManualData'
import type { ViewType } from '@/data/authoritativeSourcesData'

interface DrawerPageState {
  guidePageId: PageId | null
  sourcesViewType: ViewType | null
  sourcesDataSource: string | undefined
  set: (next: {
    guidePageId: PageId | null
    sourcesViewType: ViewType | null
    sourcesDataSource: string | undefined
  }) => void
}

export const useDrawerPageStore = create<DrawerPageState>()((set) => ({
  guidePageId: null,
  sourcesViewType: null,
  sourcesDataSource: undefined,
  set: (next) => set(next),
}))
