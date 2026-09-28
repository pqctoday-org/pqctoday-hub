// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Learn-section registry: manifest section id → the owner's body component
 * (build spec §4). CertIntroduction renders from this; the parity test pins
 * that it covers exactly the manifest's sections.
 *
 * Since the 2026-09-27 split this registry holds LM-065's own core + shared
 * sections. The FIPS, CC/EUCC and PCI blocks live in LM-067
 * (Fips1403Certification), LM-068 (CcEuccCertification) and LM-071
 * (PciCertification), whose registries
 * reuse SectionGroup / SectionEntry / PRACTITIONER_DISCLAIMER from here.
 */
import type { FC } from 'react'
import { FourQuestions, ScopeBeforeLevel } from './sections/CoreSections'
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
  ['pqc-impact', { Component: PqcImpact, group: 'shared' }],
  ['agility-latency', { Component: AgilityLatency, group: 'shared' }],
  ['transition-deadlines', { Component: TransitionDeadlines, group: 'shared' }],
  ['change-routes-detail', { Component: ChangeRoutesDetail, group: 'shared' }],
  ['electronic-exchange', { Component: ElectronicExchange, group: 'shared' }],
])
