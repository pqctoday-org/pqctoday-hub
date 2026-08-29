// SPDX-License-Identifier: GPL-3.0-only
/**
 * /navigate — the force-cluster graph of the whole PQC knowledge hub.
 * design_handoff_force_cluster/IMPLEMENTATION-PLAN-2026-08-28.md.
 *
 * Vanilla/imperative three.js — NOT @react-three/fiber. R3F was tried first
 * per an earlier user decision, then reverted (still 2026-08-28) after it was
 * found to break `tsc -b` project-wide: importing @react-three/fiber's JSX
 * IntrinsicElements augmentation (which maps over three's entire, now-huge
 * WebGPU/TSL-inflated export surface) corrupted JSX prop-checking for ~50
 * unrelated files with no relation to this page. Confirmed across multiple
 * @react-three/fiber/@types/three version combinations, not a fluke. This
 * component owns its own THREE.Scene/renderer/animation-loop lifecycle
 * directly instead.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import {
  buildForceClusterGraph,
  type ForceClusterGraph,
  type ForceClusterNode,
  type ForceClusterNodeType,
} from '@/data/forceClusterGraph'
import { NavigateDetailPanel } from './NavigateDetailPanel'
import { GRAPH_TOKEN, NODE_TYPES, TYPE_LABEL } from './graphVisuals'
import { Button } from '@/components/ui/button'

function resolveGraphColor(varName: string, fallback: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  if (!raw) return new THREE.Color(fallback)
  // The design tokens store channels in the modern space-separated CSS4 form
  // ("200 75% 32%"), but three.js's Color.setStyle() hsl parser only matches
  // the legacy comma-separated form ("200, 75%, 32%") — without commas it
  // silently fails to match and leaves the color unset (found via real
  // browser verification, 2026-08-28: every node rendered flat gray).
  const commaSeparated = raw.trim().split(/\s+/).join(', ')
  return new THREE.Color().setStyle(`hsl(${commaSeparated})`)
}

/** Evenly distributes `count` points on a sphere of the given radius (golden-angle spiral). */
function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * i
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius)
    )
  }
  return points
}

// Connection count (degree) is encoded as color darkness + opacity, not size
// — a node's radius is constant. Tried size-by-degree first; changed to this
// on direct request. InstancedMesh has no native per-instance alpha (only
// per-instance RGB via setColorAt), so each category is split into
// DEGREE_TIER_COUNT discrete InstancedMeshes (one per degree band), each
// with its own material lightness/opacity — real per-instance variation
// without a custom shader, at the cost of banding rather than a continuous
// gradient.
const NODE_RADIUS = 0.4
const DEGREE_TIER_COUNT = 5

/** 0 (lowest connectivity) .. 1 (highest), same sqrt curve as the old size mapping so the ranking still reads the same way. */
function degreeRank(degree: number, maxDegree: number): number {
  if (maxDegree <= 0) return 0
  return Math.sqrt(degree) / Math.sqrt(maxDegree)
}

function degreeTier(degree: number, maxDegree: number): number {
  const rank = degreeRank(degree, maxDegree)
  return Math.min(DEGREE_TIER_COUNT - 1, Math.floor(rank * DEGREE_TIER_COUNT))
}

/** Darker + more opaque for higher tiers, lighter + more transparent for lower ones. */
function tierAppearance(
  baseColor: THREE.Color,
  tier: number
): { color: THREE.Color; opacity: number } {
  const t = DEGREE_TIER_COUNT <= 1 ? 1 : tier / (DEGREE_TIER_COUNT - 1)
  const hsl = { h: 0, s: 0, l: 0 }
  baseColor.getHSL(hsl)
  const LIGHTNESS_SPAN = 0.3 // lowest tier: +18%, highest tier: -12%, relative to the base token's own lightness
  const lightness = Math.min(0.92, Math.max(0.08, hsl.l + LIGHTNESS_SPAN * (0.6 - t)))
  const color = new THREE.Color().setHSL(hsl.h, hsl.s, lightness)
  const MIN_OPACITY = 0.35
  const opacity = MIN_OPACITY + t * (1 - MIN_OPACITY)
  return { color, opacity }
}

// Default view shows roughly the reference design's own scale (~330 nodes),
// not the full live graph (2,382) — dense, but not what the handoff's own
// prototype ever showed by default. The percent slider (0-100%, ranked by
// connection count) reveals more; 100% still shows everything.
const DEFAULT_VISIBLE_PERCENT = 14

