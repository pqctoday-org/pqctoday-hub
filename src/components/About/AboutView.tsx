// SPDX-License-Identifier: GPL-3.0-only
import { ReleaseNotesSection } from './sections/ReleaseNotesSection'
import { VisionSection } from './sections/VisionSection'
import { TransparencySection } from './sections/TransparencySection'
import { CloudSyncPrivacySection } from './sections/CloudSyncPrivacySection'
import { CommunitySection } from './sections/CommunitySection'
import { DataFoundationSection } from './sections/DataFoundationSection'
import { SbomSection } from './sections/SbomSection'
import { SecurityAuditSection } from './sections/SecurityAuditSection'
import { DataPrivacySection } from './sections/DataPrivacySection'
import { EmbeddingModeSection } from './sections/EmbeddingModeSection'
import { LicenseSection } from './sections/LicenseSection'
import { RagAiSection } from './sections/RagAiSection'
import { CryptoBuffSection } from './sections/CryptoBuffSection'
import { AppearanceSection } from './sections/AppearanceSection'
import { TrustScoreMethodologySection } from './sections/TrustScoreMethodologySection'
import { useIsEmbedded } from '../../embed/EmbedProvider'

export function AboutView() {
  const isEmbedded = useIsEmbedded()

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 py-4 md:py-8 space-y-6 md:space-y-8">
      <ReleaseNotesSection />
      <VisionSection />
      <TransparencySection />
      {/* Cloud sync, community, embedding docs, and appearance are standalone-only */}
      {!isEmbedded && <CloudSyncPrivacySection />}
      {!isEmbedded && <CommunitySection />}
      <DataFoundationSection />
      <TrustScoreMethodologySection />
      <SbomSection />
      <SecurityAuditSection />
      <DataPrivacySection />
      {!isEmbedded && <EmbeddingModeSection />}
      <LicenseSection />
      <RagAiSection />
      {!isEmbedded && <CryptoBuffSection />}
      {!isEmbedded && <AppearanceSection />}
    </div>
  )
}
