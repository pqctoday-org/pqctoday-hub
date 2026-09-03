// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Info, KeyRound, Copy, Check } from 'lucide-react'
import { Link } from 'react-router'
import clsx from 'clsx'
import { useOpenSSLStore } from '../../store'
import { FilterDropdown } from '../../../common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { PqcVersionNote } from '../PqcVersionNote'
import { CKO_TABLE } from '@/wasm/pkcs11Inspect'

/** A keypair generated inside the softhsmrustv3 token this session. Private
 *  key material never leaves the token — `uri` is the only handle to it. */
export interface Pkcs11Key {
  id: string
  algo: string
  kind: 'sign' | 'kem' | 'ec'
  /** `pkcs11:object=<id>;type=private?pin-value=...`, exactly as returned by
   *  the worker's HSM_KEY_CREATED response — see useOpenSSL.ts's hsmKeygen. */
  uri: string
}

export type Pkcs11Operation = 'selfsign' | 'csr' | 'sign' | 'verify' | 'encap' | 'decap'

/** Mirrors HSM_KEYGEN_ALGS in openssl.worker.ts — keep in sync. The `id`
 *  here is sent verbatim as the `algorithm` argument to hsmKeygen(). */
const PKCS11_KEYGEN_ALGS: Array<{ id: string; label: string; kind: Pkcs11Key['kind'] }> = [
  { id: 'ML-DSA-44', label: 'ML-DSA-44 (FIPS 204)', kind: 'sign' },
  { id: 'ML-DSA-65', label: 'ML-DSA-65 (FIPS 204)', kind: 'sign' },
  { id: 'ML-DSA-87', label: 'ML-DSA-87 (FIPS 204)', kind: 'sign' },
  { id: 'ML-KEM-512', label: 'ML-KEM-512 (FIPS 203)', kind: 'kem' },
  { id: 'ML-KEM-768', label: 'ML-KEM-768 (FIPS 203)', kind: 'kem' },
  { id: 'ML-KEM-1024', label: 'ML-KEM-1024 (FIPS 203)', kind: 'kem' },
  { id: 'EC-P256', label: 'EC (P-256)', kind: 'ec' },
]

const OPS_FOR_KIND: Record<Pkcs11Key['kind'], Array<{ id: Pkcs11Operation; label: string }>> = {
  sign: [
    { id: 'selfsign', label: 'Self-signed Cert' },
    { id: 'csr', label: 'CSR' },
    { id: 'sign', label: 'Sign Data' },
    { id: 'verify', label: 'Verify Signature' },
  ],
  ec: [
    { id: 'selfsign', label: 'Self-signed Cert' },
    { id: 'csr', label: 'CSR' },
    { id: 'sign', label: 'Sign Data' },
    { id: 'verify', label: 'Verify Signature' },
  ],
  kem: [
    { id: 'encap', label: 'Encapsulate' },
    { id: 'decap', label: 'Decapsulate' },
  ],
}

/** PKCS#11 v3.2 §6 key types, for rendering a real C_FindObjects sweep.
 *  Values from pkcs11t.h, not inferred. Object classes come from the
 *  canonical CKO_TABLE (wasm/pkcs11Inspect.ts) instead of a local copy —
 *  a third independent copy here previously lacked CKO_PROFILE (0x09),
 *  the same gap Commit 1 of this plan already fixed twice elsewhere. */
const CKK_NAMES_P11: Record<number, string> = {
  0x00000000: 'RSA',
  0x00000003: 'EC',
  0x00000010: 'GENERIC_SECRET',
  0x0000001f: 'AES',
  0x00000040: 'EC_EDWARDS',
  0x00000041: 'EC_MONTGOMERY',
  0x00000049: 'ML-KEM',
  0x0000004a: 'ML-DSA',
  0x0000004b: 'SLH-DSA',
}

interface Pkcs11ConfigProps {
  hsmKeygen: (algorithm: string, keyId: string) => Promise<{ uri: string }>
  /** Live C_FindObjects sweep of the token — see useOpenSSL.hsmListObjects. */
  hsmListObjects?: () => Promise<
    Array<{ handle: number; cls: number; keyType: number; label: string }>
  >
  pkcs11Keys: Pkcs11Key[]
  addPkcs11Key: (key: Pkcs11Key) => void
  pkcs11SelectedKeyId: string
  setPkcs11SelectedKeyId: (id: string) => void
  pkcs11Operation: Pkcs11Operation
  setPkcs11Operation: (op: Pkcs11Operation) => void
  // Shared with req/x509 categories — same fields, same meaning.
  certDays: string
  setCertDays: (value: string) => void
  digestAlgo: string
  setDigestAlgo: (value: string) => void
  commonName: string
  setCommonName: (value: string) => void
  org: string
  setOrg: (value: string) => void
  country: string
  setCountry: (value: string) => void
  // Shared with the dgst category.
  sigHashAlgo: string
  setSigHashAlgo: (value: string) => void
  selectedDataFile: string
  setSelectedDataFile: (value: string) => void
  selectedSigFile: string
  setSelectedSigFile: (value: string) => void
  // Shared with the kem category.
  kemInFile: string
  setKemInFile: (value: string) => void
  kemOutFile: string
  setKemOutFile: (value: string) => void
  kemSecretFile: string
  setKemSecretFile: (value: string) => void
}

