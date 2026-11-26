// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { useRightPanelStore } from './useRightPanelStore'

const persistApi = () => useRightPanelStore.persist

describe('right panel store: the drawer has no tabs and no width toggle', () => {
  beforeEach(() => {
    localStorage.clear()
    useRightPanelStore.setState({ isOpen: false, activeTab: 'chat', isMinimized: false })
  })

  it('is at version 7', () => {
    expect(persistApi().getOptions().version).toBe(7)
  })

  it.each(['history', 'graph', 'nonsense', undefined])(
    'migrates a stored v6 "%s" view to the Assistant',
    (tab) => {
      const migrate = persistApi().getOptions().migrate!
      const state = migrate({ activeTab: tab, isExpanded: true }, 6) as Record<string, unknown>
      expect(state.activeTab).toBe('chat')
      expect(state).not.toHaveProperty('isExpanded')
    }
  )

  it.each(['chat', 'bookmarks', 'faq', 'workshop'])('keeps a valid stored "%s" view', (tab) => {
    const migrate = persistApi().getOptions().migrate!
    expect(
      (migrate({ activeTab: tab, isExpanded: false }, 6) as { activeTab: string }).activeTab
    ).toBe(tab)
  })

  it('does not persist the running workshop or the phone FAQ sheet as the place to come back to', () => {
    const partialize = persistApi().getOptions().partialize!
    const base = useRightPanelStore.getState()
    expect(partialize({ ...base, activeTab: 'workshop' })).toEqual({ activeTab: 'chat' })
    expect(partialize({ ...base, activeTab: 'faq' })).toEqual({ activeTab: 'chat' })
    expect(partialize({ ...base, activeTab: 'bookmarks' })).toEqual({ activeTab: 'bookmarks' })
  })

  it('the top bar button of the showing view closes the drawer; the other button switches', () => {
    const { toggle } = useRightPanelStore.getState()
    toggle('chat')
    expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'chat' })
    toggle('bookmarks')
    expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'bookmarks' })
    toggle('bookmarks')
    expect(useRightPanelStore.getState().isOpen).toBe(false)
  })
})
