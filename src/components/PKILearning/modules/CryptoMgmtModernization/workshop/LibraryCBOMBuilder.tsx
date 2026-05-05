// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CRYPTO_LIBRARIES,
  type EsvStatus,
  type FipsStatus,
  type RiskColor,
} from '../data/cryptoLibraries'
import { HSM_VENDORS } from '../data/hsmVendors'
import { SAMPLE_SBOMS } from '../data/sampleSBOMs'
import type { CbomExportItem } from '../data/workshopTypes'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useAlgorithmTransitionsForAssessment } from '@/hooks/useAlgorithmTransitionsForAssessment'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { SampleDataBadge } from '@/components/BusinessCenter/widgets/SampleDataBadge'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { useLiveCmvpStatus } from '@/hooks/useLiveCmvpStatus'
import { LiveCmvpBadge } from '@/components/BusinessCenter/widgets/LiveCmvpBadge'

type Mode = 'sbom' | 'libs' | 'hsm' | 'assessment'

const FIPS_LABEL: Record<FipsStatus, string> = {
  active: 'FIPS active',
  'active-pqc': 'FIPS active (PQC)',
  historical: 'historical',
  revoked: 'revoked',
  'in-mip': 'in MIP queue',
  'not-validated': 'not validated',
}

const FIPS_COLOR: Record<FipsStatus, string> = {
  active: 'bg-status-success/15 text-status-success border-status-success/30',
  'active-pqc': 'bg-status-success/20 text-status-success border-status-success/40',
  historical: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  revoked: 'bg-status-error/15 text-status-error border-status-error/30',
  'in-mip': 'bg-status-info/15 text-status-info border-status-info/30',
  'not-validated': 'bg-muted text-muted-foreground border-border',
}

const ESV_LABEL: Record<EsvStatus, string> = {
  active: 'ESV active',
  historical: 'ESV historical',
  revoked: 'ESV revoked',
  'in-mip': 'ESV in queue',
  'not-validated': 'not validated',
}

const ESV_COLOR: Record<EsvStatus, string> = {
  active: 'bg-status-success/15 text-status-success border-status-success/30',
  historical: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  revoked: 'bg-status-error/15 text-status-error border-status-error/30',
  'in-mip': 'bg-status-info/15 text-status-info border-status-info/30',
  'not-validated': 'bg-muted text-muted-foreground border-border',
}

const POSTURE_LIGHT: Record<RiskColor, string> = {
  red: 'bg-status-error',
  yellow: 'bg-status-warning',
  green: 'bg-status-success',
}

interface CbomRow {
  name: string
  version: string
  matched: boolean
  fipsStatus: FipsStatus
  esvStatus: EsvStatus
  pqcSupport: string
  posture: RiskColor
  notes: string
}

interface LibraryCBOMBuilderProps {
  onCbomExport?: (items: CbomExportItem[]) => void
}

