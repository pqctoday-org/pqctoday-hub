// SPDX-License-Identifier: AGPL-3.0-only

import type { PQCMigrationStatus } from './secureBootConstants'

export type VendorTier = 'enterprise' | 'open-source'

/** A public page the row's text comes from. `date` is the document's own date (YYYY-MM-DD or YYYY-MM); leave it out for a page that carries none. */
export interface VendorSource {
  label: string
  url: string
  date?: string
}

export interface FirmwareVendorStatus {
  id: string
  vendor: string
  product: string
  tier: VendorTier
  category: string
  pqcStatus: PQCMigrationStatus
  /** Date of the newest dated source below (YYYY-MM-DD or YYYY-MM). */
  statementDate: string
  products: string[]
  pqcAlgorithm: string
  /** Only what the sources below state. */
  notes: string
  sources: VendorSource[]
}

/** The day every source in FIRMWARE_VENDORS was last opened and read. */
export const VENDOR_MATRIX_CHECKED_ON = '24 October 2026'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** '2025-11-12' -> '12 Nov 2025'; '2024-07' -> 'Jul 2024'. */
export function formatVendorDate(date: string): string {
  const [year, month, day] = date.split('-')
  const monthName = MONTHS[Number(month) - 1]
  return day ? `${Number(day)} ${monthName} ${year}` : `${monthName} ${year}`
}

export const VENDOR_STATUS_LABELS: Record<
  PQCMigrationStatus,
  { label: string; className: string }
> = {
  available: {
    label: 'Available',
    className: 'bg-status-success/10 text-status-success border-status-success/30',
  },
  announced: {
    label: 'Announced',
    className: 'bg-status-info/10 text-status-info border-status-info/30',
  },
  'in-progress': {
    label: 'In progress',
    className: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  },
}

