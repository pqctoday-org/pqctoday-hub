// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { SaveToOperationsPack } from '@/components/BusinessCenter/operationsPack/SaveToOperationsPack'
import { certCapacityPlanMarkdown } from '@/services/opsArtifacts'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import {
  computeCertificateCapacity,
  CERT_CAPACITY_MODEL_VERSION,
  CERT_CAPACITY_ASSUMPTIONS,
  type CertCapacityInputs,
} from '@/data/certCapacityDefaults'

const fields: { key: keyof CertCapacityInputs; label: string; min: number; max: number }[] = [
  { key: 'certCount', label: 'Active leaf certificates', min: 0, max: 100_000_000 },
  { key: 'renewalDays', label: 'Leaf renewal interval (days)', min: 1, max: 3650 },
  { key: 'handshakesPerSec', label: 'Full TLS handshakes per second', min: 0, max: 1_000_000 },
  {
    key: 'templateBytes',
    label: 'Other certificate structure and extensions (bytes per certificate)',
    min: 0,
    max: 65536,
  },
]

export function CertCapacityCalculator() {
  const [inputs, setInputs] = useState<CertCapacityInputs>({
    certCount: 1_000_000,
    renewalDays: 90,
    handshakesPerSec: 1000,
    templateBytes: 512,
  })
  const rows = useMemo(() => computeCertificateCapacity(inputs), [inputs])
  const plan = {
    ...inputs,
    modelVersion: CERT_CAPACITY_MODEL_VERSION,
    assumptions: CERT_CAPACITY_ASSUMPTIONS,
    rows,
  }
  const format = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 3 })
  const exportCsv = () =>
    downloadCsv(
      generateCsv(rows, [
        { header: 'Model version', accessor: () => CERT_CAPACITY_MODEL_VERSION },
        { header: 'Assumptions', accessor: () => CERT_CAPACITY_ASSUMPTIONS },
        ...fields.map((f) => ({ header: f.label, accessor: () => inputs[f.key] })),
        { header: 'Chain algorithm', accessor: (r) => r.algorithm },
        { header: 'Certificate bytes', accessor: (r) => r.certificateBytes },
        { header: 'Transmitted chain bytes (2 certificates)', accessor: (r) => r.chainBytes },
        { header: 'Server signature bytes (one)', accessor: (r) => r.signatureBytes },
        { header: 'Certificate-related payload bytes', accessor: (r) => r.payloadBytes },
        { header: 'Annualized leaf renewals', accessor: (r) => r.renewalsPerYear },
        { header: 'Annual leaf issuance storage (MiB)', accessor: (r) => r.storageMiB },
        {
          header: 'Certificate-related payload rate (MiB/s)',
          accessor: (r) => r.aggregateMiBPerSec,
        },
        { header: 'Size source', accessor: (r) => r.sizeSource },
      ]),
      csvFilename('cert-capacity')
    )

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 space-y-2">
        <h2 className="text-lg font-semibold">Certificate size and storage explorer</h2>
        <p className="text-sm text-muted-foreground">
          Educational estimates for entirely classical or entirely PQC chains. Each example uses one
          algorithm and parameter set throughout.
        </p>
        <p className="text-sm font-medium">Root CA → intermediate CA → leaf</p>
        <p className="text-sm text-muted-foreground">
          TLS sends two certificates: intermediate + leaf. The root is excluded. The PQC example is
          a size comparison, not a claim of deployment support.
        </p>
        <p className="text-sm text-muted-foreground">
          The PQC rows cover the ML-DSA signature family; each parameter set is shown separately
          because its public-key and signature sizes differ.
        </p>
      </div>
      <div className="glass-panel p-4 grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="text-sm space-y-1">
            <span className="block">{f.label}</span>
            <input
              type="number"
              min={f.min}
              max={f.max}
              step={1}
              value={inputs[f.key]}
              onChange={(e) => {
                if (e.target.value === '') return
                const v = Number(e.target.value)
                if (Number.isInteger(v) && v >= f.min && v <= f.max) {
                  setInputs((prev) => ({ ...prev, [f.key]: v }))
                }
              }}
              className="w-full rounded border border-border bg-background p-2"
            />
          </label>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        The overhead allowance excludes the encoded public key and signature. Resumed connections
        are excluded from the full-handshake input. Annual storage models leaf issuance in steady
        state; initial issuance, CA renewals, backups and retained historical archives are
        additional.
      </p>
      <div className="overflow-x-auto glass-panel p-4">
        <table className="w-full text-sm">
          <caption className="text-left font-semibold pb-3">
            Estimated size and storage — rounded for display only
          </caption>
          <thead>
            <tr>
              {[
                'Chain algorithm',
                'Certificate (B)',
                'Sent chain (B)',
                'Certificate-related payload (KiB/full handshake)',
                'Payload rate (MiB/s)',
                'Annual leaf issuance (MiB)',
              ].map((h) => (
                <th key={h} scope="col" className="text-left p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.algorithm} className="border-t border-border">
                <th scope="row" className="text-left p-2">
                  {r.algorithm}
                </th>
                {[
                  r.certificateBytes,
                  r.chainBytes,
                  r.payloadKiB,
                  r.aggregateMiBPerSec,
                  r.storageMiB,
                ].map((n, i) => (
                  <td key={i} className="p-2 font-mono">
                    {format(n)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="glass-panel p-4 space-y-2 text-sm">
        <h3 className="font-semibold">How to read these estimates</h3>
        <p>
          Certificate = raw public key + public-key encoding allowance + issuer signature + template
          overhead.
        </p>
        <p>
          Sent chain = two certificates. Certificate-related payload = sent chain + one server
          CertificateVerify signature contribution.
        </p>
        <p>Annual leaf issuance storage = leaf count × certificate bytes × (365 ÷ renewal days).</p>
        <p>
          At this interval, each leaf averages {format(365 / inputs.renewalDays)} renewals per year.
        </p>
        <p className="text-muted-foreground">
          TLS framing, key shares, other handshake messages, optional OCSP/SCT additions and client
          authentication are excluded. This is not total handshake bandwidth or a latency estimate.
          Signing and key exchange are separate: PQC certificates can accompany hybrid key exchange.
        </p>
        <details>
          <summary className="cursor-pointer">Size sources and encoding assumptions</summary>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {rows.map((r) => (
              <li key={r.algorithm}>
                {r.algorithm}: {r.sizeSource}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            ECDSA DER signatures vary in length; this example uses a 72-byte upper bound. The
            template allowance is illustrative, not a measured certificate size.
          </p>
        </details>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={exportCsv}>Export educational estimate (CSV)</Button>
        <SaveToOperationsPack
          build={() => ({
            type: 'cert-capacity-plan' as const,
            moduleId: 'cert-capacity',
            title: 'Certificate educational estimate',
            data: certCapacityPlanMarkdown(plan),
            inputs: plan,
          })}
        />
      </div>
    </div>
  )
}
