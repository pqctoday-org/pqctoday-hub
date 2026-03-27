// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { PenTool, Loader2 } from 'lucide-react'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { CLASSICAL_SIG_ALGOS, PQC_SIG_ALGOS } from './algorithmConfig'
import { FilterDropdown } from '@/components/common/FilterDropdown'

interface SignatureDemoProps {
  onComplete: () => void
}

// Signing metadata — extends the shared algorithm list with signing-specific flags
const CLASSICAL_SIGN_META: Record<string, { genCmd: string; rawin: boolean }> = {
  Ed25519: {
    genCmd: 'openssl genpkey -algorithm ED25519 -out sign.key',
    rawin: true,
  },
  'EC-P256': {
    genCmd: 'openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out sign.key',
    rawin: true,
  },
}

const PQC_SIGN_META: Record<string, { genCmd: string; rawin: boolean }> = {
  'ML-DSA-44': {
    genCmd: 'openssl genpkey -algorithm ML-DSA-44 -out sign.key',
    rawin: false,
  },
  'ML-DSA-65': {
    genCmd: 'openssl genpkey -algorithm ML-DSA-65 -out sign.key',
    rawin: false,
  },
  'ML-DSA-87': {
    genCmd: 'openssl genpkey -algorithm ML-DSA-87 -out sign.key',
    rawin: false,
  },
  'SLH-DSA-SHA2-128s': {
    genCmd: 'openssl genpkey -algorithm SLH-DSA-SHA2-128s -out sign.key',
    rawin: false,
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SigState {
  sigHex: string | null
  sigBytes: number | null
  loading: boolean
  algoLabel: string
}

const emptySigState = (label: string): SigState => ({
  sigHex: null,
  sigBytes: null,
  loading: false,
  algoLabel: label,
})

// ── Component ─────────────────────────────────────────────────────────────────

export const SignatureDemo: React.FC<SignatureDemoProps> = ({ onComplete }) => {
  const [message, setMessage] = useState('Hello, PKI World!')
  const [classicalAlgo, setClassicalAlgo] = useState('Ed25519')
  const [pqcAlgo, setPqcAlgo] = useState('ML-DSA-65')
  const [classicalSig, setClassicalSig] = useState<SigState>(
    emptySigState(CLASSICAL_SIG_ALGOS[0].label)
  )
  const [pqcSig, setPqcSig] = useState<SigState>(emptySigState(PQC_SIG_ALGOS[1].label))
  const [everCompleted, setEverCompleted] = useState(false)

  const runSign = async (
    algoValue: string,
    meta: Record<string, { genCmd: string; rawin: boolean }>,
    algoList: ReadonlyArray<{ value: string; label: string }>,
    setState: React.Dispatch<React.SetStateAction<SigState>>
  ) => {
    // eslint-disable-next-line security/detect-object-injection
    const m = meta[algoValue]
    const label = algoList.find((a) => a.value === algoValue)?.label ?? algoValue
    if (!m) return

    setState({ sigHex: null, sigBytes: null, loading: true, algoLabel: label })

    try {
      // 1. Generate ephemeral signing key
      const keyResult = await openSSLService.execute(m.genCmd)
      const keyFile = keyResult.files.find((f) => f.name === 'sign.key')
      if (!keyFile) throw new Error('Failed to generate signing key')

      // 2. Create message file
      const msgFile = { name: 'message.txt', data: new TextEncoder().encode(message) }

      // 3. Sign — ML-DSA/SLH-DSA have internal hash, Ed25519/EC need -rawin
      const rawFlag = m.rawin ? ' -rawin' : ''
      const signCmd = `openssl pkeyutl -sign -inkey sign.key${rawFlag} -in message.txt -out signature.bin`
      const signResult = await openSSLService.execute(signCmd, [keyFile, msgFile])

      const sigFile = signResult.files.find((f) => f.name === 'signature.bin')
      if (!sigFile) throw new Error('Signature not produced')

      const hex = Array.from(sigFile.data)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      setState({ sigHex: hex, sigBytes: sigFile.data.length, loading: false, algoLabel: label })

      if (!everCompleted) {
        setEverCompleted(true)
        onComplete()
      }
    } catch (err) {
      console.error(err)
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleSignClassical = () =>
    runSign(classicalAlgo, CLASSICAL_SIGN_META, CLASSICAL_SIG_ALGOS, setClassicalSig)
  const handleSignPQC = () => runSign(pqcAlgo, PQC_SIGN_META, PQC_SIG_ALGOS, setPqcSig)

  const handleSignBoth = () => {
    handleSignClassical()
    handleSignPQC()
  }

  const bothReady = classicalSig.sigBytes !== null && pqcSig.sigBytes !== null
  const maxSigBytes = Math.max(classicalSig.sigBytes ?? 0, pqcSig.sigBytes ?? 0, 64)

  return (
    <div className="space-y-6">
      {/* Shared message input */}
      <div className="space-y-2">
        <label htmlFor="sign-message" className="block text-sm font-medium text-foreground">
          Message to Sign
        </label>
        <textarea
          id="sign-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full h-20 bg-muted border border-border rounded p-3 text-foreground resize-none text-sm"
          placeholder="Enter a message to sign…"
        />
      </div>

      {/* Sign Both CTA */}
      <div className="flex justify-center">
        <button
          onClick={handleSignBoth}
          disabled={classicalSig.loading || pqcSig.loading || !message}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <PenTool size={16} />
          Sign with Both &amp; Compare
        </button>
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
              items={CLASSICAL_SIG_ALGOS.map((a) => ({ id: a.value, label: a.label }))}
              selectedId={classicalAlgo}
              onSelect={setClassicalAlgo}
              noContainer
              className="w-full"
            />
          </div>

          <button
            onClick={handleSignClassical}
            disabled={classicalSig.loading || !message}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-destructive/40 text-destructive font-bold rounded hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {classicalSig.loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <PenTool size={16} />
            )}
            Sign with {classicalAlgo}
          </button>

          <div className="bg-muted rounded-lg p-4 border border-border h-[120px] overflow-y-auto custom-scrollbar">
            {classicalSig.sigHex ? (
              <code className="text-xs text-primary break-all">{classicalSig.sigHex}</code>
            ) : (
              <p className="text-muted-foreground text-sm italic">Signature will appear here…</p>
            )}
          </div>

          {classicalSig.sigBytes !== null && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Signature size</span>
              <span className="font-mono font-bold text-foreground">
                {classicalSig.sigBytes} bytes
              </span>
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
              items={PQC_SIG_ALGOS.map((a) => ({ id: a.value, label: a.label }))}
              selectedId={pqcAlgo}
              onSelect={setPqcAlgo}
              noContainer
              className="w-full"
            />
          </div>

          <button
            onClick={handleSignPQC}
            disabled={pqcSig.loading || !message}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-accent/40 text-accent font-bold rounded hover:bg-accent/10 transition-colors disabled:opacity-50"
          >
            {pqcSig.loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <PenTool size={16} />
            )}
            Sign with {pqcAlgo}
          </button>

          <div className="bg-muted rounded-lg p-4 border border-border h-[120px] overflow-y-auto custom-scrollbar">
            {pqcSig.sigHex ? (
              <code className="text-xs text-accent break-all">{pqcSig.sigHex}</code>
            ) : (
              <p className="text-muted-foreground text-sm italic">Signature will appear here…</p>
            )}
          </div>

          {pqcSig.sigBytes !== null && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Signature size</span>
              <span className="font-mono font-bold text-foreground">{pqcSig.sigBytes} bytes</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Signature Size Comparison ── */}
      {bothReady && (
        <div className="glass-panel p-5 space-y-4">
          <h4 className="font-semibold text-foreground">Signature Size Comparison</h4>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-32 text-xs text-right text-muted-foreground truncate">
                {classicalSig.algoLabel}
              </div>
              <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-destructive/50 rounded transition-all duration-700"
                  style={{ width: `${((classicalSig.sigBytes ?? 0) / maxSigBytes) * 100}%` }}
                />
              </div>
              <div className="w-20 text-xs font-mono text-foreground text-right">
                {classicalSig.sigBytes} B
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 text-xs text-right text-accent truncate">{pqcSig.algoLabel}</div>
              <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-accent/50 rounded transition-all duration-700"
                  style={{ width: `${((pqcSig.sigBytes ?? 0) / maxSigBytes) * 100}%` }}
                />
              </div>
              <div className="w-20 text-xs font-mono text-foreground text-right">
                {pqcSig.sigBytes} B
              </div>
            </div>
          </div>

          {/* Properties table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="text-xs space-y-1.5">
              <p className="font-semibold text-muted-foreground mb-2">{classicalSig.algoLabel}</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantum-safe</span>
                <span className="text-destructive font-bold">✗ No</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sig size</span>
                <span className="font-mono text-foreground">{classicalSig.sigBytes} B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Standard</span>
                <span className="text-foreground">RFC 8032</span>
              </div>
            </div>
            <div className="text-xs space-y-1.5">
              <p className="font-semibold text-accent mb-2">{pqcSig.algoLabel}</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantum-safe</span>
                <span className="text-status-success font-bold">✓ Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sig size</span>
                <span className="font-mono text-foreground">{pqcSig.sigBytes} B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Standard</span>
                <span className="text-foreground">
                  {pqcAlgo.startsWith('SLH') ? 'FIPS 205' : 'FIPS 204'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Key insight:</strong> PQC signatures are larger
            because lattice and hash-based math requires more data to encode security. The trade-off
            is intentional — that extra size is what keeps signatures safe even against a
            cryptographically-relevant quantum computer.
          </p>
        </div>
      )}
    </div>
  )
}
