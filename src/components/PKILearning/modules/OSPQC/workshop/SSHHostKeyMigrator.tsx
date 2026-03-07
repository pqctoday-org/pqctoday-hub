// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SSH_HOST_KEY_TYPES } from '../data/osConstants'

interface MigrationStep {
  id: number
  title: string
  description: string
  command: string
  output: string
  warning?: string
}

const MIGRATION_STEPS: MigrationStep[] = [
  {
    id: 1,
    title: 'Generate ML-DSA-65 Host Key',
    description:
      'Generate a new ML-DSA-65 (ssh-mldsa65) host key. This requires OpenSSH 10.0+ with liboqs support, or the OpenSSH experimental PQC branch.',
    command: `# On the SSH server (requires OpenSSH 10.0+ with PQC support):
sudo ssh-keygen -t mldsa65 -f /etc/ssh/ssh_host_mldsa65_key -N ""

# Verify the key was created:
sudo ls -la /etc/ssh/ssh_host_mldsa65_key*
# Expected output:
# /etc/ssh/ssh_host_mldsa65_key       (private key, 4,032 bytes)
# /etc/ssh/ssh_host_mldsa65_key.pub   (public key, 1,952 bytes)

# View the public key fingerprint:
sudo ssh-keygen -lf /etc/ssh/ssh_host_mldsa65_key.pub`,
    output: `# Expected fingerprint output:
256 SHA256:AbCdEfGhIjKlMnOpQrStUvWxYz0123456789= root@server (MLDSA65)
# Note: bit count shown is nominal — ML-DSA-65 is NIST Level 3`,
    warning:
      'ML-DSA-65 host keys are only supported in OpenSSH 10.0+ experimental branch (as of March 2026). Production deployment requires waiting for upstream OpenSSH release.',
  },
  {
    id: 2,
    title: 'Update sshd_config',
    description:
      'Add the ML-DSA-65 host key to the SSH server configuration. Keep existing keys for backward compatibility with clients that do not yet support PQC.',
    command: `# Edit /etc/ssh/sshd_config:
sudo nano /etc/ssh/sshd_config

# Add/update HostKey directives (order matters — PQC first):
HostKey /etc/ssh/ssh_host_mldsa65_key     # New: ML-DSA-65 (PQC)
HostKey /etc/ssh/ssh_host_ed25519_key     # Keep: Ed25519 (classical fallback)
HostKey /etc/ssh/ssh_host_ecdsa_key       # Keep: ECDSA-256 (legacy)
# Optional: remove RSA (deprecated in OpenSSH 9.0)
# HostKey /etc/ssh/ssh_host_rsa_key

# Validate config and restart:
sudo sshd -t
sudo systemctl restart sshd`,
    output: `# Verify new host keys are loaded:
sudo ssh-keygen -lf /etc/ssh/ssh_host_mldsa65_key.pub
256 SHA256:AbCdEfGh... root@server (MLDSA65)

sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
256 SHA256:XyZaBcDe... root@server (ED25519)`,
  },
  {
    id: 3,
    title: 'Update known_hosts',
    description:
      'Remove the old server fingerprint from client known_hosts files and add the new ML-DSA-65 fingerprint. Automate with ssh-keyscan for bulk updates.',
    command: `# On each SSH client — remove old host entry:
ssh-keygen -R server.example.com
# Output: /home/user/.ssh/known_hosts updated.
#         Original contents retained as /home/user/.ssh/known_hosts.old

# Option 1: Manual — trust on first connect:
ssh admin@server.example.com
# "The authenticity of host 'server.example.com' can't be established."
# "MLDSA65 key fingerprint is SHA256:AbCdEfGh..."
# Type 'yes' to add

# Option 2: Automated via ssh-keyscan (for scripts/Ansible):
ssh-keyscan -t mldsa65 server.example.com >> ~/.ssh/known_hosts

# Option 3: Fleet management — distribute known_hosts via Ansible:
# ansible-playbook update-known-hosts.yml -e "new_fp=SHA256:AbCdEfGh..."`,
    output: `# Known_hosts entry format for ML-DSA-65:
server.example.com ssh-mldsa65 AAAAB3Nza...7Kp2Q== (1,952 bytes public key)
# Compare to Ed25519 entry (32 bytes):
server.example.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... (32 bytes)`,
  },
  {
    id: 4,
    title: 'Verify Client Compatibility',
    description:
      'Test which SSH clients can connect with the ML-DSA-65 host key. Maintain Ed25519 fallback until all clients are upgraded.',
    command: `# Test connection from different clients:

# OpenSSH 10.0+ (PQC-capable):
ssh -v admin@server.example.com 2>&1 | grep "host key algorithm"
# debug1: host key algorithm: ssh-mldsa65

# OpenSSH 8.x-9.x (classical only — falls back to ed25519):
ssh -v admin@server.example.com 2>&1 | grep "host key algorithm"
# debug1: host key algorithm: ssh-ed25519

# PuTTY 0.82+ (PQC host key support — check release notes):
# (Use PuTTYgen to verify ML-DSA key type is recognized)

# Test with explicit host key algorithm preference:
ssh -o "HostKeyAlgorithms=ssh-mldsa65,ssh-ed25519" admin@server.example.com`,
    output: `# Connection summary:
# ML-KEM hybrid KEX: sntrup761x25519-sha512@openssh.com (OpenSSH 8.5+)
# or: mlkem768x25519-sha256 (IETF draft, experimental)
# Host auth: ssh-mldsa65 (OpenSSH 10.0+) or ssh-ed25519 (fallback)`,
    warning:
      'As of March 2026, no production SSH client supports ssh-mldsa65 host keys. Only OpenSSH experimental branch has this support. Plan for 2026-2027 production availability.',
  },
]

