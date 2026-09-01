// SPDX-License-Identifier: GPL-3.0-only
import { ArrowUpRight, ExternalLink, X } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type {
  ForceClusterEdge,
  ForceClusterNode,
  ForceClusterNodeType,
} from '@/data/forceClusterGraph'
import { GRAPH_TOKEN, TYPE_LABEL } from './graphVisuals'

function TypeDot({ type }: { type: ForceClusterNodeType }) {
  // eslint-disable-next-line security/detect-object-injection -- type is drawn from the typed ForceClusterNodeType union, not user input
  const varName = GRAPH_TOKEN[type].varName
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: `hsl(var(${varName}))` }}
      aria-hidden="true"
    />
  )
}

interface Connection {
  edge: ForceClusterEdge
  node: ForceClusterNode
  direction: 'outgoing' | 'incoming'
}

interface NavigateDetailPanelProps {
  node: ForceClusterNode
  connections: Connection[]
  onSelectNode: (nodeId: string) => void
  /** Spotlights node.type as a whole category — same zoom + hide-the-rest a category's 3D label click does, but (unlike that click) leaves this node's own panel open, since it's always inside the category it names. */
  onSelectCategory: (type: ForceClusterNodeType) => void
  /** Spotlights node.type + node.sub — same as onSelectCategory, one level deeper. */
  onSelectSub: (type: ForceClusterNodeType, sub: string) => void
  onClose: () => void
}

export function NavigateDetailPanel({
  node,
  connections,
  onSelectNode,
  onSelectCategory,
  onSelectSub,
  onClose,
}: NavigateDetailPanelProps) {
  const grouped = new Map<string, Connection[]>()
  for (const c of connections) {
    const key = `${c.direction}:${c.edge.rel}`
    grouped.set(key, [...(grouped.get(key) ?? []), c])
  }

  return (
    <div
      className="absolute right-4 top-4 bottom-4 z-10 w-[340px] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-2xl"
      role="complementary"
    >
      {/* Deliberately opaque, not .glass-panel (bg-card/80 + blur) — this
          panel sits directly over the busiest part of the scene (dense
          node/edge clusters, sometimes label text), and the translucent
          style made it hard to read (found via direct user testing). */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TypeDot type={node.type} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectCategory(node.type)}
            className="h-auto rounded px-1 py-0 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground hover:underline"
          >
            {TYPE_LABEL[node.type]}
          </Button>
          {node.sub && (
            <>
              <span className="text-xs text-muted-foreground" aria-hidden="true">
                ·
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSelectSub(node.type, node.sub)}
                className="h-auto rounded px-1 py-0 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground hover:underline"
              >
                {node.sub}
              </Button>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
          <X size={16} aria-hidden="true" />
        </Button>
      </div>

      <h2 className="mt-2 text-lg font-semibold text-foreground">{node.label}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{node.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {node.degree} connection{node.degree === 1 ? '' : 's'}
      </p>

      {/* One row per REAL destination this node actually has — node.href
          (the type's base hub page) plus every entry in extraLinks (a Learn
          module or Playground tool this specific entity is declared to
          teach/demo, from that source's own reverse-link field). Never more
          or fewer than what's real: a node with no extraLinks shows only
          its base link, exactly as before this feature existed. */}
      {(node.href || (node.extraLinks && node.extraLinks.length > 0)) && (
        <div className="mt-3 flex flex-col items-start gap-1.5">
          {node.href &&
            (node.href.startsWith('http') ? (
              <a
                href={node.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                View source <ExternalLink size={13} aria-hidden="true" />
              </a>
            ) : (
              <Link
                to={node.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open in hub <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            ))}
          {node.extraLinks?.map((link) =>
            link.href.startsWith('http') ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {link.label} <ExternalLink size={13} aria-hidden="true" />
              </a>
            ) : (
              <Link
                key={link.href}
                to={link.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {link.label} <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            )
          )}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {Array.from(grouped.entries()).map(([key, items]) => {
          const [direction, rel] = key.split(':')
          return (
            <div key={key}>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {rel} ({direction === 'outgoing' ? 'to' : 'from'}) · {items.length}
              </h3>
              <ul className="mt-1 space-y-1">
                {items.map((c) => (
                  <li key={`${c.edge.from}-${c.edge.to}-${c.edge.rel}`}>
                    <Button
                      variant="ghost"
                      onClick={() => onSelectNode(c.node.id)}
                      className="h-auto w-full justify-start gap-2 px-2 py-1 text-left text-sm font-normal text-foreground"
                    >
                      <TypeDot type={c.node.type} />
                      <span className="truncate">{c.node.label}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
        {connections.length === 0 && (
          <p className="text-sm text-muted-foreground">No connections yet.</p>
        )}
      </div>
    </div>
  )
}
