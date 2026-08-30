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
import { boundingSphere, easeInOutCubic, frameDistance, nodeApproach } from './cameraPath'
import { buildItinerary, skippedCategories, type TourStop } from './tourItinerary'
import {
  MotionControls,
  MOTION_SPEED_DEFAULT,
  MOTION_SPEED_MAX,
  MOTION_SPEED_MIN,
  type MotionMode,
  type TourProgress,
} from './MotionControls'
import { TourCaption } from './TourCaption'
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

// Tour timing (navigate-motion-modes-plan-08292026.md §4.6) — a category
// beat lingers longer on the pull-back (more to read/orient to) than a node
// stop, which lingers longer on the dwell (that's where the caption bar and
// the actual content live) than on the flight itself.
const TOUR_TOP_N = 10
const TOUR_CATEGORY_FLIGHT_MS = 3500
const TOUR_CATEGORY_DWELL_MS = 2000
const TOUR_NODE_FLIGHT_MS = 1800
const TOUR_NODE_DWELL_MS = 2500
const TOUR_NODE_APPROACH_DISTANCE = 7
const TOUR_FRAME_PADDING = 1.15
const TOUR_CAMERA_FOV_DEG = 50

const MOTION_STORAGE_KEY = 'pqctoday:navigate:motion'

interface MotionPrefs {
  mode: MotionMode
  speed: number
}

function defaultMotionMode(): MotionMode {
  if (typeof window === 'undefined') return 'spin'
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'off' : 'spin'
}

/** Reads persisted mode/speed from localStorage, falling back safely on anything malformed — a corrupt or hand-edited value must not wedge the page. */
function loadMotionPrefs(): MotionPrefs {
  const fallback: MotionPrefs = { mode: defaultMotionMode(), speed: MOTION_SPEED_DEFAULT }
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(MOTION_STORAGE_KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return fallback
    const { mode, speed } = parsed as { mode?: unknown; speed?: unknown }
    const validMode: MotionMode =
      mode === 'off' || mode === 'spin' || mode === 'tour' ? mode : fallback.mode
    const validSpeed =
      typeof speed === 'number' && speed >= MOTION_SPEED_MIN && speed <= MOTION_SPEED_MAX
        ? speed
        : MOTION_SPEED_DEFAULT
    return { mode: validMode, speed: validSpeed }
  } catch {
    return fallback
  }
}

function saveMotionPrefs(prefs: MotionPrefs) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Best-effort persistence — private browsing / a full storage quota should not break the page.
  }
}

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

/** World-independent (still local to rotatingGroup) snapshot of the layout a given applyFilters() call produced — the guided tour needs real node/category positions to fly to, which applyFilters previously computed and threw away. */
interface LayoutSnapshot {
  positionById: Map<string, THREE.Vector3>
  typeCenters: Map<ForceClusterNodeType, THREE.Vector3>
  visibleNodes: ForceClusterNode[]
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
  applyFilters: (enabledTypes: ReadonlySet<ForceClusterNodeType>, percent: number) => LayoutSnapshot
  /** The layout produced by buildScene's own initial applyFilters() call, so callers don't need to re-derive it. */
  initialLayout: LayoutSnapshot
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

  function applyFilters(
    enabledTypes: ReadonlySet<ForceClusterNodeType>,
    percent: number
  ): LayoutSnapshot {
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
      // Read by the tour's applyTourLabelFocus() to show only the ONE
      // type-label matching the category currently being framed — `kind`
      // alone can't tell 9 type-labels apart.
      label.userData.type = type
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
      // Read by the tour's applyTourLabelFocus() to show only the ONE
      // node-label matching the node currently being visited — `kind` alone
      // can't tell hundreds of node-labels apart.
      label.userData.nodeId = node.id
      rotatingGroup.add(label)
    }

