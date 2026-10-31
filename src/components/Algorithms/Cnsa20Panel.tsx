// SPDX-License-Identifier: AGPL-3.0-only
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
            <strong className="text-status-info">LMS / XMSS</strong> are approved (NSA wants them
            used for software/firmware signing whenever possible); and{' '}
            <strong>SLH-DSA is not selected</strong>. Lower parameter sets (ML-KEM-512/768,
            ML-DSA-44/65) sit below the CNSA 2.0 floor. AES-256 and SHA-384/512 cover symmetric
            encryption and hashing.
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
            <li key={`${m.year}-${m.title}`} className="flex gap-3 text-sm">
              <span className="shrink-0 font-mono font-semibold text-primary w-24">{m.year}</span>
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
          Jurisdictional position, at a glance
        </h4>
        <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground leading-relaxed">
          <li>
            <strong className="text-foreground">BSI (Germany):</strong> recommends ML-KEM-768/1024,
            FrodoKEM-976/1344 and ML-DSA-65/87 only in combination with a classical scheme (hybrid);
            hash-based signatures may in principle be used alone, provided their implementation
            security is carefully considered (TR-02102-1, 2026-01).
          </li>
          <li>
            <strong className="text-foreground">ANSSI (France):</strong> requires hybridization of
            ML-KEM and ML-DSA in its regulated perimeter during the transition; it does not
            recommend systematic hybridisation for hash-based signatures such as SLH-DSA.
          </li>
          <li>
            <strong className="text-foreground">NSA / CNSA 2.0 (US NSS):</strong> requires
            ML-KEM-1024 / ML-DSA-87; hybrids are not required and count only where NSA has
            specifically identified them (CNSA 2.0 FAQ, Oct 2026).
          </li>
          <li>
            <strong className="text-foreground">US federal, non-NSS:</strong> Executive Order 14412
            (June 2026) directs agencies to move high-value assets and high-impact systems to
            post-quantum key establishment by 31 Dec 2030 and post-quantum signatures by 31 Dec
            2031. NIST IR 8547 (final, October 2026) deprecates quantum-vulnerable public-key
            algorithms after 2030 and disallows them under NIST standards after 2035.
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
          any product implementing it is FIPS 140-3 validated. Where a validated module is required
          (for example US federal systems and NSS), check the CMVP list, not just the algorithm
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
