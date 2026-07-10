// SPDX-License-Identifier: GPL-3.0-only
// /report's "Assessment Profile" section (REPORT_SECTION_ORDER: 'assessmentProfile').
// Extracted from ReportContent.tsx — see reportSectionToCswp39.ts.
import { Briefcase } from 'lucide-react'
import clsx from 'clsx'
import type { AssessmentProfile } from '../../../hooks/assessmentTypes'
import {
  CollapsibleSection,
  ProfileField,
  MIGRATION_STATUS_LABELS,
  CREDENTIAL_LIFETIME_LABELS,
  SCALE_LABELS,
  AGILITY_LABELS,
  TIMELINE_LABELS,
} from './reportContentShared'

export const AssessmentProfileSummary = ({
  profile,
  defaultOpen = false,
}: {
  profile: AssessmentProfile
  defaultOpen?: boolean
}) => {
  return (
    <CollapsibleSection
      title="Assessment Profile"
      icon={<Briefcase className="text-primary" size={20} />}
      defaultOpen={defaultOpen}
      infoTip="assessmentProfile"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ProfileField label="Industry" value={profile.industry} />
        <ProfileField label="Country" value={profile.country || 'Not specified'} />
        <ProfileField
          label="Algorithms"
          value={
            profile.algorithmUnknown
              ? 'Unknown (conservative defaults)'
              : profile.algorithmsSelected.length > 0
                ? `${profile.algorithmsSelected.length} selected`
                : 'None'
          }
        />
        <ProfileField
          label="Sensitivity"
          value={
            profile.sensitivityUnknown
              ? 'Unknown (assumed high)'
              : profile.sensitivityLevels.join(', ') || 'None'
          }
        />
        <ProfileField
          label="Compliance"
          value={
            profile.complianceUnknown
              ? 'Unknown'
              : profile.complianceFrameworks.length > 0
                ? `${profile.complianceFrameworks.length} framework${profile.complianceFrameworks.length !== 1 ? 's' : ''}`
                : 'None'
          }
        />
        <ProfileField
          label="Migration Status"
          value={MIGRATION_STATUS_LABELS[profile.migrationStatus] ?? profile.migrationStatus}
        />
        {profile.mode === 'comprehensive' && (
          <>
            <ProfileField
              label="Use Cases"
              value={
                profile.useCasesUnknown
                  ? 'Unknown'
                  : profile.useCases?.length
                    ? profile.useCases.join(', ')
                    : 'None'
              }
            />
            <ProfileField
              label="Data Retention"
              value={
                profile.retentionUnknown
                  ? 'Unknown (industry default)'
                  : profile.retentionPeriods?.join(', ') || 'None'
              }
            />
            <ProfileField
              label="Credential Lifetime"
              value={
                profile.credentialLifetimeUnknown
                  ? 'Unknown (conservative 10y)'
                  : profile.credentialLifetimes?.length
                    ? profile.credentialLifetimes
                        .map((v) => CREDENTIAL_LIFETIME_LABELS[v] ?? v)
                        .join(', ')
                    : 'None'
              }
            />
            <ProfileField
              label="Org Scale"
              value={
                profile.scaleUnknown
                  ? 'Unknown (industry default)'
                  : profile.systemScale
                    ? `${SCALE_LABELS[profile.systemScale] ?? profile.systemScale} systems, ${SCALE_LABELS[profile.teamSize ?? ''] ?? profile.teamSize} engineers`
                    : undefined
              }
            />
            <ProfileField
              label="Crypto Agility"
              value={profile.cryptoAgility ? AGILITY_LABELS[profile.cryptoAgility] : undefined}
            />
            <ProfileField
              label="Infrastructure"
              value={
                profile.infrastructureUnknown
                  ? 'Unknown'
                  : profile.infrastructure?.length
                    ? `${profile.infrastructure.length} layer${profile.infrastructure.length !== 1 ? 's' : ''}`
                    : 'None'
              }
            />
            <ProfileField
              label="Vendor Model"
              value={
                profile.vendorUnknown
                  ? 'Unknown'
                  : profile.vendorDependency?.replace('-', ' ') || undefined
              }
            />
            <ProfileField
              label="Timeline Pressure"
              value={
                profile.timelinePressure ? TIMELINE_LABELS[profile.timelinePressure] : undefined
              }
            />
          </>
        )}
      </div>
      <div className="mt-2">
        <span
          className={clsx(
            'inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full',
            profile.mode === 'comprehensive'
              ? 'bg-primary/10 text-primary'
              : 'bg-muted/20 text-muted-foreground'
          )}
        >
          {profile.mode === 'comprehensive' ? 'Comprehensive' : 'Quick'} Assessment
        </span>
      </div>
    </CollapsibleSection>
  )
}
