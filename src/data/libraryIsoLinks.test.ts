// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Library links to ISO standards (release 4.181.0).
 *
 * An ISO link is only useful if the page it opens is the standard the entry names: in 4.180.1 two
 * entries opened a different standard (ISO/IEC 27005:2022 opened the page for ISO/IEC 15408-2:2022,
 * and ISO/IEC 7816-4:2020 opened the 2013 edition). The table below records, for every active
 * Library entry that links to an ISO standard page, the page address and the designation printed in
 * the title of that page (read on 25 October 2026). A new or changed ISO link must be added here
 * with the designation its page shows.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')

function latestLibraryRows(): Record<string, string>[] {
  const re = /^library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
  const newest = fs
    .readdirSync(DATA_DIR)
    .map((f) => {
      const m = f.match(re)
      return m ? { f, key: Number(m[3] + m[1] + m[2]) * 1000 + Number(m[4] ?? 0) } : null
    })
    .filter((c): c is { f: string; key: number } => c !== null)
    .sort((a, b) => b.key - a.key)[0]
  const raw = fs.readFileSync(path.join(DATA_DIR, newest.f), 'utf-8')
  return Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true }).data
}

/** [reference_id, page address, designation in the page title] */
const ISO_LINKS: [string, string, string][] = [
  ['ISO/IEC 14888-4:2024', 'https://www.iso.org/standard/80492.html', 'ISO/IEC 14888-4:2024'],
  ['ISO-18013-5-mDL', 'https://www.iso.org/standard/69084.html', 'ISO/IEC 18013-5:2021'],
  [
    'ISO/IEC 18033-2:2006/AMD1:2017',
    'https://www.iso.org/standard/71114.html',
    'ISO/IEC 18033-2:2006/Amd 1:2017',
  ],
  ['ISO/IEC 18033-2:2006', 'https://www.iso.org/standard/37971.html', 'ISO/IEC 18033-2:2006'],
  ['ISO-IEC-23837-1', 'https://www.iso.org/standard/77097.html', 'ISO/IEC 23837-1:2023'],
  ['ISO-IEC-23837-2', 'https://www.iso.org/standard/77309.html', 'ISO/IEC 23837-2:2023'],
  ['ISO-IEC-27001-2022', 'https://www.iso.org/standard/27001', 'ISO/IEC 27001:2022'],
  ['ISO-IEC-17799-2000', 'https://www.iso.org/standard/33441.html', 'ISO/IEC 17799:2000'],
  ['ISO-14971-2000', 'https://www.iso.org/standard/31550.html', 'ISO 14971:2000'],
  [
    'ISO-IEC-18033-2-2006-Amd-2-2026-Information-technology-Secur',
    'https://www.iso.org/standard/86890.html',
    'ISO/IEC 18033-2:2006/Amd 2:2026',
  ],
  [
    'ISO-IEC-11889-2015-Information-technology-Trusted-Platform-M',
    'https://www.iso.org/standard/66510.html',
    'ISO/IEC 11889-1:2015',
  ],
  [
    'ISO-IEC-27005-2022-Guidance-on-managing-information-security',
    'https://www.iso.org/standard/80585.html',
    'ISO/IEC 27005:2022',
  ],
  [
    'ISO-IEC-15408-1-2022-Evaluation-criteria-for-IT-security-Com',
    'https://www.iso.org/standard/72891.html',
    'ISO/IEC 15408-1:2022',
  ],
  [
    'ISO-IEC-19794-2-2011-Biometric-data-interchange-formats-Part',
    'https://www.iso.org/standard/50864.html',
    'ISO/IEC 19794-2:2011',
  ],
  [
    'ISO-IEC-20085-1-2019-Test-tool-requirements-and-test-tool-ca',
    'https://www.iso.org/standard/70081.html',
    'ISO/IEC 20085-1:2019',
  ],
  [
    'ISO-IEC-7816-4-2020-Identification-cards-Integrated-circuit',
    'https://www.iso.org/standard/77180.html',
    'ISO/IEC 7816-4:2020',
  ],
  [
    'Cards-and-security-devices-for-personal-identification-Conta',
    'https://www.iso.org/standard/73596.html',
    'ISO/IEC 14443-1:2018',
  ],
  [
    'Cards-and-security-devices-for-personal-identification-Conta-2',
    'https://www.iso.org/standard/73599.html',
    'ISO/IEC 14443-4:2018',
  ],
  [
    'ISO-10681-1-2010-Road-vehicles-Communication-on-FlexRay-Part',
    'https://www.iso.org/standard/46046.html',
    'ISO 10681-1:2010',
  ],
  [
    'ISO-11898-1-2024-Road-vehicles-Controller-area-network-CAN-P',
    'https://www.iso.org/standard/86384.html',
    'ISO 11898-1:2024',
  ],
  [
    'ISO-21448-2022-Road-vehicles-Safety-of-the-intended-function',
    'https://www.iso.org/standard/77490.html',
    'ISO 21448:2022',
  ],
  [
    'ISO-SAE-21434-2021-Road-vehicles-Cybersecurity-engineering',
    'https://www.iso.org/standard/70918.html',
    'ISO/SAE 21434:2021',
  ],
  [
    'Road-vehicles-Vehicle-to-grid-communication-interface-Part-1',
    'https://www.iso.org/standard/69113.html',
    'ISO 15118-1:2019',
  ],
  [
    'Road-vehicles-Vehicle-to-grid-communication-interface-Part-2',
    'https://www.iso.org/standard/77845.html',
    'ISO 15118-20:2022',
  ],
  [
    'ISO-8583-2023-Financial-transaction-card-originated-messages',
    'https://www.iso.org/standard/79451.html',
    'ISO 8583:2023',
  ],
  [
    'Codes-for-the-representation-of-names-of-countries-and-their',
    'https://www.iso.org/standard/72482.html',
    'ISO 3166-1:2020',
  ],
  [
    'ISO-31000-2018-Risk-management-Guidelines',
    'https://www.iso.org/standard/65694.html',
    'ISO 31000:2018',
  ],
  ['ISO-IEC-28033', 'https://www.iso.org/standard/87638.html', 'ISO/IEC DIS 28033-1'],
  ['ISO-IEC-19790-2025', 'https://www.iso.org/standard/82423.html', 'ISO/IEC 19790:2025'],
  [
    'ISO-IEC-24759-2025-Test-requirements-for-cryptographic-modul',
    'https://www.iso.org/standard/82424.html',
    'ISO/IEC 24759:2025',
  ],
]

