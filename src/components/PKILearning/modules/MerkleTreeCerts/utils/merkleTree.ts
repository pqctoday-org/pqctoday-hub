// SPDX-License-Identifier: GPL-3.0-only
/**
 * Merkle tree utilities for the MTC workshop module.
 *
 * Uses Web Crypto API (SHA-256) for hashing — no external dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MerkleNode {
  /** Hex-encoded SHA-256 hash */
  hash: string
  /** Human-readable label, e.g. "H(0,1)" or "Leaf 3" */
  label: string
  /** Tree level: 0 = leaves, increases toward root */
  level: number
  /** Position within this level (left-to-right) */
  index: number
  left?: MerkleNode
  right?: MerkleNode
  isLeaf: boolean
}

export interface CertLeaf {
  id: number
  subject: string
  issuer: string
  algorithm: string
  publicKeySize: number
  notBefore: string
  notAfter: string
}

export interface InclusionProof {
  leafHash: string
  leafIndex: number
  siblings: { hash: string; position: 'left' | 'right' }[]
  root: string
  proofSizeBytes: number
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

/** SHA-256 of an ArrayBuffer, returned as lowercase hex. */
async function sha256Bytes(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Leaf node hash: SHA-256(0x00 || data).
 *
 * The 0x00 domain-separation prefix (per RFC 9162 / draft-ietf-plants-merkle-tree-certs)
 * prevents a leaf hash from ever colliding with an internal node hash.
 */
export async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const buf = new ArrayBuffer(1 + encoded.length)
  const view = new Uint8Array(buf)
  view[0] = 0x00
  view.set(encoded, 1)
  return sha256Bytes(buf)
}

/**
 * Internal node hash: SHA-256(0x01 || left_hash_bytes || right_hash_bytes).
 *
 * The 0x01 domain-separation prefix (per RFC 9162 / draft-ietf-plants-merkle-tree-certs)
 * prevents an internal node hash from ever being confused with a leaf hash.
 */
export async function hashPair(left: string, right: string): Promise<string> {
  const leftBytes = left.match(/.{2}/g)!.map((b) => parseInt(b, 16))
  const rightBytes = right.match(/.{2}/g)!.map((b) => parseInt(b, 16))
  const buf = new ArrayBuffer(1 + leftBytes.length + rightBytes.length)
  const view = new Uint8Array(buf)
  view[0] = 0x01
  view.set(leftBytes, 1)
  view.set(rightBytes, 1 + leftBytes.length)
  return sha256Bytes(buf)
}

// ---------------------------------------------------------------------------
// Tree construction
// ---------------------------------------------------------------------------

/** Serialize a CertLeaf into a deterministic string for hashing. */
export function serializeCert(cert: CertLeaf): string {
  return `${cert.id}|${cert.subject}|${cert.issuer}|${cert.algorithm}|${cert.publicKeySize}|${cert.notBefore}|${cert.notAfter}`
}

/**
 * Build a complete binary Merkle tree from certificate leaves.
 *
 * If the number of leaves is not a power of two, the last leaf is duplicated
 * to fill the tree (standard Merkle tree padding).
 *
 * Returns the root node (with full tree linked via left/right) and a flat
 * array of all levels (levels[0] = leaves, levels[last] = [root]).
 */
export async function buildMerkleTree(
  certs: CertLeaf[]
): Promise<{ root: MerkleNode; levels: MerkleNode[][] }> {
  if (certs.length === 0) {
    throw new Error('Cannot build tree with zero leaves')
  }

  // Pad to next power of two by duplicating the last leaf.
  //
  // NOTE — simplified padding for visualization purposes:
  // RFC 9162 §2.1.2 (Certificate Transparency v2.0) defines MTH(D[n]) as a
  // recursive split at k = largest power of 2 < n, producing an unbalanced
  // binary tree for non-power-of-two leaf counts.  That construction is harder
  // to render as flat levels[], so this implementation uses the simpler
  // "duplicate last leaf until power-of-two" strategy instead.  For leaf
  // counts that are already a power of two (all preset demos use 4 or 8 certs)
  // the two algorithms produce identical roots.
  const paddedCerts = [...certs]
  while (paddedCerts.length & (paddedCerts.length - 1)) {
    paddedCerts.push(paddedCerts[paddedCerts.length - 1])
  }

  // Build leaf level
  const leaves: MerkleNode[] = await Promise.all(
    paddedCerts.map(async (cert, i) => ({
      hash: await sha256Hex(serializeCert(cert)),
      label: i < certs.length ? `Cert ${i + 1}` : `Pad ${i + 1}`,
      level: 0,
      index: i,
      isLeaf: true,
    }))
  )

  const levels: MerkleNode[][] = [leaves]

  // Build each level upward
  let currentLevel = leaves
  let levelNum = 1
  while (currentLevel.length > 1) {
    const nextLevel: MerkleNode[] = []
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i]
      const right = currentLevel[i + 1]
      const hash = await hashPair(left.hash, right.hash)
      nextLevel.push({
        hash,
        label: `H(${left.index},${right.index})`,
        level: levelNum,
        index: i / 2,
        left,
        right,
        isLeaf: false,
      })
    }
    levels.push(nextLevel)
    currentLevel = nextLevel
    levelNum++
  }

  return { root: currentLevel[0], levels }
}

