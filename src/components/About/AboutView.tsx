// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef } from 'react'
import { ReleaseNotesSection } from './sections/ReleaseNotesSection'
import { VisionSection } from './sections/VisionSection'
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
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { logAboutOutboundLink } from '@/utils/analytics'

export function AboutView() {
  const isEmbedded = useIsEmbedded()
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

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      <AboutSection slug="vision">
        <VisionSection />
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
