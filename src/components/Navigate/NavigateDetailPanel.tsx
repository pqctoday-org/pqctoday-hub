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
  onClose: () => void
}

export function NavigateDetailPanel({
  node,
  connections,
  onSelectNode,
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
        <div className="flex items-center gap-2">
          <TypeDot type={node.type} />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {TYPE_LABEL[node.type]}
            {node.sub ? ` · ${node.sub}` : ''}
          </span>
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

      {node.href &&
        (node.href.startsWith('http') ? (
          <a
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            View source <ExternalLink size={13} aria-hidden="true" />
          </a>
        ) : (
          <Link
            to={node.href}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open in hub <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        ))}

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
