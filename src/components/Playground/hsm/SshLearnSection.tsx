// SPDX-License-Identifier: GPL-3.0-only
//
// SshLearnSection — educational reference panels for the SSH simulator.

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Network,
  Key,
  BookOpen,
  Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import { SSH_KEX_ALGORITHMS } from '@/components/PKILearning/modules/VPNSSHModule/data/sshConstants'

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

// ── SSH-2 Transport phases ────────────────────────────────────────────────────

const PHASES = [
  { label: 'TCP', note: 'Connection established', msgNum: null },
  { label: 'Version', note: 'SSH-2.0 banner exchange', msgNum: null },
  { label: 'KEXINIT', note: 'Algorithm negotiation', msgNum: 20 },
  { label: 'KEX_ECDH_INIT', note: 'Client sends KEM/DH share', msgNum: 30 },
  { label: 'KEX_ECDH_REPLY', note: 'Server sends reply + host sig', msgNum: 31 },
  { label: 'NEWKEYS', note: 'Switch to derived keys', msgNum: 21 },
  { label: 'SERVICE_REQUEST', note: 'Request ssh-userauth', msgNum: 5 },
  { label: 'USERAUTH_REQUEST', note: 'Client auth + signature', msgNum: 50 },
  { label: 'USERAUTH_SUCCESS', note: 'Authentication accepted', msgNum: 52 },
]

// ── Operator cheat sheet snippet ──────────────────────────────────────────────

const CHEAT_SHEET = `# ~/.ssh/config — PQC-first OpenSSH 9.9+ configuration
Host *.example.com
  PKCS11Provider /usr/lib/softhsm/libsofthsm2.so
  KexAlgorithms ^mlkem768x25519-sha256,sntrup761x25519-sha512
  HostKeyAlgorithms ssh-mldsa-65,ssh-ed25519
  PubkeyAuthentication yes`

// ── Sub-components ────────────────────────────────────────────────────────────

function RolePanel({ role }: { role: RoleData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
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

      <div className="md:col-span-2 rounded-lg border border-border/40 bg-muted/20 p-2.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Why this matters
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{role.why}</p>
      </div>
    </div>
  )
}

