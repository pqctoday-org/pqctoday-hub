// SPDX-License-Identifier: GPL-3.0-only
//
// CNSA 2.0 lens panel for the Algorithms page (Wave-5 gap-closers #1–#5).
// Additive: rendered only when the user opens the CNSA 2.0 lens; the rest of
// the page is unchanged when it is closed. All facts come from `cnsa20.ts`,
// which derives them from the reference/transition CSV fields.

import { ShieldCheck, CalendarClock, GitMerge, Scale, BadgeCheck, ExternalLink } from 'lucide-react'
import {
  CNSA20_TIMELINE,
  CNSA20_DONT_DEPLOY_PRE_STANDARD,
  CNSA20_ADVISORY_URL,
  HYBRID_COMPOSITE_GUIDANCE,
} from './cnsa20'

/**
 * The CNSA 2.0 lens — a self-contained explainer that surfaces the standards
 * pipeline timeline (#2), hybrid/composite guidance (#3) and the
 * module-validation qualifier (#5). Jurisdictional mandate (#4) is surfaced
 * per-row in the transition table; this panel carries the cross-cutting prose.
 */
export function Cnsa20Panel() {
  return (
    <section
      className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4 md:p-5"
      aria-label="CNSA 2.0 lens"
      data-workshop-target="section-algorithm-cnsa20"
    >
      <div className="flex items-start gap-2">
        <ShieldCheck size={20} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="text-base md:text-lg font-bold text-foreground">
            CNSA 2.0 lens — U.S. National Security Systems
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            The NSA Commercial National Security Algorithm Suite 2.0 names an exact set of choices
            for National Security Systems:{' '}
            <strong className="text-status-success">ML-KEM-1024</strong> (key establishment) and{' '}
            <strong className="text-status-success">ML-DSA-87</strong> (signatures) are{' '}
            <strong>required</strong>; stateful{' '}
            <strong className="text-status-info">LMS / XMSS</strong> are approved for
            software/firmware signing only; and <strong>SLH-DSA is not selected</strong>. Lower
            parameter sets (ML-KEM-512/768, ML-DSA-44/65) sit below the CNSA 2.0 floor.
          </p>
        </div>
      </div>

      {/* #2 — Standards-pipeline / CNSA 2.0 transition timeline */}
      <div className="mt-5">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <CalendarClock size={15} className="text-primary" aria-hidden="true" />
          CNSA 2.0 transition timeline
        </h4>
        <ol className="mt-2 space-y-2">
          {CNSA20_TIMELINE.map((m) => (
            <li key={m.year} className="flex gap-3 text-sm">
              <span className="shrink-0 font-mono font-semibold text-primary w-20">{m.year}</span>
              <span className="text-foreground/90">
                <strong className="text-foreground">{m.title}.</strong>{' '}
                <span className="text-muted-foreground">{m.detail}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 rounded border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-xs text-foreground/85 leading-relaxed">
          {CNSA20_DONT_DEPLOY_PRE_STANDARD}
        </p>
      </div>

      {/* #3 — Hybrid / composite guidance */}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-border bg-card/50 p-3">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <GitMerge size={15} className="text-status-info" aria-hidden="true" />
            When to use a composite (PQC + classical)
          </h4>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {HYBRID_COMPOSITE_GUIDANCE.whenComposite}
          </p>
        </div>
        <div className="rounded border border-border bg-card/50 p-3">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Scale size={15} className="text-status-success" aria-hidden="true" />
            When to use pure ML-KEM / ML-DSA
          </h4>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {HYBRID_COMPOSITE_GUIDANCE.whenPure}
          </p>
        </div>
      </div>

      {/* #4 — Jurisdictional stance summary (per-row tags live in the table) */}
      <div className="mt-4 rounded border border-border bg-card/50 p-3">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Scale size={15} className="text-primary" aria-hidden="true" />
          Jurisdictional mandate, at a glance
        </h4>
        <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground leading-relaxed">
          <li>
            <strong className="text-foreground">BSI / ANSSI (Europe):</strong> require hybrid (PQC +
            classical) during the transition.
          </li>
          <li>
            <strong className="text-foreground">NSA / CNSA 2.0 (US NSS):</strong> mandate pure
            ML-KEM-1024 / ML-DSA-87; hybrid is interim, not required.
          </li>
          <li>
            <strong className="text-foreground">IETF / ETSI:</strong> specify hybrid/composite
            constructions as transition mechanisms.
          </li>
        </ul>
        <p className="mt-2 text-[11px] text-muted-foreground italic">
          Open the Transition Guide tab to see each region&apos;s stance tagged on the matching
          hybrid row.
        </p>
      </div>

      {/* #5 — Module-validation qualifier */}
      <div className="mt-4 flex items-start gap-2 rounded border border-status-info/30 bg-status-info/5 px-3 py-2">
        <BadgeCheck size={15} className="text-status-info shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-foreground/85 leading-relaxed">
          <strong className="text-foreground">Algorithm standard ≠ validated module.</strong> A FIPS
          203/204/205 (or SP 800-208) label means the <em>algorithm</em> is standardized — not that
          any product implementing it is FIPS 140-3 validated. For regulated deployment you still
          need a CMVP-validated cryptographic module; check the CMVP list, not just the algorithm
          standard.
        </p>
      </div>

      <div className="mt-3">
        <a
          href={CNSA20_ADVISORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          NSA CNSA 2.0 advisory <ExternalLink size={11} aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
