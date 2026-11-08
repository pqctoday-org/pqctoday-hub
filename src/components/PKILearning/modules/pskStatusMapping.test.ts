// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import type { CatalogAvailability } from '@/data/catalogStatus'

const state = vi.hoisted(() => ({ availability: 'roadmap' as string }))

// Every module derives its headline status from the central catalogue. Here
// the catalogue answer is supplied, so each module's own mapping decides the result.
vi.mock('@/data/catalogStatus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/catalogStatus')>()
  return {
    ...actual,
    getCatalogStatus: () => ({ canonical: state.availability, availability: state.availability }),
  }
})

import { getKmsPqcStatus } from './KmsPqc/data/kmsProviderData'
import { getProfilePqcSupport } from './DatabaseEncryptionPQC/data/databaseConstants'
import { getProviderPqcStatus } from './SecretsManagementPQC/data/secretsConstants'
import { getVendorPqcStatus as getNetworkStatus } from './NetworkSecurityPQC/data/networkProviderData'
import { getHsmPqcPosture } from './CryptoMgmtModernization/data/hsmVendors'
import { getOsPqcStatus } from './OSPQC/data/osProviderData'
import { getVendorPqcSupportStatus } from './HsmPqc/data/hsmVendorData'
import {
  getVendorPqcStatus as getIamStatus,
  PQC_STATUS_LABELS,
} from './IAMPQC/data/iamProviderData'

// Each getter reads only `catalogName`, so a bare object stands in for a provider.
const entry = { catalogName: 'Example Product' } as never

const GETTERS: Array<[string, (p: never) => unknown]> = [
  ['KMS', getKmsPqcStatus],
  ['Database encryption', getProfilePqcSupport],
  ['Secrets management', getProviderPqcStatus],
  ['Network security', getNetworkStatus],
  ['Crypto management', getHsmPqcPosture],
  ['Operating systems', getOsPqcStatus],
  ['HSM', getVendorPqcSupportStatus],
  ['IAM', getIamStatus],
]

const statusFor = (getter: (p: never) => unknown, availability: CatalogAvailability) => {
  state.availability = availability
  return getter(entry)
}

describe('learning modules and the pre-shared-key-only catalogue status', () => {
  for (const [name, getter] of GETTERS) {
    it(`${name}: shows a pre-shared-key-only product as a defined status, never as ready`, () => {
      const psk = statusFor(getter, 'psk')
      expect(psk).toBeDefined()
      expect(psk).not.toBe(statusFor(getter, 'available'))
      if (name === 'IAM' || name === 'Database encryption') {
        // These consumers preserve catalogue availability rather than inferring a release stage.
        expect(psk).toBe('psk')
        expect(PQC_STATUS_LABELS.psk.label).toBe('PSK-only (not PQC)')
        expect(statusFor(getter, 'roadmap')).toBe('roadmap')
      } else {
        // These modules retain their existing roadmap-level support presentation.
        expect(psk).toBe(statusFor(getter, 'roadmap'))
      }
    })
  }
})
