// SPDX-License-Identifier: GPL-3.0-only

import { useState, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { BarChart3 } from 'lucide-react'
import { ClusterNode, type ClusterNodeData } from './nodes/ClusterNode'
import { ENTITY_CONFIG } from './nodes/EntityNode'
import type { KnowledgeGraph, EntityType, RelationshipType } from '../data/graphTypes'

interface CoverageViewProps {
  graph: KnowledgeGraph
}

const nodeTypes = { cluster: ClusterNode }

const TYPE_LABELS: Record<EntityType, string> = {
  library: 'Library',
  compliance: 'Compliance',
  timeline: 'Timeline',
  threat: 'Threats',
  software: 'Software',
  certification: 'Certifications',
  leader: 'Leaders',
  glossary: 'Glossary',
  module: 'Modules',
  quiz: 'Quiz',
  country: 'Countries',
  source: 'Sources',
  algorithm: 'Algorithms',
  track: 'Learning Tracks',
  persona: 'Learning Personas',
  vendor: 'Vendors',
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  'library-depends-on': 'Library Depends On',
  'compliance-references': 'Compliance References',
  'compliance-timeline': 'Compliance Timeline',
  'library-teaches': 'Library Teaches',
  'library-covers-algorithm': 'Library Covers Algorithm',
  'threat-teaches': 'Threat Teaches',
  'software-certified': 'Software Certified',
  'glossary-teaches': 'Glossary Teaches',
  'quiz-teaches': 'Quiz Teaches',
  'timeline-country': 'Timeline by Country',
  'leader-country': 'Leader by Country',
  'source-feeds': 'Source Feeds',
  'software-teaches': 'Software Teaches',
  'module-in-track': 'Module in Track',
  'persona-recommends': 'Persona Recommends',
  'threat-targets-algorithm': 'Threat Targets Algorithm',
  'module-qa-references': 'Module Q&A References',
  'vendor-produces': 'Vendor Produces',
  'vendor-country': 'Vendor by Country',
  'leader-references-library': 'Leader References Library',
  'certification-validates-algorithm': 'Certification Validates Algorithm',
  'software-implements-algorithm': 'Software Implements Algorithm',
  'compliance-applies-to-country': 'Compliance Applies to Country',
  'algorithm-replaces': 'Algorithm Replaces',
}

function buildClusterGraph(graph: KnowledgeGraph): {
  nodes: Node<ClusterNodeData>[]
  edges: Edge[]
} {
  const types = Array.from(graph.nodesByType.keys())
  const cols = 4
  const spacing = { x: 260, y: 200 }

  const clusterNodes: Node<ClusterNodeData>[] = types.map((type, i) => {
    const typeNodes = graph.nodesByType.get(type) ?? []
    const orphanCount = typeNodes.filter((n) => n.connectionCount === 0).length
    const totalConnections = typeNodes.reduce((sum, n) => sum + n.connectionCount, 0)

    return {
      id: `cluster:${type}`,
      type: 'cluster',
      position: {
        x: (i % cols) * spacing.x,
        y: Math.floor(i / cols) * spacing.y,
      },
      data: {
        entityType: type,
        label: TYPE_LABELS[type] ?? type,
        count: typeNodes.length,
        connectionCount: totalConnections,
        orphanCount,
      },
    }
  })

  // Aggregate edges between entity types
  const typeEdgeCounts = new Map<string, number>()
  for (const edge of graph.edges) {
    const sourceNode = graph.nodes.get(edge.source)
    const targetNode = graph.nodes.get(edge.target)
    if (!sourceNode || !targetNode) continue
    if (sourceNode.entityType === targetNode.entityType) continue

    const key = [sourceNode.entityType, targetNode.entityType].sort().join('↔')
    typeEdgeCounts.set(key, (typeEdgeCounts.get(key) ?? 0) + 1)
  }

  const clusterEdges: Edge[] = Array.from(typeEdgeCounts.entries()).map(([key, count]) => {
    const [type1, type2] = key.split('↔')
    return {
      id: `cluster-edge:${key}`,
      source: `cluster:${type1}`,
      target: `cluster:${type2}`,
      label: String(count),
      style: {
        stroke: 'hsl(var(--muted-foreground))',
        strokeWidth: Math.min(1 + Math.log2(count), 4),
        opacity: 0.4,
      },
      labelStyle: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
      labelBgStyle: { fill: 'hsl(var(--card))' },
      labelBgPadding: [4, 2] as [number, number],
    }
  })

  return { nodes: clusterNodes, edges: clusterEdges }
}

export function CoverageView({ graph }: CoverageViewProps) {
  const [expandedType, setExpandedType] = useState<EntityType | null>(null)

  const clusterLayout = useMemo(() => buildClusterGraph(graph), [graph])
  const [nodes, , onNodesChange] = useNodesState(clusterLayout.nodes)
  const [edges, , onEdgesChange] = useEdgesState(clusterLayout.edges)

  // Sorted coverage stats
  const coverageStats = useMemo(() => {
    return Array.from(graph.nodesByType.entries())
      .map(([type, typeNodes]) => {
        const orphanCount = typeNodes.filter((n) => n.connectionCount === 0).length
        const totalConnections = typeNodes.reduce((sum, n) => sum + n.connectionCount, 0)
        const density = typeNodes.length > 0 ? totalConnections / typeNodes.length : 0
        return { type, count: typeNodes.length, orphanCount, totalConnections, density }
      })
      .sort((a, b) => b.count - a.count)
  }, [graph])

  const handleClusterClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const type = node.id.replace('cluster:', '') as EntityType
    setExpandedType((prev) => (prev === type ? null : type))
  }, [])

  const expandedEntities = useMemo(() => {
    if (!expandedType) return []
    return (graph.nodesByType.get(expandedType) ?? [])
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 50)
  }, [graph, expandedType])

  // Aggregate edge type counts for the summary
  const edgeTypeCounts = useMemo(() => {
    const counts: Partial<Record<RelationshipType, number>> = {}
    for (const edge of graph.edges) {
      counts[edge.relationshipType] = (counts[edge.relationshipType] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type: type as RelationshipType, count }))
  }, [graph])

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 justify-center">
        <div className="glass-panel px-4 py-2 text-center">
          <div className="text-lg font-bold text-foreground">{graph.stats.totalNodes}</div>
          <div className="text-[10px] text-muted-foreground">Total Entities</div>
        </div>
        <div className="glass-panel px-4 py-2 text-center">
          <div className="text-lg font-bold text-foreground">{graph.stats.totalEdges}</div>
          <div className="text-[10px] text-muted-foreground">Total Connections</div>
        </div>
        <div className="glass-panel px-4 py-2 text-center">
          <div className="text-lg font-bold text-foreground">
            {graph.stats.avgConnectionsPerNode}
          </div>
          <div className="text-[10px] text-muted-foreground">Avg Links/Entity</div>
        </div>
        <div className="glass-panel px-4 py-2 text-center">
          <div className="text-lg font-bold text-status-warning">{graph.stats.orphanedNodes}</div>
          <div className="text-[10px] text-muted-foreground">Unconnected</div>
        </div>
        <div className="glass-panel px-4 py-2 text-center">
          <div className="text-lg font-bold text-status-success">
            {graph.stats.totalNodes > 0
              ? Math.round(
                  ((graph.stats.totalNodes - graph.stats.orphanedNodes) / graph.stats.totalNodes) *
                    100
                )
              : 0}
            %
          </div>
          <div className="text-[10px] text-muted-foreground">Coverage</div>
        </div>
      </div>

      {/* Coverage grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {coverageStats.map(({ type, count, orphanCount, density }) => {
          const config = ENTITY_CONFIG[type]
          const Icon = config.icon
          const isExpanded = expandedType === type

          return (
            <button
              key={type}
              className={`glass-panel p-3 text-left transition-all ${isExpanded ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => setExpandedType((prev) => (prev === type ? null : type))}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${config.text}`} />
                <span className="text-sm font-semibold text-foreground">{TYPE_LABELS[type]}</span>
                <span className="text-xs text-muted-foreground ml-auto">{count}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Density</span>
                  <span className="text-foreground">{density.toFixed(1)} avg</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(density * 20, 100)}%` }}
                  />
                </div>
                {orphanCount > 0 && (
                  <div className="text-[10px] text-status-warning">{orphanCount} unconnected</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Expanded entity list */}
      {expandedType && expandedEntities.length > 0 && (
        <div className="glass-panel p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            {TYPE_LABELS[expandedType]} ({expandedEntities.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {expandedEntities.map((entity) => (
              <div
                key={entity.id}
                className="flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-muted/50"
              >
                <span className="text-foreground truncate">{entity.label}</span>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {entity.connectionCount} links
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cluster graph */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Domain Relationship Map</span>
        </div>
        <div className="h-[400px] rounded-lg border border-border overflow-hidden bg-background">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleClusterClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.4 }}
            minZoom={0.3}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Controls className="!bg-card !border-border !shadow-sm [&>button]:!bg-muted [&>button]:!text-foreground [&>button]:!border-border" />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="hsl(var(--border))"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Edge type breakdown */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Relationship Types</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {edgeTypeCounts.map(({ type, count }) => (
            <div key={type} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{RELATIONSHIP_LABELS[type] ?? type}</span>
              <span className="text-foreground font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
