import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ComplianceTable } from './ComplianceTable'
import { useComplianceRefresh, AUTHORITATIVE_SOURCES } from './services'
import { ShieldCheck, FileCheck, Server, GlobeLock } from 'lucide-react'
import { logComplianceFilter } from '../../utils/analytics'
import { ShareButton } from '../ui/ShareButton'
import { GlossaryButton } from '../ui/GlossaryButton'

export const ComplianceView = () => {
  const { data, loading, refresh, lastUpdated, enrichRecord } = useComplianceRefresh()

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
        <div className="hidden lg:flex items-center justify-center gap-3 text-[10px] md:text-xs text-muted-foreground/60 font-mono">
          <ShareButton
            title="PQC Compliance Tracker — FIPS 140-3, ACVP, Common Criteria"
            text="Track PQC compliance certifications: FIPS 140-3, ACVP algorithm validation, and Common Criteria with PQC readiness status."
          />
          <GlossaryButton />
        </div>
      </div>

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
      </div>

      {/* Main Content Tabs */}
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
  )
}
