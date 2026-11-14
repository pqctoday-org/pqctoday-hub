// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { softwareData } from '@/data/migrateData'
import { CLOUD_PROVIDER_PRODUCTS } from './CloudResponsibilityMatrix'

describe('cloud provider products join the product catalogue', () => {
  // softwareData is the active snapshot: rows with status deprecated/obsolete
  // never enter it, so a later retirement of a referenced product fails here.
  // The retired 'Google Cloud KMS (Cloud Gateway)' row (deprecated in the CSV)
  // pins that premise in the last test.
  const active = new Map(softwareData.map((s) => [s.softwareName, s]))

  it.each(Object.entries(CLOUD_PROVIDER_PRODUCTS))(
    '%s references only active catalogue software names',
    (_provider, families) => {
      for (const name of [...families.kmsHsm, ...families.tls]) {
        expect(active.has(name), `${name} is not an active catalogue row`).toBe(true)
      }
    }
  )

  it('GCP TLS drops the retired Cloud Gateway row and Alibaba lists its ESA edge TLS', () => {
    expect(CLOUD_PROVIDER_PRODUCTS.GCP.tls).not.toContain('Google Cloud KMS (Cloud Gateway)')
    expect(active.has('Google Cloud KMS (Cloud Gateway)')).toBe(false)
    expect(CLOUD_PROVIDER_PRODUCTS.Alibaba.tls).toContain(
      'Alibaba Cloud ESA (Edge Security Acceleration)'
    )
  })
})
