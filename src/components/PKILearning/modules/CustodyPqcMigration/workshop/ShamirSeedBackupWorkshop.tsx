// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo, useState } from 'react'
import { KeyRound, ShieldCheck, AlertTriangle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { splitBytes2of3, reconstruct2of3, toyDigest4, toHex } from '../data/custodyPqcData'
import { ClaimLine, ReadingNote } from '../components/ClaimLine'

const SAMPLE_SEED = new Uint8Array([
  0x4b, 0x91, 0x2c, 0xa7, 0x10, 0xfe, 0x83, 0x55, 0x09, 0xd4, 0x62, 0xbe, 0x77, 0x31, 0xac, 0x08,
])
const SAMPLE_SLOPE = new Uint8Array([
  0x73, 0x1d, 0xe4, 0x92, 0x3b, 0x88, 0x45, 0xc1, 0xa0, 0x2f, 0x6d, 0x54, 0x99, 0x12, 0xef, 0x61,
])

export const ShamirSeedBackupWorkshop: React.FC = () => {
  const [candidateGuessByte, setCandidateGuessByte] = useState<number>(0x4b)
  const [selectedPair, setSelectedPair] = useState<'1-2' | '1-3' | '2-3'>('1-2')
  const [envelopeMode, setEnvelopeMode] = useState<'rsa-ecdh' | 'hybrid-kem-dem'>('rsa-ecdh')
  const [bindCeremonyMetadata, setBindCeremonyMetadata] = useState<boolean>(false)

  const [share1, share2, share3] = useMemo(() => splitBytes2of3(SAMPLE_SEED, SAMPLE_SLOPE), [])

  // With ONLY share1 (t-1 = 1 share) in ideal Shamir, ANY candidate secret byte yields a unique
  // consistent slope a1' = s1[0] ^ candidateByte, so all 256 byte values remain equally likely.
  const consistentSlopeForGuess = share1[0] ^ (candidateGuessByte & 0xff)
  const trueDigest = useMemo(() => toyDigest4(SAMPLE_SEED), [])
  const guessedSeed = useMemo(() => {
    const copy = new Uint8Array(SAMPLE_SEED)
    copy[0] = candidateGuessByte & 0xff
    return copy
  }, [candidateGuessByte])
  const guessedDigest = useMemo(() => toyDigest4(guessedSeed), [guessedSeed])

  const reconstructed = useMemo(() => {
    if (selectedPair === '1-2') return reconstruct2of3(1, share1, 2, share2)
    if (selectedPair === '1-3') return reconstruct2of3(1, share1, 3, share3)
    return reconstruct2of3(2, share2, 3, share3)
  }, [selectedPair, share1, share2, share3])

  const reconstructionMatches = toHex(reconstructed) === toHex(SAMPLE_SEED)

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6 space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound className="text-primary" size={20} aria-hidden="true" />
          <h2 className="text-xl font-bold text-gradient">
            W8: Shamir Seed &amp; Hybrid KEM-DEM Envelope Demo
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Interactive GF(256) 2-of-3 secret-sharing lab using a fictional 128-bit sample master
          secret. Compare ideal Shamir t−1 uniformity against SLIP-39’s concrete 4-byte digest
          encoding, then compare RSA/ECDH share wrapping against a hybrid KEM-DEM envelope.
        </p>
      </div>

      {/* Panel 1: Ideal Shamir vs SLIP-39 t-1 behavior */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-base font-bold text-foreground">
          Panel 1: Ideal Shamir (t−1 Shares) vs SLIP-39 Encoding
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-muted/40 border border-border">
            <p className="text-muted-foreground font-sans font-semibold mb-1">Share #1 (x = 1)</p>
            <p className="break-all text-foreground">{toHex(share1)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/40 border border-border">
            <p className="text-muted-foreground font-sans font-semibold mb-1">Share #2 (x = 2)</p>
            <p className="break-all text-foreground">{toHex(share2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/40 border border-border">
            <p className="text-muted-foreground font-sans font-semibold mb-1">Share #3 (x = 3)</p>
            <p className="break-all text-foreground">{toHex(share3)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/30 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-status-success">
              Ideal Shamir over GF(256) with only t−1 = 1 share
            </p>
            <label className="block text-xs text-foreground space-y-1">
              <span>
                Test any candidate for secret byte 0:{' '}
                <code>0x{candidateGuessByte.toString(16).padStart(2, '0')}</code>
              </span>
              <input
                type="range"
                min={0}
                max={255}
                value={candidateGuessByte}
                onChange={(e) => setCandidateGuessByte(Number(e.target.value))}
                className="w-full"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              With only Share #1 (<code>0x{share1[0].toString(16).padStart(2, '0')}</code>), your
              candidate byte <code>0x{candidateGuessByte.toString(16).padStart(2, '0')}</code>{' '}
              corresponds to a valid polynomial slope{' '}
              <code>0x{consistentSlopeForGuess.toString(16).padStart(2, '0')}</code>. Every one of
              the 256 values is mathematically consistent — even an unbounded quantum computer
              learns zero information from t−1 ideal shares.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              SLIP-39 Concrete Encoding (Interpolated 4-Byte Digest)
            </p>
            <p className="text-xs text-muted-foreground">
              SLIP-39 interpolates a 4-byte digest alongside the secret (and wraps it in a
              four-round PBKDF2-HMAC-SHA256 Feistel passphrase layer plus RS1024 checksum). That
              digest gives a validity check on candidate reconstructions:
            </p>
            <div className="text-xs font-mono space-y-1">
              <p>
                True secret digest: <span className="text-foreground">{trueDigest}</span>
              </p>
              <p>
                Candidate digest: <span className="text-foreground">{guessedDigest}</span> (
                {guessedDigest === trueDigest ? 'MATCH' : 'REJECTED'})
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              No Shor attack applies to PBKDF2/HMAC, but Grover gives a quadratic search speedup, so
              weak passphrases or low-entropy secrets stay vulnerable.
            </p>
          </div>
        </div>

        {/* Reconstruct with any 2 shares */}
        <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">
              Reconstruct with t = 2 shares (Lagrange interpolation at x = 0):
            </p>
            <div className="flex gap-2">
              {(['1-2', '1-3', '2-3'] as const).map((pair) => (
                <Button
                  key={pair}
                  variant="ghost"
                  onClick={() => setSelectedPair(pair)}
                  className={`px-2.5 py-1 text-xs rounded border ${
                    selectedPair === pair
                      ? 'bg-primary/15 text-primary border-primary/50'
                      : 'bg-background/60 text-foreground border-border'
                  }`}
                >
                  Shares {pair}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-xs font-mono break-all text-foreground">
            Recovered: {toHex(reconstructed)}{' '}
            <span className="font-sans font-semibold text-status-success">
              ({reconstructionMatches ? 'Exact match to sample secret' : 'Mismatch'})
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Operational limit (not quantum): recovery rebuilds the full seed in one place, and
            SLIP-39’s RS1024 checksum detects typos — it does not authenticate share holders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-12.2" chip="Ideal Shamir" />
          <ClaimLine id="DA-12.1" chip="SLIP-39 Encoding" />
        </div>
      </div>

      {/* Panel 2: Share Envelope (RSA/ECDH vs Hybrid KEM-DEM) & Ceremony Binding */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-primary" aria-hidden="true" />
          <h3 className="text-base font-bold text-foreground">
            Panel 2: Share Envelope (RSA / ECDH vs Hybrid KEM-DEM)
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => setEnvelopeMode('rsa-ecdh')}
            className={`px-3 py-2 text-xs rounded-lg border ${
              envelopeMode === 'rsa-ecdh'
                ? 'bg-status-error/15 text-status-error border-status-error/50 font-semibold'
                : 'bg-muted/40 text-foreground border-border'
            }`}
          >
            Classical RSA-OAEP / ECIES Envelope
          </Button>
          <Button
            variant="ghost"
            onClick={() => setEnvelopeMode('hybrid-kem-dem')}
            className={`px-3 py-2 text-xs rounded-lg border ${
              envelopeMode === 'hybrid-kem-dem'
                ? 'bg-status-success/15 text-status-success border-status-success/50 font-semibold'
                : 'bg-muted/40 text-foreground border-border'
            }`}
          >
            Hybrid KEM-DEM Envelope (ML-KEM + X25519 + HKDF + AEAD)
          </Button>
        </div>

        {envelopeMode === 'rsa-ecdh' ? (
          <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/30 space-y-2">
            <p className="text-xs font-bold text-status-error flex items-center gap-1.5">
              <AlertTriangle size={14} aria-hidden="true" /> HNDL Vulnerable Storage Envelope
            </p>
            <p className="text-xs text-foreground">
              Even though Shamir splitting is information-theoretically safe below t, encrypting
              stored shares with RSA-OAEP or ECDH/ECIES lets an adversary who harvests t ciphertexts
              today decrypt all t shares once a CRQC arrives and rebuild the master seed.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/30 space-y-2">
            <p className="text-xs font-bold text-status-success flex items-center gap-1.5">
              <ShieldCheck size={14} aria-hidden="true" /> Post-Quantum Hybrid KEM-DEM Envelope
            </p>
            <p className="text-xs text-foreground">
              Uses ML-KEM encapsulation combined with X25519 in HPKE (draft-ietf-hpke-pq), a KDF,
              and an AEAD cipher (e.g., AES-256-GCM) to protect stored share backups. Note: a bare
              KEM-DEM envelope is for stored backups — live MPC peer channels still require
              authenticated, transcript-bound hybrid TLS (RFC 10024).
            </p>
          </div>
        )}

        <label className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border cursor-pointer">
          <input
            type="checkbox"
            checked={bindCeremonyMetadata}
            onChange={(e) => setBindCeremonyMetadata(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-xs text-foreground">
            <strong>Authenticate share + bind ceremony metadata:</strong> sign (share index,
            ceremony ID, holder ID, envelope version) with ML-DSA or SLH-DSA.
          </span>
        </label>

        <ReadingNote title="Why bare per-share signatures are not enough">
          {bindCeremonyMetadata ? (
            <p>
              Binding share index, ceremony ID, holder identity, and metadata inside the ML-DSA /
              SLH-DSA signature prevents cross-ceremony share substitution and detects tampered
              backup envelopes during recovery.
            </p>
          ) : (
            <p>
              Warning: a bare signature over raw share bytes alone does not stop an attacker from
              substituting a valid share from a different ceremony or swapping holder indices.
              Enable ceremony metadata binding above.
            </p>
          )}
        </ReadingNote>

        <ClaimLine id="DA-12.8" chip="Hybrid KEM-DEM" />
      </div>
    </div>
  )
}
