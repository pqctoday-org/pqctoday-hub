// SPDX-License-Identifier: GPL-3.0-only
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ComplianceTable } from './ComplianceTable'
import { ComplianceLandscape } from './ComplianceLandscape'
import { MobileComplianceView } from './MobileComplianceView'
import { useComplianceRefresh } from './services'
import {
  ShieldCheck,
  GlobeLock,
  Info,
  BookOpen,
  Award,
  Scale,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { logComplianceFilter } from '../../utils/analytics'
import { PageHeader } from '../common/PageHeader'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import { COMPLIANCE_CSV_COLUMNS } from '@/utils/csvExportConfigs'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useWorkflowPhaseTracker } from '@/hooks/useWorkflowPhaseTracker'
import { complianceFrameworks, complianceMetadata } from '@/data/complianceData'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { useHistoryStore } from '@/store/useHistoryStore'

// Maps industry → recommended top-level section + sub-hint
const INDUSTRY_COMPLIANCE_HINT: Record<
  string,
  { section: string; sectionLabel: string; rationale: string }
> = {
  'Finance & Banking': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'FIPS 140-3 validated modules are mandatory for US federal financial systems and broadly adopted in banking for encryption compliance.',
  },
  'Government & Defense': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'FIPS 140-3 is required for federal information systems. Common Criteria EAL4+ applies to high-assurance defense products.',
  },
  Healthcare: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'HIPAA requires FIPS-validated encryption for ePHI. FIPS 140-3 validated modules satisfy this requirement.',
  },
  Telecommunications: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → ACVP',
    rationale:
      'Algorithm-level ACVP validation is key for telecom protocol stacks. Common Criteria applies to network infrastructure products.',
  },
  Technology: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → ACVP',
    rationale:
      'ACVP validates algorithm implementations directly. FIPS 140-3 applies if building products for federal customers.',
  },
  'Energy & Utilities': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'NERC-CIP and federal energy regulations increasingly require FIPS-validated cryptographic modules for critical infrastructure.',
  },
  Automotive: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → Common Criteria',
    rationale:
      'Common Criteria (ISO/IEC 15408) is used for automotive V2X and ECU security evaluations under UN R155.',
  },
  Aerospace: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'DO-326A and federal programs require FIPS-validated modules. Common Criteria applies to avionics security products.',
  },
  'Retail & E-Commerce': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'PCI-DSS aligns with FIPS 140-3 for payment cryptography. FIPS validation is the baseline for payment processors.',
  },
}

// EU region pushes Common Criteria/EUCC tab
const REGION_COMPLIANCE_HINT: Record<
  string,
  { section: string; sectionLabel: string; rationale: string } | undefined
> = {
  eu: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → Common Criteria',
    rationale:
      'EU Cybersecurity Act (EUCC scheme) mandates Common Criteria evaluations for products sold in the EU market.',
  },
}

// ── Section header strip ───────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  description: string
  learnLabel: string
  learnTo: string
}

function SectionHeader({ icon, title, description, learnLabel, learnTo }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4 p-4 rounded-lg border border-border bg-muted/20">
      <div className="flex items-center gap-2 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Link
        to={learnTo}
        className="print:hidden inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-primary/30 text-primary hover:bg-primary/5 transition-colors font-medium shrink-0"
      >
        <ExternalLink size={12} />
        {learnLabel}
      </Link>
    </div>
  )
}

// ── Mobile toggle ──────────────────────────────────────────────────────

type MobileSection = 'standards' | 'technical' | 'certification' | 'compliance' | 'records'

