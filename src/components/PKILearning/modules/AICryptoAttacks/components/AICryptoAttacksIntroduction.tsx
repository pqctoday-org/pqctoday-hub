// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  ShieldAlert,
  KeyRound,
  Bug,
  Activity,
  Lock,
  Sigma,
  ShieldCheck,
  Scale,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection, useActiveLearnPath } from '@/components/PKILearning/common/LearnSection'
import {
  BINANCE_AI_BRANCHES,
  BINANCE_INCIDENT_ATTRIBUTION,
  BINANCE_INCIDENT_IMPACT,
} from '../data/binanceAiBranches'
import { ClaimLine, ReadingNote } from './ClaimLine'

interface Props {
  onNavigateToWorkshop: () => void
}

const TAKEAWAY_ROWS = [
  {
    layer: '1. Keys & secrets in software',
    delta:
      'Faster triage of stolen data, generated lures, and endpoint file enumeration (QUIETVAULT); infostealers remain primary bulk threat.',
    maturity: 'Reported (field) / Demonstrated (2021–23 code studies)',
    impact: 'High operational credential & token exposure today; zero math break.',
    defence:
      'Push protection, immediate revocation, short-lived OIDC workload identity, endpoint & HSM key isolation.',
    link: { label: 'Secrets Management (LM-022)', to: '/learn/secrets-management-pqc' },
  },
  {
    layer: '2. Implementation & protocol flaws',
    delta:
      'AI-assisted code scanning finding real crypto-library bugs (wolfSSL CVE-2026-5194 in PQC-enabled builds, OpenSSL CVE-2026-45445).',
    maturity: 'Demonstrated (CVEs/patches) / Reported (AI discovery provenance)',
    impact: 'Immediate patching priority for PQC & classical crypto libraries.',
    defence:
      'Reproducible PoCs, human-in-the-loop review, fast patch SLAs, call-site audits for direct FIPS APIs.',
    link: { label: 'Software Supply Chain PQC (LM-078)', to: '/learn/software-supply-chain-pqc' },
  },
  {
    layer: '3. Side channels',
    delta:
      'Profiled CNN/MLP deep learning defeats jitter and B2A leakage in masked software Kyber-768 under physical lab capture + profiling devices.',
    maturity: 'Demonstrated (lab Cortex-M4 & smartcard)',
    impact: 'High evaluation impact for embedded software; requires physical or co-located access.',
    defence:
      'Higher-order masking, fresh randomness, hiding, and attack-based evaluation (SP 800-140F defines no mitigation metrics).',
    link: {
      label: 'PQC Implementation Security (LM-081)',
      to: '/learn/pqc-implementation-security',
    },
  },
  {
    layer: '4. KMS & HSM key policies',
    delta:
      'AI automating PKCS #11 / KMIP API search remains hypothesised (Tookan is classical model checking); IAM/token theft stays primary.',
    maturity: 'Hypothesised (AI delta) / Demonstrated (classical Tookan & padding oracles)',
    impact: 'Over-broad IAM and stolen authorised sessions remain the live control-plane exposure.',
    defence:
      'CKA_SENSITIVE, CKA_EXTRACTABLE=false, CKA_WRAP_WITH_TRUSTED, IAM policy separation, dual control, signed audit logs.',
    link: { label: 'HSM & PQC Operations (LM-015)', to: '/learn/hsm-pqc' },
  },
  {
    layer: '5. Mathematical cryptanalysis',
    delta:
      'Mythos Preview reduced unstandardised HAWK (withdrawn 29 Jul 2026) and sped up 7-round AES-128 MitM (2^105 CP); Gohr/SALSA target reduced or sparse settings.',
    maturity: 'Demonstrated (HAWK / reduced Speck / sparse LWE) / Reported (7r AES-128)',
    impact:
      'Zero deployed production impact; FIPS 203, 204, 205 and full AES remain unbroken as of 2026-11-21.',
    defence:
      'Stay on NIST-standardised dense FIPS 203–205, avoid sparse/toy HE secrets, maintain CBOM crypto agility.',
    link: { label: 'Quantum Threats (LM-002)', to: '/learn/quantum-threats' },
  },
] as const

