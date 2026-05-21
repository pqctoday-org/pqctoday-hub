// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { TreeKEMVisualizer } from './TreeKEMVisualizer'
import { ProviderArchitecture } from './ProviderArchitecture'
import { MLSCryptoOperations } from './MLSCryptoOperations'
import { WhyThisMatters } from '@/components/ui/WhyThisMatters'

/**
 * Standalone playground entry-point for the MLS Group Messaging tool.
 *
 * Includes:
 *   1. Live crypto primitives (ML-DSA-65, ML-KEM-768, AES-128-GCM) via noble/post-quantum
 *   2. TreeKEM ratchet-tree visualizer (RFC 9420 direct-path math)
 *   3. Provider architecture — how openmls_pqctoday_crypto wires PKCS#11 to OpenMLS
 */
export const MLSGroupMessagingPlayground: React.FC = () => (
  <div className="max-w-7xl mx-auto space-y-6">
    <MLSCryptoOperations />
    <WhyThisMatters
      title="TreeKEM: From Double-Ratchet to Group Post-Compromise Security"
      variant="info"
    >
      <p>
        Signal&apos;s <strong>Double Ratchet</strong> provides per-message forward secrecy and
        post-compromise security (PCS) for <em>two</em> parties: after a key compromise, the next
        message from the honest party re-seeds the ratchet and the attacker loses access.{' '}
        <strong>TreeKEM</strong> (RFC 9420, MLS) extends this to <em>groups</em> using a binary
        Merkle tree of Diffie-Hellman key pairs.
      </p>
      <p>
        On a <strong>Commit</strong> operation, the committer generates a fresh leaf key pair, then
        re-encrypts path secrets up to the root — updating every ancestor node on the direct path.
        Only group members who are co-path children receive the new secrets. Members who were
        compromised before the Commit lose access to all future epochs: this is group PCS.
      </p>
      <p>
        In a PQC MLS deployment, each leaf key pair uses{' '}
        <strong>ML-KEM-768 for encapsulation</strong> (path secrets are encrypted to the next
        node&apos;s public KEM key) and <strong>ML-DSA-65 for signing</strong> leaf credential
        bindings — making both the secrecy and authentication paths quantum-resistant.
      </p>
    </WhyThisMatters>
    <TreeKEMVisualizer />
    <ProviderArchitecture />
  </div>
)