export const Pkcs11Config: React.FC<Pkcs11ConfigProps> = ({
  hsmKeygen,
  hsmListObjects,
  pkcs11Keys,
  addPkcs11Key,
  pkcs11SelectedKeyId,
  setPkcs11SelectedKeyId,
  pkcs11Operation,
  setPkcs11Operation,
  certDays,
  setCertDays,
  digestAlgo,
  setDigestAlgo,
  commonName,
  setCommonName,
  org,
  setOrg,
  country,
  setCountry,
  sigHashAlgo,
  setSigHashAlgo,
  selectedDataFile,
  setSelectedDataFile,
  selectedSigFile,
  setSelectedSigFile,
  kemInFile,
  setKemInFile,
  kemOutFile,
  setKemOutFile,
  kemSecretFile,
  setKemSecretFile,
}) => {
  const { files, addLog } = useOpenSSLStore()
  const [genAlgo, setGenAlgo] = useState('ML-DSA-65')
  const [keyLabel, setKeyLabel] = useState(`studio-key-${pkcs11Keys.length + 1}`)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedUri, setCopiedUri] = useState<string | null>(null)
  // Result of the last real token sweep. `null` = never asked (distinct from
  // an empty array, which means "asked, and the token genuinely has nothing").
  const [tokenObjects, setTokenObjects] = useState<Array<{
    handle: number
    cls: number
    keyType: number
    label: string
  }> | null>(null)
  const [isListing, setIsListing] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const handleListObjects = async () => {
    if (!hsmListObjects) return
    setIsListing(true)
    setListError(null)
    try {
      setTokenObjects(await hsmListObjects())
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsListing(false)
    }
  }

  const selectedKey = pkcs11Keys.find((k) => k.id === pkcs11SelectedKeyId) ?? null

  const handleGenerate = async () => {
    const keyId = keyLabel.trim()
    if (!keyId) return
    if (pkcs11Keys.some((k) => k.id === keyId)) {
      addLog('error', `A key labeled "${keyId}" already exists — pick a different label.`)
      return
    }
    setIsGenerating(true)
    try {
      const spec = PKCS11_KEYGEN_ALGS.find((a) => a.id === genAlgo)!
      const { uri } = await hsmKeygen(genAlgo, keyId)
      addPkcs11Key({ id: keyId, algo: genAlgo, kind: spec.kind, uri })
      setPkcs11SelectedKeyId(keyId)
      setPkcs11Operation(spec.kind === 'kem' ? 'encap' : 'selfsign')
      setKeyLabel(`studio-key-${pkcs11Keys.length + 2}`)
    } catch (e: unknown) {
      addLog('error', 'HSM keygen failed: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsGenerating(false)
    }
  }

  const copyUri = async (uri: string) => {
    await navigator.clipboard.writeText(uri)
    setCopiedUri(uri)
    setTimeout(() => setCopiedUri(null), 1500)
  }

  const subj = `/C=${country}/O=${org}/CN=${commonName}`

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        2. Configuration
      </span>

      <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
        <div className="flex gap-2 text-primary mb-1">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span className="text-sm font-bold">PKCS#11 (softhsmrustv3 token)</span>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          Keys generated here are resident in an in-memory PKCS#11 token backed by a pure-Rust
          engine (not OpenSSL&apos;s own crypto) — private key material is never exported. Genuine{' '}
          <code className="bg-muted px-1 rounded">pkcs11:</code> URIs route every downstream command
          through <code className="bg-muted px-1 rounded">pkcs11-provider</code>.
        </p>
        <p className="pl-6 mt-2">
          <Link
            to="/library?q=PKCS%2311"
            className="text-[10px] text-primary hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            PKCS#11 v3.2 →
          </Link>
        </p>
      </div>

      {/* Key Generation */}
      <div className="space-y-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-accent uppercase tracking-wider">
            Generate Key in Token
          </span>
        </div>

        <div>
          <span className="text-xs text-muted-foreground block mb-1">Algorithm</span>
          <FilterDropdown
            selectedId={genAlgo}
            onSelect={setGenAlgo}
            items={PKCS11_KEYGEN_ALGS.map((a) => ({ id: a.id, label: a.label }))}
            defaultLabel="Select Algorithm"
            noContainer
          />
        </div>

        <div>
          <label htmlFor="pkcs11-key-label" className="text-xs text-muted-foreground block mb-1">
            Key Label
          </label>
          <input
            id="pkcs11-key-label"
            type="text"
            value={keyLabel}
            onChange={(e) => setKeyLabel(e.target.value)}
            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            placeholder="e.g. my-signing-key"
          />
        </div>

        <PqcVersionNote />

        <Button
          variant="ghost"
          disabled={isGenerating || !keyLabel.trim()}
          onClick={handleGenerate}
          className="w-full py-2 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold rounded border border-accent/30 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating…' : 'Generate Key in HSM Token'}
        </Button>
      </div>

      {/* Keys generated this session */}
      {pkcs11Keys.length > 0 && (
        <div className="space-y-2 pb-4 border-b border-border">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Token Keys ({pkcs11Keys.length})
          </span>
          <div className="space-y-1.5">
            {pkcs11Keys.map((k) => (
              <div
                key={k.id}
                role="button"
                tabIndex={0}
                onClick={() => setPkcs11SelectedKeyId(k.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setPkcs11SelectedKeyId(k.id)
                  }
                }}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors',
                  pkcs11SelectedKeyId === k.id
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-muted/40 border-border hover:bg-muted'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                    <KeyRound size={12} className="shrink-0 text-primary" />
                    {k.id}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{k.algo}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <code className="text-[10px] text-muted-foreground truncate flex-1">{k.uri}</code>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyUri(k.uri)
                    }}
                    className="p-1 h-auto min-h-0 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Copy URI"
                  >
                    {copiedUri === k.uri ? (
                      <Check size={11} className="text-status-success" />
                    ) : (
                      <Copy size={11} />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token inventory — what the token ACTUALLY holds.
          The list above is only what this session generated; it can't show a
          key made in another tab, restored from a snapshot, or left by an
          earlier session, and it would still list a key the token had lost.
          This asks the token via a real C_FindObjects sweep. */}
      {hsmListObjects && (
        <div className="space-y-2 pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Token Inventory
            </span>
            <Button
              variant="ghost"
              onClick={handleListObjects}
              disabled={isListing}
              className="text-[11px] px-2 py-1 h-auto min-h-0 border border-border rounded hover:bg-muted"
            >
              {isListing ? 'Reading token…' : 'Read from token'}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Runs a real <code>C_FindObjects</code> sweep and reads <code>CKA_CLASS</code>/
            <code>CKA_KEY_TYPE</code>/<code>CKA_LABEL</code> per object. Private key material is{' '}
            <code>CKA_SENSITIVE</code> and is never requested.
          </p>

          {listError && <p className="text-[11px] text-status-error">{listError}</p>}

          {tokenObjects !== null &&
            (tokenObjects.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">
                The token reports no objects.
              </p>
            ) : (
              <div className="space-y-1">
                {tokenObjects.map((o) => (
                  <div
                    key={o.handle}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-[11px] font-mono"
                  >
                    <span className="truncate text-foreground">
                      {o.label || <span className="text-muted-foreground italic">(no label)</span>}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {CKO_TABLE[o.cls]?.name ?? `class 0x${o.cls.toString(16)}`}
                      {o.keyType >= 0 &&
                        ` · ${CKK_NAMES_P11[o.keyType] ?? `0x${o.keyType.toString(16)}`}`}
                      {` · h=${o.handle}`}
                    </span>
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}

      {/* Operation */}
      {selectedKey && (
        <div className="space-y-3">
          <span className="text-xs font-bold text-primary uppercase tracking-wider block">
            Operation — {selectedKey.id}
          </span>

          <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
            {OPS_FOR_KIND[selectedKey.kind].map((op) => (
              <Button
                key={op.id}
                variant="ghost"
                onClick={() => setPkcs11Operation(op.id)}
                className={clsx(
                  'flex-1 px-2 py-1.5 text-xs font-bold rounded transition-colors whitespace-nowrap',
                  pkcs11Operation === op.id
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {op.label}
              </Button>
            ))}
          </div>

          {(pkcs11Operation === 'selfsign' || pkcs11Operation === 'csr') && (
            <div className="space-y-3">
              {pkcs11Operation === 'selfsign' && (
                <div>
                  <label
                    htmlFor="pkcs11-days-input"
                    className="text-xs text-muted-foreground block mb-1"
                  >
                    Validity (Days)
                  </label>
                  <input
                    id="pkcs11-days-input"
                    type="number"
                    value={certDays}
                    onChange={(e) => setCertDays(e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    min="1"
                  />
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Digest Algorithm</span>
                <FilterDropdown
                  selectedId={digestAlgo}
                  onSelect={setDigestAlgo}
                  items={[
                    { id: 'sha256', label: 'SHA-256' },
                    { id: 'sha384', label: 'SHA-384' },
                    { id: 'sha512', label: 'SHA-512' },
                  ]}
                  defaultLabel="Select Digest Algorithm"
                  noContainer
                />
              </div>
              <div>
                <label
                  htmlFor="pkcs11-cn-input"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Common Name (CN)
                </label>
                <input
                  id="pkcs11-cn-input"
                  type="text"
                  value={commonName}
                  onChange={(e) => setCommonName(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="pkcs11-org-input"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Organization (O)
                </label>
                <input
                  id="pkcs11-org-input"
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="My Organization"
                />
              </div>
              <div>
                <label
                  htmlFor="pkcs11-country-input"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Country (C)
                </label>
                <input
                  id="pkcs11-country-input"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="US"
                  maxLength={2}
                />
              </div>
              <div className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
                Subject: <code className="bg-muted px-1 rounded">{subj}</code>
              </div>
            </div>
          )}

          {(pkcs11Operation === 'sign' || pkcs11Operation === 'verify') && (
            <div className="space-y-3">
              {selectedKey.kind === 'ec' && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Hash Algorithm</span>
                  <FilterDropdown
                    selectedId={sigHashAlgo}
                    onSelect={setSigHashAlgo}
                    items={[
                      { id: 'sha256', label: 'SHA-256' },
                      { id: 'sha384', label: 'SHA-384' },
                      { id: 'sha512', label: 'SHA-512' },
                    ]}
                    defaultLabel="Select Hash Algorithm"
                    noContainer
                  />
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground block mb-1">
                  Data File to {pkcs11Operation === 'sign' ? 'Sign' : 'Verify'}
                </span>
                <FilterDropdown
                  selectedId={selectedDataFile}
                  onSelect={setSelectedDataFile}
                  items={files.map((f) => ({ id: f.name, label: f.name }))}
                  defaultLabel="Select Data File..."
                  noContainer
                />
              </div>
              <div>
                <label
                  htmlFor="pkcs11-sig-input"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Signature File
                </label>
                {pkcs11Operation === 'sign' ? (
                  <input
                    id="pkcs11-sig-input"
                    type="text"
                    value={selectedSigFile}
                    onChange={(e) => setSelectedSigFile(e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    placeholder={`${selectedKey.id}.sig`}
                  />
                ) : (
                  <FilterDropdown
                    selectedId={selectedSigFile}
                    onSelect={setSelectedSigFile}
                    items={files
                      .filter((f) => f.name.endsWith('.sig'))
                      .map((f) => ({ id: f.name, label: f.name }))}
                    defaultLabel="Select Signature File..."
                    noContainer
                  />
                )}
              </div>
            </div>
          )}

          {pkcs11Operation === 'encap' && (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="pkcs11-encap-ct"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Ciphertext Output
                </label>
                <input
                  id="pkcs11-encap-ct"
                  type="text"
                  value={kemOutFile}
                  onChange={(e) => setKemOutFile(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="ciphertext.bin"
                />
              </div>
              <div>
                <label
                  htmlFor="pkcs11-encap-secret"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Shared Secret Output
                </label>
                <input
                  id="pkcs11-encap-secret"
                  type="text"
                  value={kemSecretFile}
                  onChange={(e) => setKemSecretFile(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="secret.bin"
                />
              </div>
            </div>
          )}

          {pkcs11Operation === 'decap' && (
            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Ciphertext Input</span>
                <FilterDropdown
                  selectedId={kemInFile}
                  onSelect={setKemInFile}
                  items={files
                    .filter((f) => !f.name.endsWith('.key') && !f.name.endsWith('.pub'))
                    .map((f) => ({ id: f.name, label: f.name }))}
                  defaultLabel="Select Ciphertext (from encapsulation)..."
                  noContainer
                />
              </div>
              <div>
                <label
                  htmlFor="pkcs11-decap-out"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Shared Secret Output
                </label>
                <input
                  id="pkcs11-decap-out"
                  type="text"
                  value={kemOutFile}
                  onChange={(e) => setKemOutFile(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="secret.bin"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
