// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import {
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import {
  COMPLIANCE_MANDATES,
  getMandatesForIndustry,
  getEarliestDeadline,
  type ComplianceMandate,
  type ComplianceRegion,
} from '../data/industryComplianceData'
import { AVAILABLE_INDUSTRIES } from '../data/sensitivityConstants'

type StatusValue = 'not-started' | 'in-progress' | 'compliant'

const STATUS_LABELS: Record<StatusValue, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  compliant: 'Compliant',
}

interface ComplianceMatrixProps {
  selectedIndustry: string
  onIndustryChange: (industry: string) => void
  selectedMandates: string[]
  onMandatesChange: (mandates: string[]) => void
}

function DeadlineChip({ year }: { year: number | null }) {
  if (!year) return <span className="text-xs text-muted-foreground italic">Ongoing</span>
  const isUrgent = year <= 2027
  const isSoon = year > 2027 && year <= 2030
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold border ${
        isUrgent
          ? 'text-status-error bg-status-error/10 border-status-error/30'
          : isSoon
            ? 'text-status-warning bg-status-warning/10 border-status-warning/30'
            : 'text-status-success bg-status-success/10 border-status-success/30'
      }`}
    >
      {isUrgent && <AlertTriangle size={9} />}
      {year}
    </span>
  )
}

function MandateRow({
  mandate,
  isSelected,
  status,
  onToggle,
  onStatusChange,
}: {
  mandate: ComplianceMandate
  isSelected: boolean
  status: StatusValue
  onToggle: () => void
  onStatusChange: (s: StatusValue) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`border rounded-lg transition-colors ${
        isSelected ? 'border-primary/40 bg-primary/5' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          aria-label={`Select ${mandate.name}`}
          className="mt-0.5 shrink-0 accent-primary cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-bold text-sm text-foreground">{mandate.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              {mandate.region}
            </span>
            {mandate.pqcMandatoryNow && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-status-error/10 text-status-error border border-status-error/30 font-bold">
                Active Now
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{mandate.scope}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DeadlineChip year={mandate.deadlineYear} />
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="p-1 h-auto text-muted-foreground"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">PQC Requirement</p>
            <p className="text-xs text-muted-foreground">{mandate.pqcRequirement}</p>
          </div>
          {mandate.relevantArticles.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Relevant Articles</p>
              <p className="text-xs text-muted-foreground font-mono">
                {mandate.relevantArticles.join(', ')}
              </p>
            </div>
          )}
          {isSelected && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Your Status</p>
              <div className="flex gap-2">
                {(Object.keys(STATUS_LABELS) as StatusValue[]).map((s) => (
                  <Button
                    key={s}
                    variant={status === s ? 'outline' : 'ghost'}
                    onClick={() => onStatusChange(s)}
                    className={`text-[10px] px-2 py-1 h-auto ${
                      status === s ? 'border-primary text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <a
            href={mandate.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View source <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  )
}

export const ComplianceMatrix: React.FC<ComplianceMatrixProps> = ({
  selectedIndustry,
  onIndustryChange,
  selectedMandates,
  onMandatesChange,
}) => {
  const [statuses, setStatuses] = useState<Record<string, StatusValue>>({})

  const industryItems = AVAILABLE_INDUSTRIES.map((i) => ({ id: i, label: i }))

  const mandates = useMemo(() => getMandatesForIndustry(selectedIndustry), [selectedIndustry])

  const earliestDeadline = useMemo(
    () =>
      getEarliestDeadline(
        selectedMandates.length > 0 ? selectedMandates : mandates.map((m) => m.id)
      ),
    [selectedMandates, mandates]
  )

  const toggleMandate = (id: string) => {
    const next = selectedMandates.includes(id)
      ? selectedMandates.filter((m) => m !== id)
      : [...selectedMandates, id]
    onMandatesChange(next)
  }

  const handleStatusChange = (id: string, status: StatusValue) => {
    setStatuses((prev) => ({ ...prev, [id]: status }))
  }

  const byRegion = useMemo(() => {
    const regionOrder: ComplianceRegion[] = ['US Federal', 'EU', 'Industry-Specific', 'Global']
    return regionOrder.reduce(
      (acc, region) => {
        const regional = mandates.filter((m) => m.region === region)
        if (regional.length > 0) acc[region] = regional
        return acc
      },
      {} as Record<ComplianceRegion, ComplianceMandate[]>
    )
  }, [mandates])

  const compliantCount = selectedMandates.filter((id) => statuses[id] === 'compliant').length

  return (
    <div className="space-y-5">
      {/* Industry Selector */}
      <div className="glass-panel p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">Industry:</span>
            <FilterDropdown
              items={industryItems}
              selectedId={selectedIndustry}
              onSelect={onIndustryChange}
              defaultLabel="Select industry"
              noContainer
            />
          </div>
          {selectedMandates.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle size={14} className="text-primary" />
              <span>
                {selectedMandates.length} framework{selectedMandates.length !== 1 ? 's' : ''}{' '}
                selected
                {compliantCount > 0 && (
                  <span className="text-status-success ml-1">({compliantCount} compliant)</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Earliest Deadline Banner */}
      {earliestDeadline.year && (
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
            earliestDeadline.year <= 2027
              ? 'bg-status-error/10 border-status-error/30 text-status-error'
              : earliestDeadline.year <= 2030
                ? 'bg-status-warning/10 border-status-warning/30 text-status-warning'
                : 'bg-status-success/10 border-status-success/30 text-status-success'
          }`}
        >
          <Clock size={16} />
          <span>
            Earliest binding deadline:{' '}
            <strong>
              {earliestDeadline.year} ({earliestDeadline.name})
            </strong>
          </span>
        </div>
      )}

      {/* Compliance Mandate Table by Region */}
      <div className="space-y-5">
        {(Object.keys(byRegion) as ComplianceRegion[]).map((region) => (
          <div key={region}>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {region}
            </h4>
            <div className="space-y-2">
              {byRegion[region].map((mandate) => (
                <MandateRow
                  key={mandate.id}
                  mandate={mandate}
                  isSelected={selectedMandates.includes(mandate.id)}
                  status={statuses[mandate.id] ?? 'not-started'}
                  onToggle={() => toggleMandate(mandate.id)}
                  onStatusChange={(s) => handleStatusChange(mandate.id, s)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* All Mandates available note */}
      <div className="bg-muted/30 rounded-lg p-3 border border-border text-xs text-muted-foreground">
        <p>
          <strong className="text-foreground">Tip:</strong> Check the frameworks that apply to your
          organization. Your selected frameworks will increase the compliance score in Step 4&apos;s
          Sensitivity Scoring Engine. Frameworks with active deadlines add extra urgency weight.
        </p>
        <p className="mt-2">
          For the full compliance timeline, visit{' '}
          <a href="/compliance" className="text-primary hover:underline">
            the Compliance page
          </a>
          .
        </p>
      </div>

      {/* All frameworks selector */}
      <div className="glass-panel p-4">
        <p className="text-xs font-semibold text-foreground mb-2">
          Not in the list above? Select from all frameworks:
        </p>
        <div className="flex flex-wrap gap-2">
          {COMPLIANCE_MANDATES.filter((m) => !mandates.some((im) => im.id === m.id)).map((m) => (
            <Button
              key={m.id}
              variant={selectedMandates.includes(m.id) ? 'outline' : 'ghost'}
              onClick={() => toggleMandate(m.id)}
              className={`text-xs px-2 py-1 h-auto ${
                selectedMandates.includes(m.id)
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {m.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
