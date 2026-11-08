// SPDX-License-Identifier: AGPL-3.0-only
import type { AvionicsSystem, DALevel } from './aerospaceConstants'

export const AVIONICS_SYSTEMS: AvionicsSystem[] = [
  {
    id: 'fms',
    name: 'Flight Management System',
    acronym: 'FMS',
    description:
      'Primary navigation and flight planning computer. Computes optimal routes, fuel burn, and performance. Receives position data and communicates with ATC.',
    dalLevel: 'A',
    typicalProcessor: 'PowerPC 750 / ARM Cortex-A53',
    ramMB: 512,
    busType: 'ARINC 664 / ARINC 429',
    currentCrypto: 'RSA-2048 (nav database authentication)',
    safetyCritical: true,
    certCostRetrofitUsd: [5_000_000, 10_000_000],
    certCostCleanSheetUsd: [2_000_000, 4_000_000],
    certMonthsRetrofit: [18, 24],
    certMonthsCleanSheet: [12, 18],
    mcdcExplosionPct: 40,
    do254Required: false,
    linesOfCodeEstimate: 500_000,
  },
  {
    id: 'tcas',
    name: 'Traffic Collision Avoidance System',
    acronym: 'TCAS',
    description:
      'Interrogates nearby transponders to prevent mid-air collisions. Issues Resolution Advisories (RAs) that override ATC instructions.',
    dalLevel: 'A',
    typicalProcessor: 'Custom ASIC + DSP',
    ramMB: 64,
    busType: 'ARINC 429',
    currentCrypto: 'None (Mode S transponder, unauthenticated)',
    safetyCritical: true,
    certCostRetrofitUsd: [8_000_000, 15_000_000],
    certCostCleanSheetUsd: [3_000_000, 6_000_000],
    certMonthsRetrofit: [24, 36],
    certMonthsCleanSheet: [18, 24],
    mcdcExplosionPct: 55,
    do254Required: true,
    linesOfCodeEstimate: 200_000,
  },
  {
    id: 'egpws',
    name: 'Enhanced Ground Proximity Warning',
    acronym: 'EGPWS',
    description:
      'Terrain awareness and warning system. Compares GPS position against terrain database to prevent controlled flight into terrain (CFIT).',
    dalLevel: 'A',
    typicalProcessor: 'ARM Cortex-R5',
    ramMB: 128,
    busType: 'ARINC 429 / ARINC 664',
    currentCrypto: 'None (terrain DB signed with RSA)',
    safetyCritical: true,
    certCostRetrofitUsd: [4_000_000, 8_000_000],
    certCostCleanSheetUsd: [2_000_000, 4_000_000],
    certMonthsRetrofit: [18, 24],
    certMonthsCleanSheet: [12, 18],
    mcdcExplosionPct: 35,
    do254Required: false,
    linesOfCodeEstimate: 300_000,
  },
  {
    id: 'ife',
    name: 'In-Flight Entertainment',
    acronym: 'IFE',
    description:
      'Passenger entertainment and connectivity system. Not safety-critical but handles passenger payment data and Wi-Fi. Isolated from flight-critical networks.',
    dalLevel: 'E',
    typicalProcessor: 'x86 / ARM Cortex-A',
    ramMB: 4096,
    busType: 'Ethernet / WiFi',
    currentCrypto: 'TLS 1.2/1.3 (passenger Wi-Fi)',
    safetyCritical: false,
    certCostRetrofitUsd: [200_000, 500_000],
    certCostCleanSheetUsd: [100_000, 200_000],
    certMonthsRetrofit: [3, 6],
    certMonthsCleanSheet: [2, 4],
    mcdcExplosionPct: 0,
    do254Required: false,
    linesOfCodeEstimate: 1_000_000,
  },
  {
    id: 'efb',
    name: 'Electronic Flight Bag',
    acronym: 'EFB',
    description:
      'Pilot tablet/laptop for charts, performance calculations, and operational data. Class 2/3 EFBs mounted in cockpit require DO-178C certification.',
    dalLevel: 'C',
    typicalProcessor: 'ARM Cortex-A (iPad/tablet SoC)',
    ramMB: 4096,
    busType: 'Wi-Fi / Ethernet / USB',
    currentCrypto: 'TLS 1.2 (chart downloads), Code signing (app updates)',
    safetyCritical: false,
    certCostRetrofitUsd: [500_000, 1_000_000],
    certCostCleanSheetUsd: [200_000, 500_000],
    certMonthsRetrofit: [6, 12],
    certMonthsCleanSheet: [4, 8],
    mcdcExplosionPct: 10,
    do254Required: false,
    linesOfCodeEstimate: 200_000,
  },
  {
    id: 'autopilot',
    name: 'Autopilot / Flight Control Computer',
    acronym: 'FCC',
    description:
      'Controls aircraft flight surfaces (ailerons, elevator, rudder) based on pilot inputs and FMS commands. Triple-redundant in modern aircraft.',
    dalLevel: 'A',
    typicalProcessor: 'Custom ASIC / DSP + ARM Cortex-R',
    ramMB: 32,
    busType: 'ARINC 429 / ARINC 664',
    currentCrypto: 'None (hardwired inputs)',
    safetyCritical: true,
    certCostRetrofitUsd: [10_000_000, 20_000_000],
    certCostCleanSheetUsd: [4_000_000, 8_000_000],
    certMonthsRetrofit: [24, 36],
    certMonthsCleanSheet: [18, 24],
    mcdcExplosionPct: 60,
    do254Required: true,
    linesOfCodeEstimate: 150_000,
  },
  {
    id: 'satcom-terminal',
    name: 'SATCOM Terminal',
    acronym: 'SATCOM',
    description:
      'Satellite communication modem for voice, ACARS, CPDLC, and passenger connectivity. Interfaces with Inmarsat, Iridium, or Ku/Ka-band providers.',
    dalLevel: 'B',
    typicalProcessor: 'ARM Cortex-A / DSP',
    ramMB: 256,
    busType: 'ARINC 664 / Ethernet',
    currentCrypto: 'AES-256 (link encryption), RSA-2048 (auth)',
    safetyCritical: true,
    certCostRetrofitUsd: [2_000_000, 5_000_000],
    certCostCleanSheetUsd: [1_000_000, 2_500_000],
    certMonthsRetrofit: [12, 18],
    certMonthsCleanSheet: [8, 12],
    mcdcExplosionPct: 25,
    do254Required: false,
    linesOfCodeEstimate: 400_000,
  },
]

