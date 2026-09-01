// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import {
  boundingSphere,
  easeInOutCubic,
  frameCluster,
  frameDistance,
  nodeApproach,
} from './cameraPath'

describe('easeInOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
  })

  it('is monotonically non-decreasing across the domain', () => {
    let prev = -Infinity
    for (let t = 0; t <= 1; t += 0.05) {
      const v = easeInOutCubic(t)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('clamps outside [0, 1]', () => {
    expect(easeInOutCubic(-1)).toBe(0)
    expect(easeInOutCubic(2)).toBe(1)
  })
})

describe('boundingSphere', () => {
  it('returns a safe default for an empty point set', () => {
    const { center, radius } = boundingSphere([])
    expect(center.equals(new THREE.Vector3(0, 0, 0))).toBe(true)
    expect(radius).toBeGreaterThan(0)
  })

  it('centers on the centroid and radius covers the farthest point', () => {
    const points = [new THREE.Vector3(-2, 0, 0), new THREE.Vector3(2, 0, 0)]
    const { center, radius } = boundingSphere(points)
    expect(center.equals(new THREE.Vector3(0, 0, 0))).toBe(true)
    expect(radius).toBeCloseTo(2, 5)
  })

  it('floors radius so a single point still frames sensibly', () => {
    const { radius } = boundingSphere([new THREE.Vector3(5, 5, 5)])
    expect(radius).toBeGreaterThanOrEqual(0.5)
  })
})

describe('frameDistance', () => {
  it('picks the narrower of the vertical/horizontal half-angles (portrait aspect)', () => {
    const wide = frameDistance(10, 50, 1.6, 1, 5, 90)
    const tall = frameDistance(10, 50, 0.6, 1, 5, 90)
    // A narrower (portrait) viewport must back the camera up farther to fit the same sphere.
    expect(tall).toBeGreaterThan(wide)
  })

  it('clamps into [minDistance, maxDistance]', () => {
    expect(frameDistance(1000, 50, 1.6, 1, 5, 90)).toBe(90)
    expect(frameDistance(0.001, 50, 1.6, 1, 5, 90)).toBe(5)
  })

  it('applies padding as extra distance', () => {
    const noPad = frameDistance(10, 50, 1.6, 1, 5, 90)
    const padded = frameDistance(10, 50, 1.6, 1.15, 5, 90)
    expect(padded).toBeCloseTo(noPad * 1.15, 5)
  })
})

describe('frameCluster', () => {
  const forward = new THREE.Vector3(0, 0, -1)
  const worldUp = new THREE.Vector3(0, 1, 0)
  const center = new THREE.Vector3(0, 0, 0)

  it('is symmetric between width and height for a square-aspect, equally-spread cloud', () => {
    // frameCluster fits each axis independently (tan-based, flat points) —
    // a different geometric model than frameDistance's sphere-tangent (sin-
    // based) fit, so the two aren't expected to agree numerically even for
    // a "round" point cloud. What SHOULD hold here: with aspect=1 (equal
    // vFov/hFov) and equal spread on both view-plane axes, swapping which
    // axis is "wide" must not change the answer.
    const pointsX = [new THREE.Vector3(5, 0, 0), new THREE.Vector3(-5, 0, 0)]
    const pointsY = [new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, -5, 0)]
    const distX = frameCluster(pointsX, center, forward, worldUp, 50, 1, 1, 5, 200)
    const distY = frameCluster(pointsY, center, forward, worldUp, 50, 1, 1, 5, 200)
    expect(distX).toBeCloseTo(distY, 10)
  })

  it('does not over-back-off for a cluster spread wide but shallow (anisotropic)', () => {
    // Same farthest-point distance (10) as a hypothetical isotropic sphere
    // of radius 10, but ALL of the spread is sideways (x), none vertical —
    // frameCluster should fit this much tighter than frameDistance would
    // for a true radius-10 sphere, since the vertical extent is tiny.
    const points = [new THREE.Vector3(10, 0, 0), new THREE.Vector3(-10, 0, 0)]
    const aniso = frameCluster(points, center, forward, worldUp, 50, 1.78, 1, 5, 200)
    const isoWorstCase = frameDistance(10, 50, 1.78, 1, 5, 200)
    expect(aniso).toBeLessThan(isoWorstCase)
  })

  it('still fits a cluster spread mostly vertically', () => {
    const points = [new THREE.Vector3(0, 8, 0), new THREE.Vector3(0, -8, 0)]
    const distance = frameCluster(points, center, forward, worldUp, 50, 1.78, 1, 5, 200)
    // At the returned distance, the vertical half-angle should almost
    // exactly match the camera's own vertical half-FOV (padding=1, so no slack).
    const vFovHalf = (50 * Math.PI) / 180 / 2
    const impliedHalfAngle = Math.atan(8 / distance)
    expect(impliedHalfAngle).toBeCloseTo(vFovHalf, 3)
  })

  it('backs off further for a point nearer the camera than center, same lateral offset', () => {
    // eye sits at center - distance*forward (since forward points INTO the
    // scene) — z=+3 is 3 units back TOWARD the eye along +Z, i.e. nearer
    // the camera than center's own depth. A point that close, at the same
    // lateral (x) offset as one sitting exactly at center's depth, subtends
    // a bigger angle and needs more backup distance to still fit in frame.
    const level = frameCluster(
      [new THREE.Vector3(5, 0, 0)],
      center,
      forward,
      worldUp,
      50,
      1.78,
      1,
      5,
      200
    )
    const nearer = frameCluster(
      [new THREE.Vector3(5, 0, 3)],
      center,
      forward,
      worldUp,
      50,
      1.78,
      1,
      5,
      200
    )
    expect(nearer).toBeGreaterThan(level)
  })

  it('a point exactly at the eye distance from center in depth does not blow up the result unreasonably', () => {
    // A pathological case (point sitting between center and where the eye
    // will end up) still returns a finite, positive distance.
    const distance = frameCluster(
      [new THREE.Vector3(1, 0, 50)],
      center,
      forward,
      worldUp,
      50,
      1.78,
      1,
      5,
      500
    )
    expect(Number.isFinite(distance)).toBe(true)
    expect(distance).toBeGreaterThan(0)
  })

  it('handles forward parallel to worldUp without producing NaN', () => {
    const straightUp = new THREE.Vector3(0, 1, 0)
    const points = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 1)]
    const distance = frameCluster(points, center, straightUp, worldUp, 50, 1.6, 1.15, 5, 90)
    expect(Number.isFinite(distance)).toBe(true)
  })

  it('clamps into [minDistance, maxDistance]', () => {
    const farPoints = [new THREE.Vector3(1000, 0, 0)]
    expect(frameCluster(farPoints, center, forward, worldUp, 50, 1.6, 1, 5, 90)).toBe(90)
    const closePoints = [new THREE.Vector3(0.001, 0, 0)]
    expect(frameCluster(closePoints, center, forward, worldUp, 50, 1.6, 1, 5, 90)).toBe(5)
  })
})

describe('nodeApproach', () => {
  it('offsets from the node outward from the cluster center by `distance`', () => {
    const node = new THREE.Vector3(10, 0, 0)
    const center = new THREE.Vector3(0, 0, 0)
    const pos = nodeApproach(node, center, 7, new THREE.Vector3(0, 0, 1))
    expect(pos.equals(new THREE.Vector3(17, 0, 0))).toBe(true)
  })

  it('falls back to fallbackDir when the node sits on the cluster center', () => {
    const node = new THREE.Vector3(3, 3, 3)
    const center = new THREE.Vector3(3, 3, 3)
    const pos = nodeApproach(node, center, 7, new THREE.Vector3(0, 1, 0))
    expect(pos.equals(new THREE.Vector3(3, 10, 3))).toBe(true)
  })
})
