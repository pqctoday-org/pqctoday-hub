import type { VendorRegistryEntry } from './vendorRegistry'
import testVendorCertFull from '../../tools/embed-test-site/test-fixtures/test-vendor.crt?raw'
import testVendorCertRestricted from '../../tools/embed-test-site/test-fixtures/test-vendor-restricted.crt?raw'

export const TEST_VENDOR_REGISTRY: readonly VendorRegistryEntry[] = [
  {
    kid: 'test-vendor',
    vendorId: 'Acme Corp',
    vendorName: 'Test Vendor Full',
    certPem: testVendorCertFull,
    revoked: false,
  },
  {
    kid: 'test-vendor-restricted',
    vendorId: 'Limited Corp',
    vendorName: 'Test Vendor Restricted',
    certPem: testVendorCertRestricted,
    revoked: false,
  },
]
