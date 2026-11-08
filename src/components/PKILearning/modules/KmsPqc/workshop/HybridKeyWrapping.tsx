// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { Shuffle, Shield, Cloud, Info, CheckCircle } from 'lucide-react'
import { HYBRID_COMBINER_MODES } from '../data/kmsConstants'
import { KMS_PROVIDERS, KMS_STATUS_LABELS, getKmsPqcStatus } from '../data/kmsProviderData'
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
    classical: `// AWS KMS — Classical: RSA wrapping on import (BYOK)
// AWS KMS imports key material only under an RSA wrapping key
aws kms get-parameters-for-import \\
  --key-id alias/imported-key \\
  --wrapping-algorithm RSAES_OAEP_SHA_256 \\
  --wrapping-key-spec RSA_3072

// Wrap the AES-256 key outside AWS (for example in a PKCS#11 HSM) under the
// downloaded public key, then import it with the import token:
aws kms import-key-material \\
  --key-id alias/imported-key \\
  --import-token fileb://import-token.bin \\
  --encrypted-key-material fileb://wrapped-key.bin \\
  --expiration-model KEY_MATERIAL_DOES_NOT_EXPIRE`,
    pqc: `// AWS KMS — PQC: ML-KEM key establishment
aws kms create-key \\
  --key-spec ML_KEM_768 \\
  --key-usage ENCAPSULATE_DECAPSULATE

aws kms get-public-key --key-id alias/kem-key

// The third party encapsulates with its own library (AWS-LC, OpenSSL,
// Bouncy Castle): encapsulation key -> ciphertext + 32-byte shared secret.
aws kms decapsulate \\
  --key-id alias/kem-key \\
  --encapsulation-algorithm ML_KEM \\
  --shared-secret-ciphertext-blob fileb://ct.bin

// Decapsulate returns the 32-byte secret in plaintext to your application.
// In the application: wrapping_key = HKDF-SHA-256(secret, salt, info)
//                     wrapped_dek  = AES-256-KW(wrapping_key, DEK)`,
    hybrid: `// AWS KMS — Hybrid: two secrets combined in your application
// 1. ECDH with a KMS elliptic-curve key (key usage KEY_AGREEMENT) and the
//    partner's public key; the raw shared secret is returned to you
aws kms derive-shared-secret \\
  --key-id alias/ecdh-key \\
  --key-agreement-algorithm ECDH \\
  --public-key fileb://partner-public-key.der

// 2. ML-KEM: Decapsulate as in the PQC example above
// 3. In the application, outside the HSM, with an SP 800-56C style KDF:
//      wrapping_key = HKDF-SHA-256(mlkem_secret || ecdh_secret, info="hybrid-kek")
//      wrapped_dek  = AES-256-KW(wrapping_key, DEK)
// AWS KMS has no native hybrid key spec: the combiner is yours.`,
  },
  'gcp-kms': {
    classical: `// Google Cloud KMS — Classical: RSA import job
// (method RSA_OAEP_3072_SHA256_AES_256, the recommended RSA method; gcloud
// takes it lowercase and hyphenated)
gcloud kms import-jobs create my-import-job \\
  --location=global \\
  --keyring=my-ring \\
  --import-method=rsa-oaep-3072-sha256-aes-256 \\
  --protection-level=software

// The client wraps the key with RSAES-OAEP (SHA-256) and AES-KWP under the
// job's 3072-bit public key. The wrap is RSA, so it is not quantum-safe.`,
    pqc: `// Google Cloud KMS — ML-KEM key encapsulation (SOFTWARE level)
gcloud kms keys create pqc-kem-key \\
  --keyring=my-ring \\
  --location=global \\
  --purpose=key-encapsulation \\
  --default-algorithm=ml-kem-768

# A KEM does not encrypt the DEK directly. Encapsulate on the client with the
# public key (e.g. Go crypto/mlkem) to get a shared secret and a ciphertext,
# derive a wrapping key from the secret, and wrap the DEK with AES-KW.
# Cloud KMS recovers the shared secret from the ciphertext:
gcloud kms decapsulate --version=1 --key=pqc-kem-key \\
  --keyring=my-ring --location=global \\
  --ciphertext-file=ct.bin --shared-secret-file=ss.bin

# Quantum-safe key IMPORT (Preview, SOFTWARE level) uses HPKE instead
# (method HPKE_KEM_ML_KEM_768_HKDF_SHA256_AES_256_GCM, lowercase and hyphenated):
gcloud kms import-jobs create my-import-job \\
  --location=global --keyring=my-ring \\
  --import-method=hpke-kem-ml-kem-768-hkdf-sha256-aes-256-gcm \\
  --protection-level=software
# The client runs HPKE.Seal() to the job's public key and uploads enc || ciphertext.`,
    hybrid: `// Google Cloud KMS — X-Wing hybrid KEM (SOFTWARE level)
gcloud kms keys create xwing-key \\
  --keyring=my-ring \\
  --location=global \\
  --purpose=key-encapsulation \\
  --default-algorithm=kem-xwing

# X-Wing = X25519 + ML-KEM-768 in one KEM. Same flow as ML-KEM:
# encapsulate on the client, decapsulate in Cloud KMS.
gcloud kms decapsulate --version=1 --key=xwing-key \\
  --keyring=my-ring --location=global \\
  --ciphertext-file=ct.bin --shared-secret-file=ss.bin

# Quantum-safe key IMPORT with X-Wing (Preview):
gcloud kms import-jobs create my-import-job \\
  --location=global --keyring=my-ring \\
  --import-method=hpke-kem-xwing-hkdf-sha256-aes-256-gcm \\
  --protection-level=software`,
  },
  'azure-kv': {
    classical: `// Azure Key Vault — Classical: BYOK with an RSA key exchange key
az keyvault key create \\
  --vault-name my-vault \\
  --name KEKforBYOK \\
  --kty RSA-HSM \\
  --size 3072 \\
  --ops import

// Your HSM vendor's BYOK tool wraps the target key under the KEK's public key
// with CKM_RSA_AES_KEY_WRAP (RSA-OAEP SHA-1 + AES key wrap with padding) and
// writes a .byok transfer blob. Then import it:
az keyvault key import \\
  --vault-name my-vault \\
  --name imported-key \\
  --byok-file KeyTransferPackage-imported-key.byok

// Wrapping a DEK with a vault key is the WrapKey/UnwrapKey operation, called
// through the REST API or an SDK (this explorer shows no CLI command for it).`,
    pqc: `// Azure Key Vault — PQC (planned)
// Native ML-KEM key types are not yet in the Key Vault API.
// SymCrypt supports ML-KEM internally.
// Symmetric AES-256 keys are quantum-resistant for symmetric wrapping;
// oct-HSM keys are a Managed HSM key type, not a vault key type:
az keyvault key create \\
  --hsm-name my-managed-hsm \\
  --name aes-wrapping-key \\
  --kty oct-HSM \\
  --size 256`,
    hybrid: `// Azure Key Vault — no post-quantum/traditional hybrid mode
// Microsoft aims for early adoption of quantum-safe capabilities by 2029 and a
// complete transition of its services and products by 2033 (a Microsoft-wide
// goal; no Key Vault date is sourced here).
// Wrapping a key under an RSA key and again under an AES key is layering, not a
// hybrid key agreement that combines a classical and a post-quantum secret.`,
  },
}

