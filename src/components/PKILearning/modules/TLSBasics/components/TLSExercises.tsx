// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTLSStore } from '@/store/tls-learning.store'
import {
  DEFAULT_SERVER_CERT,
  DEFAULT_SERVER_KEY,
  DEFAULT_CLIENT_CERT,
  DEFAULT_CLIENT_KEY,
  DEFAULT_ROOT_CA,
  DEFAULT_MLDSA87_SERVER_CERT,
  DEFAULT_MLDSA87_SERVER_KEY,
  DEFAULT_MLDSA87_CLIENT_CERT,
  DEFAULT_MLDSA87_CLIENT_KEY,
  DEFAULT_MLDSA87_ROOT_CA,
} from '../utils/defaultCertificates'

interface TLSExercisesProps {
  onNavigateToSimulate: () => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  apply: () => void
}

export const TLSExercises: React.FC<TLSExercisesProps> = ({ onNavigateToSimulate }) => {
  const { setClientConfig, setServerConfig } = useTLSStore()
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'basic-rsa',
      title: '1. Basic RSA Handshake',
      description:
        'Run a standard TLS 1.3 handshake with RSA-2048 certificates and X25519 key exchange — the baseline configuration used by most websites today.',
      badge: 'Classical',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Record the baseline handshake byte count (~4 KB) — you will compare it against every subsequent scenario. Note the RSA signature in the CertificateVerify message.',
      apply: () => {
        setClientConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519'],
          signatureAlgorithms: ['rsa_pss_rsae_sha256', 'ecdsa_secp256r1_sha256'],
          certificates: {
            certPem: DEFAULT_CLIENT_CERT,
            keyPem: DEFAULT_CLIENT_KEY,
            caPem: DEFAULT_ROOT_CA,
          },
        })
        setServerConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519'],
          signatureAlgorithms: ['rsa_pss_rsae_sha256', 'ecdsa_secp256r1_sha256'],
          certificates: {
            certPem: DEFAULT_SERVER_CERT,
            keyPem: DEFAULT_SERVER_KEY,
            caPem: DEFAULT_ROOT_CA,
          },
          verifyClient: false,
        })
      },
    },
    {
      id: 'pqc-certs',
      title: '2. PQC Certificates (ML-DSA-87)',
      description:
        'Switch to ML-DSA-87 post-quantum certificates while keeping classical X25519 key exchange. See how PQC signatures affect handshake overhead.',
      badge: 'PQC Signatures',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'Compare handshake bytes vs Scenario 1. ML-DSA-87 signatures are significantly larger than RSA, increasing the Certificate and CertificateVerify messages.',
      apply: () => {
        setClientConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519'],
          signatureAlgorithms: ['mldsa87', 'rsa_pss_rsae_sha256'],
          certificates: {
            certPem: DEFAULT_MLDSA87_CLIENT_CERT,
            keyPem: DEFAULT_MLDSA87_CLIENT_KEY,
            caPem: DEFAULT_MLDSA87_ROOT_CA,
          },
        })
        setServerConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519'],
          signatureAlgorithms: ['mldsa87', 'rsa_pss_rsae_sha256'],
          certificates: {
            certPem: DEFAULT_MLDSA87_SERVER_CERT,
            keyPem: DEFAULT_MLDSA87_SERVER_KEY,
            caPem: DEFAULT_MLDSA87_ROOT_CA,
          },
          verifyClient: false,
        })
      },
    },
    {
      id: 'hybrid-kex',
      title: '3. Hybrid Key Exchange',
      description:
        'Use X25519MLKEM768 hybrid key exchange with RSA certificates. This is the combination already deployed in Chrome and Firefox for quantum-safe key agreement.',
      badge: 'Hybrid',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'Record the handshake bytes and check the "vs #1" column in the Comparison Table — this shows the percentage increase from the ML-KEM key share (~1.2 KB). The Key Exchange badge will show the hybrid group name. Forward secrecy note: because ML-KEM keys are generated fresh per handshake, compromising the server\'s long-term ML-DSA signing key later cannot decrypt past sessions.',
      apply: () => {
        setClientConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519MLKEM768'],
          signatureAlgorithms: ['rsa_pss_rsae_sha256', 'ecdsa_secp256r1_sha256'],
          certificates: {
            certPem: DEFAULT_CLIENT_CERT,
            keyPem: DEFAULT_CLIENT_KEY,
            caPem: DEFAULT_ROOT_CA,
          },
        })
        setServerConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519MLKEM768'],
          signatureAlgorithms: ['rsa_pss_rsae_sha256', 'ecdsa_secp256r1_sha256'],
          certificates: {
            certPem: DEFAULT_SERVER_CERT,
            keyPem: DEFAULT_SERVER_KEY,
            caPem: DEFAULT_ROOT_CA,
          },
          verifyClient: false,
        })
      },
    },
    {
      id: 'full-pqc',
      title: '4. Full PQC (ML-DSA-87 + ML-KEM-1024)',
      description:
        'Maximum post-quantum configuration: ML-DSA-87 certificates with ML-KEM-1024 key exchange. See the full cost of a quantum-safe TLS connection.',
      badge: 'Full PQC',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'This will have the largest handshake overhead. Compare the total bytes with Scenario 1 to quantify the PQC migration cost.',
      apply: () => {
        setClientConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['ML-KEM-1024'],
          signatureAlgorithms: ['mldsa87'],
          certificates: {
            certPem: DEFAULT_MLDSA87_CLIENT_CERT,
            keyPem: DEFAULT_MLDSA87_CLIENT_KEY,
            caPem: DEFAULT_MLDSA87_ROOT_CA,
          },
        })
        setServerConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['ML-KEM-1024'],
          signatureAlgorithms: ['mldsa87'],
          certificates: {
            certPem: DEFAULT_MLDSA87_SERVER_CERT,
            keyPem: DEFAULT_MLDSA87_SERVER_KEY,
            caPem: DEFAULT_MLDSA87_ROOT_CA,
          },
          verifyClient: false,
        })
      },
    },
    {
      id: 'mtls',
      title: '5. Mutual TLS (mTLS)',
      description:
        'Enable server-side client certificate verification. Both parties authenticate with certificates, commonly used in API security and zero-trust architectures.',
      badge: 'mTLS',
      badgeColor: 'bg-tertiary/20 text-tertiary border-tertiary/50',
      observe:
        'Watch for the CertificateRequest message from the server, and the client Certificate + CertificateVerify responses. Both cert verification statuses should show "Verified".',
      apply: () => {
        setClientConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519'],
          signatureAlgorithms: ['rsa_pss_rsae_sha256', 'ecdsa_secp256r1_sha256'],
          certificates: {
            certPem: DEFAULT_CLIENT_CERT,
            keyPem: DEFAULT_CLIENT_KEY,
            caPem: DEFAULT_ROOT_CA,
          },
        })
        setServerConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519'],
          signatureAlgorithms: ['rsa_pss_rsae_sha256', 'ecdsa_secp256r1_sha256'],
          certificates: {
            certPem: DEFAULT_SERVER_CERT,
            keyPem: DEFAULT_SERVER_KEY,
            caPem: DEFAULT_ROOT_CA,
          },
          verifyClient: true,
        })
      },
    },
    {
      id: 'pqc-mtls',
      title: '6. PQC Mutual TLS (ML-DSA-87 + Hybrid)',
      description:
        'The worst-case PQC overhead scenario: mutual authentication with ML-DSA-87 certificates on both sides, combined with X25519MLKEM768 hybrid key exchange.',
      badge: 'Full PQC mTLS',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'Compare total bytes with Scenario 5 (RSA mTLS) — both sides now send large PQC certificates and signatures, roughly doubling the PQC certificate overhead. Record the handshake bytes for the Comparison Table.',
      apply: () => {
        setClientConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519MLKEM768'],
          signatureAlgorithms: ['mldsa87'],
          certificates: {
            certPem: DEFAULT_MLDSA87_CLIENT_CERT,
            keyPem: DEFAULT_MLDSA87_CLIENT_KEY,
            caPem: DEFAULT_MLDSA87_ROOT_CA,
          },
        })
        setServerConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519MLKEM768'],
          signatureAlgorithms: ['mldsa87'],
          certificates: {
            certPem: DEFAULT_MLDSA87_SERVER_CERT,
            keyPem: DEFAULT_MLDSA87_SERVER_KEY,
            caPem: DEFAULT_MLDSA87_ROOT_CA,
          },
          verifyClient: true,
        })
      },
    },
    {
      id: 'hrr-classical',
      title: '7. HelloRetryRequest — Classical Group Mismatch',
      description:
        'Trigger a HelloRetryRequest by giving the client only P-384 while the server only accepts X25519. The server will ask the client to retry with a compatible group, adding an extra round trip.',
      badge: 'HRR',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'Look for the "HRR" badge and the 2-RTT indicator in results. The extra round trip means a second ClientHello with a new key_share — check the "vs #1" column in the Comparison Table to see the exact byte overhead. Compare Wire Data sizes between this run and Scenario 1.',
      apply: () => {
        setClientConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['P-384'],
          signatureAlgorithms: ['rsa_pss_rsae_sha256', 'ecdsa_secp256r1_sha256'],
          certificates: {
            certPem: DEFAULT_CLIENT_CERT,
            keyPem: DEFAULT_CLIENT_KEY,
            caPem: DEFAULT_ROOT_CA,
          },
        })
        setServerConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519'],
          signatureAlgorithms: ['rsa_pss_rsae_sha256', 'ecdsa_secp256r1_sha256'],
          certificates: {
            certPem: DEFAULT_SERVER_CERT,
            keyPem: DEFAULT_SERVER_KEY,
            caPem: DEFAULT_ROOT_CA,
          },
          verifyClient: false,
        })
      },
    },
    {
      id: 'hrr-pqc',
      title: '8. HelloRetryRequest — PQC Group Mismatch',
      description:
        'Simulate a PQC migration scenario: the client offers only ML-KEM-1024 but the server only supports X25519MLKEM768. The server sends a HelloRetryRequest, forcing the client to retry with the hybrid group.',
      badge: 'HRR + PQC',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'This is a realistic PQC migration scenario. Compare the handshake bytes with Scenario 4 (Full PQC, 1-RTT) — the HRR adds a second ClientHello carrying a ~1.5 KB ML-KEM key_share. The Comparison Table shows the combined cost of PQC signatures + PQC key exchange + extra round trip. Hybrid groups (X25519MLKEM768) avoid this mismatch by supporting both classical and PQC peers.',
      apply: () => {
        setClientConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['ML-KEM-1024'],
          signatureAlgorithms: ['mldsa87', 'rsa_pss_rsae_sha256'],
          certificates: {
            certPem: DEFAULT_MLDSA87_CLIENT_CERT,
            keyPem: DEFAULT_MLDSA87_CLIENT_KEY,
            caPem: DEFAULT_MLDSA87_ROOT_CA,
          },
        })
        setServerConfig({
          cipherSuites: ['TLS_AES_256_GCM_SHA384'],
          groups: ['X25519MLKEM768'],
          signatureAlgorithms: ['mldsa87', 'rsa_pss_rsae_sha256'],
          certificates: {
            certPem: DEFAULT_MLDSA87_SERVER_CERT,
            keyPem: DEFAULT_MLDSA87_SERVER_KEY,
            caPem: DEFAULT_MLDSA87_ROOT_CA,
          },
          verifyClient: false,
        })
      },
    },
    {
      id: 'cipher-negotiation',
      title: '9. Cipher Suite Negotiation',
      description:
        'The client offers all five TLS 1.3 cipher suites; the server accepts only TLS_AES_128_GCM_SHA256. Observe which cipher is selected and why. Then swap the scenario to understand server-preference ordering.',
      badge: 'Negotiation',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The negotiated cipher in the result banner should be TLS_AES_128_GCM_SHA256 — the only cipher the server accepts, regardless of client ordering. This shows that the server controls cipher selection in TLS 1.3. To test ordering: add a second cipher to the server (e.g. TLS_AES_256_GCM_SHA384 first) and re-run to see which wins.',
      apply: () => {
        setClientConfig({
          cipherSuites: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_AES_128_GCM_SHA256',
            'TLS_CHACHA20_POLY1305_SHA256',
            'TLS_AES_128_CCM_SHA256',
            'TLS_AES_128_CCM_8_SHA256',
          ],
          groups: ['X25519'],
          signatureAlgorithms: ['rsa_pss_rsae_sha256', 'ecdsa_secp256r1_sha256'],
          certificates: {
            certPem: DEFAULT_CLIENT_CERT,
            keyPem: DEFAULT_CLIENT_KEY,
            caPem: DEFAULT_ROOT_CA,
          },
        })
        setServerConfig({
          cipherSuites: ['TLS_AES_128_GCM_SHA256'],
          groups: ['X25519'],
          signatureAlgorithms: ['rsa_pss_rsae_sha256', 'ecdsa_secp256r1_sha256'],
          certificates: {
            certPem: DEFAULT_SERVER_CERT,
            keyPem: DEFAULT_SERVER_KEY,
            caPem: DEFAULT_ROOT_CA,
          },
          verifyClient: false,
        })
      },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    scenario.apply()
    onNavigateToSimulate()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Run these scenarios in order to compare classical, PQC, and hybrid TLS configurations.
          Each exercise pre-configures the simulator — click &quot;Load &amp; Run&quot; to apply the
          settings and switch to the Simulate tab. Use the Comparison Table to track overhead across
          runs.
        </p>
        {/* E4: Algorithm trade-off reference table */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground list-none select-none py-0.5 font-medium">
            ▸ Algorithm trade-off reference (security level × size × speed)
          </summary>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Signature Algorithms (FIPS 204 / 205)
              </div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground border-b border-border">
                    <th className="p-2 text-left font-medium">Algorithm</th>
                    <th className="p-2 text-center font-medium">NIST Level</th>
                    <th className="p-2 text-right font-medium">Sig Size</th>
                    <th className="p-2 text-right font-medium">Pub Key</th>
                    <th className="p-2 text-right font-medium">Sign Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      alg: 'ML-DSA-44',
                      level: 'L2 (~AES-128)',
                      sig: '2,420 B',
                      pub: '1,312 B',
                      speed: 'Fast',
                    },
                    {
                      alg: 'ML-DSA-65',
                      level: 'L3 (~AES-192)',
                      sig: '3,293 B',
                      pub: '1,952 B',
                      speed: 'Medium',
                    },
                    {
                      alg: 'ML-DSA-87',
                      level: 'L5 (~AES-256)',
                      sig: '4,595 B',
                      pub: '2,592 B',
                      speed: 'Slower',
                    },
                    {
                      alg: 'SLH-DSA-SHA2-128s',
                      level: 'L1',
                      sig: '7,856 B',
                      pub: '32 B',
                      speed: 'Slow (⚠ TLS use not standardized)',
                    },
                    {
                      alg: 'ECDSA P-256',
                      level: 'Classical',
                      sig: '~72 B',
                      pub: '64 B',
                      speed: 'Very fast',
                    },
                    {
                      alg: 'RSA-PSS 2048',
                      level: 'Classical',
                      sig: '256 B',
                      pub: '256 B',
                      speed: 'Fast',
                    },
                  ].map((row, i) => (
                    <tr
                      key={row.alg}
                      className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}
                    >
                      <td className="p-2 font-mono font-medium">{row.alg}</td>
                      <td className="p-2 text-center text-muted-foreground">{row.level}</td>
                      <td className="p-2 text-right font-mono">{row.sig}</td>
                      <td className="p-2 text-right font-mono">{row.pub}</td>
                      <td className="p-2 text-right text-muted-foreground">{row.speed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Key Exchange Groups (FIPS 203, RFC 8446)
              </div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground border-b border-border">
                    <th className="p-2 text-left font-medium">Group</th>
                    <th className="p-2 text-center font-medium">NIST Level</th>
                    <th className="p-2 text-right font-medium">Key Share (pk + ct)</th>
                    <th className="p-2 text-right font-medium">Deployed</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { grp: 'X25519', level: 'Classical', share: '32 + 32 B', dep: 'Universal' },
                    { grp: 'ML-KEM-512', level: 'L2', share: '800 + 768 B', dep: 'Experimental' },
                    {
                      grp: 'ML-KEM-768',
                      level: 'L3',
                      share: '1,184 + 1,088 B',
                      dep: 'Experimental',
                    },
                    {
                      grp: 'ML-KEM-1024',
                      level: 'L5',
                      share: '1,568 + 1,568 B',
                      dep: 'Experimental',
                    },
                    {
                      grp: 'X25519MLKEM768 (hybrid)',
                      level: 'L3',
                      share: '~1,216 + 1,120 B',
                      dep: 'Chrome, Firefox',
                    },
                  ].map((row, i) => (
                    <tr
                      key={row.grp}
                      className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}
                    >
                      <td className="p-2 font-mono font-medium">{row.grp}</td>
                      <td className="p-2 text-center text-muted-foreground">{row.level}</td>
                      <td className="p-2 text-right font-mono">{row.share}</td>
                      <td className="p-2 text-right text-muted-foreground">{row.dep}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <button
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load & Run
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the Protocol Integration quiz to test what you&apos;ve learned.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
