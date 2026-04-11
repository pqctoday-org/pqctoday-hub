// SPDX-License-Identifier: GPL-3.0-only

import { useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Network, TrendingUp, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from './SearchBar'
import { NodeDetailPanel } from './NodeDetailPanel'
import { GraphLegend } from './GraphLegend'
import { EntityNode, type EntityNodeData } from './nodes/EntityNode'
import { RelationshipEdge, type RelationshipEdgeData } from './edges/RelationshipEdge'
import { getNeighborhood } from '../data/graphBuilder'
import { SUGGESTED_QUERIES } from '../data/suggestedQueries'
import type { KnowledgeGraph, GraphNode, EntityType } from '../data/graphTypes'
import type { SearchResult } from '../data/searchIndex'

interface ExploreViewProps {
  graph: KnowledgeGraph
  searchQuery: string
  onSearchQueryChange: (q: string) => void
  searchResults: SearchResult[]
}

const nodeTypes = { entity: EntityNode }
const edgeTypes = { relationship: RelationshipEdge }

function buildRadialLayout(
  graph: KnowledgeGraph,
  centerId: string,
  visibleNodeIds: Set<string>
): { nodes: Node<EntityNodeData>[]; edges: Edge<RelationshipEdgeData>[] } {
  const centerNode = graph.nodes.get(centerId)
  if (!centerNode) return { nodes: [], edges: [] }

  const nodeArray = Array.from(visibleNodeIds)
    .map((id) => graph.nodes.get(id))
    .filter((n): n is GraphNode => n !== undefined)

  // Center node at origin, others in a ring
  const nonCenterNodes = nodeArray.filter((n) => n.id !== centerId)
  const radius = Math.max(250, nonCenterNodes.length * 30)

  const flowNodes: Node<EntityNodeData>[] = nodeArray.map((node) => {
    let x = 0
    let y = 0

    if (node.id !== centerId) {
      const idx = nonCenterNodes.indexOf(node)
      const angle = (2 * Math.PI * idx) / nonCenterNodes.length - Math.PI / 2
      x = radius * Math.cos(angle)
      y = radius * Math.sin(angle)
    }

    return {
      id: node.id,
      type: 'entity',
      position: { x, y },
      data: {
        label: node.label,
        entityType: node.entityType,
        description: node.description,
        connectionCount: node.connectionCount,
        selected: node.id === centerId,
      },
    }
  })

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

export function ExploreView({
  graph,
  searchQuery,
  onSearchQueryChange,
  searchResults,
}: ExploreViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [centeredNodeId, setCenteredNodeId] = useState<string | null>(null)
  const [rawNodeIds, setRawNodeIds] = useState<Set<string>>(new Set())
  const [hiddenTypes, setHiddenTypes] = useState<Set<EntityType>>(new Set())
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<EntityNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<RelationshipEdgeData>>([])

  const selectedNode = selectedNodeId ? (graph.nodes.get(selectedNodeId) ?? null) : null
  const selectedEdges = useMemo(() => {
    if (!selectedNodeId) return []
    return graph.edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
  }, [graph.edges, selectedNodeId])

  // Apply layout with type filtering; center node always shown
  const applyLayout = useCallback(
    (nodeIds: Set<string>, hidden: Set<EntityType>, centerId: string) => {
      const filtered = new Set(
        [...nodeIds].filter((id) => {
          if (id === centerId) return true
          const node = graph.nodes.get(id)
          return node ? !hidden.has(node.entityType) : false
        })
      )
      const layout = buildRadialLayout(graph, centerId, filtered)
      setNodes(layout.nodes)
      setEdges(layout.edges)
    },
    [graph, setNodes, setEdges]
  )

  const navigateToNode = useCallback(
    (nodeId: string) => {
      const { nodeIds } = getNeighborhood(graph, nodeId, 1, 50)
      setRawNodeIds(nodeIds)
      setCenteredNodeId(nodeId)
      setSelectedNodeId(nodeId)
      applyLayout(nodeIds, hiddenTypes, nodeId)
    },
    [graph, hiddenTypes, applyLayout]
  )

  const handleToggleType = useCallback(
    (type: EntityType) => {
      setHiddenTypes((prev) => {
        const next = new Set(prev)
        if (next.has(type)) next.delete(type)
        else next.add(type)
        if (rawNodeIds.size && centeredNodeId) {
          applyLayout(rawNodeIds, next, centeredNodeId)
        }
        return next
      })
    },
    [rawNodeIds, centeredNodeId, applyLayout]
  )

  const handleSelectSearchResult = useCallback(
    (resultId: string) => {
      navigateToNode(resultId)
    },
    [navigateToNode]
  )

  const handleReset = useCallback(() => {
    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    setCenteredNodeId(null)
    setRawNodeIds(new Set())
    onSearchQueryChange('')
  }, [setNodes, setEdges, onSearchQueryChange])

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === centeredNodeId) {
        setSelectedNodeId(node.id)
      } else {
        navigateToNode(node.id)
      }
    },
    [centeredNodeId, navigateToNode]
  )

  // Only show toggles for entity types present in the current neighborhood
  const presentTypes = useMemo<EntityType[]>(() => {
    const types = new Set<EntityType>()
    for (const id of rawNodeIds) {
      if (id === centeredNodeId) continue
      const node = graph.nodes.get(id)
      if (node) types.add(node.entityType)
    }
    return [...types]
  }, [rawNodeIds, centeredNodeId, graph.nodes])

  const hasGraph = nodes.length > 0

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <SearchBar
        query={searchQuery}
        onQueryChange={onSearchQueryChange}
        results={searchResults}
        onSelectResult={handleSelectSearchResult}
        suggestedQueries={SUGGESTED_QUERIES}
        centered={!hasGraph}
      />

      {!hasGraph ? (
        /* Pre-search landing */
        <div className="text-center py-12 space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Network className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Explore the PQC Knowledge Graph
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Search for any standard, algorithm, compliance framework, or learning module to see
              how it connects to the rest of the PQC ecosystem.
            </p>
          </div>

          {/* Stats summary */}
          <div className="flex flex-wrap justify-center gap-4">
            <div className="glass-panel px-4 py-2 text-center">
              <div className="text-lg font-bold text-foreground">{graph.stats.totalNodes}</div>
              <div className="text-[10px] text-muted-foreground">Entities</div>
            </div>
            <div className="glass-panel px-4 py-2 text-center">
              <div className="text-lg font-bold text-foreground">{graph.stats.totalEdges}</div>
              <div className="text-[10px] text-muted-foreground">Connections</div>
            </div>
            <div className="glass-panel px-4 py-2 text-center">
              <div className="text-lg font-bold text-foreground">
                {Object.keys(graph.stats.nodesByType).length}
              </div>
              <div className="text-[10px] text-muted-foreground">Entity Types</div>
            </div>
          </div>

          {/* Most connected */}
          <div className="max-w-sm mx-auto">
            <div className="flex items-center gap-1.5 justify-center mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">Most Connected</span>
            </div>
            <div className="space-y-1">
              {graph.stats.mostConnectedNodes.slice(0, 5).map((item) => (
                <Button
                  variant="ghost"
                  key={item.id}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded hover:bg-muted/50 transition-colors"
                  onClick={() => navigateToNode(item.id)}
                >
                  <span className="text-xs text-foreground truncate">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                    {item.count} links
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Graph canvas */
        <div className="relative">
          {/* Reset to overview */}
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={handleReset}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Overview
            </Button>
            {centeredNodeId && (
              <span className="text-xs text-muted-foreground truncate max-w-[60%]">
                {graph.nodes.get(centeredNodeId)?.label}
              </span>
            )}
          </div>
          <div className="h-[45vh] min-h-[300px] sm:h-[calc(100dvh-300px)] rounded-lg border border-border overflow-hidden bg-background">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.1}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Controls className="!bg-card !border-border !shadow-sm [&>button]:!bg-muted [&>button]:!text-foreground [&>button]:!border-border" />
              <MiniMap
                className="!bg-card !border-border"
                nodeColor={(n) => {
                  const data = n.data as EntityNodeData | undefined
                  if (!data) return 'hsl(var(--muted))'
                  if (data.selected) return 'hsl(var(--primary))'
                  return 'hsl(var(--muted-foreground))'
                }}
              />
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="hsl(var(--border))"
              />
            </ReactFlow>
          </div>

          {/* Detail panel — sm+: overlay inside canvas */}
          {selectedNode && (
            <div className="hidden sm:block absolute top-2 left-2 z-10">
              <NodeDetailPanel
                node={selectedNode}
                edges={selectedEdges}
                allNodes={graph.nodes}
                onClose={() => setSelectedNodeId(null)}
                onNavigateToNode={navigateToNode}
              />
            </div>
          )}

          {/* Detail panel — mobile: below canvas */}
          {selectedNode && (
            <div className="sm:hidden mt-2">
              <NodeDetailPanel
                node={selectedNode}
                edges={selectedEdges}
                allNodes={graph.nodes}
                onClose={() => setSelectedNodeId(null)}
                onNavigateToNode={navigateToNode}
              />
            </div>
          )}

          {/* Interactive type filter legend */}
          <div className="mt-2">
            <GraphLegend
              visibleTypes={presentTypes}
              hiddenTypes={hiddenTypes}
              onToggleType={handleToggleType}
            />
          </div>
        </div>
      )}
    </div>
  )
}
