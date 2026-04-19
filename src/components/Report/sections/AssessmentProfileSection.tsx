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

const RETENTION_LABELS: Record<string, string> = {
  'under-1y': '< 1 year',
  '1-5y': '1–5 years',
  '5-10y': '5–10 years',
  '10-25y': '10–25 years',
  '25-plus': '25+ years',
  indefinite: 'Indefinite',
}

const CREDENTIAL_LABELS: Record<string, string> = {
  'under-1y': '< 1 year',
  '1-3y': '1–3 years',
  '3-10y': '3–10 years',
  '10-25y': '10–25 years',
  '25-plus': '25+ years',
  indefinite: 'Indefinite',
}

const SCALE_LABELS: Record<string, string> = {
  '1-10': '1–10',
  '11-50': '11–50',
  '51-200': '51–200',
  '200-plus': '200+',
}

function formatList<T extends string>(
  values: T[] | undefined,
  labels: Record<string, string>
): string | undefined {
  if (!values?.length) return undefined
  // eslint-disable-next-line security/detect-object-injection
  return values.map((v) => labels[v] ?? v).join(', ')
}

/**
 * Render infrastructure as `Layer (subcat1, subcat2); Layer2 (subcatA)` so the
 * user sees not only *which layers* but *what under each* — closing the gap
 * where Step 11 sub-categories were collected but never surfaced.
 */
function formatInfrastructureValue(layers: string[], subCats?: Record<string, string[]>): string {
  if (!subCats || Object.keys(subCats).length === 0) {
    return `${layers.length} layer${layers.length !== 1 ? 's' : ''}`
  }
  return layers
    .map((layer) => {
      // eslint-disable-next-line security/detect-object-injection
      const subs = subCats[layer]
      return subs && subs.length > 0 ? `${layer} (${subs.join(', ')})` : layer
    })
    .join('; ')
}

export const ProfileField = ({
  label,
  value,
  estimatedFrom,
  hint,
}: {
  label: string
  value: string | undefined
  estimatedFrom?: string
  /** Short explanation of how this field feeds the risk score. Shown as a
   *  native browser tooltip on the label — closes the "why did you ask this?"
   *  transparency gap for fields that only surface here. */
  hint?: string
}) => {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium inline-flex items-center gap-1"
        title={hint}
      >
        {label}
        {hint && <span className="text-muted-foreground/50 text-[9px]">ⓘ</span>}
      </span>
      <span className="text-xs text-foreground flex items-center gap-1.5 flex-wrap">
        {value}
        {estimatedFrom && (
          <span
            className="inline-flex items-center text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
            title={`Estimated from your ${estimatedFrom} industry default. Override in Assess to refine.`}
          >
            est · {estimatedFrom}
          </span>
        )}
      </span>
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
                : profile.algorithmCategories && profile.algorithmCategories.length > 0
                  ? `Families: ${profile.algorithmCategories.join(', ')}`
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
          hint="Feeds Organizational Readiness (40% of that category). 'Not started' adds risk; 'started' reduces it."
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
                  ? 'Industry default applied'
                  : formatList(profile.retentionPeriods, RETENTION_LABELS) || 'None'
              }
              estimatedFrom={profile.retentionUnknown ? profile.industry : undefined}
            />
            <ProfileField
              label="Credential Lifetime"
              value={
                profile.credentialLifetimeUnknown
                  ? 'Industry default applied'
                  : formatList(profile.credentialLifetimes, CREDENTIAL_LABELS) || 'None'
              }
              estimatedFrom={profile.credentialLifetimeUnknown ? profile.industry : undefined}
            />
            <ProfileField
              label="System Scale"
              value={
                profile.scaleUnknown
                  ? 'Industry default applied'
                  : profile.systemScale
                    ? `${SCALE_LABELS[profile.systemScale] ?? profile.systemScale} systems`
                    : undefined
              }
              estimatedFrom={profile.scaleUnknown ? profile.industry : undefined}
              hint="Feeds Migration Complexity (15%). Larger scale = longer migration timeline."
            />
            <ProfileField
              label="Team Size"
              value={
                profile.scaleUnknown
                  ? 'Industry default applied'
                  : profile.teamSize
                    ? `${SCALE_LABELS[profile.teamSize] ?? profile.teamSize} people`
                    : undefined
              }
              estimatedFrom={profile.scaleUnknown ? profile.industry : undefined}
              hint="Feeds Organizational Readiness (25%). Smaller team = slower execution capacity."
            />
            <ProfileField
              label="Crypto Agility"
              value={profile.cryptoAgility ? AGILITY_LABELS[profile.cryptoAgility] : undefined}
              hint="Feeds Migration Complexity (40%). Hardcoded crypto = harder migration; fully-abstracted = easier."
            />
            <ProfileField
              label="Infrastructure"
              value={
                profile.infrastructureUnknown
                  ? 'Unknown'
                  : profile.infrastructure?.length
                    ? formatInfrastructureValue(
                        profile.infrastructure,
                        profile.infrastructureSubCategories
                      )
                    : 'None'
              }
              hint="Feeds Migration Complexity (30%). More layers and HSMs/legacy systems increase complexity."
            />
            <ProfileField
              label="Vendor Model"
              value={
                profile.vendorUnknown
                  ? 'Unknown'
                  : profile.vendorDependency?.replace('-', ' ') || undefined
              }
              hint="Feeds Migration Complexity (15%) + Org Readiness (15%). Heavy vendor reliance slows migration."
            />
            <ProfileField
              label="Timeline Pressure"
              value={
                profile.timelinePressure ? TIMELINE_LABELS[profile.timelinePressure] : undefined
              }
              hint="Feeds Regulatory Pressure (25%). Near-term deadlines push the score up."
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
