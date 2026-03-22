// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Database,
  Shield,
  Lock,
  Bot,
  Server,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertTriangle,
  FileCheck,
  Eye,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'

// ── Local CollapsibleSection ─────────────────────────────────────────────

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
          <h2 className="text-xl font-bold text-gradient">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </section>
  )
}

// ── Introduction Component ───────────────────────────────────────────────

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: AI Data Pipeline Threats */}
      <CollapsibleSection
        title="AI Data Pipeline: The Quantum Threat Surface"
        icon={<Database size={20} className="text-primary" />}
        defaultOpen={true}
      >
        <p className="text-foreground/80 leading-relaxed">
          Every AI system depends on a <strong>data pipeline</strong> — the flow from raw data
          ingestion through preprocessing, storage, training, and inference. Each stage involves
          cryptographic operations that protect data confidentiality and integrity. With the advent
          of cryptographically relevant quantum computers (CRQCs), these protections face an
          existential threat.
        </p>

        <div className="glass-panel p-4 border-l-4 border-status-warning">
          <h4 className="font-bold text-foreground flex items-center gap-2">
            <AlertTriangle size={16} className="text-status-warning" />
            Harvest Now, Decrypt Later (HNDL)
          </h4>
          <p className="text-sm text-foreground/70 mt-1">
            Adversaries can intercept and store encrypted training data today, then decrypt it when
            a CRQC becomes available. For proprietary datasets worth millions in curation costs,
            this is a direct intellectual property theft vector. The{' '}
            <strong>data&apos;s value outlives</strong> the encryption protecting it.
          </p>
        </div>

        <h3 className="text-lg font-bold text-foreground mt-4">Cryptographic Touchpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              stage: 'Data Ingestion',
              crypto: 'TLS key exchange (ECDH → ML-KEM)',
              risk: 'Channel harvest exposes raw training data',
            },
            {
              stage: 'Data Signing',
              crypto: 'Manifest signatures (ECDSA → ML-DSA)',
              risk: 'Forged manifests enable data poisoning',
            },
            {
              stage: 'Storage Encryption',
              crypto: 'Key wrapping (RSA → ML-KEM)',
              risk: 'HNDL on encrypted datasets',
            },
            {
              stage: 'Model Output',
              crypto: 'Model signing (RSA/ECDSA → ML-DSA)',
              risk: 'Tampered models produce biased outputs',
            },
          ].map((item) => (
            <div key={item.stage} className="glass-panel p-3">
              <p className="text-sm font-bold text-foreground">{item.stage}</p>
              <p className="text-xs text-primary mt-1">{item.crypto}</p>
              <p className="text-xs text-status-warning mt-1">{item.risk}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-foreground/70 mt-2">
          <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> replaces ECDH for key exchange, and{' '}
          <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> replaces ECDSA/RSA for digital
          signatures.
        </p>
        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 2: Synthetic Data & Model Collapse */}
      <CollapsibleSection
        title="The Synthetic Data Crisis: Model Collapse & Authenticity"
        icon={<FileCheck size={20} className="text-primary" />}
      >
        <p className="text-foreground/80 leading-relaxed">
          As AI-generated content floods the internet, a new threat emerges:{' '}
          <InlineTooltip term="Model Collapse">model collapse</InlineTooltip>. When models are
          trained on data produced by other AI models, quality degrades with each generation —
          outputs become repetitive, lose diversity, and drift from reality. Distinguishing
          authentic human-created data from AI-generated content is now a critical challenge.
        </p>

        <div className="glass-panel p-4 border-l-4 border-status-error">
          <h4 className="font-bold text-foreground">The Model Collapse Cycle</h4>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-foreground/70">
            <span className="px-2 py-1 rounded bg-status-success/20 text-status-success">
              Gen 0: 100% Human Data
            </span>
            <ArrowRight size={14} className="text-muted-foreground" />
            <span className="px-2 py-1 rounded bg-status-warning/20 text-status-warning">
              Gen 2: 50% Synthetic
            </span>
            <ArrowRight size={14} className="text-muted-foreground" />
            <span className="px-2 py-1 rounded bg-status-error/20 text-status-error">
              Gen 5: 83% Synthetic — Quality Collapse
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-foreground mt-4">Cryptographic Defenses</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-foreground/80">
          <li>
            <strong>
              <InlineTooltip term="Content Credentials (C2PA)">
                Content Credentials (C2PA)
              </InlineTooltip>
            </strong>
            : Signed metadata embedded in content files — creator identity, creation tool, edit
            history. Creates a verifiable chain of custody from origin to consumption.
          </li>
          <li>
            <strong>Cryptographic provenance chains</strong>: Hash-chain-based data lineage tracking
            where each transformation appends a signed entry to an append-only log.
          </li>
          <li>
            <strong>AI watermark detection</strong>: Identifying invisible watermarks embedded by AI
            generators (SynthID, statistical LLM watermarks) to flag synthetic content.
          </li>
        </ul>

        <div className="glass-panel p-4 border-l-4 border-primary mt-3">
          <h4 className="font-bold text-foreground flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            PQC Imperative
          </h4>
          <p className="text-sm text-foreground/70 mt-1">
            Provenance signatures must outlive the data they protect — potentially decades.
            ECDSA-signed provenance records become forgeable post-CRQC, allowing retroactive
            injection of synthetic data into verified datasets. Migration to{' '}
            <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> signatures ensures long-term
            provenance trust.
          </p>
        </div>
        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 3: Model Weight Protection */}
      <CollapsibleSection
        title="Model Weight Protection & IP Security"
        icon={<Lock size={20} className="text-primary" />}
      >
        <p className="text-foreground/80 leading-relaxed">
          <InlineTooltip term="Model Weights">Model weights</InlineTooltip> are the crown jewels of
          an AI organization — billions of parameters representing multi-million dollar intellectual
          property (IP). Protecting this IP from Harvest-Now-Decrypt-Later (HNDL) attacks requires
          ML-KEM wrapping for confidentiality and ML-DSA signing for integrity to ensure long-term
          protection.
        </p>

        <h3 className="text-lg font-bold text-foreground mt-4">Three Layers of Protection</h3>
        <div className="space-y-3">
          {[
            {
              layer: 'Encryption at Rest',
              description:
                'Model files encrypted with AES-256-GCM, keys wrapped with ML-KEM. Even if storage is compromised, weights remain protected.',
              classical: 'RSA-2048 key wrapping',
              pqc: 'ML-KEM-768 / ML-KEM-1024',
              icon: <Lock size={16} className="text-primary" />,
            },
            {
              layer: 'Encryption in Transit',
              description:
                'Model distribution via TLS 1.3 with hybrid key exchange. Prevents interception during deployment to inference endpoints.',
              classical: 'ECDH P-256 (TLS 1.3)',
              pqc: 'ML-KEM-768 hybrid (TLS 1.3)',
              icon: <Shield size={16} className="text-primary" />,
            },
            {
              layer: 'Encryption in Use',
              description:
                'Model loaded inside a Trusted Execution Environment (TEE) — weights decrypted only within hardware-isolated memory.',
              classical: 'AES-128 memory encryption',
              pqc: 'AES-256 + PQC attestation',
              icon: <Eye size={16} className="text-primary" />,
            },
          ].map((item) => (
            <div key={item.layer} className="glass-panel p-4 flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10 self-start">{item.icon}</div>
              <div>
                <h4 className="font-bold text-foreground">{item.layer}</h4>
                <p className="text-sm text-foreground/70 mt-1">{item.description}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs">
                  <span className="text-status-error">Classical: {item.classical}</span>
                  <span className="text-status-success">PQC: {item.pqc}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-bold text-foreground mt-4">Model Signing & Attestation</h3>
        <p className="text-sm text-foreground/70">
          Just as{' '}
          <Link to="/learn/code-signing" className="text-primary hover:underline">
            code signing
          </Link>{' '}
          verifies software integrity, <strong>model signing</strong> uses digital signatures to
          prove a model has not been tampered with. Frameworks like{' '}
          <strong>Sigstore (cosign)</strong> and <strong>in-toto</strong> are adding support for
          ML-DSA signatures on model artifacts. This creates a{' '}
          <InlineTooltip term="Model Provenance">provenance</InlineTooltip> record: who trained the
          model, on what data, when, and with what hyperparameters.
        </p>
        <p className="text-sm text-foreground/70 mt-2">
          See also:{' '}
          <Link to="/learn/confidential-computing" className="text-primary hover:underline">
            Confidential Computing & TEEs
          </Link>{' '}
          for hardware-enforced model protection during inference.
        </p>
        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 4: Agentic AI */}
      <CollapsibleSection
        title="Agentic AI: Identity, Delegation & Commerce"
        icon={<Bot size={20} className="text-primary" />}
      >
        <p className="text-foreground/80 leading-relaxed">
          <InlineTooltip term="Agentic AI">Agentic AI</InlineTooltip> represents a paradigm shift —
          autonomous agents acting on behalf of users, making decisions, executing transactions, and
          communicating with other agents without continuous human oversight. This creates entirely
          new cryptographic challenges: how do you authenticate a machine? How do you delegate
          authority securely? How do agents trust each other?
        </p>

        <h3 className="text-lg font-bold text-foreground mt-4">
          Machine Identity vs Human Identity
        </h3>
        <p className="text-sm text-foreground/70">
          AI agents need cryptographic credentials — certificates, tokens, keys — that are{' '}
          <strong>not tied to a human session</strong>. Unlike a user who logs in once, an agent may
          operate for hours or days, delegating sub-tasks to other agents, each needing its own
          verifiable identity.
        </p>

        <h3 className="text-lg font-bold text-foreground mt-4">Delegation Chains</h3>
        <div className="glass-panel p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="px-3 py-1.5 rounded-full bg-primary/20 text-primary font-medium">
              Human
            </span>
            <ArrowRight size={14} className="text-muted-foreground" />
            <span className="px-3 py-1.5 rounded-full bg-status-info/20 text-status-info font-medium">
              Coordinator Agent
            </span>
            <ArrowRight size={14} className="text-muted-foreground" />
            <span className="px-3 py-1.5 rounded-full bg-status-warning/20 text-status-warning font-medium">
              Task Agent
            </span>
            <ArrowRight size={14} className="text-muted-foreground" />
            <span className="px-3 py-1.5 rounded-full bg-status-success/20 text-status-success font-medium">
              Service
            </span>
          </div>
          <p className="text-xs text-foreground/60 mt-2">
            Each hop in the chain requires a signed{' '}
            <InlineTooltip term="Delegation Token">delegation token</InlineTooltip> — a
            cryptographic credential granting limited authority with scope, expiration, and a
            signature chain back to the original delegating human.
          </p>
        </div>

        <h3 className="text-lg font-bold text-foreground mt-4">Agentic Commerce</h3>
        <p className="text-sm text-foreground/70">
          When agents transact on behalf of users — purchasing goods, negotiating contracts,
          managing subscriptions — every message exchange must be{' '}
          <strong>signed for non-repudiation</strong> and{' '}
          <strong>encrypted for confidentiality</strong>. Purchase orders signed with ML-DSA,
          payment details encrypted with ML-KEM, and delegation chains verified at each hop.
        </p>

        <div className="glass-panel p-4 border-l-4 border-status-warning mt-3">
          <h4 className="font-bold text-foreground flex items-center gap-2">
            <AlertTriangle size={16} className="text-status-warning" />
            Quantum Threat to Agent Systems
          </h4>
          <p className="text-sm text-foreground/70 mt-1">
            Agent communication channels harvested today can be decrypted post-CRQC to reconstruct
            entire transaction histories, business strategies, and negotiation patterns. Long-lived
            agent credentials (certificates with 1-year validity) are prime HNDL targets — a CRQC
            could forge the agent&apos;s identity for impersonation attacks.
          </p>
        </div>

        <p className="text-sm text-foreground/70 mt-3">
          Related:{' '}
          <Link to="/learn/api-security-jwt" className="text-primary hover:underline">
            API Security & JWT
          </Link>{' '}
          for PQC migration patterns for JWT/DPoP tokens.
        </p>
        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Section 5: Scale */}
      <CollapsibleSection
        title="Protecting Data at Scale: Petabyte-Era Cryptography"
        icon={<Server size={20} className="text-primary" />}
      >
        <p className="text-foreground/80 leading-relaxed">
          AI systems operate at a scale that challenges conventional cryptographic approaches —
          training datasets measured in petabytes, billions of inference requests per day, thousands
          of models across global deployments. Each data object needs its own encryption key, each
          API call needs a secure channel, and each model needs integrity verification.
        </p>

        <h3 className="text-lg font-bold text-foreground mt-4">
          Privacy-Preserving Machine Learning
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              tech: 'Homomorphic Encryption',
              desc: 'Compute on encrypted data without decrypting. Lattice-based schemes are inherently quantum-safe.',
              safe: true,
            },
            {
              tech: 'Federated Learning',
              desc: 'Train across distributed data — only encrypted gradients shared. Channels need PQC migration.',
              safe: false,
            },
            {
              tech: 'Secure MPC',
              desc: 'Joint computation without revealing inputs. Oblivious transfer protocols need PQC upgrade.',
              safe: false,
            },
            {
              tech: 'Differential Privacy',
              desc: 'Information-theoretic noise addition. Quantum-safe by design, but often combined with crypto channels.',
              safe: true,
            },
          ].map((item) => (
            <div key={item.tech} className="glass-panel p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">{item.tech}</p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold ${item.safe ? 'bg-status-success/20 text-status-success border-status-success/50' : 'bg-status-warning/20 text-status-warning border-status-warning/50'}`}
                >
                  {item.safe ? 'Quantum-Safe' : 'Needs PQC Migration'}
                </span>
              </div>
              <p className="text-xs text-foreground/70 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-bold text-foreground mt-4">Key Management at Scale</h3>
        <p className="text-sm text-foreground/70">
          A hierarchical KMS with <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip> envelope
          encryption is essential — root keys wrap intermediate keys, which wrap data encryption
          keys (DEKs). At enterprise scale, this means managing millions of DEKs with PQC-wrapped
          key hierarchies.
        </p>
        <ReadingCompleteButton />
      </CollapsibleSection>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/code-signing"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FileCheck size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Code Signing</div>
              <div className="text-xs text-muted-foreground">ML-DSA model signing, Sigstore cosign, and in-toto attestation</div>
            </div>
          </Link>
          <Link
            to="/learn/confidential-computing"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Eye size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Confidential Computing</div>
              <div className="text-xs text-muted-foreground">TEE-based model protection and PQC attestation during inference</div>
            </div>
          </Link>
          <Link
            to="/learn/api-security-jwt"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Server size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">API Security &amp; JWT</div>
              <div className="text-xs text-muted-foreground">PQC token signing for AI API authentication and agent identity</div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Database size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">KMS &amp; PQC</div>
              <div className="text-xs text-muted-foreground">PQC key hierarchies for AI model encryption and signing keys</div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">Algorithm-agnostic AI pipeline design for PQC algorithm rollout</div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="glass-panel p-6 border-primary/20 text-center">
        <h3 className="text-lg font-bold text-foreground mb-2">Ready for the Workshop?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Explore 7 interactive tools: audit AI pipelines, verify data authenticity, configure model
          protection, design agent authentication, simulate agentic commerce, build agent-to-agent
          protocols, and plan PQC migration at scale.
        </p>
        <Button onClick={onNavigateToWorkshop} variant="gradient" className="gap-2">
          Start Workshop <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
