// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { HardDrive, Zap, Network, Download, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CERT_CAPACITY_DEFAULTS } from '@/data/certCapacityDefaults'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'

const DISPLAYED_ALGOS = ['RSA-2048', 'ECDSA P-256', 'ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87']

interface CalcInputs {
  certCount: number
  renewalDays: number
  handshakesPerSec: number
}

interface CalcOutputRow {
  algo: string
  storageMB: number
  renewalsPerYear: number
  tlsBandwidthKBPerHandshake: number
  tlsAggregateMBPerSec: number
  signaturesPerSecCapacity: number
  cpuCorePercent: number
  sizeSource: string
  perfSource: string
}

function computeOutputs(inputs: CalcInputs): CalcOutputRow[] {
  const { certCount, renewalDays, handshakesPerSec } = inputs
  const renewalsPerYear = Math.round(365 / renewalDays)

  return CERT_CAPACITY_DEFAULTS.filter((a) => DISPLAYED_ALGOS.includes(a.name)).map((algo) => {
    // Storage: CA archive model — total bytes for all certs issued in one year
    // Each cert holds the subject's public key + the CA's signature over the cert + ASN.1 headers/extensions
    const certSizeBytes = algo.publicKeyBytes + algo.signatureBytes + 512
    const storageMB = (certCount * certSizeBytes * renewalsPerYear) / (1024 * 1024)

    // TLS 1.3 per-handshake crypto payload:
    //   Certificate message  = pubkey + CA signature + ASN.1 overhead
    //   CertificateVerify    = fresh handshake signature (same algorithm, server proves key ownership)
    // Assumes CA and leaf cert use the same algorithm family.
    const certVerifyBytes = algo.signatureBytes
    const tlsBandwidthKBPerHandshake = (certSizeBytes + certVerifyBytes) / 1024

    // Aggregate network cost at the requested handshake rate
    const tlsAggregateMBPerSec = (tlsBandwidthKBPerHandshake * handshakesPerSec) / 1024

    // Server signing: max sign ops/sec on one CPU core (reference 3 GHz x86-64 benchmark)
    const maxSignOpsPerSec = 1e6 / algo.signCpuMicros
    const signaturesPerSecCapacity = Math.round(maxSignOpsPerSec)
    const cpuCorePercent = (handshakesPerSec / maxSignOpsPerSec) * 100

    return {
      algo: algo.name,
      storageMB: Math.round(storageMB * 10) / 10,
      renewalsPerYear,
      tlsBandwidthKBPerHandshake: Math.round(tlsBandwidthKBPerHandshake * 10) / 10,
      tlsAggregateMBPerSec: Math.round(tlsAggregateMBPerSec * 100) / 100,
      signaturesPerSecCapacity,
      cpuCorePercent: Math.round(cpuCorePercent * 10) / 10,
      sizeSource: algo.sizeSource,
      perfSource: algo.perfSource,
    }
  })
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  tooltip,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  tooltip: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground flex items-center gap-1">
          {label}
          <span title={tooltip} className="text-muted-foreground cursor-help" aria-label={tooltip}>
            <Info size={11} />
          </span>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-primary"
          aria-label={label}
        />
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (v >= min && v <= max) onChange(v)
          }}
          className="w-24 h-7 text-xs font-mono"
        />
      </div>
    </div>
  )
}

function MathDisclosure({ children }: { children: React.ReactNode }) {
  return (
    <details className="mt-2 text-xs text-muted-foreground">
      <summary className="cursor-pointer select-none hover:text-foreground transition-colors py-1">
        How this is calculated
      </summary>
      <div className="mt-2 space-y-1 pl-2 border-l border-border leading-relaxed">{children}</div>
    </details>
  )
}

