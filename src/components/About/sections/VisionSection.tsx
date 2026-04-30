// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Info, Sparkles, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCurrentVersion } from '@/store/useVersionStore'
import { MISSION_TAGS, PRINCIPLES, NOT_ITEMS } from '../aboutData'
import { CareerJourneyModal } from '../CareerJourneyModal'

export function VisionSection() {
  const version = getCurrentVersion()

  const [isMissionOpen, setIsMissionOpen] = useState(false)
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 md:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Info className="text-primary" size={24} />
          <div>
            <h2 className="text-2xl font-semibold">About PQC Today</h2>
            <p className="text-xs text-muted-foreground font-mono">v{version}</p>
          </div>
        </div>
      </div>

      {/* Preliminary section — always visible */}
      <div>
        <p className="text-[11px] tracking-widest uppercase text-muted-foreground mb-3">
          PQCToday &mdash; Public Vision
        </p>
        <h3 className="text-lg font-medium text-foreground leading-snug mb-4">
          Preparing the world for the quantum cryptographic transition
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-4 mb-4">
          The algorithms that protect your data today &mdash; RSA, ECC, the cryptography behind TLS,
          SSH, and every digital signature you have ever trusted &mdash; will be broken by quantum
          computers. The question is not whether. The question is when, and whether the world will
          be ready.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          We are not ready. Most organisations do not know which systems are vulnerable. Most
          practitioners have never practiced post-quantum cryptography hands-on. The tools to learn,
          assess, and migrate exist &mdash; but they are scattered, vendor-biased, or inaccessible
          to the people who need them most.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          PQCToday exists to close that gap.
        </p>
      </div>

      {/* Expand / collapse */}
      <Button
        variant="ghost"
        onClick={() => setIsMissionOpen(!isMissionOpen)}
        className="mt-4 text-xs text-muted-foreground hover:text-primary"
      >
        {isMissionOpen ? 'Collapse vision' : 'Read full vision'}
        <ChevronDown
          size={14}
          className={clsx('ml-1 transition-transform duration-200', isMissionOpen && 'rotate-180')}
        />
      </Button>

      {/* Full vision — collapsible (CSS grid trick avoids height:auto flicker) */}
      <div
        className={clsx(
          'grid transition-all duration-300 ease-in-out',
          isMissionOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-5 space-y-5">
            <hr className="border-border" />

            {/* What we are building */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">What we are building</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                PQCToday is a neutral, community-governed platform providing independent education,
                hands-on simulation, and migration guidance for the global post-quantum cryptography
                transition.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                We run real cryptographic reference implementations &mdash; including SoftHSMv3, an
                experimental open source PKCS#11 v3.2 HSM with NIST PQC algorithm support &mdash;
                directly in your browser. No installation. No cloud account. No data leaving your
                device.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                We cover every domain the transition touches: TLS, SSH, email, PKI, HSM key
                management, 5G authentication, digital identity, blockchain, IoT, and the regulatory
                frameworks &mdash; NIST, ETSI, DORA, NIS2, NSM-10, ANSSI &mdash; that are setting
                the deadlines.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Our Command Center provides 14 interactive planning tools for executives and
                compliance teams &mdash; ROI calculators, RACI builders, vendor scorecards, policy
                generators, deployment playbooks, and audit checklists &mdash; all adapting to your
                industry, geography, and regulatory context.
              </p>
              <div className="flex flex-wrap gap-2">
                {MISSION_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <hr className="border-border" />

            {/* Founding principles */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Our founding principles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
                {PRINCIPLES.map(({ label, text }) => (
                  <div key={label} className="bg-card p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-primary mb-1">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-border" />

            {/* What we are not */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">What we are not</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NOT_ITEMS.map(({ label, text }) => (
                  <div key={label} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-status-error mb-1">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-border" />

            {/* Quote */}
            <div className="bg-muted/20 border border-primary/20 rounded-xl p-5">
              <p className="text-sm text-primary leading-relaxed italic">
                &ldquo;We seek the endorsement and support of existing standards bodies and PQC
                experts. We aim to empower these bodies rather than replace them &mdash; and to
                enable them to simplify and improve the deployment of quantum-safe best practices
                worldwide.&rdquo;
              </p>
            </div>

            <hr className="border-border" />

            {/* Who this is for */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Who this is for</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                Every organisation that processes sensitive data has a quantum exposure problem
                &mdash; whether they know it yet or not. Governments. Banks. Hospitals. Telecoms.
                Manufacturers. The practitioner who needs to understand ML-KEM before their next
                architecture review. The CISO who needs to explain quantum risk to their board. The
                engineer who needs to practice PKCS#11 v3.2 operations before touching production.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PQCToday is built for all of them. The platform adapts to your role, your industry,
                your regulatory environment, and your proficiency level &mdash; and it does so
                without asking you to register, share data, or trust us with anything except your
                time.
              </p>
            </div>

            <hr className="border-border" />

            {/* Open source foundation */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                The open source foundation
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                PQCToday is built on open source. Our platform code, our cryptographic simulators,
                and our community corpus are all publicly available. SoftHSMv3 &mdash; an
                experimental PKCS#11 v3.2 HSM implementation at the heart of our simulator &mdash;
                is a standalone open source project available on GitHub and npm, free for anyone to
                use in their own applications.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We believe the infrastructure for PQC migration training should be open, auditable,
                and independent of any single organisation&apos;s interests. That belief is not a
                marketing position. It is the architecture.
              </p>
            </div>

            <hr className="border-border" />

            {/* The timeline is not optional */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                The timeline is not optional
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                NIST published its first post-quantum cryptographic standards in 2024. US federal
                agencies are under NSM-10 migration mandates. European financial institutions face
                DORA Article 9 cryptographic control requirements. The window for &ldquo;we will
                think about it later&rdquo; has closed.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                The organisations that begin their cryptographic inventory, upskill their teams, and
                start their migration planning now will complete the transition on their terms.
                Those that wait will complete it under regulatory pressure, in crisis mode, with
                less time and more risk.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PQCToday exists to make sure the knowledge and tools needed for that transition are
                available to everyone &mdash; for free, without conditions, without a sales
                conversation, and without compromising the privacy of the people who need them.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal links — always visible */}
      <hr className="border-border mt-5" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5">
        <p className="text-sm text-muted-foreground">
          Connect:{' '}
          <a
            href="https://www.linkedin.com/in/eric-amador-971850a"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Eric Amador on LinkedIn
          </a>
        </p>
        <span className="hidden sm:inline text-muted-foreground/30">•</span>
        <Button
          variant="ghost"
          onClick={() => setIsJourneyModalOpen(true)}
          className="inline-flex items-center gap-2 text-accent hover:text-accent/80 group"
        >
          <Sparkles size={16} className="group-hover:animate-pulse" />
          <span className="font-semibold underline decoration-2 underline-offset-4">
            View My Career Journey
          </span>
        </Button>
      </div>
      <CareerJourneyModal
        isOpen={isJourneyModalOpen}
        onClose={() => setIsJourneyModalOpen(false)}
      />
    </motion.div>
  )
}
