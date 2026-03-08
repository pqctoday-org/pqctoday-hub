import React from 'react'
import clsx from 'clsx'
import { Briefcase } from 'lucide-react'
import type { AssessmentProfile } from '../../../hooks/assessmentTypes'
import { CollapsibleSection } from '../ReportContent'

const AGILITY_LABELS: Record<string, string> = {
  'fully-abstracted': 'Fully abstracted',
  'partially-abstracted': 'Partially abstracted',
  hardcoded: 'Hardcoded',
  unknown: 'Unknown',
}

const MIGRATION_STATUS_LABELS: Record<string, string> = {
  started: 'Started',
  planning: 'Planning',
  'not-started': 'Not started',
  unknown: 'Unknown',
}

const TIMELINE_LABELS: Record<string, string> = {
  'within-1y': 'Within 1 year',
  'within-2-3y': 'Within 2-3 years',
  'internal-deadline': 'Internal deadline',
  'no-deadline': 'No deadline',
  unknown: 'Unknown',
}

export const ProfileField = ({ label, value }: { label: string; value: string | undefined }) => {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
        {label}
      </span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  )
}

export const AssessmentProfileSection = ({
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
                    ? `${profile.useCases.length} selected`
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
