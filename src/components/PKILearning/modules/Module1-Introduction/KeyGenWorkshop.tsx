// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useRef, useEffect } from 'react'
import { Play, Loader2, ArrowLeftRight } from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { CLASSICAL_SIG_ALGOS, PQC_SIG_ALGOS } from './algorithmConfig'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'

interface KeyGenWorkshopProps {
  onComplete: () => void
}

// KEM algorithms (key generation only — cannot sign)
const CLASSICAL_KEM_ALGOS = [
  {
    value: 'RSA-2048',
    label: 'RSA-2048',
    cmd: 'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.key',
  },
  {
    value: 'RSA-4096',
    label: 'RSA-4096',
    cmd: 'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out private.key',
  },
  {
    value: 'ECDH-P256',
    label: 'ECDH P-256',
    cmd: 'openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out private.key',
  },
] as const

const PQC_KEM_ALGOS = [
  {
    value: 'ML-KEM-512',
    label: 'ML-KEM-512 (FIPS 203)',
    cmd: 'openssl genpkey -algorithm ML-KEM-512 -out private.key',
  },
  {
    value: 'ML-KEM-768',
    label: 'ML-KEM-768 (FIPS 203)',
    cmd: 'openssl genpkey -algorithm ML-KEM-768 -out private.key',
  },
  {
    value: 'ML-KEM-1024',
    label: 'ML-KEM-1024 (FIPS 203)',
    cmd: 'openssl genpkey -algorithm ML-KEM-1024 -out private.key',
  },
] as const

// ── Helpers ──────────────────────────────────────────────────────────────────

function pemToBytes(pem: string): number {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  if (!b64) throw new Error('PEM payload not produced')
  return atob(b64).length
}

