// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart,
  ShieldCheck,
  Building2,
  Briefcase,
  UserRoundCog,
  Sparkles,
  Mail,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
  BookOpenCheck,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const SPONSORSHIP_EMAIL = 'pqctoday@gmail.com'
const GITHUB_SPONSORS_URL = 'https://github.com/sponsors/pqctoday-org'

type BillingMode = 'monthly' | 'one-time'

interface TierPrice {
  amount: string
  suffix: string
}

interface Tier {
  name: string
  pricing: Record<BillingMode, TierPrice>
  badge?: string
  description: string
  benefits: string[]
  highlight?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Supporter',
    pricing: {
      monthly: { amount: '$5', suffix: '/mo' },
      'one-time': { amount: '$25', suffix: 'one-time' },
    },
    description: 'Back the project and keep the lights on. Perfect for individuals and students.',
    benefits: [
      'Name on the public backers page',
      'Supporter badge in the GitHub Sponsors community',
      'Thank-you note in the monthly changelog',
    ],
  },
  {
    name: 'Sponsor',
    pricing: {
      monthly: { amount: '$25', suffix: '/mo' },
      'one-time': { amount: '$100', suffix: 'one-time' },
    },
    description:
      'Help fund standards summaries, vendor mapping, and the monthly compliance digest.',
    benefits: [
      'Everything in Supporter',
      'Logo (or name) linked on the Sponsors page',
      'Early access (1 week) to new standards summaries',
      'Access to the private sponsor discussion channel',
    ],
    highlight: true,
  },
  {
    name: 'Patron',
    pricing: {
      monthly: { amount: '$100', suffix: '/mo' },
      'one-time': { amount: '$500', suffix: 'one-time' },
    },
    description: 'Power-user or small-team backing — directly funds a meaningful slice of a month.',
    benefits: [
      'Everything in Sponsor',
      'Larger logo placement on the Sponsors page',
      'Quarterly briefing call on standards changes',
      'Priority response on questions and feedback',
    ],
  },
]

interface SponsorPersona {
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
}

