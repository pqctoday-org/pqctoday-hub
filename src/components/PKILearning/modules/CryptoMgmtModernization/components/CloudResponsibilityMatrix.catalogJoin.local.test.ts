// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { softwareData } from '@/data/migrateData'
import { CLOUD_PROVIDER_PRODUCTS } from './CloudResponsibilityMatrix'

describe('cloud provider products join the product catalogue', () => {
  const names = new Set(softwareData.map((s) => s.softwareName))
  it.each(Object.entries(CLOUD_PROVIDER_PRODUCTS))(
    '%s references only catalogue software names',
    (_provider, families) => {
      for (const name of [...families.kmsHsm, ...families.tls]) expect(names).toContain(name)
    }
  )
  it('GCP TLS uses active rows and Alibaba lists its ESA edge TLS', () => {
    expect(CLOUD_PROVIDER_PRODUCTS.GCP.tls).not.toContain('Google Cloud KMS (Cloud Gateway)')
    expect(CLOUD_PROVIDER_PRODUCTS.Alibaba.tls).toContain(
      'Alibaba Cloud ESA (Edge Security Acceleration)'
    )
  })
})
