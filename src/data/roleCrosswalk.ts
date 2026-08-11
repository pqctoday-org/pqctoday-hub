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
  /**
   * Where this mapping's two external anchors come from.
   *
   * Added 2026-08-09: all eight roles reported "cites no source" in the
   * business-tools content inventory — 8 of the 14 uncited items — because this
   * file had no citation field at all. The mapping was never uncited in
   * substance, only in form.
   *
   * Both documents are named per role rather than once for the file, because
   * the honest citation differs by direction: `niceRoles` are defined by the
   * NICE Framework, `cswp39Steps` by CSWP.39. Note what is deliberately NOT
   * cited — the role list itself and `typicalFte` are the hub's own Skills &
   * Team model (PHASE-OVERLAY-SPEC §7.1–7.2), not anything NIST publishes, and
   * claiming otherwise would be the same overstatement the compliance review
   * spent today removing.
   */
  sources: { label: string; url: string }[]
}

/**
 * The two external documents every role mapping is anchored to.
 *
 * Exported so the Skills & Team table can cite them without re-typing a URL in
 * the component — the mistake `CSWP39ZonePanel` had made with a hardcoded DOI.
 * Note this is distinct from `RoleDetail.source` in `teamModel.ts`, which means
 * STAFFING source ("Internal senior PM with PQC training") — where the person
 * comes from, not where the mapping comes from. The table showed the former and
 * nothing showed the latter.
 */
export const ROLE_SOURCES: { label: string; url: string }[] = [
  {
    label: 'NICE Framework Components v2.2.0 (NIST SP 800-181 Rev. 1) — defines niceRoles',
    url: 'https://csrc.nist.gov/pubs/sp/800/181/r1/final',
  },
  {
    label: 'NIST CSWP.39 (upd1) — defines the 5-step spine in cswp39Steps',
    url: 'https://doi.org/10.6028/NIST.CSWP.39-upd1',
  },
]

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
    sources: ROLE_SOURCES,
    label: 'Quantum-Readiness Program Manager',
    typicalFte: '1.0',
    persona: 'executive',
    niceRoles: ['is-security-manager', 'risk-manager'],
    phases: ['p0', 'p4', 'p7', 'verify-close', 'foundations'],
    // p0 govern · p4 implement · p7 govern · verify-close closure · foundations all five
    cswp39Steps: ['govern', 'inventory', 'identify-gaps', 'prioritise', 'implement'],
  },
  'exec-sponsor': {
    id: 'exec-sponsor',
    sources: ROLE_SOURCES,
    label: 'Executive Sponsor',
    typicalFte: '1.0',
    persona: 'executive',
    niceRoles: ['is-security-manager'],
    phases: ['p0'],
    // p0 govern (the sponsor's closure role is captured by the G8 gate authority)
    cswp39Steps: ['govern'],
  },
  'crypto-architect': {
    id: 'crypto-architect',
    sources: ROLE_SOURCES,
    label: 'Cryptographic Architect',
    typicalFte: '0.5–1.0',
    persona: 'architect',
    niceRoles: ['security-architect'],
    phases: ['p1', 'p2', 'p3', 'p5'],
    // p1 discovery & inventory · p2 CBOM · p3 identify-gaps+prioritise · p5 implement
    // (p1 was the lone phase with no role — the "overlay gap" the sim's team panel showed)
    cswp39Steps: ['inventory', 'identify-gaps', 'prioritise', 'implement'],
  },
  'security-eng': {
    id: 'security-eng',
    sources: ROLE_SOURCES,
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
    sources: ROLE_SOURCES,
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
    sources: ROLE_SOURCES,
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
    sources: ROLE_SOURCES,
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
    sources: ROLE_SOURCES,
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
 * Sizing heuristic carried as data (spec §7.2; framework-2.1.yaml
 * `skills_team.sizing_heuristic`): **1 dedicated FTE per this many cryptographic
 * instances** in the CBOM, for the program's first two years (discovery, CBOM,
 * risk scoring, and pilot phases). Drives the Skills/Team gap-closer (§6.5).
 * See {@link FTE_PER_CRYPTO_INSTANCES_PRODUCTION} for the looser ratio once the
 * program reaches production rollout.
 */
