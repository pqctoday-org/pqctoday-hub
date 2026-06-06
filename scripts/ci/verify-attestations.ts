#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * verify-attestations.ts — CI-side trust-engine signature verification.
 *
 * Verifies every trust-relevant artifact declared in `TRUST_ARTIFACTS`
 * against the committed maintainer ML-DSA-65 public key at
 * `public/data/attestation/maintainer-public.key`.
 *
 * This file is the *public* verifier — tracked in the public repo so the
 * CI workflow can run it without depending on gitignored `scripts/attestation/*`
 * scripts. The private signer (`scripts/attestation/sign-all.ts`) keeps the
 * key handling on the maintainer's machine; signatures land here as
 * committed `.sig` files, and CI's only job is to confirm they verify.
 *
 * Exit codes:
 *   0 — all required signatures verify
 *   1 — at least one signature failed (tampered, wrong key, broken sig)
 *   2 — missing required artifact, missing required signature, or no public key found
 */
import crypto from 'node:crypto'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'

// ── Trust artifact registry ────────────────────────────────────────────────
// Mirrors the private `scripts/attestation/artifacts.ts` list. Kept in sync
// manually — both files iterate this set, so adding a new attested artifact
// requires editing both. (Future cleanup: extract to a single shared module.)

interface TrustArtifact {
  path: string
  required: boolean
  label: string
}

const TRUST_ARTIFACTS: TrustArtifact[] = [
  { path: 'public/data/revisions.jsonl', required: true, label: 'revisions log' },
  { path: 'public/data/rag-corpus.json', required: true, label: 'rag corpus' },
  { path: 'public/data/pqctoday-oscal.json', required: true, label: 'OSCAL combined' },
  {
    path: 'public/data/pqctoday-oscal-governance.json',
    required: true,
    label: 'OSCAL governance subset',
  },
  { path: 'public/data/pqctoday-oscal-full.json', required: true, label: 'OSCAL full inventory' },
  {
    path: 'public/data/pqctoday-oscal-assessment-plan.json',
    required: true,
    label: 'OSCAL assessment plan',
  },
  { path: 'public/data/pqctoday-cbom.json', required: true, label: 'CBOM' },
  { path: 'public/data/community-signals.json', required: false, label: 'community signals' },
]

const REPO_ROOT = path.resolve(process.cwd())
const ATTESTATION_DIR = path.join(REPO_ROOT, 'public/data/attestation')
const DEFAULT_PUBKEY_PATH = path.join(ATTESTATION_DIR, 'maintainer-public.key')

function repoPath(rel: string): string {
  return path.join(REPO_ROOT, rel)
}

function sigPath(rel: string): string {
  return path.join(REPO_ROOT, rel + '.sig')
}

// ── Verify-side primitives (mirror of `scripts/attestation/keys.ts`) ────────

const ATTESTATION_ALGORITHM = 'ML-DSA-65' as const
type AttestationAlgorithm = typeof ATTESTATION_ALGORITHM

interface PublicKeyFile {
  algorithm: AttestationAlgorithm
  kid: string
  created: string
  publicKey_b64: string
}

interface SignatureFile {
  algorithm: AttestationAlgorithm
  kid: string
  signed_at: string
  file_sha256: string
  signature_b64: string
}

type KeyResolver = (sig: SignatureFile) => PublicKeyFile | null

type VerifyReason = 'kid-mismatch' | 'algorithm-mismatch' | 'sha256-mismatch' | 'signature-invalid'

type VerifyResult = { ok: true } | { ok: false; reason: VerifyReason }

function sha256Hex(bytes: Uint8Array): string {
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

function b64decode(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, 'base64'))
}

function loadPublicKeyByKid(kid: string, attestationDir: string): PublicKeyFile | null {
  if (!existsSync(attestationDir)) return null
  const files = readdirSync(attestationDir).filter((f) => f.endsWith('.key') || f.endsWith('.json'))
  for (const f of files) {
    if (f.includes('private') || f.includes('secret')) continue
    try {
      const obj = JSON.parse(readFileSync(path.join(attestationDir, f), 'utf-8')) as PublicKeyFile
      if (obj.kid === kid && obj.publicKey_b64 && obj.algorithm) return obj
    } catch {
      // skip unparseable files
    }
  }
  return null
}

