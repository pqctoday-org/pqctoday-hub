// SPDX-License-Identifier: GPL-3.0-only
/**
 * simMoves — the simulation's strategic decision layer. Each phase offers a few
 * "next moves": sound plays, trap plays (drawn from the framework's Common
 * Failures + jurisdiction rules + the Mosca clock), and the occasional warn.
 * Picking a trap explains WHY it fails. Verdicts are context-aware.
 */
import type { PhaseId } from './frameworkPhases'

export interface MoveCtx {
  /** Country/jurisdiction with hybrid mandate + end state. */
  country: { id: string; label: string; hybrid: string; endState: string }
  /** Sector with data shelf-life X. */
  sector: { id: string; label: string; x: number }
  size: { id: string; label: string }
  /** Mosca clock: years over the line (positive = at risk). */
  over: number
}

export type MoveKind = 'sound' | 'trap' | 'warn'
export interface MoveVerdict {
  kind: MoveKind
  outcome: string
}
export interface SimMove {
  label: string
  desc: string
  evaluate: (ctx: MoveCtx) => MoveVerdict
}

const sound =
  (outcome: string): SimMove['evaluate'] =>
  () => ({ kind: 'sound', outcome })
const trap =
  (outcome: string): SimMove['evaluate'] =>
  () => ({ kind: 'trap', outcome })

