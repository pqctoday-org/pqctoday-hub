// SPDX-License-Identifier: GPL-3.0-only
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
    coverage: 'MC/DC + 100% structural',
    description:
      'Failure could cause or contribute to a catastrophic failure condition for the aircraft. Requires Modified Condition/Decision Coverage (MC/DC) testing and formal methods verification.',
  },
  B: {
    name: 'Hazardous',
    coverage: 'Decision coverage + 100% statement',
    description:
      'Failure could cause a large reduction in safety margins or physical distress to passengers. Requires decision coverage testing.',
  },
  C: {
    name: 'Major',
    coverage: 'Statement coverage',
    description:
      'Failure could cause a significant reduction in safety margins or increase crew workload. Requires statement coverage testing.',
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
    standard: 'AC 20-175A',
    framework: 'DO-326A / DO-356A',
    status: 'Mandated since 2021',
    notes:
      'Advisory Circular requires DO-326A security assessment for all new Type Certificates and major STCs.',
  },
  {
    id: 'easa',
    name: 'EASA',
    country: 'European Union',
    standard: 'AMC 20-42',
    framework: 'ED-202A / ED-203A',
    status: 'Mandated since 2022',
    notes:
      'Acceptable Means of Compliance for airborne security. ED-202A is the European equivalent of DO-326A.',
  },
  {
    id: 'tcca',
    name: 'TCCA',
    country: 'Canada',
    standard: 'Advisory Circular 500-025',
    framework: 'DO-326A (adopted)',
    status: 'Recommended',
    notes: 'TCCA accepts FAA/EASA security assessments via bilateral agreements.',
  },
  {
    id: 'anac',
    name: 'ANAC',
    country: 'Brazil',
    standard: 'RBAC-E 94 Subpart A',
    framework: 'DO-326A (adopted)',
    status: 'Recommended',
    notes:
      'ANAC aligns with FAA/EASA standards. Embraer aircraft follow DO-326A for export markets.',
  },
]
