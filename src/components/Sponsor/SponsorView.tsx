// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Link } from 'react-router'
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
import { buttonVariants } from '@/components/ui/button-variants'
import { EXAMPLE_REPORT_URL } from '@/data/exampleReport'
import { useScrollToHash } from '@/hooks/useScrollToHash'
import { PersonaPageNote } from '@/components/shared/PersonaPageNote'

const SPONSORSHIP_EMAIL = 'sponsor@pqctoday.com'
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
      'Help fund standards summaries, vendor-mapping refreshes, and the planned compliance digest.',
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

/**
 * A sponsor AUDIENCE — B+ remediation 4.1 (2026-08-10), renamed from
 * `SponsorPersona`/`PERSONAS`.
 *
 * This page defined its own list of "personas" (vendors, foundations,
 * individuals) with no relationship whatsoever to the six the rest of the hub
 * runs on (executive, developer, architect, researcher, ops, curious). Two
 * unrelated persona models sharing one word, in one codebase, is a real trap
 * for whoever edits next — a reader of `PERSONAS` in this file would
 * reasonably assume it meant `learningPersonas.PERSONAS`. Nothing about the
 * page's behaviour changes; the vocabulary stops colliding.
 */
interface SponsorAudience {
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
  /** Optional link to a concrete deliverable so buyers can preview what they get. */
  cta?: { label: string; to: string }
}

const SPONSOR_AUDIENCES: SponsorAudience[] = [
  {
    icon: Building2,
    title: 'Vendors',
    description: 'You sponsor for market access and credibility on a neutral platform.',
    bullets: [
      'Sponsor badge next to your existing listing',
      'Co-marketing slots and joint webinars',
      'Named recognition where buyers are evaluating',
      'Engagement reports on listing traffic — planned, not yet built',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Enterprises',
    description: 'You sponsor educational planning resources for stakeholder discussion.',
    bullets: [
      'Illustrative assessment report with sample planning inputs',
      'Evaluate assumptions and supporting checks with your own production tools; the sample is not audited evidence',
      'Named in the compliance digest — planned, not yet built',
      'Vendor-mapping data refreshed monthly',
      'Priority support and onboarding calls',
    ],
    cta: { label: 'See a sample assessment report', to: EXAMPLE_REPORT_URL },
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
  /** Link to a real, existing page a skeptical visitor can check today. Only
   *  set for items with something verifiable behind them — the two items
   *  that are purely aspirational (not yet built at any funding level) are
   *  left unlinked rather than pointed at a page that doesn't actually
   *  substantiate the claim. */
  to?: string
}

const FUNDED: FundedItem[] = [
  { icon: BookOpenCheck, label: 'Full-time PQC standards analyst — once fully funded' },
  { icon: Globe, label: 'Monthly compliance digest — planned' },
  { icon: ShieldCheck, label: 'Monthly vendor-mapping refresh', to: '/revisions' },
  { icon: Lock, label: 'Protected editorial independence', to: '/editorial-independence' },
]

function Hero() {
  return (
    <section className="text-center mb-12 md:mb-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
        <Sparkles size={14} className="text-primary" aria-hidden="true" />
        <span className="uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
          Sponsor program
        </span>
      </div>
      <h1 className="text-3xl md:text-5xl font-bold mb-4 font-display text-heading flex items-center justify-center gap-3 flex-wrap">
        <Heart className="w-7 h-7 md:w-10 md:h-10 text-primary shrink-0" aria-hidden="true" />
        Sponsor PQC Today
      </h1>
      <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
        Help fund the independent reference platform for post-quantum cryptography migration.
      </p>
      <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-8">
        Designed for security architects, compliance officers, vendors and consultants comparing PQC
        capabilities and planning against milestones that apply to their systems.
      </p>
      <PersonaPageNote route="/sponsor" className="mx-auto mb-8 max-w-2xl text-left" />
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={GITHUB_SPONSORS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'gradient', size: 'lg', className: 'gap-2' })}
        >
          Sponsor on GitHub
          <ExternalLink size={16} aria-hidden="true" />
        </a>
        <a
          href={`mailto:${SPONSORSHIP_EMAIL}?subject=Sponsorship%20Inquiry`}
          className={buttonVariants({ variant: 'outline', size: 'lg', className: 'gap-2' })}
        >
          <Mail size={16} aria-hidden="true" />
          Contact us
        </a>
      </div>
      <nav
        aria-label="Sponsorship information"
        className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-primary underline"
      >
        <Link to="#sponsorship-tiers">Compare sponsorship tiers</Link>
        <Link to="/editorial-independence#editorial-independence-what-sponsorship-buys">
          Editorial independence policy
        </Link>
      </nav>
    </section>
  )
}

function MarketContext() {
  return (
    <section className="glass-panel p-6 md:p-8 mb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 font-display text-heading">
        <Globe className="text-primary shrink-0" size={22} aria-hidden="true" />
        Why this matters now
      </h2>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-3">
        Government policies, technical recommendations and sector requirements create different PQC
        planning obligations. CNSA 2.0 applies to US National Security Systems; other organizations
        must identify their own authority, use case and milestone. Long-lived data also calls for a
        harvest-now-decrypt-later risk assessment alongside those requirements.
      </p>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
        Sponsorship funds educational resources that help CISOs, architects, compliance officers and
        PKI engineers compare vendors, libraries, HSMs and migration capabilities. It does not
        purchase a favorable listing or prove a product capability. Readers can inspect sources in
        the Migrate catalogue and use the editorial-independence policy to understand this boundary.
      </p>
    </section>
  )
}

