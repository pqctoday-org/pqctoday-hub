// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Trash2, Activity, ClipboardCheck, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onNavigateToWorkshop?: (step?: number) => void
}

/** ● = grounded in a primary standard · ◆ = practitioner / framework view */
const Badge: FC<{ kind: 'std' | 'view' }> = ({ kind }) => (
  <span
    className={`mr-1 inline-block rounded px-1.5 py-0.5 align-middle text-[10px] font-semibold ${
      kind === 'std'
        ? 'bg-status-success/15 text-status-success'
        : 'bg-status-info/15 text-status-info'
    }`}
  >
    {kind === 'std' ? '● standard' : '◆ practitioner'}
  </span>
)

const Section: FC<{
  id: string
  icon: typeof Trash2
  title: string
  children: React.ReactNode
}> = ({ id, icon: Icon, title, children }) => (
  <section id={id} className="glass-panel scroll-mt-24 p-5">
    <div className="mb-3 flex items-center gap-2">
      <Icon size={18} className="text-primary" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">{children}</div>
  </section>
)

const SECTIONS = [
  { id: 'decommission', label: 'Decommission' },
  { id: 'verify-evidence', label: 'Prove it' },
  { id: 'verify-coverage', label: 'Coverage' },
  { id: 'closure-handover', label: 'Closure' },
]

export const VerificationClosureIntroduction: FC<Props> = ({ onNavigateToWorkshop }) => (
  <div className="space-y-5">
    <div className="glass-panel flex flex-wrap gap-2 p-4">
      <span className="mr-1 self-center text-xs text-muted-foreground">In this module:</span>
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="rounded border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          {s.label}
        </a>
      ))}
    </div>

    <Section id="decommission" icon={Trash2} title="Retire classical crypto safely">
      <p>
        <Badge kind="std" />
        The migration isn&apos;t done when PQC is added — it&apos;s done when the classical
        cryptography is <em>gone</em>. The defensible schedule is the deprecation timeline:{' '}
        <strong>NIST IR 8547</strong> (still a draft) proposes deprecating 112-bit-strength
        RSA/ECC/finite-field key exchange after <strong>2030</strong> and disallowing all
        quantum-vulnerable public-key cryptography after <strong>2035</strong>;{' '}
        <strong>NCSC-UK</strong> sets phased targets — 2028 (discovery + plan), 2031
        (highest-priority migration), 2035 (complete); <strong>NIST SP 800-131A</strong> carries the
        transition rules.
      </p>
      <p>
        The discipline is four steps: <strong>deprecate → remove → verify removed → log</strong>.
        The step teams skip is the third — confirm by observation that the old key material is gone,
        not just that a new key exists.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigateToWorkshop?.(0)}
        className="border-primary text-primary hover:bg-primary/10"
      >
        Walk the Decommission Checklist →
      </Button>
    </Section>

    <Section id="verify-evidence" icon={Activity} title="Prove it from observed behaviour">
      <p>
        <Badge kind="view" />A system is &ldquo;migrated&rdquo; when its <em>behaviour</em> shows it
        — the handshake negotiates ML-KEM/ML-DSA — not when a change ticket says so. Reuse the{' '}
        <strong>Active PQC Scanner</strong> (in the PQC Testing module) and passive handshake
        capture to collect the evidence.{' '}
        <em>(Evidence-by-observed-behaviour is practitioner guidance.)</em>
      </p>
      <p>
        <Badge kind="std" />
        The control basis is independent: <strong>NIST CSWP 48</strong> (draft) maps the NCCoE
        Migration-to-PQC capabilities to <strong>CSF 2.0</strong> and <strong>SP 800-53</strong>.
      </p>
    </Section>

    <Section id="verify-coverage" icon={ClipboardCheck} title="Coverage at estate scale">
      <p>
        <Badge kind="view" />
        You can&apos;t verify a large estate by hand, so decide <em>which</em> systems and{' '}
        <em>what proof</em> per tier: verify business-critical systems fully, sample the rest per
        migration wave, and let any sampled failure widen the check.{' '}
        <em>(The specific sampling rule is practitioner guidance, not a named standard.)</em>
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigateToWorkshop?.(1)}
        className="border-primary text-primary hover:bg-primary/10"
      >
        Plan coverage by tier →
      </Button>
    </Section>

    <Section id="closure-handover" icon={Archive} title="Close into business-as-usual">
      <p>
        <Badge kind="view" />
        Programs drift into an unfunded twilight unless they close deliberately. Define closure
        criteria in advance, accept residual risk with a{' '}
        <strong>named owner + re-evaluation date</strong>, and hand the standing capabilities —
        CBOM, continuous discovery, vendor cadence, SOC content, KRIs, crypto-agility — to permanent
        owners, with an archived <strong>evidence dossier</strong>.
      </p>
      <p>
        <Badge kind="std" />
        Anchor the generic governance to <strong>ISO/IEC 27001</strong> and the{' '}
        <strong>NIST Risk Management Framework (SP 800-37)</strong> residual-risk-acceptance
        process. Make &ldquo;acquire only PQC-capable products&rdquo; a standing procurement rule —
        the <strong>CISA product-category list</strong> (Jan 2026) flags the categories where they
        are already available.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigateToWorkshop?.(2)}
        className="border-primary text-primary hover:bg-primary/10"
      >
        Build the Closure &amp; Handover Register →
      </Button>
    </Section>
  </div>
)
