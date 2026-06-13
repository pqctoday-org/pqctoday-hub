// SPDX-License-Identifier: GPL-3.0-only
/**
 * Role crosswalk — persona ↔ framework core role ↔ NICE work role.
 *
 * The companion to `frameworkPhases.ts` (the phase overlay spine). Where that
 * file is the single source of truth for the Phase 0–7 journey, this file is the
 * single source of truth for *who drives each phase*: it relates the hub's three
 * role systems at three altitudes (see `reports/framework-gap/PHASE-OVERLAY-SPEC.md`
 * §7):
 *
 *   1. Personas       (`learningPersonas.ts`)  — audience / content lens
 *   2. Framework core roles (this file)        — FTE-counted program jobs
 *   3. NICE work roles (`niceFramework.ts`)    — skill definitions
 *
 * The systems chain (persona → role → skills) but do not substitute for each
 * other: 6 personas ↔ 8 framework roles ↔ 8 NICE roles, none aligning 1:1.
 *
 * Each `RoleMapping` is *read-only over* `frameworkPhases.ts` for its phase/step
 * linkage. Drift guard (`roleCrosswalk.test.ts`, mirroring `frameworkPhases.test.ts`):
 * every role's `phases` ⊆ `PHASE_ORDER`, and every `cswp39Steps` entry is the
 * union of the steps the role's phases advance — so roles, phases, and the
 * CSWP.39 spine can never silently disagree (spec §7.5).
 *
 * Consumers (spec §7.4): the RACI Builder role set, the Skills/Team gap-closer
 * (1-FTE-per-500-cryptographic-instances sizing), QRA owner-assignment, and the
 * phase-rail "≈ your view" persona badge.
 */

import type { PhaseId, Cswp39StepId } from './frameworkPhases'
import type { PersonaId } from './learningPersonas'
import type { NiceWorkRoleId } from './niceFramework'

/**
 * Framework core role ids — the FTE-counted program jobs from the Skills & Team
 * model (spec §7.1, table row "Framework Core Roles"). Distinct from both the
 * coarser content personas and the finer-grained NICE skill roles.
 */
export type FrameworkRoleId =
  | 'qrpm'
  | 'exec-sponsor'
  | 'crypto-architect'
  | 'security-eng'
  | 'appsec-lead'
  | 'ot-specialist'
  | 'vendor-lead'
  | 'pmo-analyst'

/**
 * One framework role's place in the crosswalk. `persona` is the single nearest
 * content-lens persona (the lens is intentionally coarser than the org-chart —
 * e.g. QRPM and PMO Analyst both map to `executive`; spec §7.3). `phases` and
 * `cswp39Steps` are derivation keys into `frameworkPhases.ts`.
 */
export interface RoleMapping {
  id: FrameworkRoleId
  /** Human-readable label (Skills & Team naming). */
  label: string
  /** Typical FTE allocation carried as data (spec §7.2: '1.0' | '2–4' | '0.5–1.0 (if OT)'). */
  typicalFte: string
  /** Nearest content-lens persona (1-persona→many-roles fan-out is expected). */
  persona: PersonaId
  /** NICE work role(s) that define the skill set for this role. */
  niceRoles: NiceWorkRoleId[]
  /** Framework phases this role drives (→ `frameworkPhases.ts`). */
  phases: PhaseId[]
  /** CSWP.39 5-step spine ids advanced across this role's phases (drift key). */
  cswp39Steps: Cswp39StepId[]
}

/**
 * The §7.2 crosswalk table. `persona` notes:
 *   - `security-eng` spans Developer · Operations in the spec; the nearest single
 *     content persona is `developer` (the engineering build lens).
 *   - `ot-specialist` maps to `ops` (the hub's Operations persona id).
 *
 * `cswp39Steps` for each role is the union of the `cswp39Steps` of its `phases`
 * in `frameworkPhases.ts`, kept in canonical Govern→Implement order. This is what
 * the drift guard asserts, so the two files cannot disagree.
 */
