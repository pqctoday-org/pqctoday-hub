// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo } from 'react'
import {
  OpsConfigGenerator,
  type ConfigSelection,
} from '@/components/PKILearning/common/OpsConfigGenerator'

const selections: ConfigSelection[] = [
  {
    id: 'configType',
    label: 'Config Type',
    options: [
      { value: 'sshd_config', label: 'sshd_config (Server)' },
      { value: 'ssh_config', label: 'ssh_config (Client)' },
    ],
    defaultValue: 'sshd_config',
  },
  {
    id: 'mode',
    label: 'PQC Mode',
    options: [
      { value: 'classical', label: 'Classical' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'pure-pqc', label: 'PQC only (no classical fallback)' },
    ],
    defaultValue: 'hybrid',
  },
]

function modeLabel(mode: string): string {
  if (mode === 'pure-pqc') return 'PQC Only, No Classical Fallback'
  if (mode === 'hybrid') return 'Hybrid Mode'
  return 'Classical Mode'
}

function generateSshdConfig(mode: string): string {
  const header = `# PQC SSH Server Configuration (${modeLabel(mode)})\n# File: /etc/ssh/sshd_config\n`

  if (mode === 'classical') {
    return (
      header +
      `
# Key exchange algorithms — classical only
# curve25519-sha256: modern elliptic-curve Diffie-Hellman
# diffie-hellman-group16-sha512: classical DH with 4096-bit group
KexAlgorithms curve25519-sha256,diffie-hellman-group16-sha512

# Host key algorithms for server identity
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256

# Accepted public key algorithms for client authentication
PubkeyAcceptedAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256

# Disable older MACs and ciphers
Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com`
    )
  }

  if (mode === 'hybrid') {
    return (
      header +
      `# Requires OpenSSH 9.9+ on this server: older versions reject the unknown
# name mlkem768x25519-sha256 (on 9.0-9.8, delete it from the list below)

# Key exchange algorithms — hybrid PQC + classical, in preference order
# mlkem768x25519-sha256: ML-KEM-768 (FIPS 203) combined with X25519
#   (OpenSSH 9.9+; the default from OpenSSH 10.0)
# sntrup761x25519-sha512@openssh.com: Streamlined NTRU Prime with X25519 (OpenSSH 9.0+)
# curve25519-sha256: classical fallback for clients without PQC support
KexAlgorithms mlkem768x25519-sha256,sntrup761x25519-sha512@openssh.com,curve25519-sha256

# Host key algorithms for server identity
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512

# Accepted public key algorithms for client authentication
PubkeyAcceptedAlgorithms ssh-ed25519,rsa-sha2-512

# Disable older MACs and ciphers
Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com`
    )
  }

  // pure-pqc
  return (
    header +
    `# Requires OpenSSH 9.9+ on this server
# OpenSSH has no pure post-quantum key exchange: both methods below combine a
# PQC algorithm with X25519. This profile drops the classical-only fallback.
# WARNING: clients without a PQC key exchange will fail to connect

# Key exchange algorithms — PQC hybrids only
# mlkem768x25519-sha256: ML-KEM-768 (FIPS 203) combined with X25519
# sntrup761x25519-sha512@openssh.com: Streamlined NTRU Prime with X25519
KexAlgorithms mlkem768x25519-sha256,sntrup761x25519-sha512@openssh.com

# Host key algorithms — this profile changes key exchange only.
# OpenSSH 10.6+ enables the hybrid ssh-mldsa44-ed25519 host and user keys
# (experimental in 10.4 under a different name; regenerate 10.4 keys).
HostKeyAlgorithms ssh-ed25519

# Accepted public key algorithms for client authentication
PubkeyAcceptedAlgorithms ssh-ed25519

# Disable older MACs and ciphers
Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com`
  )
}

function generateSshClientConfig(mode: string): string {
  const header = `# PQC SSH Client Configuration (${modeLabel(mode)})\n# File: ~/.ssh/config\n`

  if (mode === 'classical') {
    return (
      header +
      `
Host *
    # Key exchange algorithms — classical only
    # curve25519-sha256: modern elliptic-curve Diffie-Hellman
    # diffie-hellman-group16-sha512: classical DH with 4096-bit group
    KexAlgorithms curve25519-sha256,diffie-hellman-group16-sha512

    # Host key algorithms the client will accept from servers
    HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256

    # Public key algorithms for client authentication
    PubkeyAcceptedAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256

    # Preferred ciphers and MACs
    Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com
    MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com`
    )
  }

  if (mode === 'hybrid') {
    return (
      header +
      `# Requires OpenSSH 9.9+ on this client: older versions reject the unknown
# name mlkem768x25519-sha256 (on 9.0-9.8, delete it from the list below)

Host *
    # Key exchange algorithms — hybrid PQC + classical, in preference order
    # mlkem768x25519-sha256: ML-KEM-768 (FIPS 203) combined with X25519
    # sntrup761x25519-sha512@openssh.com: Streamlined NTRU Prime with X25519
    # curve25519-sha256: classical fallback for servers without PQC support
    KexAlgorithms mlkem768x25519-sha256,sntrup761x25519-sha512@openssh.com,curve25519-sha256

    # Host key algorithms the client will accept from servers
    HostKeyAlgorithms ssh-ed25519,rsa-sha2-512

    # Public key algorithms for client authentication
    PubkeyAcceptedAlgorithms ssh-ed25519,rsa-sha2-512

    # Preferred ciphers and MACs
    Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com
    MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com`
    )
  }

  // pure-pqc
  return (
    header +
    `# Requires OpenSSH 9.9+ on this client
# OpenSSH has no pure post-quantum key exchange: both methods below combine a
# PQC algorithm with X25519. This profile drops the classical-only fallback.

Host *
    # Key exchange algorithms — PQC hybrids only
    # mlkem768x25519-sha256: ML-KEM-768 (FIPS 203) combined with X25519
    # sntrup761x25519-sha512@openssh.com: Streamlined NTRU Prime with X25519
    # WARNING: servers without a PQC key exchange will reject this connection
    KexAlgorithms mlkem768x25519-sha256,sntrup761x25519-sha512@openssh.com

    # Host key algorithms — ed25519 until PQC host keys are standardized
    HostKeyAlgorithms ssh-ed25519

    # Public key algorithms for client authentication
    PubkeyAcceptedAlgorithms ssh-ed25519

    # Preferred ciphers and MACs
    Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com
    MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com`
  )
}

export function generateConfig(values: Record<string, string>): string {
  const configType = values.configType ?? 'sshd_config'
  const mode = values.mode ?? 'hybrid'

  if (configType === 'sshd_config') {
    return generateSshdConfig(mode)
  }
  return generateSshClientConfig(mode)
}

export const SSHConfigGenerator: React.FC = () => {
  const stableGenerateConfig = useCallback(
    (values: Record<string, string>) => generateConfig(values),
    []
  )

  const stableSelections = useMemo(() => selections, [])

  return (
    <OpsConfigGenerator
      title="PQC SSH Config Generator"
      description="Generate SSH server and client configurations with post-quantum key exchange support."
      selections={stableSelections}
      generateConfig={stableGenerateConfig}
    />
  )
}
