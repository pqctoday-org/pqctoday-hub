// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { threatsData, THREATS_FILE_RE } from './threatsData'
import { libraryData } from './libraryData'
import { CNSA_2_0, CNSA_2_0_BY_CLASS } from './regulatoryTimelines'
import { headStatement } from './openClaimsView'
import Papa from 'papaparse'
import { sortCSVFiles } from './csvUtils'
import { THREAT_RECORD_TYPES, parseThreatRecordType } from './threatRecordTypes'

describe('Threats accuracy guards', () => {
  it('keeps every published row in a governed educational record type', () => {
    expect(threatsData.length).toBeGreaterThan(0)
    for (const threat of threatsData) {
      expect(THREAT_RECORD_TYPES, threat.threatId).toContain(threat.recordType)
    }
  })

  it('gives every row of the newest threats file, whatever its status, a valid record_type', () => {
    const raw = import.meta.glob('./quantum_threats_hsm_industries_*.csv', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>
    const newest = sortCSVFiles(raw, THREATS_FILE_RE)[0]
    const { data } = Papa.parse<Record<string, string>>(newest.content.trim(), {
      header: true,
      skipEmptyLines: true,
    })
    expect(data.length).toBeGreaterThan(0)
    for (const row of data) {
      expect(THREAT_RECORD_TYPES, row.threat_id).toContain(row.record_type)
    }
  })

  it('refuses a row with a blank or unknown record_type', () => {
    expect(parseThreatRecordType('')).toBeNull()
    expect(parseThreatRecordType('Threat Scenario')).toBeNull()
    expect(parseThreatRecordType(null)).toBeNull()
    expect(parseThreatRecordType('threat scenario')).toBe('threat scenario')
  })

  it('gives every published source a review state and registered source identity', () => {
    for (const threat of threatsData) {
      expect(threat.sourceUrlQuality, threat.threatId).toMatch(
        /^(url_authoritative|url_needs_review|url_unverified)$/
      )
      expect(threat.trustedSourceIdStatus, threat.threatId).toBe('registered')
    }
  })

  it('uses the current CNSA 2.0 FAQ v2.2 milestones', () => {
    expect(CNSA_2_0.networkingRequired).toBe(2027)
    expect(CNSA_2_0.networkingExclusive).toBe(2031)
    expect(CNSA_2_0.fullEnforcement).toBe(2031)
    expect(CNSA_2_0_BY_CLASS.map((milestone) => milestone.year)).not.toContain(2033)
    expect(headStatement('crqc-nsa-cnsa2-dates')?.id).toBe('crqc-nsa-cnsa2-faq-v22-dates')
  })

  it('does not publish superseded 2033 CNSA dates in active threat records', () => {
    const currentCnsaRows = threatsData.filter((threat) => /CNSA 2\.0/i.test(threat.description))
    expect(currentCnsaRows.length).toBeGreaterThan(0)
    for (const threat of currentCnsaRows) {
      expect(threat.description, threat.threatId).not.toMatch(/\b2033\b/)
    }
  })

  it('keeps the published source manifest on the current CNSA 2.0 FAQ v2.2 milestones', () => {
    // The manifest ships to the site with each source's description; the CNSA rows
    // must not carry the superseded 2033 / category-schedule wording, must carry the
    // exception on the 2030 phase-out, and must read as text for readers.
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/threats/manifest.json'), 'utf-8')
    ) as { entries: { refId: string; label?: string }[] }
    const byId = new Map(
      manifest.entries.filter((entry) => entry.label).map((entry) => [entry.refId, entry.label])
    )
    for (const id of ['AERO-002', 'GOV-002', 'GOV-005']) {
      const label = byId.get(id)
      expect(label, id).toBeTruthy()
      expect(label, id).not.toMatch(/\b2033\b/)
      expect(label, id).toContain('1 January 2027')
      expect(label, id).toContain('31 December 2030 (exceptions possible)')
      expect(label, id).toContain('31 December 2031')
      expect(label, id).not.toMatch(/must not be presented|should not be presented/i)
    }
    expect(byId.get('GOV-005')).toContain('2035 NSM-10 goal is not a CNSA 2.0 date')
  })

  it('does not retain the known expired future-tense statements', () => {
    const textById = new Map(threatsData.map((threat) => [threat.threatId, threat.description]))
    expect(textById.get('IT-002')).not.toMatch(/will start accepting|late 2025 or in 2026/i)
    expect(textById.get('IT-003')).not.toMatch(/first validated modules expected/i)
    expect(textById.get('CRIT-001')).not.toMatch(/consultation through end-2025/i)
    expect(textById.get('CRYPTO-002')).not.toMatch(/Ethereum plans to use/i)
  })

  it('publishes only the official URL for the current CNSA FAQ library entry', () => {
    const serialized = JSON.stringify(libraryData)
    expect(serialized).toContain('NSA CNSA 2.0 FAQ')
    expect(serialized).toContain('CSI_CNSA_2.0_FAQ_.PDF')
    expect(serialized).not.toContain('CSI_CNSA_2.0__FAQ_v2.2.pdf')
  })
})
