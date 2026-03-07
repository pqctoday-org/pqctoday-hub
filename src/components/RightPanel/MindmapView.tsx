// SPDX-License-Identifier: GPL-3.0-only

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Map } from 'lucide-react'
import { MindmapNode, type MindmapNodeData } from './nodes/MindmapNode'
import { MindmapEdge, type MindmapEdgeData } from './edges/MindmapEdge'
import type { MindmapItem } from './mindmapData'
import { useMindmapData } from './useMindmapData'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useRightPanelStore } from '@/store/useRightPanelStore'

const nodeTypes = { mindmap: MindmapNode }
const edgeTypes = { 'mindmap-edge': MindmapEdge }

const BASE_RADIUS = 280
const RING_SPACING = 260

/**
 * Recursively place children of a parent node in a radial arc.
 * Each expanded child recurses deeper at a larger radius.
 */
function placeChildren(
  parentItem: MindmapItem,
  parentAngle: number,
  sectorWidth: number,
  depth: number,
  expandedIds: Set<string>,
  nodes: Node<MindmapNodeData>[],
  edges: Edge<MindmapEdgeData>[]
) {
  const children = parentItem.children ?? []
  if (children.length === 0) return

  const radius = BASE_RADIUS + (depth - 1) * RING_SPACING
  const edgeLevel = depth === 1 ? 'root-to-page' : 'page-to-section'

  children.forEach((child, i) => {
    // Distribute children evenly within the sector
    const angle =
      children.length === 1
        ? parentAngle
        : parentAngle - sectorWidth / 2 + (sectorWidth * i) / (children.length - 1)

    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    const hasKids = (child.children?.length ?? 0) > 0
    const isExpanded = expandedIds.has(child.id)

    nodes.push({
      id: child.id,
      type: 'mindmap',
      position: { x, y },
      data: {
        label: child.label,
        level: depth,
        icon: child.icon,
        route: child.route,
        hasChildren: hasKids,
        expanded: isExpanded,
      },
    })

    edges.push({
      id: `e-${parentItem.id}-${child.id}`,
      source: parentItem.id,
      target: child.id,
      type: 'mindmap-edge',
      data: { level: edgeLevel as 'root-to-page' | 'page-to-section' },
    })

    // Recurse into expanded children
    if (hasKids && isExpanded) {
      const childSectorWidth = (sectorWidth / children.length) * 0.85
      placeChildren(child, angle, childSectorWidth, depth + 1, expandedIds, nodes, edges)
    }
  })
}

function buildMindmapLayout(
  rootItem: MindmapItem,
  expandedIds: Set<string>
): { nodes: Node<MindmapNodeData>[]; edges: Edge<MindmapEdgeData>[] } {
  const nodes: Node<MindmapNodeData>[] = []
  const edges: Edge<MindmapEdgeData>[] = []
  const hasChildren = (rootItem.children?.length ?? 0) > 0

  // Root at center
  nodes.push({
    id: rootItem.id,
    type: 'mindmap',
    position: { x: 0, y: 0 },
    data: {
      label: rootItem.label,
      level: 0,
      icon: rootItem.icon,
      route: rootItem.route,
      hasChildren,
      expanded: expandedIds.has(rootItem.id),
    },
  })

  if (hasChildren && expandedIds.has(rootItem.id)) {
    // Full 360° sector for root's children
    placeChildren(rootItem, -Math.PI / 2, 2 * Math.PI, 1, expandedIds, nodes, edges)
  }

  return { nodes, edges }
}

function MindmapCanvas() {
  const navigate = useNavigate()
  const closePanel = useRightPanelStore((s) => s.close)
  const { fitView } = useReactFlow()
  const { tree, rootPickerItems, findItem } = useMindmapData()

  const [rootId, setRootId] = useState('root')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['root']))

  const rootItem = useMemo(() => findItem(rootId) ?? tree, [rootId, findItem, tree])

  const { nodes, edges } = useMemo(
    () => buildMindmapLayout(rootItem, expandedIds),
    [rootItem, expandedIds]
  )

  // Re-fit viewport when layout changes
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50)
    return () => clearTimeout(t)
  }, [nodes, edges, fitView])

  const handleRootChange = useCallback((id: string) => {
    setRootId(id)
    setExpandedIds(new Set([id]))
  }, [])

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const data = node.data as MindmapNodeData
    if (data.hasChildren) {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        if (next.has(node.id)) {
          next.delete(node.id)
        } else {
          next.add(node.id)
        }
        return next
      })
    }
  }, [])

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as MindmapNodeData
      if (data.route) {
        closePanel()
        navigate(data.route)
      }
    },
    [navigate, closePanel]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Map className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">Mindmap</span>
        <FilterDropdown
          items={rootPickerItems}
          selectedId={rootId}
          onSelect={handleRootChange}
          label="Root"
          defaultLabel="PQC Migration"
          noContainer
          variant="ghost"
        />
      </div>
      <p className="text-xs text-muted-foreground">Click to unfold. Double-click to open page.</p>

      <div className="h-[45vh] min-h-[300px] sm:h-[500px] rounded-lg border border-border overflow-hidden bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.05}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
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
  )
}

export function MindmapView() {
  return (
    <ReactFlowProvider>
      <MindmapCanvas />
    </ReactFlowProvider>
  )
}
