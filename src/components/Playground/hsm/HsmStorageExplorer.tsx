// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CapacityChoice } from './CapacityChoice'
import { generateCsv, downloadCsv, csvFilename } from '@/utils/csvExport'
import {
  computeKeyStorage,
  PQC_VARIANTS,
  PQC_FAMILY_DEFAULT_VARIANT,
  type KeyStorageMode,
  type PqcFamily,
  type RsaAlg,
} from '@/data/hsmKeyStorageDefaults'

export function HsmStorageExplorer() {
  const [capacityMiB, setCapacityMiB] = useState(64)
  const [mode, setMode] = useState<KeyStorageMode>('pure-pqc')
  const [family, setFamily] = useState<PqcFamily>('ML-DSA')
  const [variant, setVariant] = useState('ML-DSA-65')
  const [rsa, setRsa] = useState<RsaAlg>('RSA-2048')
  const [seed, setSeed] = useState(false)
  const [certificate, setCertificate] = useState(true)
  const [template, setTemplate] = useState(600)
  const [wrapper, setWrapper] = useState(24)
  const [overhead, setOverhead] = useState(5)
  const inputs = {
    mode,
    capacityBytes: capacityMiB * 1024 ** 2,
    rsaAlg: rsa,
    pqcFamily: family,
    pqcVariant: variant,
    overheadPct: overhead,
    includeSeedOverhead: seed,
    includeCertificate: certificate,
    certTemplateBytes: template,
    spkiWrapperBytes: wrapper,
  }
  const result = computeKeyStorage(inputs)
  const assumptions =
    'Educational byte budget, not physical object-slot capacity. Expanded PQC private key; RSA private-key encoding is estimated. Seed and certificate storage are optional. Wrapper/template/overhead are assumptions. Combined material is a byte sum, not a specific encoding. ML-KEM certificates assume a separate ML-DSA issuer. Excludes vendor limits, backups and replication.'
  const exportCsv = () =>
    downloadCsv(
      generateCsv(
        [{ inputs, result }],
        [
          { header: 'Model version', accessor: () => '2' },
          { header: 'Assumptions', accessor: () => assumptions },
          {
            header: 'Inputs (bytes unless labelled percent)',
            accessor: (r) => JSON.stringify(r.inputs),
          },
          { header: 'Results (bytes and object count)', accessor: (r) => JSON.stringify(r.result) },
        ]
      ),
      csvFilename('hsm-object-storage-estimate')
    )
  const number = (
    label: string,
    value: number,
    setter: (v: number) => void,
    min = 0,
    max = 65536
  ) => (
    <label className="text-sm block">
      {label}
      <input
        aria-label={label}
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          if (e.target.value === '') return
          const v = Number(e.target.value)
          if (Number.isFinite(v) && v >= min && v <= max) setter(v)
        }}
        className="block w-full rounded border border-border bg-background p-2"
      />
    </label>
  )
  return (
    <details className="glass-panel p-4">
      <summary className="font-semibold cursor-pointer">HSM object storage assumptions</summary>
      <p className="text-sm text-muted-foreground my-3">
        Separate from throughput and TLS-chain sizing. This estimates bytes for an expanded private
        key and, optionally, its certificate. Vendor object limits, alignment, wrapping and storage
        policies can change capacity. Composite/dual material is a byte-sum illustration, not an
        encoded certificate format or a mixed-chain recommendation.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {number('Available storage (MiB)', capacityMiB, setCapacityMiB, 0, 65536)}
        <CapacityChoice
          label="Storage example"
          selectedId={mode}
          items={[
            { id: 'classical', label: 'Classical' },
            { id: 'pure-pqc', label: 'PQC' },
            { id: 'hybrid', label: 'Combined material (approximate byte sum)' },
          ]}
          onSelect={(id) => setMode(id as KeyStorageMode)}
          hideDefaultOption
        />
        <CapacityChoice
          label="Classical key"
          selectedId={rsa}
          items={['RSA-2048', 'RSA-3072']}
          onSelect={(id) => setRsa(id as RsaAlg)}
          hideDefaultOption
        />
        <CapacityChoice
          label="PQC family"
          selectedId={family}
          items={['ML-DSA', 'ML-KEM', 'SLH-DSA']}
          hideDefaultOption
          onSelect={(id) => {
            const f = id as PqcFamily
            setFamily(f)
            setVariant(PQC_FAMILY_DEFAULT_VARIANT[f])
          }}
        />
        <CapacityChoice
          label="PQC parameter set"
          selectedId={variant}
          items={PQC_VARIANTS[family]}
          onSelect={setVariant}
          hideDefaultOption
        />
        {number('Storage overhead (%)', overhead, setOverhead, 0, 100)}
        {number('Certificate template allowance (B)', template, setTemplate)}
        {number('Public-key wrapper allowance (B)', wrapper, setWrapper)}
      </div>
      <div className="flex flex-wrap gap-4 my-3 text-sm">
        <label>
          <input
            type="checkbox"
            checked={certificate}
            onChange={(e) => setCertificate(e.target.checked)}
          />{' '}
          Store certificate on HSM
        </label>
        <label>
          <input type="checkbox" checked={seed} onChange={(e) => setSeed(e.target.checked)} /> Also
          store seed alongside expanded key
        </label>
      </div>
      <p className="text-sm">
        Modelled object:{' '}
        {result.effectivePerKeyBytes.toLocaleString(undefined, { maximumFractionDigits: 2 })} B
        including overhead. Estimated objects fitting in this byte budget:{' '}
        {result.numKeys.toLocaleString()}.
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        RSA private-key encoding is estimated; PQC uses expanded key material. Seed-only storage is
        outside this example. A KEM key cannot sign: any included ML-KEM certificate uses a
        separately assumed ML-DSA issuer. The wrapper and template allowances are editable
        estimates, not measured encodings. Storage settings are separate from the throughput report
        export.
      </p>
      <Button className="mt-3" onClick={exportCsv}>
        Export storage assumptions (CSV)
      </Button>
    </details>
  )
}
