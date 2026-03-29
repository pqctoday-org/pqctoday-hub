// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo } from 'react'
import {
  OpsConfigGenerator,
  type ConfigSelection,
} from '@/components/PKILearning/common/OpsConfigGenerator'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

const TLS_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'tls-kem-handshake',
    useCase: 'TLS 1.3 key exchange (ML-KEM-768)',
    standard: 'RFC 8446 + FIPS 203',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: 'tls-cert-sigver',
    useCase: 'Server certificate verification (ML-DSA-65)',
    standard: 'RFC 8446 + FIPS 204 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-DSA-sigGen-FIPS204',
    kind: { type: 'mldsa-sigver', variant: 65 },
  },
  {
    id: 'tls-auth-sign',
    useCase: 'TLS CertificateVerify (ML-DSA-65)',
    standard: 'RFC 8446 + FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 65 },
    message: 'TLS 1.3 ClientHello: supported_groups=[x25519_ml_kem_768],sig_algs=[ml_dsa_65]',
  },
]

const selections: ConfigSelection[] = [
  {
    id: 'serverType',
    label: 'Server Type',
    options: [
      { value: 'nginx', label: 'nginx' },
      { value: 'apache', label: 'Apache' },
      { value: 'haproxy', label: 'HAProxy' },
      { value: 'caddy', label: 'Caddy' },
    ],
    defaultValue: 'nginx',
  },
  {
    id: 'tlsMode',
    label: 'TLS Mode',
    options: [
      { value: 'classical', label: 'Classical' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'pure-pqc', label: 'Pure PQC' },
    ],
    defaultValue: 'hybrid',
  },
]

function modeLabel(mode: string): string {
  if (mode === 'pure-pqc') return 'Pure PQC Mode'
  if (mode === 'hybrid') return 'Hybrid Mode'
  return 'Classical Mode'
}

function generateNginxConfig(mode: string): string {
  const header = `# PQC TLS Configuration (${modeLabel(mode)})\n# Server: nginx\n# Requires OpenSSL 3.5+ for PQC key exchange support\n`

  if (mode === 'classical') {
    return (
      header +
      `
server {
    listen 443 ssl;
    server_name example.com;

    # TLS 1.3 only — disables older protocol versions
    ssl_protocols TLSv1.3;

    # Classical key exchange groups (ssl_conf_command preferred for OpenSSL 3.x)
    ssl_conf_command Groups X25519:P-256;

    # Certificate and key paths
    ssl_certificate     /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    # Prefer server cipher order for consistent negotiation
    ssl_prefer_server_ciphers on;
}`
    )
  }

  if (mode === 'hybrid') {
    return (
      header +
      `
server {
    listen 443 ssl;
    server_name example.com;

    # TLS 1.3 only — disables older protocol versions
    ssl_protocols TLSv1.3;

    # Hybrid PQC + classical key exchange (ssl_conf_command preferred for OpenSSL 3.x)
    # X25519MLKEM768: combines ML-KEM-768 with X25519 for quantum + classical security
    # Falls back to X25519 and P-256 for non-PQC clients
    ssl_conf_command Groups X25519MLKEM768:X25519:P-256;

    # Certificate and key paths
    ssl_certificate     /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    # Prefer server cipher order for consistent negotiation
    ssl_prefer_server_ciphers on;
}`
    )
  }

  // pure-pqc
  return (
    header +
    `
server {
    listen 443 ssl;
    server_name example.com;

    # TLS 1.3 only — disables older protocol versions
    ssl_protocols TLSv1.3;

    # Pure PQC key exchange — no classical fallback (ssl_conf_command preferred for OpenSSL 3.x)
    # MLKEM768: NIST FIPS 203 ML-KEM at 128-bit security level
    # MLKEM1024: NIST FIPS 203 ML-KEM at 192-bit security level
    # WARNING: clients without PQC support will fail to connect
    ssl_conf_command Groups MLKEM768:MLKEM1024;

    # Certificate and key paths
    ssl_certificate     /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    # Prefer server cipher order for consistent negotiation
    ssl_prefer_server_ciphers on;
}`
  )
}

function generateApacheConfig(mode: string): string {
  const header = `# PQC TLS Configuration (${modeLabel(mode)})\n# Server: Apache httpd\n# Requires OpenSSL 3.5+ for PQC key exchange support\n`

  if (mode === 'classical') {
    return (
      header +
      `
<VirtualHost *:443>
    ServerName example.com

    # Enable TLS 1.3 only
    SSLProtocol TLSv1.3

    # Classical key exchange groups
    SSLOpenSSLConfCmd Groups X25519:P-256

    # Certificate and key paths
    SSLCertificateFile    /etc/apache2/ssl/server.crt
    SSLCertificateKeyFile /etc/apache2/ssl/server.key

    SSLEngine on
</VirtualHost>`
    )
  }

  if (mode === 'hybrid') {
    return (
      header +
      `
<VirtualHost *:443>
    ServerName example.com

    # Enable TLS 1.3 only
    SSLProtocol TLSv1.3

    # Hybrid PQC + classical key exchange
    # X25519MLKEM768: ML-KEM-768 combined with X25519
    # Falls back to X25519 and P-256 for non-PQC clients
    SSLOpenSSLConfCmd Groups X25519MLKEM768:X25519:P-256

    # Certificate and key paths
    SSLCertificateFile    /etc/apache2/ssl/server.crt
    SSLCertificateKeyFile /etc/apache2/ssl/server.key

    SSLEngine on
</VirtualHost>`
    )
  }

  // pure-pqc
  return (
    header +
    `
<VirtualHost *:443>
    ServerName example.com

    # Enable TLS 1.3 only
    SSLProtocol TLSv1.3

    # Pure PQC key exchange — no classical fallback
    # MLKEM768: FIPS 203 ML-KEM at 128-bit security level
    # MLKEM1024: FIPS 203 ML-KEM at 192-bit security level
    # WARNING: clients without PQC support will fail to connect
    SSLOpenSSLConfCmd Groups MLKEM768:MLKEM1024

    # Certificate and key paths
    SSLCertificateFile    /etc/apache2/ssl/server.crt
    SSLCertificateKeyFile /etc/apache2/ssl/server.key

    SSLEngine on
</VirtualHost>`
  )
}