// Ported directly from the design handoff's real reference implementation
// (design_handoff_force_cluster/reference/ForceCluster3D.dc.html,
// buildGraph()/fibPoints() — read 2026-08-28 after an earlier from-scratch
// attempt substituted a naive single-sphere layout with no real clustering
// or edge rendering, which is not what was asked for). Same two-level
// Fibonacci-sphere placement (type centers, then each type's subcategory
// centers using its real distinct `sub` values) and the same three-part
// relaxation: pairwise repulsion, edge attraction past a target distance,
// and a dual restoring force (strong pull to the subcategory center, weak
// pull to the type center) — same constants as the reference, not guessed.
const TYPE_SPHERE_RADIUS = 19
const REPULSION_MIN_SEP = 1.05
const REPULSION_STRENGTH = 0.16
const EDGE_TARGET_DIST = 3.2
const EDGE_ATTRACTION = 0.012
const SUB_HOME_RESTORE = 0.05
const TYPE_HOME_RESTORE = 0.006
const RELAX_ITERATIONS = 60

interface GraphLayout {
  position: Map<string, THREE.Vector3>
  typeCenters: Map<ForceClusterNodeType, THREE.Vector3>
  subCenters: Map<string, THREE.Vector3>
}

function computeLayout(graph: ForceClusterGraph): GraphLayout {
  const typeCenters = new Map<ForceClusterNodeType, THREE.Vector3>(
    fibonacciSphere(NODE_TYPES.length, TYPE_SPHERE_RADIUS).map((p, i) => [
      // eslint-disable-next-line security/detect-object-injection -- i is a numeric loop index into a same-length array, not user input
      NODE_TYPES[i],
      p,
    ])
  )

  const byType = new Map<ForceClusterNodeType, ForceClusterNode[]>()
  for (const node of graph.nodes) byType.set(node.type, [...(byType.get(node.type) ?? []), node])

  // Level 2: each type's real distinct `sub` values (not a fixed enum —
  // computed from the live data, since this graph's `sub` fields aren't a
  // small fixed taxonomy the way the reference's SUBCATS was for every type).
  const subCenters = new Map<string, THREE.Vector3>()
  for (const [type, nodes] of byType) {
    const subs = Array.from(new Set(nodes.map((n) => n.sub)))
    const subSphereRadius = Math.max(3.2, 1.6 + subs.length * 0.45)
    const typeCenter = typeCenters.get(type) ?? new THREE.Vector3()
    fibonacciSphere(subs.length, subSphereRadius).forEach((p, i) => {
      // eslint-disable-next-line security/detect-object-injection -- i is a numeric loop index into a same-length array, not user input
      subCenters.set(`${type}::${subs[i]}`, typeCenter.clone().add(p))
    })
  }

  const position = new Map<string, THREE.Vector3>()
  const subHome = new Map<string, THREE.Vector3>()
  const typeHome = new Map<string, THREE.Vector3>()
  for (const [type, nodes] of byType) {
    const typeCenter = typeCenters.get(type) ?? new THREE.Vector3()
    for (const node of nodes) {
      const center = subCenters.get(`${type}::${node.sub}`) ?? typeCenter
      subHome.set(node.id, center)
      typeHome.set(node.id, typeCenter)
      position.set(
        node.id,
        center
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 1.5,
              (Math.random() - 0.5) * 1.5,
              (Math.random() - 0.5) * 1.5
            )
          )
      )
    }
  }

  // Pairwise repulsion is scoped per-type (not global) and spatially gridded
  // within each type — a real optimization, not a fidelity cut. The
  // reference's own O(n^2) global repulsion is fine at its ~330-node dataset
  // but doesn't scale to this graph's 2,382 nodes (measured: ~9.5s to first
  // render, unacceptable). Cross-type repulsion is safe to skip because type
  // anchors sit >=19 units apart (TYPE_SPHERE_RADIUS) while REPULSION_MIN_SEP
  // is 1.05 — cross-type pairs never get close enough to trigger it anyway,
  // so scoping to within-type changes performance, not behavior. The spatial
  // grid (cell size = 2x MIN_SEP) then skips comparing node pairs that are
  // farther apart than any neighboring cell could put them, again a pure
  // performance win over the reference's brute-force check-every-pair.
  const cellSize = REPULSION_MIN_SEP * 2
  const cellKey = (p: THREE.Vector3) =>
    `${Math.floor(p.x / cellSize)}_${Math.floor(p.y / cellSize)}_${Math.floor(p.z / cellSize)}`

  for (let iter = 0; iter < RELAX_ITERATIONS; iter++) {
    for (const [, nodes] of byType) {
      const grid = new Map<string, ForceClusterNode[]>()
      for (const node of nodes) {
        const p = position.get(node.id)
        if (!p) continue
        const key = cellKey(p)
        const bucket = grid.get(key)
        if (bucket) bucket.push(node)
        else grid.set(key, [node])
      }
      const checked = new Set<string>()
      for (const node of nodes) {
        const a = position.get(node.id)
        if (!a) continue
        const cx = Math.floor(a.x / cellSize)
        const cy = Math.floor(a.y / cellSize)
        const cz = Math.floor(a.z / cellSize)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              const neighbors = grid.get(`${cx + dx}_${cy + dy}_${cz + dz}`)
              if (!neighbors) continue
              for (const other of neighbors) {
                if (other.id === node.id) continue
                const pairKey =
                  node.id < other.id ? `${node.id}|${other.id}` : `${other.id}|${node.id}`
                if (checked.has(pairKey)) continue
                checked.add(pairKey)
                const b = position.get(other.id)
                if (!b) continue
                const diff = a.clone().sub(b)
                const dist = Math.max(diff.length(), 0.001)
                if (dist < REPULSION_MIN_SEP) {
                  const push = diff
                    .normalize()
                    .multiplyScalar((REPULSION_MIN_SEP - dist) * REPULSION_STRENGTH)
                  a.add(push)
                  b.sub(push)
                }
              }
            }
          }
        }
      }
    }
    for (const edge of graph.edges) {
      const a = position.get(edge.from)
      const b = position.get(edge.to)
      if (!a || !b) continue
      const diff = b.clone().sub(a)
      const dist = diff.length()
      if (dist > EDGE_TARGET_DIST) {
        const pull = diff.normalize().multiplyScalar((dist - EDGE_TARGET_DIST) * EDGE_ATTRACTION)
        a.add(pull)
        b.sub(pull)
      }
    }
    for (const node of graph.nodes) {
      const pos = position.get(node.id)
      const sHome = subHome.get(node.id)
      const tHome = typeHome.get(node.id)
      if (!pos || !sHome || !tHome) continue
      pos.add(sHome.clone().sub(pos).multiplyScalar(SUB_HOME_RESTORE))
      pos.add(tHome.clone().sub(pos).multiplyScalar(TYPE_HOME_RESTORE))
    }
  }

  return { position, typeCenters, subCenters }
}