const SSH_CLIENT_COMPAT = [
  {
    client: 'OpenSSH 10.0+ (experimental PQC)',
    mlDsaHostKey: 'yes',
    mlKemKex: 'yes',
    status: 'experimental',
  },
  {
    client: 'OpenSSH 9.x (current stable)',
    mlDsaHostKey: 'no',
    mlKemKex: 'partial',
    status: 'stable',
  },
  { client: 'OpenSSH 8.5-8.9', mlDsaHostKey: 'no', mlKemKex: 'no', status: 'outdated' },
  { client: 'PuTTY 0.82+', mlDsaHostKey: 'planned', mlKemKex: 'no', status: 'planning' },
  { client: 'WinSCP 6.x', mlDsaHostKey: 'no', mlKemKex: 'no', status: 'not-planned' },
  { client: 'FileZilla 3.x', mlDsaHostKey: 'no', mlKemKex: 'no', status: 'not-planned' },
  { client: 'Paramiko (Python) 3.x', mlDsaHostKey: 'no', mlKemKex: 'planned', status: 'planning' },
  { client: 'SSH.NET (C#) 2024+', mlDsaHostKey: 'no', mlKemKex: 'no', status: 'not-planned' },
]

type StatusValue = 'yes' | 'no' | 'partial' | 'planned'

const SUPPORT_BADGE: Record<StatusValue, { label: string; className: string }> = {
  yes: {
    label: 'Yes',
    className: 'text-status-success bg-status-success/10 border-status-success/30',
  },
  no: { label: 'No', className: 'text-muted-foreground bg-muted border-border' },
  partial: {
    label: 'Partial',
    className: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  },
  planned: {
    label: 'Planned',
    className: 'text-status-info bg-status-info/10 border-status-info/30',
  },
}