export const LibraryCBOMBuilder: React.FC<LibraryCBOMBuilderProps> = ({ onCbomExport }) => {
  const assessmentTransitions = useAlgorithmTransitionsForAssessment()
  const { myProducts } = useExecutiveModuleData()
  const hasAssessmentCrypto = assessmentTransitions.length > 0 || myProducts.length > 0
  const [mode, setMode] = useState<Mode>(hasAssessmentCrypto ? 'assessment' : 'libs')
  const [selectedSbom, setSelectedSbom] = useState<string>(SAMPLE_SBOMS[0].id)
  const [userSbom, setUserSbom] = useState<string>('')
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)
  const liveCmvp = useLiveCmvpStatus()

  const activeSbom = useMemo(() => {
    if (userSbom.trim().length > 0) {
      return { id: 'user', filename: 'user-provided.json', content: userSbom }
    }
    return SAMPLE_SBOMS.find((s) => s.id === selectedSbom) ?? SAMPLE_SBOMS[0]
  }, [selectedSbom, userSbom])

  const cbomSlice = useMemo((): CbomRow[] => {
    try {
      const parsed = JSON.parse(activeSbom.content) as { components?: unknown }
      const components: unknown[] = Array.isArray(parsed.components) ? parsed.components : []
      return components.map((raw): CbomRow => {
        const c = (raw ?? {}) as Record<string, unknown>
        const name = String(c.name ?? '')
        const version = String(c.version ?? '')
        const lib = CRYPTO_LIBRARIES.find(
          (l) =>
            l.name.toLowerCase() === name.toLowerCase() ||
            name.toLowerCase().includes(l.name.toLowerCase().split(' ')[0])
        )
        return {
          name,
          version,
          matched: Boolean(lib),
          fipsStatus: lib?.fipsStatus ?? 'not-validated',
          esvStatus: lib?.esvStatus ?? 'not-validated',
          pqcSupport: lib?.pqcSupport ?? '—',
          posture: lib?.posture ?? 'yellow',
          notes: lib?.notes ?? 'No posture record — add to inventory and research.',
        }
      })
    } catch {
      return []
    }
  }, [activeSbom])

  useEffect(() => {
    if (!onCbomExport) return
    const items: CbomExportItem[] = cbomSlice.map((row) => ({
      name: row.name,
      version: row.version,
      type: 'library' as const,
      fipsStatus: row.fipsStatus,
      esvStatus: row.esvStatus,
      pqcSupport: row.pqcSupport,
      posture: row.posture,
      notes: row.notes,
    }))
    onCbomExport(items)
  }, [cbomSlice, onCbomExport])

  /** Markdown serialization of the current CBOM slice + library posture +
   *  HSM coverage for Command Center export. The format mirrors a CycloneDX
   *  CBOM slice but as a human-readable table since downstream tooling
   *  varies. The markdown captures whichever mode the user is currently in. */
  const exportMarkdown = useMemo(() => {
    const lines: string[] = []
    lines.push('# Crypto Bill of Materials (CBOM)')
    lines.push('')
    const modeLabel =
      mode === 'sbom'
        ? 'SBOM → CBOM'
        : mode === 'libs'
          ? 'Library posture'
          : mode === 'hsm'
            ? 'HSM inventory'
            : 'From your assessment'
    lines.push(`Mode: **${modeLabel}**`)
    lines.push('')
    lines.push('Per NIST CSWP.39 §5 (Inventory step) — feeds the Information Repository.')
    lines.push('')
    if (mode === 'assessment') {
      lines.push(
        `## Assessment-derived crypto inventory — ${assessmentTransitions.length} algorithm${assessmentTransitions.length !== 1 ? 's' : ''}`
      )
      lines.push('')
      lines.push(
        '_Joined from your assessment Step 3 selections against the NIST algorithm transitions catalog._'
      )
      lines.push('')
      if (assessmentTransitions.length > 0) {
        lines.push('| Classical | Function | PQC replacement | Deprecation | Standard | Region |')
        lines.push('|---|---|---|---|---|---|')
        for (const t of assessmentTransitions) {
          const classical = t.keySize ? `${t.classical} (${t.keySize})` : t.classical
          lines.push(
            `| ${classical} | ${t.function} | ${t.pqc} | ${t.deprecationDate || '—'} | ${t.status} | ${t.region} |`
          )
        }
      } else {
        lines.push('_No assessment crypto recorded._')
      }
      lines.push('')
      if (myProducts.length > 0) {
        lines.push(
          `## Products from /migrate — ${myProducts.length} item${myProducts.length !== 1 ? 's' : ''}`
        )
        lines.push('')
        lines.push('| Product | Vendor | FIPS | PQC support | Layer |')
        lines.push('|---|---|---|---|---|')
        for (const p of myProducts) {
          lines.push(
            `| ${p.softwareName} | ${p.vendorId || '—'} | ${p.fipsValidated || '—'} | ${p.pqcSupport || '—'} | ${p.infrastructureLayer || '—'} |`
          )
        }
        lines.push('')
      }
    }
    if (mode === 'sbom' || mode === 'libs') {
      lines.push(
        `## CBOM slice — ${cbomSlice.length} component${cbomSlice.length !== 1 ? 's' : ''}`
      )
      lines.push('')
      if (cbomSlice.length > 0) {
        lines.push('| Component | Version | FIPS | ESV | PQC | Posture | Notes |')
        lines.push('|---|---|---|---|---|---|---|')
        for (const row of cbomSlice) {
          const safeNotes = row.notes.replace(/\|/g, '\\|')
          lines.push(
            `| ${row.name} | ${row.version || '—'} | ${row.fipsStatus} | ${row.esvStatus} | ${row.pqcSupport} | ${row.posture} | ${safeNotes} |`
          )
        }
      } else {
        lines.push('_No components parsed from the active SBOM._')
      }
      lines.push('')
    }
    if (mode === 'hsm') {
      lines.push(
        `## HSM inventory — ${HSM_VENDORS.length} vendor${HSM_VENDORS.length !== 1 ? 's' : ''}`
      )
      lines.push('')
      lines.push('| Vendor | Product | Firmware | FIPS Level | FIPS Status | PQC support | Notes |')
      lines.push('|---|---|---|---|---|---|---|')
      for (const v of HSM_VENDORS) {
        const safeNotes = (v.notes ?? '').replace(/\|/g, '\\|')
        lines.push(
          `| ${v.vendor} | ${v.product} | ${v.firmwareRev} | L${v.fipsLevel} | ${v.fipsStatus} | ${v.pqcSupport} | ${safeNotes} |`
        )
      }
      lines.push('')
    }
    return lines.join('\n')
  }, [mode, cbomSlice])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Three linked views over the software and hardware inventory: map an SBOM into a
        crypto-focused <InlineTooltip term="CBOM">CBOM</InlineTooltip> slice, inspect your library
        posture, and track <InlineTooltip term="FIPS 140-3">FIPS 140-3</InlineTooltip> Level 3
        status for every HSM your keys live in.
      </p>

      <div className="flex flex-wrap gap-2">
        {hasAssessmentCrypto && (
          <Button
            variant={mode === 'assessment' ? 'gradient' : 'outline'}
            onClick={() => setMode('assessment')}
            className="text-xs"
          >
            From your assessment
          </Button>
        )}
        <Button
          variant={mode === 'sbom' ? 'gradient' : 'outline'}
          onClick={() => setMode('sbom')}
          className="text-xs"
        >
          SBOM → CBOM
        </Button>
        <Button
          variant={mode === 'libs' ? 'gradient' : 'outline'}
          onClick={() => setMode('libs')}
          className="text-xs"
        >
          Library posture
        </Button>
        <Button
          variant={mode === 'hsm' ? 'gradient' : 'outline'}
          onClick={() => setMode('hsm')}
          className="text-xs"
        >
          Hardware FIPS 140-3 L3
        </Button>
      </div>

      {mode === 'assessment' && (
        <div className="space-y-3">
          <PreFilledBanner
            summary={
              [
                assessmentTransitions.length > 0 &&
                  `${assessmentTransitions.length} algorithm${assessmentTransitions.length !== 1 ? 's' : ''} from your assessment`,
                myProducts.length > 0 &&
                  `${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`,
              ]
                .filter(Boolean)
                .join(' + ') + '.'
            }
            onClear={() => setMode('libs')}
          />
          <div className="overflow-x-auto bg-muted/40 rounded-lg p-3 border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/60 text-left">
                  <th className="p-2 font-bold">Classical algorithm</th>
                  <th className="p-2 font-bold">Function</th>
                  <th className="p-2 font-bold">PQC replacement</th>
                  <th className="p-2 font-bold">Deprecation</th>
                  <th className="p-2 font-bold">Standard</th>
                  <th className="p-2 font-bold">Region</th>
                </tr>
              </thead>
              <tbody>
                {assessmentTransitions.map((t) => (
                  <tr key={t.storedKey} className="border-t border-border align-top">
                    <td className="p-2">
                      <div className="font-bold text-foreground">{t.classical}</div>
                      {t.keySize && (
                        <div className="text-[10px] text-muted-foreground">{t.keySize}</div>
                      )}
                    </td>
                    <td className="p-2 text-muted-foreground">{t.function}</td>
                    <td className="p-2 font-mono text-foreground">{t.pqc}</td>
                    <td className="p-2 text-muted-foreground">{t.deprecationDate || '—'}</td>
                    <td className="p-2">
                      {t.statusUrl ? (
                        <a
                          href={t.statusUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {t.status}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{t.status}</span>
                      )}
                    </td>
                    <td className="p-2 text-muted-foreground">{t.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground italic mt-3">
              Source: NIST algorithm transitions catalog. Use this slice as the seed for your full
              CBOM — match each row to actual library / HSM owners on your team.
            </p>
          </div>
        </div>
      )}

      {mode === 'sbom' && (
        <div className="space-y-4">
          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <label
              htmlFor="cmm-sample-sbom"
              className="text-xs font-bold text-foreground block mb-2"
            >
              Sample SBOM
            </label>
            <select
              id="cmm-sample-sbom"
              value={selectedSbom}
              onChange={(e) => {
                setSelectedSbom(e.target.value)
                setUserSbom('')
              }}
              className="bg-background border border-input rounded px-2 py-1 text-xs text-foreground w-full sm:w-auto"
            >
              {SAMPLE_SBOMS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.filename}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-2">
              {SAMPLE_SBOMS.find((s) => s.id === selectedSbom)?.description}
            </p>
            <label
              htmlFor="cmm-user-sbom"
              className="text-xs font-bold text-foreground block mt-3 mb-1"
            >
              Or paste your own CycloneDX / SPDX JSON
            </label>
            <textarea
              id="cmm-user-sbom"
              value={userSbom}
              onChange={(e) => setUserSbom(e.target.value)}
              className="w-full h-24 bg-background border border-input rounded px-2 py-1 text-[11px] font-mono text-foreground"
              placeholder="Paste CycloneDX JSON here to override the sample"
            />
          </div>

          <div className="bg-muted/40 rounded-lg p-3 border border-border">
            <div className="font-bold text-sm text-foreground mb-2">CBOM slice</div>
            {cbomSlice.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No components parsed. Use a sample or paste a valid CycloneDX JSON with a
                <code className="text-xs mx-1">components</code> array.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/60 text-left">
                      <th className="p-2 font-bold">Library</th>
                      <th className="p-2 font-bold">Version</th>
                      <th className="p-2 font-bold">FIPS status</th>
                      <th className="p-2 font-bold">ESV (SP 800-90B)</th>
                      <th className="p-2 font-bold">PQC support</th>
                      <th className="p-2 font-bold">Posture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cbomSlice.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2 font-mono">{row.name}</td>
                        <td className="p-2">{row.version}</td>
                        <td className="p-2">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] border ${FIPS_COLOR[row.fipsStatus]}`}
                          >
                            {FIPS_LABEL[row.fipsStatus]}
                          </span>
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] border ${ESV_COLOR[row.esvStatus]}`}
                          >
                            {ESV_LABEL[row.esvStatus]}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground">{row.pqcSupport}</td>
                        <td className="p-2">
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${POSTURE_LIGHT[row.posture]}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {(mode === 'libs' || mode === 'hsm') && (
        <div className="rounded-md border border-status-warning/40 bg-status-warning/10 p-3 flex items-start gap-2">
          <FlaskConical size={14} className="text-status-warning shrink-0 mt-0.5" />
          <p className="text-xs text-foreground">
            <span className="font-semibold">Illustrative data for teaching.</span> Cert numbers,
            firmware revisions, and PQC support claims below are educational snapshots, not live{' '}
            <InlineTooltip term="CMVP">CMVP</InlineTooltip> records. Verify against the{' '}
            <a
              href="https://csrc.nist.gov/projects/cryptographic-module-validation-program"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              NIST CMVP database
            </a>{' '}
            and the vendor&apos;s product page before quoting.
          </p>
        </div>
      )}

      {mode === 'libs' && (
        <div className="overflow-x-auto bg-muted/40 rounded-lg p-3 border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/60 text-left">
                <th className="p-2 font-bold">Library</th>
                <th className="p-2 font-bold">Latest</th>
                <th className="p-2 font-bold">EoL</th>
                <th className="p-2 font-bold">FIPS 140-3</th>
                <th className="p-2 font-bold">ESV (SP 800-90B)</th>
                <th className="p-2 font-bold">PQC</th>
                <th className="p-2 font-bold">High CVEs (1y)</th>
                <th className="p-2 font-bold">Posture</th>
              </tr>
            </thead>
            <tbody>
              {CRYPTO_LIBRARIES.map((lib) => (
                <tr key={lib.id} className="border-t border-border align-top">
                  <td className="p-2">
                    <div className="font-bold text-foreground">{lib.name}</div>
                    <div className="text-[10px] text-muted-foreground">{lib.vendor}</div>
                  </td>
                  <td className="p-2 font-mono">{lib.latestVersion}</td>
                  <td className="p-2 text-muted-foreground">{lib.eolDate ?? 'active'}</td>
                  <td className="p-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] border ${FIPS_COLOR[lib.fipsStatus]}`}
                    >
                      {FIPS_LABEL[lib.fipsStatus]}
                    </span>
                    {lib.cmvpCertNumber && (
                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                        <span>{lib.cmvpCertNumber}</span>
                        <SampleDataBadge />
                        <LiveCmvpBadge match={liveCmvp.match(lib.vendor, lib.name)} />
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] border ${ESV_COLOR[lib.esvStatus]}`}
                    >
                      {ESV_LABEL[lib.esvStatus]}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground max-w-[220px]">{lib.pqcSupport}</td>
                  <td className="p-2 text-center">{lib.openCveHigh}</td>
                  <td className="p-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${POSTURE_LIGHT[lib.posture]}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground italic mt-3">
            Illustrative values for teaching purposes. Verify live against the NIST CMVP
            validated-modules list and vendor pages.
          </p>
        </div>
      )}

      {mode === 'hsm' && (
        <div className="overflow-x-auto bg-muted/40 rounded-lg p-3 border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/60 text-left">
                <th className="p-2 font-bold">Vendor / Product</th>
                <th className="p-2 font-bold">Firmware</th>
                <th className="p-2 font-bold">FIPS level</th>
                <th className="p-2 font-bold">ESV (SP 800-90B)</th>
                <th className="p-2 font-bold">PQC in boundary</th>
                <th className="p-2 font-bold">Platform binding</th>
                <th className="p-2 font-bold">Posture</th>
              </tr>
            </thead>
            <tbody>
              {HSM_VENDORS.map((h) => (
                <tr key={h.id} className="border-t border-border align-top">
                  <td className="p-2">
                    <div className="font-bold text-foreground">{h.product}</div>
                    <div className="text-[10px] text-muted-foreground">{h.vendor}</div>
                  </td>
                  <td className="p-2 font-mono text-[11px]">
                    <span>{h.firmwareRev}</span>{' '}
                    <SampleDataBadge tooltip="Firmware revision is an illustrative sample. Verify against the vendor's product page." />
                  </td>
                  <td className="p-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] border ${FIPS_COLOR[h.fipsStatus]}`}
                    >
                      L{h.fipsLevel} · {FIPS_LABEL[h.fipsStatus]}
                    </span>
                    {h.cmvpCertNumber && (
                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                        <span>{h.cmvpCertNumber}</span>
                        <SampleDataBadge />
                        <LiveCmvpBadge match={liveCmvp.match(h.vendor, h.product)} />
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] border ${ESV_COLOR[h.esvStatus]}`}
                    >
                      {ESV_LABEL[h.esvStatus]}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground max-w-[220px]">{h.pqcSupport}</td>
                  <td className="p-2 text-muted-foreground max-w-[180px]">{h.platformBinding}</td>
                  <td className="p-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${POSTURE_LIGHT[h.posture]}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground italic mt-3">
            CMVP certificates bind to a specific firmware revision and platform list. A firmware
            upgrade on an HSM may invalidate its current cert — subscribe to NIST CMVP change
            notices and include the query in the Assurance pillar&apos;s monthly monitor.
          </p>
        </div>
      )}

      {/* Save to Command Center / export */}
      <ExportableArtifact
        title="CBOM — Export"
        exportData={exportMarkdown}
        filename="crypto-bom"
        formats={['markdown', 'pdf', 'docx']}
        onExport={() => {
          addExecutiveDocument({
            id: `crypto-cbom-${Date.now()}`,
            moduleId: 'crypto-management-modernization',
            type: 'crypto-cbom',
            title: `CBOM — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: {
              mode,
              selectedSbom,
              assessmentSeed:
                mode === 'assessment' ? assessmentTransitions.map((t) => t.storedKey) : undefined,
            },
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Save the CBOM slice to your Command Center under the Management Tools zone, or export as
          markdown / PDF / DOCX.
        </p>
      </ExportableArtifact>
    </div>
  )
}