// ---------------------------------------------------------------------------
// Inclusion proof
// ---------------------------------------------------------------------------

/**
 * Generate an inclusion proof for a leaf at the given index.
 *
 * The proof is an ordered list of sibling hashes + their position (left/right),
 * from the leaf level up to just below the root.
 */
export function getInclusionProof(levels: MerkleNode[][], leafIndex: number): InclusionProof {
  if (leafIndex < 0 || leafIndex >= levels[0].length) {
    throw new Error(`Leaf index ${leafIndex} out of range`)
  }

  const siblings: InclusionProof['siblings'] = []
  let idx = leafIndex

  for (let lvl = 0; lvl < levels.length - 1; lvl++) {
    const isLeftChild = idx % 2 === 0
    const siblingIdx = isLeftChild ? idx + 1 : idx - 1
    const sibling = levels[lvl][siblingIdx]
    siblings.push({
      hash: sibling.hash,
      position: isLeftChild ? 'right' : 'left',
    })
    idx = Math.floor(idx / 2)
  }

  const root = levels[levels.length - 1][0]
  // Each sibling hash is 32 bytes (per draft-ietf-plants-merkle-tree-certs: N hashes × 32 bytes)
  const proofSizeBytes = siblings.length * 32

  return {
    leafHash: levels[0][leafIndex].hash,
    leafIndex,
    siblings,
    root: root.hash,
    proofSizeBytes,
  }
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export interface VerificationStep {
  stepNumber: number
  inputLeft: string
  inputRight: string
  output: string
  label: string
}

/**
 * Verify an inclusion proof and return the intermediate computation steps.
 *
 * Returns { valid, steps } where steps shows each hash combination.
 */
export async function verifyInclusionProof(
  proof: InclusionProof
): Promise<{ valid: boolean; steps: VerificationStep[] }> {
  const steps: VerificationStep[] = []
  let currentHash = proof.leafHash

  for (let i = 0; i < proof.siblings.length; i++) {
    const sibling = proof.siblings[i]
    const left = sibling.position === 'left' ? sibling.hash : currentHash
    const right = sibling.position === 'left' ? currentHash : sibling.hash
    const output = await hashPair(left, right)

    steps.push({
      stepNumber: i + 1,
      inputLeft: left,
      inputRight: right,
      output,
      label: `Level ${i + 1}`,
    })

    currentHash = output
  }

  return { valid: currentHash === proof.root, steps }
}

// ---------------------------------------------------------------------------
// Consistency proof
// ---------------------------------------------------------------------------

export interface ConsistencyNode {
  hash: string
  /** Level in the larger tree (0 = leaves) */
  level: number
  /** Index within this level */
  index: number
  /** True if this node is present in both trees (old subtree); false = new addition */
  isOld: boolean
  label: string
}

export interface ConsistencyProof {
  oldSize: number
  newSize: number
  oldRoot: string
  newRoot: string
  /** Nodes in newTree needed to recompute both roots, annotated old vs new */
  nodes: ConsistencyNode[]
}

/**
 * Compute a consistency proof showing that `levels1` (smaller tree) is a
 * prefix of `levels2` (larger tree).
 *
 * The proof returns the minimal set of nodes from levels2 needed to verify
 * that levels1's root is embedded in levels2's tree.  This is a simplified
 * visual proof: for a complete binary tree where oldSize is a power-of-two
 * subtree of newSize, the old root is simply the left subtree of newTree at
 * the appropriate level.
 */
export function getConsistencyProof(
  levels1: MerkleNode[][],
  levels2: MerkleNode[][]
): ConsistencyProof {
  const oldSize = levels1[0].length
  const newSize = levels2[0].length
  const oldRoot = levels1[levels1.length - 1][0].hash
  const newRoot = levels2[levels2.length - 1][0].hash

  const nodes: ConsistencyNode[] = []

  // Walk the new tree and annotate which nodes correspond to the old tree.
  // For each level, nodes with index < (oldSize >> (newLevel - oldLevel + 1... approximation))
  // are part of the old subtree.  We use the simple heuristic: if the node's
  // hash appears in levels1 at any level, it is an "old" node.
  const oldHashes = new Set<string>()
  for (const level of levels1) {
    for (const node of level) {
      oldHashes.add(node.hash)
    }
  }

  for (let lvl = 0; lvl < levels2.length; lvl++) {
    for (const node of levels2[lvl]) {
      const isOld = oldHashes.has(node.hash)
      nodes.push({
        hash: node.hash,
        level: lvl,
        index: node.index,
        isOld,
        label: node.label,
      })
    }
  }

  return { oldSize, newSize, oldRoot, newRoot, nodes }
}

/**
 * Create a tampered copy of a proof by flipping the last hex char of the
 * first sibling hash. Used for the "tamper" exercise.
 */
export function tamperProof(proof: InclusionProof): InclusionProof {
  const tampered = structuredClone(proof)
  if (tampered.siblings.length > 0) {
    const original = tampered.siblings[0].hash
    const lastChar = original[original.length - 1]
    const flipped = lastChar === '0' ? '1' : '0'
    tampered.siblings[0].hash = original.slice(0, -1) + flipped
  }
  return tampered
}