async function createRenderer(canvas: HTMLCanvasElement): Promise<THREE.WebGLRenderer> {
  // WebGPU-with-WebGL-fallback (plan §2.5). WebGPURenderer's type is
  // structurally compatible with WebGLRenderer for the render()/setSize()/
  // dispose() calls this component makes, so callers can treat the return
  // value uniformly regardless of which backend actually got constructed.
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    try {
      const { WebGPURenderer } = await import('three/webgpu')
      const renderer = new WebGPURenderer({ canvas, antialias: true, alpha: true })
      await renderer.init()
      return renderer as unknown as THREE.WebGLRenderer
    } catch {
      // Falls through to WebGL below — a browser can advertise navigator.gpu
      // and still fail WebGPU device/adapter init (driver blocklists, etc).
    }
  }
  return new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
}

// Label LOD tiers (§ labels — ported from the reference's updateLOD(), same
// distance thresholds): far out only category labels show; mid-zoom swaps to
// subcategory labels; zoomed in close shows individual node labels instead.
const LOD_FAR_DISTANCE = 46
const LOD_MID_DISTANCE = 20

function makeLabelDiv(
  text: string,
  style: {
    size: number
    weight: number
    color: string
    background?: string
    padding?: string
    uppercase?: boolean
  }
): HTMLDivElement {
  const div = document.createElement('div')
  div.textContent = text
  div.style.cssText = [
    `font:${style.weight} ${style.size}px Inter, system-ui, sans-serif`,
    `color:${style.color}`,
    style.background ? `background:${style.background}` : '',
    `padding:${style.padding ?? '0'}`,
    'border-radius:4px',
    'white-space:nowrap',
    'pointer-events:none',
    'letter-spacing:0.02em',
    style.uppercase ? 'text-transform:uppercase' : '',
    'opacity:0',
    'transition:opacity .15s',
  ]
    .filter(Boolean)
    .join(';')
  return div
}

