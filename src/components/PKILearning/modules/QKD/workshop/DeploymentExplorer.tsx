/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { Globe, ChevronDown, ChevronUp, ExternalLink, Filter, MapPin } from 'lucide-react'
import {
  QKD_DEPLOYMENTS,
  QKD_REGIONS,
  QKD_OPERATOR_TYPES,
  QKD_TECHNOLOGIES,
  QKD_STATUSES,
  type QKDDeployment,
  type QKDRegion,
  type QKDOperatorType,
  type QKDTechnology,
  type QKDStatus,
} from '../data/qkdDeployments'

type SortField = 'name' | 'country' | 'yearStarted' | 'status'
type SortDirection = 'asc' | 'desc'

const STATUS_COLORS: Record<QKDStatus, string> = {
  Operational: 'bg-success/10 text-success border-success/20',
  Pilot: 'bg-primary/10 text-primary border-primary/20',
  Planned: 'bg-warning/10 text-warning border-warning/20',
  Completed: 'bg-muted text-muted-foreground border-border',
}

export const DeploymentExplorer: React.FC = () => {
  const [regionFilter, setRegionFilter] = useState<QKDRegion | 'All'>('All')
  const [typeFilter, setTypeFilter] = useState<QKDOperatorType | 'All'>('All')
  const [techFilter, setTechFilter] = useState<QKDTechnology | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<QKDStatus | 'All'>('All')
  const [sortField, setSortField] = useState<SortField>('yearStarted')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let items = [...QKD_DEPLOYMENTS]

    if (regionFilter !== 'All') items = items.filter((d) => d.region === regionFilter)
    if (typeFilter !== 'All') items = items.filter((d) => d.operatorType === typeFilter)
    if (techFilter !== 'All') items = items.filter((d) => d.technology === techFilter)
    if (statusFilter !== 'All') items = items.filter((d) => d.status === statusFilter)

    items.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })

    return items
  }, [regionFilter, typeFilter, techFilter, statusFilter, sortField, sortDir])

  const stats = useMemo(() => {
    const byRegion: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    QKD_DEPLOYMENTS.forEach((d) => {
      byRegion[d.region] = (byRegion[d.region] || 0) + 1
      byStatus[d.status] = (byStatus[d.status] || 0) + 1
    })
    return { total: QKD_DEPLOYMENTS.length, byRegion, byStatus }
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Deployments</div>
        </div>
        {QKD_REGIONS.map((region) => (
          <div key={region} className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-2xl font-bold text-foreground">{stats.byRegion[region] || 0}</div>
            <div className="text-xs text-muted-foreground">{region}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-muted-foreground" />
        <FilterSelect
          label="Region"
          value={regionFilter}
          options={['All', ...QKD_REGIONS]}
          onChange={(v) => setRegionFilter(v as QKDRegion | 'All')}
        />
        <FilterSelect
          label="Type"
          value={typeFilter}
          options={['All', ...QKD_OPERATOR_TYPES]}
          onChange={(v) => setTypeFilter(v as QKDOperatorType | 'All')}
        />
        <FilterSelect
          label="Technology"
          value={techFilter}
          options={['All', ...QKD_TECHNOLOGIES]}
          onChange={(v) => setTechFilter(v as QKDTechnology | 'All')}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={['All', ...QKD_STATUSES]}
          onChange={(v) => setStatusFilter(v as QKDStatus | 'All')}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <SortableHeader field="name" current={sortField} dir={sortDir} onClick={handleSort}>
                Deployment
              </SortableHeader>
              <SortableHeader
                field="country"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
              >
                Country
              </SortableHeader>
              <th className="text-left p-2 text-muted-foreground font-medium">Operator</th>
              <th className="text-left p-2 text-muted-foreground font-medium hidden md:table-cell">
                Tech
              </th>
              <SortableHeader field="status" current={sortField} dir={sortDir} onClick={handleSort}>
                Status
              </SortableHeader>
              <SortableHeader
                field="yearStarted"
                current={sortField}
                dir={sortDir}
                onClick={handleSort}
              >
                Year
              </SortableHeader>
              <th className="text-left p-2 text-muted-foreground font-medium hidden lg:table-cell">
                Distance
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((deployment) => (
              <DeploymentRow
                key={deployment.id}
                deployment={deployment}
                expanded={expandedId === deployment.id}
                onToggle={() => toggleExpand(deployment.id)}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No deployments match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        <Globe size={12} className="inline mr-1" />
        Showing {filtered.length} of {stats.total} deployments. Data from publicly documented
        sources — click any row to see details and references.
      </p>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-xs text-muted-foreground">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs bg-muted border border-border rounded px-2 py-1 text-foreground"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

function SortableHeader({
  field,
  current,
  dir,
  onClick,
  children,
}: {
  field: SortField
  current: SortField
  dir: SortDirection
  onClick: (field: SortField) => void
  children: React.ReactNode
}) {
  return (
    <th
      className="text-left p-2 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => onClick(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {current === field && <span className="text-primary">{dir === 'asc' ? '↑' : '↓'}</span>}
      </div>
    </th>
  )
}

function DeploymentRow({
  deployment,
  expanded,
  onToggle,
}: {
  deployment: QKDDeployment
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="p-2 font-medium text-foreground">{deployment.name}</td>
        <td className="p-2 text-foreground/80">
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-muted-foreground" />
            {deployment.country}
          </div>
        </td>
        <td className="p-2 text-foreground/80 text-xs">{deployment.operator}</td>
        <td className="p-2 text-foreground/80 hidden md:table-cell">
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted border border-border">
            {deployment.technology}
          </span>
        </td>
        <td className="p-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[deployment.status]}`}
          >
            {deployment.status}
          </span>
        </td>
        <td className="p-2 text-foreground/80">{deployment.yearStarted}</td>
        <td className="p-2 text-foreground/80 hidden lg:table-cell">
          {deployment.distance || '—'}
        </td>
        <td className="p-2">
          {expanded ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/50">
          <td colSpan={8} className="p-4 bg-muted/20">
            <p className="text-sm text-foreground/80 mb-2">{deployment.description}</p>
            {deployment.highlights && deployment.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {deployment.highlights.map((h) => (
                  <span
                    key={h}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
            <a
              href={deployment.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} /> View Source
            </a>
          </td>
        </tr>
      )}
    </>
  )
}
