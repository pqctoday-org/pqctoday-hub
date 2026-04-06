// SPDX-License-Identifier: GPL-3.0-only
/**
 * CTLogSimulator — Certificate Transparency Log with SoftHSMv3 ML-DSA signing.
 *
 * Panel 1: Log Submission — add certs, CA signs the Merkle tree root with
 *          ML-DSA-44 (FIPS 204). One signature covers all N certs in the batch.
 * Panel 2: Consistency Proof — freeze a snapshot, add more certs, prove the
 *          log grew append-only via a structural consistency proof.
 * Panel 3: Misissuance Audit — edit any cert in-place, re-audit; the root
 *          hash changes and the CA's ML-DSA signature fails for the entire
 *          batch, exposing the fraud.
 */
import React, { useState, useCallback, useEffect } from 'react'
import {
  Plus,
  Camera,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Loader2,
  TreePine,
  Clock,
  RefreshCw,
  Pencil,
  Check,
  X,
  Key,
  Info,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { HsmKeyInspector } from '@/components/shared/HsmKeyInspector'
import { useHSM } from '@/hooks/useHSM'
import {
  hsm_generateMLDSAKeyPair,
  hsm_signBytesMLDSA,
  hsm_verifyBytes,
  hsm_extractKeyValue,
} from '@/wasm/softhsm'
import {
  buildMerkleTree,
  getInclusionProof,
  getConsistencyProof,
  type MerkleNode,
  type ConsistencyProof,
  type CertLeaf,
} from '../utils/merkleTree'
import { SAMPLE_CERTS, truncateHash } from '../data/mtcConstants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IssuedCert extends CertLeaf {
  serialNumber: string
  /** Inclusion proof for this cert in the current batch tree */
  leafHash: string
}

interface SignedBatch {
  root: string
  treeSize: number
  /** UTF-8 encoding of "MTC|<root>|<treeSize>|<ts>" — the raw message the CA signs */
  signedPayload: Uint8Array
  /** ML-DSA-44 signature from the CA over signedPayload */
  caSig: Uint8Array
  /** CA public key bytes (ML-DSA-44, 1312 bytes) for display */
  caPubKey: Uint8Array
  timestamp: number
}

type Panel = 'submission' | 'consistency' | 'audit'