interface BuiltScene {
  scene: THREE.Scene
  /**
   * Filters to the enabled types and the top `percent`% of THOSE nodes by
   * connection count (degree), then fully recomputes the cluster layout on
   * that filtered subgraph — not a visibility toggle over the original
   * layout. Toggling a whole category off/on leaves gaps and stale positions
   * otherwise; a real re-cluster is what "refresh the clustering" means.
   */
  applyFilters: (enabledTypes: ReadonlySet<ForceClusterNodeType>, percent: number) => void
}

function buildScene(graph: ForceClusterGraph): BuiltScene {
  const scene = new THREE.Scene()
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(30, 40, 20)
  scene.add(dirLight)

  // Sizing stays keyed to each node's degree in the FULL graph (not the
  // filtered subgraph) so a node's size doesn't jump around just because
  // something else got filtered out — only its presence/position does.
  const maxDegree = graph.nodes.reduce((m, n) => Math.max(m, n.degree), 0)

  const geometry = new THREE.SphereGeometry(1, 10, 10)
  const dummy = new THREE.Object3D()
  const rotatingGroup = new THREE.Group()
  rotatingGroup.name = 'force-cluster-graph'
  scene.add(rotatingGroup)

  function applyFilters(enabledTypes: ReadonlySet<ForceClusterNodeType>, percent: number) {
    for (const child of [...rotatingGroup.children]) {
      rotatingGroup.remove(child)
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose()
        const material = Array.isArray(child.material) ? child.material : [child.material]
        for (const m of material) m.dispose()
      } else if (child instanceof CSS2DObject) {
        // CSS2DRenderer only ever APPENDS elements as it traverses visible
        // objects each frame — it has no removal hook of its own, so a
        // CSS2DObject taken out of the scene graph leaves its div orphaned
        // in the DOM forever unless removed explicitly here.
        child.element.remove()
      }
    }

    const clamped = Math.min(100, Math.max(0, percent))
    const typeFiltered = graph.nodes.filter((n) => enabledTypes.has(n.type))
    const sortedDegreesDesc = typeFiltered.map((n) => n.degree).sort((a, b) => b - a)
    const keepCount = Math.max(1, Math.ceil((clamped / 100) * sortedDegreesDesc.length))
    const threshold =
      clamped >= 100
        ? -Infinity
        : (sortedDegreesDesc[Math.min(keepCount - 1, sortedDegreesDesc.length - 1)] ?? -Infinity)
    const visibleNodes = typeFiltered.filter((n) => n.degree >= threshold)
    const visibleIds = new Set(visibleNodes.map((n) => n.id))
    const visibleEdges = graph.edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to))
    const subgraph: ForceClusterGraph = { nodes: visibleNodes, edges: visibleEdges }

    const { position: positionById, typeCenters, subCenters } = computeLayout(subgraph)

    const byType = new Map<ForceClusterNodeType, ForceClusterNode[]>()
    for (const node of visibleNodes) byType.set(node.type, [...(byType.get(node.type) ?? []), node])

    for (const [type, nodes] of byType) {
      // eslint-disable-next-line security/detect-object-injection -- type is drawn from the typed ForceClusterNodeType union, not user input
      const token = GRAPH_TOKEN[type]
      const baseColor = resolveGraphColor(token.varName, token.fallback)

      const nodesByTier = new Map<number, ForceClusterNode[]>()
      for (const node of nodes) {
        const tier = degreeTier(node.degree, maxDegree)
        nodesByTier.set(tier, [...(nodesByTier.get(tier) ?? []), node])
      }

      for (const [tier, tierNodes] of nodesByTier) {
        const { color, opacity } = tierAppearance(baseColor, tier)
        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.4,
          metalness: 0.1,
          transparent: opacity < 1,
          opacity,
        })
        const mesh = new THREE.InstancedMesh(geometry, material, tierNodes.length)
        mesh.name = `graph-layer-${type}-tier${tier}`
        // Click-to-select (§ detail panel) resolves an InstancedMesh raycast hit's
        // instanceId back to a real node via this — three.js's userData bag is the
        // straightforward way to carry app data alongside a scene object.
        mesh.userData.nodes = tierNodes
        tierNodes.forEach((node, i) => {
          const pos = positionById.get(node.id)
          if (!pos) return
          dummy.position.copy(pos)
          dummy.scale.setScalar(NODE_RADIUS)
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
        rotatingGroup.add(mesh)
      }
    }

    // Edges — actual visible lines, not just an input to degree/sizing. Low
    // opacity is deliberate: rendered at full opacity this is an unreadable
    // hairball; muted lines let the node clusters and colors stay legible
    // while the connective structure is still genuinely visible.
    const edgePositions = new Float32Array(visibleEdges.length * 6)
    let edgeVertexCount = 0
    for (const edge of visibleEdges) {
      const from = positionById.get(edge.from)
      const to = positionById.get(edge.to)
      if (!from || !to) continue
      const base = edgeVertexCount * 6
      // eslint-disable-next-line security/detect-object-injection -- base is a computed numeric index into a pre-sized typed array, not user input
      edgePositions[base] = from.x
      edgePositions[base + 1] = from.y
      edgePositions[base + 2] = from.z
      edgePositions[base + 3] = to.x
      edgePositions[base + 4] = to.y
      edgePositions[base + 5] = to.z
      edgeVertexCount += 1
    }
    const edgeGeometry = new THREE.BufferGeometry()
    edgeGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(edgePositions.subarray(0, edgeVertexCount * 6), 3)
    )
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: resolveGraphColor('--muted-foreground', '#8a8f98'),
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    })
    const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    edgeLines.name = 'graph-edges'
    rotatingGroup.add(edgeLines)

    // Labels — three LOD tiers, opacity toggled per-frame by updateLOD() in
    // the component (§ labels, ported from the reference's own three-tier
    // system: category name only when zoomed far out, subcategory name at
    // mid-zoom, individual node name zoomed in close).
    for (const [type] of byType) {
      const center = typeCenters.get(type)
      if (!center) continue
      // eslint-disable-next-line security/detect-object-injection -- type is drawn from the typed ForceClusterNodeType union, not user input
      const token = GRAPH_TOKEN[type]
      // eslint-disable-next-line security/detect-object-injection -- type is drawn from the typed ForceClusterNodeType union, not user input
      const div = makeLabelDiv(TYPE_LABEL[type], {
        size: 13,
        weight: 700,
        color: `hsl(var(${token.varName}))`,
        background: 'hsl(var(--card) / 0.85)',
        padding: '3px 9px',
      })
      const label = new CSS2DObject(div)
      label.position.copy(center)
      label.userData.kind = 'type-label'
      rotatingGroup.add(label)
    }

    const seenSub = new Set<string>()
    for (const node of visibleNodes) {
      const key = `${node.type}::${node.sub}`
      if (seenSub.has(key)) continue
      seenSub.add(key)
      const center = subCenters.get(key)
      if (!center) continue
      const div = makeLabelDiv(node.sub, {
        size: 9,
        weight: 600,
        color: `hsl(var(${GRAPH_TOKEN[node.type].varName}))`,
        uppercase: true,
      })
      const label = new CSS2DObject(div)
      label.position.copy(center)
      label.userData.kind = 'sub-label'
      rotatingGroup.add(label)
    }

    for (const node of visibleNodes) {
      const pos = positionById.get(node.id)
      if (!pos) continue
      const div = makeLabelDiv(node.label, {
        size: 10,
        weight: 500,
        color: `hsl(var(${GRAPH_TOKEN[node.type].varName}))`,
        background: 'hsl(var(--card) / 0.75)',
        padding: '1px 5px',
      })
      const label = new CSS2DObject(div)
      label.position.copy(pos).add(new THREE.Vector3(0, NODE_RADIUS + 0.3, 0))
      label.userData.kind = 'node-label'
      rotatingGroup.add(label)
    }
  }

  applyFilters(new Set(NODE_TYPES), DEFAULT_VISIBLE_PERCENT)
  return { scene, applyFilters }
}

