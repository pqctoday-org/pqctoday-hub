// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { boundingSphere, easeInOutCubic, frameDistance, nodeApproach } from './cameraPath'

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
