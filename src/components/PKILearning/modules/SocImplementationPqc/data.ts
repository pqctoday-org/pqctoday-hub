// SPDX-License-Identifier: GPL-3.0-only
import type { RoleGuideData } from '../../common/roleGuide/types'

export const SOC_GUIDE_DATA: RoleGuideData = {
  roleId: 'soc',
  roleLabel: 'SOC Director / Senior Analyst',
  tagline:
    'PQC migration creates detection, threat-intelligence, and incident-response responsibilities that have no equivalent in your current library. Your SOC verifies that migrated systems stay migrated — and stays ready for the algorithm transitions still to come.',

  urgencyStatement:
    'The SOC has a dual mandate. During migration you must prove that hybrid implementations are not being silently downgraded and that migrated systems do not drift back to classical-only cryptography. Permanently after migration you must maintain cryptographic posture, detect drift, and respond to the inevitable future algorithm transitions. Every detection capability below depends on one prerequisite: a queryable, continuously updated cryptographic posture registry that maps each system to its expected cryptographic configuration. If that registry lives in a quarterly GRC spreadsheet emailed around, none of the rules below can function. The registry must be machine-readable and integrated with the SIEM — a Phase 1 architecture decision.',

  threatImpacts: [
    {
      id: 'hybrid-downgrade',
      title: 'Use Case 1 — Hybrid Downgrade Detection',
      description:
        'Adversaries can force a hybrid PQC connection to fall back to classical-only cryptography, analogous to the TLS downgrade attacks SOCs have monitored for years.',
      severity: 'critical',
      timeframe: 'During migration onward',
      exampleScenario:
        'A TLS 1.3 session between two systems both listed as hybrid-enabled in the posture registry completes using only ECDH — no ML-KEM key share. SIEM correlation flags it High severity. The hard part: in TLS 1.3 hybrid key exchanges are negotiated by IANA NamedGroup codepoints (ML-KEM-768/1024 and hybrid groups), not X.509 OIDs, so those codepoints must be added to traffic-analysis rules manually. And the most common false positive is your own middleboxes: oversized hybrid ClientHello messages get fragmented or stripped by legacy firewalls and SSL inspection proxies, producing a benign downgrade that looks identical to an attack.',
    },
    {
      id: 'crypto-drift',
      title: 'Use Case 2 — Cryptographic Drift Monitoring',
      description:
        'Migration is not a one-time event. Migrated systems drift back to classical crypto via new microservices, restored backups, vendor updates, and shadow IT.',
      severity: 'high',
      timeframe: 'Continuous, post-migration',
      exampleScenario:
        'A developer ships a new microservice with a classical-only TLS library because that is what the tutorial showed; an IT team restores a database from a pre-migration backup; a SaaS integration silently reverts to RSA key exchange after a vendor update. Continuous network monitoring alerts when any endpoint negotiates a classical-only key share with a system classified migration-complete. Tracked as Cryptographic Migration Coverage — the percentage of monitored TLS sessions using PQC or hybrid — which should climb monotonically toward 100%, with any regression investigated within 24 hours. Accuracy requires east-west (internal) traffic visibility, not just north-south perimeter flows.',
    },
    {
      id: 'cert-lifecycle-anomalies',
      title: 'Use Case 3 — Certificate Lifecycle Anomalies',
      description:
        'Wholesale transition of certificate infrastructure to ML-DSA / SLH-DSA, new intermediate CAs, and reconfigured chains creates a window of elevated risk.',
      severity: 'high',
      timeframe: 'Certificate transition window',
      exampleScenario:
        'Three escalating detection targets: failed certificate chain validations involving PQC certificates (Medium — may be interop or manipulation); unauthorized issuance from the internal CA using a PQC signature algorithm not on the approved list (High); and CA signing-key access outside scheduled issuance windows during the transition (Critical). Tooling gap: Certificate Transparency monitoring for PQC certificates is immature — most CT log monitors target the classical ecosystem — so the SOC may have to build custom monitoring around internal CA logs.',
    },
    {
      id: 'tnfl-signature-integrity',
      title: 'Use Case 4 — TNFL & Signature Integrity Monitoring',
      description:
        'Trust Now, Forge Later: once an adversary has signature-forgery capability, they can forge software updates, fabricate financial instructions, and impersonate trusted parties in real time.',
      severity: 'critical',
      timeframe: 'Real-time exploitation risk',
      exampleScenario:
        'Unlike HNDL, which compromises past data, TNFL enables present-tense exploitation. Heightened monitoring of code-signing events, software-update authentication, and any system that makes trust decisions from automated signature verification (firmware updates, financial transaction authorization, identity federation). Alert Critical on unexpected signing keys/identities or signing at unusual times, and on any change to signature-verification policy in production; alert High on signing volume more than two standard deviations above baseline. Target MTD-Signing under 15 minutes for production code signing. Organizational challenge: signing is usually fragmented — dev signs code, OT signs firmware, PKI signs certificates — each with separate logging.',
    },
    {
      id: 'hndl-indicator',
      title: 'Use Case 5 — Enhanced HNDL-Indicator Detection',
      description:
        'The Harvest Now, Decrypt Later threat is active today. The SOC detects harvesting indicators weighted by the sensitivity and longevity of the targeted data.',
      severity: 'high',
      timeframe: 'Active now',
      exampleScenario:
        'This is the data-exfiltration monitoring you already do, reprioritized by data longevity: a slow, sustained exfiltration of archived diplomatic correspondence or pharmaceutical R&D is potentially more damaging than a one-time dump of transactional data, because long-lived data retains value across the decryption timeline. Alert High on sustained outbound transfers from segments hosting data with 10+ year secrecy requirements — even below traditional DLP volume thresholds — and on bulk archival access by accounts that do not normally touch those systems. The HNDL Exposure Score composites DLP coverage, detection latency, and classification completeness. Hard dependency: this only works if information governance has classified data by secrecy-requirement duration.',
    },
  ],

  selfAssessment: [
    {
      id: 'posture-registry',
      label:
        'We have a machine-readable cryptographic posture registry integrated with the SIEM (not a quarterly spreadsheet)',
      weight: 16,
    },
    {
      id: 'namedgroup-parsing',
      label:
        'Our traffic-analysis rules can parse PQC NamedGroup codepoints (ML-KEM-768/1024 and hybrid key exchange groups)',
      weight: 12,
    },
    {
      id: 'east-west-visibility',
      label:
        'We have east-west (internal) traffic visibility, not just north-south perimeter flows',
      weight: 12,
    },
    {
      id: 'unified-signing-view',
      label: 'Code, firmware, and certificate signing events feed a single SOC-monitored view',
      weight: 10,
    },
    {
      id: 'data-classification',
      label:
        'Our data stores are classified by secrecy-requirement duration (enabling HNDL weighting)',
      weight: 10,
    },
    {
      id: 'tactical-cti',
      label: 'We monitor the NIST PQC list, IETF pquip/lamps, and CERT/vendor PQC advisories',
      weight: 8,
    },
    {
      id: 'strategic-cti',
      label:
        'We produce (or contract) a quarterly Quantum Threat Landscape Assessment for the CISO',
      weight: 8,
    },
    {
      id: 'playbooks-drafted',
      label:
        'The four quantum-specific IR playbooks are drafted and assigned named incident commanders',
      weight: 12,
    },
    {
      id: 'tabletop-run',
      label: 'We have run at least one quantum tabletop exercise in the last 12 months',
      weight: 12,
    },
  ],

  skillGaps: [
    {
      id: 'pqc-protocol-parsing',
      category: 'Detection Engineering',
      skill: 'PQC Protocol Parsing',
      description:
        'Building custom Suricata rules, Zeek scripts, and SIEM enrichment to recognize PQC cipher suites, hybrid key exchange NamedGroups, and PQC-specific TLS extensions. Plan 2–4 weeks of engineering per platform plus ongoing maintenance.',
      targetLevel: 'advanced',
      linkedModules: [
        { id: 'tls-basics', label: 'TLS Basics' },
        { id: 'network-security-pqc', label: 'Network Security' },
      ],
    },
    {
      id: 'downgrade-correlation',
      skill: 'Downgrade & Drift Correlation',
      category: 'Detection Engineering',
      description:
        'Writing SIEM correlation that joins live key-share negotiation against the posture registry, while suppressing benign middlebox-induced downgrades to keep the false-positive rate manageable.',
      targetLevel: 'advanced',
      linkedModules: [{ id: 'ops-quantum-impact', label: 'Ops Quantum Impact' }],
    },
    {
      id: 'cert-monitoring',
      category: 'Certificate Operations',
      skill: 'PQC Certificate Monitoring',
      description:
        'Monitoring internal CA logs for unauthorized PQC issuance and out-of-window signing-key access, since Certificate Transparency tooling for PQC certificates is still immature.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'pki-workshop', label: 'PKI' }],
    },
    {
      id: 'tactical-cti',
      category: 'Threat Intelligence',
      skill: 'Tactical PQC CTI',
      description:
        'Triaging liboqs CVEs, side-channel disclosures, and cryptanalysis papers with implementation impact within hours. Achievable by existing analysts with modest training.',
      targetLevel: 'intermediate',
      linkedModules: [],
    },
    {
      id: 'strategic-cti',
      category: 'Threat Intelligence',
      skill: 'Strategic Quantum CTI',
      description:
        'Reading arXiv preprints, interpreting quantum error-correction and resource-estimation papers, and evaluating hardware milestones against the CRQC Quantum Capability Framework. Scarce and specialized — most organizations should borrow this capability.',
      targetLevel: 'advanced',
      linkedModules: [{ id: 'research-quantum-impact', label: 'Researcher Quantum Impact' }],
    },
    {
      id: 'signing-telemetry',
      category: 'Signature Integrity',
      skill: 'Signing Telemetry Unification',
      description:
        'Unifying fragmented code-, firmware-, and certificate-signing logs into one SOC view and baselining signing volume to detect TNFL exploitation.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'code-signing', label: 'Code Signing' }],
    },
    {
      id: 'ir-playbooks',
      category: 'Incident Response',
      skill: 'Quantum IR Playbook Design',
      description:
        'Authoring the four quantum-specific playbooks with triggers, time-boxed actions, named incident commanders, communication chains, and pre-authorized emergency change windows.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'crypto-agility', label: 'Crypto Agility' }],
    },
    {
      id: 'hndl-weighting',
      category: 'Data Protection',
      skill: 'HNDL-Weighted DLP',
      description:
        'Reprioritizing exfiltration detection by data longevity and computing the HNDL Exposure Score; depends on information-governance data classification.',
      targetLevel: 'basic',
      linkedModules: [],
    },
  ],

  knowledgeDomains: [
    {
      name: 'Detection Use Cases',
      description:
        'Build the five SOC detection capabilities on existing SIEM, network monitoring, and certificate management infrastructure.',
      modules: [
        { id: 'tls-basics', label: 'TLS Basics' },
        { id: 'network-security-pqc', label: 'Network Security' },
      ],
    },
    {
      name: 'Cyber Threat Intelligence',
      description:
        'Run quantum CTI across the tactical, operational, and strategic horizons feeding triage, hunts, and board-level assessments.',
      modules: [
        { id: 'research-quantum-impact', label: 'Researcher Quantum Impact' },
        { id: 'quantum-computing-basics', label: 'Quantum Computing' },
      ],
    },
    {
      name: 'Incident Response & Crypto-Agility',
      description:
        'Develop the four quantum playbooks and the crypto-agility capabilities they invoke for emergency algorithm rotation.',
      modules: [
        { id: 'crypto-agility', label: 'Crypto Agility' },
        { id: 'migration-program', label: 'Migration Program' },
      ],
    },
    {
      name: 'Posture Registry & Inventory',
      description:
        'Consume the cryptographic posture registry derived from the Phase 1/2 inventory and CBOM that every detection rule depends on.',
      modules: [{ id: 'cbom', label: 'CBOM' }],
    },
  ],

  actionItems: [
    {
      id: 'soc-immediate-1',
      phase: 'immediate',
      title: 'Operationalize the Posture Registry & Stand Up Tactical CTI',
      description:
        'SOC Implementation Roadmap Phase 1 (0–3 months): make the registry queryable for the SOC and begin tactical CTI monitoring.',
      checklist: [
        'Negotiate machine-readable, SIEM-integrated access to the cryptographic posture registry (API or automated feed)',
        'Confirm the registry records expected state per system: hybrid / classical-only-pending / PQC-only, expected algorithms and cipher suites, and last status-change date',
        'Subscribe to the NIST PQC mailing list, IETF pquip and lamps notifications, CERT advisories, and vendor security advisories',
        'Draft the PQC Algorithm Vulnerability Disclosure playbook and conduct the first tabletop exercise',
      ],
    },
    {
      id: 'soc-30d-1',
      phase: '30-day',
      title: 'Build Hybrid Downgrade & Drift Detection',
      description:
        'Roadmap Phase 2 (3–9 months): implement downgrade detection for priority segments and start drift monitoring.',
      checklist: [
        'Add ML-KEM-768/1024 and hybrid key-exchange NamedGroup codepoints to traffic-analysis rules (custom Suricata/Zeek/SIEM enrichment)',
        'Build the High-severity hybrid-downgrade correlation rule with middlebox-induced-downgrade suppression',
        'Begin cryptographic drift monitoring for migration-complete systems and publish Cryptographic Migration Coverage on the SOC dashboard',
        'Run the first HNDL-focused review of data classification and DLP coverage',
      ],
    },
    {
      id: 'soc-90d-1',
      phase: '90-day',
      title: 'Extend to Certificate, Signing & Strategic CTI',
      description:
        'Roadmap Phase 3 (9–18 months): extend detection to full enterprise scope and stand up strategic CTI.',
      checklist: [
        'Integrate certificate lifecycle monitoring: failed PQC chain validations, unauthorized PQC issuance, out-of-window CA signing-key access',
        'Unify code, firmware, and certificate signing telemetry; implement TNFL signing-event monitoring with a volume baseline',
        'Establish the quarterly Quantum Threat Landscape Assessment for the CISO and risk committee (build, borrow, or buy strategic CTI — borrow recommended)',
        'Conduct a full algorithm rotation drill and measure the Algorithm Rotation Drill FP Rate',
      ],
    },
    {
      id: 'soc-6mo-1',
      phase: '6-month',
      title: 'Exercise Playbooks & Sustain the Capability',
      description:
        'Roadmap Phase 4 (ongoing): exercise all four playbooks, run the named tabletops, and fold quantum metrics into routine SOC reporting.',
      checklist: [
        'Run the five named tabletops (Friday Afternoon CVE, Ambiguous Cryptanalysis Paper, Silent Downgrade, CRQC Announcement, Signing Key Compromise) with a structured after-action report each',
        'Refine detection rules and update playbooks based on exercise findings',
        'Report the SOC quantum security metrics (Migration Coverage, Drift Incidents, TTAssess-PQC, MTD-Signing, HNDL Exposure Score, Rotation FP Rate) as part of regular SOC reporting',
        'Transition SOC cryptographic posture monitoring into the permanent detection library',
      ],
    },
  ],

  quickWins: [
    {
      id: 'soc-qw-registry',
      label: 'Ask where the posture registry lives',
      description:
        'If the answer is "a GRC spreadsheet updated quarterly," you have found the single blocker for every detection rule below. Escalate it as a Phase 1 architecture decision.',
    },
    {
      id: 'soc-qw-namedgroups',
      label: 'Check whether your SIEM knows PQC NamedGroups',
      description:
        'Hybrid key exchanges are negotiated by IANA NamedGroup codepoints, not X.509 OIDs. Most SIEMs cannot parse them yet — confirm this gap before promising downgrade detection.',
    },
    {
      id: 'soc-qw-cti-sources',
      label: 'Subscribe to the NIST PQC mailing list today',
      description:
        'Tactical CTI starts with free sources: the NIST PQC list, IETF pquip/lamps, and CERT advisories. Subscribing costs nothing and seeds your TTAssess-PQC capability.',
    },
  ],

  kpiMetrics: [
    {
      label: 'Cryptographic Migration Coverage',
      target: 'Monotonically ↑',
      description:
        '% of monitored TLS sessions using PQC or hybrid; any regression investigated within 24 hours.',
    },
    {
      label: 'Cryptographic Drift Incidents',
      target: 'Zero',
      description:
        'Systems reverting to classical-only after migration; any non-zero value triggers investigation.',
    },
    {
      label: 'TTAssess-PQC',
      target: '< 4 hours',
      description:
        'Time from PQC vulnerability disclosure to CTI assessment delivered to the SOC for deployed implementations.',
    },
    {
      label: 'Impact Assessment Speed',
      target: '< 4 hours',
      description:
        'Time from disclosure to identifying all affected systems via the posture registry.',
    },
    {
      label: 'MTD-Signing',
      target: '< 15 min',
      description: 'Mean time to detect an unauthorized signing event for production signing keys.',
    },
    {
      label: 'HNDL Exposure Score',
      target: '100% / < 4 hrs',
      description:
        'Full DLP coverage for 10+ year secrecy data stores; mean detection time for anomalous access under 4 hours.',
    },
    {
      label: 'Algorithm Rotation Drill FP Rate',
      target: '< 10%',
      description:
        'False-positive rate during rotation drills — the SOC must not mistake an authorized rotation for an attack.',
    },
  ],
}
