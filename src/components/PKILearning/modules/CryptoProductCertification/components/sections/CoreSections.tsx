// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Core (Shared author)
/**
 * Common core (plan r2 Common Core 1–2): `four-questions` and
 * `scope-before-level`. CertIntroduction wraps each body in <LearnSection>;
 * render only the body here. Also exports the small citation / callout
 * helpers the Shared author's other files reuse.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, CalendarClock, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { StandardRef } from '@/data/standardsRegistry'
import {
  AS_OF_LABEL,
  CORE_SOURCES,
  DISTINCT_TERMS,
  FOUR_QUESTIONS,
  SCOPE_CHECKLIST,
  SHORTCUTS,
} from '../../data/coreData'
import {
  ANCHOR_COMPONENT_DETAILS,
  ANCHOR_RELEASES,
  ANCHOR_SCENARIO,
} from '../../data/anchorScenario'

// ── Shared helpers (used by SharedSections and the Shared workshops) ────────

/** Inline citation to a library row (opens the Library entry). */
export const SourceLink = ({ source, label }: { source: StandardRef; label?: string }) => (
  <Link
    to={source.deepLink}
    className="text-primary underline-offset-2 hover:underline"
    title={source.title}
  >
    {label ?? source.title}
  </Link>
)

/** Plain-text citation for a document with no library row yet (build spec §6.2). */
export const PlainSource = ({ children }: { children: ReactNode }) => (
  <span className="text-muted-foreground">({children})</span>
)