function MobileViewToggle({
  data,
  activeSection,
  onSectionChange,
}: {
  data: import('./types').ComplianceRecord[]
  activeSection: MobileSection
  onSectionChange: (section: MobileSection) => void
}) {
  const section = activeSection
  const setSection = onSectionChange

  const standardsFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'standardization_body'),
    []
  )
  const technicalStandards = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'technical_standard'),
    []
  )
  const certificationFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'certification_body'),
    []
  )
  const complianceOnlyFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'compliance_framework'),
    []
  )

  const btnClass = (active: boolean) =>
    `flex-none px-3 py-2 min-h-[44px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
    }`

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          className={btnClass(section === 'standards')}
          onClick={() => setSection('standards')}
        >
          Bodies
        </button>
        <button
          className={btnClass(section === 'technical')}
          onClick={() => setSection('technical')}
        >
          Tech Stds
        </button>
        <button
          className={btnClass(section === 'certification')}
          onClick={() => setSection('certification')}
        >
          Cert Schemes
        </button>
        <button
          className={btnClass(section === 'compliance')}
          onClick={() => setSection('compliance')}
        >
          Frameworks
        </button>
        <button className={btnClass(section === 'records')} onClick={() => setSection('records')}>
          Records
        </button>
      </div>
      {section === 'standards' && (
        <ComplianceLandscape frameworks={standardsFrameworks} showDeadlineTimeline={false} />
      )}
      {section === 'technical' && (
        <ComplianceLandscape frameworks={technicalStandards} showDeadlineTimeline={false} />
      )}
      {section === 'certification' && (
        <ComplianceLandscape frameworks={certificationFrameworks} showDeadlineTimeline={false} />
      )}
      {section === 'compliance' && (
        <ComplianceLandscape frameworks={complianceOnlyFrameworks} showDeadlineTimeline={true} />
      )}
      {section === 'records' && <MobileComplianceView data={data} />}
    </div>
  )
}

// ── Main view ──────────────────────────────────────────────────────────

