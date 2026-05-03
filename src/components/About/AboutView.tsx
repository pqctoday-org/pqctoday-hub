// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { ReleaseNotesSection } from './sections/ReleaseNotesSection'
import { VisionSection } from './sections/VisionSection'
import { TransparencySection } from './sections/TransparencySection'
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
import { useIsEmbedded } from '../../embed/EmbedProvider'

export function AboutView() {
  const isEmbedded = useIsEmbedded()

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      <AboutSection slug="release-notes">
        <ReleaseNotesSection />
      </AboutSection>
      <AboutSection slug="vision">
        <VisionSection />
      </AboutSection>
      <AboutSection slug="transparency">
        <TransparencySection />
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
