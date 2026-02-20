import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTLSStore } from '../../../../../store/tls-learning.store'
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
        'Observe the baseline handshake size (~4 KB) and the negotiated cipher suite. Note the RSA signature in the CertificateVerify message.',
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
        'Notice the increased handshake size from the larger ML-KEM key share (~1.2 KB). The Key Exchange badge in results will show "Hybrid".',
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
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    scenario.apply()
    onNavigateToSimulate()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Run these scenarios in order to compare classical, PQC, and hybrid TLS configurations.
          Each exercise pre-configures the simulator — click &quot;Load &amp; Run&quot; to apply the
          settings and switch to the Simulate tab. Use the Comparison Table to track overhead across
          runs.
        </p>
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
