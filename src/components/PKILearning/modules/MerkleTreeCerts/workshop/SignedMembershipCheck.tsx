// SPDX-License-Identifier: AGPL-3.0-only
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  exportSubjectProof,
  getInclusionProof,
  verifySubjectProof,
  type CertLeaf,
  type MerkleNode,
} from '../utils/merkleTree'

interface SignedMembershipCheckProps {
  certs: CertLeaf[]
  levels: MerkleNode[][]
  publishedRoot: string
  verifyCheckpoint: () => boolean
}

export function SignedMembershipCheck({
  certs,
  levels,
  publishedRoot,
  verifyCheckpoint,
}: SignedMembershipCheckProps) {
  const selectId = useId()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [changed, setChanged] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<{
    signatureValid: boolean
    pathValid: boolean
  } | null>(null)
  const [error, setError] = useState(false)

  const checkMembership = async () => {
    setChecking(true)
    setResult(null)
    setError(false)
    try {
      const proof = getInclusionProof(levels, selectedIndex)
      const envelope = exportSubjectProof(certs[selectedIndex], { ...proof, root: publishedRoot })
      if (changed) {
        const sibling = envelope.proof.siblings[0]
        sibling.hash = (sibling.hash[0] === '0' ? '1' : '0') + sibling.hash.slice(1)
      }
      const signatureValid = verifyCheckpoint()
      const { valid: pathValid } = await verifySubjectProof(envelope)
      setResult({ signatureValid, pathValid })
    } catch {
      setError(true)
    } finally {
      setChecking(false)
    }
  }

  return (
    <section
      aria-labelledby={`${selectId}-heading`}
      className="space-y-3 rounded-lg border border-border p-4"
    >
      <h4 id={`${selectId}-heading`} className="text-sm font-bold text-foreground">
        Verify membership against the signed checkpoint
      </h4>
      <p className="text-xs text-muted-foreground">
        The verifier trusts the sample CA key created in this exercise. It checks the checkpoint
        signature and recomputes the path from the selected certificate to the published root.
        Change a sibling hash to see which check rejects the proof.
      </p>
      <label htmlFor={selectId} className="block text-sm font-medium">
        Certificate to verify
      </label>
      {/* eslint-disable-next-line no-restricted-syntax -- Native <select> preserved for form semantics and Playwright selectOption tests */}
      <select
        id={selectId}
        value={selectedIndex}
        disabled={checking}
        className="w-full rounded-md border border-input bg-background p-2 text-sm"
        onChange={(event) => {
          setSelectedIndex(Number(event.target.value))
          setResult(null)
          setError(false)
        }}
      >
        {certs.map((cert, index) => (
          <option key={cert.id} value={index}>
            {cert.subject}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={changed}
          disabled={checking}
          onChange={(event) => {
            setChanged(event.target.checked)
            setResult(null)
            setError(false)
          }}
        />
        Change one sibling hash
      </label>
      <Button onClick={() => void checkMembership()} disabled={checking}>
        Verify certificate membership
      </Button>
      {error && <p role="alert">Verification could not finish. Retry with the live engine.</p>}
      <div role="status" aria-label="Checkpoint membership result" className="space-y-1 text-sm">
        {checking && <p>Checking the path and signature…</p>}
        {result && (
          <>
            <p>
              {result.signatureValid
                ? 'Checkpoint signature verified.'
                : 'Checkpoint signature failed.'}
            </p>
            <p>
              {result.pathValid
                ? 'Proof path matches the published root.'
                : 'Proof path differs from the published root.'}
            </p>
            <p className="font-medium">
              {result.signatureValid && result.pathValid
                ? 'Membership accepted.'
                : 'Membership rejected.'}
            </p>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        This local exercise checks sample log membership. Peer identity requires separate
        certificate and handshake checks.
      </p>
    </section>
  )
}
