import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ComplianceTable } from './ComplianceTable'
import { MobileComplianceView } from './MobileComplianceView'
import { useComplianceRefresh, AUTHORITATIVE_SOURCES } from './services'
import { ShieldCheck, FileCheck, Server, GlobeLock, Building2, Info } from 'lucide-react'
import { logComplianceFilter } from '../../utils/analytics'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'
import { usePersonaStore } from '../../store/usePersonaStore'

// Maps industry → recommended certification type and a short rationale
const INDUSTRY_COMPLIANCE_HINT: Record<string, { tab: string; rationale: string }> = {
  'Finance & Banking': {
    tab: 'FIPS 140-3',
    rationale:
      'FIPS 140-3 validated modules are mandatory for US federal financial systems and broadly adopted in banking for encryption compliance.',
  },
  'Government & Defense': {
    tab: 'FIPS 140-3',
    rationale:
      'FIPS 140-3 is required for federal information systems. Common Criteria EAL4+ applies to high-assurance defense products.',
  },
  Healthcare: {
    tab: 'FIPS 140-3',
    rationale:
      'HIPAA requires FIPS-validated encryption for ePHI. FIPS 140-3 validated modules satisfy this requirement.',
  },
  Telecommunications: {
    tab: 'ACVP',
    rationale:
      'Algorithm-level ACVP validation is key for telecom protocol stacks. Common Criteria applies to network infrastructure products.',
  },
  Technology: {
    tab: 'ACVP',
    rationale:
      'ACVP validates algorithm implementations directly. FIPS 140-3 applies if building products for federal customers.',
  },
  'Energy & Utilities': {
    tab: 'FIPS 140-3',
    rationale:
      'NERC-CIP and federal energy regulations increasingly require FIPS-validated cryptographic modules for critical infrastructure.',
  },
  Automotive: {
    tab: 'Common Criteria',
    rationale:
      'Common Criteria (ISO/IEC 15408) is used for automotive V2X and ECU security evaluations under UN R155.',
  },
  Aerospace: {
    tab: 'FIPS 140-3',
    rationale:
      'DO-326A and federal programs require FIPS-validated modules. Common Criteria applies to avionics security products.',
  },
  'Retail & E-Commerce': {
    tab: 'FIPS 140-3',
    rationale:
      'PCI-DSS aligns with FIPS 140-3 for payment cryptography. FIPS validation is the baseline for payment processors.',
  },
}

// EU region pushes Common Criteria/EUCC tab
const REGION_COMPLIANCE_HINT: Record<string, { tab: string; rationale: string } | undefined> = {
  eu: {
    tab: 'Common Criteria',
    rationale:
      'EU Cybersecurity Act (EUCC scheme) mandates Common Criteria evaluations for products sold in the EU market.',
  },
}

export const ComplianceView = () => {
  const { data, loading, refresh, lastUpdated, enrichRecord } = useComplianceRefresh()
  const { selectedIndustries, selectedRegion } = usePersonaStore()

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

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Compliance & Certification
          </h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Streamlined access to cryptographic module validations (FIPS 140-3), algorithm validations
          (ACVP), and Common Criteria certifications, with a focus on Post-Quantum Cryptography
          (PQC) readiness.
        </p>
        <div className="hidden md:flex items-center justify-center gap-3 text-xs text-muted-foreground/60 font-mono">
          <ShareButton
            title="PQC Compliance Tracker — FIPS 140-3, ACVP, Common Criteria"
            text="Track PQC compliance certifications: FIPS 140-3, ACVP algorithm validation, and Common Criteria with PQC readiness status."
          />
          <GlossaryButton />
        </div>
      </div>

      {/* Persona/industry context hint */}
      {complianceHint && complianceHintLabel && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm">
          <Info size={16} className="text-primary mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground">
              {complianceHintLabel}: <span className="text-primary">{complianceHint.tab}</span>
            </span>
            <p className="text-muted-foreground text-xs">{complianceHint.rationale}</p>
          </div>
        </div>
      )}

      {/* External Links Reference (User Request: Show authoritative sources) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <a
          href={AUTHORITATIVE_SOURCES.FIPS}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 p-3 rounded bg-card hover:bg-muted/50 transition-colors border border-border"
        >
          <GlobeLock size={16} className="text-primary" />
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">NIST CMVP</span>
            <span className="text-muted-foreground">FIPS 140-3 L3</span>
          </div>
        </a>
        <a
          href={AUTHORITATIVE_SOURCES.ACVP}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 p-3 rounded bg-card hover:bg-muted/50 transition-colors border border-border"
        >
          <Server size={16} className="text-secondary" />
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">NIST CAVP</span>
            <span className="text-muted-foreground">Algorithm Validation</span>
          </div>
        </a>
        <a
          href={AUTHORITATIVE_SOURCES.CC}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 p-3 rounded bg-card hover:bg-muted/50 transition-colors border border-border"
        >
          <FileCheck size={16} className="text-accent" />
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">CC Portal</span>
            <span className="text-muted-foreground">Global CC & EUCC</span>
          </div>
        </a>
        <a
          href={AUTHORITATIVE_SOURCES.ANSSI}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 p-3 rounded bg-card hover:bg-muted/50 transition-colors border border-border"
        >
          <FileCheck size={16} className="text-tertiary" />
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">ANSSI (FR)</span>
            <span className="text-muted-foreground">CC Certifications</span>
          </div>
        </a>
        <a
          href={AUTHORITATIVE_SOURCES.BSI}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 p-3 rounded bg-card hover:bg-muted/50 transition-colors border border-border"
        >
          <Building2 size={16} className="text-primary" />
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">BSI (DE)</span>
            <span className="text-muted-foreground">CC Certifications</span>
          </div>
        </a>
      </div>

      {/* Mobile: simple card list (no tabs — tabs don't render well at mobile widths) */}
      <div className="md:hidden">
        <MobileComplianceView data={data} />
      </div>

      {/* Desktop: full tabbed table */}
      <div className="hidden md:block">
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={(tab) => logComplianceFilter('Tab', tab)}
        >
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
            />
          </TabsContent>

          <TabsContent value="fips" className="mt-0">
            <ComplianceTable
              data={data.filter((r) => r.type === 'FIPS 140-3')}
              onRefresh={refresh}
              isRefreshing={loading}
              lastUpdated={lastUpdated}
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
              data={data.filter(
                (r) =>
                  r.type === 'Common Criteria' ||
                  r.type === 'EUCC' ||
                  r.source === 'ANSSI' ||
                  r.source === 'ENISA'
              )}
              onRefresh={refresh}
              isRefreshing={loading}
              lastUpdated={lastUpdated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
