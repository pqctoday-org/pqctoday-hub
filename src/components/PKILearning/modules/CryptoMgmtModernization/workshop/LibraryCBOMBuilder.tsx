// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CRYPTO_LIBRARIES, type FipsStatus, type RiskColor } from '../data/cryptoLibraries'
import { HSM_VENDORS } from '../data/hsmVendors'
import { SAMPLE_SBOMS } from '../data/sampleSBOMs'

type Mode = 'sbom' | 'libs' | 'hsm'

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
  pqcSupport: string
  posture: RiskColor
  notes: string
}

export const LibraryCBOMBuilder: React.FC = () => {
  const [mode, setMode] = useState<Mode>('libs')
  const [selectedSbom, setSelectedSbom] = useState<string>(SAMPLE_SBOMS[0].id)
  const [userSbom, setUserSbom] = useState<string>('')

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
          pqcSupport: lib?.pqcSupport ?? '—',
          posture: lib?.posture ?? 'yellow',
          notes: lib?.notes ?? 'No posture record — add to inventory and research.',
        }
      })
    } catch {
      return []
    }
  }, [activeSbom])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Three linked views over the software and hardware inventory: map an SBOM into a
        crypto-focused CBOM slice, inspect your library posture, and track FIPS 140-3 Level 3 status
        for every HSM your keys live in.
      </p>

      <div className="flex flex-wrap gap-2">
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

      {mode === 'libs' && (
        <div className="overflow-x-auto bg-muted/40 rounded-lg p-3 border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/60 text-left">
                <th className="p-2 font-bold">Library</th>
                <th className="p-2 font-bold">Latest</th>
                <th className="p-2 font-bold">EoL</th>
                <th className="p-2 font-bold">FIPS 140-3</th>
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
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {lib.cmvpCertNumber}
                      </div>
                    )}
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
                  <td className="p-2 font-mono text-[11px]">{h.firmwareRev}</td>
                  <td className="p-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] border ${FIPS_COLOR[h.fipsStatus]}`}
                    >
                      L{h.fipsLevel} · {FIPS_LABEL[h.fipsStatus]}
                    </span>
                    {h.cmvpCertNumber && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {h.cmvpCertNumber}
                      </div>
                    )}
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
    </div>
  )
}