    return { positionById, typeCenters, visibleNodes }
  }

  const initialLayout = applyFilters(new Set(NODE_TYPES), DEFAULT_VISIBLE_PERCENT)
  return { scene, applyFilters, initialLayout }
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
  const [listOpen, setListOpen] = useState(false)
  const applyFiltersRef = useRef<
    ((enabledTypes: ReadonlySet<ForceClusterNodeType>, percent: number) => LayoutSnapshot) | null
  >(null)
  // The layout applyFilters() most recently produced — the tour reads real
  // node/category positions from here to build its itinerary and flight
  // targets; applyFilters itself only returns a snapshot to its caller, it
  // doesn't retain one.
  const layoutSnapshotRef = useRef<LayoutSnapshot | null>(null)

  const [motionPrefs, setMotionPrefsState] = useState<MotionPrefs>(() => loadMotionPrefs())
  const motionMode = motionPrefs.mode
  const motionSpeed = motionPrefs.speed
  const motionModeRef = useRef<MotionMode>(motionMode)
  const motionSpeedRef = useRef<number>(motionSpeed)
  useEffect(() => {
    motionModeRef.current = motionMode
  }, [motionMode])
  useEffect(() => {
    motionSpeedRef.current = motionSpeed
  }, [motionSpeed])

  const setMotionMode = (mode: MotionMode) => {
    setMotionPrefsState((prev) => {
      const next = { ...prev, mode }
      saveMotionPrefs(next)
      return next
    })
  }
  const setMotionSpeed = (speed: number) => {
    setMotionPrefsState((prev) => {
      const next = { ...prev, speed }
      saveMotionPrefs(next)
      return next
    })
  }

  // Bridges React state -> the imperative tour runtime living inside the
  // scene-setup effect below, the same pattern applyFiltersRef already uses
  // for applyFilters.
  const tourControlRef = useRef<{
    rebuild: (
      enabledTypes: ReadonlySet<ForceClusterNodeType>,
      resumeCategoryType: ForceClusterNodeType | null
    ) => void
    resume: () => void
  } | null>(null)
  const [tourProgress, setTourProgress] = useState<TourProgress | null>(null)
  const [tourPaused, setTourPaused] = useState(false)
  const [tourCaptionNode, setTourCaptionNode] = useState<ForceClusterNode | null>(null)
  const [skippedCategoryLabels, setSkippedCategoryLabels] = useState<string[]>([])
  // Mirrors the current tour stop's category, so toggleType/changeVisiblePercent
  // (outside the scene-setup effect) know which category to resume into after
  // a filter-driven rebuild, without needing the tour's internal state shape.
  const currentTourStopTypeRef = useRef<ForceClusterNodeType | null>(null)

  // Starts/stops the tour itself in response to a mode change (the scene
  // itself never triggers this — only the MotionControls buttons do).
  // Deliberately keyed on [motionMode] alone: enabledTypes is read fresh via
  // closure at the moment `motionMode` becomes 'tour', which is exactly the
  // filter state a fresh tour should start against; toggleType/
  // changeVisiblePercent handle rebuilding an already-running tour
  // themselves when filters change mid-tour.
  useEffect(() => {
    if (motionMode === 'tour') {
      setSelectedNodeId(null)
      tourControlRef.current?.rebuild(enabledTypes, null)
    } else {
      setTourProgress(null)
      setTourCaptionNode(null)
      setTourPaused(false)
      setSkippedCategoryLabels([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above: enabledTypes is deliberately not a trigger here
  }, [motionMode])

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
    const snapshot = applyFiltersRef.current?.(next, visiblePercent) ?? null
    layoutSnapshotRef.current = snapshot
    // A filter change invalidates every position the tour's itinerary holds
    // (navigate-motion-modes-plan-08292026.md §4.7) — rebuild it against the
    // fresh layout, resuming at the start of whichever category was active.
    if (motionModeRef.current === 'tour') {
      tourControlRef.current?.rebuild(next, currentTourStopTypeRef.current)
    }
  }

  const changeVisiblePercent = (percent: number) => {
    setVisiblePercent(percent)
    setSelectedNodeId(null)
    const snapshot = applyFiltersRef.current?.(enabledTypes, percent) ?? null
    layoutSnapshotRef.current = snapshot
    if (motionModeRef.current === 'tour') {
      tourControlRef.current?.rebuild(enabledTypes, currentTourStopTypeRef.current)
    }
  }

  const nodesById = useMemo(() => {
    const map = new Map<string, ForceClusterNode>()
    if (graph) for (const node of graph.nodes) map.set(node.id, node)
    return map
  }, [graph])

  const selectedNode = selectedNodeId ? (nodesById.get(selectedNodeId) ?? null) : null

  // Keyboard/screen-reader path to node selection — raycast-on-canvas-click
  // (the only other way in) is reachable by pointer alone. Mirrors
  // applyFilters' own type + top-percent-by-degree logic (buildScene above)
  // so the list matches what's actually rendered, without touching the
  // imperative three.js scene-building code to get there.
  const visibleNodeList = useMemo(() => {
    if (!graph) return []
    const typeFiltered = graph.nodes.filter((n) => enabledTypes.has(n.type))
    const sortedDesc = [...typeFiltered].sort((a, b) => b.degree - a.degree)
    const keepCount = Math.max(1, Math.ceil((visiblePercent / 100) * sortedDesc.length))
    return sortedDesc.slice(0, keepCount)
  }, [graph, enabledTypes, visiblePercent])

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
    let controlsStartHandler: (() => void) | null = null
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

      const { scene, applyFilters, initialLayout } = buildScene(builtGraph)
      applyFiltersRef.current = applyFilters
      layoutSnapshotRef.current = initialLayout
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

      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // --- Guided tour (navigate-motion-modes-plan-08292026.md §4) ---------
      // Camera flies to fixed world-space targets computed from the current
      // LayoutSnapshot. rotatingGroup keeps rotating under Spin but is never
      // touched by Tour, so entering Tour mode "freezes" it for free — the
      // spin branch below simply stops advancing rotation.y while
      // motionModeRef.current === 'tour', at whatever angle it already held.

      interface TourRuntime {
        stops: TourStop[]
        index: number
        phase: 'flying' | 'dwelling'
        elapsedMs: number
        fromPos: THREE.Vector3
        fromTarget: THREE.Vector3
        toPos: THREE.Vector3
        toTarget: THREE.Vector3
        flightMs: number
        dwellMs: number
        paused: boolean
      }
      const tourStateRef: { current: TourRuntime | null } = { current: null }

      /** World-space { camera position, look-at target } for one tour stop, using the current layout + rotatingGroup's (frozen) world transform. */
      function stopTarget(stop: TourStop): { pos: THREE.Vector3; target: THREE.Vector3 } | null {
        const layout = layoutSnapshotRef.current
        if (!layout || !rotatingGroup || !controls) return null

        if (stop.kind === 'category') {
          const localCenter = layout.typeCenters.get(stop.type)
          if (!localCenter) return null
          const worldPoints = layout.visibleNodes
            .filter((n) => n.type === stop.type)
            .map((n) => layout.positionById.get(n.id))
            .filter((p): p is THREE.Vector3 => !!p)
            .map((p) => rotatingGroup.localToWorld(p.clone()))
          const worldCenter = rotatingGroup.localToWorld(localCenter.clone())
          const { radius } = boundingSphere(worldPoints.length > 0 ? worldPoints : [worldCenter])
          const distance = frameDistance(
            radius,
            TOUR_CAMERA_FOV_DEG,
            camera.aspect,
            TOUR_FRAME_PADDING,
            controls.minDistance,
            controls.maxDistance
          )
          const outward = worldCenter.clone().sub(new THREE.Vector3(0, 0, 0))
          const approachDir =
            outward.lengthSq() > 1e-6 ? outward.normalize() : new THREE.Vector3(0, 0, 1)
          const pos = worldCenter.clone().add(approachDir.multiplyScalar(distance))
          return { pos, target: worldCenter }
        }

        const localPos = layout.positionById.get(stop.node.id)
        const localCenter = layout.typeCenters.get(stop.type)
        if (!localPos || !localCenter) return null
        const worldPos = rotatingGroup.localToWorld(localPos.clone())
        const worldCenter = rotatingGroup.localToWorld(localCenter.clone())
        const fallbackDir = camera.position.clone().sub(controls.target)
        const pos = nodeApproach(worldPos, worldCenter, TOUR_NODE_APPROACH_DISTANCE, fallbackDir)
        return { pos, target: worldPos }
      }

      /** Shows exactly the ONE label relevant to `stop` — bypasses updateLod()'s distance-based tiering, which would otherwise show every node-label at once this close in (navigate-motion-modes-plan-08292026.md §4.4). */
      function applyTourLabelFocus(stop: TourStop) {
        if (!rotatingGroup) return
        for (const child of rotatingGroup.children) {
          if (!(child instanceof CSS2DObject)) continue
          const kind = child.userData.kind as string | undefined
          const show =
            (stop.kind === 'category' &&
              kind === 'type-label' &&
              child.userData.type === stop.type) ||
            (stop.kind === 'node' &&
              kind === 'node-label' &&
              child.userData.nodeId === stop.node.id)
          child.element.style.opacity = show ? '1' : '0'
        }
      }

      function beginStop(state: TourRuntime, index: number): boolean {
        // eslint-disable-next-line security/detect-object-injection -- index is a numeric stop position clamped by callers to [0, state.stops.length), not user input
        const stop = state.stops[index]
        if (!stop || !controls) return false
        const targets = stopTarget(stop)
        if (!targets) return false
        state.index = index
        state.phase = 'flying'
        state.elapsedMs = 0
        state.fromPos.copy(camera.position)
        state.fromTarget.copy(controls.target)
        state.toPos.copy(targets.pos)
        state.toTarget.copy(targets.target)
        state.flightMs = stop.kind === 'category' ? TOUR_CATEGORY_FLIGHT_MS : TOUR_NODE_FLIGHT_MS
        state.dwellMs = stop.kind === 'category' ? TOUR_CATEGORY_DWELL_MS : TOUR_NODE_DWELL_MS
        applyTourLabelFocus(stop)
        currentTourStopTypeRef.current = stop.type
        setTourProgress({
          stopIndex: index,
          stopCount: state.stops.length,
          categoryLabel: TYPE_LABEL[stop.type],
        })
        setTourCaptionNode(null) // hidden while flying; re-shown once dwelling at a node stop, below
        setSelectedNodeId(null) // closes the detail panel while flying to the next stop, whether category or node
        return true
      }

      /** Builds a fresh itinerary from the current layout and starts (or resumes into) it. `resumeCategoryType` re-enters at that category's beat after a filter-driven rebuild; null starts from the very first stop. */
      function rebuildTour(
        enabledTypesNow: ReadonlySet<ForceClusterNodeType>,
        resumeCategoryType: ForceClusterNodeType | null
      ) {
        const layout = layoutSnapshotRef.current
        if (!layout) return
        const stops = buildItinerary(layout.visibleNodes, TOUR_TOP_N)
        setSkippedCategoryLabels(
          // eslint-disable-next-line security/detect-object-injection -- t is drawn from the typed ForceClusterNodeType union (NODE_TYPES), not user input
          skippedCategories(layout.visibleNodes, enabledTypesNow).map((t) => TYPE_LABEL[t])
        )
        if (stops.length === 0) {
          tourStateRef.current = null
          currentTourStopTypeRef.current = null
          setTourProgress(null)
          setTourCaptionNode(null)
          return
        }
        const resumeIndex = resumeCategoryType
          ? stops.findIndex((s) => s.type === resumeCategoryType)
          : -1
        const state: TourRuntime = {
          stops,
          index: 0,
          phase: 'dwelling',
          elapsedMs: 0,
          fromPos: new THREE.Vector3(),
          fromTarget: new THREE.Vector3(),
          toPos: new THREE.Vector3(),
          toTarget: new THREE.Vector3(),
          flightMs: 0,
          dwellMs: 0,
          paused: false,
        }
        tourStateRef.current = state
        setTourPaused(false)
        beginStop(state, Math.max(0, resumeIndex))
      }

      function advanceTourFrame(state: TourRuntime, deltaMs: number) {
        if (state.phase === 'flying') {
          state.elapsedMs += deltaMs
          const t = easeInOutCubic(state.elapsedMs / state.flightMs)
          camera.position.lerpVectors(state.fromPos, state.toPos, t)
          controls?.target.lerpVectors(state.fromTarget, state.toTarget, t)
          if (state.elapsedMs >= state.flightMs) {
            state.phase = 'dwelling'
            state.elapsedMs = 0
            const stop = state.stops[state.index]
            if (stop?.kind === 'node') {
              setTourCaptionNode(stop.node)
              // Opens the same right-hand NavigateDetailPanel a manual click
              // would — the tour reaching a node is functionally "select
              // this node", it just didn't arrive via a canvas click. Safe
              // to set unconditionally here: this function only ever runs
              // while state.paused is false (gated by its one caller in the
              // render loop), so it can never fight a real user's manual
              // selection made during a genuine pause.
              setSelectedNodeId(stop.node.id)
            }
          }
        } else {
          state.elapsedMs += deltaMs
          if (state.elapsedMs >= state.dwellMs) {
            setTourCaptionNode(null)
            beginStop(state, (state.index + 1) % state.stops.length)
          }
        }
      }

      tourControlRef.current = {
        rebuild: rebuildTour,
        resume: () => {
          if (tourStateRef.current) tourStateRef.current.paused = false
          setTourPaused(false)
          setSelectedNodeId(null)
        },
      }

      controlsStartHandler = () => {
        const state = tourStateRef.current
        if (state && !state.paused) {
          state.paused = true
          setTourPaused(true)
        }
      }
      controls.addEventListener('start', controlsStartHandler)
      // ----------------------------------------------------------------------

      const timer = new THREE.Timer()
      renderer.setAnimationLoop(() => {
        timer.update()
        const delta = timer.getDelta()
        const tourState = tourStateRef.current
        const touring = motionModeRef.current === 'tour' && !!tourState
        // Unlike Spin, touring does NOT gate on !selectedNodeIdRef.current —
        // the tour itself sets selectedNodeId while dwelling on a node (to
        // open its detail panel, see advanceTourFrame), and that must not
        // freeze the tour's own dwell/advance timer. tourState.paused (only
        // ever set by a real drag/click on the canvas) is the actual
        // interrupt signal here.
        if (touring && tourState && !tourState.paused) {
          advanceTourFrame(tourState, delta * 1000 * motionSpeedRef.current)
        } else if (
          rotatingGroup &&
          motionModeRef.current === 'spin' &&
          !selectedNodeIdRef.current &&
          !prefersReducedMotion
        ) {
          // Paused while a node is selected — orbiting the scene away from
          // under a reader mid-inspection is a real usability problem, not a
          // cosmetic one. Also paused outright under prefers-reduced-motion:
          // this is a direct three.js animation-loop call, so it sits outside
          // the CSS-keyframe reduced-motion block the rest of the product uses.
          rotatingGroup.rotation.y += delta * 0.02 * motionSpeedRef.current
        }
        controls?.update()
        if (!touring) updateLod()
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
      if (controls && controlsStartHandler)
        controls.removeEventListener('start', controlsStartHandler)
      controls?.dispose()
      renderer?.setAnimationLoop(null)
      renderer?.dispose()
      container?.replaceChildren()
      applyFiltersRef.current = null
      layoutSnapshotRef.current = null
      tourControlRef.current = null
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
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Filter</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1.5 px-2 py-1 text-xs"
              aria-expanded={listOpen}
              aria-controls="navigate-node-list"
              onClick={() => setListOpen((v) => !v)}
            >
              {listOpen ? 'Hide list view' : 'List view (keyboard)'}
            </Button>
          </div>
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
          <MotionControls
            mode={motionMode}
            onModeChange={setMotionMode}
            speed={motionSpeed}
            onSpeedChange={setMotionSpeed}
            tourProgress={tourProgress}
            tourPaused={tourPaused}
            onResumeTour={() => tourControlRef.current?.resume()}
            skippedCategoryLabels={skippedCategoryLabels}
          />
          {listOpen && (
            <ul
              id="navigate-node-list"
              aria-label={`${visibleNodeList.length} visible nodes, ranked by connection count`}
              className="max-h-64 space-y-0.5 overflow-y-auto border-t border-border pt-2"
            >
              {visibleNodeList.map((node) => (
                <li key={node.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNodeId(node.id)}
                    aria-current={node.id === selectedNodeId ? 'true' : undefined}
                    className="h-auto w-full justify-start truncate rounded px-1.5 py-1 text-left text-xs font-normal"
                  >
                    <span className="text-muted-foreground">{TYPE_LABEL[node.type]}:</span>{' '}
                    {node.label}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!loading && !error && motionMode === 'tour' && tourCaptionNode && (
        <TourCaption node={tourCaptionNode} panelOpen={!!selectedNode} />
      )}
    </div>
  )
}
