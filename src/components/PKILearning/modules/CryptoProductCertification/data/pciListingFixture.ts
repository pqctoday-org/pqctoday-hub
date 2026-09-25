// SPDX-License-Identifier: GPL-3.0-only
// OWNER: PCI author
/**
 * Hand-curated PTS HSM listing fixture (plan r2 §5 P8). The Hub carries no PCI
 * data, so this file is the only source for the listings the PCI workshop reads.
 *
 * Provenance (read 24 September 2026):
 *  - Each entry was fetched from its public listing popup
 *    (listings.pcisecuritystandards.org/popups/pts_device.php?appnum=…) through
 *    pqctoday-priv/scripts/fetch_resilient.py. The popups answered HTTP 200
 *    with no licence or agreement step. The searchable device list
 *    (…/assessors_and_solutions/pin_transaction_devices) redirects to an
 *    agreement page; it was NOT accepted and NOT used (plan r2 D4).
 *  - Approval 4-40266 was found through the vendor's own product page, which
 *    links to that popup; 4-70041 and 4-40069 through a public web search that
 *    returned the popup URLs.
 *  - Field values are the rendered table cells, copied verbatim. Line breaks in a
 *    cell are kept as "\n"; runs of spaces are collapsed. An empty string means
 *    the listing cell was blank.
 *
 * Re-verify before the 19 October 2026 freeze: a listing can change (new
 * firmware, a PQC notation, end-of-life) without notice.
 */

/** The listing columns, in the order the public popup shows them. */
export const PCI_LISTING_COLUMNS = [
  'Company',
  'Product',
  'Hardware / firmware / applications',
  'Approval Number',
  'Product Type',
  'Version',
  'Expiry Date',
  'PIN Support',
  'PIN Encryption Key Management',
  'SRED Key Management',
  'Prompt Control',
  'PIN Entry Technology',
  'Functions Provided',
  'Additional Information',
] as const

export type PciListingColumn = (typeof PCI_LISTING_COLUMNS)[number]

export interface PciListingFixtureEntry {
  /** approval number, also the popup's `appnum` */
  approvalNumber: string
  /** listing column → value, quoted verbatim from the listing */
  fields: Record<PciListingColumn, string>
  /** public listing URL the fields were read from */
  sourceUrl: string
  /** how the approval number was found (no licence-gated page involved) */
  foundVia: string
}

export interface PciListingFixture {
  /** ISO date the listings were read */
  asOf: string
  entries: PciListingFixtureEntry[]
}

const popup = (appnum: string) =>
  `https://listings.pcisecuritystandards.org/popups/pts_device.php?appnum=${appnum}`

