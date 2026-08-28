// SPDX-License-Identifier: GPL-3.0-only
// Shared, stateless helpers reused across /report's section modules — labels,
// icon lookups, and the report-specific CollapsibleSection/SectionInfoTip
// wrappers. Extracted from ReportContent.tsx (see reportSectionToCswp39.ts
// for the section-order this split follows); every section module imports
// from here rather than from ReportContent.tsx directly.
import React, { useState } from 'react'
import {
  Calendar,
  BookOpen,
  FlaskConical,
  Package,
  BarChart3,
  Terminal,
  Layers,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../../ui/button'
import { CollapsibleSection as BaseCollapsibleSection } from '../../ui/CollapsibleSection'
import { HNDLHNFLSection as SharedHNDLHNFLSection } from '../../shared/HNDLHNFLSection'
import { SectionInfoModal } from '../SectionInfoModal'
import { Info } from 'lucide-react'
import type { HNDLRiskWindow, TNFLRiskWindow } from '../../../hooks/assessmentTypes'

/** Resolves icon name string to LucideIcon component for report CTAs. */
export const CTA_ICONS: Record<string, LucideIcon> = {
  Calendar,
  BookOpen,
  FlaskConical,
  Package,
  BarChart3,
  Terminal,
  Layers,
}

/** Maps PQC replacement algorithm names to relevant Learn module paths. */
export const ALGO_LEARN_LINKS: Record<string, { path: string; label: string }> = {
  'ML-KEM': { path: '/learn/pki-workshop', label: 'PKI Workshop' },
  'ML-DSA': { path: '/learn/pki-workshop', label: 'PKI Workshop' },
  'SLH-DSA': { path: '/learn/stateful-signatures', label: 'Signatures' },
  LMS: { path: '/learn/stateful-signatures', label: 'Signatures' },
  hybrid: { path: '/learn/hybrid-crypto', label: 'Hybrid Crypto' },
}
export function getLearnLink(replacement: string): { path: string; label: string } | null {
  if (replacement.includes('hybrid') || replacement.includes('Hybrid'))
    return ALGO_LEARN_LINKS['hybrid']
  for (const [key, value] of Object.entries(ALGO_LEARN_LINKS)) {
    if (replacement.includes(key)) return value
  }
  return null
}

export function SectionInfoTip({ sectionId }: { sectionId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex print:hidden">
      <Button
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="p-1 min-h-[44px] min-w-[44px] md:h-auto md:w-auto md:min-h-0 md:min-w-0 rounded hover:bg-muted/30 text-muted-foreground hover:text-foreground"
        aria-label="Section info"
      >
        <Info size={14} />
      </Button>
      <SectionInfoModal isOpen={open} onClose={() => setOpen(false)} sectionId={sectionId} />
    </span>
  )
}

/** Report-specific wrapper that converts `infoTip` string IDs to SectionInfoTip nodes */
export function CollapsibleSection({
  infoTip,
  ...rest
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  infoTip?: string
  className?: string
  headerExtra?: React.ReactNode
  id?: string
  /** Workshop selector slug — emits `data-workshop-target="section-<targetId>"`
   *  on the toggle button so `expand-section` cues can open the section. */
  targetId?: string
}) {
  return (
    <BaseCollapsibleSection
      {...rest}
      infoTip={infoTip ? <SectionInfoTip sectionId={infoTip} /> : undefined}
    />
  )
}

export const effortConfig = {
  low: { color: 'text-success', bg: 'bg-success/10', label: 'Low' },
  medium: { color: 'text-primary', bg: 'bg-primary/10', label: 'Medium' },
  high: { color: 'text-warning', bg: 'bg-warning/10', label: 'High' },
}

export const complexityConfig = {
  low: { color: 'text-success', bg: 'bg-success/10', label: 'Low' },
  medium: { color: 'text-primary', bg: 'bg-primary/10', label: 'Medium' },
  high: { color: 'text-warning', bg: 'bg-warning/10', label: 'High' },
  critical: { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Critical' },
}

export const scopeConfig = {
  'quick-win': { color: 'text-success', bg: 'bg-success/10', label: 'Quick Win' },
  moderate: { color: 'text-primary', bg: 'bg-primary/10', label: 'Moderate' },
  'major-project': { color: 'text-warning', bg: 'bg-warning/10', label: 'Major Project' },
  'multi-year': { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Multi-Year' },
}

export const AGILITY_LABELS: Record<string, string> = {
  'fully-abstracted': 'Fully abstracted',
  'partially-abstracted': 'Partially abstracted',
  hardcoded: 'Hardcoded',
  unknown: 'Unknown',
}

export const MIGRATION_STATUS_LABELS: Record<string, string> = {
  started: 'Started',
  planning: 'Planning',
  'not-started': 'Not started',
  unknown: 'Unknown',
}

export const TIMELINE_LABELS: Record<string, string> = {
  'within-1y': 'Within 1 year',
  'within-2-3y': 'Within 2-3 years',
  'internal-deadline': 'Internal deadline',
  'no-deadline': 'No deadline',
  unknown: 'Unknown',
}

export const CREDENTIAL_LIFETIME_LABELS: Record<string, string> = {
  'under-1y': 'Under 1 year',
  '1-3y': '1-3 years',
  '3-10y': '3-10 years',
  '10-25y': '10-25 years',
  '25-plus': '25+ years',
  indefinite: 'Indefinite',
}

export const SCALE_LABELS: Record<string, string> = {
  '1-10': '1-10',
  '11-50': '11-50',
  '51-200': '51-200',
  '200-plus': '200+',
}

export const ProfileField = ({ label, value }: { label: string; value: string | undefined }) => {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  )
}

/** Report-specific HNDL/HNFL wrapper that injects SectionInfoTip */
export const ReportHNDLHNFLSection = (props: {
  hndl?: HNDLRiskWindow
  hnfl?: TNFLRiskWindow
  defaultOpen?: boolean
  headerExtra?: React.ReactNode
}) => <SharedHNDLHNFLSection {...props} infoTip={<SectionInfoTip sectionId="hndlHnfl" />} />