export function ForceClusterView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [graph, setGraph] = useState<ForceClusterGraph | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const selectedNodeIdRef = useRef<string | null>(null)
  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId
  }, [selectedNodeId])

  const [visiblePercent, setVisiblePercent] = useState(DEFAULT_VISIBLE_PERCENT)
  const [enabledTypes, setEnabledTypes] = useState<ReadonlySet<ForceClusterNodeType>>(
    () => new Set(NODE_TYPES)
  )
  const applyFiltersRef = useRef<
    ((enabledTypes: ReadonlySet<ForceClusterNodeType>, percent: number) => void) | null
  >(null)

  // Filter changes trigger a real re-cluster (buildScene's applyFilters
  // fully recomputes layout), so they're applied directly from the event
  // handlers below rather than a useEffect watching [enabledTypes,
  // visiblePercent] — calling setState synchronously inside an effect body
  // is a real anti-pattern (cascading renders), not just a lint nit.
  const toggleType = (type: ForceClusterNodeType) => {
    const next = new Set(enabledTypes)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    setEnabledTypes(next)
    setSelectedNodeId(null) // a relayout invalidates the previously selected node's on-screen position
    applyFiltersRef.current?.(next, visiblePercent)
  }

  const changeVisiblePercent = (percent: number) => {
    setVisiblePercent(percent)
    setSelectedNodeId(null)
    applyFiltersRef.current?.(enabledTypes, percent)
  }

  const nodesById = useMemo(() => {
    const map = new Map<string, ForceClusterNode>()
    if (graph) for (const node of graph.nodes) map.set(node.id, node)
    return map
  }, [graph])

  const selectedNode = selectedNodeId ? (nodesById.get(selectedNodeId) ?? null) : null

  const connections = useMemo(() => {
    if (!graph || !selectedNodeId) return []
    const result: {
      edge: ForceClusterGraph['edges'][number]
      node: ForceClusterNode
      direction: 'outgoing' | 'incoming'
    }[] = []
    for (const edge of graph.edges) {
      if (edge.from === selectedNodeId) {
        const node = nodesById.get(edge.to)
        if (node) result.push({ edge, node, direction: 'outgoing' })
      } else if (edge.to === selectedNodeId) {
        const node = nodesById.get(edge.from)
        if (node) result.push({ edge, node, direction: 'incoming' })
      }
    }
    return result
  }, [graph, selectedNodeId, nodesById])

  useEffect(() => {
    let cancelled = false
    let renderer: THREE.WebGLRenderer | null = null
    let controls: OrbitControls | null = null
    let resizeObserver: ResizeObserver | null = null
    let canvasClickHandler: ((event: MouseEvent) => void) | null = null
    let canvasEl: HTMLCanvasElement | null = null
    const container = containerRef.current

    async function setup() {
      if (!container) return

      const builtGraph = await buildForceClusterGraph()
      if (cancelled || !container) return
      setGraph(builtGraph)

      const canvas = document.createElement('canvas')
      container.appendChild(canvas)
      canvasEl = canvas

      const width = container.clientWidth || 1
      const height = container.clientHeight || 1
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500)
      camera.position.set(0, 0, 55)

      renderer = await createRenderer(canvas)
      if (cancelled) {
        renderer.dispose()
        return
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(width, height)

      // Label DOM overlay (§ labels) — a second renderer compositing real
      // <div>s positioned in 3D over the WebGL/WebGPU canvas, per the
      // reference's CSS2DRenderer/CSS2DObject approach.
      const labelRenderer = new CSS2DRenderer()
      labelRenderer.setSize(width, height)
      // z-index:1 is load-bearing, not decorative — CSS2DRenderer actively
      // assigns its own numeric z-index to each label div (for camera-
      // distance sorting, see its sortObjects/zOrder behavior) with no cap.
      // Without an explicit z-index here, this element has no stacking
      // context of its own, so those per-label values escape upward and
      // paint over anything else on the page with a lower/no z-index —
      // including the detail panel (found via direct user testing: panel
      // background was correctly opaque, but individual node/subcategory
      // labels still rendered through it).
      labelRenderer.domElement.style.cssText =
        'position:absolute;top:0;left:0;pointer-events:none;z-index:1;'
      container.appendChild(labelRenderer.domElement)

      const { scene, applyFilters } = buildScene(builtGraph)
      applyFiltersRef.current = applyFilters
      const rotatingGroup = scene.getObjectByName('force-cluster-graph')

      controls = new OrbitControls(camera, canvas)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.minDistance = 5
      controls.maxDistance = 90

      function updateLod() {
        if (!rotatingGroup || !controls) return
        const distance = camera.position.distanceTo(controls.target)
        const lod =
          distance > LOD_FAR_DISTANCE ? 'far' : distance > LOD_MID_DISTANCE ? 'mid' : 'near'
        // Applied every frame, not cached against the last tier — a filter
        // change rebuilds labels fresh (opacity:0 by default) without
        // necessarily changing the zoom tier, so caching would leave the new
        // labels invisible until the user happened to zoom past a threshold.
        for (const child of rotatingGroup.children) {
          if (!(child instanceof CSS2DObject)) continue
          const kind = child.userData.kind as string | undefined
          const show =
            (kind === 'type-label' && lod === 'far') ||
            (kind === 'sub-label' && lod === 'mid') ||
            (kind === 'node-label' && lod === 'near')
          child.element.style.opacity = show ? '1' : '0'
        }
      }

      const timer = new THREE.Timer()
      renderer.setAnimationLoop(() => {
        timer.update()
        const delta = timer.getDelta()
        // Paused while a node is selected — orbiting the scene away from
        // under a reader mid-inspection is a real usability problem, not a
        // cosmetic one.
        if (rotatingGroup && !selectedNodeIdRef.current) rotatingGroup.rotation.y += delta * 0.02
        controls?.update()
        updateLod()
        renderer?.render(scene, camera)
        labelRenderer.render(scene, camera)
      })

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      canvasClickHandler = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        // Recomputed fresh on every click, not cached at setup time — a
        // filter change (applyFilters) disposes and replaces these meshes,
        // so a stale cached list would raycast against removed objects.
        const instancedMeshes =
          rotatingGroup?.children.filter(
            (obj): obj is THREE.InstancedMesh => obj instanceof THREE.InstancedMesh
          ) ?? []
        const hits = raycaster.intersectObjects(instancedMeshes)
        const hit = hits[0]
        if (hit && hit.instanceId != null) {
          const nodes = hit.object.userData.nodes as ForceClusterNode[]
          const node = nodes[hit.instanceId]
          setSelectedNodeId(node ? node.id : null)
        } else {
          setSelectedNodeId(null)
        }
      }
      canvas.addEventListener('click', canvasClickHandler)

      resizeObserver = new ResizeObserver(() => {
        if (!container || !renderer) return
        const w = container.clientWidth || 1
        const h = container.clientHeight || 1
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
        labelRenderer.setSize(w, h)
      })
      resizeObserver.observe(container)

      setLoading(false)
    }

    setup().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to build the graph')
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      if (canvasEl && canvasClickHandler) canvasEl.removeEventListener('click', canvasClickHandler)
      controls?.dispose()
      renderer?.setAnimationLoop(null)
      renderer?.dispose()
      container?.replaceChildren()
      applyFiltersRef.current = null
    }
  }, [])

  return (
    <div className="relative h-full w-full bg-background">
      <div ref={containerRef} className="h-full w-full" />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p>Building the graph from live hub data...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-status-error">
          Failed to load the graph: {error}
        </div>
      )}
      {selectedNode && (
        <NavigateDetailPanel
          node={selectedNode}
          connections={connections}
          onSelectNode={setSelectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
      {!loading && !error && (
        <div className="glass-panel absolute bottom-4 left-4 max-w-[360px] space-y-3 p-3">
          <div className="flex flex-wrap gap-1.5">
            {NODE_TYPES.map((type) => {
              const on = enabledTypes.has(type)
              // eslint-disable-next-line security/detect-object-injection -- type is drawn from the typed ForceClusterNodeType union (NODE_TYPES), not user input
              const token = GRAPH_TOKEN[type]
              // eslint-disable-next-line security/detect-object-injection -- type is drawn from the typed ForceClusterNodeType union (NODE_TYPES), not user input
              const label = TYPE_LABEL[type]
              return (
                <Button
                  key={type}
                  variant={on ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => toggleType(type)}
                  className="h-auto gap-1.5 rounded-full px-2.5 py-1 text-xs"
                  aria-pressed={on}
                >
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: `hsl(var(${token.varName}))`,
                      opacity: on ? 1 : 0.35,
                    }}
                    aria-hidden="true"
                  />
                  {label}
                </Button>
              )
            })}
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">Showing {visiblePercent}%</span>
            <input
              type="range"
              min={1}
              max={100}
              value={visiblePercent}
              onChange={(e) => changeVisiblePercent(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Percentage of nodes shown, ranked by connection count"
            />
          </label>
        </div>
      )}
    </div>
  )
}
