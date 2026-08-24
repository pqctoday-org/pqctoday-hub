// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef } from 'react'
import { ReleaseNotesSection } from './sections/ReleaseNotesSection'
import { VisionSection } from './sections/VisionSection'
import { PersonalizationSection } from './sections/PersonalizationSection'
import { TransparencySection } from './sections/TransparencySection'
import { TrustEngineSection } from './sections/TrustEngineSection'
import { CloudSyncPrivacySection } from './sections/CloudSyncPrivacySection'
import { CommunitySection } from './sections/CommunitySection'
import { DataFoundationSection } from './sections/DataFoundationSection'
import { SbomSection } from './sections/SbomSection'
import { SecurityAuditSection } from './sections/SecurityAuditSection'
import { DataPrivacySection } from './sections/DataPrivacySection'
import { EnterpriseSection } from './sections/EnterpriseSection'
import { LicenseSection } from './sections/LicenseSection'
import { RagAiSection } from './sections/RagAiSection'
import { CryptoBuffSection } from './sections/CryptoBuffSection'
import { AppearanceSection } from './sections/AppearanceSection'
import { AboutNextStepCTA } from './AboutNextStepCTA'
import { ExecutiveAboutSummary } from './ExecutiveAboutSummary'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logAboutOutboundLink } from '@/utils/analytics'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileAboutView } from '@/components/Mobile/screens/MobileAboutView'

export function AboutView() {
  const isMobileShell = useIsMobileShell()
  const isEmbedded = useIsEmbedded()
  const isExecutive = usePersonaStore((s) => s.selectedPersona) === 'executive'
  const containerRef = useRef<HTMLDivElement>(null)

  /**
   * Event-delegated outbound-link logger — closes audit task P18-P1-01.
   * Attached at the DOM level (not a synthetic onClick on a non-interactive
   * div, which jsx-a11y blocks) so a single capture-phase listener handles
   * every outbound `<a>` in the 15 About sub-sections without per-link edits.
   */
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest('a') as HTMLAnchorElement | null
      if (!target || !target.href) return
      try {
        const url = new URL(target.href, window.location.href)
        if (url.origin !== window.location.origin) {
          logAboutOutboundLink(url.href)
        }
      } catch {
        // Malformed href — skip silently
      }
    }
    node.addEventListener('click', handler)
    return () => node.removeEventListener('click', handler)
  }, [])

  // Placed after every hook above (React rules; the desktop-only ones just
  // run and are discarded) but before the desktop JSX — a pure early return
  // with zero risk to the flag-off path (Rule 1). AboutView is never
  // simulation-embedded (no widget under shared/widgets imports it), so
  // unlike Threats/Library this needs no simEmbed-equivalent guard.
  if (isMobileShell) {
    return <MobileAboutView />
  }

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* /about has never had a level-one heading — VisionSection's "About PQC
          Today" is an <h2>, and this page deliberately omits the standard
          PageHeader (which is what supplies the h1 elsewhere). axe's
          `page-has-heading-one` therefore fires here, intermittently enough
          that the smoke gate had been passing by luck; confirmed present on
          origin/main too, so it predates the B+ work.

          Visually hidden rather than a new visible title: the page already
          reads as "About PQC Today" two lines below, and adding a second
          visible one to satisfy a linter would be the tail wagging the dog.
          Screen readers and axe both get the landmark they need. */}
      <h1 className="sr-only">About PQC Today</h1>
      {isExecutive && !isEmbedded && <ExecutiveAboutSummary />}
      <AboutSection slug="vision">
        <VisionSection defaultExpanded={isExecutive} />
      </AboutSection>
      {/* B+ remediation 1.1 (2026-08-10): placed second, directly under Vision
          and above everything else, because the review traced relevance
          penalties on other pages back to this one unexplained mechanic —
          it has to be read early to do its job. */}
      <AboutSection slug="personalization">
        <PersonalizationSection />
      </AboutSection>
      <AboutSection slug="release-notes">
        <ReleaseNotesSection />
      </AboutSection>
      <AboutSection slug="transparency">
        <TransparencySection />
      </AboutSection>
      <AboutSection slug="trust-engine">
        <TrustEngineSection />
      </AboutSection>
      {/* Cloud sync, community, embedding docs, and appearance are standalone-only */}
      {!isEmbedded && (
        <AboutSection slug="cloud-sync">
          <CloudSyncPrivacySection />
        </AboutSection>
      )}
      {!isEmbedded && (
        <AboutSection slug="community">
          <CommunitySection />
        </AboutSection>
      )}
      <AboutSection slug="data-foundation">
        <DataFoundationSection />
      </AboutSection>
      <AboutSection slug="sbom">
        <SbomSection />
      </AboutSection>
      <AboutSection slug="security-audit">
        <SecurityAuditSection />
      </AboutSection>
      <AboutSection slug="data-privacy">
        <DataPrivacySection />
      </AboutSection>
      {!isEmbedded && (
        <AboutSection slug="enterprise">
          <EnterpriseSection />
        </AboutSection>
      )}
      <AboutSection slug="license">
        <LicenseSection />
      </AboutSection>
      <AboutSection slug="rag-ai">
        <RagAiSection />
      </AboutSection>
      {!isEmbedded && (
        <AboutSection slug="cryptobuff">
          <CryptoBuffSection />
        </AboutSection>
      )}
      {!isEmbedded && (
        <AboutSection slug="appearance">
          <AppearanceSection />
        </AboutSection>
      )}

      <AboutNextStepCTA />
    </div>
  )
}

/**
 * Wrapper that gives each /about section a stable HTML anchor (`id="about-{slug}"`)
 * and a workshop selector (`data-workshop-target="section-{slug}"`). Workshop cues
 * use `scroll-to` + `spotlight` to walk a viewer through the about page.
 */
const AboutSection: React.FC<{ slug: string; children: React.ReactNode }> = ({
  slug,
  children,
}) => (
  <div id={`about-${slug}`} data-workshop-target={`section-${slug}`} className="scroll-mt-20">
    {children}
  </div>
)
