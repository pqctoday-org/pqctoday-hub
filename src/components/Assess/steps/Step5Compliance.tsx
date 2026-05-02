// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useEffect, useCallback } from 'react'
import {
  ArrowRight,
  Info,
  ShieldCheck,
  ShieldAlert,
  Clock,
  BookOpen,
  FileText,
  Award,
  Scale,
  Import,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { useComplianceSelectionStore } from '../../../store/useComplianceSelectionStore'
import { usePersonaStore } from '../../../store/usePersonaStore'
import {
  complianceFrameworks,
  type ComplianceFramework,
  type BodyType,
} from '../../../data/complianceData'
import { REGION_COUNTRIES_MAP } from '../../../data/personaConfig'
import { deadlineUrgency, urgencyColor } from '../../../utils/deadlineUrgency'
import { EU_MEMBER_COUNTRIES } from '../../../utils/euCountries'
import { Button } from '../../ui/button'
import { PersonaHint } from './PersonaHint'

const BODY_TYPE_SECTIONS: { bodyType: BodyType; label: string; icon: typeof BookOpen }[] = [
  { bodyType: 'standardization_body', label: 'Standardization Bodies', icon: BookOpen },
  { bodyType: 'technical_standard', label: 'Technical Standards', icon: FileText },
  { bodyType: 'certification_body', label: 'Certification Schemes', icon: Award },
  { bodyType: 'compliance_framework', label: 'Compliance Frameworks', icon: Scale },
]

const Step5Compliance = () => {
  const {
    complianceRequirements,
    toggleCompliance,
    setComplianceRequirements,
    complianceUnknown,
    setComplianceUnknown,
    industry,
    importComplianceSelection,
    setImportComplianceSelection,
  } = useAssessmentStore()
  const country = useAssessmentStore((s) => s.country)
  const { selectedRegion } = usePersonaStore()

  const myFrameworks = useComplianceSelectionStore((s) => s.myFrameworks)
  const toggleMyFramework = useComplianceSelectionStore((s) => s.toggleMyFramework)

  // Filter frameworks by industry + country (region fallback), then group by bodyType
  const { groupedFrameworks, filteredFrameworkIds } = useMemo(() => {
    const isEuMember = country ? EU_MEMBER_COUNTRIES.has(country) : false
    const regionCountries =
      (!country || country === 'Global') && selectedRegion && selectedRegion !== 'global'
        ? new Set(REGION_COUNTRIES_MAP[selectedRegion])
        : null

    const filtered = complianceFrameworks.filter((fw) => {
      // Industry filter: show if universal (0 or 3+ industries) or matches selected industry
      if (industry && industry !== 'Other') {
        const isUniversal = fw.industries.length === 0 || fw.industries.length >= 3
        if (!isUniversal && !fw.industries.includes(industry)) return false
      }

      // Country filter: exact match takes priority; region fallback when country is blank
      if (country && country !== 'Global') {
        const matchesCountry =
          fw.countries.length === 0 ||
          fw.countries.includes('Global') ||
          fw.countries.includes(country) ||
          (isEuMember && fw.countries.includes('European Union'))
        if (!matchesCountry) return false
      } else if (regionCountries) {
        const matchesRegion =
          fw.countries.length === 0 ||
          fw.countries.includes('Global') ||
          fw.countries.some((c) => regionCountries.has(c)) ||
          (selectedRegion === 'eu' && fw.countries.includes('European Union'))
        if (!matchesRegion) return false
      }

      return true
    })

    // Sort: requiresPQC first, then by deadline year ascending, then alphabetical
    filtered.sort((a, b) => {
      if (a.requiresPQC !== b.requiresPQC) return a.requiresPQC ? -1 : 1
      const yearA = a.deadline.match(/\b(20\d{2})\b/)?.[1]
      const yearB = b.deadline.match(/\b(20\d{2})\b/)?.[1]
      if (yearA && yearB) return parseInt(yearA, 10) - parseInt(yearB, 10)
      if (yearA) return -1
      if (yearB) return 1
      return a.label.localeCompare(b.label)
    })

    // Build ID set for filter intersection
    const ids = new Set(filtered.map((fw) => fw.id))

    // Group by bodyType
    const groups = new Map<BodyType, ComplianceFramework[]>()
    for (const fw of filtered) {
      const list = groups.get(fw.bodyType) ?? []
      list.push(fw)
      groups.set(fw.bodyType, list)
    }
    return { groupedFrameworks: groups, filteredFrameworkIds: ids }
  }, [industry, country, selectedRegion])

  // Bidirectional sync: when import ON, sync complianceRequirements from myFrameworks
  useEffect(() => {
    if (!importComplianceSelection || complianceUnknown) return
    const labels = complianceFrameworks
      .filter((fw) => myFrameworks.includes(fw.id) && filteredFrameworkIds.has(fw.id))
      .map((fw) => fw.label)
    setComplianceRequirements(labels)
  }, [
    importComplianceSelection,
    myFrameworks,
    filteredFrameworkIds,
    complianceUnknown,
    setComplianceRequirements,
  ])

  // Toggle handler: bidirectional when import ON
  const handleToggle = useCallback(
    (fw: ComplianceFramework) => {
      if (importComplianceSelection) {
        // Update compliance page store → useEffect syncs complianceRequirements
        toggleMyFramework(fw.id)
      } else {
        // Manual mode: only update assessment store
        toggleCompliance(fw.label)
      }
    },
    [importComplianceSelection, toggleMyFramework, toggleCompliance]
  )

  // Determine if a framework is selected.
  // When "I'm not sure" is active, smart-defaults land in complianceRequirements —
  // honor that regardless of import-mode so the pre-selected items highlight.
  const isSelected = useCallback(
    (fw: ComplianceFramework) => {
      if (complianceUnknown) return complianceRequirements.includes(fw.label)
      if (importComplianceSelection) return myFrameworks.includes(fw.id)
      return complianceRequirements.includes(fw.label)
    },
    [complianceUnknown, importComplianceSelection, myFrameworks, complianceRequirements]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">
          Which compliance frameworks apply to you?
        </h3>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setImportComplianceSelection(!importComplianceSelection)}
          className={clsx(
            'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium whitespace-nowrap shrink-0',
            importComplianceSelection
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
          )}
          aria-pressed={importComplianceSelection}
          title={
            importComplianceSelection
              ? 'Syncing with your compliance page selections'
              : 'Using manual selections for this assessment only'
          }
        >
          <Import size={12} />
          {importComplianceSelection ? 'Synced' : 'Import off'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Select all regulatory or compliance frameworks your organization must adhere to. This helps
        identify PQC-related obligations.
      </p>

      {importComplianceSelection && myFrameworks.length > 0 && (
        <div className="glass-panel p-3 border-l-4 border-l-secondary">
          <div className="flex items-center gap-2">
            <Import size={14} className="text-secondary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Synced with your{' '}
              <Link to="/compliance" className="text-primary hover:underline">
                compliance page
              </Link>{' '}
              selections ({myFrameworks.length} total). Changes here update your saved selections.
            </p>
          </div>
        </div>
      )}

      <PersonaHint stepKey="compliance" />

      {/* None apply / I don't know */}
      <Button
        variant="ghost"
        aria-pressed={complianceUnknown}
        onClick={() => setComplianceUnknown(!complianceUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          complianceUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
      >
        <Info size={14} className="shrink-0" />
        I&apos;m not sure — help me choose
      </Button>
      {complianceUnknown && (
        <p className="text-xs text-muted-foreground italic">
          Recommended for {industry || 'your industry'}
          {country && country !== 'Global' ? ` in ${country}` : ''}. You can adjust any selection.
        </p>
      )}

      <div className="space-y-5">
        {industry && (
          <div className="glass-panel p-3 border-l-4 border-l-primary">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Showing frameworks relevant to{' '}
                <strong className="text-foreground">{industry}</strong>
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
        )}

        {BODY_TYPE_SECTIONS.map((section) => {
          const frameworks = groupedFrameworks.get(section.bodyType)
          if (!frameworks?.length) return null

          const SectionIcon = section.icon
          return (
            <div key={section.bodyType}>
              <div className="flex items-center gap-2 mb-2">
                <SectionIcon size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {section.label}
                </span>
                <span className="text-xs text-muted-foreground">({frameworks.length})</span>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-2"
                role="group"
                aria-label={section.label}
              >
                {frameworks.map((fw) => {
                  const selected = isSelected(fw)
                  const urgency = deadlineUrgency(fw.deadline)
                  const showDeadline = fw.deadline && fw.deadline !== 'Ongoing'

                  return (
                    <Button
                      key={fw.id}
                      variant="ghost"
                      aria-pressed={selected}
                      onClick={() => handleToggle(fw)}
                      className={clsx(
                        'h-auto p-3 flex-col items-start whitespace-normal border',
                        selected
                          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                          : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {fw.requiresPQC ? (
                          <ShieldCheck size={14} className="text-status-success shrink-0" />
                        ) : (
                          <ShieldAlert size={14} className="text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm font-medium">{fw.label}</span>
                      </div>
                      {showDeadline && (
                        <div
                          className={clsx(
                            'flex items-center gap-1 text-[10px] mt-1',
                            urgencyColor(urgency)
                          )}
                        >
                          <Clock size={10} />
                          <span>{fw.deadline}</span>
                        </div>
                      )}
                      {fw.description && (
                        <p className="text-xs mt-1 opacity-80 font-normal leading-snug line-clamp-2 text-left">
                          {fw.description}
                        </p>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        })}

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
