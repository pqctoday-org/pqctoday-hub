// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { Shuffle, Shield, Cloud, Info, CheckCircle } from 'lucide-react'
import { HYBRID_COMBINER_MODES } from '../data/kmsConstants'
import { KMS_PROVIDERS, KMS_STATUS_LABELS } from '../data/kmsProviderData'
import { Button } from '@/components/ui/button'

type WrapMode = 'classical' | 'pqc' | 'hybrid'

const WRAP_MODE_LABELS: Record<WrapMode, { label: string; color: string }> = {
  classical: { label: 'Classical Only', color: 'text-destructive' },
  pqc: { label: 'PQC Only', color: 'text-success' },
  hybrid: { label: 'Hybrid', color: 'text-warning' },
}

/** Provider-specific API examples for key wrapping */
const PROVIDER_WRAP_EXAMPLES: Record<string, Record<WrapMode, string>> = {
  'aws-kms': {
    classical: `// AWS KMS — Classical RSA key wrapping
aws kms create-key \\
  --key-spec RSA_3072 \\
  --key-usage ENCRYPT_DECRYPT

aws kms encrypt \\
  --key-id alias/rsa-wrapping-key \\
  --plaintext fileb://dek.bin \\
  --encryption-algorithm RSAES_OAEP_SHA_256`,
    pqc: `// AWS KMS — PQC transit protection
// ML-KEM hybrid TLS protects API calls in transit
// DEK wrapping uses AES-256 CMK (quantum-safe symmetric)
aws kms generate-data-key \\
  --key-id alias/aes-256-cmk \\
  --key-spec AES_256
# ML-KEM hybrid TLS encrypts this API call end-to-end`,
    hybrid: `// AWS KMS — Hybrid approach
// Transit: ML-KEM hybrid TLS (automatic)
// At rest: AES-256 CMK wrapping
// Signing: ML-DSA for integrity
aws kms create-key \\
  --key-spec ML_DSA_65 \\
  --key-usage SIGN_VERIFY

aws kms generate-data-key \\
  --key-id alias/aes-256-cmk \\
  --key-spec AES_256
# Transit protected by ML-KEM hybrid TLS`,
  },
  'gcp-kms': {
    classical: `// Google Cloud KMS — Classical wrapping
gcloud kms keys create wrapping-key \\
  --keyring=my-ring \\
  --location=global \\
  --purpose=asymmetric-encrypt \\
  --default-algorithm=RSA_DECRYPT_OAEP_3072_SHA256`,
    pqc: `// Google Cloud KMS — PQC key wrapping
gcloud kms keys create pqc-wrapping-key \\
  --keyring=my-ring \\
  --location=global \\
  --purpose=asymmetric-encrypt \\
  --default-algorithm=ML_KEM_768

# ML-KEM encapsulate to establish shared secret
gcloud kms asymmetric-encrypt \\
  --key=pqc-wrapping-key \\
  --plaintext-file=dek.bin`,
    hybrid: `// Google Cloud KMS — X-Wing hybrid KEM
gcloud kms keys create xwing-key \\
  --keyring=my-ring \\
  --location=global \\
  --purpose=asymmetric-encrypt \\
  --default-algorithm=X_WING

# X-Wing = X25519 + ML-KEM-768 in one construction
gcloud kms asymmetric-encrypt \\
  --key=xwing-key \\
  --plaintext-file=dek.bin`,
  },
  'azure-kv': {
    classical: `// Azure Key Vault — Classical wrapping
az keyvault key create \\
  --vault-name my-vault \\
  --name wrapping-key \\
  --kty RSA \\
  --size 3072

az keyvault key wrap-key \\
  --vault-name my-vault \\
  --name wrapping-key \\
  --algorithm RSA-OAEP-256 \\
  --value <base64-dek>`,
    pqc: `// Azure Key Vault — PQC (planned)
// Native ML-KEM key types not yet in Key Vault API
// SymCrypt supports ML-KEM internally
// Workaround: use OCT-HSM 256-bit AES keys
az keyvault key create \\
  --vault-name my-vault \\
  --name aes-wrapping-key \\
  --kty oct-HSM \\
  --size 256
# AES-256 is quantum-resistant for symmetric wrapping`,
    hybrid: `// Azure Key Vault — Hybrid (planned)
// Microsoft targets CNSA 2.0 compliance by 2029
// Current approach: RSA + AES-256 dual wrapping
az keyvault key create \\
  --vault-name my-vault \\
  --name rsa-key --kty RSA --size 3072
az keyvault key create \\
  --vault-name my-vault \\
  --name aes-key --kty oct-HSM --size 256
# Wrap DEK with both keys; unwrap requires both`,
  },
}

