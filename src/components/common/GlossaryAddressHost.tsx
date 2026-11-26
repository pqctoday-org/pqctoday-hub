// SPDX-License-Identifier: AGPL-3.0-only
/**
 * GlossaryAddressHost: opens the drawer on the Glossary view, on a term, from `?glossary=<term>` on
 * whatever page the address is on. Sibling of TryToolModalHost: the address is the state, so a link
 * opens it, and closing the drawer (or switching it to another view) removes the parameter with a
 * replace, so Back does not reopen it. Other parameters stay. Going Back (or Forward) to an address
 * without the parameter closes the drawer the address had opened, so Back from a term returns to the
 * page as it was before the term was opened.
 */
import { useEffect, useRef } from 'react'
import { useNavigationType, useSearchParams } from 'react-router'
import { useGlossaryDrawerStore } from '@/store/useGlossaryDrawerStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'

export function GlossaryAddressHost() {
  const [params, setParams] = useSearchParams()
  const term = params.get('glossary')
  const navigationType = useNavigationType()
  const showing = useRightPanelStore((s) => s.isOpen && s.activeTab === 'glossary')
  // The term the drawer was last opened on from the address; null while the address has none.
  const opened = useRef<string | null>(null)

  useEffect(() => {
    if (term === null) {
      // Back or Forward to an address without the term: the drawer the address opened goes with it.
      if (opened.current !== null && navigationType === 'POP' && showing) {
        useRightPanelStore.getState().close()
      }
      opened.current = null
      return
    }
    if (opened.current !== term) {
      // A new address: open the drawer on that term.
      opened.current = term
      useGlossaryDrawerStore.getState().focus(term)
      useRightPanelStore.getState().open('glossary')
      return
    }
    if (!showing) {
      // The drawer was closed or switched to another view: the address no longer asks for the term.
      opened.current = null
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('glossary')
          return next
        },
        { replace: true }
      )
    }
  }, [term, showing, setParams, navigationType])

  return null
}