const PERSONAS: SponsorPersona[] = [
  {
    icon: Building2,
    title: 'Vendors',
    description: 'You sponsor for market access and credibility on a neutral platform.',
    bullets: [
      'Sponsor badge next to your existing listing',
      'Co-marketing slots and joint webinars',
      'Named recognition where buyers are evaluating',
      'Engagement reports on listing traffic',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Enterprises',
    description: 'You sponsor for audit-ready evidence and compliance support.',
    bullets: [
      'Audit-ready PDF of migration-readiness assessments',
      'Named in the quarterly compliance digest',
      'Vendor-mapping data refreshed monthly',
      'Priority support and onboarding calls',
    ],
  },
  {
    icon: UserRoundCog,
    title: 'Consultants',
    description: 'You sponsor for credibility, lead-gen, and standards intelligence.',
    bullets: [
      'Citation rights for PQC Today assets in client decks',
      'Listed in the public "Consultants Using PQC Today" directory',
      'Quarterly briefing call on standards changes',
      'Private consultants channel',
    ],
  },
]

interface FundedItem {
  icon: LucideIcon
  label: string
}

const FUNDED: FundedItem[] = [
  { icon: BookOpenCheck, label: 'Full-time PQC standards analyst' },
  { icon: Globe, label: 'Monthly compliance digest' },
  { icon: ShieldCheck, label: 'Quarterly vendor-mapping refresh' },
  { icon: Lock, label: 'Protected editorial independence' },
]

function Hero() {
  return (
    <section className="text-center mb-12 md:mb-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
        <Sparkles size={14} className="text-primary" />
        <span className="text-xs font-medium text-primary uppercase tracking-wider">
          Sponsor program
        </span>
      </div>
      <h1 className="text-3xl md:text-5xl font-bold mb-4 text-gradient flex items-center justify-center gap-3 flex-wrap">
        <Heart className="w-7 h-7 md:w-10 md:h-10 text-primary shrink-0" aria-hidden="true" />
        Sponsor PQC Today
      </h1>
      <p className="text-base md:text-lg text-secondary max-w-2xl mx-auto mb-2">
        Help fund the independent reference platform for post-quantum cryptography migration.
      </p>
      <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-8">
        Used by security architects, compliance officers, vendors, and consultants preparing for the
        2030–2035 PQC mandate window.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a href={GITHUB_SPONSORS_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="gradient" size="lg" className="gap-2">
            Sponsor on GitHub
            <ExternalLink size={16} />
          </Button>
        </a>
        <a href={`mailto:${SPONSORSHIP_EMAIL}?subject=Sponsorship%20Inquiry`}>
          <Button variant="outline" size="lg" className="gap-2">
            <Mail size={16} />
            Contact us
          </Button>
        </a>
      </div>
    </section>
  )
}

function MarketContext() {
  return (
    <section className="glass-panel p-6 md:p-8 mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Globe className="text-primary shrink-0" size={22} />
        Why this matters now
      </h2>
      <p className="text-sm md:text-base text-secondary leading-relaxed mb-3">
        NSM-10, CNSA 2.0, BSI TR-02102, ANSSI RGS, and ETSI/ENISA mandates put post-quantum
        cryptography on the roadmap of every regulated enterprise between now and 2035. Adversaries
        are harvesting encrypted traffic <em>today</em> to decrypt once cryptanalytically-relevant
        quantum computers arrive.
      </p>
      <p className="text-sm md:text-base text-secondary leading-relaxed">
        Buyers — CISOs, security architects, compliance officers, PKI engineers — are evaluating
        vendors, libraries, HSMs, CAs, and migration tooling right now. PQC Today is where they come
        to compare options on neutral ground.
      </p>
    </section>
  )
}

function Personas() {
  return (
    <section className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center">
        Who sponsors PQC Today
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {PERSONAS.map((persona) => {
          const Icon = persona.icon
          return (
            <div key={persona.title} className="glass-panel p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="text-primary" size={22} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{persona.title}</h3>
              </div>
              <p className="text-sm text-secondary mb-4">{persona.description}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {persona.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <CheckCircle2
                      size={14}
                      className="text-primary shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TierCard({ tier, mode }: { tier: Tier; mode: BillingMode }) {
  const price = tier.pricing[mode]
  const ctaLabel = mode === 'monthly' ? 'Sponsor monthly' : 'Contribute once'

  return (
    <div
      className={`glass-panel p-6 flex flex-col ${
        tier.highlight ? 'border-primary/40 ring-1 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
        {tier.badge && (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
            {tier.badge}
          </span>
        )}
      </div>
      <div className="mb-4">
        <p className="text-3xl font-bold text-gradient">
          {price.amount}
          <span className="text-base font-medium text-muted-foreground ml-1">{price.suffix}</span>
        </p>
      </div>
      <p className="text-sm text-secondary mb-4">{tier.description}</p>
      <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
        {tier.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <a href={GITHUB_SPONSORS_URL} target="_blank" rel="noopener noreferrer" className="mt-auto">
        <Button
          variant={tier.highlight ? 'gradient' : 'outline'}
          size="lg"
          className="w-full gap-2"
        >
          {ctaLabel}
          <ExternalLink size={14} />
        </Button>
      </a>
    </div>
  )
}

function BillingToggle({
  mode,
  onChange,
}: {
  mode: BillingMode
  onChange: (next: BillingMode) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Billing frequency"
      className="inline-flex items-center p-1 rounded-full bg-muted/40 border border-border"
    >
      {(['monthly', 'one-time'] as const).map((option) => {
        const active = mode === option
        return (
          <Button
            key={option}
            type="button"
            variant="ghost"
            size="sm"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option)}
            className={`rounded-full px-4 ${
              active
                ? 'bg-primary/15 text-primary hover:bg-primary/15'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option === 'monthly' ? 'Monthly' : 'One-time'}
          </Button>
        )
      })}
    </div>
  )
}

function Tiers() {
  const [mode, setMode] = useState<BillingMode>('monthly')

  return (
    <section className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 text-center">
        Sponsorship tiers
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Billed through GitHub Sponsors. Pick a recurring monthly amount or a single contribution.
      </p>
      <div className="flex justify-center mb-8">
        <BillingToggle mode={mode} onChange={setMode} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {TIERS.map((tier) => (
          <TierCard key={tier.name} tier={tier} mode={mode} />
        ))}
      </div>
    </section>
  )
}

function EditorialPromise() {
  return (
    <section className="glass-panel p-6 md:p-8 mb-12 border-primary/30">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10 shrink-0">
          <ShieldCheck className="text-primary" size={28} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
            The editorial-independence promise
          </h2>
          <p className="text-sm md:text-base text-secondary leading-relaxed mb-3">
            Sponsorship of PQC Today does <strong>not</strong> influence inclusion in, ordering of,
            or assessments within <code className="text-accent">/migrate</code>,{' '}
            <code className="text-accent">/compliance</code>, vendor-mapping data, or any other
            editorial content. Sponsors are clearly marked. We publicly disclose any vendor request
            to modify a listing; we do not act on those requests.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            This is the entire reason vendors and enterprises trust our data — and the entire reason
            sponsoring is worth what we charge.
          </p>
          <Link to="/editorial-independence">
            <Button variant="outline" size="sm" className="gap-2">
              Read the full policy
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function Goal() {
  return (
    <section className="glass-panel p-6 md:p-8 mb-12">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Briefcase className="text-primary shrink-0" size={22} />
        Where your sponsorship goes
      </h2>
      <p className="text-sm md:text-base text-secondary leading-relaxed mb-6">
        Our goal is <strong className="text-foreground">$15,000/month</strong> in recurring GitHub
        Sponsors revenue, additive to direct-agreement Strategic and Founding sponsorships. Reaching
        it funds:
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {FUNDED.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Icon className="text-primary shrink-0" size={18} />
            <span className="text-sm text-foreground">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ContactCTA() {
  return (
    <section className="text-center py-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Ready to sponsor?</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
        Sponsor directly through GitHub for Listed and Category tiers, or reach out to discuss
        Strategic and Founding sponsorship.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a href={GITHUB_SPONSORS_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="gradient" size="lg" className="gap-2">
            Sponsor on GitHub
            <ExternalLink size={16} />
          </Button>
        </a>
        <a href={`mailto:${SPONSORSHIP_EMAIL}?subject=Sponsorship%20Inquiry`}>
          <Button variant="outline" size="lg" className="gap-2">
            <Mail size={16} />
            {SPONSORSHIP_EMAIL}
          </Button>
        </a>
      </div>
    </section>
  )
}

export function SponsorView() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Hero />
      <MarketContext />
      <Personas />
      <Tiers />
      <EditorialPromise />
      <Goal />
      <ContactCTA />
    </div>
  )
}
