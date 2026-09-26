// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Learn-section registry: manifest section id → the owner's body component
 * (build spec §4). CertIntroduction renders from this; the parity test pins
 * that it covers exactly the manifest's sections.
 */
import type { FC } from 'react'
import { FourQuestions, ScopeBeforeLevel } from './sections/CoreSections'
import {
  FipsWhatItIs,
  FipsRequirementAreas,
  FipsLevels,
  FipsLifecycle,
  FipsAcvpBridge,
  FipsLandscape,
  FipsRouteTable,
} from './sections/FipsSections'
import {
  CcModel,
  CcEalDecoding,
  CcLifecycle,
  CcContinuity,
  EuccScheme,
  EidasChain,
  PpEn4192215,
  PpSecurityIc,
  EuccPqcToday,
} from './sections/CcEuSections'
import {
  PciPtsApproval,
  PciV5Changes,
  PciPqcTruth,
  PciOperatingStack,
  PciPinSecurity,
  PciP2peKif,
  PciKmo,
} from './sections/PciSections'
import {
  PqcImpact,
  AgilityLatency,
  TransitionDeadlines,
  ChangeRoutesDetail,
  ElectronicExchange,
} from './sections/SharedSections'

/** Learner-facing v1 label (build spec §6.9, plan r2 §2.2). Shown once, at the top. */
export const PRACTITIONER_DISCLAIMER =
  'Practitioner orientation — not laboratory training. Not yet reviewed by an accredited lab or certification body.'

export type SectionGroup = 'core' | 'fips' | 'cc-eu' | 'pci' | 'shared'

export interface SectionEntry {
  Component: FC
  group: SectionGroup
}

export const SECTION_COMPONENTS: ReadonlyMap<string, SectionEntry> = new Map<string, SectionEntry>([
  ['four-questions', { Component: FourQuestions, group: 'core' }],
  ['scope-before-level', { Component: ScopeBeforeLevel, group: 'core' }],
  ['fips-what-it-is', { Component: FipsWhatItIs, group: 'fips' }],
  ['fips-requirement-areas', { Component: FipsRequirementAreas, group: 'fips' }],
  ['fips-levels', { Component: FipsLevels, group: 'fips' }],
  ['fips-lifecycle', { Component: FipsLifecycle, group: 'fips' }],
  ['fips-acvp-bridge', { Component: FipsAcvpBridge, group: 'fips' }],
  ['fips-landscape', { Component: FipsLandscape, group: 'fips' }],
  ['fips-route-table', { Component: FipsRouteTable, group: 'fips' }],
  ['cc-model', { Component: CcModel, group: 'cc-eu' }],
  ['cc-eal-decoding', { Component: CcEalDecoding, group: 'cc-eu' }],
  ['cc-lifecycle', { Component: CcLifecycle, group: 'cc-eu' }],
  ['cc-continuity', { Component: CcContinuity, group: 'cc-eu' }],
  ['eucc-scheme', { Component: EuccScheme, group: 'cc-eu' }],
  ['eidas-chain', { Component: EidasChain, group: 'cc-eu' }],
  ['pp-en419221-5', { Component: PpEn4192215, group: 'cc-eu' }],
  ['pp-security-ic', { Component: PpSecurityIc, group: 'cc-eu' }],
  ['eucc-pqc-today', { Component: EuccPqcToday, group: 'cc-eu' }],
  ['pci-pts-approval', { Component: PciPtsApproval, group: 'pci' }],
  ['pci-v5-changes', { Component: PciV5Changes, group: 'pci' }],
  ['pci-pqc-truth', { Component: PciPqcTruth, group: 'pci' }],
  ['pci-operating-stack', { Component: PciOperatingStack, group: 'pci' }],
  ['pci-pin-security', { Component: PciPinSecurity, group: 'pci' }],
  ['pci-p2pe-kif', { Component: PciP2peKif, group: 'pci' }],
  ['pci-kmo', { Component: PciKmo, group: 'pci' }],
  ['pqc-impact', { Component: PqcImpact, group: 'shared' }],
  ['agility-latency', { Component: AgilityLatency, group: 'shared' }],
  ['transition-deadlines', { Component: TransitionDeadlines, group: 'shared' }],
  ['change-routes-detail', { Component: ChangeRoutesDetail, group: 'shared' }],
  ['electronic-exchange', { Component: ElectronicExchange, group: 'shared' }],
])