export const SSHHostKeyMigrator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const markComplete = (stepId: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]))
    if (currentStep < MIGRATION_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const step = MIGRATION_STEPS[currentStep]

  return (
    <div className="space-y-6">
      {/* Key type comparison */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">
          SSH Host Key Types: Classical vs PQC
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Key Type</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Algorithm</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">Pub Key</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                  Signature
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  Quantum Safe
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium hidden md:table-cell">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {SSH_HOST_KEY_TYPES.map((key) => (
                <tr key={key.id} className="border-b border-border/50">
                  <td className="py-2 px-2 font-mono text-foreground">{key.keyType}</td>
                  <td className="py-2 px-2 text-muted-foreground">{key.algorithm}</td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {key.publicKeyBytes.toLocaleString()} B
                  </td>
                  <td className="py-2 px-2 text-right text-foreground">
                    {key.signatureBytes.toLocaleString()} B
                  </td>
                  <td className="py-2 px-2 text-center">
                    {key.quantumSafe ? (
                      <CheckCircle size={14} className="text-status-success mx-auto" />
                    ) : (
                      <AlertTriangle size={14} className="text-status-warning mx-auto" />
                    )}
                  </td>
                  <td className="py-2 px-2 text-[10px] text-muted-foreground hidden md:table-cell">
                    {key.rfcStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-3 bg-status-info/5 rounded border border-status-info/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Draft RFC status:</strong> The IETF SSHM Working
            Group is actively developing{' '}
            <span className="font-mono text-primary">draft-ietf-sshm-mldsa</span> for ssh-mldsa44,
            ssh-mldsa65, and ssh-mldsa87 key types. Hybrid ssh-ecdsa-nistp256-mldsa65 also in draft.
            Expected standardization: 2026.
          </p>
        </div>
      </div>

      {/* Step-by-step wizard */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-4">Migration Wizard</div>

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          {MIGRATION_STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold shrink-0 transition-colors ${
                  completedSteps.has(s.id)
                    ? 'border-status-success bg-status-success/10 text-status-success'
                    : idx === currentStep
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                }`}
              >
                {completedSteps.has(s.id) ? <CheckCircle size={14} /> : idx + 1}
              </button>
              {idx < MIGRATION_STEPS.length - 1 && (
                <div className="h-0.5 flex-1 min-w-4 bg-border" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Current step */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
              Step {step.id} of {MIGRATION_STEPS.length}
            </span>
            <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{step.description}</p>

          {step.warning && (
            <div className="flex items-start gap-2 p-3 bg-status-warning/5 rounded border border-status-warning/20 mb-3">
              <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{step.warning}</p>
            </div>
          )}

          <pre className="text-[11px] bg-background p-3 rounded border border-border overflow-x-auto font-mono whitespace-pre text-foreground mb-2">
            {step.command}
          </pre>

          <div className="bg-muted/30 rounded p-3 border border-border mb-4">
            <div className="text-[10px] font-bold text-muted-foreground mb-1">Expected Output:</div>
            <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre overflow-x-auto">
              {step.output}
            </pre>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              &larr; Previous
            </Button>
            <Button
              variant={completedSteps.has(step.id) ? 'outline' : 'default'}
              size="sm"
              onClick={() => markComplete(step.id)}
              className="flex items-center gap-2"
            >
              {completedSteps.has(step.id) ? (
                <>
                  <CheckCircle size={14} /> Done
                </>
              ) : (
                <>
                  Mark Complete <ChevronRight size={14} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Client compatibility matrix */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">
          SSH Client Compatibility Matrix
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  SSH Client
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  ML-DSA Host Key
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  ML-KEM KEX
                </th>
              </tr>
            </thead>
            <tbody>
              {SSH_CLIENT_COMPAT.map((client) => {
                const mlDsaBadge = SUPPORT_BADGE[client.mlDsaHostKey as StatusValue]
                const mlKemBadge = SUPPORT_BADGE[client.mlKemKex as StatusValue]
                return (
                  <tr key={client.client} className="border-b border-border/50">
                    <td className="py-2 px-2 text-foreground">{client.client}</td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${mlDsaBadge.className}`}
                      >
                        {mlDsaBadge.label}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${mlKemBadge.className}`}
                      >
                        {mlKemBadge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          <Clock size={10} className="inline mr-1" />
          ML-DSA host key support is still experimental (March 2026). Maintain Ed25519 fallback keys
          until all clients in your environment support PQC key types.
        </p>
      </div>
    </div>
  )
}