export const pciListingFixture: PciListingFixture = {
  asOf: '2026-09-24',
  entries: [
    {
      approvalNumber: '4-40266',
      sourceUrl: popup('4-40266'),
      foundVia: 'Linked as "PCI HSM" from the vendor’s own payShield 10K product page',
      fields: {
        Company: 'Thales DIS CPL USA, Inc.',
        Product: 'payShield 10K, PS10-S, PS10-D, PS10-F',
        'Hardware / firmware / applications':
          'Hardware #: PCI Rev:01, PCI Rev: 1.0, PCI Rev: 1.1, PCI Rev: 3.0\nFirmware #: 1.0c Revision 1500-1010, 1.0d Revision 1500-1020, 1.0f Revision 1500-1022, 1.1a Revision 1500-1023, 1.2a Revision 1500-1024, 1.4a Revision 1500-1030, 1.4a Revision 1209-1004, 1.5a Revision 1500-1031, 1.6a Revision 1500-1032, 1.7a Revision 1500-1033, 1.4a Revision 1135-0000, 1.8a Revision 1500-1036, 1.7b Revision 1500-1034, 1.9a Revision 1500-1038, 1.9b Revision 1500-1039, 1.9c Revision 1500-1040, 1.9d Revision 1500-1041, 2.0c Revision 2000-102x, 2.1a Revision 2100-100x, 1.9d Revision 1209-1007, 2.2b Revision 2200-101x, 2.3a Revision 2300-100x, 2.1a Revision 1135-0005, 2.4a Revision 2400-100x\nApplic #:\nApproved Components :',
        'Approval Number': '4-40266',
        'Product Type': '',
        Version: '3.x',
        'Expiry Date': '30 Apr 2028',
        'PIN Support': 'Online & Offline',
        'PIN Encryption Key Management': 'TDES:\nFixed,MK/SK,DUKPT\nAES:\nFixed,MK/SK,DUKPT',
        'SRED Key Management': 'TDES:\nN/A\nAES:\nN/A\nFPE:\nN/A',
        'Prompt Control': 'N/A',
        'PIN Entry Technology': 'N/A',
        'Functions Provided': 'Remote Administration',
        'Additional Information':
          'Approved usage: Restricted\nSupports ISO Format 4 (AES) PIN Blocks: Yes',
      },
    },
    {
      approvalNumber: '4-70041',
      sourceUrl: popup('4-70041'),
      foundVia: 'Public web search result pointing at the listing popup',
      fields: {
        Company: 'Utimaco Inc',
        Product: 'Atalla HSM AT1000',
        'Hardware / firmware / applications':
          'Hardware #: HW-AT-HSM-V1, HW-AT-HSM-V2\nFirmware #: 8.22.x.x, 8.30.x.x, 8.40.xx, 8.50.xx, 8.53.1.x, 8.60.x.x\nApplic #:\nApproved Components :',
        'Approval Number': '4-70041',
        'Product Type': '',
        Version: '3.x',
        'Expiry Date': '30 Apr 2028',
        'PIN Support': 'Online',
        'PIN Encryption Key Management': 'TDES:\nFixed,MK/SK,DUKPT\nAES:\nFixed,MK/SK,DUKPT',
        'SRED Key Management': 'TDES:\nN/A\nAES:\nN/A\nFPE:\nN/A',
        'Prompt Control': 'N/A',
        'PIN Entry Technology': 'N/A',
        'Functions Provided': 'Remote Administration',
        'Additional Information':
          'Approved usage: Unrestricted\nSupports ISO Format 4 (AES) PIN Blocks: Yes',
      },
    },
    {
      approvalNumber: '4-40069',
      sourceUrl: popup('4-40069'),
      foundVia: 'Public web search result pointing at the listing popup',
      fields: {
        Company: 'Thales DIS CPL USA, Inc.',
        Product: 'payShield 9000',
        'Hardware / firmware / applications':
          'Hardware #: 1600A466.01.x.x.x.x.x.x, 1600B466.01.x.x.x.x.x.x, 1600A466.04.x.x.x.x.x.x, 1600B466.04.x.x.x.x.x.x, 1600D466.04.x.x.x.x.x.x, 1600A466.05.x.x.x.x.x.x, 1600B466.05.x.x.x.x.x.x, 1600D466.05.x.x.x.x.x.x, 1600A466.06.x.x.x.x.x.x, 1600B466.06.x.x.x.x.x.x, 1600D466.06.x.x.x.x.x.x\nFirmware #: Bootstrap Version 1.10.2, Boot Manager Versions 1.16.12, 1.16.8, 1.18.2\nApplic #: 1346-1905 (Version 2.1c) including Bootstrap, Boot Manager, HSM Manager 4.1.x, . 1346-1907 (Version 2.1d) including Bootstrap, HSM Manager 4.1.x, . 1346-1914 (Version 2.3c) including Bootstrap, HSM Manager 5.x.x, . 1346-1917 (Version 2.3f) including Bootstrap, . 1407-1902 (Version 3.1a) including Bootstrap, BootManager, payShield Manager, . 1407-1905 (Version 3.1d) including Bootstrap, . 1435-1901 (Custom) including Bootstrap, BootManager Version, . 1407-1908 (Version 3.2c) including Bootstrap, payShield Manager. 1407-1911 (Version 3.3b) including Bootstrap, payShield Manager. , 1407-1911 (Version 3.3b) including Bootstrap, 1407-0917 (Version 3.4c) including Bootstrap, . 1407-1921 (Version 3.5a) including Bootstrap, 1407-0917 (Version 3.4c) including Bootstrap, . 1135-0914 (Version 3.4c) including Bootstrap\nApproved Components :',
        'Approval Number': '4-40069',
        'Product Type': '',
        Version: '1.x',
        'Expiry Date': '30 Apr 2019',
        'PIN Support': 'Online & Offline',
        'PIN Encryption Key Management': 'TDES:\nFixed,MK/SK,DUKPT\nAES:\nMK/SK,DUKPT',
        'SRED Key Management': 'TDES:\nN/A\nAES:\nN/A\nFPE:\nNo',
        'Prompt Control': 'N/A',
        'PIN Entry Technology': 'N/A',
        'Functions Provided': '',
        'Additional Information': '',
      },
    },
  ],
}
