// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { ExternalLink, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ORGANIZATIONS } from '../data'
import type { OrgEntry, OrgType, OrgScope, OrgAuthority } from '../data'

export interface OrganizationExplorerProps {
  selectedOrgId: string | null
  onOrgSelect: (id: string) => void
}

function typeBadgeClass(type: OrgType): string {
  switch (type) {
    case 'standards-body':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'certification-body':
      return 'bg-status-info/10 text-status-info border-status-info/30'
    case 'compliance-framework':
      return 'bg-status-warning/10 text-status-warning border-status-warning/30'
    case 'regulatory-agency':
      return 'bg-status-error/10 text-status-error border-status-error/30'
  }
}

function typeLabel(type: OrgType): string {
  switch (type) {
    case 'standards-body':
      return 'Standards Body'
    case 'certification-body':
      return 'Certification Body'
    case 'compliance-framework':
      return 'Compliance Framework'
    case 'regulatory-agency':
      return 'Regulatory Agency'
  }
}

function scopeLabel(scope: OrgScope): string {
  return scope === 'global' ? 'Global' : 'Regional'
}

function authorityLabel(authority: OrgAuthority): string {
  return authority === 'governmental' ? 'Governmental' : 'Non-Governmental'
}

function OrgDetail({ org }: { org: OrgEntry }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-foreground">{org.name}</h3>
            <div className="text-sm text-muted-foreground mt-0.5">
              {org.acronym} &bull; Founded {org.founded} &bull; {org.region}
            </div>
          </div>
          <a
            href={org.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            <ExternalLink size={12} />
            Official Site
          </a>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${typeBadgeClass(org.type)}`}
          >
            {typeLabel(org.type)}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-muted/50 text-foreground border-border">
            {scopeLabel(org.scope)}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-muted/50 text-foreground border-border">
            {authorityLabel(org.authority)}
          </span>
        </div>
      </div>

      {/* Mission */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold text-foreground">Mission</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{org.mission}</p>
      </div>

      {/* Decision-making process */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold text-foreground">Decision-Making Process</h4>
        <div className="bg-muted/40 rounded-lg p-3 border border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{org.decisionMaking}</p>
        </div>
      </div>

      {/* Key PQC Outputs */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold text-foreground">Key PQC Outputs</h4>
        <ul className="space-y-1.5">
          {org.keyPqcOutputs.map((output, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              {output}
            </li>
          ))}
        </ul>
      </div>

      {/* Library References */}
      {org.libraryRefs.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-sm font-semibold text-foreground">Library References</h4>
          <div className="flex flex-wrap gap-2">
            {org.libraryRefs.map((ref) => (
              <Link
                key={ref}
                to={`/library?search=${encodeURIComponent(ref)}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
              >
                <BookOpen size={11} />
                {ref}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const OrganizationExplorer: React.FC<OrganizationExplorerProps> = ({
  selectedOrgId,
  onOrgSelect,
}) => {
  const selectedOrg = ORGANIZATIONS.find((o) => o.id === selectedOrgId) ?? null

  // Default: select first org if none selected
  const effectiveOrg = selectedOrg ?? ORGANIZATIONS[0]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select an organization to explore its mission, decision-making process, and key PQC outputs.
      </p>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar — vertical on desktop, horizontal scroll on mobile */}
        <div className="lg:w-56 shrink-0">
          {/* Mobile: horizontal chip row */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {ORGANIZATIONS.map((org) => {
              const isSelected = org.id === (effectiveOrg?.id ?? null)
              return (
                <button
                  key={org.id}
                  onClick={() => onOrgSelect(org.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                    ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    }`}
                >
                  {org.acronym}
                </button>
              )
            })}
          </div>

          {/* Desktop: vertical list */}
          <div className="hidden lg:flex flex-col gap-1">
            {ORGANIZATIONS.map((org) => {
              const isSelected = org.id === effectiveOrg.id
              return (
                <button
                  key={org.id}
                  onClick={() => onOrgSelect(org.id)}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm border transition-colors
                    ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                >
                  <div className="font-medium">{org.acronym}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {org.region}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 bg-muted/20 rounded-xl border border-border p-4 sm:p-6 min-h-[400px]">
          <OrgDetail org={effectiveOrg} />
        </div>
      </div>
    </div>
  )
}
