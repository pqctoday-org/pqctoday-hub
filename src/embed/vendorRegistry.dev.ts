import type { VendorRegistryEntry } from './vendorRegistry'
import testVendorCertFull from '../../../pqc-tools/embed-test-site/test-fixtures/test-vendor.crt?raw'
import testVendorCertRestricted from '../../../pqc-tools/embed-test-site/test-fixtures/test-vendor-restricted.crt?raw'
import testVendorCertCustomDesign from '../../../pqc-tools/embed-test-site/test-fixtures/test-vendor-custom-design.crt?raw'

export const TEST_VENDOR_REGISTRY: readonly VendorRegistryEntry[] = [
  {
    kid: 'test-vendor',
    vendorId: 'Acme Corp',
    vendorName: 'Test Vendor Full',
    certPem: testVendorCertFull,
    revoked: false,
    isTest: true,
  },
  {
    kid: 'test-vendor-restricted',
    vendorId: 'Limited Corp',
    vendorName: 'Test Vendor Restricted',
    certPem: testVendorCertRestricted,
    revoked: false,
    isTest: true,
  },
  {
    kid: 'test-vendor-custom-design',
    vendorId: 'Custom Design Corp',
    vendorName: 'Test Vendor Custom Design (Full Access)',
    certPem: testVendorCertCustomDesign,
    revoked: false,
    isTest: true,
  },
]
