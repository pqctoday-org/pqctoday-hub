import React from 'react'
import { Link } from 'react-router-dom'
import {
  KeyRound,
  Shield,
  AlertTriangle,
  Building2,
  Server,
  ArrowRight,
  ClipboardCheck,
  Route,
  BookOpen,
  Wrench,
} from 'lucide-react'

interface KeyManagementIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const KeyManagementIntroduction: React.FC<KeyManagementIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: Key Lifecycle */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <KeyRound size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Key Lifecycle Management</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Every cryptographic key follows a defined lifecycle from creation to destruction.{' '}
            <strong>NIST SP 800-57</strong> defines seven stages that ensure keys are properly
            managed throughout their operational life. Understanding this lifecycle is essential for
            planning a PQC migration.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;Proper key management is fundamental to the effective use of cryptography for
              security. Keys are analogous to the combination of a safe. If a safe combination is
              compromised, the strongest safe provides no security.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; NIST SP 800-57 Part 1, Revision 5
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                stage: 'Generation',
                desc: 'Create keys using approved RNG inside secure boundary (HSM)',
              },
              {
                stage: 'Distribution',
                desc: 'Deliver public keys via certificates; protect private key transport',
              },
              {
                stage: 'Storage',
                desc: 'Protect keys at rest in HSMs, encrypted keystores, or secure enclaves',
              },
              {
                stage: 'Usage',
                desc: 'Apply keys for designated operations only (sign, encrypt, wrap)',
              },
              {
                stage: 'Rotation',
                desc: 'Replace keys periodically to limit exposure from potential compromise',
              },
              {
                stage: 'Archival',
                desc: 'Preserve retired keys for old signature verification or data decryption',
              },
              {
                stage: 'Destruction',
                desc: 'Securely erase all copies when keys are no longer needed',
              },
            ].map((item) => (
              <div key={item.stage} className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-xs font-bold text-primary mb-1">{item.stage}</div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: HSM Fundamentals */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Shield size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">HSM Fundamentals</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A <strong>Hardware Security Module (HSM)</strong> is a dedicated cryptographic processor
            that generates, stores, and manages keys within a tamper-resistant boundary. HSMs are
            the gold standard for key protection in enterprise environments.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">FIPS 140-3 Levels</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  &bull; <strong>Level 1:</strong> Basic security, no physical protection
                </li>
                <li>
                  &bull; <strong>Level 2:</strong> Tamper-evident seals, role-based auth
                </li>
                <li>
                  &bull; <strong>Level 3:</strong> Tamper-resistant, identity-based auth, key
                  zeroization
                </li>
                <li>
                  &bull; <strong>Level 4:</strong> Full physical security envelope, environmental
                  protection
                </li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">PKCS#11 Interface</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  &bull; Standard API for HSM operations (C_GenerateKeyPair, C_Sign, C_Verify)
                </li>
                <li>
                  &bull; Mechanism codes define algorithm selection (CKM_RSA_PKCS, CKM_ML_KEM)
                </li>
                <li>&bull; Attribute templates control key properties (extractable, sensitive)</li>
                <li>&bull; Session management for concurrent access control</li>
              </ul>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="space-y-2 text-center">
              <div className="p-2 rounded bg-primary/10 text-primary text-xs font-bold">
                Application (PKCS#11 API calls)
              </div>
              <div className="text-muted-foreground">&darr;</div>
              <div className="p-2 rounded bg-secondary/10 text-secondary text-xs font-bold">
                PKCS#11 Provider Library (vendor-specific)
              </div>
              <div className="text-muted-foreground">&darr;</div>
              <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
                HSM Firmware (FIPS-validated crypto engine)
              </div>
              <div className="text-muted-foreground">&darr;</div>
              <div className="p-2 rounded bg-warning/10 text-warning text-xs font-bold">
                Tamper-Resistant Hardware (keys never leave boundary)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: PQC Key Challenges */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <AlertTriangle size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">PQC Key Management Challenges</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Migrating to PQC introduces significant key management challenges. Larger keys, stricter
            algorithm separation, and the need for dual-key management during the hybrid transition
            period all impact existing infrastructure.
          </p>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-sm font-bold text-foreground mb-2">Key Size Explosion</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                  <div className="text-lg font-bold text-destructive">256 B</div>
                  <div className="text-[10px] text-muted-foreground">RSA-2048 pub</div>
                </div>
                <div className="p-2 rounded bg-primary/5 border border-primary/20">
                  <div className="text-lg font-bold text-primary">1,184 B</div>
                  <div className="text-[10px] text-muted-foreground">ML-KEM-768 pub</div>
                </div>
                <div className="p-2 rounded bg-primary/5 border border-primary/20">
                  <div className="text-lg font-bold text-primary">1,952 B</div>
                  <div className="text-[10px] text-muted-foreground">ML-DSA-65 pub</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                PQC public keys are 4-8x larger than classical equivalents. This impacts
                certificates, TLS handshakes, HSM storage, and network bandwidth.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-xs font-bold text-foreground mb-1">Algorithm Separation</div>
                <p className="text-xs text-muted-foreground">
                  RSA can sign and encrypt. PQC enforces strict separation: ML-KEM for key
                  establishment only, ML-DSA for signatures only. Organizations need separate key
                  pairs where one RSA key previously sufficed.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="text-xs font-bold text-foreground mb-1">Dual-Key Management</div>
                <p className="text-xs text-muted-foreground">
                  During hybrid transition, every entity needs both classical and PQC key pairs.
                  This doubles the key inventory, complicates rotation schedules, and increases HSM
                  storage requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Enterprise Key Management */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Building2 size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Enterprise Key Management</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Enterprise Key Management Systems (KMS) centralize key lifecycle operations across the
            organization. A well-architected KMS is the foundation for a successful PQC migration.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-primary mb-2">Centralized KMS</div>
              <p className="text-xs text-muted-foreground">
                Single pane of glass for all key operations. HSM-backed key generation. Policy
                enforcement, audit logging, and automated rotation. Examples: Thales CipherTrust,
                Venafi, KeyFactor.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-primary mb-2">Cloud KMS</div>
              <p className="text-xs text-muted-foreground">
                Managed key services from cloud providers. AWS KMS, Azure Key Vault, GCP Cloud KMS.
                HSM-backed (FIPS 140-2 Level 3). API-driven with IAM integration. PQC support varies
                by provider.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-primary mb-2">Distributed KMS</div>
              <p className="text-xs text-muted-foreground">
                Key management distributed across microservices with local HSMs or vTPMs. Vault
                (HashiCorp) provides secrets management with auto-rotation. Requires strong policy
                orchestration.
              </p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              KMS Architecture for PQC Migration
            </div>
            <div className="space-y-2 text-center">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  Applications
                </div>
                <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  Microservices
                </div>
                <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  IoT Devices
                </div>
              </div>
              <div className="text-muted-foreground text-xs">&darr; KMIP / REST API &darr;</div>
              <div className="p-2 rounded bg-secondary/10 text-secondary text-xs font-bold">
                Enterprise KMS (policy engine + audit log)
              </div>
              <div className="text-muted-foreground text-xs">&darr; PKCS#11 &darr;</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-warning/10 text-warning text-[10px] font-bold">
                  HSM Cluster (classical keys)
                </div>
                <div className="p-2 rounded bg-success/10 text-success text-[10px] font-bold">
                  HSM Cluster (PQC keys)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: HSM PQC Readiness */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Server size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">HSM PQC Readiness</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Major HSM vendors are actively adding PQC algorithm support. FIPS 140-3 validation for
            PQC operations is in progress, with several vendors already offering production-ready
            PQC firmware.
          </p>
          <div className="space-y-2">
            {[
              {
                vendor: 'Thales Luna 7',
                status: 'Production',
                statusColor: 'bg-success/10 text-success border-success/20',
                algos: 'ML-KEM, ML-DSA, SLH-DSA, LMS/HSS',
                fips: 'FIPS 140-3 Level 3',
              },
              {
                vendor: 'Entrust nShield 5',
                status: 'Production',
                statusColor: 'bg-success/10 text-success border-success/20',
                algos: 'ML-KEM, ML-DSA, LMS/HSS, XMSS',
                fips: 'FIPS 140-3 Level 3',
              },
              {
                vendor: 'Utimaco Se Gen2',
                status: 'Production',
                statusColor: 'bg-success/10 text-success border-success/20',
                algos: 'ML-KEM, ML-DSA, XMSS, LMS',
                fips: 'FIPS 140-2 Level 4',
              },
              {
                vendor: 'Marvell LS2',
                status: 'Beta',
                statusColor: 'bg-warning/10 text-warning border-warning/20',
                algos: 'ML-KEM-768, ML-DSA-65, LMS',
                fips: 'FIPS 140-3 Level 3',
              },
              {
                vendor: 'AWS CloudHSM',
                status: 'Limited',
                statusColor: 'bg-primary/10 text-primary border-primary/20',
                algos: 'ML-KEM, ML-DSA (via SDK)',
                fips: 'FIPS 140-2 Level 3',
              },
              {
                vendor: 'Azure Dedicated HSM',
                status: 'Roadmap',
                statusColor: 'bg-muted/50 text-muted-foreground border-border',
                algos: 'Planned: ML-KEM, ML-DSA',
                fips: 'FIPS 140-2 Level 3',
              },
            ].map((v) => (
              <div key={v.vendor} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{v.vendor}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${v.statusColor}`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    <span>Algos: {v.algos}</span>
                    <span>{v.fips}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            NIST&apos;s FIPS 140-3 validation for PQC algorithms is ongoing. Organizations should
            verify their HSM vendor&apos;s PQC roadmap and plan firmware upgrades accordingly.
            Hybrid deployments (classical + PQC) provide a safe transition path.
          </p>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/compliance"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance Tracker</div>
              <div className="text-xs text-muted-foreground">
                NIST, ANSSI, and BSI compliance requirements
              </div>
            </div>
          </Link>
          <Link
            to="/assess"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <ClipboardCheck size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Risk Assessment</div>
              <div className="text-xs text-muted-foreground">
                Run a guided PQC readiness assessment
              </div>
            </div>
          </Link>
          <Link
            to="/migrate"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Guide</div>
              <div className="text-xs text-muted-foreground">
                Detailed migration workflows and software catalog
              </div>
            </div>
          </Link>
          <Link
            to="/learn/pki-workshop"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Wrench size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">PKI Workshop</div>
              <div className="text-xs text-muted-foreground">
                Build certificate chains and explore PQC certificates
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Explore the key lifecycle, simulate HSM operations, and plan a PQC key rotation.
        </p>
      </div>
    </div>
  )
}
