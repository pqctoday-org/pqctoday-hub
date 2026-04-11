// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
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
  return Math.floor((b64.length * 3) / 4)
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
}

const emptyKeyState = (): KeyState => ({
  output: '',
  privBytes: null,
  pubBytes: null,
  loading: false,
})

// ── Component ─────────────────────────────────────────────────────────────────

export const KeyGenWorkshop: React.FC<KeyGenWorkshopProps> = ({ onComplete }) => {
  const [classicalAlgo, setClassicalAlgo] = useState('Ed25519')
  const [pqcAlgo, setPqcAlgo] = useState('ML-DSA-65')
  const [classicalKey, setClassicalKey] = useState<KeyState>(emptyKeyState())
  const [pqcKey, setPqcKey] = useState<KeyState>(emptyKeyState())
  const [everCompleted, setEverCompleted] = useState(false)

  const runGenerate = async (
    algoValue: string,
    setState: React.Dispatch<React.SetStateAction<KeyState>>
  ) => {
    const cmd = findCmd(algoValue)
    if (!cmd) return

    setState({ output: `$ ${cmd}\n`, privBytes: null, pubBytes: null, loading: true })

    try {
      const result = await openSSLService.execute(cmd)
      if (result.error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          output: prev.output + `Error: ${result.error}\n`,
        }))
        return
      }

      const privFile = result.files.find((f) => f.name === 'private.key')
      if (!privFile) {
        setState((prev) => ({
          ...prev,
          loading: false,
          output: prev.output + 'Error: key file not produced\n',
        }))
        return
      }

      const privPem = new TextDecoder().decode(privFile.data)
      const privBytes = pemToBytes(privPem)
      let log = result.stdout + result.stderr + '\nKey generated successfully!\n'

      // Extract public key
      const pubCmd = 'openssl pkey -in private.key -pubout -out public.key'
      log += `\n$ ${pubCmd}\n`
      const pubResult = await openSSLService.execute(pubCmd, [privFile])
      const pubFile = pubResult.files.find((f) => f.name === 'public.key')
      const pubPem = pubFile ? new TextDecoder().decode(pubFile.data) : ''
      const pubBytes = pubPem ? pemToBytes(pubPem) : null
      if (pubPem) log += pubPem

      setState({ output: `$ ${cmd}\n` + log, privBytes, pubBytes, loading: false })

      if (!everCompleted) {
        setEverCompleted(true)
        onComplete()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState((prev) => ({
        ...prev,
        loading: false,
        output: prev.output + `System Error: ${msg}\n`,
      }))
    }
  }

  const handleGenerateClassical = () => runGenerate(classicalAlgo, setClassicalKey)
  const handleGeneratePQC = () => runGenerate(pqcAlgo, setPqcKey)

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
          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
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
              onSelect={setClassicalAlgo}
              noContainer
              className="w-full"
            />
          </div>

          <Button
            variant="ghost"
            onClick={handleGenerateClassical}
            disabled={classicalKey.loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-destructive/40 text-destructive font-bold rounded hover:bg-destructive/10 transition-colors disabled:opacity-50"
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

          {classicalKey.privBytes !== null && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Private key</span>
                <span className="font-mono text-foreground">
                  {classicalKey.privBytes.toLocaleString()} bytes
                </span>
              </div>
              {classicalKey.pubBytes !== null && (
                <div className="flex justify-between">
                  <span>Public key</span>
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
              onSelect={setPqcAlgo}
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

          {pqcKey.privBytes !== null && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Private key</span>
                <span className="font-mono text-foreground">
                  {pqcKey.privBytes.toLocaleString()} bytes
                </span>
              </div>
              {pqcKey.pubBytes !== null && (
                <div className="flex justify-between">
                  <span>Public key</span>
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
          <h4 className="font-semibold text-foreground">Key Size Comparison</h4>

          {/* Private key bars */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Private Key
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
                Public Key
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
