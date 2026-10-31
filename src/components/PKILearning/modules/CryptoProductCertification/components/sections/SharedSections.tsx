// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: Shared author
/**
 * Shared sections (plan r2): `pqc-impact`, `agility-latency`,
 * `transition-deadlines` (timed) and `change-routes-detail`,
 * `electronic-exchange` (optional reference). CertIntroduction wraps each body
 * in <LearnSection>; render only the body here.
 *
 * Market / policy deadlines are read at runtime from the Hub timeline facts
 * (marketDeadlineRows) — never typed into this prose (build spec §5).
 */
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowDown, Clock, Gavel, Landmark, Scale } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Input } from '@/components/ui/input'
import {
  AGILE_ARCHITECTURE,
  HONESTY_TIERS,
  PQC_POSITIONS_AS_OF,
  HYBRID_POSITIONS,
  LIFECYCLE_STEPS,
  MAINTAIN_VALID,
  MANDATE_LABEL,
  NO_SHORTCUT,
  PQC_CENTRAL_ANSWER,
  PQC_HARDWARE_CHANGES,
  PQC_SCHEME_TABLE,
  PQC_SOFTWARE_CHANGES,
  PQC_STAYS_THE_SAME,
  ROUTE_DECISION_AID,
  SCHEME_CLOCKS,
  SHARED_SOURCES,
  THREE_CLOCKS,
  TWO_LANES,
  landingVersusDeadline,
  marketDeadlineRows,
  type MarketDeadlineRow,
} from '../../data/sharedData'
import { ANCHOR_RELEASES, ANCHOR_SCENARIO } from '../../data/anchorScenario'
import { AsOf, Callout, FictionalBadge, PlainSource, SourceLink } from './CoreSections'
import { PqcParameterComparison } from '../PqcParameterComparison'
import { ModuleAnalysisNote } from '@/components/PKILearning/common/ModuleAnalysisNote'

const Prose = ({ children }: { children: ReactNode }) => (
  <div className="space-y-4 text-sm leading-relaxed text-foreground/85">{children}</div>
)

const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="pt-2 text-base font-semibold text-foreground">{children}</h3>
)

const baseline = ANCHOR_RELEASES.find((r) => r.id === 'baseline')
const candidate = ANCHOR_RELEASES.find((r) => r.id === 'pqc-candidate')

// ── pqc-impact ──────────────────────────────────────────────────────────────

