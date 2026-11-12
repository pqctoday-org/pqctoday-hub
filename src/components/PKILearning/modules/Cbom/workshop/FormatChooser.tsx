// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { FileText, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SAMPLE_INVENTORY } from '@/data/cryptoEstate'

/**
 * Format Chooser — render a real estate asset as a CycloneDX 1.7 crypto-asset
 * vs SPDX, side by side, to show why CycloneDX is the practical CBOM today:
 * SPDX 3.0.1 has no dedicated cryptography object model, so the algorithm /
 * key / quantum fields have nowhere to go. Plus a governance feature matrix.
 */

const SAMPLES = SAMPLE_INVENTORY.filter((a) => a.spki).slice(0, 4)

// Only facts explicitly named by these fictional inventory records are projected.
// A generic RSA key does not identify PSS, PKCS#1 v1.5 or its certificate's signature.
function cycloneDX(a: (typeof SAMPLE_INVENTORY)[number]) {
  const algorithm =
    a.registryKey === 'ECDSA P-256'
      ? {
          algorithmFamily: 'ECDSA',
          primitive: 'signature',
          ellipticCurve: 'nist/P-256',
          nistQuantumSecurityLevel: 0,
        }
      : a.registryKey === 'RSA-2048' || a.registryKey === 'RSA-4096'
        ? {
            // CycloneDX 1.7 has scheme-specific RSA families, not generic RSA.
            // Keep the observed name/size without choosing an unsupported scheme.
            primitive: 'unknown',
            nistQuantumSecurityLevel: 0,
            parameterSetIdentifier: a.registryKey.slice(4),
          }
        : undefined
  const algorithmRef = `${a.id}-algorithm`
  const keyRef = `${a.id}-public-key`
  const isCertificate = a.class === 'certificates'
  const properties = [
    { name: 'observedAlgorithmLabel', value: a.currentAlgorithm },
    { name: 'keyManagement', value: a.management },
    { name: 'owner', value: a.owner },
  ]
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.7',
    version: 1,
    components: [
      {
        'bom-ref': a.id,
        name: a.name,
        type: isCertificate ? 'cryptographic-asset' : 'application',
        ...(isCertificate
          ? {
              cryptoProperties: {
                assetType: 'certificate',
                certificateProperties: {
                  relatedCryptographicAssets: [{ type: 'publicKey', ref: keyRef }],
                },
              },
            }
          : {}),
        properties,
      },
      {
        'bom-ref': keyRef,
        name: `${a.name} — public key`,
        type: 'cryptographic-asset',
        cryptoProperties: {
          assetType: 'related-crypto-material',
          relatedCryptoMaterialProperties: {
            type: 'public-key',
            ...(algorithm && 'parameterSetIdentifier' in algorithm
              ? { size: Number(algorithm.parameterSetIdentifier) }
              : {}),
            ...(algorithm
              ? { relatedCryptographicAssets: [{ type: 'algorithm', ref: algorithmRef }] }
              : {}),
          },
        },
        // The source contains a truncated fictional SPKI fingerprint, not a full hash value.
        properties: [{ name: 'spkiFingerprint', value: a.spki }],
      },
      ...(algorithm
        ? [
            {
              'bom-ref': algorithmRef,
              name: a.registryKey,
              type: 'cryptographic-asset',
              cryptoProperties: { assetType: 'algorithm', algorithmProperties: algorithm },
            },
          ]
        : []),
    ],
    dependencies: isCertificate ? [] : [{ ref: a.id, dependsOn: [keyRef] }],
  }
}

function spdx(a: (typeof SAMPLE_INVENTORY)[number]) {
  return {
    SPDXID: `SPDXRef-${a.id}`,
    name: a.name,
    // SPDX 3.0.1 has no cryptographic object model — the algorithm, key,
    // fingerprint and quantum status have no home; at best a free-text comment.
    comment: `crypto (unstructured): ${a.currentAlgorithm}`,
    primaryPackagePurpose: 'OTHER',
  }
}

const MATRIX: { feature: string; cdx: boolean; spdx: boolean }[] = [
  { feature: 'Dedicated cryptographic object model', cdx: true, spdx: false },
  { feature: 'Algorithm + parameter set + quantum level', cdx: true, spdx: false },
  { feature: 'Certificate / key / protocol asset types', cdx: true, spdx: false },
  { feature: 'Standardized (ECMA-424 / ISO 5962)', cdx: true, spdx: true },
  { feature: 'Native vulnerability / VEX linkage', cdx: true, spdx: false },
  { feature: 'License-compliance depth', cdx: false, spdx: true },
]

export function FormatChooser() {
  const [pick, setPick] = useState(SAMPLES[0].id)
  const asset = SAMPLES.find((a) => a.id === pick) ?? SAMPLES[0]

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="mb-1 flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">CycloneDX vs SPDX for a CBOM</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Render a real asset in both formats. SPDX 3.0.1 has no cryptography model — the crypto
          fields have nowhere to go.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This CycloneDX 1.7 sample separates the inventory asset, its public key and the named
          algorithm. RSA key size and the named EC curve come from the fictional record; certificate
          signature scheme and OIDs are not supplied. The truncated SPKI fingerprint is retained as
          a sample property. In your production tools, inspect parsed identifiers, complete
          fingerprints and the links between certificate, key and signature algorithm.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SAMPLES.map((a) => (
            <Button
              key={a.id}
              variant="outline"
              size="sm"
              onClick={() => setPick(a.id)}
              className={pick === a.id ? 'border-primary bg-primary/15 text-primary' : ''}
            >
              {a.name.split(' ')[0]}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <div className="glass-panel p-3">
          <div className="mb-2 text-xs font-semibold text-status-success">
            CycloneDX 1.7 ✓ expresses the crypto
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-snug text-foreground/90">
            {JSON.stringify(cycloneDX(asset), null, 2)}
          </pre>
        </div>
        <div className="glass-panel p-3">
          <div className="mb-2 text-xs font-semibold text-status-error">
            SPDX 3.0.1 ✗ no crypto model
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-snug text-foreground/90">
            {JSON.stringify(spdx(asset), null, 2)}
          </pre>
        </div>
      </div>

      <div className="glass-panel p-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">Feature matrix</h4>
        <div className="space-y-1">
          {MATRIX.map((m) => (
            <div key={m.feature} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{m.feature}</span>
              <span className="flex items-center gap-4">
                <span className="flex w-16 items-center justify-end gap-1 text-muted-foreground">
                  CDX{' '}
                  {m.cdx ? (
                    <Check size={12} className="text-status-success" />
                  ) : (
                    <X size={12} className="text-status-error" />
                  )}
                </span>
                <span className="flex w-16 items-center justify-end gap-1 text-muted-foreground">
                  SPDX{' '}
                  {m.spdx ? (
                    <Check size={12} className="text-status-success" />
                  ) : (
                    <X size={12} className="text-status-error" />
                  )}
                </span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          <strong className="text-primary">Verdict:</strong> for a CBOM today, CycloneDX. The PKIC
          CBOM-Profiles WG is building format-neutral profiles that map onto both.
        </p>
      </div>
    </div>
  )
}
