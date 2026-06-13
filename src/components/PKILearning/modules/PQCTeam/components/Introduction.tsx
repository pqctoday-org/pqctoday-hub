// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Building Your PQC Team" lesson (Applied Quantum Skills appendix, p.160–164).
 * Covers core roles, the Crypto Champion network, Build-Borrow-Buy, and the
 * 1-per-500-engineers Crypto Champion sizing heuristic.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { Users, UserCog, Handshake, ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

const CORE_ROLES = [
  {
    role: 'Quantum-Readiness Program Manager (QRPM)',
    what: 'Owns the program plan, gates, budget, and reporting. The accountable single throat to choke.',
  },
  {
    role: 'Cryptographic Architect',
    what: 'Designs target-state crypto, picks algorithms/hybrid posture, owns the CBOM and standards alignment.',
  },
  {
    role: 'Application Security Lead',
    what: 'Drives migration into apps and services; runs pilots, waves, and cutover.',
  },
  {
    role: 'Security Engineers (PQC)',
    what: 'Hands-on remediation: libraries, key management, HSM/KMS, performance validation.',
  },
  {
    role: 'GRC / Compliance Lead',
    what: 'Maps regulatory deadlines to deliverables, owns evidence and audit readiness.',
  },
  {
    role: 'Crypto Champions (federated)',
    what: 'Embedded per-team advocates who carry context into each delivery squad. Size ~1 per 500 engineers.',
  },
]

const BBB = [
  {
    mode: 'Build',
    icon: <GraduationCap size={16} className="text-primary" />,
    when: 'Durable, core capability you will need for years (architecture, the Champion network). Upskill internal staff.',
  },
  {
    mode: 'Borrow',
    icon: <Handshake size={16} className="text-secondary" />,
    when: 'Spiky, time-boxed demand (discovery sprints, pilots). Use consultants / MSSPs to scale the peak.',
  },
  {
    mode: 'Buy',
    icon: <ShieldCheck size={16} className="text-status-success" />,
    when: 'Commodity or specialised tooling (CBOM scanners, PQC-ready HSM/KMS) where vendors are ahead of in-house.',
  },
]

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Migration Is a People Problem First</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          A PQC migration fails on staffing far more often than on cryptography. Before tooling and
          roadmaps, decide <strong>who owns it</strong>: a small accountable core team plus a
          federated network of <InlineTooltip term="Crypto Agility">Crypto Champions</InlineTooltip>{' '}
          embedded in delivery teams. The core sets direction; the Champions carry it into every
          squad that touches cryptography.
        </p>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <UserCog size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Core Roles</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CORE_ROLES.map((r) => (
          <div key={r.role} className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">{r.role}</div>
            <p className="text-xs text-muted-foreground">{r.what}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Handshake size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Build · Borrow · Buy</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BBB.map((b) => (
          <div key={b.mode} className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              {b.icon}
              <span className="text-sm font-bold text-foreground">{b.mode}</span>
            </div>
            <p className="text-xs text-muted-foreground">{b.when}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm text-foreground/90">
          <strong>Sizing heuristic:</strong> staff roughly{' '}
          <strong>one Crypto Champion per 500 engineers</strong>, plus a fixed core team. The
          Workshop turns this into a concrete FTE estimate for your org size.
        </p>
      </div>
    </section>

    <section className="glass-panel p-6 border-secondary/20">
      <h3 className="text-lg font-bold text-gradient mb-3">Where this connects</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Link
          to="/learn/pqc-governance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ShieldCheck size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Governance &amp; Policy</div>
            <div className="text-xs text-muted-foreground">RACI matrices and accountability</div>
          </div>
        </Link>
        <Link
          to="/learn/migration-program"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Users size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Migration Program</div>
            <div className="text-xs text-muted-foreground">
              Stand up the program around the team
            </div>
          </div>
        </Link>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3">
        Source: Applied Quantum PQC Migration Framework — Skills &amp; Team appendix.
      </p>
    </section>

    <div className="text-center">
      <Button
        variant="gradient"
        onClick={onNavigateToWorkshop}
        className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
      >
        Size Your Team <ArrowRight size={18} />
      </Button>
    </div>

    <ReadingCompleteButton />
  </div>
)