function SectionToggle({
  label,
  icon: Icon,
  open,
  onToggle,
}: {
  label: string
  icon: React.ElementType
  open: boolean
  onToggle: () => void
}) {
  return (
    <Button
      variant="ghost"
      onClick={onToggle}
      className="w-full flex items-center gap-2 text-sm font-semibold py-3 px-4 justify-start"
      aria-expanded={open}
    >
      {open ? (
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <span className="text-gradient">{label}</span>
    </Button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SshLearnSection() {
  const [rolesOpen, setRolesOpen] = useState(false)
  const [phasesOpen, setPhasesOpen] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [trustOpen, setTrustOpen] = useState(false)
  const [cheatOpen, setCheatOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {/* ── Section 1: Key Roles ── */}
      <div className="glass-panel overflow-hidden">
        <SectionToggle
          label="SSH Key Roles — Classical vs PQC"
          icon={ShieldCheck}
          open={rolesOpen}
          onToggle={() => setRolesOpen((v) => !v)}
        />

        {rolesOpen && (
          <div className="px-4 pb-4 space-y-3">
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

      {/* ── Section 2: SSH-2 Transport Phases ── */}
      <div className="glass-panel overflow-hidden">
        <SectionToggle
          label="SSH-2 Transport Phases"
          icon={Network}
          open={phasesOpen}
          onToggle={() => setPhasesOpen((v) => !v)}
        />

        {phasesOpen && (
          <div className="px-4 pb-4 overflow-x-auto">
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PHASES.map((p, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="rounded border border-border/60 bg-muted/30 px-2 py-1 text-center min-w-[80px]">
                    <p className="text-xs font-semibold text-foreground">{p.label}</p>
                    {p.msgNum !== null && (
                      <p className="text-[10px] font-mono text-primary">msg {p.msgNum}</p>
                    )}
                    <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                      {p.note}
                    </p>
                  </div>
                  {i < PHASES.length - 1 && (
                    <span className="text-muted-foreground text-xs">→</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              RFC 4253 message numbers shown in monospace. KEX_ECDH_INIT (30) / KEX_ECDH_REPLY (31)
              carry the hybrid ML-KEM-768 + X25519 shares in PQC mode.
            </p>
          </div>
        )}
      </div>

      {/* ── Section 3: Migration Timeline ── */}
      <div className="glass-panel overflow-hidden">
        <SectionToggle
          label="OpenSSH PQC Migration Timeline"
          icon={Key}
          open={timelineOpen}
          onToggle={() => setTimelineOpen((v) => !v)}
        />

        {timelineOpen && (
          <div className="px-4 pb-4">
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold">
                    Algorithm
                  </th>
                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold">
                    OpenSSH
                  </th>
                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold">
                    Spec
                  </th>
                  <th className="text-left py-1.5 text-muted-foreground font-semibold">
                    Quantum-safe
                  </th>
                </tr>
              </thead>
              <tbody>
                {SSH_KEX_ALGORITHMS.map((kex) => (
                  <tr
                    key={kex.id}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                  >
                    <td className="py-1.5 pr-3 font-mono text-foreground">{kex.id}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{kex.opensshVersion}</td>
                    <td className="py-1.5 pr-3 font-mono text-muted-foreground text-[10px]">
                      {kex.rfcOrDraft}
                    </td>
                    <td className="py-1.5">
                      {kex.quantumSafe ? (
                        <span className="text-status-success">✓</span>
                      ) : (
                        <span className="text-status-error">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 4: Host Trust & TOFU ── */}
      <div className="glass-panel overflow-hidden">
        <SectionToggle
          label="Host Trust & TOFU"
          icon={BookOpen}
          open={trustOpen}
          onToggle={() => setTrustOpen((v) => !v)}
        />

        {trustOpen && (
          <div className="px-4 pb-4 space-y-3 text-xs text-muted-foreground leading-relaxed mt-2">
            <p>
              On first connection, SSH stores the server&apos;s host public key fingerprint in{' '}
              <span className="font-mono text-foreground">~/.ssh/known_hosts</span> — the
              Trust-On-First-Use (TOFU) model. Subsequent connections verify the fingerprint to
              detect impersonation or key replacement.
            </p>
            <p>
              In PQC deployments the fingerprint covers an ML-DSA-65 public key (1,952 bytes vs 32
              bytes for Ed25519), so <span className="font-mono text-foreground">known_hosts</span>{' '}
              entries are significantly larger. Use{' '}
              <span className="font-mono text-foreground">ssh-keygen -lf</span> to display the
              fingerprint.
            </p>
            <p>
              For enterprise deployments, replace TOFU with an{' '}
              <span className="font-mono text-foreground">@cert-authority</span> entry in{' '}
              <span className="font-mono text-foreground">known_hosts</span>. The SSH CA signs host
              certificates; clients trust the CA key rather than individual host keys. This approach
              pairs well with HSM-backed CA keys to ensure the root authority is hardware-protected.
            </p>
          </div>
        )}
      </div>

      {/* ── Section 5: Operator Cheat Sheet ── */}
      <div className="glass-panel overflow-hidden">
        <SectionToggle
          label="Operator Cheat Sheet"
          icon={Terminal}
          open={cheatOpen}
          onToggle={() => setCheatOpen((v) => !v)}
        />

        {cheatOpen && (
          <div className="px-4 pb-4 mt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Example <span className="font-mono text-foreground">~/.ssh/config</span> that prefers
              PQC algorithms via softhsmv3 PKCS#11 provider (OpenSSH 9.9+).
            </p>
            <CodeBlock language="text" code={CHEAT_SHEET} />
          </div>
        )}
      </div>
    </div>
  )
}