export const FTE_PER_CRYPTO_INSTANCES = 500

/**
 * The same sizing heuristic once the program reaches production rollout: the
 * ratio loosens to 1 dedicated FTE per this many instances as processes mature
 * and tooling automates repetitive tasks (framework-2.1.yaml
 * `skills_team.sizing_heuristic`).
 */
export const FTE_PER_CRYPTO_INSTANCES_PRODUCTION = 1000

/**
 * The other half of framework-2.1.yaml's `skills_team` block — `sizing_extras`,
 * which the ratio heuristic above was never reconciled against:
 *
 *   "For <1,000 instances, a part-time QRPM with consulting augmentation for
 *    the Cryptographic Architect role is viable. For >10,000 instances, plan a
 *    dedicated program office with 8-12 FTEs at peak."
 *
 * At 10,000 instances the 1-FTE-per-500 ratio yields 20 scalable FTE plus the
 * fixed-overhead trio — roughly double the source's own stated peak. The two
 * fields are both from the same document and they disagree at scale, so the
 * tool surfaces both rather than silently trusting the arithmetic.
 * (Audit 2026-08-10, W2-4.)
 */
export const SIZING_SANITY_BANDS = {
  smallEstateInstances: 1000,
  largeEstateInstances: 10_000,
  largeEstatePeakFteLow: 8,
  largeEstatePeakFteHigh: 12,
  smallEstateNote:
    'a part-time QRPM with consulting augmentation for the Cryptographic Architect role is viable',
  largeEstateNote: 'plan a dedicated program office with 8-12 FTEs at peak',
} as const

/**
 * Whether the ratio heuristic's result sits outside the framework's own
 * narrative guidance for this estate size — and the note to show if so.
 */
export function sizingSanityCheck(
  estateInstances: number,
  heuristicFte: number
): { diverges: boolean; note: string } | null {
  if (estateInstances > SIZING_SANITY_BANDS.largeEstateInstances) {
    const { largeEstatePeakFteLow: lo, largeEstatePeakFteHigh: hi } = SIZING_SANITY_BANDS
    if (heuristicFte > hi) {
      return {
        diverges: true,
        note: `The ratio gives ${heuristicFte.toFixed(1)} FTE, but the same framework section says a >10,000-instance estate should "${SIZING_SANITY_BANDS.largeEstateNote}". Treat the ratio as an upper bound and staff toward the ${lo}-${hi} FTE band unless you can justify the difference.`,
      }
    }
    return null
  }
  if (estateInstances < SIZING_SANITY_BANDS.smallEstateInstances) {
    return {
      diverges: false,
      note: `Below 1,000 instances the framework notes that ${SIZING_SANITY_BANDS.smallEstateNote} — you may not need every role at full time.`,
    }
  }
  return null
}

/**
 * Roles the framework calls out as dedicated overhead *regardless of estate
 * size* (framework-2.1.yaml `skills_team.sizing_heuristic`: "The QRPM,
 * Cryptographic Architect, and PMO Analyst are dedicated overhead regardless
 * of estate size."). The Skills & Team gap-closer keeps these three pinned to
 * their baseline FTE and scales the remaining roles against the sizing-
 * heuristic total instead, so the headline estimate and the role table agree.
 */
export const FIXED_OVERHEAD_ROLE_IDS: FrameworkRoleId[] = [
  'qrpm',
  'crypto-architect',
  'pmo-analyst',
]

/**
 * Rough order-of-magnitude estimate for seeding an estate size from a product
 * count: ~this many cryptographic instances (keys, certs, library call-sites,
 * protocol endpoints) per selected product. NOT a sourced figure — it is an
 * editable starting point only; the user is expected to refine it with a real
 * inventory. Shared by Initial Scoping and the Skills & Team plan so the two
 * seeds can't drift, and surfaced in the UI rather than hidden in a comment.
 */
export const INSTANCES_PER_PRODUCT_ESTIMATE = 12

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