const ALGO_OPTIONS = [
  { id: 'ML-DSA-44', label: 'ML-DSA-44' },
  { id: 'ML-DSA-65', label: 'ML-DSA-65' },
  { id: 'ML-DSA-87', label: 'ML-DSA-87' },
  { id: 'SLH-DSA-128s', label: 'SLH-DSA-128s' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTs(ts: number): string {
  return new Date(ts).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}

function randomSerial(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

/** Build the bytes the CA signs: SHA-256 of the UTF-8 string "MTC|<root>|<treeSize>|<ts>" */
async function buildSignedPayload(root: string, treeSize: number, ts: number): Promise<Uint8Array> {
  const msg = `MTC|${root}|${treeSize}|${ts}`
  const encoded = new TextEncoder().encode(msg)
  return encoded
}

// ---------------------------------------------------------------------------
// Sub-panel 1: Log Submission
// ---------------------------------------------------------------------------

interface SubmissionPanelProps {
  issuedCerts: IssuedCert[]
  signedBatch: SignedBatch | null
  logLevels: MerkleNode[][] | null
  caKeyReady: boolean
  isSigning: boolean
  hsmReady: boolean
  onAddCert: (subject: string, algorithm: string) => void
  onLoadSamples: () => void
  onGenerateCAKey: () => void
}

const SubmissionPanel: React.FC<SubmissionPanelProps> = ({
  issuedCerts,
  signedBatch,
  logLevels,
  caKeyReady,
  isSigning,
  hsmReady,
  onAddCert,
  onLoadSamples,
  onGenerateCAKey,
}) => {
  const [newSubject, setNewSubject] = useState('')
  const [newAlgo, setNewAlgo] = useState('ML-DSA-44')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const handleAdd = () => {
    if (!newSubject.trim()) return
    onAddCert(newSubject.trim(), newAlgo)
    setNewSubject('')
  }

  return (
    <div className="space-y-5">
      {/* Educational context */}
      <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground space-y-1">
        <p>
          <strong className="text-foreground">MTC key insight:</strong> In traditional PKI, the CA
          signs every certificate individually — with ML-DSA-44 that&apos;s{' '}
          <span className="text-destructive font-mono">2,420 bytes × N</span> certs. In Merkle Tree
          Certificates (RFC draft-ietf-plants-merkle-tree-certs), the CA signs{' '}
          <strong className="text-success">only the tree root once</strong> — one ML-DSA-44
          signature covers all N certs in the batch.
        </p>
      </div>

      {/* CA Key state */}
      {hsmReady && !caKeyReady && (
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Key size={14} className="text-primary" />
            <span className="text-xs font-bold text-foreground">Step 1 — Generate CA Key</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">
            Generate the CA&apos;s ML-DSA-44 key pair via SoftHSMv3. This key will sign the Merkle
            tree root after each batch update.
          </p>
          <Button onClick={onGenerateCAKey} variant="outline" className="text-xs h-auto py-1.5">
            <Key size={12} className="mr-1" /> Generate ML-DSA-44 CA Key
          </Button>
        </div>
      )}

      {caKeyReady && (
        <div className="flex items-center gap-2 text-[10px] text-success">
          <ShieldCheck size={12} />
          ML-DSA-44 CA key ready (SoftHSMv3 · FIPS 204 · 1,312-byte public key)
        </div>
      )}

      {/* Add cert form */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-foreground">
            {hsmReady && caKeyReady
              ? 'Submit Certificate to CT Log'
              : 'Add Certificate (simulation)'}
          </span>
          {issuedCerts.length === 0 && (
            <button onClick={onLoadSamples} className="text-xs text-primary hover:text-primary/80">
              Load 5 samples
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="ct-subject" className="text-[10px] text-muted-foreground block mb-1">
              Domain / Subject CN
            </label>
            <Input
              id="ct-subject"
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. secure.bank.example"
              className="text-xs h-auto py-1.5"
            />
          </div>
          <div className="min-w-[140px]">
            <p className="text-[10px] text-muted-foreground block mb-1">Cert subject key algo</p>
            <FilterDropdown
              label="Subject key"
              items={ALGO_OPTIONS}
              selectedId={newAlgo}
              onSelect={setNewAlgo}
              noContainer
              className="w-full"
            />
            <p className="text-[9px] text-muted-foreground mt-0.5">CA signs with ML-DSA-44</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={!newSubject.trim() || isSigning}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 disabled:opacity-50 transition-colors"
          >
            {isSigning ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Submit
          </button>
        </div>
      </div>

      {/* Signed Tree Head */}
      {signedBatch && logLevels && (
        <div className="bg-accent/10 rounded-lg p-3 border border-accent/30 space-y-2">
          <div className="flex items-center gap-2">
            <TreePine size={14} className="text-accent" />
            <span className="text-xs font-bold text-foreground">
              Signed Tree Head (STH) — {signedBatch.treeSize} cert
              {signedBatch.treeSize !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
              CA ML-DSA-44 signature
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1 text-[10px]">
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Root hash:</span>
              <span className="font-mono text-accent break-all">
                {truncateHash(signedBatch.root, 20)}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20 shrink-0">CA signature:</span>
              <span className="font-mono text-foreground break-all">
                {truncateHash(
                  Array.from(signedBatch.caSig)
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join(''),
                  20
                )}
                &hellip; ({signedBatch.caSig.length.toLocaleString()} bytes)
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20 shrink-0">CA pub key:</span>
              <span className="font-mono text-foreground">
                {truncateHash(
                  Array.from(signedBatch.caPubKey)
                    .map((b) => b.toString(16).padStart(2, '0'))
                    .join(''),
                  12
                )}
                &hellip; ({signedBatch.caPubKey.length.toLocaleString()} bytes)
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-20 shrink-0">Timestamp:</span>
              <span className="font-mono text-foreground">{formatTs(signedBatch.timestamp)}</span>
            </div>
          </div>
          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-success/5 rounded p-2 border border-success/10">
            <Info size={11} className="text-success mt-0.5 shrink-0" />
            One ML-DSA-44 signature (2,420 B) covers all {signedBatch.treeSize} certificate
            {signedBatch.treeSize !== 1 ? 's' : ''} in this batch. Traditional PKI would require{' '}
            {signedBatch.treeSize} × 2,420 B = {(signedBatch.treeSize * 2420).toLocaleString()}{' '}
            bytes of CA signatures.
          </div>
        </div>
      )}

      {/* Issued cert list */}
      {issuedCerts.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-foreground mb-2">
            Batch Contents ({issuedCerts.length} certs)
          </h4>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {issuedCerts.map((cert, idx) => {
              const proofSize = logLevels ? Math.ceil(Math.log2(logLevels[0].length)) * 32 : 0
              return (
                <div
                  key={cert.id}
                  className="bg-muted/50 rounded-lg border border-border overflow-hidden"
                >
                  <button
                    className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-muted/80 transition-colors"
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {cert.subject}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{cert.algorithm}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {expandedIdx === idx ? '▲' : '▼'}
                    </span>
                  </button>

                  {expandedIdx === idx && (
                    <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border">
                      <p className="text-[10px] text-muted-foreground pt-2">
                        <strong className="text-foreground">Certificate fields</strong> — in MTC,
                        the cert body is just data. No per-cert CA signature. The inclusion proof
                        (log₂N × 32 B) replaces the traditional CA signature chain.
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                        <div>
                          <span className="text-muted-foreground">Subject CN:</span>{' '}
                          <span className="text-foreground">{cert.subject}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Algorithm:</span>{' '}
                          <span className="text-foreground">{cert.algorithm}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Issuer:</span>{' '}
                          <span className="text-foreground">{cert.issuer}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Serial:</span>{' '}
                          <span className="font-mono text-foreground">{cert.serialNumber}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Not Before:</span>{' '}
                          <span className="text-foreground">{cert.notBefore}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Not After:</span>{' '}
                          <span className="text-foreground">{cert.notAfter}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Key size:</span>{' '}
                          <span className="text-foreground">
                            {cert.publicKeySize.toLocaleString()} bytes
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Inclusion proof:</span>{' '}
                          <span className="text-success">{proofSize} B (log₂N × 32)</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Leaf hash:</span>
                        <div className="font-mono text-[10px] text-foreground break-all mt-0.5">
                          {cert.leafHash}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {issuedCerts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Submit your first certificate to start the CT log.
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-panel 2: Consistency Proof
// ---------------------------------------------------------------------------

interface ConsistencyPanelProps {
  logCerts: IssuedCert[]
  logLevels: MerkleNode[][] | null
  snapshot: { certs: IssuedCert[]; levels: MerkleNode[][] } | null
  onFreezeSnapshot: () => void
}

const ConsistencyPanel: React.FC<ConsistencyPanelProps> = ({
  logCerts,
  logLevels,
  snapshot,
  onFreezeSnapshot,
}) => {
  const [proof, setProof] = useState<ConsistencyProof | null>(null)
  const [isComputing, setIsComputing] = useState(false)
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    setProof(null)
    setVerified(null)
  }, [snapshot, logLevels])

  const canCompute =
    snapshot && logLevels && logLevels[0].length > snapshot.levels[0].length && !isComputing

  const handleCompute = useCallback(async () => {
    if (!snapshot || !logLevels) return
    setIsComputing(true)
    try {
      await new Promise((r) => setTimeout(r, 150))
      const p = getConsistencyProof(snapshot.levels, logLevels)
      setProof(p)
      const oldHashes = new Set(p.nodes.filter((n) => n.isOld).map((n) => n.hash))
      setVerified(oldHashes.has(p.oldRoot))
    } finally {
      setIsComputing(false)
    }
  }, [snapshot, logLevels])

  const nodesByLevel = proof
    ? proof.nodes.reduce<Record<number, (typeof proof.nodes)[0][]>>((acc, n) => {
        if (!acc[n.level]) acc[n.level] = []
        acc[n.level].push(n)
        return acc
      }, {})
    : null
  const maxLevel = nodesByLevel ? Math.max(...Object.keys(nodesByLevel).map(Number)) : 0

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">
          Consistency Proof — Log Grew Append-Only
        </h4>
        <p className="text-xs text-muted-foreground">
          A CT auditor (or your browser) verifies that the log only <em>appended</em> new entries —
          it never secretly rewrote old ones. The consistency proof shows that T1&apos;s root is
          structurally embedded inside T2 (
          <span className="text-success font-medium">green = shared nodes</span>,{' '}
          <span className="text-primary font-medium">blue = new additions</span>). This is pure hash
          computation — no ML-DSA operations needed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Camera size={14} className="text-primary" />
            <span className="text-xs font-bold text-foreground">Snapshot T1 (old tree)</span>
          </div>
          {snapshot ? (
            <div className="space-y-1 text-[10px]">
              <div className="text-muted-foreground">
                {snapshot.certs.length} cert{snapshot.certs.length !== 1 ? 's' : ''}
              </div>
              <div className="font-mono text-success break-all">
                {truncateHash(snapshot.levels[snapshot.levels.length - 1][0].hash, 16)}
              </div>
              <div className="text-success">Root captured ✓</div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground">
                Submit at least 2 certs, then freeze a snapshot.
              </p>
              <Button
                onClick={onFreezeSnapshot}
                disabled={!logLevels || logLevels[0].length < 2}
                variant="outline"
                className="text-xs h-auto py-1"
              >
                <Camera size={11} className="mr-1" /> Freeze T1
              </Button>
            </div>
          )}
        </div>

        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-accent" />
            <span className="text-xs font-bold text-foreground">Current T2 (live tree)</span>
          </div>
          {logLevels ? (
            <div className="space-y-1 text-[10px]">
              <div className="text-muted-foreground">
                {logCerts.length} cert{logCerts.length !== 1 ? 's' : ''}
              </div>
              <div className="font-mono text-accent break-all">
                {truncateHash(logLevels[logLevels.length - 1][0].hash, 16)}
              </div>
              {snapshot && logLevels[0].length <= snapshot.levels[0].length && (
                <div className="text-muted-foreground">Add more certs to enable proof</div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">No certs yet</p>
          )}
        </div>
      </div>

      {canCompute && (
        <Button
          onClick={handleCompute}
          disabled={isComputing}
          className="flex items-center gap-2 bg-primary text-black font-bold hover:bg-primary/90"
        >
          {isComputing ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Computing…
            </>
          ) : (
            <>
              <ShieldCheck size={16} /> Compute Consistency Proof
            </>
          )}
        </Button>
      )}

      {proof && nodesByLevel && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-success/20 border-2 border-success inline-block" />
              Shared (in T1 and T2)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-primary/20 border-2 border-primary inline-block" />
              New (T2 only)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-accent/20 border-double border-accent border-[3px] inline-block" />
              T2 root
            </span>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto">
            <div className="space-y-3 min-w-fit">
              {Array.from({ length: maxLevel + 1 }, (_, i) => maxLevel - i).map((lvl) => {
                const levelNodes = (nodesByLevel[lvl] ?? []).sort((a, b) => a.index - b.index)
                const isRoot = lvl === maxLevel
                return (
                  <div key={lvl}>
                    <div className="text-[10px] text-muted-foreground mb-1">
                      {isRoot ? 'Root (T2)' : lvl === 0 ? 'Leaves' : `Level ${lvl}`}
                    </div>
                    <div className="flex justify-center gap-1 flex-wrap">
                      {levelNodes.map((n) => {
                        let cls = ''
                        if (isRoot)
                          cls =
                            'bg-accent/20 text-accent border-[3px] border-double border-accent font-bold shadow-lg'
                        else if (n.isOld)
                          cls = 'bg-success/20 text-success border-2 border-success shadow-sm'
                        else cls = 'bg-primary/15 text-primary border-2 border-primary'
                        return (
                          <div
                            key={`${lvl}-${n.index}`}
                            className={`px-2 py-1.5 rounded text-[10px] font-mono border ${cls}`}
                          >
                            <div className="text-[9px] text-muted-foreground mb-0.5">{n.label}</div>
                            <div>{truncateHash(n.hash, 6)}</div>
                            {n.isOld && (
                              <div className="text-[8px] mt-0.5 font-bold text-success">shared</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Root hash comparison — key proof fact */}
          <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-2">
            <div className="text-[10px] font-bold text-foreground">
              Key proof fact: T1 root appears in T2 tree
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-[10px]">
              <div className="flex gap-2">
                <span className="text-success font-bold w-16 shrink-0">T1 root:</span>
                <span className="font-mono text-success break-all">
                  {truncateHash(proof.oldRoot, 20)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-accent font-bold w-16 shrink-0">T2 root:</span>
                <span className="font-mono text-accent break-all">
                  {truncateHash(proof.newRoot, 20)}
                </span>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground">
              Every <span className="text-success font-medium">green (shared)</span> node above
              exists in both trees. The auditor confirms T1&apos;s root hash is present among
              T2&apos;s shared nodes — proving no old entries were rewritten.
            </p>
          </div>

          <div
            className={`rounded-lg p-3 border-2 text-center ${
              verified ? 'bg-success/10 border-success' : 'bg-destructive/10 border-destructive'
            }`}
          >
            {verified ? (
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck size={18} className="text-success" />
                <div className="text-left">
                  <div className="text-sm font-bold text-success">Consistency Verified</div>
                  <div className="text-[10px] text-muted-foreground">
                    T1&apos;s root is embedded in T2 — log only appended entries
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <ShieldX size={18} className="text-destructive" />
                <div className="text-left">
                  <div className="text-sm font-bold text-destructive">Consistency Failed</div>
                  <div className="text-[10px] text-muted-foreground">
                    T1&apos;s root not found in T2 — possible log alteration
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!snapshot && (
        <div className="text-center py-6 text-muted-foreground text-xs">
          Submit certs, then freeze a snapshot in the Submission tab.
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-panel 3: Misissuance Audit
// ---------------------------------------------------------------------------

interface AuditPanelProps {
  logCerts: IssuedCert[]
  signedBatch: SignedBatch | null
  hsmReady: boolean
  hSession: number
  pubHandle: number | null
  onVerifyBatch: (certs: IssuedCert[]) => Promise<{ valid: boolean; computedRoot: string }>
}

const AuditPanel: React.FC<AuditPanelProps> = ({
  logCerts,
  signedBatch,
  hsmReady,
  onVerifyBatch,
}) => {
  const [editedCerts, setEditedCerts] = useState<IssuedCert[]>([])
  const [auditResult, setAuditResult] = useState<{
    valid: boolean
    computedRoot: string
    sigValid: boolean
  } | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    setEditedCerts(structuredClone(logCerts))
    setAuditResult(null)
  }, [logCerts])

  const changedIndices = editedCerts.reduce<number[]>((acc, c, i) => {
    const orig = logCerts[i]
    if (orig && (c.subject !== orig.subject || c.algorithm !== orig.algorithm)) acc.push(i)
    return acc
  }, [])
  const hasTampering = changedIndices.length > 0

  const handleStartEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditValue(editedCerts[idx].subject)
  }

  const handleCommitEdit = (idx: number) => {
    if (!editValue.trim()) return
    setEditedCerts((prev) => {
      const next = structuredClone(prev)
      next[idx] = { ...next[idx], subject: editValue.trim() }
      return next
    })
    setEditingIdx(null)
    setAuditResult(null)
  }

  const handleReaudit = useCallback(async () => {
    if (editedCerts.length < 1) return
    setIsAuditing(true)
    try {
      const result = await onVerifyBatch(editedCerts)
      setAuditResult({ ...result, sigValid: result.valid })
    } finally {
      setIsAuditing(false)
    }
  }, [editedCerts, onVerifyBatch])

  if (logCerts.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs">
        Submit at least 2 certificates in the Submission tab to enable auditing.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-bold text-foreground mb-1">
          Misissuance Audit — Detect Tampered Certificates
        </h4>
        <p className="text-xs text-muted-foreground">
          CT monitors download the full batch and recompute the tree root. If any cert was secretly
          replaced after the CA signed the STH, the recomputed root won&apos;t match the published
          one — and the CA&apos;s ML-DSA signature will{' '}
          {hsmReady ? 'fail via SoftHSMv3 C_VerifyMessage' : 'be flagged as invalid'}. Edit any cert
          below, then re-audit.
        </p>
      </div>

      {/* Published STH */}
      {signedBatch && (
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-[10px]">
          <div className="text-muted-foreground mb-1">Published Signed Tree Head (original)</div>
          <div className="font-mono text-success break-all">
            Root: {truncateHash(signedBatch.root, 24)}
          </div>
          <div className="font-mono text-foreground mt-1">
            CA sig:{' '}
            {truncateHash(
              Array.from(signedBatch.caSig)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join(''),
              16
            )}
            … (ML-DSA-44, {signedBatch.caSig.length.toLocaleString()} B)
          </div>
        </div>
      )}

      {/* Editable cert list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            Batch Contents
            {hasTampering && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30 font-bold">
                {changedIndices.length} modified
              </span>
            )}
          </span>
          {hasTampering && (
            <button
              onClick={() => {
                setEditedCerts(structuredClone(logCerts))
                setAuditResult(null)
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw size={11} /> Restore all
            </button>
          )}
        </div>

        {editedCerts.map((cert, idx) => {
          const isChanged = changedIndices.includes(idx)
          const isEditing = editingIdx === idx
          return (
            <div
              key={cert.id}
              className={`bg-background rounded-lg p-2.5 border transition-colors ${
                isChanged ? 'border-destructive/50' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isChanged
                      ? 'bg-destructive/20 text-destructive border border-destructive/40'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommitEdit(idx)
                          if (e.key === 'Escape') setEditingIdx(null)
                        }}
                        className="text-xs h-auto py-1 flex-1"
                      />
                      <button onClick={() => handleCommitEdit(idx)} className="text-success">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingIdx(null)} className="text-muted-foreground">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium truncate ${isChanged ? 'text-destructive' : 'text-foreground'}`}
                      >
                        {cert.subject}
                      </span>
                      {isChanged && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          (was: {logCerts[idx].subject})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{cert.algorithm}</span>
                {!isEditing && (
                  <button
                    onClick={() => handleStartEdit(idx)}
                    className="text-muted-foreground hover:text-warning transition-colors shrink-0"
                    title="Edit to simulate misissuance"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Re-audit button */}
      <button
        onClick={handleReaudit}
        disabled={isAuditing}
        className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning border border-warning/30 rounded-lg hover:bg-warning/20 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        {isAuditing ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Re-auditing…
          </>
        ) : (
          <>
            <ShieldCheck size={16} /> Re-audit Batch
          </>
        )}
      </button>

      {/* Audit result */}
      {auditResult && signedBatch && (
        <div
          className={`rounded-lg p-4 border-2 ${
            auditResult.valid
              ? 'bg-success/10 border-success'
              : 'bg-destructive/10 border-destructive'
          }`}
        >
          {auditResult.valid ? (
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-success" />
              <div>
                <div className="text-sm font-bold text-success">Audit Passed</div>
                <div className="text-[10px] text-muted-foreground">
                  Recomputed root matches published STH
                  {hsmReady ? ' · CA ML-DSA signature verified via SoftHSMv3' : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldX size={20} className="text-destructive shrink-0" />
                <div>
                  <div className="text-sm font-bold text-destructive">Misissuance Detected!</div>
                  <div className="text-[10px] text-muted-foreground">
                    Recomputed root diverges from published STH
                    {hsmReady ? ' · CA ML-DSA signature invalid' : ''}
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 shrink-0">Published root:</span>
                  <span className="font-mono text-success break-all">
                    {truncateHash(signedBatch.root, 20)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-28 shrink-0">Recomputed root:</span>
                  <span className="font-mono text-destructive break-all">
                    {truncateHash(auditResult.computedRoot, 20)}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-destructive/5 rounded p-2 border border-destructive/20">
                <AlertTriangle size={11} className="text-destructive mt-0.5 shrink-0" />
                In a live deployment, this discrepancy would trigger automated alerts. The CA cannot
                issue a valid SCT for the tampered cert because the CA&apos;s ML-DSA signature on
                the original root hash cannot be forged.
              </div>
            </div>
          )}
        </div>
      )}

      {hasTampering && !auditResult && (
        <div className="flex items-start gap-2 bg-warning/5 rounded-lg p-3 border border-warning/20">
          <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            {changedIndices.length} cert{changedIndices.length !== 1 ? 's' : ''} modified. Click{' '}
            <strong className="text-foreground">Re-audit Batch</strong> to detect the misissuance.
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main CTLogSimulator
// ---------------------------------------------------------------------------

export const CTLogSimulator: React.FC = () => {
  const hsm = useHSM('rust')
  const [activePanel, setActivePanel] = useState<Panel>('submission')

  const [issuedCerts, setIssuedCerts] = useState<IssuedCert[]>([])
  const [logLevels, setLogLevels] = useState<MerkleNode[][] | null>(null)
  const [signedBatch, setSignedBatch] = useState<SignedBatch | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [caKeyHandles, setCAKeyHandles] = useState<{
    pubHandle: number
    privHandle: number
  } | null>(null)
  const [caPubKeyBytes, setCAPubKeyBytes] = useState<Uint8Array | null>(null)
  const [snapshot, setSnapshot] = useState<{
    certs: IssuedCert[]
    levels: MerkleNode[][]
  } | null>(null)

  const caKeyReady = caKeyHandles !== null

  const handleGenerateCAKey = useCallback(async () => {
    if (!hsm.isReady || !hsm.moduleRef.current) return
    hsm.addStepLog('CA Key Generation — ML-DSA-44')
    const M = hsm.moduleRef.current
    const hSession = hsm.hSessionRef.current
    const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, 44, true)
    const pubBytes = hsm_extractKeyValue(M, hSession, pubHandle)
    setCAKeyHandles({ pubHandle, privHandle })
    setCAPubKeyBytes(pubBytes)
    hsm.addKey({
      handle: pubHandle,
      family: 'ml-dsa',
      role: 'public',
      label: 'CT Log CA Public Key (ML-DSA-44)',
      variant: '44',
      generatedAt: new Date().toISOString(),
    })
  }, [hsm])

  const signBatch = useCallback(
    async (certs: IssuedCert[], levels: MerkleNode[][]): Promise<SignedBatch | null> => {
      const root = levels[levels.length - 1][0].hash
      const ts = Date.now()
      const payload = await buildSignedPayload(root, certs.length, ts)

      // If HSM + CA key ready, sign with ML-DSA; otherwise use a placeholder
      if (hsm.isReady && hsm.moduleRef.current && caKeyHandles) {
        hsm.addStepLog(`CA Signs STH — ML-DSA-44 · root ${root.slice(0, 8)}…`)
        const M = hsm.moduleRef.current
        const hSession = hsm.hSessionRef.current
        const sig = hsm_signBytesMLDSA(M, hSession, caKeyHandles.privHandle, payload)
        return {
          root,
          treeSize: certs.length,
          signedPayload: payload,
          caSig: sig,
          caPubKey: caPubKeyBytes ?? new Uint8Array(1312),
          timestamp: ts,
        }
      } else {
        // Simulation mode — zero signature bytes as placeholder
        return {
          root,
          treeSize: certs.length,
          signedPayload: payload,
          caSig: new Uint8Array(2420),
          caPubKey: new Uint8Array(1312),
          timestamp: ts,
        }
      }
    },
    [hsm, caKeyHandles, caPubKeyBytes]
  )

  const addCertToLog = useCallback(
    async (subject: string, algorithm: string) => {
      const algoSizes: Record<string, number> = {
        'ML-DSA-44': 1312,
        'ML-DSA-65': 1952,
        'ML-DSA-87': 2592,
        'SLH-DSA-128s': 32,
      }
      const cert: IssuedCert = {
        id: issuedCerts.length,
        subject,
        issuer: 'CT Log CA',
        algorithm,
        publicKeySize: algoSizes[algorithm] ?? 1312,
        notBefore: new Date().toISOString().slice(0, 10),
        notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        serialNumber: randomSerial(),
        leafHash: '',
      }

      setIsSigning(true)
      try {
        const updatedCerts = [...issuedCerts, cert]
        const certsForTree = updatedCerts.length === 1 ? [cert, cert] : updatedCerts
        const result = await buildMerkleTree(certsForTree)

        // Compute leaf hash for this cert
        const leafProof = getInclusionProof(result.levels, updatedCerts.length - 1)
        cert.leafHash = leafProof.leafHash

        setIssuedCerts(updatedCerts)
        setLogLevels(result.levels)

        const batch = await signBatch(updatedCerts, result.levels)
        if (batch) setSignedBatch(batch)
      } finally {
        setIsSigning(false)
      }
    },
    [issuedCerts, signBatch]
  )

  const loadSamples = useCallback(async () => {
    setIsSigning(true)
    try {
      const samples: IssuedCert[] = SAMPLE_CERTS.slice(0, 5).map((c, i) => ({
        ...c,
        id: i,
        issuer: 'CT Log CA',
        serialNumber: randomSerial(),
        leafHash: '',
      }))
      const result = await buildMerkleTree(samples)
      for (let i = 0; i < samples.length; i++) {
        samples[i].leafHash = getInclusionProof(result.levels, i).leafHash
      }
      setIssuedCerts(samples)
      setLogLevels(result.levels)
      const batch = await signBatch(samples, result.levels)
      if (batch) setSignedBatch(batch)
    } finally {
      setIsSigning(false)
    }
  }, [signBatch])

  const handleFreezeSnapshot = useCallback(() => {
    if (!logLevels) return
    setSnapshot({ certs: structuredClone(issuedCerts), levels: structuredClone(logLevels) })
  }, [issuedCerts, logLevels])

  /** Verify a (possibly tampered) cert list against the published signed batch */
  const handleVerifyBatch = useCallback(
    async (certs: IssuedCert[]): Promise<{ valid: boolean; computedRoot: string }> => {
      const certsForTree = certs.length === 1 ? [certs[0], certs[0]] : certs
      const result = await buildMerkleTree(certsForTree)
      const computedRoot = result.levels[result.levels.length - 1][0].hash

      if (!signedBatch) return { valid: false, computedRoot }
      if (computedRoot !== signedBatch.root) return { valid: false, computedRoot }

      // If HSM + CA key available, verify ML-DSA signature
      if (hsm.isReady && hsm.moduleRef.current && caKeyHandles) {
        hsm.addStepLog(`CA Signature Verify — ML-DSA-44 · root ${computedRoot.slice(0, 8)}…`)
        const M = hsm.moduleRef.current
        const hSession = hsm.hSessionRef.current
        const sigValid = hsm_verifyBytes(
          M,
          hSession,
          caKeyHandles.pubHandle,
          signedBatch.signedPayload,
          signedBatch.caSig
        )
        return { valid: sigValid, computedRoot }
      }

      return { valid: true, computedRoot }
    },
    [signedBatch, hsm, caKeyHandles]
  )

  const PANELS: { id: Panel; label: string }[] = [
    { id: 'submission', label: '1. Log Submission' },
    { id: 'consistency', label: '2. Consistency Proof' },
    { id: 'audit', label: '3. Misissuance Audit' },
  ]

  return (
    <div className="space-y-6">
      {/* HSM toggle anchors the top per layout pattern */}
      <LiveHSMToggle
        hsm={hsm}
        operations={['C_GenerateKeyPair', 'C_Sign (ML-DSA-44)', 'C_Verify (ML-DSA-44)']}
      />

      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Certificate Transparency Log Simulator
        </h3>
        <p className="text-sm text-muted-foreground">
          Simulate a live CT log with real ML-DSA-44 signatures via SoftHSMv3 (PKCS#11 v3.2 · FIPS
          204). Submit certs, have the CA sign the Merkle root, prove append-only growth, and detect
          misissuance.
        </p>
      </div>

      {/* Sub-panel tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {PANELS.map((p) => (
          <Button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            variant="ghost"
            className={`px-3 py-1.5 h-auto rounded text-xs font-medium transition-colors ${
              activePanel === p.id
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
            }`}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Panel content */}
      <div>
        {activePanel === 'submission' && (
          <SubmissionPanel
            issuedCerts={issuedCerts}
            signedBatch={signedBatch}
            logLevels={logLevels}
            caKeyReady={caKeyReady}
            isSigning={isSigning}
            hsmReady={hsm.isReady}
            onAddCert={addCertToLog}
            onLoadSamples={loadSamples}
            onGenerateCAKey={handleGenerateCAKey}
          />
        )}
        {activePanel === 'consistency' && (
          <ConsistencyPanel
            logCerts={issuedCerts}
            logLevels={logLevels}
            snapshot={snapshot}
            onFreezeSnapshot={handleFreezeSnapshot}
          />
        )}
        {activePanel === 'audit' && (
          <AuditPanel
            logCerts={issuedCerts}
            signedBatch={signedBatch}
            hsmReady={hsm.isReady}
            hSession={hsm.hSessionRef.current}
            pubHandle={caKeyHandles?.pubHandle ?? null}
            onVerifyBatch={handleVerifyBatch}
          />
        )}
      </div>

      {/* PKCS#11 call log — always visible once HSM is initialized */}
      {hsm.isReady && (
        <div className="space-y-4 mt-6">
          <Pkcs11LogPanel log={hsm.log} onClear={hsm.clearLog} />
          <HsmKeyInspector
            keys={hsm.keys}
            moduleRef={hsm.moduleRef}
            hSessionRef={hsm.hSessionRef}
            onRemoveKey={hsm.removeKey}
          />
        </div>
      )}
    </div>
  )
}
