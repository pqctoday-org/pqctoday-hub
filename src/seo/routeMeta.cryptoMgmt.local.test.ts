// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { ROUTE_META } from './routeMeta'

describe('Cryptographic Management Modernization page description', () => {
  it('is the module description, and no longer promises a return whatever happens with quantum', () => {
    const manifest = MANIFESTS.find((m) => m.id === 'crypto-mgmt-modernization')!
    const meta = ROUTE_META['/learn/crypto-mgmt-modernization']!
    expect(meta.description).toBe(manifest.description)
    expect(meta.description).not.toMatch(/ROI-positive/i)
    expect(meta.description).not.toMatch(/even if quantum never arrives/i)
  })
})