function generateHAProxyConfig(mode: string): string {
  const header = `# PQC TLS Configuration (${modeLabel(mode)})\n# Server: HAProxy\n# Requires OpenSSL 3.5+ for PQC key exchange support\n`

  if (mode === 'classical') {
    return (
      header +
      `
global
    # TLS 1.3 cipher suites (HAProxy 2.9+ uses -ciphersuites for TLS 1.3)
    ssl-default-bind-ciphersuites TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256

    # Classical key exchange curves
    ssl-default-bind-curves X25519:P-256

    # Minimum TLS version
    ssl-default-bind-options ssl-min-ver TLSv1.3

frontend https_in
    bind *:443 ssl crt /etc/haproxy/ssl/server.pem
    default_backend app_servers

backend app_servers
    server web1 127.0.0.1:8080 check`
    )
  }

  if (mode === 'hybrid') {
    return (
      header +
      `
global
    # TLS 1.3 cipher suites (HAProxy 2.9+ uses -ciphersuites for TLS 1.3)
    ssl-default-bind-ciphersuites TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256

    # Hybrid PQC + classical key exchange curves
    # X25519MLKEM768: ML-KEM-768 combined with X25519
    # Falls back to X25519 and P-256 for non-PQC clients
    ssl-default-bind-curves X25519MLKEM768:X25519:P-256

    # Minimum TLS version
    ssl-default-bind-options ssl-min-ver TLSv1.3

frontend https_in
    bind *:443 ssl crt /etc/haproxy/ssl/server.pem
    default_backend app_servers

backend app_servers
    server web1 127.0.0.1:8080 check`
    )
  }

  // pure-pqc
  return (
    header +
    `
global
    # TLS 1.3 cipher suites (HAProxy 2.9+ uses -ciphersuites for TLS 1.3)
    ssl-default-bind-ciphersuites TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256

    # Pure PQC key exchange — no classical fallback
    # MLKEM768: FIPS 203 ML-KEM at 128-bit security level
    # MLKEM1024: FIPS 203 ML-KEM at 192-bit security level
    # WARNING: clients without PQC support will fail to connect
    ssl-default-bind-curves MLKEM768:MLKEM1024

    # Minimum TLS version
    ssl-default-bind-options ssl-min-ver TLSv1.3

frontend https_in
    bind *:443 ssl crt /etc/haproxy/ssl/server.pem
    default_backend app_servers

backend app_servers
    server web1 127.0.0.1:8080 check`
  )
}

function generateCaddyConfig(mode: string): string {
  const header = `# PQC TLS Configuration (${modeLabel(mode)})\n# Server: Caddy\n# Requires OpenSSL 3.5+ for PQC key exchange support\n`

  if (mode === 'classical') {
    return (
      header +
      `
example.com {
    tls {
        # TLS 1.3 only
        protocols tls1.3 tls1.3

        # Classical key exchange curves
        curves x25519 p256
    }

    reverse_proxy localhost:8080
}`
    )
  }

  if (mode === 'hybrid') {
    return (
      header +
      `
example.com {
    tls {
        # TLS 1.3 only
        protocols tls1.3 tls1.3

        # Hybrid PQC + classical key exchange
        # x25519_mlkem768: ML-KEM-768 combined with X25519
        # Falls back to x25519 and p256 for non-PQC clients
        curves x25519_mlkem768 x25519 p256
    }

    reverse_proxy localhost:8080
}`
    )
  }

  // pure-pqc
  return (
    header +
    `
example.com {
    tls {
        # TLS 1.3 only
        protocols tls1.3 tls1.3

        # Pure PQC key exchange — no classical fallback
        # mlkem768: FIPS 203 ML-KEM at 128-bit security level
        # mlkem1024: FIPS 203 ML-KEM at 192-bit security level
        # WARNING: clients without PQC support will fail to connect
        curves mlkem768 mlkem1024
    }

    reverse_proxy localhost:8080
}`
  )
}

function generateConfig(values: Record<string, string>): string {
  const server = values.serverType ?? 'nginx'
  const mode = values.tlsMode ?? 'hybrid'

  switch (server) {
    case 'nginx':
      return generateNginxConfig(mode)
    case 'apache':
      return generateApacheConfig(mode)
    case 'haproxy':
      return generateHAProxyConfig(mode)
    case 'caddy':
      return generateCaddyConfig(mode)
    default:
      return '# Unknown server type'
  }
}

export const TLSConfigGenerator: React.FC = () => {
  const stableGenerateConfig = useCallback(
    (values: Record<string, string>) => generateConfig(values),
    []
  )

  const stableSelections = useMemo(() => selections, [])

  return (
    <>
      <OpsConfigGenerator
        title="PQC TLS Config Generator"
        description="Generate server-specific TLS configurations with post-quantum key exchange support."
        selections={stableSelections}
        generateConfig={stableGenerateConfig}
      />
      <KatValidationPanel
        specs={TLS_KAT_SPECS}
        label="TLS Basics Known Answer Tests"
        authorityNote="RFC 8446 · FIPS 203 · FIPS 204"
      />
    </>
  )
}
