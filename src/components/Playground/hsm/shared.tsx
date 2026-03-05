// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared UI primitives for all HSM operation panels.
 */
import { Shield } from 'lucide-react'
import { Button } from '../../ui/button'
import { useSettingsContext } from '../contexts/SettingsContext'
import type { HsmFamily, HsmKeyRole } from './HsmContext'

// ── HsmReadyGuard ─────────────────────────────────────────────────────────────

/** Renders a prompt to complete HSM setup if the session is not ready. */
export const HsmReadyGuard = ({
  children,
  isReady,
}: {
  children: React.ReactNode
  isReady: boolean
}) => {
  const { setActiveTab } = useSettingsContext()
  if (isReady) return <>{children}</>
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <Shield size={32} className="text-muted-foreground" />
      <div>
        <p className="font-semibold text-foreground">HSM session not ready</p>
        <p className="text-sm text-muted-foreground mt-1">
          Complete the token setup before running PKCS#11 operations.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => setActiveTab('keystore')}>
        Go to HSM Setup
      </Button>
    </div>
  )
}

// ── HsmResultRow ──────────────────────────────────────────────────────────────

/** Displays a key/value result row with optional byte count. */
export const HsmResultRow = ({
  label,
  value,
  mono = true,
}: {
  label: string
  value: string
  mono?: boolean
}) => (
  <div className="flex items-center gap-3 text-xs bg-muted rounded-lg px-3 py-1.5">
    <span className="text-muted-foreground w-28 shrink-0">{label}</span>
    <span className={`flex-1 truncate ${mono ? 'font-mono' : ''} text-foreground`}>{value}</span>
  </div>
)

// ── makeHsmKeyLabel ───────────────────────────────────────────────────────────

/** Generate a human-readable label for an HSM key entry. */
export const makeHsmKeyLabel = (family: HsmFamily, role: HsmKeyRole, variant?: string): string => {
  const familyLabel: Record<HsmFamily, string> = {
    'ml-kem': 'ML-KEM',
    'ml-dsa': 'ML-DSA',
    'slh-dsa': 'SLH-DSA',
    rsa: 'RSA',
    ecdsa: 'ECDSA',
    eddsa: 'EdDSA',
    ecdh: 'ECDH',
    kdf: 'KDF',
    aes: 'AES',
    hmac: 'HMAC',
    sha: 'SHA',
  }
  const roleLabel: Record<HsmKeyRole, string> = {
    public: 'Public Key',
    private: 'Private Key',
    secret: 'Secret Key',
  }
  const name = variant ? `${familyLabel[family]}-${variant}` : familyLabel[family]
  return `${name} ${roleLabel[role]}`
}

// ── HsmKeyBadge ───────────────────────────────────────────────────────────────

/** Compact badge showing a PKCS#11 key handle. */
export const HsmKeyBadge = ({ handle, label }: { handle: number; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary rounded px-2 py-0.5 font-mono">
    <span className="text-muted-foreground">h={handle}</span>
    <span>{label}</span>
  </span>
)

// ── toHex helper ──────────────────────────────────────────────────────────────

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

export const hexSnippet = (bytes: Uint8Array, maxLen = 20): string => {
  const h = toHex(bytes)
  return h.length > maxLen * 2 ? `${h.slice(0, maxLen)}…${h.slice(-8)}` : h
}