export const AICryptoAttacksIntroduction: React.FC<Props> = ({ onNavigateToWorkshop }) => {
  useActiveLearnPath()

  return (
    <div className="w-full space-y-6">
      {/* ── 1. two-threats ─────────────────────────────────────────────────── */}
      <LearnSection
        sectionId="two-threats"
        title="1. Two Threats: Quantum vs AI — and the Capability Rubric"
        icon={<ShieldAlert size={20} className="text-primary" />}
        defaultOpen
      >
        <p className="text-muted-foreground">
          Organisations migrating to post-quantum cryptography face two very different threat
          models. A future cryptanalytically relevant quantum computer (CRQC) targets the underlying
          algebraic hardness of RSA, ECDSA, EdDSA, and ECDH via Shor&rsquo;s algorithm—the focus of{' '}
          <Link to="/learn/quantum-threats" className="text-primary hover:underline font-medium">
            Quantum Threats (LM-002)
          </Link>
          . By contrast, in the evidence reviewed through <strong>2026-11-21</strong>, observed
          operational incidents involving AI show AI playing a <em>none shown</em>,{' '}
          <em>not stated</em>, or <em>tool-mediated</em> role in the Binance branches, and an{' '}
          <em>assisted</em> role (no autonomous key theft) in threat-intelligence reports—while the
          strongest documented cryptographic deltas cluster around implementation flaws, keys in
          software, and lab side-channel evaluation, alongside narrow mathematical results that do
          not break standardised PQC.
        </p>

        <ClaimLine id="AI-1.1" chip="Quantum vs PQC Standards Baseline" />

        <ReadingNote title="How this module evaluates every AI capability claim">
          <p>
            Every result in this module is tagged as <strong>demonstrated</strong> (published result
            with exact setting and limits), <strong>reported</strong> (named organisation reports it
            happened), or <strong>hypothesised</strong> (analyst or synthesis view, never stated as
            fact), and separates <em>discovery</em>, <em>reproduction</em>, <em>patch</em>,{' '}
            <em>successful exploitation</em>, and <em>independent replication</em> (vendor triage
            alone is not independent replication). This module covers AI attacking cryptography; the
            reverse direction—protecting AI systems with PQC—is taught in{' '}
            <Link to="/learn/ai-security-pqc" className="text-primary hover:underline">
              AI Security &amp; PQC (LM-033)
            </Link>
            .
          </p>
        </ReadingNote>
      </LearnSection>

      {/* ── 2. keys-in-software ────────────────────────────────────────────── */}
      <LearnSection
        sectionId="keys-in-software"
        title="2. Keys & Secrets in Software (Operational Evidence First)"
        icon={<KeyRound size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Software keys leak from source repositories and commit history, configuration and
          environment files, unstructured logs, crash dumps, CI/CD runner secrets, developer
          workstations, and unencrypted backups (see{' '}
          <Link to="/learn/secrets-management-pqc" className="text-primary hover:underline">
            Secrets Management &amp; PQC (LM-022)
          </Link>{' '}
          and{' '}
          <Link to="/learn/software-supply-chain-pqc" className="text-primary hover:underline">
            Software Supply Chain PQC (LM-078)
          </Link>
          ). Observed incident telemetry shows AI providing incremental productivity gains in lures,
          scripting, and local file enumeration rather than autonomous cryptographic key theft.
        </p>

        <h3 className="font-semibold text-foreground">
          Headline vs Incident Detail: Cloud Threat Horizons H1 2026
        </h3>
        <p className="text-sm text-muted-foreground">
          Reading both the executive headline and the technical phase breakdown prevents attributing
          an entire intrusion chain to an LLM:
        </p>
        <ClaimLine id="AI-2.5" chip="Headline vs Detail" />

        <h3 className="font-semibold text-foreground">
          Binance 29 October 2026 Incident: Three Separate Branches (Shared Canonical Record)
        </h3>
        <p className="text-sm text-muted-foreground">
          Imported directly from the shared canonical incident record:{' '}
          {BINANCE_INCIDENT_IMPACT.totalImpactedUsdDisplay} impacted (
          {BINANCE_INCIDENT_IMPACT.frozenOrInterceptedUsdDisplay} frozen or intercepted).{' '}
          {BINANCE_INCIDENT_ATTRIBUTION.separationNote}
        </p>

        <div className="space-y-2">
          {BINANCE_AI_BRANCHES.map((branch) => (
            <div
              key={branch.stageId}
              className="p-3 rounded-lg bg-card border border-border text-xs space-y-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  {branch.stage.dateDisplay}: {branch.stage.title}
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-semibold">
                  Local AI causal role: {branch.causalRole}
                </span>
              </div>
              <p className="text-muted-foreground">{branch.stage.summary}</p>
            </div>
          ))}
        </div>

        <ClaimLine id="AI-2.4a" />
        <ClaimLine id="AI-2.4b" />
        <ClaimLine id="AI-2.4c" />

        <h3 className="font-semibold text-foreground">
          Infostealers, Threat-Intel Telemetry &amp; Social-Engineering Fraud
        </h3>
        <ClaimLine id="AI-2.1" chip="Infostealer Baseline (Non-AI)" />
        <ClaimLine id="AI-2.2a" />
        <ClaimLine id="AI-2.2b" />
        <ClaimLine id="AI-2.2c" chip="Landing Page Only" />
        <ClaimLine id="AI-2.3" />

        <h3 className="font-semibold text-foreground">
          AI-Written Insecure Cryptographic Code (Primary-Source Attribution)
        </h3>
        <p className="text-sm text-muted-foreground">
          Two foundational empirical studies predate FIPS 203–205 (August 2024); extrapolating them
          to PQC API misuse is <strong>ANALYSIS</strong> as of 2026-11-21. Notice also an important
          primary-source boundary: Pearce et al. cites OpenAI&rsquo;s Codex technical report
          Appendix G.3 for short RSA keys and AES-ECB mode, while Pearce&rsquo;s own 89-scenario
          benchmark evaluated CWE Top 25 weaknesses (including CWE-522 weak hashing and CWE-798
          hard-coded credentials), and Perry et al. directly evaluated Python symmetric crypto and
          ECDSA signing with <code>code-davinci-002</code>.
        </p>
        <ClaimLine id="AI-2.6a" />
        <ClaimLine id="AI-2.6b" />
      </LearnSection>

      {/* ── 3. finding-flaws ───────────────────────────────────────────────── */}
      <LearnSection
        sectionId="finding-flaws"
        title="3. Finding Implementation & Protocol Flaws in Cryptographic Code"
        icon={<Bug size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          The most concrete near-term AI delta for defenders is AI-assisted vulnerability scanning
          of real C/C++ cryptographic libraries. Two 2026 CVEs—wolfSSL <code>CVE-2026-5194</code>{' '}
          and OpenSSL <code>CVE-2026-45445</code>—demonstrate real defects patched before known
          in-the-wild exploitation, while generic discovery benchmarks (Big Sleep, DARPA AIxCC,
          OSS-Fuzz) show both real bug discovery and the continuing need for fuzzers and human
          triage. Note that wolfSSL <code>CVE-2026-5194</code> affects ECC/ECDSA verification in{' '}
          <em>PQC-enabled builds</em> when EdDSA or ML-DSA is also enabled—it is a library-code
          defect, not a mathematical flaw in ML-DSA.
        </p>

        <ClaimLine id="AI-3.1a" chip="PQC-Enabled Build Defect" />
        <ClaimLine id="AI-3.1b" />
        <ClaimLine id="AI-3.3" chip="Generic Discovery Benchmarks" />

        <ReadingNote title="Conceptual protocol baseline: PKCS #1 v1.5 padding oracles">
          <p>
            Classic protocol and implementation bug classes—nonce reuse, missing length/OID checks,
            weak RNG seeding, smart-contract validation errors, and padding oracles—remain the
            primary target surface. Bleichenbacher&rsquo;s 1998 attack illustrates why a 1-bit
            oracle breaks PKCS #1 v1.5 decryption conceptually (and why FIPS 203 mandates
            constant-time FO implicit rejection); no query construction is taught here.
          </p>
        </ReadingNote>
        <ClaimLine id="AI-3.4" chip="Conceptual Classical Baseline" />
      </LearnSection>

      {/* ── 4. side-channels ───────────────────────────────────────────────── */}
      <LearnSection
        sectionId="side-channels"
        title="4. AI-Enhanced Side-Channel Analysis (Profiled vs Non-Profiled)"
        icon={<Activity size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Deep-learning side-channel attacks (DL-SCA) automate feature alignment and higher-order
          combination on power or electromagnetic traces, but their threat model remains physically
          bounded. <strong>Profiled</strong> attacks require physical lab access to an identical
          profiling device (or multiple profiling boards) to train the model before attacking a
          target device; <strong>non-profiled</strong> deep-learning attacks eliminate the
          profiling-device requirement, yet still require physical or co-located trace capture from
          the target device. Masking, TVLA, KyberSlash, and EUCC AVA_VAN evaluation are covered in{' '}
          <Link
            to="/learn/pqc-implementation-security"
            className="text-primary hover:underline font-medium"
          >
            PQC Implementation Security (LM-081)
          </Link>
          .
        </p>

        <ClaimLine id="AI-4.1" chip="Profiled CNN vs Jitter" />
        <ClaimLine id="AI-4.2" chip="Profiled MLP vs Masked Kyber-768" />
        <ClaimLine id="AI-4.6" chip="Non-Profiled DL-SCA" />
        <ClaimLine id="AI-4.3" chip="Classical Baseline (Linked to LM-081)" />
        <ClaimLine id="AI-4.4" chip="Lattice SCA/Fault Survey" />
        <ClaimLine id="AI-4.5" chip="CMVP / FIPS 140-3 IG Scope" />
        <ClaimLine id="AI-4.7" chip="SP 800-140F Caveat" />
      </LearnSection>

      {/* ── 5. kms-hsm-attacks ─────────────────────────────────────────────── */}
      <LearnSection
        sectionId="kms-hsm-attacks"
        title="5. KMS, HSM & Key-Policy Attacks (Control Plane First)"
        icon={<Lock size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          In production key management, attackers target the management plane first: stolen IAM
          sessions, over-broad workload tokens, key-policy mutation, backup/restore abuse, missing
          wrapping-key separation, bypassed dual control, and unverified audit logs. Core HSM and
          KMS architecture are taught in{' '}
          <Link to="/learn/hsm-pqc" className="text-primary hover:underline">
            HSM &amp; PQC Operations (LM-015)
          </Link>{' '}
          and{' '}
          <Link to="/learn/kms-pqc" className="text-primary hover:underline">
            KMS &amp; PQC Key Management (LM-016)
          </Link>
          ; AI-agent wallet scoping is taught in Module A1 (LM-083) &sect;2c / W6 (optional further
          reading).
        </p>

        <ClaimLine id="AI-5.1" chip="Formal Model Checking (Not AI)" />
        <ClaimLine id="AI-5.5" chip="Classical Unwrap Padding Oracle" />
        <ClaimLine id="AI-5.2" chip="PKCS #11 v3.2 Controls" />
        <ClaimLine id="AI-5.3" chip="Cloud Managed HSM & Audit Logs" />
        <ClaimLine id="AI-5.4" chip="Hypothesised AI Delta (As-of 2026-11-21)" />
      </LearnSection>

      {/* ── 6. ai-cryptanalysis ────────────────────────────────────────────── */}
      <LearnSection
        sectionId="ai-cryptanalysis"
        title="6. AI-Enhanced Mathematical Cryptanalysis & Its Parameter Bounds"
        icon={<Sigma size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Mathematical cryptanalysis with LLMs and neural networks has produced notable published
          results—especially on an unstandardised signature candidate and on reduced-round or
          sparse-secret academic benchmarks—yet as of <strong>2026-11-21</strong> none break
          standardised FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), or full-round AES.
          Every result below separates mathematical status from AI discovery provenance and states
          full round/parameter constraints.
        </p>

        <ClaimLine id="AI-6.0a" chip="HAWK (Withdrawn 29 Jul 2026)" />
        <ClaimLine id="AI-6.0b" chip="7 of 10 Rounds AES-128" />
        <ClaimLine id="AI-6.1" chip="Neural Distinguishers (Speck32/64)" />
        <ClaimLine id="AI-6.2" chip="SALSA (Abstract-Bounded)" />
        <ClaimLine id="AI-6.6" chip="PICANTE, VERDE & SALSA FRESCA" />
        <ClaimLine id="AI-6.3" chip="LWE Benchmarking (Sparse Secrets)" />
        <ClaimLine id="AI-6.5" chip="Classical Lattice Baseline" />
        <ClaimLine id="AI-6.7" chip="Search Protocol" />
        <ClaimLine id="AI-6.4" chip="Bounded Negative Finding" />
      </LearnSection>

      {/* ── 7. defences ────────────────────────────────────────────────────── */}
      <LearnSection
        sectionId="defences"
        title="7. Defences, Verification Boundaries & PQC Migration Hygiene"
        icon={<ShieldCheck size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Because the real near-term AI delta falls on leaked software secrets, implementation
          flaws, and physical side-channel evaluation rather than mathematical breaks of FIPS
          203–205, defences map directly to existing high-assurance engineering controls—augmented
          with strict verification of AI-generated code and patches. Separate formal verification
          and memory-safety guarantees from compiled binary side-channel resistance, keep high-value
          signing and wrapping keys non-exportable inside HSM/KMS boundaries (noting that cloud KMS
          decrypts plaintext data keys for callers and enclave keys exist in executing memory), and
          maintain a Cryptographic Bill of Materials via{' '}
          <Link to="/learn/cbom" className="text-primary hover:underline">
            CBOM (LM-060)
          </Link>{' '}
          so vulnerable libraries can be swapped rapidly. AI-agent wallet scoping is taught only in
          Module A1 (LM-083) &sect;2c / W6 (optional further reading).
        </p>

        <ClaimLine id="AI-7.2" chip="Push Protection & OIDC" />
        <ClaimLine id="AI-7.3" chip="LLM Code-Review Limits" />
        <ClaimLine id="AI-7.4" chip="DevSecOps Propagation Risk" />
        <ClaimLine id="AI-7.5" chip="Formal Verification Scope (libcrux)" />
      </LearnSection>

      {/* ── 8. takeaways ───────────────────────────────────────────────────── */}
      <LearnSection
        sectionId="takeaways"
        title="8. Layer Takeaways & Executive Verdict (As-of 2026-11-21)"
        icon={<Scale size={20} className="text-primary" />}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Layer</th>
                <th className="py-2 pr-3 font-semibold">What AI Adds</th>
                <th className="py-2 pr-3 font-semibold">Maturity</th>
                <th className="py-2 pr-3 font-semibold">Production Impact</th>
                <th className="py-2 pr-3 font-semibold">Primary Defence</th>
                <th className="py-2 font-semibold">Related Module</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {TAKEAWAY_ROWS.map((row) => (
                <tr key={row.layer} className="align-top">
                  <td className="py-2.5 pr-3 font-semibold text-foreground">{row.layer}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{row.delta}</td>
                  <td className="py-2.5 pr-3 text-foreground">{row.maturity}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{row.impact}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{row.defence}</td>
                  <td className="py-2.5">
                    <Link to={row.link.to} className="text-primary hover:underline font-medium">
                      {row.link.label}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ClaimLine id="AI-7.6" chip="Deadlines Assessed" />
        <ClaimLine id="AI-x" chip="Executive Verdict (ANALYSIS, as-of 2026-11-21)" />

        <ReadingNote title="Role-based decision goals">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Researcher:</strong> Distinguish sparse/reduced SALSA and neural distinguisher
              benchmarks from dense Module-LWE/Module-SIS in FIPS 203–204, and audit DL-SCA papers
              for profiling-device access.
            </li>
            <li>
              <strong>Developer:</strong> Eliminate static secrets via push protection and OIDC, and
              enforce human review and regression tests on AI-assisted and newly written PQC code.
            </li>
            <li>
              <strong>Architect:</strong> Separate operational IAM/API risks from non-exportable HSM
              key policies, and maintain CBOM-backed library agility for fast CVE patching.
            </li>
            <li>
              <strong>Operations:</strong> Prioritise secret scanning, endpoint hardening, and fast
              cryptographic library patch SLAs (e.g., wolfSSL 5.9.1+ and OpenSSL patch releases).
            </li>
            <li>
              <strong>GRC &amp; Executive:</strong> Classify AI-and-crypto claims into demonstrated
              / reported / hypothesised; retain NIST IR 8547 (2030/2035) and NSA CNSA 2.0
              (2027–2035) PQC migration schedules unchanged.
            </li>
          </ul>
        </ReadingNote>

        <Button variant="outline" onClick={onNavigateToWorkshop} className="text-sm">
          Practise in the five toy-data Workshop labs <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      <ReadingCompleteButton />
    </div>
  )
}
