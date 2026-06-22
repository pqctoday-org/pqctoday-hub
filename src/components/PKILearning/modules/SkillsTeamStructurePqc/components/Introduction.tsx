// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  UserCog,
  Layers,
  GraduationCap,
  Shield,
  ArrowRight,
  Hammer,
  Handshake,
  ShoppingCart,
  Award,
  ClipboardCheck,
  Briefcase,
  Landmark,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'
import {
  ROLE_CROSSWALK,
  CORE_ROLE_ORDER,
  ROLE_DETAIL,
  SIZING,
  BUILD_BORROW_BUY,
  TRAINING_LEVELS,
  CHAMPION_PLATFORMS,
} from '../data/teamModel'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

// ─── Step 1: The Skills Challenge + Core Roles ────────────────────────────────

const Step1ChallengeAndRoles: React.FC = () => (
  <div className="space-y-8 w-full">
    {/* Section 1: The Skills Challenge */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The Skills Challenge</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          <InlineTooltip term="Post-Quantum Cryptography">PQC</InlineTooltip> migration requires a
          combination of skills that rarely coexists in a single team: deep cryptographic knowledge
          (algorithms, protocols, PKI architecture), enterprise program management at scale
          (governance, stakeholder management, multi-year planning), and domain-specific technical
          expertise (network security, application security, OT engineering, cloud architecture).
          The market for professionals who combine even two of these is thin.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <p className="text-sm text-foreground/90">
            The realistic approach is <strong>not</strong> to hire a complete team of PQC
            specialists. It is to build the program around a small core of cryptographic expertise,
            supplement it with existing enterprise security and IT staff upskilled on PQC-relevant
            topics, and augment with external specialists for capabilities the organization cannot
            develop internally in the required timeframe.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Build a small core</div>
            <p className="text-xs text-muted-foreground">
              A dedicated nucleus of cryptographic expertise: program management, architecture, and
              PMO that exists regardless of estate size.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Upskill existing staff</div>
            <p className="text-xs text-muted-foreground">
              Most engineering capacity comes from security and IT staff you already have, trained
              on PQC-relevant topics.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Augment externally</div>
            <p className="text-xs text-muted-foreground">
              Buy in scarce specialists (OT, strategic quantum CTI) you cannot develop in the
              required timeframe.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Section 2: Core Roles + FTE table */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <UserCog size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Core Roles &amp; FTE Allocation</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Seven core roles carry a PQC program. The{' '}
          <strong>Quantum-Readiness Program Manager (QRPM)</strong>, the{' '}
          <strong>Cryptographic Architect</strong>, and the <strong>PMO Analyst</strong> are
          dedicated overhead &mdash; you staff them regardless of how large the cryptographic estate
          is. The remaining roles scale with the work the phases generate.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 border-b border-border text-foreground font-semibold min-w-[170px]">
                  Role
                </th>
                <th className="text-left p-2 border-b border-border text-foreground font-semibold">
                  Skills Required
                </th>
                <th className="text-left p-2 border-b border-border text-foreground font-semibold min-w-[180px]">
                  Source
                </th>
                <th className="text-center p-2 border-b border-border text-foreground font-semibold min-w-[110px]">
                  Typical FTE
                </th>
              </tr>
            </thead>
            <tbody>
              {CORE_ROLE_ORDER.map((roleId) => {
                const role = ROLE_CROSSWALK[roleId]
                const detail = ROLE_DETAIL[roleId]
                return (
                  <tr key={roleId} className="hover:bg-muted/30 transition-colors align-top">
                    <td className="p-2 border-b border-border text-foreground font-medium text-xs">
                      {role.label}
                      {detail.dedicatedOverhead && (
                        <span className="ml-1 inline-block text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/40 align-middle">
                          core
                        </span>
                      )}
                    </td>
                    <td className="p-2 border-b border-border text-xs text-muted-foreground">
                      {detail.skills.join('; ')}
                    </td>
                    <td className="p-2 border-b border-border text-xs text-muted-foreground">
                      {detail.source}
                    </td>
                    <td className="p-2 border-b border-border text-center text-xs font-bold text-primary">
                      {role.typicalFte}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          The <span className="text-accent font-semibold">core</span> badge marks the three
          dedicated-overhead roles &mdash; they are staffed regardless of estate size.
        </p>
      </div>
    </section>
  </div>
)

// ─── Step 2: Team Sizing + Build/Borrow/Buy ───────────────────────────────────

const Step2SizingAndSourcing: React.FC = () => (
  <div className="space-y-8 w-full">
    {/* Section 3: Team Sizing heuristic */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Layers size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Team Sizing</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Team size depends on the cryptographic estate&apos;s complexity more than on revenue or
          headcount. A 50,000-employee bank with 2,000 TLS endpoints, 15 HSMs, and 200 vendor
          relationships needs a larger team than a 200,000-employee manufacturer with 500 TLS
          endpoints concentrated in one ERP platform.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <p className="text-sm text-foreground/90">
            <strong>Sizing heuristic:</strong> one dedicated FTE per{' '}
            <span className="text-primary font-bold">{SIZING.firstTwoYearsRatio}</span>{' '}
            cryptographic instances in the <InlineTooltip term="CBOM">CBOM</InlineTooltip> for the
            first two years (discovery, CBOM, risk scoring, pilot). This drops to one per{' '}
            <span className="text-primary font-bold">{SIZING.productionRolloutRatio}</span> during
            production rollout as tooling automates repetitive tasks.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">
              &lt; {SIZING.partTimeBelow.toLocaleString()} instances
            </div>
            <p className="text-xs text-muted-foreground">
              A part-time QRPM with consulting augmentation for the Cryptographic Architect role is
              viable.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Dedicated overhead</div>
            <p className="text-xs text-muted-foreground">
              QRPM, Cryptographic Architect, and PMO Analyst are staffed regardless of estate size.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">
              &gt; {SIZING.programOfficeAbove.toLocaleString()} instances
            </div>
            <p className="text-xs text-muted-foreground">
              Plan a dedicated program office with {SIZING.programOfficeFteLow}&ndash;
              {SIZING.programOfficeFteHigh} FTEs at peak.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Try the interactive <strong>Team Sizing Calculator</strong> in the Workshop to convert
          your own estate size into an FTE estimate.
        </p>
      </div>
    </section>

    {/* Section 4: Build / Borrow / Buy */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Handshake size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Build, Borrow, or Buy</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Not every capability should be built in-house. The framework recommends a default sourcing
          model per capability, balancing lasting institutional value against scarcity and risk.
        </p>
        <div className="space-y-2">
          {BUILD_BORROW_BUY.map((row) => {
            const Icon =
              row.model === 'Build' ? Hammer : row.model === 'Buy' ? ShoppingCart : Handshake
            const tone =
              row.model === 'Build'
                ? 'text-primary'
                : row.model === 'Buy'
                  ? 'text-accent'
                  : 'text-status-warning'
            return (
              <div
                key={row.capability}
                className="flex items-start gap-3 bg-muted/50 rounded-lg p-3"
              >
                <div
                  className={`p-1.5 rounded bg-background border border-border ${tone} shrink-0`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {row.capability}
                    <span className={`ml-2 text-[10px] font-bold uppercase ${tone}`}>
                      {row.recommendation}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{row.rationale}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 3: Training Levels + Crypto Champions ───────────────────────────────

const Step3TrainingAndChampions: React.FC = () => (
  <div className="space-y-8 w-full">
    {/* Section 5: Four training levels */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <GraduationCap size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Training Approach: Four Levels</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Training operates at four levels, each with a different audience, depth, and outcome.
          Together they take an organization from informed sponsors to hands-on practitioners and a
          scaled champion network.
        </p>
        <div className="space-y-2">
          {TRAINING_LEVELS.map((t) => (
            <div key={t.level} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-sm font-bold text-primary shrink-0 w-6 text-center">
                {t.level}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">
                  {t.name}{' '}
                  <span className="text-[10px] text-muted-foreground/70 font-normal">
                    ({t.duration})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <strong>Audience:</strong> {t.audience}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.content}</p>
                <p className="text-[11px] text-foreground/70 mt-1">
                  <strong>Outcome:</strong> {t.outcome}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Section 6: Crypto Champion Program */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Award size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">The Crypto Champion Program</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Designate one <strong>crypto champion</strong> per platform or application team. Champions
          attend PQC foundations training, join quarterly crypto-agility briefings, and serve as the
          liaison between the PQC program and their platform team. They sign off on &ldquo;crypto
          readiness&rdquo; in design reviews for new systems and shepherd PQC library upgrades
          within their domain &mdash; scaling the program&apos;s reach without requiring every
          developer to become a cryptography specialist.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CHAMPION_PLATFORMS.map((platform) => (
            <div
              key={platform}
              className="bg-muted/50 rounded-lg p-2 border border-border text-center"
            >
              <Award size={14} className="text-secondary mx-auto mb-1" />
              <div className="text-xs font-medium text-foreground">{platform}</div>
            </div>
          ))}
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <p className="text-xs text-foreground/90">
            <strong>Sustaining capability:</strong> after migration, champions become a standing
            network analogous to security champion programs, and the QRPM role evolves into a
            permanent Cryptographic Governance Lead within the CISO&apos;s function.
          </p>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 4: Resources + CTA ──────────────────────────────────────────────────

const Step4ResourcesAndCta: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6 border-secondary/20">
      <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Link
          to="/learn/pqc-governance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Users size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Governance &amp; Policy</div>
            <div className="text-xs text-muted-foreground">
              RACI matrices, escalation paths, and KPI dashboards for the program
            </div>
          </div>
        </Link>
        <Link
          to="/assess"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ClipboardCheck size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Risk Assessment</div>
            <div className="text-xs text-muted-foreground">
              Size your estate and surface the cryptographic instances that drive headcount
            </div>
          </div>
        </Link>
        <Link
          to="/learn/crypto-agility"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Shield size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Crypto Agility</div>
            <div className="text-xs text-muted-foreground">
              The design patterns crypto champions enforce in reviews
            </div>
          </div>
        </Link>
        <Link
          to="/learn/pqc-business-case"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Briefcase size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">PQC Business Case</div>
            <div className="text-xs text-muted-foreground">
              Justify the FTE budget your sizing calculation produces
            </div>
          </div>
        </Link>
        <Link
          to="/learn/standards-bodies"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Landmark size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Standards Bodies</div>
            <div className="text-xs text-muted-foreground">
              The bodies whose outputs the team must track and implement
            </div>
          </div>
        </Link>
      </div>
    </section>

    <div className="text-center">
      <Button variant="gradient" onClick={onNavigateToWorkshop} className="gap-2">
        Start Workshop <ArrowRight size={18} />
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Size your team from your estate and assign crypto champions across your platforms.
      </p>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  const steps = [
    {
      id: 'challenge',
      label: 'The Skills Challenge & Core Roles',
      content: <Step1ChallengeAndRoles />,
    },
    {
      id: 'sizing',
      label: 'Team Sizing & Build/Borrow/Buy',
      content: <Step2SizingAndSourcing />,
    },
    {
      id: 'training',
      label: 'Training Levels & Crypto Champions',
      content: <Step3TrainingAndChampions />,
    },
    {
      id: 'resources',
      label: 'Resources & Workshop',
      content: <Step4ResourcesAndCta onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