/** DAL descriptions for the certification analyzer */
export const DAL_DESCRIPTIONS: Record<
  DALevel,
  { name: string; coverage: string; description: string }
> = {
  A: {
    name: 'Catastrophic',
    coverage: 'MC/DC + decision + statement',
    description:
      'Failure could cause or contribute to a catastrophic failure condition for the aircraft. Structural coverage analysis must show that all statements, all decisions and all conditions (Modified Condition/Decision Coverage, MC/DC) were exercised. Formal methods are an optional technique, not a stated requirement of this level: when an applicant uses them, the DO-333/ED-216 supplement applies in addition to DO-178C/ED-12C.',
  },
  B: {
    name: 'Hazardous',
    coverage: 'Decision coverage + 100% statement',
    description:
      'Failure could cause a large reduction in safety margins or physical distress to passengers. Structural coverage analysis must show that all statements and all decisions were exercised.',
  },
  C: {
    name: 'Major',
    coverage: 'Statement coverage',
    description:
      'Failure could cause a significant reduction in safety margins or increase crew workload. Structural coverage analysis must show that all statements were exercised.',
  },
  D: {
    name: 'Minor',
    coverage: 'Review + analysis',
    description:
      'Failure could cause slight reduction in safety margins or slight increase in crew workload. Requires review and analysis only.',
  },
  E: {
    name: 'No Effect',
    coverage: 'None required',
    description:
      'Failure has no effect on aircraft safety or crew workload. No DO-178C structural coverage requirements.',
  },
}

/** Certification authority comparison */
export const CERTIFICATION_AUTHORITIES = [
  {
    id: 'faa',
    name: 'FAA',
    country: 'United States',
    standard: 'Project-specific special conditions',
    framework: 'DO-326 / DO-355 / DO-356',
    status: 'Proposed rule published 21 Aug 2024',
    notes:
      'In its 21 August 2024 notice of proposed rulemaking (Federal Register), the FAA described addressing aircraft cybersecurity through project-specific special conditions and proposed adding aircraft cybersecurity requirements to 14 CFR parts 25, 33 and 35. RTCA DO-326, DO-355 and DO-356 are the industry guidance that applicants have wanted to use as a method of compliance. As of 29 October 2026 the Federal Register lists no final rule in docket FAA-2024-1398.',
  },
  {
    id: 'easa',
    name: 'EASA',
    country: 'European Union',
    standard: 'AMC 20-42',
    framework: 'ED-202A / ED-203A / ED-204',
    status: 'Accepted means of compliance',
    notes:
      'AMC 20-42 (ED Decision 2020/006/R) recognises ED-202A, ED-203A and ED-204 as acceptable means of compliance for airworthiness information security risk assessment. Compliance with the AMC is not mandatory: an applicant may use an alternative means of compliance that EASA accepts. ED-202A is the European equivalent of DO-326A.',
  },
  {
    id: 'tcca',
    name: 'TCCA',
    country: 'Canada',
    standard: 'Not verified here',
    framework: 'No mapping stated',
    status: 'Not verified here',
    notes:
      'This lesson states no Transport Canada Civil Aviation (TCCA) airworthiness-security requirement. The 500-series (airworthiness) advisory circulars on Transport Canada\u2019s published list, read on 5 November 2026, include none on aircraft cybersecurity. Check TCCA directly, and any validation arrangement with the FAA or EASA, for your project.',
  },
  {
    id: 'anac',
    name: 'ANAC',
    country: 'Brazil',
    standard: 'Not verified here',
    framework: 'No mapping stated',
    status: 'Not verified here',
    notes:
      'This lesson states no ANAC airworthiness-security mapping. RBAC-E 94 is ANAC\u2019s rule for civil unmanned aircraft (\u201cRequisitos gerais para aeronaves n\u00e3o tripuladas de uso civil\u201d), so it is not a general airworthiness-security standard. Check ANAC\u2019s current airworthiness regulations for your project.',
  },
]