/** "As of 24 September 2026" marker for a version-sensitive claim (build spec §6.5). */
export const AsOf = ({ label = AS_OF_LABEL }: { label?: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
    <CalendarClock size={11} aria-hidden="true" />
    {label}
  </span>
)

type CalloutTone = 'info' | 'warning' | 'success' | 'error'

const TONE = new Map<CalloutTone, { box: string; icon: ReactNode }>([
  [
    'info',
    {
      box: 'border-primary/20 bg-primary/5',
      icon: <Info size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />,
    },
  ],
  [
    'warning',
    {
      box: 'border-status-warning/30 bg-status-warning/10',
      icon: (
        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0 text-status-warning"
          aria-hidden="true"
        />
      ),
    },
  ],
  [
    'success',
    {
      box: 'border-status-success/30 bg-status-success/10',
      icon: (
        <CheckCircle2
          size={16}
          className="mt-0.5 shrink-0 text-status-success"
          aria-hidden="true"
        />
      ),
    },
  ],
  [
    'error',
    {
      box: 'border-status-error/30 bg-status-error/10',
      icon: <XCircle size={16} className="mt-0.5 shrink-0 text-status-error" aria-hidden="true" />,
    },
  ],
])

export const Callout = ({
  tone = 'info',
  title,
  children,
}: {
  tone?: CalloutTone
  title?: string
  children: ReactNode
}) => {
  const t = TONE.get(tone) ?? TONE.get('info')
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${t?.box ?? ''}`}>
      {t?.icon}
      <div className="min-w-0 space-y-1 text-sm text-foreground/90">
        {title ? <p className="font-semibold text-foreground">{title}</p> : null}
        {children}
      </div>
    </div>
  )
}

/** Small "fictional" badge that must accompany the anchor product's name. */
export const FictionalBadge = () => (
  <span className="ml-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
    {ANCHOR_SCENARIO.fictionalLabel}
  </span>
)

const Prose = ({ children }: { children: ReactNode }) => (
  <div className="space-y-4 text-sm leading-relaxed text-foreground/85">{children}</div>
)

const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="pt-2 text-base font-semibold text-foreground">{children}</h3>
)

// ── four-questions ──────────────────────────────────────────────────────────

/** Learn section `four-questions` */
export const FourQuestions = () => (
  <Prose>
    <Callout tone="warning" title="Read this first">
      <p>
        FIPS 140-3, Common Criteria, EUCC and PCI PTS HSM answer different assurance questions. A
        product may need more than one. A certificate applies only to the named version,
        configuration, security boundary or TOE, claims and conditions shown in its official record.
      </p>
    </Callout>

    <p>
      Most confusion about certification starts with one sentence: <em>“our HSM is certified.”</em>{' '}
      Certified by whom, for what, and which part of it? This module teaches each scheme by the{' '}
      <strong>single question its certificate answers</strong>. Once you know the question, you also
      know which questions a certificate leaves open — and those are the ones a buyer, an evaluator
      or an auditor will ask next.
    </p>

    <p>
      Throughout the module we follow one product: the <strong>{ANCHOR_SCENARIO.name}</strong>
      <FictionalBadge />, {ANCHOR_SCENARIO.description.toLowerCase()}. It sells into four markets —{' '}
      {ANCHOR_SCENARIO.customers.map((c) => c.label.toLowerCase()).join(', ')} — and its vendor is{' '}
      {ANCHOR_SCENARIO.change.toLowerCase()}. Every scheme sees a different object inside this one
      product.
    </p>

    <H3>One question per scheme</H3>
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="p-3 font-semibold">Scheme</th>
            <th className="p-3 font-semibold">The question its certificate answers</th>
            <th className="p-3 font-semibold">What is evaluated</th>
            <th className="p-3 font-semibold">Who tests · who decides</th>
            <th className="p-3 font-semibold">What you read</th>
          </tr>
        </thead>
        <tbody>
          {FOUR_QUESTIONS.map((q) => (
            <tr key={q.id} className="border-t border-border align-top">
              <td className="p-3 font-semibold text-foreground">
                {q.scheme}
                <div className="mt-1 font-normal">
                  <SourceLink source={q.source} label="source" />
                </div>
              </td>
              <td className="p-3 text-foreground">{q.question}</td>
              <td className="p-3">{q.object}</td>
              <td className="p-3">
                {q.tester} · {q.decider}
              </td>
              <td className="p-3">{q.record}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <p>
      Notice what the table does <strong>not</strong> contain: a column that ranks the schemes.
      There is no exchange rate between a FIPS level, an EAL and a PCI approval, because they
      measure different things about different objects. A FIPS 140-3 validation says a defined{' '}
      <em>module</em> meets FIPS requirements (<SourceLink source={CORE_SOURCES.fips1403} />, as
      modified by SP 800-140A–F). A Common Criteria certificate says a <em>TOE</em> met the claims
      in its Security Target, to the depth of a named assurance package (
      <SourceLink source={CORE_SOURCES.ccPart3} />
      ). EUCC does the same under EU law (
      <SourceLink source={CORE_SOURCES.eucc} />
      ), with two assurance levels: <em>substantial</em> (AVA_VAN 1–2) and <em>high</em> (AVA_VAN
      3–5). PCI SSC approves a payment <em>device</em>, and separately its standards assess the{' '}
      <em>entities</em> that run payment operations.
    </p>

    <H3>PCI is two questions, not one</H3>
    <p>
      The PCI row is the one learners most often collapse. <strong>PTS HSM approval</strong> covers
      the device — model, hardware version, firmware version — “up to the point of initial
      deployment”, after a PCI-recognized lab evaluates it and PCI SSC reviews and lists it (
      <SourceLink source={CORE_SOURCES.ptsV5} />
      ). <strong>PIN Security, P2PE and KMO</strong> assess how an acquirer, a solution provider or
      a key-injection facility <em>operates</em>. The same {ANCHOR_SCENARIO.name} can be a listed
      device, a component of a processor’s PIN environment, and the decryption HSM in a P2PE
      solution — three different assessments, one box.
    </p>

    <Callout tone="info" title="The nuance that stops learners over-correcting">
      <p>
        A FIPS 140-3 Level 3 HSM does <strong>not</strong> obtain PTS HSM approval. But PCI PIN
        Security v3.1 Requirement 1-3 accepts HSMs that are “FIPS140-2 or FIPS 140-3 Level 3 or
        higher certified, or PCI approved” (<SourceLink source={CORE_SOURCES.pinV31} />
        ), and P2PE v3.1 4A-1.1 sets a similar bar (
        <SourceLink source={CORE_SOURCES.p2peV31} label="P2PE v3.1" />, which adds that the FIPS
        certificate “must not be listed as historical or revoked”; v3.2 of June 2025 is current —
        check it). So for the <em>entity’s</em> requirement, a FIPS Level 3 validation may be
        enough; for the <em>device approval</em>, it never is.
      </p>
    </Callout>

    <H3>Terms that must stay distinct</H3>
    <dl className="grid gap-2 sm:grid-cols-2">
      {DISTINCT_TERMS.map((t) => (
        <div key={t.term} className="rounded-lg border border-border bg-muted/30 p-3">
          <dt className="text-xs font-semibold text-foreground">{t.term}</dt>
          <dd className="mt-1 text-xs text-muted-foreground">{t.meaning}</dd>
        </div>
      ))}
    </dl>

    <H3>Shortcuts a certificate never supports</H3>
    <p>
      Each of these sentences appears in real marketing, procurement and even training material.
      Each is false. Learn the correct statement beside it; the capstone checks your claims against
      this list.
    </p>
    <ul className="space-y-2">
      {SHORTCUTS.map((s) => (
        <li key={s.wrong} className="rounded-lg border border-border p-3">
          <p className="flex items-start gap-2 text-xs text-status-error">
            <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-through decoration-status-error/50">{s.wrong}</span>
          </p>
          <p className="mt-1 flex items-start gap-2 text-xs text-foreground">
            <CheckCircle2
              size={14}
              className="mt-0.5 shrink-0 text-status-success"
              aria-hidden="true"
            />
            <span>{s.right}</span>
          </p>
        </li>
      ))}
    </ul>
    <p className="text-xs text-muted-foreground">
      Three more shortcuts concern timing and process — a market deadline treated as a certification
      route, SP 1800-40 read as vendor self-certification, and Executive Order 14412 treated as if
      it had already changed the CMVP. They are taught in the deadlines section.
    </p>

    <H3>Worked example: one sentence, four customers</H3>
    <p>
      Suppose the {ANCHOR_SCENARIO.name} datasheet says: <em>“FIPS 140-3 Level 3 validated.”</em>{' '}
      Assume the validation is real. What has each customer learned?
    </p>
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <strong>US federal agency:</strong> the answer to its question — <em>if</em> the validated
        module version and approved mode are the ones it will run. Scope is the next question.
      </li>
      <li>
        <strong>EU qualified trust service provider:</strong> nothing about the Protection Profile
        its eIDAS conformity assessment expects. It needs a CC evaluation under EUCC.
      </li>
      <li>
        <strong>Secure-element manufacturer:</strong> possibly useful evidence about a tool in its
        production site — whether its evaluator accepts it is a question to ask.
      </li>
      <li>
        <strong>Payment processor:</strong> not device approval. Possibly enough for its PIN or P2PE
        HSM requirement. Its own operations still need their own assessment.
      </li>
    </ul>
    <p>
      One true sentence; four different amounts of information. The{' '}
      <strong>Which scheme answers the question?</strong> workshop step lets you practise this with
      real procurement claims.
    </p>
  </Prose>
)

// ── scope-before-level ──────────────────────────────────────────────────────

/** Learn section `scope-before-level` */
export const ScopeBeforeLevel = () => {
  const baseline = ANCHOR_RELEASES.find((r) => r.id === 'baseline')
  const candidate = ANCHOR_RELEASES.find((r) => r.id === 'pqc-candidate')
  return (
    <Prose>
      <p>
        “Level 3”, “EAL4+”, “high”, “approved”: every scheme has a word that sounds like a grade.
        None of them means anything until you know <strong>what it is the level of</strong>. A level
        describes a defined boundary or TOE, at a version, in a configuration. Change any of those
        and the level no longer describes what you have. That is why this module teaches{' '}
        <strong>scope before level</strong>: read the object first, the grade second.
      </p>

      <H3>The ten scope questions</H3>
      <p>
        Before comparing any two certificates — or making any claim about your own — answer these
        from the official record, never from a datasheet:
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="p-3 font-semibold">#</th>
              <th className="p-3 font-semibold">Scope question</th>
              <th className="p-3 font-semibold">Where to read it</th>
            </tr>
          </thead>
          <tbody>
            {SCOPE_CHECKLIST.map((s, i) => (
              <tr key={s.item} className="border-t border-border align-top">
                <td className="p-3 text-muted-foreground">{i + 1}</td>
                <td className="p-3 text-foreground">{s.item}</td>
                <td className="p-3">{s.whereToRead}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        For FIPS 140-3 the Security Policy is the richest single document: it follows the SP
        800-140B format (<SourceLink source={CORE_SOURCES.sp800140b} />
        ), names the module and its versions, lists the approved services and algorithms with their
        algorithm-certificate numbers, and gives the security level for each requirement area as
        well as the overall level. The validated-modules search is the authoritative record (
        <SourceLink source={CORE_SOURCES.cmvpValidated} />
        ). For Common Criteria and EUCC, read the certification report and the Security Target
        together: the ST says what was claimed, the report says what was evaluated and under which
        conditions. For PCI, the listing names the device version and its approval class, and the
        device Security Policy carries the algorithm detail.
      </p>

      <H3>
        The {ANCHOR_SCENARIO.name}
        <FictionalBadge />, component by component
      </H3>
      <p>
        The anchor product has six components. Where each one runs decides which boundaries it can
        sit inside.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {ANCHOR_SCENARIO.components.map((c) => {
          const d = ANCHOR_COMPONENT_DETAILS[c.id]
          return (
            <div key={c.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold text-foreground">{c.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{d.summary}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                <strong className="text-foreground/80">Appliance:</strong> {d.appliance} ·{' '}
                <strong className="text-foreground/80">Cloud:</strong> {d.cloud}
              </p>
            </div>
          )
        })}
      </div>

      <p>
        Now draw the three boundaries. For Orrin N7 the <strong>FIPS 140-3 module</strong> is
        bounded by its tamper-responsive enclosure: appliance hardware, firmware, the crypto library
        compiled into it, and the firmware-enforced tenant partitions. The client SDK runs on
        customer hosts and the cloud front end runs on the provider’s servers, so both normally stay
        outside — and the validation then says nothing about them. A{' '}
        <strong>Common Criteria TOE</strong> is whatever the Security Target defines; it could be
        drawn larger (claiming the administration interfaces, for example) or smaller, and a
        Protection Profile may constrain it. A <strong>PCI PTS HSM</strong> approval names the
        device — model, hardware and firmware version — up to initial deployment; the way a
        processor then operates it is assessed separately.
      </p>

      <Callout tone="warning" title="The multi-tenant cloud trap">
        <p>
          “Our cloud HSM service is FIPS 140-3 Level 3 validated” is almost always too broad. What
          can be validated is the <em>module</em> the service runs on. The service wrapper, the SDK,
          tenant onboarding and the provider’s front end are outside it. A truthful claim reads:{' '}
          <em>
            “uses {ANCHOR_SCENARIO.name} module firmware {baseline?.firmware}, validated under
            certificate #…, in approved mode”
          </em>{' '}
          — and the customer then checks that its tenant partition runs that firmware in that mode.
        </p>
      </Callout>

      <H3>Versions are part of the scope</H3>
      <p>
        The {ANCHOR_SCENARIO.name} certified baseline is firmware{' '}
        <strong>{baseline?.firmware}</strong> ({baseline?.algorithms.join(', ')}). The PQC release
        is firmware <strong>{candidate?.firmware}</strong> (the change:{' '}
        {ANCHOR_SCENARIO.change.toLowerCase()}
        ). Until a scheme evaluates {candidate?.firmware}, none of the baseline’s certificates or
        listings covers it — even though the hardware, the product name and most of the code are the
        same. A certificate follows the evaluated artifact, not the brand.
      </p>
      <p>
        Every scheme has a rule for this. The CMVP’s Management Manual defines the revalidation
        routes for a changed module (<SourceLink source={CORE_SOURCES.cmvpManual} />
        ). Common Criteria and EUCC use assurance continuity. PCI uses delta evaluations of an
        approved device. None of them lets a changed product inherit the old result silently; the
        agility and deadlines sections show how to plan around that.
      </p>

      <H3>Only then: the level</H3>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>FIPS 140-3</strong> has four security levels, with an overall level and a level
          per requirement area. Level 1 is not “software-only”, and the level you need follows from
          the threat and the environment — not from “highest available”.
        </li>
        <li>
          <strong>Common Criteria</strong> expresses depth as an EAL plus named augmentations — for
          example the EN 419221-5 Protection Profile requires EAL4 augmented with AVA_VAN.5 (
          <SourceLink source={CORE_SOURCES.en4192215} label="ANSSI-CC-PP-2016/05" />
          ), and the Security IC Platform PP requires EAL4 augmented with ALC_DVS.2, ALC_FLR.2 and
          AVA_VAN.5 (<SourceLink source={CORE_SOURCES.securityIc} label="BSI-CC-PP-0084-V2-2026" />
          ). “EAL4+” alone tells you nothing.
        </li>
        <li>
          <strong>EUCC</strong> adds a legal assurance level: substantial or high.
        </li>
        <li>
          <strong>PCI PTS HSM</strong> has no levels. The listing marks an approval restricted
          (valid only in a controlled environment) or unrestricted.
        </li>
      </ul>

      <Callout tone="success" title="What to take into the workshop">
        <p>
          Scope first: object, version, configuration, services, environment. Then the level of{' '}
          <em>that</em> object. The <strong>Draw the certification boundary</strong> step lets you
          place each {ANCHOR_SCENARIO.name} component inside or outside a FIPS module, a CC TOE or a
          PCI device, and shows what the resulting certificate would — and would not — cover.{' '}
          <AsOf />
        </p>
      </Callout>
    </Prose>
  )
}
