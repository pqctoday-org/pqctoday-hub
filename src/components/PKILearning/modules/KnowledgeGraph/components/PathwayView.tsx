// SPDX-License-Identifier: GPL-3.0-only

import { useMemo, useCallback, useState } from 'react'
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
import { GitBranch } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { EntityNode, type EntityNodeData } from './nodes/EntityNode'
import { RelationshipEdge, type RelationshipEdgeData } from './edges/RelationshipEdge'
import { GraphLegend } from './GraphLegend'
import { MODULE_TRACKS } from '@/components/PKILearning/moduleData'
import { useModuleStore } from '@/store/useModuleStore'
import type { KnowledgeGraph, EntityType } from '../data/graphTypes'
import type { SearchResult } from '../data/searchIndex'

interface PathwayViewProps {
  graph: KnowledgeGraph
  searchQuery?: string
  searchResults?: SearchResult[]
}

const nodeTypes = { entity: EntityNode }
const edgeTypes = { relationship: RelationshipEdge }

function buildPathwayLayout(
  graph: KnowledgeGraph,
  moduleIds: string[],
  completedModules: Set<string>,
  inProgressModules: Set<string>,
  searchMatchedModuleIds: Set<string>
): { nodes: Node<EntityNodeData>[]; edges: Edge<RelationshipEdgeData>[] } {
  const visibleNodeIds = new Set<string>()
  const moduleNodeIds = new Set<string>()

  // Add module nodes
  for (const modId of moduleIds) {
    const nodeId = `module:${modId}`
    if (graph.nodes.has(nodeId)) {
      visibleNodeIds.add(nodeId)
      moduleNodeIds.add(nodeId)
    }
  }

  // Add connected library, quiz, glossary, threat nodes (1 hop from modules)
  const connectedTypes: EntityType[] = ['library', 'quiz', 'glossary', 'threat']
  for (const modNodeId of moduleNodeIds) {
    const neighbors = graph.adjacency.get(modNodeId)
    if (!neighbors) continue
    for (const neighborId of neighbors) {
      const neighbor = graph.nodes.get(neighborId)
      if (neighbor && connectedTypes.includes(neighbor.entityType)) {
        visibleNodeIds.add(neighborId)
      }
    }
  }

  // Layout: modules in top row, others below grouped by type
  const moduleNodes = moduleIds.map((id) => `module:${id}`).filter((id) => visibleNodeIds.has(id))
  const otherNodes = Array.from(visibleNodeIds).filter((id) => !moduleNodeIds.has(id))

  // Group others by entity type for cleaner layout
  const grouped = new Map<EntityType, string[]>()
  for (const nodeId of otherNodes) {
    const node = graph.nodes.get(nodeId)
    if (!node) continue
    const list = grouped.get(node.entityType) ?? []
    list.push(nodeId)
    grouped.set(node.entityType, list)
  }

  const flowNodes: Node<EntityNodeData>[] = []
  const moduleSpacing = 250
  const moduleY = 0

  // Place modules in top row
  for (let i = 0; i < moduleNodes.length; i++) {
    const node = graph.nodes.get(moduleNodes[i])
    if (!node) continue

    const modId = node.id.replace('module:', '')
    const isCompleted = completedModules.has(modId)
    const isInProgress = inProgressModules.has(modId)
    const isSearchMatch = searchMatchedModuleIds.has(modId)

    flowNodes.push({
      id: node.id,
      type: 'entity',
      position: { x: i * moduleSpacing, y: moduleY },
      data: {
        label: node.label,
        entityType: node.entityType,
        description: isCompleted ? 'Completed' : isInProgress ? 'In Progress' : node.description,
        connectionCount: node.connectionCount,
        selected: isCompleted,
      },
      style: isSearchMatch
        ? {
            border: '2px solid hsl(var(--primary))',
            boxShadow: '0 0 8px hsl(var(--primary) / 0.5)',
          }
        : isCompleted
          ? { border: '2px solid hsl(var(--success))' }
          : isInProgress
            ? { border: '2px solid hsl(var(--warning))' }
            : undefined,
    })
  }

  // Place other nodes below, grouped by type
  let rowY = 250
  for (const [, nodeIds] of grouped) {
    for (let i = 0; i < nodeIds.length; i++) {
      const node = graph.nodes.get(nodeIds[i])
      if (!node) continue

      flowNodes.push({
        id: node.id,
        type: 'entity',
        position: { x: i * 220, y: rowY },
        data: {
          label: node.label,
          entityType: node.entityType,
          description: node.description,
          connectionCount: node.connectionCount,
        },
      })
    }
    rowY += 150
  }

  // Edges between visible nodes
  const flowEdges: Edge<RelationshipEdgeData>[] = graph.edges
    .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'relationship',
      data: {
        relationshipType: e.relationshipType,
        label: e.label,
      },
    }))

  return { nodes: flowNodes, edges: flowEdges }
}

