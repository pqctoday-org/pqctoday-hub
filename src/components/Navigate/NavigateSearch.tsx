// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import type { ForceClusterGraph } from '@/data/forceClusterGraph'
import { GRAPH_TOKEN, TYPE_LABEL } from './graphVisuals'
import { searchNodes } from './graphFilters'

interface NavigateSearchProps {
  graph: ForceClusterGraph
  /** Selects the record and flies the camera to it, drawing it first if the filters hide it. */
  onPick: (nodeId: string) => void
  /** Focus the box when it appears — only when the reader pressed "Search", which asks for it. */
  focusOnMount?: boolean
}

/**
 * Find a record by name across the whole graph, including the records the node-count cap or the
 * category filters leave out of the scene. A combobox: arrow keys move through the results, Enter
 * opens the highlighted one, Escape clears the box.
 */
export function NavigateSearch({ graph, onPick, focusOnMount }: NavigateSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (focusOnMount) inputRef.current?.focus()
  }, [focusOnMount])
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const results = useMemo(() => searchNodes(graph, query), [graph, query])
  const listId = useId()
  const optionId = (i: number) => `${listId}-opt-${i}`
  const open = query.trim().length >= 2

  const pick = (index: number) => {
    // eslint-disable-next-line security/detect-object-injection -- index is a numeric position bounded by results.length, not user input
    const node = results[index]
    if (!node) return
    onPick(node.id)
    setQuery('')
    setActive(0)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          role="combobox"
          aria-label="Find a record in the graph"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results.length > 0 ? optionId(active) : undefined}
          placeholder="Find a record (e.g. ML-KEM-768, FIPS 203, OpenSSL)"
          value={query}
          ref={inputRef}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              pick(active)
            } else if (e.key === 'Escape' && query) {
              // Clears the box; the page's own Escape (close the drawer) is left alone
              // once the box is already empty.
              e.preventDefault()
              setQuery('')
            }
          }}
          className="h-8 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching records"
          className="mt-1 max-h-56 space-y-0.5 overflow-y-auto rounded-md border border-border bg-card p-1"
        >
          {results.length === 0 && (
            <li className="px-2 py-1 text-xs text-muted-foreground">No record matches.</li>
          )}
          {results.map((node, i) => (
            // Keyboard selection is the combobox's own (arrow keys + Enter on the input, via
            // aria-activedescendant); the options take pointer clicks only, as in the ARIA pattern.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={node.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(i)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs ${
                i === active ? 'bg-muted text-foreground' : 'text-foreground'
              }`}
            >
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: `hsl(var(${GRAPH_TOKEN[node.type].varName}))` }}
                aria-hidden="true"
              />
              <span className="truncate">{node.label}</span>
              <span className="ml-auto shrink-0 text-muted-foreground">
                {TYPE_LABEL[node.type]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
