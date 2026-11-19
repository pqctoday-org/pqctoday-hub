// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { Button } from '@/components/ui/button'

const SAMPLE_MODEL = '{"model":"sample-classifier","weights":[0.25,-0.10,0.78]}'
const encoder = new TextEncoder()
const digest = (artifact: string) => bytesToHex(sha256(encoder.encode(artifact)))

interface SignedManifest {
  document: Uint8Array
  digest: string
  signature: Uint8Array
  publisherKey: Uint8Array
}

export function ModelManifestCheck() {
  const id = useId()
  const [received, setReceived] = useState(SAMPLE_MODEL)
  const [manifest, setManifest] = useState<SignedManifest | null>(null)
  const [result, setResult] = useState<'match' | 'digest-mismatch' | 'invalid-signature' | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  const signSample = () => {
    setManifest(null)
    setResult(null)
    setError(null)
    try {
      const originalDigest = digest(SAMPLE_MODEL)
      const document = encoder.encode(
        JSON.stringify({ file: 'sample-classifier.json', sha256: originalDigest })
      )
      const { publicKey, secretKey } = ml_dsa65.keygen()
      const signature = ml_dsa65.sign(document, secretKey)
      setManifest({ document, digest: originalDigest, signature, publisherKey: publicKey })
    } catch {
      setError('The browser could not sign the sample manifest. Try signing it again.')
    }
  }

  const verifyReceived = () => {
    if (!manifest) return
    setResult(null)
    setError(null)
    try {
      const valid = ml_dsa65.verify(manifest.signature, manifest.document, manifest.publisherKey)
      setResult(
        !valid
          ? 'invalid-signature'
          : digest(received) === manifest.digest
            ? 'match'
            : 'digest-mismatch'
      )
    } catch {
      setError('The browser could not verify the manifest. Sign the sample and try again.')
    }
  }

  const setArtifact = (artifact: string) => {
    setReceived(artifact)
    setResult(null)
    setError(null)
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="glass-panel p-4 space-y-3">
      <h4 id={`${id}-heading`} className="font-bold text-foreground">
        Verify a signed model manifest
      </h4>
      <p className="text-sm text-muted-foreground">
        Sign a manifest that records the SHA-256 digest of the original fictional model. The
        recipient verifies the manifest’s ML-DSA-65 signature with the sample publisher key, then
        compares the digest of the received bytes with the signed digest.
      </p>
      <Button variant="outline" onClick={signSample}>
        Sign the sample manifest
      </Button>
      {manifest && (
        <dl className="text-xs space-y-1">
          <dt className="font-medium">SHA-256 in the signed manifest</dt>
          <dd className="font-mono break-all">{manifest.digest}</dd>
          <dt className="font-medium">ML-DSA-65 signature</dt>
          <dd>{manifest.signature.length.toLocaleString()} bytes</dd>
        </dl>
      )}
      <div className="space-y-1">
        <label htmlFor={`${id}-received`} className="text-sm font-medium">
          Received model artifact
        </label>
        <textarea
          id={`${id}-received`}
          rows={3}
          className="w-full rounded-md border border-input bg-background p-2 font-mono text-sm"
          value={received}
          onChange={(event) => setArtifact(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={verifyReceived} disabled={!manifest}>
          Verify received artifact
        </Button>
        <Button variant="outline" onClick={() => setArtifact(SAMPLE_MODEL)}>
          Restore sample artifact
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-status-error">
          {error}
        </p>
      )}
      <p role="status" aria-label="Model verification result" className="text-sm">
        {!manifest
          ? 'Sign the sample manifest to begin.'
          : result === 'match'
            ? 'Verified manifest signature and matching artifact digest.'
            : result === 'digest-mismatch'
              ? 'Artifact rejected. The signature verifies, but the received digest differs.'
              : result === 'invalid-signature'
                ? 'Artifact rejected. The manifest signature failed verification.'
                : 'Ready to verify the received artifact.'}
      </p>
      <p className="text-xs text-muted-foreground">
        This check covers the sample’s signed bytes. In a deployment, establish the publisher key
        through trusted release policy and assess model behavior separately.{' '}
        <a
          href="https://csrc.nist.gov/pubs/fips/204/final"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          FIPS 204
        </a>
      </p>
    </section>
  )
}
