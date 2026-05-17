// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { TreeKEMVisualizer } from './TreeKEMVisualizer'
import { ProviderArchitecture } from './ProviderArchitecture'
import { MLSCryptoOperations } from './MLSCryptoOperations'

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
    <TreeKEMVisualizer />
    <ProviderArchitecture />
  </div>
)