/** What a reader should notice about where the secret or key ends up. */
const PROVIDER_WRAP_NOTES: Record<string, Partial<Record<WrapMode, string>>> = {
  'aws-kms': {
    classical:
      'The wrap is RSA, so it is not quantum-safe. Hybrid post-quantum TLS to the KMS endpoint protects the API call, not the wrap.',
    pqc: 'Where the secret sits: Decapsulate returns the 32-byte ML-KEM shared secret in plaintext to the calling application, outside the HSM. The HKDF and AES-KW steps are the application’s job. It cannot be turned into a KMS key.',
    hybrid:
      'Where the secret sits: both secrets, and the combined wrapping key, are in the application’s memory. AWS KMS has no hybrid key spec such as X-Wing, so the combiner runs outside the HSM.',
  },
  'gcp-kms': {
    classical: 'RSA-based import methods are not quantum-safe.',
    pqc: 'The HPKE import methods are the quantum-safe path in this table, in Preview and for software-protected keys only.',
  },
  'azure-kv': {
    classical:
      'The Azure pages describe RSA-based BYOK only; no post-quantum import option is described.',
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
  const providerStatus = activeProvider ? KMS_STATUS_LABELS[getKmsPqcStatus(activeProvider)] : null

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Hybrid Key Wrapping Explorer</h3>
        <p className="text-sm text-muted-foreground">
          Explore hybrid combiner modes that derive a single wrapping key from both a classical and
          PQC shared secret. Toggle between Classical-only, PQC-only, and Hybrid to inspect
          illustrated byte counts and provider API examples. This explorer compares constructions;
          it does not execute Cloud KMS calls.
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
                In this module's reading, PQC-only wrapping relies entirely on ML-KEM security
                assumptions (Module-LWE hardness). During the transition period, some organizations
                may prefer hybrid mode for defense-in-depth until PQC algorithms have more years of
                cryptanalysis.
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
              Select a hybrid mode to see its components, sample combiner formula, and listed
              component bytes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {HYBRID_COMBINER_MODES.map((mode) => (
                <Button
                  variant="ghost"
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`h-auto whitespace-normal text-left p-4 rounded-lg border transition-colors ${
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

                <div className="min-w-0 bg-background rounded-lg p-4 border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">Combiner Formula</div>
                  <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap break-words overflow-x-auto">
                    {activeHybrid.combiner}
                  </pre>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  This is the KMS-wrap combiner of this module, one of the choices SP 800-227
                  Section 4.6 allows. TLS&apos;s X25519MLKEM768 group (RFC 10024) concatenates the
                  same two secrets, ML-KEM first, and feeds them to the TLS 1.3 key schedule, so it
                  is a different construction.
                </p>

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
                    <div className="text-[10px] text-muted-foreground">
                      Listed Hybrid Component Bytes
                    </div>
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
            const status = KMS_STATUS_LABELS[getKmsPqcStatus(provider)]
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
              <p className="text-[10px] text-muted-foreground mb-2">
                Auto-rotation: {activeProvider.autoRotationNote}
              </p>
              {activeProvider.launchStageNote && (
                <p className="text-[10px] text-warning mb-2">{activeProvider.launchStageNote}</p>
              )}
              <div className="flex flex-wrap gap-2 text-[10px]">
                {activeProvider.autoRotation && (
                  <span className="px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                    Auto-Rotation (scoped, see note)
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
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground mb-2">
                {WRAP_MODE_LABELS[wrapMode].label} API Example
              </div>
              <pre className="text-[10px] bg-background p-4 rounded border border-border overflow-x-auto font-mono whitespace-pre max-w-full">
                {PROVIDER_WRAP_EXAMPLES[selectedProvider]?.[wrapMode] ??
                  '// API example not available for this combination'}
              </pre>
              {PROVIDER_WRAP_NOTES[selectedProvider]?.[wrapMode] && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  {PROVIDER_WRAP_NOTES[selectedProvider]?.[wrapMode]}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparison summary */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-3">Mode Comparison Summary</h4>
        <p className="text-xs text-muted-foreground mb-3">
          These authored byte counts use different component boundaries, not complete wrapping
          envelopes. The PQC-only count includes a 40-byte wrapped DEK; the listed hybrid counts
          exclude it. Other envelope and protocol fields are not included consistently, so do not
          rank these values as complete-message savings. The sample combiner illustration does not
          demonstrate TLS negotiation or named-group interoperability. In your own tools, compare
          the same complete envelope boundary and test the intended protocol profile.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Mode</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Illustrated Byte Count (Scope Varies)
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
                <td className="py-2 px-2 text-right text-foreground">
                  256 B<span className="block text-muted-foreground">RSA ciphertext only</span>
                </td>
                <td className="py-2 px-2 text-center text-destructive">No</td>
                <td className="py-2 px-2 text-center text-success">Yes</td>
                <td className="py-2 px-2 text-muted-foreground">Legacy systems only</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 px-2 font-bold text-success">PQC Only</td>
                <td className="py-2 px-2 text-right text-foreground">
                  1,128 B
                  <span className="block text-muted-foreground">
                    KEM ciphertext plus 40-byte wrapped DEK
                  </span>
                </td>
                <td className="py-2 px-2 text-center text-success">Yes</td>
                <td className="py-2 px-2 text-center text-destructive">No</td>
                <td className="py-2 px-2 text-muted-foreground">Post-transition</td>
              </tr>
              {HYBRID_COMBINER_MODES.map((mode) => (
                <tr key={mode.id} className="border-b border-border/50">
                  <td className="py-2 px-2 font-bold text-warning">{mode.name}</td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {mode.totalOverhead}
                    <span className="block text-muted-foreground">
                      Listed hybrid components only; excludes wrapped DEK
                    </span>
                  </td>
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
