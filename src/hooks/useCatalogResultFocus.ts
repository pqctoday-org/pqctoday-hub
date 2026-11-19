// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'

export function useCatalogResultFocus(tool: unknown, catalog: 'playground' | 'business') {
  useEffect(() => {
    if (typeof tool !== 'string' || !tool) return
    const resultAttribute = `data-${catalog}-result`
    const openerSelector = `[data-${catalog}-open]`
    const result = Array.from(document.querySelectorAll<HTMLElement>(`[${resultAttribute}]`)).find(
      (candidate) => candidate.getAttribute(resultAttribute) === tool
    )
    const opener = result?.matches(openerSelector)
      ? result
      : result?.querySelector<HTMLElement>(openerSelector)
    const target = opener ?? document.querySelector<HTMLElement>(`[data-${catalog}-search]`)
    target?.focus()
  }, [tool, catalog])
}