export const ComplianceView = () => {
  useWorkflowPhaseTracker('comply')
  const [searchParams, setSearchParams] = useSearchParams()
  const initialFilter = searchParams.get('q') ?? undefined
  const certParam = searchParams.get('cert') ?? undefined
  const { data, loading, refresh, lastUpdated, enrichRecord } = useComplianceRefresh()
  const { selectedIndustries, selectedRegion, selectedPersona, experienceLevel } = usePersonaStore()
  const myFrameworks = useComplianceSelectionStore((s) => s.myFrameworks)
  const addHistoryEvent = useHistoryStore((s) => s.addEvent)

  // Fire history event on selection change (debounced 1.5s) — mirrors MigrateView pattern
  const prevCountRef = useRef(myFrameworks.length)
  useEffect(() => {
    const count = myFrameworks.length
    if (count === prevCountRef.current) return
    prevCountRef.current = count
    if (count === 0) return
    const timer = setTimeout(() => {
      addHistoryEvent({
        type: 'compliance_framework_selection',
        timestamp: Date.now(),
        title: 'Updated compliance selection',
        detail: `${count} framework${count === 1 ? '' : 's'} selected`,
        route: '/compliance',
      })
    }, 1500)
    return () => clearTimeout(timer)
  }, [myFrameworks.length, addHistoryEvent])

  const primaryIndustry = selectedIndustries[0] ?? null
  // eslint-disable-next-line security/detect-object-injection
  const industryHint = primaryIndustry ? INDUSTRY_COMPLIANCE_HINT[primaryIndustry] : undefined
  // eslint-disable-next-line security/detect-object-injection
  const regionHint = selectedRegion ? REGION_COMPLIANCE_HINT[selectedRegion] : undefined
  const complianceHint = industryHint ?? regionHint
  const complianceHintLabel = primaryIndustry
    ? `${primaryIndustry} focus`
    : selectedRegion === 'eu'
      ? 'EU region'
      : null

  // Pre-filtered framework sets for each tab
  const standardsFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'standardization_body'),
    []
  )
  const technicalStandards = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'technical_standard'),
    []
  )
  const certificationFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'certification_body'),
    []
  )
  const complianceOnlyFrameworks = useMemo(
    () => complianceFrameworks.filter((f) => f.bodyType === 'compliance_framework'),
    []
  )

  const handleExportCsv = useCallback(() => {
    const csv = generateCsv(data, COMPLIANCE_CSV_COLUMNS)
    downloadCsv(csv, csvFilename('pqc-compliance'))
  }, [data])

  // Active tab — URL param takes priority; fall back to cert/hint/default logic for initial load
  const [activeTab, setActiveTab] = useState<MobileSection>(() => {
    const tab = searchParams.get('tab') as MobileSection | null
    if (tab) return tab
    return (certParam ? 'records' : (complianceHint?.section ?? 'standards')) as MobileSection
  })

  // Sync URL → state on back/forward navigation
  useEffect(() => {
    const tab = searchParams.get('tab') as MobileSection | null
    if (tab) setActiveTab((prev) => (prev !== tab ? tab : prev))
  }, [searchParams])

  const syncTab = useCallback(
    (tab: MobileSection) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (tab !== 'standards') next.set('tab', tab)
          else next.delete('tab')
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={ShieldCheck}
        title="Standardization, Compliance and Certification"
        description="Explore the three pillars of PQC compliance: standardization bodies that define the algorithms, certification bodies that validate implementations, and compliance frameworks that mandate adoption."
        dataSource={
          complianceMetadata
            ? `${complianceMetadata.filename} • Updated: ${complianceMetadata.lastUpdate.toLocaleDateString()}`
            : undefined
        }
        viewType="Compliance"
        shareTitle="PQC Compliance Tracker — Standards, Certifications, Frameworks"
        shareText="Explore PQC compliance: standardization bodies, certification programs (FIPS 140-3, ACVP, Common Criteria), and regulatory frameworks."
        onExport={handleExportCsv}
      />

      {/* Curious user intro context */}
      {(selectedPersona === 'curious' || experienceLevel === 'curious') && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-secondary/20 bg-secondary/5 text-sm">
          <Info size={16} className="text-secondary mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">New to compliance?</span>
            <p className="text-muted-foreground text-xs">
              This page tracks who sets the rules for quantum-safe cryptography.{' '}
              <span className="font-medium text-foreground">Standardization bodies</span> define the
              algorithms, <span className="font-medium text-foreground">certification schemes</span>{' '}
              test that products implement them correctly, and{' '}
              <span className="font-medium text-foreground">compliance frameworks</span> are the
              laws and regulations that require organizations to adopt them. Start with the
              Standards tab to see the big picture.
            </p>
          </div>
        </div>
      )}

      {/* Persona/industry context hint */}
      {complianceHint && complianceHintLabel && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm">
          <Info size={16} className="text-primary mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">
              {complianceHintLabel}:{' '}
              <span className="text-primary">{complianceHint.sectionLabel}</span>
            </span>
            <p className="text-muted-foreground text-xs">{complianceHint.rationale}</p>
          </div>
        </div>
      )}

      {/* Mobile: 3-section toggle */}
      <div className="md:hidden">
        <MobileViewToggle
          data={data}
          activeSection={activeTab}
          onSectionChange={(s) => {
            setActiveTab(s)
            syncTab(s)
          }}
        />
      </div>

      {/* Desktop: 3-tab layout */}
      <div className="hidden md:block">
        <Tabs
          value={activeTab}
          className="w-full"
          onValueChange={(tab) => {
            const t = tab as MobileSection
            setActiveTab(t)
            syncTab(t)
            logComplianceFilter('Tab', tab)
          }}
        >
          <TabsList className="mb-4 bg-muted/50 border border-border">
            <TabsTrigger value="standards" className="flex items-center gap-1.5">
              <BookOpen size={14} />
              Standardization Bodies
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-1.5">
              <FileText size={14} />
              Technical Standards
            </TabsTrigger>
            <TabsTrigger value="certification" className="flex items-center gap-1.5">
              <Award size={14} />
              Certification Schemes
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-1.5">
              <Scale size={14} />
              Compliance Frameworks
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-1.5">
              <GlobeLock size={14} />
              Cert Records
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Standardization Bodies ── */}
          <TabsContent value="standards" className="mt-0 space-y-4">
            <SectionHeader
              icon={<BookOpen size={20} className="text-secondary" />}
              title="Standardization Bodies"
              description={`${standardsFrameworks.length} organizations that define PQC algorithms, protocols, and security requirements — the bodies whose publications the world implements.`}
              learnLabel="Explore in Learn module"
              learnTo="/learn/standards-bodies?step=2"
            />
            <ComplianceLandscape frameworks={standardsFrameworks} showDeadlineTimeline={false} />
          </TabsContent>

          {/* ── Tab 2: Technical Standards ── */}
          <TabsContent value="technical" className="mt-0 space-y-4">
            <SectionHeader
              icon={<FileText size={20} className="text-secondary" />}
              title="Technical Standards"
              description={`${technicalStandards.length} published specifications, guidelines, and technical standards — the documents that define cryptographic requirements organizations must implement.`}
              learnLabel="Explore in Learn module"
              learnTo="/learn/standards-bodies?step=2"
            />
            <ComplianceLandscape frameworks={technicalStandards} showDeadlineTimeline={false} />
          </TabsContent>

          {/* ── Tab 3: Certification Schemes ── */}
          <TabsContent value="certification" className="mt-0 space-y-4">
            <SectionHeader
              icon={<Award size={20} className="text-status-success" />}
              title="Certification Schemes"
              description={`${certificationFrameworks.length} validation programs and schemes that certify cryptographic products and algorithm implementations against published standards.`}
              learnLabel="Understand the cert chain"
              learnTo="/learn/standards-bodies?step=2"
            />
            <ComplianceLandscape
              frameworks={certificationFrameworks}
              showDeadlineTimeline={false}
            />
          </TabsContent>

          {/* ── Tab 4: Compliance Frameworks ── */}
          <TabsContent value="compliance" className="mt-0 space-y-4">
            <SectionHeader
              icon={<Scale size={20} className="text-primary" />}
              title="Compliance Frameworks"
              description={`${complianceOnlyFrameworks.length} regulations, directives, and mandates — the legal and contractual obligations that require organizations to adopt PQC across specific industries and geographies.`}
              learnLabel="Build your strategy"
              learnTo="/learn/compliance-strategy"
            />
            <ComplianceLandscape
              frameworks={complianceOnlyFrameworks}
              showDeadlineTimeline={true}
            />
          </TabsContent>

          {/* ── Tab 4: Cert Records ── */}
          <TabsContent value="records" className="mt-0 space-y-4">
            <SectionHeader
              icon={<GlobeLock size={20} className="text-primary" />}
              title="Product Certification Records"
              description="Live certification records from NIST CMVP, NIST CAVP, and Common Criteria Portal — searchable product validations for FIPS 140-3, ACVP algorithm testing, and CC evaluations."
              learnLabel="Understand the cert chain"
              learnTo="/learn/standards-bodies?step=2"
            />
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4 bg-muted/50 border border-border">
                <TabsTrigger value="all">All Records</TabsTrigger>
                <TabsTrigger value="fips">FIPS 140-3</TabsTrigger>
                <TabsTrigger value="acvp">ACVP</TabsTrigger>
                <TabsTrigger value="cc">Common Criteria</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-0">
                <ComplianceTable
                  data={data}
                  onRefresh={refresh}
                  isRefreshing={loading}
                  lastUpdated={lastUpdated}
                  onEnrich={enrichRecord}
                  initialFilter={initialFilter}
                  initialSelectedId={certParam}
                />
              </TabsContent>
              <TabsContent value="fips" className="mt-0">
                <ComplianceTable
                  data={data.filter((r) => r.type === 'FIPS 140-3')}
                  onRefresh={refresh}
                  isRefreshing={loading}
                  lastUpdated={lastUpdated}
                  onEnrich={enrichRecord}
                />
              </TabsContent>
              <TabsContent value="acvp" className="mt-0">
                <ComplianceTable
                  data={data.filter((r) => r.type === 'ACVP')}
                  onRefresh={refresh}
                  isRefreshing={loading}
                  lastUpdated={lastUpdated}
                  onEnrich={enrichRecord}
                />
              </TabsContent>
              <TabsContent value="cc" className="mt-0">
                <ComplianceTable
                  data={data.filter((r) => r.type === 'Common Criteria')}
                  onRefresh={refresh}
                  isRefreshing={loading}
                  lastUpdated={lastUpdated}
                  onEnrich={enrichRecord}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
