// SPDX-License-Identifier: GPL-3.0-only
/**
 * simMoves — the simulation's strategic decision layer. Each phase offers a few
 * "next moves": sound plays, trap plays (drawn from the framework's Common
 * Failures + jurisdiction rules + the Mosca clock), and the occasional warn.
 * Picking a trap explains WHY it fails. Verdicts are context-aware.
 */
import type { PhaseId } from './frameworkPhases'
import type { Freshness } from './contentFreshness'

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
  /**
   * Structured freshness for a move whose verdict cites a time-sensitive fact
   * (e.g. "as of June 2026 — re-check the live CMVP list"). Aggregated into the
   * content-freshness manifest so the date can't silently go stale in prose.
   */
  freshness?: Freshness
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
    {
      label: 'Delegate the whole program to your vendors',
      desc: 'Let suppliers drive the migration on their roadmaps.',
      evaluate: trap(
        'Fails. Common failure: the vendor-delegation trap. You can delegate implementation, never the risk — vendors migrate on their timeline, leaving you accountable to the board with no control over yours.'
      ),
    },
    {
      label: 'Stand up a SteerCo without the business units',
      desc: 'Keep governance inside security to move faster.',
      evaluate: trap(
        'Fails. Common failure: business units absent from the SteerCo. Workstream leads hit constant political resistance and the program stalls on cross-functional decisions.'
      ),
    },
    {
      label: 'Formally accept the quantum risk and close the program',
      desc: 'Sign off that this risk is acceptable and stand the effort down.',
      evaluate: trap(
        "Fails as a Phase 0 opening move. Formal risk acceptance is a legitimate outcome elsewhere in GRC — but only AFTER the risk is quantified (HNDL/TNFL exposure, regulatory exposure) and an accountable owner signs off against that number. Accepting an unquantified, un-scoped risk isn't governance, it's skipping the work — and it still leaves the board exposed the moment a regulator or auditor asks what was actually assessed."
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
    {
      label: 'Give the whole team read access to the CBOM',
      desc: 'Publish it to the wiki so everyone can self-serve.',
      evaluate: trap(
        'Fails. The CBOM is a map of exactly which systems use breakable crypto — an HNDL shopping list for an attacker. It needs Restricted classification, RBAC, query logging and SOC exfiltration monitoring, not open access.'
      ),
    },
    {
      label: 'Extend the SPDX SBOM — one format for everything',
      desc: 'Reuse the software bill of materials you already maintain.',
      evaluate: trap(
        "Fails. SPDX is built for software/license provenance, not cryptographic assets — it has no dedicated field set for algorithm, key size, protocol context or quantum-vulnerability status the way CycloneDX's cryptoProperties does. Link the CBOM to the SBOM (2.2 already does this for dependency chains); don't try to fold crypto asset data into a format that has no real place to put it."
      ),
    },
  ],
  p3: [
    {
      label: 'Score every entry across all four risk dimensions',
      desc: 'HNDL exposure, TNFL criticality, feasibility, regulatory pressure — then produce an approved QRA.',
      evaluate: (ctx) => ({
        kind: 'sound',
        outcome: `Sound. Scoring across all four dimensions — (1) HNDL exposure, (2) TNFL/trust-infrastructure criticality, (3) migration feasibility, (4) regulatory & compliance pressure — produces the QRA (Gate G3) and a defensible priority backlog, not just a severity-sorted list. With ${ctx.sector.label.toLowerCase()} data living ${ctx.sector.x}y, HNDL alone already justifies moving first — the other three dimensions are what keep signature-heavy and feasibility-constrained systems from falling off the plan.`,
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
    {
      label: 'Score by CVSS severity, like the vuln backlog',
      desc: 'Reuse the classical vulnerability-management scoring you already run.',
      evaluate: (ctx) => ({
        kind: 'trap',
        outcome: `Fails. CVSS scores exploitability today, against classical attackers — it has no time-to-decrypt axis and no notion of "safe now, broken once a CRQC exists." A CVSS-low system holding ${ctx.sector.label.toLowerCase()} data with a ${ctx.sector.x}-year confidentiality horizon can be a Tier-1 quantum risk with a near-zero classical CVSS score. Quantum risk isn't classical vulnerability severity — it needs its own four-dimension model.`,
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
    {
      label: 'Defer vendor engagement to Year 2',
      desc: 'Finish your own inventory before talking to vendors.',
      evaluate: trap(
        'Fails. Vendor lead time (6–18 months) is the longest pole on the critical path. Engaging in Year 2 makes the whole timeline vendor-constrained — start the top-10 in Q1 Year 1.'
      ),
    },
    {
      label: 'Build a single-track roadmap with no contingencies',
      desc: 'Assume every pilot and vendor lands on schedule.',
      evaluate: trap(
        'Fails. With no acceleration/deceleration triggers, one slipped vendor or failed pilot derails the plan. The framework requires contingency triggers and a pre-drafted accelerated profile.'
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
    {
      label: 'Deploy to a FIPS-required system before a validated module exists',
      desc: 'Push PQC into the regulated estate now.',
      evaluate: trap(
        'Fails (as of June 2026 — re-check the live CMVP list, since validated ML-KEM/ML-DSA modules are expected imminently). Until a FIPS 140-3-validated PQC module exists, a FIPS-required environment is non-compliant — gate PQC there behind CAVP/validation, and deploy first where validation is not mandated.'
      ),
      freshness: {
        asOf: '2026-06-18',
        recheck: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program',
      },
    },
    {
      label: 'Skip the library-readiness check',
      desc: 'Assume the runtime already supports the algorithms.',
      evaluate: trap(
        'Fails. A lagging library/runtime (pre-OpenSSL 3.5, old Bouncy Castle, libsodium/MbedTLS gaps) silently blocks the deployment you designed. Verify library versions as a hard pilot prerequisite.'
      ),
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
    {
      label: 'Skip capacity planning for high-volume TLS termination',
      desc: 'Roll PQC to the CDN/load-balancer edge without modelling load.',
      evaluate: trap(
        'Fails. Common failure: neglected capacity planning. PQC bandwidth/CPU growth at aggregate edge scale swamps unmodelled capacity, and the outage surfaces under peak load. Model CDN/LB capacity before broad rollout.'
      ),
    },
    {
      label: 'Plan the X.509-vs-MTC fork per deployment',
      desc: 'Route public web PKI to Merkle Tree Certs, internal PKI to X.509+PQC.',
      evaluate: sound(
        'Sound. The framework splits PKI: public-facing web PKI is watching Merkle Tree Certificates (an IETF PLANTS working-group draft, one leading candidate alongside X.509+ML-DSA) + ACME automation, while internal/private PKI moves to X.509+PQC now. Deciding the fork per deployment avoids a dead-end PKI investment.'
      ),
    },
  ],
  p7: [
    {
      label: 'Engage top-10 vendors; score & contract',
      desc: 'Questionnaires, criticality tiers, dated clauses.',
      evaluate: sound(
        'Sound. Formally engaged, scored vendors with dated PQC commitments is the Level-2 bar for this continuous phase (no gate — vendor governance never closes) and unblocks vendor-gated systems.'
      ),
    },
    {
      label: 'Assume vendors will handle PQC themselves',
      desc: 'Wait for their roadmaps to land.',
      evaluate: trap(
        "Fails. Common failure: 'the vendors will sort it out.' Blocked dependencies with no dated commitment stall your waves indefinitely. Engage, score criticality, and write PQC into contracts."
      ),
    },
    {
      label: 'Accept a verbal "we’re working on PQC" from a key vendor',
      desc: 'Take the roadmap assurance and move on.',
      evaluate: trap(
        'Fails. Common failure: verbal commitments evaporate when vendor priorities shift. Require dated GA commitments and contractual remedies in writing, or the dependency is unmanaged.'
      ),
    },
  ],
  foundations: [
    {
      label: 'Run the maturity self-assessment & set board KPIs',
      desc: 'Seven-domain score (overall = weakest) + a board KPI baseline.',
      evaluate: sound(
        'Sound. The seven-domain self-assessment (overall = your weakest domain) plus a board KPI baseline make progress measurable and sustainable — the foundation every phase reports against.'
      ),
    },
    {
      label: 'Skip the maturity baseline; report progress phase-by-phase',
      desc: 'Track phase completion instead of the weakest-domain maturity score.',
      evaluate: trap(
        'Fails. Common failure: no maturity baseline. Without the seven-domain weakest-link view you over-report progress and miss the gating domain that actually constrains readiness.'
      ),
    },
  ],
  // Terminal Verification & Closure phase — the lesson "migrated is a belief
  // until there's an evidence dossier" now lands inside the phase that teaches it
  // (migrated here from foundations). Wrong picks still fire logSimTrapPick.
  'verify-close': [
    {
      label: 'Prove each migration against the evidence standard & log decommissioning',
      desc: 'Assemble the dossier (observed PQC negotiation, negative testing, attestation), re-encrypt long-lived archives under PQC, then record SP 800-88 (Rev. 2) decommissioning of the classical keys.',
      evaluate: sound(
        'Sound. "Done" now means proven: the 5-point evidence dossier plus a logged classical-key decommissioning turn a declared migration into a verifiable, audit-ready one — and close the *forward* harvest-now-decrypt-later exposure. Traffic already harvested before migration is permanently gone; that is why archives get re-encrypted under PQC before the classical keys protecting them are destroyed, not after.'
      ),
    },
    {
      label: 'Declare victory when Tier-1 migration milestones are hit',
      desc: 'Close the program on milestone completion.',
      evaluate: trap(
        "Fails. Common failure: 'declared done.' Without verification evidence (observed negotiation, negative testing, the dossier) the migration is a belief, not a fact — and an auditor will ask for proof, not milestones."
      ),
    },
    {
      label: 'Disband the program team once Tier-1 is migrated',
      desc: 'Free up the people; the hard part is over.',
      evaluate: trap(
        'Fails. Common failure: orphaned capabilities. CBOM, discovery and vendor governance decay within quarters without funded BAU owners — closure is a handover, not an end-of-funding.'
      ),
    },
  ],
}