function SponsorAudiences() {
  return (
    <section className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold mb-6 text-center font-display text-heading">
        Who sponsors PQC Today
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {SPONSOR_AUDIENCES.map((audience) => {
          const Icon = audience.icon
          return (
            <div key={audience.title} className="glass-panel p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="text-primary" size={22} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold font-display text-heading">
                  {audience.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{audience.description}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {audience.bullets.map((bullet) => (
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
              {audience.cta && (
                <Link
                  to={audience.cta.to}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {audience.cta.label}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              )}
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
        <h3 className="text-lg font-semibold font-display text-heading">{tier.name}</h3>
        {tier.badge && (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
            {tier.badge}
          </span>
        )}
      </div>
      <div className="mb-4">
        <p className="text-3xl font-bold text-heading">
          {price.amount}
          <span className="text-base font-medium text-muted-foreground ml-1">{price.suffix}</span>
        </p>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
      <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
        {tier.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <a
        href={GITHUB_SPONSORS_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${ctaLabel} as ${tier.name} on GitHub`}
        className={buttonVariants({
          variant: tier.highlight ? 'gradient' : 'outline',
          size: 'lg',
          className: 'mt-auto w-full gap-2',
        })}
      >
        {ctaLabel}
        <ExternalLink size={14} aria-hidden="true" />
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
    <fieldset className="inline-flex rounded-full border border-border bg-muted/40 p-1">
      <legend className="sr-only">Billing frequency</legend>
      {(['monthly', 'one-time'] as const).map((option) => (
        <label key={option} className="cursor-pointer">
          <input
            type="radio"
            className="peer sr-only"
            name="sponsor-billing-frequency"
            checked={mode === option}
            onChange={() => onChange(option)}
          />
          <span className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-muted-foreground peer-checked:bg-primary/15 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
            {option === 'monthly' ? 'Monthly' : 'One-time'}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

function Tiers() {
  const [mode, setMode] = useState<BillingMode>('monthly')

  return (
    <section
      id="sponsorship-tiers"
      tabIndex={-1}
      className="mb-12 scroll-mt-20 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <h2 className="text-xl md:text-2xl font-bold mb-2 text-center font-display text-heading">
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
    <section className="glass-panel p-6 md:p-8 mb-12">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10 shrink-0">
          <ShieldCheck className="text-primary" size={28} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold mb-3 font-display text-heading">
            The editorial-independence promise
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-3">
            Sponsorship of PQC Today does <strong>not</strong> influence inclusion in, ordering of,
            or assessments within <code className="text-accent">/migrate</code>,{' '}
            <code className="text-accent">/compliance</code>, vendor-mapping data, or any other
            editorial content. Sponsors are clearly marked. We publicly disclose any vendor request
            to modify a listing. As the editorial-independence policy explains, requests may lead
            only to primary-source-backed factual corrections or updates reflecting a changed
            authoritative source; sponsorship does not buy a change to editorial outcomes.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            This is the entire reason vendors and enterprises trust our data — and the entire reason
            sponsoring is worth what we charge.
          </p>
          <Link
            to="/editorial-independence#editorial-independence-what-sponsorship-buys"
            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2' })}
          >
            Read the full policy
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function Goal() {
  return (
    <section className="glass-panel p-6 md:p-8 mb-12">
      <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 font-display text-heading">
        <Briefcase className="text-primary shrink-0" size={22} aria-hidden="true" />
        Where your sponsorship goes
      </h2>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
        Our goal is <strong className="text-foreground">$15,000/month</strong> in recurring GitHub
        Sponsors revenue, additive to any custom direct sponsorship agreements. Reaching it funds:
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {FUNDED.map(({ icon: Icon, label, to }) => {
          const content = (
            <>
              <Icon className="text-primary shrink-0" size={18} aria-hidden="true" />
              <span className="text-sm text-foreground">{label}</span>
              {to && (
                <span className="text-xs text-primary ml-auto whitespace-nowrap">Verify →</span>
              )}
            </>
          )
          return to ? (
            <Link
              key={label}
              to={to}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              {content}
            </Link>
          ) : (
            <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ContactCTA() {
  return (
    <section className="text-center py-8">
      <h2 className="text-xl md:text-2xl font-bold mb-2 font-display text-heading">
        Ready to sponsor?
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
        Sponsor directly through GitHub for the Supporter, Sponsor, and Patron tiers, or reach out
        to discuss a custom vendor or enterprise sponsorship.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={GITHUB_SPONSORS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'gradient', size: 'lg', className: 'gap-2' })}
        >
          Sponsor on GitHub
          <ExternalLink size={16} aria-hidden="true" />
        </a>
        <a
          href={`mailto:${SPONSORSHIP_EMAIL}?subject=Sponsorship%20Inquiry`}
          className={buttonVariants({ variant: 'outline', size: 'lg', className: 'gap-2' })}
        >
          <Mail size={16} aria-hidden="true" />
          {SPONSORSHIP_EMAIL}
        </a>
      </div>
    </section>
  )
}

export function SponsorView() {
  useScrollToHash({ focusTarget: true })
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Hero />
      <MarketContext />
      <SponsorAudiences />
      <Tiers />
      <EditorialPromise />
      <Goal />
      <ContactCTA />
    </div>
  )
}