export function CertCapacityCalculator() {
  const [inputs, setInputs] = useState<CalcInputs>({
    certCount: 1_000_000,
    renewalDays: 90,
    handshakesPerSec: 1000,
  })
  const [relativeMode, setRelativeMode] = useState(false)

  const results = useMemo(() => computeOutputs(inputs), [inputs])

  const set = useCallback(
    (key: keyof CalcInputs) => (v: number) => {
      setInputs((prev) => ({ ...prev, [key]: v }))
    },
    []
  )

  const ecdsaRef = results.find((r) => r.algo === 'ECDSA P-256') || results[0]

  const storageData = results.map((r) => ({
    name: r.algo,
    'Archive (MB)': relativeMode
      ? Number(((r.storageMB / ecdsaRef.storageMB) * 100).toFixed(1))
      : r.storageMB,
  }))
  const bandwidthData = results.map((r) => ({
    name: r.algo,
    'Bandwidth (MB/s)': relativeMode
      ? Number(((r.tlsAggregateMBPerSec / ecdsaRef.tlsAggregateMBPerSec) * 100).toFixed(1))
      : r.tlsAggregateMBPerSec,
  }))
  const cpuData = results.map((r) => ({
    name: r.algo,
    'CPU (% core)': relativeMode
      ? Number(((r.cpuCorePercent / ecdsaRef.cpuCorePercent) * 100).toFixed(1))
      : r.cpuCorePercent,
  }))

  const formatYAxis = (v: number) => (relativeMode ? `${v}%` : v.toLocaleString())
  const tooltipFormatter = (value: number) => [
    relativeMode ? `${value}%` : value.toLocaleString(),
    '',
  ]

  const handleExport = useCallback(() => {
    downloadCsv(
      generateCsv(results, [
        { header: 'Algorithm', accessor: (r) => r.algo },
        { header: 'CA Archive MB (annual)', accessor: (r) => r.storageMB },
        { header: 'Renewals per year', accessor: (r) => r.renewalsPerYear },
        { header: 'TLS payload KB per handshake', accessor: (r) => r.tlsBandwidthKBPerHandshake },
        { header: 'Aggregate bandwidth MB/s', accessor: (r) => r.tlsAggregateMBPerSec },
        { header: 'Max sign ops/sec (1 core)', accessor: (r) => r.signaturesPerSecCapacity },
        { header: 'CPU % of 1 core', accessor: (r) => r.cpuCorePercent },
        { header: 'Size source', accessor: (r) => r.sizeSource },
        { header: 'Perf source', accessor: (r) => r.perfSource },
      ]),
      csvFilename('cert-capacity')
    )
  }, [results])

  return (
    <div className="space-y-6">
      {/* Educational disclaimer */}
      <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 px-4 py-3">
        <p className="text-xs text-status-warning leading-relaxed">
          Educational model — values are based on reference benchmarks and may differ from your
          production environment. Always benchmark with your actual hardware and workload.
        </p>
      </div>

      {/* Inputs */}
      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Parameters
          </p>
          <div className="flex items-center gap-2">
            <Label htmlFor="relative-mode" className="text-xs font-medium text-muted-foreground">
              Relative to ECDSA P-256
            </Label>
            <Switch id="relative-mode" checked={relativeMode} onCheckedChange={setRelativeMode} />
          </div>
        </div>
        <SliderRow
          label="Certificate count"
          value={inputs.certCount}
          min={10_000}
          max={10_000_000}
          step={10_000}
          tooltip="Total number of certificates in your PKI (leaf certs). Affects storage only."
          onChange={set('certCount')}
        />
        <SliderRow
          label="Renewal cadence (days)"
          value={inputs.renewalDays}
          min={30}
          max={365}
          step={30}
          tooltip="How often each certificate is renewed. 90 days is the Let's Encrypt standard. Affects storage only."
          onChange={set('renewalDays')}
        />
        <SliderRow
          label="TLS handshakes / sec"
          value={inputs.handshakesPerSec}
          min={100}
          max={100_000}
          step={100}
          tooltip="Peak TLS handshake rate your servers handle. Affects bandwidth and CPU only."
          onChange={set('handshakesPerSec')}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Storage */}
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive size={14} className="text-primary" aria-hidden="true" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              CA Archive (MB/yr)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={storageData} margin={{ top: 5, right: 5, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                angle={-35}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: 11,
                }}
              />
              <Bar dataKey="Archive (MB)" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <MathDisclosure>
            <p>
              <span className="font-mono">certSize = pubKeyBytes + sigBytes + 512</span>
              <br />
              The cert stores the subject&apos;s public key, the CA&apos;s signature over the cert,
              and ≈512 bytes of ASN.1 overhead (DN fields, extensions, headers).
            </p>
            <p>
              <span className="font-mono">
                archiveMB = certCount × certSize × renewalsPerYear ÷ 1024²
              </span>
              <br />
              Models the CA database growing by one record per issued cert. If you keep all issued
              certs (audit trail), this is how much storage you add per year.
            </p>
            <p className="text-muted-foreground/70">
              Sliders that affect this chart: <em>Certificate count</em>, <em>Renewal cadence</em>.
            </p>
            <p className="text-muted-foreground/70">
              Size sources: NIST FIPS 204 Table 1 (ML-DSA), RFC 5480 (ECDSA), RFC 3447 (RSA).
            </p>
          </MathDisclosure>
        </div>

        {/* Bandwidth */}
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Network size={14} className="text-secondary" aria-hidden="true" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Bandwidth (MB/s)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bandwidthData} margin={{ top: 5, right: 5, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                angle={-35}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: 11,
                }}
              />
              <Bar dataKey="Bandwidth (MB/s)" fill="var(--color-secondary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <MathDisclosure>
            <p>A TLS 1.3 handshake sends two crypto-heavy messages:</p>
            <p>
              <span className="font-mono">Certificate</span> = pubKeyBytes + CA sigBytes + 512
              (ASN.1)
              <br />
              <span className="font-mono">CertificateVerify</span> = sigBytes (server proves
              ownership of private key by signing the handshake transcript)
            </p>
            <p>
              <span className="font-mono">
                payloadKB = (Certificate + CertificateVerify) ÷ 1024
              </span>
              <br />
              <span className="font-mono">aggregateMB/s = payloadKB × handshakesPerSec ÷ 1024</span>
            </p>
            <p className="text-muted-foreground/70">
              Assumes the CA and the server leaf cert use the same algorithm family (e.g., ML-DSA CA
              issuing ML-DSA leaf certs). Hybrid PKI (ECDSA CA + ML-DSA leaf) would reduce the CA
              sig size in the Certificate message.
            </p>
            <p className="text-muted-foreground/70">
              Slider that affects this chart: <em>TLS handshakes / sec</em>.
            </p>
          </MathDisclosure>
        </div>

        {/* CPU */}
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-accent" aria-hidden="true" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              CPU (% of 1 core)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cpuData} margin={{ top: 5, right: 5, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                angle={-35}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  fontSize: 11,
                }}
              />
              <Bar dataKey="CPU (% core)" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <MathDisclosure>
            <p>
              Models server-side signing cost only (the server signs the CertificateVerify message
              on every handshake).
            </p>
            <p>
              <span className="font-mono">maxOps/s = 1,000,000 ÷ signCpuMicros</span>
              <br />
              <span className="font-mono">CPU% = (handshakesPerSec ÷ maxOps/s) × 100</span>
            </p>
            <p className="text-muted-foreground/70">
              AVX2-optimised benchmarks, single-core 3 GHz x86-64 (Haswell-class). ML-DSA numbers
              are from the CRYSTALS-Dilithium AVX2 submission (NIST PQC Round 3, Appendix B); RSA
              and ECDSA from OpenSSL 3.x with CRT and AVX2 scalar-multiplication. Note: RSA signing
              improves further (~3–4×) with AVX-512 IFMA52 (Ice Lake+), which is not modelled here.
              Multi-core scaling is linear — divide CPU% by your core count for fleet capacity.
            </p>
            <p className="text-muted-foreground/70">
              Slider that affects this chart: <em>TLS handshakes / sec</em>.
            </p>
          </MathDisclosure>
        </div>
      </div>

      {/* Data table */}
      <div className="glass-panel overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Algorithm</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">
                CA Archive MB/yr
              </th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">
                TLS payload KB
              </th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">
                Bandwidth MB/s
              </th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">
                Sign ops/sec
              </th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">
                CPU % / core
              </th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium hidden md:table-cell">
                Sources
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.algo} className="border-b border-border/50 hover:bg-muted/20">
                <td className="px-3 py-2 font-mono text-foreground">{r.algo}</td>
                <td className="px-3 py-2 text-right font-mono">{r.storageMB.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono">{r.tlsBandwidthKBPerHandshake}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {r.tlsAggregateMBPerSec.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {r.signaturesPerSecCapacity.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {r.cpuCorePercent.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">
                  {r.sizeSource}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download size={14} />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