// Cloud providers only for the provider comparison section
const CLOUD_PROVIDERS = KMS_PROVIDERS.filter((p) =>
  ['aws-kms', 'gcp-kms', 'azure-kv'].includes(p.id)
)

export const HybridKeyWrapping: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<string>(HYBRID_COMBINER_MODES[0].id)
  const [wrapMode, setWrapMode] = useState<WrapMode>('hybrid')
  const [selectedProvider, setSelectedProvider] = useState<string>('aws-kms')

  const activeHybrid = HYBRID_COMBINER_MODES.find((m) => m.id === selectedMode)
  const activeProvider = CLOUD_PROVIDERS.find((p) => p.id === selectedProvider)
  const providerStatus = activeProvider ? KMS_STATUS_LABELS[activeProvider.pqcStatus] : null

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Hybrid Key Wrapping Explorer</h3>
        <p className="text-sm text-muted-foreground">
          Explore hybrid combiner modes that derive a single wrapping key from both a classical and
          PQC shared secret. Toggle between Classical-only, PQC-only, and Hybrid to compare wire
          overhead and provider API calls.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex flex-wrap gap-2">
        {(['classical', 'pqc', 'hybrid'] as WrapMode[]).map((mode) => (
          <Button
            variant="ghost"
            key={mode}
            onClick={() => setWrapMode(mode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              wrapMode === mode
                ? mode === 'classical'
                  ? 'bg-destructive/20 text-destructive border border-destructive/50'
                  : mode === 'pqc'
                    ? 'bg-success/20 text-success border border-success/50'
                    : 'bg-warning/20 text-warning border border-warning/50'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
            }`}
          >
            {mode === 'hybrid' && <Shuffle size={14} />}
            {mode === 'classical' && <Shield size={14} />}
            {mode === 'pqc' && <CheckCircle size={14} />}
            {WRAP_MODE_LABELS[mode].label}
          </Button>
        ))}
      </div>

      {/* Mode-specific content */}
      {wrapMode === 'classical' && (
        <div className="glass-panel p-6 border-l-4 border-l-destructive">
          <h4 className="text-lg font-bold text-foreground mb-2">Classical-Only Wrapping</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Traditional RSA-OAEP or ECDH key wrapping. No quantum protection.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">256 B</div>
              <div className="text-[10px] text-muted-foreground">RSA-2048 ciphertext</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">1 step</div>
              <div className="text-[10px] text-muted-foreground">Direct encryption</div>
            </div>
            <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20 text-center">
              <div className="text-lg font-bold text-destructive">Vulnerable</div>
              <div className="text-[10px] text-muted-foreground">to quantum attack</div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border mt-4">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80">
                RSA-OAEP directly encrypts the DEK with the recipient&apos;s public key. Shor&apos;s
                algorithm on a quantum computer can factor the RSA modulus and recover the private
                key, compromising all wrapped DEKs.
              </p>
            </div>
          </div>
        </div>
      )}

      {wrapMode === 'pqc' && (
        <div className="glass-panel p-6 border-l-4 border-l-success">
          <h4 className="text-lg font-bold text-foreground mb-2">PQC-Only Wrapping</h4>
          <p className="text-sm text-muted-foreground mb-4">
            ML-KEM envelope encryption. Quantum-safe but no classical fallback.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">1,128 B</div>
              <div className="text-[10px] text-muted-foreground">ML-KEM-768 total</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">3 steps</div>
              <div className="text-[10px] text-muted-foreground">Encaps → KDF → AES-KW</div>
            </div>
            <div className="bg-success/5 rounded-lg p-3 border border-success/20 text-center">
              <div className="text-lg font-bold text-success">Quantum-Safe</div>
              <div className="text-[10px] text-muted-foreground">NIST Level 3</div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border mt-4">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80">
                PQC-only wrapping relies entirely on ML-KEM security assumptions (Module-LWE
                hardness). During the transition period, some organizations may prefer hybrid mode
                for defense-in-depth until PQC algorithms have more years of cryptanalysis.
              </p>
            </div>
          </div>
        </div>
      )}

      {wrapMode === 'hybrid' && (
        <>
          {/* Hybrid combiner selection */}
          <div className="glass-panel p-6 border-l-4 border-l-warning">
            <h4 className="text-lg font-bold text-foreground mb-2">Hybrid Combiner Modes</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Select a hybrid mode to see its components, combiner formula, and wire overhead.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {HYBRID_COMBINER_MODES.map((mode) => (
                <Button
                  variant="ghost"
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    selectedMode === mode.id
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-muted/50 border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Shuffle
                      size={14}
                      className={
                        selectedMode === mode.id ? 'text-primary' : 'text-muted-foreground'
                      }
                    />
                    <span className="text-sm font-bold text-foreground">{mode.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{mode.useCase}</p>
                </Button>
              ))}
            </div>

            {/* Selected mode detail */}
            {activeHybrid && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
                    <div className="text-xs font-bold text-destructive mb-2">
                      Classical Component
                    </div>
                    <p className="text-xs text-muted-foreground">{activeHybrid.classical}</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <div className="text-xs font-bold text-primary mb-2">PQC Component</div>
                    <p className="text-xs text-muted-foreground">{activeHybrid.pqc}</p>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-4 border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">Combiner Formula</div>
                  <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap break-all">
                    {activeHybrid.combiner}
                  </pre>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
                    <div className="text-lg font-bold text-foreground">
                      {activeHybrid.outputKeySize * 8}-bit
                    </div>
                    <div className="text-[10px] text-muted-foreground">Output Key Size</div>
                  </div>
                  <div className="bg-warning/5 rounded-lg p-3 border border-warning/20 text-center">
                    <div className="text-sm font-bold text-warning">
                      {activeHybrid.totalOverhead}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Total Wire Overhead</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
                    <div className="text-sm font-bold text-foreground truncate px-1">
                      {activeHybrid.useCase.split(' — ')[0]}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Use Case</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Provider API Comparison */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cloud size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Provider API Mapping</h4>
        </div>

        {/* Provider selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CLOUD_PROVIDERS.map((provider) => {
            const status = KMS_STATUS_LABELS[provider.pqcStatus]
            return (
              <Button
                variant="ghost"
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  selectedProvider === provider.id
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
                }`}
              >
                {provider.product}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${status.className}`}
                >
                  {status.label}
                </span>
              </Button>
            )
          })}
        </div>

        {/* Provider detail + API example */}
        {activeProvider && providerStatus && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">{activeProvider.product}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${providerStatus.className}`}
                >
                  {providerStatus.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {activeProvider.fipsLevel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {activeProvider.envelopeEncryptionModel}
              </p>
              <div className="flex flex-wrap gap-2 text-[10px]">
                {activeProvider.autoRotation && (
                  <span className="px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                    Auto-Rotation
                  </span>
                )}
                {activeProvider.hybridSupport && (
                  <span className="px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                    Hybrid Support
                  </span>
                )}
                {activeProvider.kmipSupport && (
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    KMIP
                  </span>
                )}
              </div>
            </div>

            {/* API code block for selected wrap mode */}
            <div>
              <div className="text-xs font-bold text-foreground mb-2">
                {WRAP_MODE_LABELS[wrapMode].label} API Example
              </div>
              <pre className="text-[10px] bg-background p-4 rounded border border-border overflow-x-auto font-mono whitespace-pre">
                {PROVIDER_WRAP_EXAMPLES[selectedProvider]?.[wrapMode] ??
                  '// API example not available for this combination'}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Comparison summary */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-3">Mode Comparison Summary</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Mode</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Wire Overhead
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  Quantum-Safe
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  Classical Fallback
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Recommendation
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-bold text-destructive">Classical Only</td>
                <td className="py-2 px-2 text-right text-foreground">256 B</td>
                <td className="py-2 px-2 text-center text-destructive">No</td>
                <td className="py-2 px-2 text-center text-success">Yes</td>
                <td className="py-2 px-2 text-muted-foreground">Legacy systems only</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-bold text-success">PQC Only</td>
                <td className="py-2 px-2 text-right text-foreground">1,128 B</td>
                <td className="py-2 px-2 text-center text-success">Yes</td>
                <td className="py-2 px-2 text-center text-destructive">No</td>
                <td className="py-2 px-2 text-muted-foreground">Post-transition</td>
              </tr>
              {HYBRID_COMBINER_MODES.map((mode) => (
                <tr key={mode.id} className="border-b border-border/50">
                  <td className="py-2 px-2 font-bold text-warning">{mode.name}</td>
                  <td className="py-2 px-2 text-right text-foreground">{mode.totalOverhead}</td>
                  <td className="py-2 px-2 text-center text-success">Yes</td>
                  <td className="py-2 px-2 text-center text-success">Yes</td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {mode.useCase.split(' — ')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
