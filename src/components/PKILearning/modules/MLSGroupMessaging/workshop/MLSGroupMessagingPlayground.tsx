// SPDX-License-Identifier: AGPL-3.0-only
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
 *   2. TreeKEM ratchet-tree visualizer (RFC 9420 direct-path math), with a note on when a
 *      Commit does and does not recover from a compromised member
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
        RFC 9420 describes Signal&apos;s <strong>Double Ratchet</strong> as the common solution for
        two parties, with forward secrecy and post-compromise security (PCS).{' '}
        <strong>TreeKEM</strong> (RFC 9420, MLS) extends the idea to <em>groups</em> using a
        left-balanced binary ratchet tree of HPKE key pairs.
      </p>
      <p>
        A <strong>Commit</strong> that carries a path generates a fresh leaf key pair and a chain of
        path secrets for the sender&apos;s filtered direct path, and encrypts each path secret to
        the resolution of the matching co-path node. Recovery from a compromised member (here, Bob)
        is conditional. Compare three cases, assuming the attacker copied Bob&apos;s leaf and tree
        keys at one moment:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Ordinary sends:</strong> an application message only steps a one-way hash ratchet.
          It adds no fresh randomness, so it does not heal anything.
        </li>
        <li>
          <strong>Another member&apos;s Commit:</strong> its new path secrets are encrypted to nodes
          whose private keys Bob, and so the attacker, still holds. An attacker who sees the Commit
          can follow the new epoch. A Commit that only adds members or injects a PSK may omit the
          path, and then no fresh secret enters the key schedule at all.
        </li>
        <li>
          <strong>Bob&apos;s fresh leaf key, committed:</strong> recovery begins when the group
          processes a Commit that replaces Bob&apos;s leaf with a key pair the attacker never saw:
          Bob&apos;s own Commit with a path, or another member&apos;s Commit that includes
          Bob&apos;s Update proposal. An Update proposal alone has no effect until it is committed.
        </li>
      </ul>
      <p>
        These guarantees model a one-time snapshot, not persistent control. An attacker who keeps
        control of Bob&apos;s device can keep reading new secrets, and an attacker who holds
        Bob&apos;s signature key can create LeafNodes and KeyPackages in Bob&apos;s name and, where
        the application allows external Commits, insert itself into the group. Old keys also have to
        be deleted for forward secrecy.
      </p>
      <p>
        In the draft pure post-quantum suite{' '}
        <strong>MLS_192_MLKEM768_AES256GCM_SHA384_MLDSA65</strong>{' '}
        (draft-ietf-mls-pq-ciphersuites-06), path secrets are HPKE-encrypted to{' '}
        <strong>ML-KEM-768</strong> public keys and signatures use <strong>ML-DSA-65</strong>, so
        both confidentiality and authentication use post-quantum algorithms. The draft&apos;s first
        eight suites keep a traditional signature and give post-quantum confidentiality only.
      </p>
    </WhyThisMatters>
    <TreeKEMVisualizer />
    <ProviderArchitecture />
  </div>
)
