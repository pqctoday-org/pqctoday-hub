// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure camera-flight math for the /navigate guided tour. THREE.Vector3 is
 * used only as a value type here (no scene/renderer/camera coupling), so
 * this stays unit-testable without a WebGL context — the itinerary
 * (tourItinerary.ts) and the actual scene wiring (ForceClusterView.tsx) are
 * deliberately kept separate from this file.
 */
import * as THREE from 'three'

export function easeInOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  return clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2
}

export interface BoundingSphere {
  center: THREE.Vector3
  radius: number
}

/**
 * Centroid + max distance from centroid. Not a minimal enclosing sphere —
 * doesn't need to be for camera framing, and this is O(n) instead of the
 * iterative algorithms a true minimal sphere would need.
 */
export function boundingSphere(points: THREE.Vector3[]): BoundingSphere {
  if (points.length === 0) return { center: new THREE.Vector3(), radius: 1 }
  const center = new THREE.Vector3()
  for (const p of points) center.add(p)
  center.divideScalar(points.length)
  let radius = 0
  for (const p of points) radius = Math.max(radius, p.distanceTo(center))
  return { center, radius: Math.max(radius, 0.5) }
}

/**
 * Camera distance needed to fit a sphere of `radius` in view, given a
 * vertical `fovDeg` and the viewport `aspect` — uses whichever of the
 * vertical/horizontal half-angles is narrower so the sphere fits in both
 * dimensions, not just vertically. `padding` adds headroom (1.15 = 15%
 * slack). Clamped to `[minDistance, maxDistance]` to match OrbitControls'
 * own distance clamp.
 */
export function frameDistance(
  radius: number,
  fovDeg: number,
  aspect: number,
  padding: number,
  minDistance: number,
  maxDistance: number
): number {
  const vFov = (fovDeg * Math.PI) / 180
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
  const halfAngle = Math.min(vFov, hFov) / 2
  const distance = (radius / Math.sin(halfAngle)) * padding
  return Math.min(maxDistance, Math.max(minDistance, distance))
}

/**
 * Camera position for approaching a node from *outside* its cluster: offset
 * `distance` units from `nodeWorld` along the direction from `centerWorld`
 * to `nodeWorld`, so the node is framed against open space rather than
 * through the middle of its own neighbours. Falls back to `fallbackDir`
 * when the node sits (near) exactly on the cluster center — a degenerate
 * direction that would otherwise normalize to garbage.
 */
export function nodeApproach(
  nodeWorld: THREE.Vector3,
  centerWorld: THREE.Vector3,
  distance: number,
  fallbackDir: THREE.Vector3
): THREE.Vector3 {
  const outward = nodeWorld.clone().sub(centerWorld)
  const dir = outward.lengthSq() > 1e-6 ? outward.normalize() : fallbackDir.clone().normalize()
  return nodeWorld.clone().add(dir.multiplyScalar(distance))
}