const rows = latestLibraryRows()
const byId = new Map(rows.map((r) => [r.reference_id, r]))
const activeIsoRows = rows.filter(
  (r) => (r.status?.trim() || 'active') === 'active' && r.download_url.includes('iso.org/standard/')
)

describe('Library links to ISO standards', () => {
  it('records every active ISO link, and no other', () => {
    expect(activeIsoRows.map((r) => r.reference_id).sort()).toEqual(
      ISO_LINKS.map(([id]) => id).sort()
    )
  })

  it.each(ISO_LINKS)('%s opens %s (title shows %s)', (id, url) => {
    expect(byId.get(id)?.download_url).toBe(url)
  })

  it('ISO/IEC 27005:2022 no longer opens the ISO/IEC 15408-2:2022 page', () => {
    const row = byId.get('ISO-IEC-27005-2022-Guidance-on-managing-information-security')
    expect(row?.download_url).toBe('https://www.iso.org/standard/80585.html')
    expect(row?.download_url).not.toBe('https://www.iso.org/standard/72892.html')
  })

  it('ISO/IEC 7816-4:2020 no longer opens the 2013 edition', () => {
    const row = byId.get('ISO-IEC-7816-4-2020-Identification-cards-Integrated-circuit')
    expect(row?.download_url).toBe('https://www.iso.org/standard/77180.html')
    expect(row?.download_url).not.toBe('https://www.iso.org/standard/54550.html')
  })

  it('names the edition year in the designation when the entry names one', () => {
    for (const [id, , designation] of ISO_LINKS) {
      const title = byId.get(id)?.document_title ?? ''
      const m = title.match(/(\d{4,5}):(\d{4})/)
      // A multi-part standard (ISO/IEC 11889:2015) may open one of its parts (11889-1:2015).
      if (m) expect(designation.replace(/-\d+:/, ':')).toContain(`${m[1]}:${m[2]}`)
    }
  })
})

describe('PCI DSS Quick Reference Guide entry', () => {
  const row = byId.get('PCI-DSS-QRG')

  it('describes the version 3.0 guide it links to, not v4.0', () => {
    expect(row?.document_title).toContain('version 3.0')
    expect(row?.short_description).toContain('version 3.0')
    expect(row?.short_description).not.toContain('v4.0 ')
    expect(row?.document_status).toBe('Published (superseded)')
  })
})
