// SPDX-License-Identifier: GPL-3.0-only

import { useNavigate } from 'react-router-dom'
import { X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ENTITY_CONFIG } from './nodes/EntityNode'
import type { GraphNode, GraphEdge, EntityType } from '../data/graphTypes'

interface NodeDetailPanelProps {
  node: GraphNode
  edges: GraphEdge[]
  allNodes: Map<string, GraphNode>
  onClose: () => void
  onNavigateToNode: (nodeId: string) => void
}

function getDeepLink(node: GraphNode): string | null {
  switch (node.entityType) {
    case 'library':
      return `/library?ref=${node.id.replace('library:', '')}`
    case 'compliance':
      return '/compliance'
    case 'timeline':
      return '/timeline'
    case 'threat':
      return '/threats'
    case 'software':
      return '/migrate'
    case 'leader':
      return '/leaders'
    case 'algorithm':
      return '/algorithms'
    case 'module':
      return `/learn/${node.id.replace('module:', '')}`
    case 'track':
      return '/learn'
    case 'persona':
      return '/'
    case 'quiz':
      return '/learn/quiz'
    case 'certification':
      return '/migrate'
    case 'vendor':
      return '/migrate'
    default:
      return null
  }
}

export function NodeDetailPanel({
  node,
  edges,
  allNodes,
  onClose,
  onNavigateToNode,
}: NodeDetailPanelProps) {
  const navigate = useNavigate()
  const config = ENTITY_CONFIG[node.entityType]
  const Icon = config.icon
  const deepLink = getDeepLink(node)

  // Group edges by relationship type and direction
  const outgoing = edges.filter((e) => e.source === node.id)
  const incoming = edges.filter((e) => e.target === node.id)

  const groupedOutgoing = new Map<string, GraphEdge[]>()
  for (const edge of outgoing) {
    const list = groupedOutgoing.get(edge.relationshipType) ?? []
    list.push(edge)
    groupedOutgoing.set(edge.relationshipType, list)
  }

  const groupedIncoming = new Map<string, GraphEdge[]>()
  for (const edge of incoming) {
    const list = groupedIncoming.get(edge.relationshipType) ?? []
    list.push(edge)
    groupedIncoming.set(edge.relationshipType, list)
  }

  return (
    <div className="glass-panel p-4 w-full sm:w-72 max-h-[50vh] sm:max-h-[500px] overflow-y-auto">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.text}`} />
          <div>
            <h3 className="text-sm font-bold text-foreground">{node.label}</h3>
            <span className={`text-[10px] ${config.text} font-medium`}>{node.entityType}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {node.description && <p className="text-xs text-muted-foreground mb-3">{node.description}</p>}

      {deepLink && (
        <button
          onClick={() => navigate(deepLink)}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-3"
        >
          <ExternalLink className="w-3 h-3" />
          View in app
        </button>
      )}

      <div className="border-t border-border pt-2 space-y-3">
        <div className="text-xs text-muted-foreground">{node.connectionCount} connections</div>

        {groupedOutgoing.size > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-foreground uppercase tracking-wide mb-1">
              Outgoing
            </div>
            {Array.from(groupedOutgoing).map(([type, edgeList]) => (
              <div key={type} className="mb-2">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  {type} ({edgeList.length})
                </div>
                {edgeList.slice(0, 5).map((edge) => {
                  const target = allNodes.get(edge.target)
                  if (!target) return null
                  const targetConfig = ENTITY_CONFIG[target.entityType as EntityType]
                  const TargetIcon = targetConfig?.icon
                  return (
                    <button
                      key={edge.id}
                      className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded hover:bg-muted/50 transition-colors"
                      onClick={() => onNavigateToNode(edge.target)}
                    >
                      {TargetIcon && <TargetIcon className={`w-3 h-3 ${targetConfig.text}`} />}
                      <span className="text-xs text-foreground truncate">{target.label}</span>
                    </button>
                  )
                })}
                {edgeList.length > 5 && (
                  <div className="text-[10px] text-muted-foreground pl-1">
                    +{edgeList.length - 5} more
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {groupedIncoming.size > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-foreground uppercase tracking-wide mb-1">
              Incoming
            </div>
            {Array.from(groupedIncoming).map(([type, edgeList]) => (
              <div key={type} className="mb-2">
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  {type} ({edgeList.length})
                </div>
                {edgeList.slice(0, 5).map((edge) => {
                  const source = allNodes.get(edge.source)
                  if (!source) return null
                  const sourceConfig = ENTITY_CONFIG[source.entityType as EntityType]
                  const SourceIcon = sourceConfig?.icon
                  return (
                    <button
                      key={edge.id}
                      className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded hover:bg-muted/50 transition-colors"
                      onClick={() => onNavigateToNode(edge.source)}
                    >
                      {SourceIcon && <SourceIcon className={`w-3 h-3 ${sourceConfig.text}`} />}
                      <span className="text-xs text-foreground truncate">{source.label}</span>
                    </button>
                  )
                })}
                {edgeList.length > 5 && (
                  <div className="text-[10px] text-muted-foreground pl-1">
                    +{edgeList.length - 5} more
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