export const ROLE_CROSSWALK: Record<FrameworkRoleId, RoleMapping> = {
  qrpm: {
    id: 'qrpm',
    label: 'Quantum-Readiness Program Manager',
    typicalFte: '1.0',
    persona: 'executive',
    niceRoles: ['is-security-manager', 'risk-manager'],
    phases: ['p0', 'p4', 'p7', 'foundations'],
    // p0 govern · p4 implement · p7 govern · foundations all five
    cswp39Steps: ['govern', 'inventory', 'identify-gaps', 'prioritise', 'implement'],
  },
  'exec-sponsor': {
    id: 'exec-sponsor',
    label: 'Executive Sponsor',
    typicalFte: '1.0',
    persona: 'executive',
    niceRoles: ['is-security-manager'],
    phases: ['p0'],
    // p0 govern
    cswp39Steps: ['govern'],
  },
  'crypto-architect': {
    id: 'crypto-architect',
    label: 'Cryptographic Architect',
    typicalFte: '0.5–1.0',
    persona: 'architect',
    niceRoles: ['security-architect'],
    phases: ['p2', 'p3', 'p5'],
    // p2 inventory · p3 identify-gaps+prioritise · p5 implement
    cswp39Steps: ['inventory', 'identify-gaps', 'prioritise', 'implement'],
  },
  'security-eng': {
    id: 'security-eng',
    label: 'Security Engineers (PQC)',
    typicalFte: '2–4',
    persona: 'developer',
    niceRoles: [
      'security-developer',
      'network-security-specialist',
      'system-administrator',
      'iam-specialist',
    ],
    phases: ['p5', 'p6'],
    // p5 implement · p6 implement
    cswp39Steps: ['implement'],
  },
  'appsec-lead': {
    id: 'appsec-lead',
    label: 'Application Security Lead',
    typicalFte: '1.0',
    persona: 'developer',
    niceRoles: ['security-developer', 'systems-security-analyst'],
    phases: ['p5'],
    // p5 implement
    cswp39Steps: ['implement'],
  },
  'ot-specialist': {
    id: 'ot-specialist',
    label: 'OT Security Specialist',
    typicalFte: '0.5–1.0 (if OT)',
    persona: 'ops',
    niceRoles: ['network-security-specialist', 'system-administrator'],
    phases: ['p5', 'p6'],
    // p5 implement · p6 implement
    cswp39Steps: ['implement'],
  },
  'vendor-lead': {
    id: 'vendor-lead',
    label: 'Vendor / Procurement Lead',
    typicalFte: '0.5',
    persona: 'executive',
    niceRoles: ['risk-manager', 'is-security-manager'],
    phases: ['p7'],
    // p7 govern
    cswp39Steps: ['govern'],
  },
  'pmo-analyst': {
    id: 'pmo-analyst',
    label: 'PMO Analyst',
    typicalFte: '0.5–1.0',
    persona: 'executive',
    niceRoles: ['risk-manager', 'systems-security-analyst'],
    phases: ['p4', 'foundations'],
    // p4 implement · foundations all five
    cswp39Steps: ['govern', 'inventory', 'identify-gaps', 'prioritise', 'implement'],
  },
}

/**
 * Sizing heuristic carried as data (spec §7.2): **1 dedicated FTE per this many
 * cryptographic instances** in the CBOM. Drives the Skills/Team gap-closer (§6.5).
 */
export const FTE_PER_CRYPTO_INSTANCES = 500

/**
 * Persona → framework roles fan-out, derived from `ROLE_CROSSWALK`.
 *
 * Records the intentional 1-persona→many-roles relationship (spec §7.3): e.g.
 * `executive` owns QRPM, Exec-Sponsor, Vendor-Lead and PMO-Analyst. Personas
 * that hold no program-role ownership (Researcher, Curious — audience segments,
 * not team jobs) map to `[]` and see the full neutral phase rail with no
 * "≈ your view" marker (spec §4 orphan-personas decision).
 */
export const personaToRoles: Record<PersonaId, FrameworkRoleId[]> = (() => {
  // Seed every persona (incl. orphans) so the record is total over PersonaId.
  const acc: Record<PersonaId, FrameworkRoleId[]> = {
    executive: [],
    developer: [],
    architect: [],
    researcher: [],
    ops: [],
    curious: [],
  }
  for (const role of Object.values(ROLE_CROSSWALK)) {
    acc[role.persona].push(role.id)
  }
  return acc
})()