function verifyFile(filePath: string, publicKey: PublicKeyFile, sig: SignatureFile): VerifyResult {
  if (sig.algorithm !== ATTESTATION_ALGORITHM) return { ok: false, reason: 'algorithm-mismatch' }
  if (sig.algorithm !== publicKey.algorithm) return { ok: false, reason: 'algorithm-mismatch' }
  if (sig.kid !== publicKey.kid) return { ok: false, reason: 'kid-mismatch' }
  const buf = readFileSync(filePath)
  const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  const onDiskHash = sha256Hex(bytes)
  if (onDiskHash !== sig.file_sha256) return { ok: false, reason: 'sha256-mismatch' }
  const valid = ml_dsa65.verify(
    b64decode(sig.signature_b64),
    bytes,
    b64decode(publicKey.publicKey_b64)
  )
  return valid ? { ok: true } : { ok: false, reason: 'signature-invalid' }
}

// ── verifyAllArtifacts + main ───────────────────────────────────────────────

type Outcome =
  | { artifact: TrustArtifact; status: 'verified' }
  | { artifact: TrustArtifact; status: 'skipped-missing-optional' }
  | {
      artifact: TrustArtifact
      status: 'missing-required-artifact' | 'missing-required-signature'
    }
  | { artifact: TrustArtifact; status: 'failed'; reason: VerifyReason }

function buildKeyResolver(): KeyResolver {
  const pubIdx = process.argv.indexOf('--public-key')
  if (pubIdx > -1 && process.argv[pubIdx + 1]) {
    const overridePath = process.argv[pubIdx + 1]
    if (!existsSync(overridePath)) return () => null
    const key = JSON.parse(readFileSync(overridePath, 'utf-8')) as PublicKeyFile
    return () => key
  }
  return (sig) => {
    const byKid = loadPublicKeyByKid(sig.kid, ATTESTATION_DIR)
    if (byKid) return byKid
    if (existsSync(DEFAULT_PUBKEY_PATH)) {
      return JSON.parse(readFileSync(DEFAULT_PUBKEY_PATH, 'utf-8')) as PublicKeyFile
    }
    return null
  }
}

function verifyAllArtifacts(resolveKey: KeyResolver): Outcome[] {
  const outcomes: Outcome[] = []
  for (const a of TRUST_ARTIFACTS) {
    const abs = repoPath(a.path)
    const sigAbs = sigPath(a.path)
    if (!existsSync(abs)) {
      outcomes.push({
        artifact: a,
        status: a.required ? 'missing-required-artifact' : 'skipped-missing-optional',
      })
      continue
    }
    if (!existsSync(sigAbs)) {
      outcomes.push({
        artifact: a,
        status: a.required ? 'missing-required-signature' : 'skipped-missing-optional',
      })
      continue
    }
    const sig = JSON.parse(readFileSync(sigAbs, 'utf-8')) as SignatureFile
    const pub = resolveKey(sig)
    if (!pub) {
      outcomes.push({ artifact: a, status: 'failed', reason: 'kid-mismatch' })
      continue
    }
    const r = verifyFile(abs, pub, sig)
    if (r.ok) outcomes.push({ artifact: a, status: 'verified' })
    else outcomes.push({ artifact: a, status: 'failed', reason: r.reason })
  }
  return outcomes
}

function main(): number {
  const resolveKey = buildKeyResolver()
  const outcomes = verifyAllArtifacts(resolveKey)
  let exit = 0
  for (const o of outcomes) {
    const rel = path.relative(REPO_ROOT, repoPath(o.artifact.path))
    if (o.status === 'verified') {
      console.log(`✓ verified  ${o.artifact.label.padEnd(28)} ${rel}`)
    } else if (o.status === 'skipped-missing-optional') {
      console.log(`· skipped   ${o.artifact.label.padEnd(28)} (optional, not present)`)
    } else if (o.status === 'missing-required-artifact') {
      console.error(`✗ MISSING   ${o.artifact.label.padEnd(28)} required artifact: ${rel}`)
      exit = exit || 2
    } else if (o.status === 'missing-required-signature') {
      console.error(`✗ MISSING   ${o.artifact.label.padEnd(28)} required signature: ${rel}.sig`)
      exit = exit || 2
    } else {
      console.error(`✗ FAILED    ${o.artifact.label.padEnd(28)} ${rel} — reason: ${o.reason}`)
      exit = 1
    }
  }
  return exit
}

process.exit(main())
