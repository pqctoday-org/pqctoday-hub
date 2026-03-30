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
import { LicenseSection } from './sections/LicenseSection'
import { RagAiSection } from './sections/RagAiSection'
import { CryptoBuffSection } from './sections/CryptoBuffSection'
import { AppearanceSection } from './sections/AppearanceSection'
import { TrustScoreMethodologySection } from './sections/TrustScoreMethodologySection'

export function AboutView() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 py-4 md:py-8 space-y-6 md:space-y-8">
      <ReleaseNotesSection />
      <VisionSection />
      <TransparencySection />
      <CloudSyncPrivacySection />
      <CommunitySection />
      <DataFoundationSection />
      <TrustScoreMethodologySection />
      <SbomSection />
      <SecurityAuditSection />
      <DataPrivacySection />
      <LicenseSection />
      <RagAiSection />
      <CryptoBuffSection />
      <AppearanceSection />
    </div>
  )
}
