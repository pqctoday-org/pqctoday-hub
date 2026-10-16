// SPDX-License-Identifier: GPL-3.0-only
import type { TLSConfig, TLSRunRecord } from '@/store/tls-learning.store'
import { buildRunManifest, type RunManifest } from '@/services/runManifest'

/** Must equal the tls-simulator entry's `version` in workshopRegistry (pinned by a test). */
export const TLS_SIMULATOR_VERSION = '1.0.2'

/** What a TLS simulator run does not show. Shown in the saved record verbatim. */
export const TLS_RUN_LIMITATIONS = [
  'This is a teaching run in your browser, using the site’s own OpenSSL WebAssembly build. It is not a test of any product.',
  'It is not a certification or validation of any implementation.',
  'It does not show what your own browser uses: Chrome, Firefox and Safari each use their own TLS library.',
  'Composite (hybrid) certificates are placeholders in this simulator, and HSM-backed signing is not available.',
  'With the default RSA certificate, only the key exchange is post-quantum; the server’s identity is still proved classically.',
]

export interface TlsRunManifestInput {
  run: TLSRunRecord
  clientConfig: TLSConfig
  serverConfig: TLSConfig
  toolVersion: string
  startedAt: string
  finishedAt: string
}

/** One run of the TLS simulator as a run manifest (real OpenSSL WASM handshake in the browser). */
export function tlsRunManifest(i: TlsRunManifestInput, site?: RunManifest['site']): RunManifest {
  const { run } = i
  const hybridOrPqKex = /MLKEM|ML-KEM|Kyber/i.test(run.keyExchange)
  return buildRunManifest(
    {
      tool: { id: 'tls-simulator', title: 'TLS 1.3 Simulator', version: i.toolVersion },
      executionMode: 'in-browser-implementation',
      inputs: {
        clientGroups: i.clientConfig.groups,
        serverGroups: i.serverConfig.groups,
        clientCipherSuites: i.clientConfig.cipherSuites,
        clientSignatureAlgorithms: i.clientConfig.signatureAlgorithms,
        mutualTls: i.serverConfig.verifyClient ?? false,
        serverCertificate: run.serverIdentity,
        serverCaKeyType: run.serverCaKeyType,
      },
      cases: [
        {
          id: 'handshake',
          expected: 'success',
          actual: run.success ? 'success' : 'failed',
          pass: run.success,
        },
        {
          id: 'negotiated',
          actual: `cipher ${run.cipher}; key exchange ${run.keyExchange}; signature ${run.signature}`,
          pass: run.success,
        },
        {
          id: 'post-quantum key exchange',
          actual: hybridOrPqKex
            ? `yes (${run.keyExchange})`
            : `no (${run.keyExchange}) — classical only`,
          pass: run.success,
        },
        {
          id: 'size',
          actual: `${run.handshakeBytes} bytes handshake, ${run.appDataBytes} bytes application data, ${run.totalBytes} bytes total, ${run.roundTrips ?? 1} round trip(s)${run.hrrDetected ? ', HelloRetryRequest' : ''}`,
          pass: run.success,
        },
      ],
      limitations: TLS_RUN_LIMITATIONS,
      startedAt: i.startedAt,
      finishedAt: i.finishedAt,
    },
    site
  )
}