function findCmd(value: string): string | undefined {
  return [...CLASSICAL_SIG_ALGOS, ...CLASSICAL_KEM_ALGOS, ...PQC_SIG_ALGOS, ...PQC_KEM_ALGOS].find(
    (a) => a.value === value
  )?.cmd
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface KeyState {
  output: string
  privBytes: number | null
  pubBytes: number | null
  loading: boolean
  error: string | null
  stale: boolean
}

const emptyKeyState = (): KeyState => ({
  output: '',
  privBytes: null,
  pubBytes: null,
  loading: false,
  error: null,
  stale: false,
})

// ── Component ─────────────────────────────────────────────────────────────────

export const KeyGenWorkshop: React.FC<KeyGenWorkshopProps> = ({ onComplete }) => {
  const [classicalAlgo, setClassicalAlgo] = useState('Ed25519')
  const [pqcAlgo, setPqcAlgo] = useState('ML-DSA-65')
  const [classicalKey, setClassicalKey] = useState<KeyState>(emptyKeyState())
  const [pqcKey, setPqcKey] = useState<KeyState>(emptyKeyState())
  const completed = useRef(false)
  const classicalRequest = useRef(0)
  const pqcRequest = useRef(0)
  const classicalBusy = useRef(false)
  const pqcBusy = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      classicalRequest.current += 1
      pqcRequest.current += 1
    }
  }, [])

  const runGenerate = async (
    algoValue: string,
    setState: React.Dispatch<React.SetStateAction<KeyState>>,
    request: React.RefObject<number>,
    busy: React.RefObject<boolean>
  ) => {
    const cmd = findCmd(algoValue)
    if (busy.current) return
    if (!cmd) {
      setState({ ...emptyKeyState(), error: 'Choose a supported sample algorithm' })
      return
    }
    busy.current = true
    const requestId = ++request.current
    const isCurrent = () => mounted.current && request.current === requestId
    setState({ ...emptyKeyState(), output: `$ ${cmd}\n`, loading: true })
    try {
      const result = await openSSLService.execute(cmd)
      if (!isCurrent()) return
      if (result.error) throw new Error(result.error)
      const privFile = result.files.find((f) => f.name === 'private.key')
      if (!privFile?.data.length) throw new Error('Private key file not produced')
      const privPem = new TextDecoder().decode(privFile.data)
      const privBytes = pemToBytes(privPem)
      let log = result.stdout + result.stderr + '\nPrivate-key output produced.\n'
      const pubCmd = 'openssl pkey -in private.key -pubout -out public.key'
      log += `\n$ ${pubCmd}\n`
      const pubResult = await openSSLService.execute(pubCmd, [privFile])
      if (!isCurrent()) return
      if (pubResult.error) throw new Error(pubResult.error)
      const pubFile = pubResult.files.find((f) => f.name === 'public.key')
      if (!pubFile?.data.length) throw new Error('Public key file not produced')
      const pubPem = new TextDecoder().decode(pubFile.data)
      const pubBytes = pemToBytes(pubPem)
      log += pubPem + '\nSample key generation and public-key extraction completed.\n'
      setState({ ...emptyKeyState(), output: `$ ${cmd}\n` + log, privBytes, pubBytes })
      if (!completed.current) {
        completed.current = true
        onComplete()
      }
    } catch (err) {
      if (!isCurrent()) return
      const error = err instanceof Error ? err.message : 'Unknown error'
      setState((prev) => ({ ...prev, error, output: prev.output + `Error: ${error}\n` }))
    } finally {
      busy.current = false
      if (mounted.current) setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleGenerateClassical = () =>
    runGenerate(classicalAlgo, setClassicalKey, classicalRequest, classicalBusy)
  const handleGeneratePQC = () => runGenerate(pqcAlgo, setPqcKey, pqcRequest, pqcBusy)

  const handleGenerateBoth = () => {
    handleGenerateClassical()
    handleGeneratePQC()
  }

  const bothReady = classicalKey.privBytes !== null && pqcKey.privBytes !== null
  const maxBytes = Math.max(
    classicalKey.privBytes ?? 0,
    classicalKey.pubBytes ?? 0,
    pqcKey.privBytes ?? 0,
    pqcKey.pubBytes ?? 0,
    64
  )

  return (
    <div className="space-y-6">
      <p role="note" className="text-sm text-muted-foreground">
        Sizes count the exact decoded PEM payload/container bytes, including container overhead, not
        raw algorithm key-size references or proof of an interoperable encoding. Activity credit
        records a successful sample key-generation and public-key extraction, not deployed-system
        validation.
      </p>
      {/* Generate Both CTA */}
      <div className="flex justify-center">
        <Button
          variant="gradient"
          onClick={handleGenerateBoth}
          disabled={classicalKey.loading || pqcKey.loading}
          className="flex items-center gap-2 px-6 py-2 font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          <ArrowLeftRight size={16} />
          Generate Both &amp; Compare
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Classical ── */}
        <div className="space-y-4">
          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-destructive/10 text-status-error border border-destructive/20">
            Classical (Quantum-Vulnerable)
          </span>

          <div>
            <FilterDropdown
              label="Algorithm"
              items={[
                ...CLASSICAL_SIG_ALGOS.map((a) => ({ id: a.value, label: a.label })),
                ...CLASSICAL_KEM_ALGOS.map((a) => ({ id: a.value, label: a.label })),
              ]}
              selectedId={classicalAlgo}
              onSelect={(value) => {
                classicalRequest.current += 1
                setClassicalAlgo(value)
                setClassicalKey({ ...emptyKeyState(), loading: classicalBusy.current, stale: true })
              }}
              noContainer
              className="w-full"
            />
          </div>

          <Button
            variant="ghost"
            onClick={handleGenerateClassical}
            disabled={classicalKey.loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-destructive/40 text-status-error font-bold rounded hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {classicalKey.loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Play size={16} />
            )}
            Generate {classicalAlgo}
          </Button>

          <div className="bg-muted rounded-lg p-4 font-mono text-xs h-[220px] overflow-y-auto custom-scrollbar border border-border">
            <pre className="text-status-success whitespace-pre-wrap">
              {classicalKey.output || (
                <span className="text-muted-foreground italic">Output will appear here…</span>
              )}
            </pre>
          </div>

          {classicalKey.error && (
            <p role="alert" className="text-sm text-status-error">
              {classicalKey.error}. Try generating again.
            </p>
          )}
          {classicalKey.stale && (
            <p role="status" className="text-sm text-muted-foreground">
              Selection changed—run again. Previous outputs cleared.
            </p>
          )}

          {classicalKey.privBytes !== null && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Decoded private-key container</span>
                <span className="font-mono text-foreground">
                  {classicalKey.privBytes.toLocaleString()} bytes
                </span>
              </div>
              {classicalKey.pubBytes !== null && (
                <div className="flex justify-between">
                  <span>Decoded public-key container</span>
                  <span className="font-mono text-foreground">
                    {classicalKey.pubBytes.toLocaleString()} bytes
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── PQC ── */}
        <div className="space-y-4">
          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-accent/10 text-accent border border-accent/20">
            Post-Quantum (Quantum-Safe)
          </span>

          <div>
            <FilterDropdown
              label="Algorithm"
              items={[
                ...PQC_SIG_ALGOS.map((a) => ({ id: a.value, label: a.label })),
                ...PQC_KEM_ALGOS.map((a) => ({ id: a.value, label: a.label })),
              ]}
              selectedId={pqcAlgo}
              onSelect={(value) => {
                pqcRequest.current += 1
                setPqcAlgo(value)
                setPqcKey({ ...emptyKeyState(), loading: pqcBusy.current, stale: true })
              }}
              noContainer
              className="w-full"
            />
          </div>

          <Button
            variant="ghost"
            onClick={handleGeneratePQC}
            disabled={pqcKey.loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-accent/40 text-accent font-bold rounded hover:bg-accent/10 transition-colors disabled:opacity-50"
          >
            {pqcKey.loading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            Generate {pqcAlgo}
          </Button>

          <div className="bg-muted rounded-lg p-4 font-mono text-xs h-[220px] overflow-y-auto custom-scrollbar border border-border">
            <pre className="text-status-success whitespace-pre-wrap">
              {pqcKey.output || (
                <span className="text-muted-foreground italic">Output will appear here…</span>
              )}
            </pre>
          </div>

          {pqcKey.error && (
            <p role="alert" className="text-sm text-status-error">
              {pqcKey.error}. Try generating again.
            </p>
          )}
          {pqcKey.stale && (
            <p role="status" className="text-sm text-muted-foreground">
              Selection changed—run again. Previous outputs cleared.
            </p>
          )}

          {pqcKey.privBytes !== null && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Decoded private-key container</span>
                <span className="font-mono text-foreground">
                  {pqcKey.privBytes.toLocaleString()} bytes
                </span>
              </div>
              {pqcKey.pubBytes !== null && (
                <div className="flex justify-between">
                  <span>Decoded public-key container</span>
                  <span className="font-mono text-foreground">
                    {pqcKey.pubBytes.toLocaleString()} bytes
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Key Size Comparison ── */}
      {bothReady && (
        <div className="glass-panel p-5 space-y-4">
          <h4 className="font-semibold text-foreground">Decoded Key Container Size Comparison</h4>

          {/* Private key bars */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Private-key container
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="w-32 text-xs text-right text-muted-foreground truncate">
                  {classicalAlgo}
                </div>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-destructive/50 rounded transition-all duration-500"
                    style={{ width: `${((classicalKey.privBytes ?? 0) / maxBytes) * 100}%` }}
                  />
                </div>
                <div className="w-20 text-xs font-mono text-foreground text-right">
                  {classicalKey.privBytes?.toLocaleString()} B
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 text-xs text-right text-accent truncate">{pqcAlgo}</div>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-accent/50 rounded transition-all duration-500"
                    style={{ width: `${((pqcKey.privBytes ?? 0) / maxBytes) * 100}%` }}
                  />
                </div>
                <div className="w-20 text-xs font-mono text-foreground text-right">
                  {pqcKey.privBytes?.toLocaleString()} B
                </div>
              </div>
            </div>
          </div>

          {/* Public key bars */}
          {classicalKey.pubBytes !== null && pqcKey.pubBytes !== null && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Public-key container
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-32 text-xs text-right text-muted-foreground truncate">
                    {classicalAlgo}
                  </div>
                  <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-destructive/50 rounded transition-all duration-500"
                      style={{ width: `${((classicalKey.pubBytes ?? 0) / maxBytes) * 100}%` }}
                    />
                  </div>
                  <div className="w-20 text-xs font-mono text-foreground text-right">
                    {classicalKey.pubBytes?.toLocaleString()} B
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 text-xs text-right text-accent truncate">{pqcAlgo}</div>
                  <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-accent/50 rounded transition-all duration-500"
                      style={{ width: `${((pqcKey.pubBytes ?? 0) / maxBytes) * 100}%` }}
                    />
                  </div>
                  <div className="w-20 text-xs font-mono text-foreground text-right">
                    {pqcKey.pubBytes?.toLocaleString()} B
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Why are PQC keys larger?</strong> Quantum-resistant
            algorithms are based on harder mathematical problems — lattices or hash functions
            instead of integer factoring or elliptic curves. Representing these harder problems
            requires more bytes, but that extra size is exactly what makes them safe against quantum
            computers running Shor&apos;s algorithm.
          </p>
        </div>
      )}
    </div>
  )
}
