// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Activity, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { ErrorAlert } from '../../ui/error-alert'
export const X25519ECDHPanel: React.FC = () => {
  const [aliceSecret, setAliceSecret] = useState<string | null>(null)
  const [bobSecret, setSecretB] = useState<string | null>(null)
  const [match, setMatch] = useState<boolean | null>(null)
  const [running, setRunning] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const run = async () => {
    setRunning(true)
    setAliceSecret(null)
    setSecretB(null)
    setMatch(null)
    setErr(null)
    try {
      // Alice generates key pair
      const aliceKp = (await crypto.subtle.generateKey({ name: 'X25519' }, true, [
        'deriveKey',
        'deriveBits',
      ])) as CryptoKeyPair
      // Bob generates key pair
      const bobKp = (await crypto.subtle.generateKey({ name: 'X25519' }, true, [
        'deriveKey',
        'deriveBits',
      ])) as CryptoKeyPair

      // Alice derives shared secret using Bob's public key
      const aliceBits = await crypto.subtle.deriveBits(
        { name: 'X25519', public: bobKp.publicKey },
        aliceKp.privateKey,
        256
      )
      // Bob derives shared secret using Alice's public key
      const bobBits = await crypto.subtle.deriveBits(
        { name: 'X25519', public: aliceKp.publicKey },
        bobKp.privateKey,
        256
      )

      const toHex = (buf: ArrayBuffer) =>
        Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

      const a = toHex(aliceBits)
      const b = toHex(bobBits)
      setAliceSecret(a)
      setSecretB(b)
      setMatch(a === b)
    } catch (e) {
      setErr(String(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 gap-2">
        <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Activity size={18} className="text-muted-foreground" /> Classical Baseline: X25519 ECDH
        </h4>
        <p className="text-xs text-muted-foreground italic">
          Elliptic-curve Diffie-Hellman — broken by quantum computers (Shor's algorithm)
        </p>
      </div>

      <div className="p-4 bg-card rounded-xl border border-border space-y-4">
        <p className="text-sm text-muted-foreground">
          Two parties (Alice and Bob) each generate an ephemeral X25519 key pair, exchange public
          keys, and independently derive the same 32-byte shared secret. Compare this to ML-KEM
          above: same 32-byte output, but X25519 is broken by quantum computers.
        </p>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={run} disabled={running}>
            {running && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Run X25519 Exchange
          </Button>
          <span className="text-xs text-muted-foreground">Alice ⇄ Bob · Web Crypto · 256-bit</span>
        </div>

        {(aliceSecret || bobSecret) && (
          <div className="space-y-2 text-xs font-mono">
            {aliceSecret && (
              <div className="flex gap-3 bg-muted rounded px-2 py-1">
                <span className="text-muted-foreground w-28 shrink-0">Alice's secret</span>
                <span className="truncate">
                  {aliceSecret.slice(0, 20)}…{aliceSecret.slice(-8)}
                </span>
                <span className="text-muted-foreground shrink-0">32 B</span>
              </div>
            )}
            {bobSecret && (
              <div className="flex gap-3 bg-muted rounded px-2 py-1">
                <span className="text-muted-foreground w-28 shrink-0">Bob's secret</span>
                <span className="truncate">
                  {bobSecret.slice(0, 20)}…{bobSecret.slice(-8)}
                </span>
                <span className="text-muted-foreground shrink-0">32 B</span>
              </div>
            )}
            {match !== null && (
              <div
                className={`flex items-center gap-2 rounded px-2 py-1 ${match ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'}`}
              >
                {match ? <CheckCircle size={13} /> : <XCircle size={13} />}
                {match ? 'Secrets match — ECDH successful (not quantum-safe)' : 'Mismatch'}
              </div>
            )}
          </div>
        )}

        {err && <ErrorAlert message={err} />}
      </div>
    </div>
  )
}
