// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Learn-section registry for LM-068: manifest section id → owner component.
 * The shared CertIntroduction (LM-065) renders from this; the parity test pins
 * that it covers exactly the manifest's sections.
 */
import type { SectionEntry } from '@/components/PKILearning/modules/CryptoProductCertification/components/sectionRegistry'
import {
  CcModel,
  CcEalDecoding,
  CcLifecycle,
  CcContinuity,
  PpSecurityIc,
  EuccScheme,
  EidasChain,
  PpEn4192215,
  EuccPqcToday,
  CcRegionalSchemes,
  CcRegionalReference,
} from './sections/CcEuSections'

export const SECTION_COMPONENTS: ReadonlyMap<string, SectionEntry> = new Map<string, SectionEntry>([
  ['cc-model', { Component: CcModel, group: 'cc-eu' }],
  ['cc-eal-decoding', { Component: CcEalDecoding, group: 'cc-eu' }],
  ['cc-lifecycle', { Component: CcLifecycle, group: 'cc-eu' }],
  ['cc-continuity', { Component: CcContinuity, group: 'cc-eu' }],
  ['pp-security-ic', { Component: PpSecurityIc, group: 'cc-eu' }],
  ['eucc-scheme', { Component: EuccScheme, group: 'cc-eu' }],
  ['eidas-chain', { Component: EidasChain, group: 'cc-eu' }],
  ['pp-en419221-5', { Component: PpEn4192215, group: 'cc-eu' }],
  ['eucc-pqc-today', { Component: EuccPqcToday, group: 'cc-eu' }],
  ['cc-regional-schemes', { Component: CcRegionalSchemes, group: 'cc-eu' }],
  ['cc-regional-reference', { Component: CcRegionalReference, group: 'cc-eu' }],
])