export const SIM_MOVES: Partial<Record<PhaseId, SimMove[]>> = {
  p0: [
    {
      label: 'Secure multi-year budget & appoint a QRPM',
      desc: 'Fund the program and name a single accountable owner.',
      evaluate: sound(
        'Sound. A funded charter with a named QRPM clears Gate G0 and unlocks every later phase. This is the Level-2 bar.'
      ),
    },
    {
      label: 'Get verbal exec buy-in, defer the budget ask',
      desc: 'Keep momentum without a formal funding commitment yet.',
      evaluate: trap(
        "Fails. Common failure: an unfunded mandate. Work stalls at the first resourcing decision and the program never gets past Level 1 — enthusiasm isn't authority."
      ),
    },
    {
      label: 'Frame it as an IT-only compliance task',
      desc: 'Run it under the CISO, skip board-level reporting.',
      evaluate: trap(
        "Fails. Quantum risk stays invisible to the board, so it loses the next budget cycle to louder priorities. The framework's Level 4 requires quantum risk reported to the board alongside other strategic risks."
      ),
    },
  ],
  p1: [
    {
      label: 'Deploy automated discovery on Priority-A systems',
      desc: 'Scan first; cross-reference CMDB, SBOM and certs.',
      evaluate: sound(
        'Sound. Automated discovery on your highest-risk systems gets you to ≥70% Tier-1 coverage — the Level-2 bar and Gate G1.'
      ),
    },
    {
      label: 'Treat the CMDB as your crypto inventory',
      desc: 'Use the existing asset register as the source of truth.',
      evaluate: trap(
        "Fails. Common failure: the CMDB is not a cryptographic inventory. It misses embedded keys, libraries and protocol versions — you'd plan the whole migration against a false map."
      ),
    },
    {
      label: 'Inventory public web servers only',
      desc: 'Start with the obvious internet-facing estate.',
      evaluate: trap(
        'Fails. Harvest-now-decrypt-later targets internal and OT data too. A public-only inventory caps you at Level 1 and hides your worst exposure.'
      ),
    },
  ],
  p2: [
    {
      label: 'Build a CycloneDX CBOM with SBOM linkage',
      desc: 'Machine-verifiable records for Layers 1–2.',
      evaluate: sound(
        'Sound. A queryable CycloneDX CBOM is the Level-2 bar (Gate G2) and the asset every later phase reads from.'
      ),
    },
    {
      label: 'Keep the inventory in a shared spreadsheet',
      desc: 'Faster to produce, everyone can edit it.',
      evaluate: trap(
        "Fails. Not machine-verifiable: it can't be queried, diffed, or fed to compliance automation. Gate G2 stays blocked and you're stuck at Level 1."
      ),
    },
  ],
  p3: [
    {
      label: 'Score Tier-1 by HNDL exposure × data shelf-life',
      desc: 'Risk-rank entries, then produce an approved QRA.',
      evaluate: (ctx) => ({
        kind: 'sound',
        outcome: `Sound. Risk-driven scoring produces the QRA (Gate G3) and a prioritized backlog. With ${ctx.sector.label.toLowerCase()} data living ${ctx.sector.x}y, this is what stops the bleeding first.`,
      }),
    },
    {
      label: 'Migrate alphabetically / whoever volunteers',
      desc: 'Lowest-friction sequencing to get moving.',
      evaluate: (ctx) => ({
        kind: 'trap',
        outcome: `Fails. Common failure: unprioritized migration. You'd spend budget on low-risk systems while ${ctx.sector.label.toLowerCase()}'s long-shelf-life data keeps leaking. Sequencing must be risk-driven.`,
      }),
    },
    {
      label: 'Wait for perfect inventory data before scoring',
      desc: 'Hold until discovery is 100% complete.',
      evaluate: (ctx) => ({
        kind: 'trap',
        outcome: `Fails. Analysis paralysis. The Mosca clock keeps running — you're already ${ctx.over}y over the line. Score with what you have and refine the QRA quarterly.`,
      }),
    },
  ],
  p4: [
    {
      label: 'Commit a multi-year roadmap + funded PMO',
      desc: 'Sequenced waves, gates, and a KPI baseline.',
      evaluate: sound(
        'Sound. A multi-year roadmap with an operational SteerCo and KPI baseline is the Level-2 bar (Gate G4) and lets dependencies sequence correctly.'
      ),
    },
    {
      label: 'Plan one year, revisit next year',
      desc: 'Keep the horizon short and flexible.',
      evaluate: trap(
        "Fails. Migration is inherently multi-year — a single-year horizon can't sequence dependencies (you must do PKI before the apps that depend on it). Caps you at Level 1."
      ),
    },
  ],
  p5: [
    {
      label: 'Run 2+ production pilots with tested rollback',
      desc: 'Prove patterns on real traffic before waves.',
      evaluate: sound(
        'Sound. Measured pilots with a proven rollback path are the Level-2 bar (Gate G5) and the only safe basis for wave rollout.'
      ),
    },
    {
      label: 'Cut straight to PURE PQC across Tier-1',
      desc: 'Skip hybrid, go to the end-state now.',
      evaluate: (ctx) =>
        ctx.country.hybrid === 'required'
          ? {
              kind: 'trap',
              outcome: `Compliance FAIL. ${ctx.country.label} (${ctx.country.id}) mandates HYBRID — a pure-only deployment is non-compliant and must be reworked. This is the classic cross-jurisdiction trap.`,
            }
          : {
              kind: 'warn',
              outcome: `Risky. ${ctx.country.id} allows a pure end-state, but going pure with no hybrid fallback invites interop breakage with peers still on classical. Pilot hybrid first, then sunset to pure.`,
            },
    },
    {
      label: 'Skip rollback testing to hit the deadline',
      desc: 'Move faster by trusting the cutover.',
      evaluate: trap(
        'Fails. Common failure: no rollback path. A failed cutover on a Tier-1 internet-facing service becomes an outage with no way back. Pilots must prove rollback before any wave.'
      ),
    },
    {
      label: 'Deploy hybrid everywhere',
      desc: 'Hybrid classical+PQC across the estate.',
      evaluate: (ctx) =>
        ctx.country.endState === 'hybrid'
          ? {
              kind: 'sound',
              outcome: `Sound. Hybrid matches the ${ctx.country.id} end-state mandate — reversible, standards-aligned, and compliant.`,
            }
          : {
              kind: 'warn',
              outcome: `OK as interim. ${ctx.country.id}'s end-state is pure PQC, so hybrid needs a documented sunset plan or it becomes permanent tech debt.`,
            },
    },
  ],
  p6: [
    {
      label: 'Inventory HSMs & PKI; test middleboxes',
      desc: 'Establish PQC status and performance baselines.',
      evaluate: sound(
        'Sound. Knowing HSM PQC-status, a PKI modernization plan, and middlebox test results is the Level-2 bar (Gate G6).'
      ),
    },
    {
      label: 'Assume current HSMs & middleboxes cope',
      desc: 'Migrate apps and let infra catch up.',
      evaluate: trap(
        'Fails. Common failure: ignored infrastructure limits. Larger PQC keys and handshakes break old middleboxes and overflow HSM capacity — discovered in production, not planning. Test before you migrate the apps on top.'
      ),
    },
  ],
  p7: [
    {
      label: 'Engage top-10 vendors; score & contract',
      desc: 'Questionnaires, criticality tiers, dated clauses.',
      evaluate: sound(
        'Sound. Formally engaged, scored vendors with dated PQC commitments is the Level-2 bar (Gate G7) and unblocks vendor-gated systems.'
      ),
    },
    {
      label: 'Assume vendors will handle PQC themselves',
      desc: 'Wait for their roadmaps to land.',
      evaluate: trap(
        "Fails. Common failure: 'the vendors will sort it out.' Blocked dependencies with no dated commitment stall your waves indefinitely. Engage, score criticality, and write PQC into contracts."
      ),
    },
  ],
}