export function PathwayView({ graph, searchQuery, searchResults }: PathwayViewProps) {
  const trackItems = useMemo(
    () =>
      MODULE_TRACKS.map((t) => ({
        id: t.track,
        label: t.track,
        count: t.modules.length,
      })),
    []
  )

  const [selectedTrack, setSelectedTrack] = useState(MODULE_TRACKS[0]?.track ?? '')

  // Extract matched module slugs from search results
  const searchMatchedModuleIds = useMemo<Set<string>>(() => {
    if (!searchResults?.length) return new Set()
    const matched = new Set<string>()
    for (const r of searchResults) {
      if (r.entityType === 'module') {
        matched.add(r.id.replace('module:', ''))
      }
    }
    return matched
  }, [searchResults])

  // When search is active, auto-select the track with the most matched modules
  const searchDrivenTrack = useMemo<string | null>(() => {
    if (!searchMatchedModuleIds.size) return null
    let best: string | null = null
    let bestCount = 0
    for (const track of MODULE_TRACKS) {
      const count = track.modules.filter((m) => searchMatchedModuleIds.has(m.id)).length
      if (count > bestCount) {
        bestCount = count
        best = track.track
      }
    }
    return bestCount > 0 ? best : null
  }, [searchMatchedModuleIds])

  const activeTrack = searchDrivenTrack ?? selectedTrack

  const { modules: moduleProgress } = useModuleStore()

  const completedModules = useMemo(() => {
    const set = new Set<string>()
    for (const [modId, progress] of Object.entries(moduleProgress)) {
      if (progress.status === 'completed') set.add(modId)
    }
    return set
  }, [moduleProgress])

  const inProgressModules = useMemo(() => {
    const set = new Set<string>()
    for (const [modId, progress] of Object.entries(moduleProgress)) {
      if (progress.status === 'in-progress') set.add(modId)
    }
    return set
  }, [moduleProgress])

  const trackModuleIds = useMemo(() => {
    const track = MODULE_TRACKS.find((t) => t.track === activeTrack)
    return track?.modules.map((m) => m.id) ?? []
  }, [activeTrack])

  const layout = useMemo(
    () =>
      buildPathwayLayout(
        graph,
        trackModuleIds,
        completedModules,
        inProgressModules,
        searchMatchedModuleIds
      ),
    [graph, trackModuleIds, completedModules, inProgressModules, searchMatchedModuleIds]
  )

  const [nodes, , onNodesChange] = useNodesState(layout.nodes)
  const [edges, , onEdgesChange] = useEdgesState(layout.edges)

  const handleTrackChange = useCallback((id: string) => {
    setSelectedTrack(id)
  }, [])

  // Stats for active track
  const trackStats = useMemo(() => {
    const total = trackModuleIds.length
    const completed = trackModuleIds.filter((id) => completedModules.has(id)).length
    const inProgress = trackModuleIds.filter((id) => inProgressModules.has(id)).length
    return { total, completed, inProgress, notStarted: total - completed - inProgress }
  }, [trackModuleIds, completedModules, inProgressModules])

  return (
    <div className="space-y-4">
      {/* Track selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Learning Track</span>
        </div>
        <FilterDropdown
          items={trackItems}
          selectedId={activeTrack}
          onSelect={handleTrackChange}
          label="Track"
        />
        {searchQuery && searchMatchedModuleIds.size > 0 && (
          <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Filtered: {searchQuery}
          </span>
        )}
      </div>

      {/* Track progress */}
      <div className="flex flex-wrap gap-3">
        <div className="glass-panel px-3 py-1.5 text-center">
          <span className="text-sm font-bold text-foreground">{trackStats.total}</span>
          <span className="text-[10px] text-muted-foreground ml-1">modules</span>
        </div>
        <div className="glass-panel px-3 py-1.5 text-center">
          <span className="text-sm font-bold text-status-success">{trackStats.completed}</span>
          <span className="text-[10px] text-muted-foreground ml-1">completed</span>
        </div>
        <div className="glass-panel px-3 py-1.5 text-center">
          <span className="text-sm font-bold text-status-warning">{trackStats.inProgress}</span>
          <span className="text-[10px] text-muted-foreground ml-1">in progress</span>
        </div>
        <div className="glass-panel px-3 py-1.5 text-center">
          <span className="text-sm font-bold text-muted-foreground">{trackStats.notStarted}</span>
          <span className="text-[10px] text-muted-foreground ml-1">not started</span>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="h-[45vh] min-h-[300px] sm:h-[500px] rounded-lg border border-border overflow-hidden bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2}
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

      {/* Legend */}
      <GraphLegend visibleTypes={['module', 'track', 'library', 'quiz', 'glossary', 'threat']} />
    </div>
  )
}
