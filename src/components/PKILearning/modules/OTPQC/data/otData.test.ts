// SPDX-License-Identifier: GPL-3.0-only
/**
 * Accuracy and behaviour guards for the OT module's data (plan findings
 * E1–E26 and I22 in iot-ot-split-plan-10012026.md).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { getAlgorithm } from '@/data/algorithmProperties'
import { OT_PROTOCOLS, realTimePathNeedsPqc, svSampleIntervalMicros } from './otProtocolData'
import { OT_ZONES, assessZone, defaultAssessments, rankZones } from './zoneConduitData'
import {
  DEFAULT_SUBSTATION,
  planSubstation,
  tripTimeClass,
  estimateZoneEffort,
  SUBSTATION_ZONES,
} from './substationData'
import { CONSEQUENCE_SCENARIOS, scoreScenario, defaultInputs } from './consequenceData'
import { DEFAULT_ROADMAP, roadmapSummary, milestonesFor, siteRolloutMonths } from './roadmapData'
import {
  hssSignatureBytes,
  lmsSignatureBytes,
  HSS_PUBLIC_KEY_BYTES,
  LMS_PUBLIC_KEY_BYTES,
  planSigning,
  getScheme,
} from './signingLabData'
import { NERC_CIP_STANDARDS, IEC_62351_PARTS, CNSA_2_0_CATEGORIES } from './regulationsData'
import { OT_PROTOCOL_KAT_SPECS } from '../workshop/ProtocolSecurityAnalyzer'
import { OT_SIGNING_KAT_SPECS } from '../workshop/FirmwareSigningLab'

const proto = (id: string) => OT_PROTOCOLS.find((p) => p.id === id)!

describe('OT protocol facts', () => {
  it('E1: no DLMS/COSEM layer uses RSA', () => {
    for (const l of proto('dlms-cosem').cryptoLayers) expect(l.mechanism).not.toMatch(/RSA/)
  })

  it('E6/E20: GOOSE and SV per-message auth is symmetric; keys come from GDOI, not RSA certificates', () => {
    for (const id of ['iec61850-goose', 'iec61850-sv']) {
      const p = proto(id)
      expect(realTimePathNeedsPqc(p)).toBe(false)
      const km = p.cryptoLayers.find((l) => /key management/i.test(l.layerName))!
      expect(km.mechanism).toMatch(/GDOI/)
      expect(km.mechanism).not.toMatch(/RSA-2048 certificate/)
    }
  })

  it('E10: DNP3 SAv5 default update-key change is symmetric; only the optional method is exposed', () => {
    const layers = proto('dnp3-sav5').cryptoLayers
    const def = layers.find((l) => /symmetric \(default\)/.test(l.layerName))!
    expect(def.threat).toBe('none')
    const exposed = layers.filter((l) => l.threat !== 'none')
    expect(exposed).toHaveLength(1)
    expect(exposed[0].layerName).toMatch(/optional/)
  })

  it('E11: nothing claims SAv6 exists or is KAT-tested', () => {
    const all = JSON.stringify(OT_PROTOCOLS) + JSON.stringify(OT_PROTOCOL_KAT_SPECS)
    expect(all).not.toMatch(/SAv6 (KAT|frame|auth)/)
    expect(proto('dnp3-sav5').standardStatus).toContain('"SAv6" has not been published')
  })

  it('E21: PTP security is IEEE 1588-2019 Annex P, not NTS', () => {
    expect(proto('ptp-1588').standard).toMatch(/Annex P/)
    const ts = SUBSTATION_ZONES.find((z) => z.id === 'time-sync')!
    expect(ts.currentCrypto).not.toMatch(/NTS/)
  })

  it('E12: IEEE 2030.5 device certificates chain to SERCA via a manufacturer CA', () => {
    expect(JSON.stringify(proto('ieee-2030-5'))).toMatch(/SERCA/)
    expect(JSON.stringify(proto('ieee-2030-5'))).not.toMatch(/issued by utility CA/)
  })

  it('covers the protocols the plan adds (OPC UA, CIP Security, PROFINET, IEC 104, BACnet/SC)', () => {
    for (const id of ['opc-ua', 'cip-security', 'profinet-security', 'iec60870-5-104', 'bacnet-sc'])
      expect(proto(id)).toBeDefined()
  })

  it('E5: SV rates 4,000 / 4,800 / 14,400 per IEC 61869-9 give 250 / 208 / 69 µs', () => {
    expect([4000, 4800, 14400].map(svSampleIntervalMicros)).toEqual([250, 208, 69])
    expect(proto('iec61850-sv').timingRequirement).toBe(
      '4,000 / 4,800 / 14,400 samples/s (IEC 61869-9): 250 / 208 / 69 µs apart'
    )
  })

  it('E4: GOOSE type 1A trip budget is TT6, 3 ms or less', () => {
    expect(proto('iec61850-goose').timingRequirement).toMatch(/TT6, 3 ms or less/)
    expect(proto('iec61850-goose').timingRequirement).not.toMatch(/P1|P2|P3/)
    expect(tripTimeClass()).toEqual({ perfClass: 'TT6 trip ≤3 ms', budgetMs: 3 })
  })

  it('every public-key size delta comes from the algorithm registry', () => {
    const allowed = new Set([
      32,
      33,
      getAlgorithm('ML-KEM-768').signatureOrCiphertextBytes,
      getAlgorithm('ML-DSA-44').signatureOrCiphertextBytes,
      getAlgorithm('ML-DSA-65').signatureOrCiphertextBytes,
      getAlgorithm('ECDSA P-256').signatureOrCiphertextBytes,
      getAlgorithm('ECDSA P-384').signatureOrCiphertextBytes,
      getAlgorithm('RSA-2048').signatureOrCiphertextBytes,
    ])
    for (const p of OT_PROTOCOLS)
      for (const l of p.cryptoLayers) {
        if (l.classicalBytes !== undefined) expect(allowed.has(l.classicalBytes)).toBe(true)
        if (l.pqcBytes !== undefined) expect(allowed.has(l.pqcBytes)).toBe(true)
      }
  })
})

describe('KAT labels (plan §4b)', () => {
  it('name the vector source, never a regulation, SAv6 or GOOSE ML-DSA', () => {
    for (const s of [...OT_PROTOCOL_KAT_SPECS, ...OT_SIGNING_KAT_SPECS]) {
      const text = `${s.useCase} ${s.standard}`
      expect(text).not.toMatch(/NERC|IEC 62443|SAv6|GOOSE ML-DSA/)
      expect(s.standard).toMatch(/NIST ACVP|RFC 3394|RFC 8554/)
    }
  })
  it('use only registered kinds: hmac-verify SHA-256, aeskw-wrap, mldsa-sigver, lms-sigver', () => {
    const kinds = [...OT_PROTOCOL_KAT_SPECS, ...OT_SIGNING_KAT_SPECS].map((s) => s.kind.type)
    expect(new Set(kinds)).toEqual(
      new Set(['hmac-verify', 'aeskw-wrap', 'mldsa-sigver', 'lms-sigver'])
    )
  })
})

describe('Zone & Conduit Planner (I22)', () => {
  it('Level 0–1 and the SIS are not "low": forgery puts them above the enterprise zone', () => {
    const ranked = rankZones(defaultAssessments())
    const pos = (id: string) => ranked.findIndex((a) => a.zone.id === id)
    expect(pos('control')).toBeLessThan(pos('enterprise'))
    expect(pos('sis')).toBeLessThan(pos('enterprise'))
    expect(pos('process')).toBeLessThan(pos('enterprise'))
    expect(ranked.find((a) => a.zone.id === 'control')!.driver).toBe('forgery')
  })
  it('an unauthenticated zone is a present-day gap, not scored as quantum risk', () => {
    const a = assessZone(
      OT_ZONES.find((z) => z.id === 'control')!,
      'none',
      'none'
    )
    expect(a.forgery).toBe(0)
    expect(a.todayGaps).toEqual(['unauthenticated', 'plaintext'])
  })
  it('PQC signatures remove the forgery score', () => {
    expect(
      assessZone(
        OT_ZONES.find((z) => z.id === 'control')!,
        'pqc'
      ).forgery
    ).toBe(0)
  })
})

describe('Substation Planner (E23/E24)', () => {
  it('process bus (symmetric GOOSE) ranks below the station bus for any profile', () => {
    for (const nercCipImpact of ['high', 'medium', 'low', 'not-applicable'] as const)
      for (const connectivity of ['fiber', 'cellular', 'serial', 'air-gapped'] as const) {
        const r = planSubstation({ ...DEFAULT_SUBSTATION, nercCipImpact, connectivity })
        const pos = (id: string) => r.findIndex((z) => z.zone.id === id)
        expect(pos('process-bus')).toBeGreaterThan(pos('station-bus'))
      }
  })
  it('gooseGroups and mmsConnections change effort (no dead inputs)', () => {
    const pb = SUBSTATION_ZONES.find((z) => z.id === 'process-bus')!
    const sb = SUBSTATION_ZONES.find((z) => z.id === 'station-bus')!
    expect(estimateZoneEffort(pb, { ...DEFAULT_SUBSTATION, gooseGroups: 20 })).toBeGreaterThan(
      estimateZoneEffort(pb, DEFAULT_SUBSTATION)
    )
    expect(estimateZoneEffort(sb, { ...DEFAULT_SUBSTATION, mmsConnections: 60 })).toBeGreaterThan(
      estimateZoneEffort(sb, DEFAULT_SUBSTATION)
    )
  })
})

describe('Safety & Consequence Scorer', () => {
  it('no "minutes with CRQC" claims remain', () => {
    expect(JSON.stringify(CONSEQUENCE_SCENARIOS)).not.toMatch(
      /Minutes \(with CRQC\)|Hours \(with CRQC\)/
    )
  })
  it('PQC firmware and commands drive the score to zero', () => {
    for (const s of CONSEQUENCE_SCENARIOS) {
      const r = scoreScenario(s, {
        ...defaultInputs(s),
        commandAuth: 'pqc',
        firmwareSigning: 'pqc',
      })
      expect(r.compound).toBe(0)
    }
  })
  it('covers all five OT sectors', () => {
    expect(new Set(CONSEQUENCE_SCENARIOS.map((s) => s.sector))).toEqual(
      new Set(['energy', 'water', 'rail', 'manufacturing', 'building'])
    )
  })
})

describe('Sector Roadmap (E24: every input is live)', () => {
  const base = roadmapSummary(DEFAULT_ROADMAP)
  it('siteCount, orgSize and budget change the duration', () => {
    expect(roadmapSummary({ ...DEFAULT_ROADMAP, siteCount: 400 }).totalMonths).toBeGreaterThan(
      base.totalMonths
    )
    expect(siteRolloutMonths({ ...DEFAULT_ROADMAP, orgSize: 'large' })).toBeLessThan(
      siteRolloutMonths(DEFAULT_ROADMAP)
    )
    expect(
      roadmapSummary({ ...DEFAULT_ROADMAP, budget: 'constrained' }).totalMonths
    ).toBeGreaterThan(base.totalMonths)
  })
  it('planningYear flags late phases', () => {
    expect(roadmapSummary({ ...DEFAULT_ROADMAP, planningYear: 2029 }).lateCount).toBeGreaterThan(0)
    expect(base.lateCount).toBe(0)
  })
  it('jurisdiction and sector change the milestones', () => {
    const us = milestonesFor(DEFAULT_ROADMAP).map((m) => m.regime)
    expect(us).toContain('NERC CIP')
    expect(
      milestonesFor({ ...DEFAULT_ROADMAP, sector: 'water' }).map((m) => m.regime)
    ).not.toContain('NERC CIP')
    expect(
      milestonesFor({ ...DEFAULT_ROADMAP, jurisdiction: 'eu' }).map((m) => m.regime)
    ).toContain('EU NIS-CG roadmap')
    expect(milestonesFor({ ...DEFAULT_ROADMAP, jurisdiction: 'other' })).toEqual([])
  })
  it('sector changes the assets named in each phase', () => {
    const water = roadmapSummary({ ...DEFAULT_ROADMAP, sector: 'water' })
    expect(water.phases[0].assets).not.toEqual(base.phases[0].assets)
  })
})

describe('Firmware & Project Signing Lab sizes', () => {
  it('LMS/HSS formulas match RFC 8554 and the algorithm registry (H20/W8)', () => {
    expect(LMS_PUBLIC_KEY_BYTES).toBe(56)
    expect(lmsSignatureBytes(20, 8)).toBe(1772)
    expect(hssSignatureBytes(1, 20, 8)).toBe(1776)
    const reg = getAlgorithm('LMS-SHA256 (H20/W8)')
    expect(hssSignatureBytes(1, 20, 8)).toBe(reg.signatureOrCiphertextBytes)
    expect(HSS_PUBLIC_KEY_BYTES).toBe(reg.publicKeyBytes)
  })
  it('ML-DSA sizes come from FIPS 204 via the registry', () => {
    expect(getScheme('ml-dsa-87').signatureBytes).toBe(4627)
    expect(getScheme('ml-dsa-65').signatureBytes).toBe(3309)
  })
  it('stateless schemes never exhaust; LMS is KAT-checked, XMSS labelled simulated', () => {
    expect(
      planSigning({
        scheme: 'ml-dsa-87',
        use: 'project',
        signaturesPerYear: 20000,
        statePartitions: 4,
        serviceYears: 40,
      }).yearsToExhaustion
    ).toBe(Infinity)
    expect(getScheme('lms-h20-w8').validation).toBe('rfc8554-kat')
    expect(getScheme('xmss-h20').validation).toBe('simulated')
    expect(getScheme('ml-dsa-87').validation).toBe('acvp-kat')
  })
})

describe('Regulations (E2/E3/E7/E13–E16)', () => {
  it('firmware integrity is CIP-010-4 R1.6; CIP-012-2 is technology-neutral', () => {
    expect(NERC_CIP_STANDARDS.find((s) => s.id === 'CIP-010-4')!.scope).toMatch(/R1\.6/)
    const c12 = NERC_CIP_STANDARDS.find((s) => s.id === 'CIP-012-2')!
    expect(c12.scope).toMatch(/availability/)
    expect(c12.pqcRelevance).toMatch(/not a mandate/)
    expect(JSON.stringify(NERC_CIP_STANDARDS)).not.toMatch(/CSMS|grid operator/i)
  })
  it('IEC 62351 part scopes: 5 = IEC 60870-5/DNP3, 6 = IEC 61850, 8 = RBAC; Part 14 is exposed', () => {
    const p = (n: number) => IEC_62351_PARTS.find((x) => x.part === n)!
    expect(p(5).scope).toMatch(/60870-5.*DNP3/)
    expect(p(6).title).toMatch(/61850/)
    expect(p(8).title).toMatch(/Role-based/)
    expect(p(14).quantumExposure).toMatch(/HNDL/)
  })
  it('CNSA 2.0 per-category dates', () => {
    const c = (s: string) => CNSA_2_0_CATEGORIES.find((x) => x.category.startsWith(s))!
    expect([c('Software').prefer, c('Software').exclusive]).toEqual([2025, 2030])
    expect([c('Traditional').prefer, c('Traditional').exclusive]).toEqual([2026, 2030])
    expect([c('Operating').prefer, c('Operating').exclusive]).toEqual([2027, 2033])
    expect(c('All').exclusive).toBe(2035)
  })
})

describe('Module text does not regress to the old wrong claims', () => {
  const dir = path.resolve(__dirname, '..')
  const files = [
    'rag-summary.md',
    'curious-summary.md',
    'content.ts',
    'components/OTPQCIntroduction.tsx',
    'components/OTPQCExercises.tsx',
  ]
  const text = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  it.each([
    [/hybrid by 2026/i, 'E2'],
    [/PQC-only by 2033/i, 'E2'],
    [/acceptable[^.]*through 2030/i, 'E3'],
    [/4 ?ms[^.]*P2/i, 'E4'],
    [/80 samples\/cycle/i, 'E5'],
    [/RSA-2048 certificate/i, 'E6'],
    [/Part 5[^.]*GOOSE/i, 'E7'],
    [/TC57 WG15/i, 'E8'],
    [/Annex SC/i, 'E11'],
    [/CIP-007[^.]*firmware/i, 'E13'],
    [/CIP-012[^.]*mandates encryption/i, 'E14'],
    [/arXiv[^.]*1512\.07004/i, 'GOOSE timing source'],
  ])('%s is absent (%s)', (re) => {
    expect(text).not.toMatch(re)
  })
})
