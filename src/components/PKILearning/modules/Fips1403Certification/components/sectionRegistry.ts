// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Learn-section registry for LM-067: manifest section id → owner component.
 * The shared CertIntroduction (LM-065) renders from this; the parity test pins
 * that it covers exactly the manifest's sections.
 */
import type { SectionEntry } from '@/components/PKILearning/modules/CryptoProductCertification/components/sectionRegistry'
import {
  FipsWhatItIs,
  FipsRequirementAreas,
  FipsLevels,
  FipsLifecycle,
  FipsAcvpBridge,
  FipsAutomation,
  FipsLandscape,
  FipsRouteTable,
} from './sections/FipsSections'

export const SECTION_COMPONENTS: ReadonlyMap<string, SectionEntry> = new Map<string, SectionEntry>([
  ['fips-what-it-is', { Component: FipsWhatItIs, group: 'fips' }],
  ['fips-requirement-areas', { Component: FipsRequirementAreas, group: 'fips' }],
  ['fips-levels', { Component: FipsLevels, group: 'fips' }],
  ['fips-lifecycle', { Component: FipsLifecycle, group: 'fips' }],
  ['fips-acvp-bridge', { Component: FipsAcvpBridge, group: 'fips' }],
  ['fips-automation', { Component: FipsAutomation, group: 'fips' }],
  ['fips-landscape', { Component: FipsLandscape, group: 'fips' }],
  ['fips-route-table', { Component: FipsRouteTable, group: 'fips' }],
])
