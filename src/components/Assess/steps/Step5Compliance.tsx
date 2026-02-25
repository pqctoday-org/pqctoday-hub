import { useMemo } from 'react'

import { ArrowRight, Info } from 'lucide-react'

import { Link } from 'react-router-dom'
import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { AVAILABLE_COMPLIANCE } from '../../../hooks/assessmentData'

import { industryComplianceConfigs, getIndustryConfigs } from '../../../data/industryAssessConfig'

// EU member states: frameworks listing "European Union" apply to users in any of these countries
const EU_MEMBER_COUNTRIES = new Set([
  'European Union',
  'France',
  'Germany',
  'Italy',
  'Spain',
  'Czech Republic',
  'Netherlands',
  'Belgium',
  'Sweden',
  'Denmark',
  'Finland',
  'Ireland',
  'Portugal',
  'Austria',
  'Poland',
  'Hungary',
  'Romania',
  'Bulgaria',
  'Croatia',
  'Estonia',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Slovakia',
  'Slovenia',
  'Cyprus',
])

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const Step5Compliance = () => {
  const {
    complianceRequirements,
    toggleCompliance,
    complianceUnknown,
    setComplianceUnknown,
    industry,
  } = useAssessmentStore()
  const country = useAssessmentStore((s) => s.country)

  // Build set of labels that match the selected country
  const countryMatchingLabels = useMemo(() => {
    if (!country || country === 'Global') return null // no filter
    const isEuMember = EU_MEMBER_COUNTRIES.has(country)
    const set = new Set<string>()
    for (const cfg of industryComplianceConfigs) {
      if (
        cfg.countries.length === 0 ||
        cfg.countries.includes('Global') ||
        cfg.countries.includes(country) ||
        // EU-wide frameworks (listed as "European Union" only) apply to all EU member states
        (isEuMember && cfg.countries.includes('European Union'))
      ) {
        set.add(cfg.label)
      }
    }
    return set
  }, [country])

  const industryFrameworks = useMemo(() => {
    let configs = getIndustryConfigs(industryComplianceConfigs, industry)
    if (countryMatchingLabels) {
      configs = configs.filter((cfg) => countryMatchingLabels.has(cfg.label))
    }
    return configs
  }, [industry, countryMatchingLabels])
  // Description lookup by label — used to show consistent short descriptions for all frameworks
  const descriptionByLabel = useMemo(
    () => new Map(industryComplianceConfigs.map((cfg) => [cfg.label, cfg.description])),
    []
  )

  const industryLabelSet = useMemo(
    () => new Set(industryFrameworks.map((f) => f.label)),
    [industryFrameworks]
  )
  const industrySpecificComplianceLabels = useMemo(() => {
    const set = new Set<string>()
    for (const cfg of industryComplianceConfigs) {
      if (cfg.industries.length > 0 && cfg.industries.length <= 2) {
        set.add(cfg.label)
      }
    }
    return set
  }, [])
  const universalFrameworks = useMemo(
    () =>
      AVAILABLE_COMPLIANCE.filter(
        (f) =>
          !industryLabelSet.has(f) &&
          (industry === 'Other' || !industry || !industrySpecificComplianceLabels.has(f)) &&
          (!countryMatchingLabels || countryMatchingLabels.has(f))
      ),
    [industryLabelSet, industry, industrySpecificComplianceLabels, countryMatchingLabels]
  )

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        Which compliance frameworks apply to you?
      </h3>
      <p className="text-sm text-muted-foreground">
        Select all regulatory or compliance frameworks your organization must adhere to. This helps
        identify PQC-related obligations.
      </p>

      <PersonaHint stepKey="compliance" />

      {/* None apply / I don't know — Step 3 model (toggleable, dismissable, dims content) */}
      <button
        aria-pressed={complianceUnknown}
        onClick={() => setComplianceUnknown(!complianceUnknown)}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          complianceUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />
        None apply / I don&apos;t know
      </button>

      <div className={clsx('space-y-4', complianceUnknown && 'opacity-40 pointer-events-none')}>
        {industryFrameworks.length > 0 && (
          <>
            <div className="glass-panel p-3 border-l-4 border-l-primary">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Showing frameworks commonly required in the{' '}
                  <strong className="text-foreground">{industry}</strong> sector
                  {country && country !== 'Global' && (
                    <>
                      {' '}
                      in <strong className="text-foreground">{country}</strong>
                    </>
                  )}
                  .
                </p>
              </div>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-2"
              role="group"
              aria-label={`${industry} compliance frameworks`}
            >
              {industryFrameworks.map((fw) => (
                <button
                  key={fw.id}
                  aria-pressed={complianceRequirements.includes(fw.label)}
                  onClick={() => toggleCompliance(fw.label)}
                  className={clsx(
                    'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
                    complianceRequirements.includes(fw.label)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  <span>{fw.label}</span>
                  {fw.description && (
                    <p className="text-xs mt-1 opacity-80 font-normal leading-snug">
                      {fw.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {universalFrameworks.length > 0 && (
          <div
            className={clsx(industryFrameworks.length > 0 && 'border-t border-border pt-3 mt-2')}
          >
            {industryFrameworks.length > 0 && (
              <p className="text-xs text-muted-foreground font-medium mb-2">Universal frameworks</p>
            )}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-2"
              role="group"
              aria-label="Universal compliance frameworks"
            >
              {universalFrameworks.map((fw) => (
                <button
                  key={fw}
                  aria-pressed={complianceRequirements.includes(fw)}
                  onClick={() => toggleCompliance(fw)}
                  className={clsx(
                    'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
                    complianceRequirements.includes(fw)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  <span>{fw}</span>
                  {descriptionByLabel.get(fw) && (
                    <p className="text-xs mt-1 opacity-80 font-normal leading-snug">
                      {descriptionByLabel.get(fw)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Don&apos;t see your framework? Skip this step — it won&apos;t affect your risk score
            significantly.
          </p>
          <Link
            to="/compliance"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
          >
            <ArrowRight size={12} />
            Explore frameworks
          </Link>
        </div>
      </div>
    </div>
  )
}

export { Step5Compliance }