export const FIRMWARE_VENDORS: FirmwareVendorStatus[] = [
  {
    id: 'ami',
    vendor: 'AMI',
    product: 'Aptio V UEFI Firmware',
    tier: 'enterprise',
    category: 'UEFI Firmware',
    pqcStatus: 'announced',
    statementDate: '2025-11-12',
    products: ['Aptio V (x86 and Arm)'],
    pqcAlgorithm: 'Not stated in the announcement',
    notes:
      'On 12 November 2025 AMI announced "the successful implementation of Post-Quantum Cryptography (PQC) support" in Aptio V UEFI Firmware. The announcement names no algorithm, version, platform or availability date. AMI describes Aptio V as modular BIOS/UEFI firmware with "compatibility across x86 and Arm".',
    sources: [
      {
        label: 'AMI news release',
        url: 'https://www.ami.com/resources/industry-first-post-quantum-cryptography-in-aptio-v-uefi-firmware/',
        date: '2025-11-12',
      },
      { label: 'AMI Aptio V product page', url: 'https://www.ami.com/products/aptio-v/' },
    ],
  },
  {
    id: 'insyde',
    vendor: 'Insyde Software',
    product: 'InsydeH2O UEFI BIOS',
    tier: 'enterprise',
    category: 'UEFI Firmware',
    pqcStatus: 'available',
    statementDate: '2026-06-03',
    products: ['InsydeH2O UEFI BIOS'],
    pqcAlgorithm: 'ML-DSA (no parameter set named)',
    notes:
      'On 3 June 2026 Insyde announced that InsydeH2O "integrates ML-DSA support for Secure Flash, Capsule Update, and firmware authentication". The release says Insyde\'s PQC capabilities "are available now to Insyde customers and partners".',
    sources: [
      {
        label: 'Insyde press release',
        url: 'https://www.insyde.com/news/press-releases/insyde-software-integrates-post-quantum-cryptography-and-builds-eu-cra-compliance-foundation-across-full-firmware-stack/',
        date: '2026-06-03',
      },
    ],
  },
  {
    id: 'tianocore',
    vendor: 'TianoCore',
    product: 'EDK2 (EFI Development Kit II)',
    tier: 'open-source',
    category: 'Open-Source UEFI',
    pqcStatus: 'in-progress',
    statementDate: '2026-10-23',
    products: ['EDK2 CryptoPkg', 'EDK2 SecurityPkg (AuthVariableLib)'],
    pqcAlgorithm: 'ML-DSA-87',
    notes:
      'EDK2 CryptoPkg handles ML-DSA-87 in its X.509 code; the source comment reads "Currently, only EVP_PKEY_ML_DSA_87 is supported." Accepting ML-DSA certificates in authenticated variables (the Secure Boot step) is not merged: edk2 PR #13365, opened on 23 October 2026, was closed without merging on 29 October 2026 in favour of PR #13411, which was open when checked on 31 October 2026.',
    sources: [
      {
        label: 'edk2 pull request 13365 (closed, not merged)',
        url: 'https://github.com/tianocore/edk2/pull/13365',
        date: '2026-10-23',
      },
      {
        label: 'edk2 pull request 13411 (open)',
        url: 'https://github.com/tianocore/edk2/pull/13411',
        date: '2026-10-28',
      },
      {
        label: 'edk2 CryptX509.c (master)',
        url: 'https://github.com/tianocore/edk2/blob/master/CryptoPkg/Library/BaseCryptLib/Pk/CryptX509.c',
      },
    ],
  },
  {
    id: 'dell',
    vendor: 'Dell Technologies',
    product: 'Dell iDRAC firmware signing (PowerEdge 17G)',
    tier: 'enterprise',
    category: 'OEM firmware',
    pqcStatus: 'available',
    statementDate: '2026-10-08',
    products: [
      'PowerEdge 17G servers (iDRAC 1.30.40.51)',
      'BOSS-N1, PERC12 and the CX9 custom card',
      'Dell Pro, Dell Pro Max, Dell Pro Precision and Dell Pro Rugged PCs (latest generation)',
    ],
    pqcAlgorithm: 'LMS (dual classical plus LMS signing)',
    notes:
      'Dell\'s iDRAC 1.30.40.51 release (29 August 2026) lists support for the "PQC Firmware Update Signing and Verification Framework (dual classical plus LMS post-quantum signing)" on PowerEdge 17G servers, and PQC dual firmware signing on BOSS-N1, PERC12 and the CX9 custom card. A Dell blog of 8 October 2026 says its current commercial PCs use "Leighton-Micali Signature (LMS) verification, a NIST SP 800-208 scheme" for the embedded controller and for code signing of EC and BIOS updates.',
    sources: [
      {
        label: 'Dell iDRAC 1.30.40.51 release notes',
        url: 'https://www.dell.com/support/home/en-us/drivers/driversdetails?driverid=HYG95',
        date: '2026-08-29',
      },
      {
        label: 'Dell blog: Post-Quantum Ready... or Not',
        url: 'https://www.dell.com/en-us/blog/post-quantum-ready-or-not-why-your-next-pc-refresh-is-a-cryptography-decision',
        date: '2026-10-08',
      },
    ],
  },
  {
    id: 'hpe',
    vendor: 'HPE',
    product: 'HPE iLO 7 (ProLiant Gen12)',
    tier: 'enterprise',
    category: 'OEM firmware',
    pqcStatus: 'available',
    statementDate: '2025-08-18',
    products: ['ProLiant Gen12 servers (iLO 7)'],
    pqcAlgorithm: 'LMS',
    notes:
      'HPE\'s iLO QuickSpecs (version 39, 18 August 2025) lists, under "What\'s New in HPE iLO 7", a "CNSA 2.0-aligned NIST-approved LMS algorithm ensuring PQC-ready firmware updates (iLO, BIOS and CPLD)". On the iLO 7 secure enclave\'s FIPS 140-3 Level 3 target, the same page says "The certification is not obtained yet but we are intending to."',
    sources: [
      {
        label: 'HPE iLO QuickSpecs (c04154343, version 39)',
        url: 'https://www.hpe.com/psnow/downloadDoc/HPE%20Integrated%20Lights-Out%20(iLO)%20QuickSpecs-c04154343.pdf?contentDisposition=attachment&form=false&hf=regular&id=c04154343.pdf&isFutureVersion=true&isLinearized=false&preview=false&ver=39',
        date: '2025-08-18',
      },
    ],
  },
  {
    id: 'intel',
    vendor: 'Intel',
    product: 'Intel Boot Guard (TXT / ACM)',
    tier: 'enterprise',
    category: 'Hardware Root of Trust',
    pqcStatus: 'announced',
    statementDate: '2024-07',
    products: ['Boot Guard authenticated code module (ACM)'],
    pqcAlgorithm: 'LMS (optionally combined with RSASSA or ECDSA)',
    notes:
      'Intel\'s white paper "Hardening Intel Trusted eXecution Technology and Intel Boot Guard" (revision 0.21, July 2024, section 7) says "ACM is supporting Leighton-Micali Signatures (LMS) for all manifests", and that the Boot Guard Key Manifest "may use LMS combined with currently supported legacy schemes RSASSA or ECDSA". The paper is dated July 2024 and names no product generation or ship date. Its appendix table lists post-quantum cryptography as \'Supported\' for both client and server platforms.',
    sources: [
      {
        label: 'Intel white paper 824411 (revision 0.21)',
        url: 'https://cdrdv2-public.intel.com/824411/Hardening%20Intel%C2%AE%20Trusted%20eXecution%20Technology%20and%20Intel%C2%AE%20Boot%20Guard.pdf',
        date: '2024-07',
      },
    ],
  },
]
