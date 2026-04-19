// SPDX-License-Identifier: GPL-3.0-only
//
// SshLearnSection — Role explainer + 8-step PQC handshake diagram.
// Port of sandbox SSHLearnSection restyled with Hub semantic tokens.

import { useState } from 'react'
import { ChevronDown, ChevronRight, ShieldCheck, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Role card data ─────────────────────────────────────────────────────────────

interface RoleData {
  id: string
  label: string
  classical: {
    algo: string
    pubkeyBytes?: number
    sigBytes?: number
    mechanism: string
    note: string
  }
  pqc: { algo: string; pubkeyBytes?: number; sigBytes?: number; mechanism: string; note: string }
  why: string
}

const ROLES: RoleData[] = [
  {
    id: 'host',
    label: 'Host key (sshd identity)',
    classical: {
      algo: 'ssh-ed25519',
      pubkeyBytes: 32,
      sigBytes: 64,
      mechanism: 'CKM_EDDSA',
      note: 'Stored in /etc/ssh/ssh_host_ed25519_key',
    },
    pqc: {
      algo: 'ssh-mldsa-65',
      pubkeyBytes: 1952,
      sigBytes: 3309,
      mechanism: 'CKM_ML_DSA (0x1d)',
      note: 'Private key never leaves softhsmv3 token',
    },
    why: 'The host key authenticates the server to the client during KEX. Harvest-now-decrypt-later attacks targeting the KEX signature require quantum-safe host keys.',
  },
  {
    id: 'client',
    label: 'Client user key',
    classical: {
      algo: 'ssh-ed25519',
      pubkeyBytes: 32,
      sigBytes: 64,
      mechanism: 'CKM_EDDSA',
      note: 'Typically via ssh-agent or ~/.ssh/id_ed25519',
    },
    pqc: {
      algo: 'ssh-mldsa-65',
      pubkeyBytes: 1952,
      sigBytes: 3309,
      mechanism: 'pkcs11_sign_mldsa',
      note: 'Delegated to softhsmv3 via PKCS#11 v3.2',
    },
    why: 'Userauth signatures authenticate the client to the server. A quantum adversary recording SSH sessions today could forge userauth signatures in the future.',
  },
  {
    id: 'softhsm',
    label: 'softhsmv3 (PKCS#11 v3.2 token)',
    classical: {
      algo: 'Ed25519 / ECDSA',
      mechanism: 'CKM_EDDSA / CKM_ECDSA',
      note: 'Ed25519 keys via C_GenerateKeyPair (CKK_EC_EDWARDS)',
    },
    pqc: {
      algo: 'ML-DSA-65 (FIPS 204)',
      mechanism: 'CKM_ML_DSA (0x1d) + CKM_ML_DSA_KEY_PAIR_GEN (0x1c)',
      note: 'PKCS#11 v3.2 post-quantum mechanisms',
    },
    why: 'The PKCS#11 token enforces a strict key boundary — private key bytes are never exposed to the SSH process. This is required for FIPS 140-3 and Common Criteria compliance.',
  },
]

// ── Handshake steps ───────────────────────────────────────────────────────────

const STEPS = [
  { step: 1, from: 'client', to: 'agent', msg: 'C_FindObjects (CKK_ML_DSA)', bytes: '—' },
  { step: 2, from: 'client', to: 'sshd', msg: 'TCP + SSH_MSG_KEXINIT', bytes: '—' },
  { step: 3, from: 'sshd', to: 'agent', msg: 'HostKeyAgent lookup', bytes: '—' },
  {
    step: 4,
    from: 'sshd',
    to: 'token',
    msg: 'C_SignInit / C_Sign (host KEX sig)',
    bytes: '3,309 B',
  },
  {
    step: 5,
    from: 'sshd',
    to: 'client',
    msg: 'SSH_MSG_KEX_ECDH_REPLY + host-key blob',
    bytes: '1,952 + 3,309 B',
  },
  {
    step: 6,
    from: 'client',
    to: 'sshd',
    msg: 'SSH_MSG_USERAUTH_REQUEST (publickey probe)',
    bytes: '1,952 B',
  },
  {
    step: 7,
    from: 'client',
    to: 'token',
    msg: 'C_SignInit / C_Sign (client auth sig)',
    bytes: '3,309 B',
  },
  {
    step: 8,
    from: 'client',
    to: 'sshd',
    msg: 'SSH_MSG_USERAUTH_REQUEST (with sig) → USERAUTH_SUCCESS',
    bytes: '3,309 B',
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function RolePanel({ role }: { role: RoleData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      {/* Classical */}
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1.5">
        <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider">
          Classical
        </p>
        <p className="text-sm font-mono text-foreground">{role.classical.algo}</p>
        {role.classical.pubkeyBytes !== undefined && (
          <p className="text-xs text-muted-foreground">
            Pubkey: {role.classical.pubkeyBytes} B · Sig: {role.classical.sigBytes} B
          </p>
        )}
        <p className="text-xs font-mono text-muted-foreground">{role.classical.mechanism}</p>
        <p className="text-xs text-muted-foreground italic">{role.classical.note}</p>
      </div>

      {/* PQC */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
          PQC (FIPS 204)
        </p>
        <p className="text-sm font-mono text-foreground">{role.pqc.algo}</p>
        {role.pqc.pubkeyBytes !== undefined && (
          <p className="text-xs text-muted-foreground">
            Pubkey: {role.pqc.pubkeyBytes.toLocaleString()} B · Sig:{' '}
            {role.pqc.sigBytes?.toLocaleString()} B
          </p>
        )}
        <p className="text-xs font-mono text-muted-foreground">{role.pqc.mechanism}</p>
        <p className="text-xs text-muted-foreground italic">{role.pqc.note}</p>
      </div>

      {/* Why it matters */}
      <div className="md:col-span-2 rounded-lg border border-border/40 bg-muted/20 p-2.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Why this matters
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{role.why}</p>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SshLearnSection() {
  const [rolesOpen, setRolesOpen] = useState(false)
  const [diagramOpen, setDiagramOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {/* ── Section 1: Key Roles ── */}
      <div className="glass-panel overflow-hidden">
        <Button
          variant="ghost"
          onClick={() => setRolesOpen((v) => !v)}
          className="w-full flex items-center gap-2 text-sm font-semibold py-3 px-4 justify-start"
          aria-expanded={rolesOpen}
        >
          {rolesOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span className="text-gradient">SSH Key Roles — Classical vs PQC</span>
        </Button>

        {rolesOpen && (
          <div className="px-4 pb-4 space-y-3">
            {/* Role toggle buttons */}
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <Button
                  key={role.id}
                  variant={selectedRole === role.id ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
                  className="text-xs"
                >
                  {role.label}
                </Button>
              ))}
            </div>

            {/* Selected role panel */}
            {selectedRole &&
              (() => {
                const role = ROLES.find((r) => r.id === selectedRole)
                return role ? <RolePanel role={role} /> : null
              })()}

            {!selectedRole && (
              <p className="text-xs text-muted-foreground italic">
                Select a role above to compare classical and PQC algorithms side by side.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Section 2: Handshake Diagram ── */}
      <div className="glass-panel overflow-hidden">
        <Button
          variant="ghost"
          onClick={() => setDiagramOpen((v) => !v)}
          className="w-full flex items-center gap-2 text-sm font-semibold py-3 px-4 justify-start"
          aria-expanded={diagramOpen}
        >
          {diagramOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <Network className="w-4 h-4 text-primary shrink-0" />
          <span className="text-gradient">SSH Handshake — PQC lane</span>
        </Button>

        {diagramOpen && (
          <div className="px-4 pb-4 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold w-8">
                    #
                  </th>
                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold whitespace-nowrap">
                    From → To
                  </th>
                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold">
                    Message / Operation
                  </th>
                  <th className="text-right py-1.5 text-muted-foreground font-semibold whitespace-nowrap">
                    Byte size
                  </th>
                </tr>
              </thead>
              <tbody>
                {STEPS.map((s) => (
                  <tr
                    key={s.step}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                  >
                    <td className="py-1.5 pr-3 font-mono text-muted-foreground">{s.step}</td>
                    <td className="py-1.5 pr-3 font-mono text-foreground whitespace-nowrap">
                      <span className="text-primary">{s.from}</span>
                      <span className="text-muted-foreground mx-1">→</span>
                      <span className="text-accent">{s.to}</span>
                    </td>
                    <td className="py-1.5 pr-3 text-foreground/80">{s.msg}</td>
                    <td className="py-1.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                      {s.bytes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Byte sizes are FIPS 204 ML-DSA-65 wire values. KEX uses ML-KEM-768 × X25519 hybrid
              (RFC 9370 / draft-connolly-tls-mlkem-key-agreement).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
