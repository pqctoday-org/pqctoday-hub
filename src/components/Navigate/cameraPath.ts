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
 * Camera distance needed to fit `points` (relative to `center`) in view from
 * a specific `forward` viewing direction — projects each point onto the
 * actual view plane (using `worldUp` to build a stable right/up basis) and
 * fits the real width AND height extents separately, rather than treating
 * the cluster as an isotropic sphere the way `frameDistance` does.
 *
 * This matters for a point cloud that's spread out anisotropically — e.g.
 * several sub-clusters arranged sideways more than vertically, which is
 * typical of this graph's fibonacci-sphere sub-category layout. An
 * isotropic bounding-sphere fit sizes the camera distance off the single
 * farthest point in ANY direction, then backs off enough to fit a full
 * sphere of that radius — which leaves the narrower actual dimension mostly
 * empty. Found via direct visual testing: framing the "Crypto mechanism"
 * category (a tight core cluster plus a couple of classical-algorithm
 * outliers spread mostly sideways) with `frameDistance` alone left most of
 * the frame blank top/bottom while still nearly clipping the outliers at
 * the left/right edges.
 *
 * Also depth-aware: a point sitting nearer the camera than `center` (along
 * `forward`) subtends a larger angle for the same lateral offset than one
 * at `center`'s own depth, and needs correspondingly more backup distance —
 * treating every point as if it sat at exactly `center`'s depth (as an
 * eye-at-center-then-offset lateral-only fit would) under-frames any point
 * that's closer than center, clipping it at the frustum edge. Found via
 * visual testing on the same "Crypto mechanism" category: an outlier
 * (Ed25519) sitting well forward of the cluster's centroid rendered
 * oversized and cut off at the frame edge even after the lateral-only fix.
 */
export function frameCluster(
  points: THREE.Vector3[],
  center: THREE.Vector3,
  forward: THREE.Vector3,
  worldUp: THREE.Vector3,
  fovDeg: number,
  aspect: number,
  padding: number,
  minDistance: number,
  maxDistance: number
): number {
  const fwd = forward.lengthSq() > 1e-9 ? forward.clone().normalize() : new THREE.Vector3(0, 0, 1)
  // Degenerate when forward is (near) parallel to worldUp — cross() would
  // return a near-zero vector and normalize() would blow up into garbage.
  const up = Math.abs(fwd.dot(worldUp)) > 0.999 ? new THREE.Vector3(1, 0, 0) : worldUp
  const right = new THREE.Vector3().crossVectors(fwd, up).normalize()
  const trueUp = new THREE.Vector3().crossVectors(right, fwd).normalize()

  const vFov = (fovDeg * Math.PI) / 180
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
  const tanVHalf = Math.tan(vFov / 2)
  const tanHHalf = Math.tan(hFov / 2)

  // eye = center + distance*(-forward); a point's depth-from-eye is
  // `distance + depthOffset` where depthOffset = dot(point - center,
  // forward) — negative for a point nearer the eye than center is. Fitting
  // `lateralOffset <= depthFromEye * tan(halfFov)` and solving for the
  // per-point minimum `distance` gives `lateralOffset/tan(halfFov) -
  // depthOffset`; the required camera distance is the max of that over
  // every point and both axes (reduces to the plain lateral-only fit when
  // every point shares center's depth, i.e. depthOffset = 0 throughout).
  let required = 0.5 // matches boundingSphere's own floor for a degenerate single-point/empty case
  for (const p of points) {
    const delta = p.clone().sub(center)
    const depthOffset = delta.dot(fwd)
    const x = Math.abs(delta.dot(right))
    const y = Math.abs(delta.dot(trueUp))
    required = Math.max(required, y / tanVHalf - depthOffset, x / tanHHalf - depthOffset)
  }

  const distance = required * padding
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
