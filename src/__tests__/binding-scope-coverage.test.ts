// SPDX-License-Identifier: GPL-3.0-only
/**
 * Every framework marked "binding for its scope" says who it binds.
 *
 * `mandatory_for_scope` means a framework binds only the systems or
 * organisations its own text names. The Report and the Compliance page quote
 * that phrase (`binding_scope`), so a reader can check whether they are covered.
 * A scoped row without it reads as a bare "Binding for its scope", which tells a
 * board nothing. A row may wait only while its wording is under review, and it
 * must then be listed below with the reason. Once a pending row gets its
 * wording, or stops being scoped, its entry must go, so the list never hides a
 * gap.
 *
 * Reads the LATEST dated compliance file, the one the build ships.
 * Run locally: `npx vitest run src/__tests__/binding-scope-coverage.test.ts`
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

const DATA = path.join(process.cwd(), 'src/data')

/** Rows whose who-it-binds wording is still under review, with the reason. */
const PENDING: Record<string, string> = {}

/**
 * Binding or scoped rows whose basis (the citation shown next to the binding label)
 * is approved but not yet in the data, with the reason. Entries go as the data lands.
 */
const PENDING_BASIS: Record<string, string> = {
  'PCI-DSS': 'basis proposed and approved; waiting for the next data pass',
  'UN-ECE-WP29': 'basis proposed and approved; waiting for the next data pass',
  'DISA-STIG': 'basis proposed and approved; waiting for the next data pass',
  'BRAZIL-BACEN-4893': 'basis proposed and approved; waiting for the next data pass',
  'E-ITS-ESTONIAN-INFORMATION-SEC':
    'classified with the basis only in the decision note; evidence replaced since, so the basis is being re-checked',
}

/** Latest compliance_MMDDYYYY[_rN].csv, by date and then revision. */
function latestCompliance(): string {
  const key = (f: string) => {
    const m = f.match(/^compliance_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
    return m ? `${m[3]}${m[1]}${m[2]}-${(m[4] ?? '0').padStart(3, '0')}` : ''
  }
  const files = fs
    .readdirSync(DATA)
    .filter((f) => key(f) !== '')
    .sort((a, b) => key(a).localeCompare(key(b)))
  if (files.length === 0) throw new Error(`no compliance_*.csv in ${DATA}`)
  return path.join(DATA, files[files.length - 1])
}

type Row = Record<string, string | undefined>
const file = latestCompliance()
const { data, meta } = Papa.parse<Row>(fs.readFileSync(file, 'utf-8'), {
  header: true,
  skipEmptyLines: true,
})
const active = data.filter((r) => (r.status ?? '').trim() !== 'deprecated')
const scoped = active.filter((r) => (r.binding_status ?? '').trim() === 'mandatory_for_scope')
const hasScope = (r: Row) => (r.binding_scope ?? '').trim() !== ''

describe(`binding scope coverage (${path.basename(file)})`, () => {
  it('the compliance file carries the binding_scope column', () => {
    expect(meta.fields).toContain('binding_scope')
    expect(scoped.length).toBeGreaterThan(50)
  })

  it('every scoped framework says who it binds, or is pending review with a reason', () => {
    const missing = scoped.filter((r) => !hasScope(r) && !(r.id! in PENDING)).map((r) => r.id)
    expect(missing).toEqual([])
  })

  it('the pending list holds only rows that still need wording', () => {
    const byId = new Map(active.map((r) => [r.id, r]))
    const stale = Object.keys(PENDING).filter((id) => {
      const r = byId.get(id)
      return !r || hasScope(r) || (r.binding_status ?? '').trim() !== 'mandatory_for_scope'
    })
    expect(stale).toEqual([])
  })

  it('every binding or scoped framework names its basis, or is pending with a reason', () => {
    const binding = active.filter((r) =>
      ['binding', 'mandatory_for_scope'].includes((r.binding_status ?? '').trim())
    )
    const missing = binding
      .filter((r) => (r.binding_basis ?? '').trim() === '' && !(r.id! in PENDING_BASIS))
      .map((r) => r.id)
    expect(missing).toEqual([])
  })

  it('the pending-basis list holds only rows that still lack a basis', () => {
    const byId = new Map(active.map((r) => [r.id, r]))
    const stale = Object.keys(PENDING_BASIS).filter((id) => {
      const r = byId.get(id)
      return (
        !r ||
        (r.binding_basis ?? '').trim() !== '' ||
        !['binding', 'mandatory_for_scope'].includes((r.binding_status ?? '').trim())
      )
    })
    expect(stale).toEqual([])
  })

  it('an English gloss is never shown without the original wording', () => {
    const orphans = active
      .filter((r) => (r.binding_scope_en ?? '').trim() !== '' && !hasScope(r))
      .map((r) => r.id)
    expect(orphans).toEqual([])
  })
})