/** Learn section `pqc-impact` */
export const PqcImpact = () => (
  <Prose>
    <blockquote className="border-l-4 border-primary/50 pl-4 text-foreground">
      {PQC_CENTRAL_ANSWER}
    </blockquote>
    <p>
      The algorithms themselves are standardised: ML-KEM in{' '}
      <SourceLink source={SHARED_SOURCES.fips203} label="FIPS 203" />, ML-DSA in{' '}
      <SourceLink source={SHARED_SOURCES.fips204} label="FIPS 204" /> and SLH-DSA in{' '}
      <SourceLink source={SHARED_SOURCES.fips205} label="FIPS 205" />. A standard tells you what an
      algorithm is. It tells you nothing about whether a particular product implements it correctly,
      protects its keys, tests itself, resists side channels, or was evaluated by anyone. That is
      the certification schemes’ job — and it is why “we support ML-KEM” and “our ML-KEM is
      certified” are different sentences.
    </p>

    <PqcParameterComparison />

    <H3>What stays the same</H3>
    <ul className="list-disc space-y-1 pl-5">
      {PQC_STAYS_THE_SAME.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
    <p>
      This list matters because vendors under pressure are tempted to hope PQC is special — that a
      new algorithm family comes with a new, faster door. It does not. The {ANCHOR_SCENARIO.name}
      <FictionalBadge /> firmware {candidate?.firmware} is a changed product in every scheme, for
      exactly the same reasons any changed firmware would be.
    </p>

    <H3>What changes in software</H3>
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[560px] text-left text-xs">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="p-3 font-semibold">Change</th>
            <th className="p-3 font-semibold">Why a lab cares</th>
          </tr>
        </thead>
        <tbody>
          {PQC_SOFTWARE_CHANGES.map((c) => (
            <tr key={c.change} className="border-t border-border align-top">
              <td className="p-3 text-foreground">{c.change}</td>
              <td className="p-3">{c.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <H3>What changes in hardware</H3>
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[560px] text-left text-xs">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="p-3 font-semibold">Change</th>
            <th className="p-3 font-semibold">Why a lab cares</th>
          </tr>
        </thead>
        <tbody>
          {PQC_HARDWARE_CHANGES.map((c) => (
            <tr key={c.change} className="border-t border-border align-top">
              <td className="p-3 text-foreground">{c.change}</td>
              <td className="p-3">{c.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p>
      The Implementation Guidance items named above are from the current FIPS 140-3 IG (
      <SourceLink source={SHARED_SOURCES.ig} />, last updated 19 August 2026). For an HSM the
      hardware list is often the harder half: side-channel and fault analysis for lattice arithmetic
      is new work for most labs and most vendors, and the evidence for it cannot be copied from the
      RSA era.
    </p>

    <H3>
      Where each scheme stands on PQC <AsOf label={`as of ${PQC_POSITIONS_AS_OF}`} />
    </H3>
    <p>
      Keep two columns apart: what applies <strong>today</strong>, and what is only a{' '}
      <strong>planning implication</strong>. Mixing them is the most common PQC certification error
      — a draft taught as a requirement, or a requirement dismissed as a draft.
    </p>
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="p-3 font-semibold">Scheme</th>
            <th className="p-3 font-semibold">Applicable today</th>
            <th className="p-3 font-semibold">Planning implication (not yet applicable)</th>
          </tr>
        </thead>
        <tbody>
          {PQC_SCHEME_TABLE.map((r) => (
            <tr key={r.scheme} className="border-t border-border align-top">
              <td className="p-3 font-semibold text-foreground">{r.scheme}</td>
              <td className="p-3">
                <p className="text-foreground">{r.current}</p>
                <p className="mt-1 flex flex-wrap gap-x-2">
                  {r.currentSources.map((s) => (
                    <SourceLink key={s.id} source={s} label={s.id} />
                  ))}
                </p>
              </td>
              <td className="p-3">
                <p>{r.planning}</p>
                <p className="mt-1 flex flex-wrap gap-x-2">
                  {r.planningSources.map((s) => (
                    <SourceLink key={s.id} source={s} label={s.id} />
                  ))}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <p>
      Three distinct observations matter here. First, <strong>EUCC has PQC guidance</strong>: the
      applicable ECCG ACM v2 (<SourceLink source={SHARED_SOURCES.acm2} />) already names the PQC
      mechanisms and parameter sets (its hybrid rules are in the table below). Do not turn that
      guidance into a blanket legal requirement; check the applicable scheme rules, PP and Security
      Target. Second, <strong>FIPS 140-3 certificates with PQC already exist</strong>: four active
      Level 3 HSM certificates approve ML-KEM and ML-DSA, so “no validated PQC module exists” is
      false (
      <SourceLink source={SHARED_SOURCES.cmvpValidated} />
      ). Third, <strong>PCI names no PQC algorithm or date</strong> in its standards: the listing
      notation says only that PQC support exists (
      <SourceLink source={SHARED_SOURCES.ptsListing} />
      ), and the public PCI DSS v4.0.1 announcement states no PQC algorithm, parameter set or
      deadline for the standard (
      <SourceLink source={SHARED_SOURCES.dss} label="PCI DSS v4.0.1" />
      ). PCI SSC&rsquo;s blog does host guest posts in which HSM vendors discuss ML-KEM and ML-DSA (
      <SourceLink source={SHARED_SOURCES.pciQuantumLeapFuturex} label="Futurex" />,{' '}
      <SourceLink source={SHARED_SOURCES.pciQuantumLeapUtimaco} label="Utimaco" />, September and
      October 2026); these are vendor views, not PCI requirements.
    </p>

    <Callout tone="warning" title="Two things that are not true yet">
      <p>
        Executive Order 14412 has <strong>not</strong> changed the CMVP: §6(b) gives NIST 180 days
        to revise the program’s processes, which falls around 19 December 2026 (
        <SourceLink source={SHARED_SOURCES.eo14412} label="EO 14412" />
        ). And no 2025–2026 draft revises FIPS 140-3 or its Level 3 requirements. The standard is
        unchanged; the validation process is under an order to speed up.
      </p>
    </Callout>

    <H3>Hybrid or standalone: what each scheme expects</H3>
    <p>
      A “hybrid” combines a post-quantum algorithm with a classical one, so the result stays secure
      as long as either one holds. The schemes do not agree on whether you must use one (as of{' '}
      {PQC_POSITIONS_AS_OF}):
    </p>
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-left text-xs">
        <caption className="sr-only">Hybrid or standalone PQC, by scheme</caption>
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="p-3 font-semibold">Scheme or authority</th>
            <th className="p-3 font-semibold">Key establishment (ML-KEM)</th>
            <th className="p-3 font-semibold">Signatures (ML-DSA, SLH-DSA, LMS/XMSS)</th>
            <th className="p-3 font-semibold">Source</th>
          </tr>
        </thead>
        <tbody>
          {HYBRID_POSITIONS.map((r) => (
            <tr key={r.scheme} className="border-t border-border align-top">
              <td className="p-3 font-semibold text-foreground">{r.scheme}</td>
              <td className="p-3">{r.keyEstablishment}</td>
              <td className="p-3">{r.signatures}</td>
              <td className="p-3">
                <p>{r.sourceNote}</p>
                <p className="mt-1 flex flex-wrap gap-x-2">
                  {r.sources.map((s) => (
                    <SourceLink key={s.id} source={s} label={s.id} />
                  ))}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p>
      <strong>What this means for a certification engineer:</strong> a product sold into both the US
      and the EU should be designed with hybrid in mind. Standalone ML-KEM or ML-DSA can be fine for
      a FIPS 140-3 validation but falls short of the EUCC guidance and the German and French
      positions. If the product offers a hybrid, check that its FIPS module meets the IG D.S
      conditions — a hybrid the module does not enforce cannot be claimed as an approved service.
      Hash-based signatures are the exception almost everywhere: they may stand alone.
    </p>
    <p className="text-xs text-muted-foreground">
      How to build a hybrid signature is being standardised now: IETF Composite ML-DSA (ML-DSA
      paired with RSA, ECDSA, Ed25519 or Ed448) is approved and awaiting RFC publication (
      <SourceLink source={SHARED_SOURCES.compositeMlDsa} label="draft -19" />; tracked in ENISA’s{' '}
      <SourceLink source={SHARED_SOURCES.enisaHybrid} label="hybridisation status report" />
      ). Neither the FIPS 140-3 Implementation Guidance nor the ECCG mechanisms (v2 or the v3 draft)
      names it yet. Re-check before relying on this table.
    </p>

    <H3>Five strengths of claim</H3>
    <p>
      Every statement about PQC and certification belongs to exactly one of these tiers. Label it,
      and most errors disappear.
    </p>
    <ol className="list-decimal space-y-2 pl-5">
      {HONESTY_TIERS.map((t) => (
        <li key={t.id}>
          <strong className="text-foreground">{t.label}.</strong> {t.example}
        </li>
      ))}
    </ol>

    <H3>Reading a PQC claim on a certificate</H3>
    <p>
      When a datasheet says “FIPS 140-3 validated with ML-KEM”, open the Security Policy and check,
      in order:
    </p>
    <ol className="list-decimal space-y-1 pl-5">
      <li>
        Is the algorithm in the <strong>approved</strong> algorithm table, with an algorithm (CAVP)
        certificate number — or only mentioned elsewhere in the document?
      </li>
      <li>
        Which <strong>parameter sets</strong>: ML-KEM-512, -768 or -1024; ML-DSA-44, -65 or -87?
        (Under EUCC, ACM v2 recommends ML-KEM-768/1024 and ML-DSA-65/87.)
      </li>
      <li>
        Which <strong>services</strong> use it in approved mode — key generation, encapsulation,
        signing, verification — and which roles may call them?
      </li>
      <li>
        Which <strong>self-tests</strong> cover it, and when do they run?
      </li>
      <li>
        Is a <strong>hybrid</strong> scheme offered, and how is it described?
      </li>
      <li>
        Which <strong>module version</strong> — and is that the version you run?
      </li>
    </ol>
    <p>
      For a PCI listing, the PQC notation answers only the first half of question 1 (“support
      exists”); the rest is in the device’s Security Policy. For CC and EUCC, the answers are in the
      Security Target’s cryptographic SFRs and the certification report.
    </p>

    <H3>The anchor product, scheme by scheme</H3>
    <p>
      For the {ANCHOR_SCENARIO.name} moving from firmware {baseline?.firmware} to{' '}
      {candidate?.firmware}:
    </p>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <strong>FIPS 140-3:</strong> new approved services, SSPs and self-tests; ML-KEM and ML-DSA
        algorithm testing; an updated Security Policy; a revalidation route the lab proposes and the
        CMVP decides.
      </li>
      <li>
        <strong>Common Criteria:</strong> new cryptographic SFRs in the Security Target; an impact
        analysis; very likely re-evaluation of the affected claims.
      </li>
      <li>
        <strong>EUCC:</strong> review the applicable scheme rules and cryptographic guidance. ACM v2
        recommends mechanisms, parameter choices and hybridisation for ML-KEM; the mechanism name
        alone does not determine acceptance of an implementation.
      </li>
      <li>
        <strong>PCI:</strong> a new firmware version to scope with a recognized lab; the Security
        Policy’s algorithm tables change; the listing notation, if set, still means only “PQC
        support exists”.
      </li>
    </ul>
    <p>
      Nothing in that list is covered by the baseline’s certificates. The next section is about
      introducing PQC <em>anyway</em>, promptly, without breaking what is certified.
    </p>
  </Prose>
)

// ── hybrid-scope ────────────────────────────────────────────────────────────

const IG_DS = <SourceLink source={SHARED_SOURCES.ig} label="IG D.S" />

const HYBRID_SCOPE_ROWS: readonly { part: ReactNode; paper: ReactNode; tested: ReactNode }[] = [
  {
    part: 'ML-KEM half',
    paper: (
      <>
        A CAVP certificate for “ML-KEM EncapDecap” for each implemented parameter set (512, 768,
        1024), with “Decapsulation Key Check” and “Encapsulation Key Check” under Functions, unless
        the lab shows “assurance that these checks have been performed […] through other means”;
        “ML-KEM KeyGen” if the module generates key pairs
      </>
    ),
    tested: 'Algorithm test vectors',
  },
  {
    part: 'Classical half (X25519, P-256, ...)',
    paper: (
      <>
        If approved: key-agreement testing under IG D.F. If not (X25519, X448): the Security Policy
        lists it as a “non-approved but allowed algorithm with no security claimed”
      </>
    ),
    tested:
      'No algorithm test of the non-approved half; only approved algorithms inside it, such as a KDF',
  },
  {
    part: 'Key combiner',
    paper: (
      <>
        SP 800-56C key derivation (“KDA HKDF” counts), or an SP 800-133 §6.3 method. The SP 800-133
        method “cannot combine shared secrets that are NOT already keys (e.g., cannot operate on the
        Z value computed via SP 800-56A or SP 800-56B methods) nor can it incorporate non-approved
        schemes”, so a non-approved classical half such as X25519 needs the SP 800-56C route.
      </>
    ),
    tested: (
      <>
        Algorithm test vectors for the KDF (“KDA HKDF” for HKDF); for SP 800-133, HMAC testing if
        HMAC is used for key extraction, plus a key-generation claim that is not CAVP-testable
      </>
    ),
  },
  {
    part: (
      <>
        The fixed set of combinations and the order the secrets are joined (for example
        SecP256r1MLKEM768, X25519MLKEM768, SecP384r1MLKEM1024)
      </>
    ),
    paper: <>The Security Policy’s hybrid entries and the lab’s compliance demonstration</>,
    tested: (
      <>
        Not an algorithm test: the lab checks it “via source code review and/or functional testing”
      </>
    ),
  },
  {
    part: 'Self-tests',
    paper: 'Each approved scheme is self-tested on its own',
    tested: (
      <>
        “There is currently no separate self-test requirement for the approved key combiner”, but
        approved algorithms used for the key combiner (for example an SP 800-56C KDF or HMAC) “must
        still meet applicable self-test requirements per IG 10.3.A”
      </>
    ),
  },
]

/** Learn section `hybrid-scope` */
export const HybridScope = () => (
  <Prose>
    <p>
      A hybrid key establishment is not one line on a certificate. IG D.S sets five conditions, and
      they are evidenced in different places: CAVP certificates, the Security Policy and the lab’s
      own review. Several of them no algorithm test can show.{' '}
      <ModuleAnalysisNote>(Module analysis, summarising the table below.)</ModuleAnalysisNote>
    </p>
    <p>
      The FIPS 140-3 Implementation Guidance (
      <SourceLink source={SHARED_SOURCES.ig} label="IG D.S, Scenario 2" />) says a module claims a
      hybrid only if it has an approved ML-KEM, one or more other key-establishment schemes, an
      approved key combiner, a fixed set of combinations, and control of how the secrets are joined.
      The Security Policy records the claim as “KEM-Hybrid” or “KEM-Hybrid-Full” in its
      security-function table (for the “Full” variants the key-establishment method must also be
      listed under AS09.10), and the lab shows compliance for each hybrid set the module implements.
    </p>

    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-xs">
        <caption className="sr-only">
          Where each part of a hybrid key establishment shows on paper, and what “tested” means for
          it
        </caption>
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="p-3 font-semibold">Part</th>
            <th className="p-3 font-semibold">Where it should show on paper</th>
            <th className="p-3 font-semibold">What “tested” means</th>
          </tr>
        </thead>
        <tbody>
          {HYBRID_SCOPE_ROWS.map((r, i) => (
            <tr key={i} className="border-t border-border align-top">
              <td className="p-3 font-semibold text-foreground">
                {r.part}
                <div className="mt-1 font-normal">{IG_DS}</div>
              </td>
              <td className="p-3">{r.paper}</td>
              <td className="p-3">{r.tested}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <p>
      <strong className="text-foreground">Four things the certificate can hide.</strong>
    </p>
    <ol className="list-decimal space-y-2 pl-5">
      <li>
        <strong className="text-foreground">An approved ML-KEM is not a hybrid claim.</strong> If
        the module lacks any of the five items, “Scenario 2 of this IG shall not be claimed”, and a
        non-approved classical scheme must stay in the non-approved mode.
      </li>
      <li>
        <strong className="text-foreground">The module must enforce it.</strong> A non-approved
        classical half such as X25519 is allowed in the approved mode only inside an approved
        hybrid, and the module has to enforce that: “It cannot be enforced by operator guidance
        within the Security Policy.” (An approved classical scheme, such as P-256 under IG D.F, can
        also be used on its own.) <ModuleAnalysisNote>(Module analysis.)</ModuleAnalysisNote>
      </li>
      <li>
        <strong className="text-foreground">A named hybrid is not automatic.</strong> The IG says
        the TLS 1.3 hybrid sets “may meet” Scenario 2 and that the X-Wing hybrid KEM “cannot yet
        meet” it; it adds that the specifications “may still be in draft form and thus subject to
        change”. Check the date of the guidance you rely on.
      </li>
      <li>
        <strong className="text-foreground">There is no end-to-end hybrid test yet.</strong> The IG
        leaves room for one “if available within CAVP” and says it will be updated when it is. Until
        then, each part is evidenced separately.
      </li>
    </ol>

    <p>
      <strong className="text-foreground">In a Common Criteria or EUCC certificate</strong> the
      algorithm claims sit in the Security Target’s cryptographic requirements, not in the assurance
      level. The EU’s agreed cryptographic mechanisms (
      <SourceLink source={SHARED_SOURCES.acm2} label="ECCG ACM v2.0, Note 40" />) say LWE- or
      MLWE-based mechanisms “shouldn’t be used in a standalone way to provide the intended security
      functionality, but should be combined with a well established classical cryptomechanism”, and
      ENISA’s <SourceLink source={SHARED_SOURCES.enisaHybrid} label="survey of hybrid standards" />{' '}
      states that its alignment tables are “indicative, not recommendations”. Ask whether the
      Security Target lists the combined construction or only its components, and what the
      evaluator’s cryptographic assessment covered.{' '}
      <ModuleAnalysisNote>(Module analysis.)</ModuleAnalysisNote>
    </p>

    <H3>Related in the Hub</H3>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        The five conditions in full:{' '}
        <Link to="/learn/hybrid-crypto?tab=learn&section=kem" className="text-primary underline">
          Hybrid Cryptography, Hybrid in a validated module (IG D.S)
        </Link>
      </li>
      <li>
        The two meanings of “hybrid” in FIPS 140-3:{' '}
        <Link
          to="/learn/fips-140-3-certification?tab=learn&section=fips-landscape"
          className="text-primary underline"
        >
          FIPS 140-3 Certification, Today’s landscape and the 2026 horizon
        </Link>
      </li>
      <li>
        Common Criteria and EUCC:{' '}
        <Link
          to="/learn/cc-eucc-certification?tab=learn&section=eucc-pqc-today"
          className="text-primary underline"
        >
          PQC under EUCC today (ACM v2)
        </Link>
      </li>
      <li>
        Where to read a real certificate’s Approved Algorithms:{' '}
        <Link to="/compliance?tab=records" className="text-primary underline">
          Compliance, Product Records
        </Link>
      </li>
      <li>
        What the algorithm test covers:{' '}
        <Link to="/playground/hsm?tab=build&dtab=acvp" className="text-primary underline">
          Validation Workbench
        </Link>
        , run the ML-KEM cases
      </li>
    </ul>
  </Prose>
)

// ── agility-latency ─────────────────────────────────────────────────────────

/** Learn section `agility-latency` */
export const AgilityLatency = () => (
  <Prose>
    <p>
      <strong>Crypto agility</strong> means being able to replace or add algorithms, parameters,
      implementations, providers, accelerators, protocols, keys and operational environments without
      redesigning the product. <strong>Certification</strong> establishes assurance for a precisely
      identified version, boundary or TOE, configuration and evidence set at a point in time. The
      two are not contradictory — but a cryptographic change can alter exactly what was evaluated.
    </p>

    <H3>Three clocks</H3>
    <div className="grid gap-2 sm:grid-cols-3">
      {THREE_CLOCKS.map((c) => (
        <div key={c.clock} className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Clock size={14} className="text-primary" aria-hidden="true" /> {c.clock}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{c.drives}</p>
        </div>
      ))}
    </div>
    <p>
      The three run at different speeds and nobody controls all of them. The engineering goal is not
      “certification-free agility”. It is stable boundaries, reusable evidence, controlled variants,
      automated tests and pre-agreed change classifications, so that each change triggers only the
      reassessment it really needs.
    </p>

    <H3>Designing a certifiable agile architecture</H3>
    <ul className="list-disc space-y-1 pl-5">
      {AGILE_ARCHITECTURE.map((a) => (
        <li key={a}>{a}</li>
      ))}
    </ul>

    <H3>The certification-aware PQC lifecycle</H3>
    <ol className="space-y-1">
      {LIFECYCLE_STEPS.map((s, i) => (
        <li key={s.step} className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold text-foreground">
            {i + 1}. {s.step}
          </p>
          <p className="text-xs text-muted-foreground">{s.detail}</p>
          {i < LIFECYCLE_STEPS.length - 1 ? (
            <ArrowDown
              size={12}
              className="mx-auto mt-1 text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
        </li>
      ))}
    </ol>
    <p>The lifecycle serves three goals that must be kept apart:</p>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <strong>Preserve validity:</strong> never silently mutate the certified artifact or its
        claimed configuration.
      </li>
      <li>
        <strong>Minimise recertification scope:</strong> stable boundaries, evidence reuse and the
        scheme’s legitimate change path.
      </li>
      <li>
        <strong>Introduce PQC promptly:</strong> develop and test the candidate in parallel, but
        activate certification-dependent claims only when official coverage exists.
      </li>
    </ul>

    <H3>The two-lane release train</H3>
    <div className="grid gap-2 sm:grid-cols-3">
      {TWO_LANES.map((l) => (
        <div key={l.lane} className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold text-foreground">{l.lane}</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {l.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <p>
      For the {ANCHOR_SCENARIO.name}
      <FictionalBadge />: the certified lane is firmware {baseline?.firmware}, with its existing
      certificates and listings; the candidate lane is firmware {candidate?.firmware}. Customers who
      need PQC for testing can run the candidate — described exactly as what it is — while
      production deployments that depend on a certificate stay on the certified lane until each
      authority publishes coverage for {candidate?.firmware}.
    </p>
    <Callout tone="error" title="Never do this">
      <p>
        Where a product must expose PQC before certification finishes, say precisely that the
        feature is experimental, non-approved-mode or outside the certified configuration — and{' '}
        <strong>only</strong> if the scheme and the architecture allow that separation. Never weaken
        approved-mode enforcement, and never use a disclaimer to escape the certified boundary.
      </p>
    </Callout>

    <H3>Route decision aid</H3>
    <p>
      Each scheme has its own way to handle a change. You do not need the full route tables to plan
      — you need the questions that decide which route is even possible. The lab proposes; the
      authority decides.
    </p>
    <div className="space-y-3">
      {ROUTE_DECISION_AID.map((r) => (
        <div key={r.scheme} className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold text-foreground">
            {r.scheme} · <SourceLink source={r.source} label="source" />
          </p>
          <ol className="mt-2 space-y-1">
            {r.steps.map((s) => (
              <li key={s.ask} className="text-xs">
                <span className="text-foreground">{s.ask}</span>{' '}
                <span className="text-muted-foreground">→ {s.then}</span>
              </li>
            ))}
          </ol>
          {r.caveat ? <p className="mt-2 text-[11px] text-muted-foreground">{r.caveat}</p> : null}
        </div>
      ))}
    </div>
    <p className="text-xs text-muted-foreground">
      Route definitions: CMVP Management Manual v2.7 (9 April 2026) §7.1; CCDB-015 v3.1 (29 February
      2024); CIR (EU) 2025/2462. <AsOf /> Link to the live documents rather than memorising the
      tables — they change.
    </p>

    <H3>What “keeping the certificate valid” means, by scheme</H3>
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="p-3 font-semibold">Scheme</th>
            <th className="p-3 font-semibold">Safe continuity pattern</th>
            <th className="p-3 font-semibold">PQC limitation</th>
          </tr>
        </thead>
        <tbody>
          {MAINTAIN_VALID.map((m) => (
            <tr key={m.scheme} className="border-t border-border align-top">
              <td className="p-3 font-semibold text-foreground">{m.scheme}</td>
              <td className="p-3">{m.pattern}</td>
              <td className="p-3">{m.limit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <H3>The honest conclusion</H3>
    <p>
      Recent improvements reduce avoidable friction — structured data, repeated variants, limited
      fixes, new operational environments, reusable evidence. They do not yet give any product a
      cross-scheme continuous-certification pipeline. NIST is furthest along in standardised
      electronic exchange; CC and EUCC are strongest in formal evidence reuse and assurance
      continuity; PCI handles changes through program-specific deltas with less public evidence of
      machine-readable exchange. A major PQC addition can still need substantial re-evaluation in
      all of them.
    </p>
    <p>
      So the goal is not “the certificate never changes”. It is{' '}
      <strong>continuous, truthful coverage</strong>: at every release, anyone can tell which
      artifact and which mechanisms are covered, which are being evaluated, and which are outside
      scope.
    </p>
  </Prose>
)

// ── new-platform ────────────────────────────────────────────────────────────

const MANUAL_LINK = (label: string) => (
  <SourceLink source={SHARED_SOURCES.cmvpManual} label={label} />
)

const PLATFORM_ROUTE_ROWS: readonly {
  situation: ReactNode
  route: ReactNode
  result: ReactNode
}[] = [
  {
    situation:
      'The same binary moved, or unmodified source code recompiled, for a platform not on the certificate',
    route: <>Vendor affirmation (VAOE; {MANUAL_LINK('Management Manual 7.9')})</>,
    result: (
      <>
        The vendor “bears all responsibility”. “The CMVP makes no statement as to the correct
        operation of the module or the security strengths of the generated keys” in an environment
        not listed on the certificate, and the Security Policy must say so. Not available when
        Physical Security is validated at Level 2 or higher; it applies to software modules, and to
        firmware or hybrid modules at Physical Security Level 1.
      </>
    ),
  },
  {
    situation:
      'You want the new environment on the certificate, with no module change beyond non-security-relevant edits needed to run there',
    route: <>Operational Environment Update (OEUP; {MANUAL_LINK('Management Manual 7.1.7')})</>,
    result: (
      <>
        “This shall require CAVP-testing the algorithm validations on the new/modified OEs”,
        entropy-source validation covering the new environments where applicable, and the full
        regression test. Code changes only if non-security-relevant and needed to run there. The
        CMVP then “provides the same assurance as the original OE(s)”.
      </>
    ),
  },
  {
    situation: 'Other source changes are needed to run there',
    route: <>Revalidation (UPDT, NSRL; {MANUAL_LINK('Management Manual 7.1')})</>,
    result: (
      <>
        “This is not porting or vendor affirming the OE” but putting the new environment onto the
        certificate as part of a changed module.
      </>
    ),
  },
]

/** Learn section `new-platform` */
export const NewPlatform = () => (
  <Prose>
    <p>
      A validation is a statement about one module on the environments it was tested on. Move the
      module, and the statement stops where the testing stopped.
    </p>

    <p>
      <strong className="text-foreground">Why the environment is part of the claim.</strong> The
      FIPS 140-3 Implementation Guidance (
      <SourceLink source={SHARED_SOURCES.ig} label="IG 2.3.A" />) puts it plainly: “The validation
      certificate serves as a benchmark for the configuration and operational environment used
      during the validation testing.” The rule reaches down to the algorithm certificates the module
      uses. If an implementation was tested on a 32-bit processor, “a claim cannot be made that the
      implementation also runs on different bit size processors”, and likewise for another operating
      system. For a software module, the algorithm implementation “must have been tested on every
      operating environment claimed by the software module.”
    </p>

    <p>
      <strong className="text-foreground">Three routes when the environment changes.</strong>
    </p>
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-xs">
        <caption className="sr-only">
          Three routes when the operating environment of a validated module changes, and what each
          one gives
        </caption>
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="p-3 font-semibold">Situation</th>
            <th className="p-3 font-semibold">Route</th>
            <th className="p-3 font-semibold">What you get, and what you do not</th>
          </tr>
        </thead>
        <tbody>
          {PLATFORM_ROUTE_ROWS.map((r, i) => (
            <tr key={i} className="border-t border-border align-top">
              <td className="p-3 text-foreground">{r.situation}</td>
              <td className="p-3 font-semibold text-foreground">{r.route}</td>
              <td className="p-3">{r.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <p>
      <strong className="text-foreground">Hardware acceleration built into the processor.</strong>{' '}
      (This section is about functions in a general-purpose processor that a software or firmware
      module can use. A dedicated accelerator built into a hardware module is part of that module’s
      own design and is covered by the rules for hardware modules, not by the IG’s list below; for
      example, algorithm logic written in HDL on an FPGA with no underlying “OS” is validated in the
      FPGA as hardware, not as firmware (
      <SourceLink source={SHARED_SOURCES.ig} label="IG 2.3.A" />
      ). <ModuleAnalysisNote>Module analysis.</ModuleAnalysisNote>) The IG (
      <SourceLink source={SHARED_SOURCES.ig} label="IG 2.3.C" />) separates two cases. A Processor
      Algorithm Acceleration (PAA) function is “simply a mathematical construct”; a Processor
      Algorithm Implementation (PAI) is a complete cryptographic algorithm in hardware. Where a
      software or firmware module can run with or without a PAA, “the accelerated algorithms shall
      be tested in both software/firmware only execution and PAA execution”, and the same holds for
      a PAI. The chip’s part number or version, family and microarchitecture go in the submission,
      and the accelerator must be a “known” one: the IG’s list (19 August 2026) names accelerators
      for AES and SHA sub-functions on Intel, AMD, Arm and IBM Power processors, for AES, DES and
      SHA sub-functions on Oracle SPARC, and IBM’s CPACF, a full implementation of AES (ECB, CBC),
      TDES, SHA-1 and SHA-2. It names no accelerator for ML-KEM, ML-DSA or SLH-DSA.{' '}
      <ModuleAnalysisNote>(Module analysis from reading the list.)</ModuleAnalysisNote> New ones are
      added by asking the CMVP, with evidence the lab has verified. The testing can be done on the
      same environment, or without the accelerator on one environment and with it on another
      “similar” one, and then the lab has to justify that the environments are “similar”; a 64-bit
      environment “is not ‘similar’ to a 32 bit-OE”, and the CMVP can refuse the claim.
    </p>

    <p>
      <strong className="text-foreground">The Common Criteria view.</strong> ENISA’s
      assurance-continuity guidance (
      <SourceLink source={SHARED_SOURCES.enisaContinuity} label="change scenarios" />) sorts a
      platform change by what the Security Target says about the platform. If the new platform does
      not meet the stated assumptions, the change is “Always major regardless of the assurance level
      – requires re-evaluation”. A move between near-identical operating system releases is rated
      Minor; a change from Intel to Arm hardware is rated Major because of “Changes in boot chain,
      memory model, crypto acceleration”. And a migration that causes “measurable changes to timing
      or resource behaviour” is “Always major at AVA_VAN.4 and 5, due to side-channel attacks”; at
      lower assurance levels it “may be minor if no impact is shown”.
    </p>

    <p>
      <strong className="text-foreground">
        What to ask a vendor who says “it runs the same on our new hardware”.
      </strong>{' '}
      Is the new platform on the certificate, or only affirmed by the vendor? Which route was used?
      Was the accelerated path tested, and is it a known accelerator? Were the algorithm
      certificates re-tested on that platform, and the entropy source? If a Common Criteria
      certificate exists, does the Security Target’s platform assumption still hold?
    </p>

    <H3>Related in the Hub</H3>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        Try it:{' '}
        {/* The module keeps its open tab and step in state read once on load, so a link to its own
            workshop must reload the page for the tab and step in the URL to take effect. */}
        <Link
          to="/learn/crypto-product-certification?tab=workshop&step=3"
          reloadDocument
          className="text-primary underline"
        >
          PQC change analyzer, case “Add an Arm operating environment”
        </Link>
      </li>
      <li>
        The submission routes (OEUP, VAOE):{' '}
        <Link
          to="/learn/fips-140-3-certification?tab=learn&section=fips-route-table"
          className="text-primary underline"
        >
          FIPS 140-3 Certification, CMVP submission routes
        </Link>
        ; timing and power:{' '}
        <Link
          to="/learn/fips-140-3-certification?tab=learn&section=fips-attack-evidence"
          className="text-primary underline"
        >
          FIPS 140-3 Certification, side-channel and fault attacks
        </Link>
      </li>
      <li>
        Entropy-source validation for new environments (IG 9.3.A):{' '}
        <Link
          to="/learn/entropy-randomness?tab=learn&section=esv"
          className="text-primary underline"
        >
          Entropy &amp; Randomness, CMVP ESV Process
        </Link>
      </li>
      <li>
        The Common Criteria equivalent:{' '}
        <Link
          to="/learn/cc-eucc-certification?tab=learn&section=cc-continuity"
          className="text-primary underline"
        >
          Common Criteria, EUCC &amp; eIDAS Certification, assurance continuity
        </Link>
      </li>
      <li>
        The tested operating environments listed on a real certificate:{' '}
        <Link to="/compliance?tab=records" className="text-primary underline">
          Compliance, Product Records
        </Link>
      </li>
    </ul>
  </Prose>
)

// ── transition-deadlines ────────────────────────────────────────────────────

const MANDATE_TONE: Record<MarketDeadlineRow['mandate'], string> = {
  HARD: 'text-status-error',
  SOFT: 'text-status-warning',
  DRAFT: 'text-muted-foreground',
  NONE: 'text-muted-foreground',
  UNLABELLED: 'text-muted-foreground',
}

const DeadlineCheck = ({ rows }: { rows: MarketDeadlineRow[] }) => {
  const [market, setMarket] = useState(rows[0]?.market ?? '')
  const [months, setMonths] = useState('')
  const row = rows.find((r) => r.market === market)
  const n = Number.parseInt(months, 10)
  const result =
    row && Number.isFinite(n) && n > 0 ? landingVersusDeadline(new Date(), n, row.year) : undefined
  const landingLabel = result?.landing.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">Deadline check for the PQC lane</p>
      <p className="text-xs text-muted-foreground">
        Pick a market and enter <strong>your lab’s</strong> estimate, in months, for the PQC lane’s
        route. The Hub publishes no scheme durations — an unsourced duration is exactly the kind of
        claim this module teaches you to avoid.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FilterDropdown
          label="Market"
          ariaLabel="Market"
          items={rows.map((r) => ({ id: r.market, label: r.market }))}
          selectedId={market}
          onSelect={setMarket}
          hideDefaultOption
        />
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <label htmlFor="cert-deadline-months">Lab estimate (months)</label>
          <Input
            id="cert-deadline-months"
            type="number"
            min={1}
            max={120}
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="w-32"
          />
        </div>
      </div>
      {row && result ? (
        <p className="text-sm text-foreground" aria-live="polite">
          Starting now, the PQC lane would land around <strong>{landingLabel}</strong>. {row.market}
          ’s deadline year is <strong>{row.year}</strong> (
          {MANDATE_LABEL[row.mandate].toLowerCase()}).{' '}
          {result.verdict === 'before'
            ? 'That is before the deadline year — keep the certified lane valid until coverage is published.'
            : result.verdict === 'same-year'
              ? 'That is in the deadline year itself — check the exact date on the Timeline and plan for slippage.'
              : 'That is after the deadline year. The deadline does not open a shorter route: start earlier, shrink the change, or tell the customer now.'}
        </p>
      ) : null}
    </div>
  )
}

/** Learn section `transition-deadlines` */
export const TransitionDeadlines = () => {
  const rows = useMemo(() => marketDeadlineRows(), [])
  return (
    <Prose>
      <p>
        A PQC release is pushed by dates. Two kinds of date must stay visibly separate, because they
        do different things:
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Gavel size={14} className="text-primary" aria-hidden="true" /> Market / policy
            deadlines
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Why the customer wants PQC: a government or regulator’s migration date. They create
            urgency. They do not change any certification route.
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Landmark size={14} className="text-primary" aria-hidden="true" /> Scheme clocks
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            What the certification system itself is doing: transitions, sunsets and review cycles
            that change which records and versions count.
          </p>
        </div>
      </div>

      <H3>Market and policy deadlines — live from the Hub timeline</H3>
      <p>
        These rows are read when this page loads from the Hub’s timeline data (each country’s
        canonical PQC deadline and its curated binding status). They are not typed into this module,
        so they stay in step with the{' '}
        <Link to="/timeline" className="text-primary underline-offset-2 hover:underline">
          Timeline
        </Link>
        . “Binding mandate” means law, regulation, executive order or binding directive; “guidance /
        roadmap target” means it is not.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[520px] text-left text-xs" aria-label="Market deadlines">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="p-3 font-semibold">Market</th>
              <th className="p-3 font-semibold">Deadline year</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Anchor customer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.market} className="border-t border-border">
                <td className="p-3 text-foreground">{r.market}</td>
                <td className="p-3 font-semibold text-foreground">{r.year}</td>
                <td className={`p-3 ${MANDATE_TONE[r.mandate]}`}>{MANDATE_LABEL[r.mandate]}</td>
                <td className="p-3">
                  {r.customers.length
                    ? r.customers
                        .map(
                          (id) => ANCHOR_SCENARIO.customers.find((c) => c.id === id)?.label ?? id
                        )
                        .join(', ')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        The payment processor and the secure-element manufacturer have no row of their own: payment
        requirements come from PCI SSC and the brands (the v5.0 announcement and the listing
        definitions name no PQC deadline, <AsOf />
        ), and the chip maker inherits the deadlines of the programmes it sells into.
      </p>

      <H3>Scheme clocks</H3>
      <ul className="space-y-2">
        {SCHEME_CLOCKS.map((c) => (
          <li key={c.id} className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-foreground">
              {c.when} · {c.scheme}
            </p>
            <p className="mt-1 text-xs">{c.what}</p>
            <p className="mt-1 flex flex-wrap gap-x-2 text-[11px]">
              {c.sources.map((s) => (
                <SourceLink key={s.id} source={s} label={s.id} />
              ))}
            </p>
          </li>
        ))}
      </ul>
      <p>
        The first clock has already struck: on 21/22 September 2026 every FIPS 140-2 certificate
        moved to the Historical list. Those modules may still be bought and used for existing
        systems, but NIST says Federal Agencies should not include them in new systems. That is what
        a scheme transition looks like from the inside. It is not a TRNS event either: the CMVP’s
        TRNS route exists only for published CMVP <em>algorithm</em> transitions (for example the
        2024 non-SP 800-56Brev2 RSA key-encapsulation transition, Management Manual §7.1.12).
      </p>

      <H3>Urgency without shortcuts</H3>
      <Callout tone="warning" title="A market deadline creates urgency, but no shortcut">
        <ul className="list-disc space-y-1 pl-4">
          {NO_SHORTCUT.map((n) => (
            <li key={n.deadline}>
              <strong>Not a {n.deadline}:</strong> {n.notAShortcut}{' '}
              <SourceLink source={n.source} label="source" />
            </li>
          ))}
        </ul>
      </Callout>
      <p>
        Three more shortcuts belong here.{' '}
        <strong>SP 1800-40 does not let vendors self-certify</strong>: its Volume B draft
        demonstrates an accredited lab making a first submission to the CMVP (
        <SourceLink source={SHARED_SOURCES.sp180040b} />
        ). <strong>Executive Order 14412 has not already changed the CMVP</strong>; its process
        revision is due around 19 December 2026. And{' '}
        <strong>a deadline is never certification evidence</strong> — neither is a
        Modules-in-Process entry, nor a PCI PQC flag.
      </p>
      <p>
        The plan that works is the two-lane release: the certified lane stays valid while the PQC
        lane moves through each scheme’s real route, and the timing question becomes “when must the
        PQC lane <em>start</em>?” rather than “which rule can we bend?”.
      </p>
      <H3>Worked example: the Orrin N7 against its dates</H3>
      <p>
        Put the two kinds of date on one line for the {ANCHOR_SCENARIO.name}
        <FictionalBadge />:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        {rows
          .filter((r) => r.customers.length)
          .map((r) => (
            <li key={r.market}>
              <strong>{r.market}:</strong> deadline year {r.year},{' '}
              {MANDATE_LABEL[r.mandate].toLowerCase()} — the urgency behind the{' '}
              {r.customers
                .map((id) => ANCHOR_SCENARIO.customers.find((c) => c.id === id)?.label ?? id)
                .join(' and ')}
              .
            </li>
          ))}
        <li>
          <strong>Executive Order 14412 (≈ 19 December 2026):</strong> the CMVP process may get
          faster, but its content is unknown. Plan on today’s Management Manual; treat any speed-up
          as upside.
        </li>
        <li>
          <strong>PTS HSM v4.x requirements approval, June 2027 (listing table):</strong> the
          listing’s expiry table gives HSM v4.x “Expiration of Requirements Approval” June 2027 and
          “Expiration of Device Models” April 2033. The v5.0 announcement lists multi-tenant,
          remote-administration and post-quantum-definition changes. How a change to an approved
          device is handled is for PCI’s current Device Testing and Approval Program Guide — an open
          question in this v1.
        </li>
        <li>
          <strong>EUCC transitional issuance rules, through 31 December 2027:</strong> Article 3(2)
          permits EUCC certificates using the specified older CC/CEM editions; Article 3(3)
          separately permits newer-standard certificates claiming the specified older PPs. This is
          not a global CC deadline or automatic expiry date for existing certificates. Check the
          planned evaluation basis and whether Article 3(4)’s conditional older-PP provision applies
          to the device. <SourceLink source={SHARED_SOURCES.eucc3144} />
        </li>
      </ul>
      <p>
        None of these dates moves the PQC change into a narrower route. What they change is{' '}
        <em>when</em> each lane must start, and which requirements version it will meet.
      </p>
      <DeadlineCheck rows={rows} />
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Scale size={14} aria-hidden="true" /> The capstone’s artifact 12 asks you to put both lanes
        and these deadlines in one release matrix.
      </p>
    </Prose>
  )
}

// ── change-routes-detail (optional) ─────────────────────────────────────────

/** Learn section `change-routes-detail` */
export const ChangeRoutesDetail = () => (
  <Prose>
    <p>
      “Incremental” has two meanings that must not be conflated.{' '}
      <strong>Incremental evidence delivery</strong> sends a large evidence package in validated
      pieces and corrects it as you go — it improves workflow.{' '}
      <strong>Incremental certification scope</strong> reuses prior assurance and tests only the
      impact of a bounded change — it depends on formal change classification and on the authority
      accepting it.
    </p>

    <H3>FIPS 140-3 / CMVP — the routes that matter for PQC</H3>
    <p>
      The Management Manual v2.7 (<SourceLink source={SHARED_SOURCES.cmvpManual} />, 9 April 2026,
      §7.1) defines the submission scenarios; the full table is in <em>CMVP submission routes</em>{' '}
      in the{' '}
      <Link
        to="/learn/fips-140-3-certification"
        className="text-primary underline-offset-2 hover:underline"
      >
        FIPS 140-3 Certification
      </Link>{' '}
      module. For a PQC addition, five are decisive:
    </p>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <strong>ALG</strong> — only for “a previously vendor affirmed or allowed algorithm that was
        available in the approved mode now has CAVP testing available and already meets the
        algorithm requirements (e.g., self-tests) and module requirements (e.g., approved service
        indicator)”. “Code or configuration changes are not permitted.”
      </li>
      <li>
        <strong>UPDT</strong> — “less than 30% of security changes”, assessed separately in each of
        five categories: functions / algorithms, SSPs, services, self-tests, FSM states. The CMVP
        may decide the change is a Full Submission.
      </li>
      <li>
        <strong>CVE</strong> — vulnerability and security-relevant maintenance fixes; changes “shall
        not introduce new features or cryptography”.
      </li>
      <li>
        <strong>TRNS</strong> — only for changes made solely in response to a published CMVP
        algorithm transition (§7.1.12). A “soft” transition permits no changes.
      </li>
      <li>
        <strong>FS</strong> — a Full Submission, including the INTU sub-type (“Br1 Update to
        Interim”) that follows an interim validation.
      </li>
    </ul>

    <H3>Common Criteria / CCRA — assurance continuity</H3>
    <p>
      Under CCDB-015 v3.1 (<SourceLink source={SHARED_SOURCES.ccdb014} />
      ), the developer proposes and documents the impact in an Impact Analysis Report; the
      certification body classifies it.
    </p>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <strong>Maintenance</strong> (minor change): an optional subset evaluation and partial ETR,
        a maintenance addendum — with “no implied issuance of an updated certificate” — and a
        published Maintenance Report.
      </li>
      <li>
        <strong>Re-evaluation</strong> (major change): prior results reused where still valid; a new
        ETR, certification report and certificate. The probable route when PQC changes the ST
        claims, the TSF interfaces or the vulnerability analysis.
      </li>
      <li>
        <strong>Re-assessment</strong> (unchanged TOE, new attack landscape): certificate validity
        can be extended — but it cannot certify new PQC code.
      </li>
    </ul>
    <p>
      Watch for “a set of minor changes that together have a major impact”: shipping PQC as five
      small releases does not make it minor.
    </p>

    <H3>EUCC</H3>
    <p>
      EUCC uses CC evaluation evidence but sets its own continuity rules in EU law. Under CIR
      2025/2462 (
      <SourceLink source={SHARED_SOURCES.eucc2462} />
      ), a minor change leads to a maintenance report, and “no new certificate shall be issued”; a
      subset evaluation or partial ETR is optional. After a successful re-assessment, the
      certification body confirms the certificate or issues one with an extended expiry. Three ENISA
      aids help classify changes — and all three are <strong>guidelines</strong>, not
      state-of-the-art documents or law:
    </p>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        the change-scenarios guideline, v1, October 2025, focused on AVA work{' '}
        <PlainSource>
          ENISA, EUCC assurance-continuity change scenarios v1, October 2025
        </PlainSource>
        ;
      </li>
      <li>
        the product-series methodology, v1 of July 2025{' '}
        <PlainSource>ENISA, EUCC product-series methodology v1, July 2025</PlainSource>;
      </li>
      <li>
        the vulnerability-management guideline, v1.1 of January 2025{' '}
        <PlainSource>ENISA, EUCC vulnerability-management guideline v1.1, January 2025</PlainSource>
        .
      </li>
    </ul>
    <p>
      Product-series planning improves reuse across related variants; it does not make a materially
      different PQC implementation minor by definition.
    </p>

    <H3>PCI PTS HSM — changes to an approved device</H3>
    <p>
      How PCI routes a change to an approved device — what a PCI-recognized lab scopes and what PCI
      SSC lists — is for the Device Testing and Approval Program Guide. The Document Library lists
      it on 18 May 2026; the feed gives its title and date and no version number. This module does
      not use that document’s content, so it does not teach PCI’s change categories.
    </p>
    <Callout tone="warning" title="Open question — check the current document">
      <p>
        How PTS HSM v5.0 changes are routed today is unverified here. No source this module reads
        shows a machine-readable evidence exchange with PCI SSC; do not assume one.
      </p>
    </Callout>

    <H3>Cross-scheme example: add ML-DSA signing to the anchor HSM</H3>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <strong>FIPS:</strong> obtain ML-DSA algorithm testing, then ask the lab whether the change
        fits UPDT. ALG works only if nothing in code or configuration changes and its preconditions
        were already met; otherwise a Full Submission.
      </li>
      <li>
        <strong>CC-based certification — check the issuing scheme:</strong> prepare the impact
        analysis required by that scheme; discuss re-evaluation if the new service changes the ST,
        the SFRs, the TSF or the vulnerability analysis materially.
      </li>
      <li>
        <strong>PCI:</strong> ask a recognized lab to scope a delta against the device’s
        requirements version; expect a broader evaluation for a new functional module.
      </li>
      <li>
        <strong>Claims:</strong> the old certificates and listing stay mapped to firmware{' '}
        {baseline?.firmware} until each authority publishes coverage for {candidate?.firmware}.
      </li>
    </ul>
    <p className="text-xs text-muted-foreground">
      Try it interactively in the optional <strong>PQC change analyzer</strong> workshop step.{' '}
      <AsOf />
    </p>
  </Prose>
)

// ── electronic-exchange (optional) ──────────────────────────────────────────

/** Learn section `electronic-exchange` */
export const ElectronicExchange = () => (
  <Prose>
    <p>
      “Automation” is used loosely in certification talk. There are four different electronic
      mechanisms in the NIST ecosystem, and they do different things:
    </p>
    <ol className="list-decimal space-y-2 pl-5">
      <li>
        <strong>Test-vector protocol.</strong> ACVP exchanges machine-readable algorithm
        capabilities, vectors, responses and verdicts (
        <SourceLink source={SHARED_SOURCES.acvp} />
        ). It speeds up algorithm testing, not module validation.
      </li>
      <li>
        <strong>Specialised validation API.</strong> The ESV server accepts entropy-source and RBG
        submissions through a protocol “based on ACVP” (
        <SourceLink source={SHARED_SOURCES.esv} />
        ). A reusable entropy validation avoids repeating that work in every module submission.
      </li>
      <li>
        <strong>Structured submission record.</strong> The CMVP “uses JSON as the submission format”
        for the Module Information Structure, to automate verification and consistency checks and to
        populate parts of the Security Policy from one source.
      </li>
      <li>
        <strong>Broader evidence exchange (draft).</strong> SP 1800-40B, an Initial Public Draft of
        15 April 2026, demonstrates JSON-schema certificate requests and evidence catalogues sent by
        an accredited lab (<SourceLink source={SHARED_SOURCES.sp180040b} />
        ). It covers <strong>first (full) submissions only</strong>; CVE and added-OE submissions
        are named as future phases. Comments closed on 1 June 2026.
      </li>
    </ol>

    <Callout tone="info" title="The caveat that goes with all four">
      <p>
        Machine-readable evidence can reduce transcription, completeness errors, duplicate data and
        review handling time. It does not prove the evidence is sufficient, remove evaluator
        judgement, expand a certificate’s scope, or turn a draft protocol into an approved
        validation.
      </p>
    </Callout>

    <H3>Where the vendor sits today</H3>
    <p>
      Vendors already produce most of the raw material: the implementation inventory, Security
      Policy inputs, source and build evidence, design documents, change-impact analysis, test
      access and remediation responses. But the accredited lab tests and submits, and the evidence
      catalogues in the SP 1800-40B demonstration are lab submissions. Vendor evidence can be
      structured; the lab still verifies it and stays in the assurance chain.
    </p>
    <p>
      “First-party testing” by product or service providers appears in the SP 1800-40A preliminary
      draft of 2023 (<SourceLink source={SHARED_SOURCES.sp180040a} />) and the ACMVP project
      description — as a question NIST is exploring, not an entitlement. It is <strong>not</strong>{' '}
      in SP 1800-40B. Status reports on the project history: CSWP 37A (
      <SourceLink source={SHARED_SOURCES.cswp37a} />, final, 16 March 2026) and CSWP 37B (
      <SourceLink source={SHARED_SOURCES.cswp37b} label="NIST CSWP 37B" />, final, 30 September
      2026).
    </p>

    <H3>A future-facing model — clearly labelled as one</H3>
    <ol className="space-y-1">
      {[
        [
          'Vendor engineering system',
          'Source and build identity, capabilities, automated tests, evidence metadata — handed off in a structured, signed form.',
        ],
        [
          'Accredited lab workspace',
          'Independent testing, inspection, evidence review and scoped findings — submitted electronically.',
        ],
        [
          'Validation or certification authority',
          'Automated completeness and consistency checks, expert review, publication.',
        ],
      ].map(([t, d], i, arr) => (
        <li key={t} className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold text-foreground">{t}</p>
          <p className="text-xs text-muted-foreground">{d}</p>
          {i < arr.length - 1 ? (
            <ArrowDown
              size={12}
              className="mx-auto mt-1 text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
        </li>
      ))}
    </ol>
    <p>
      Even if vendors one day submit some evidence directly, independence, provenance, tamper
      evidence, access control, confidentiality, lab attestation and authority review would all
      still need defining.
    </p>

    <H3>Outside NIST</H3>
    <p>
      Nothing in the sources reviewed for this module establishes a machine interface for Common
      Criteria, EUCC or PCI submissions. PCI device submissions use DOCX forms — the Attestation of
      Validation, Administrative Change Request, Device Attestation and Vendor Release Agreement. Do
      not present NIST JSON fields as a portable standard for the other schemes.
    </p>
    <p className="text-xs text-muted-foreground">
      The optional <strong>Evidence exchange demo</strong> workshop step walks a synthetic version
      of this flow — clearly marked as a teaching model. <AsOf />
    </p>
  </Prose>
)
