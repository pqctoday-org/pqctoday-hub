// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Standardized Production-Tool Capability Checklists for all 37 Business Tools.
 *
 * Maps each Business Center planning/governance worksheet to:
 * - productionToolCategory: The enterprise tool category the learner must evaluate
 * - requiredCapabilities: 3 concrete capabilities to require in production governance/discovery/PKI/CLM tools
 * - evaluationCriteria: How to evaluate the capability in the learner's enterprise environment
 * - sampleVsProductionBoundary: Explicit educational boundary distinguishing Hub sample worksheets from production evidence
 */

export interface BusinessAuditStressTestSpec {
  flawedArtifactSummary: string
  detectedGapCode: string
  governanceRejectionReason: string
  remediationAction: string
}

export interface BusinessCapabilitySpec {
  toolId: string
  productionToolCategory: string
  requiredCapabilities: [string, string, string]
  evaluationCriteria: string
  sampleVsProductionBoundary: string
  auditStressTest: BusinessAuditStressTestSpec
}

export type BusinessCapabilityChecklist = BusinessCapabilitySpec

const DEFAULT_BUSINESS_BOUNDARY =
  'Completing or exporting this Hub worksheet teaches how to structure and evaluate decision criteria using fictional sample inputs; it does not collect production evidence or assess a deployed environment.'

interface RawBusinessCapabilitySeed {
  productionToolCategory: string
  requiredCapabilities: [string, string, string]
  evaluationCriteria: string
}

const BUSINESS_CAPABILITY_SEEDS: Record<string, RawBusinessCapabilitySeed> = {
  'roi-calculator': {
    productionToolCategory: 'IT Financial Management (ITFM) & Cloud FinOps Platforms',
    requiredCapabilities: [
      'Activity-based cost modeling separating one-time cryptographic discovery/refactoring labor from recurring HSM, compute, and bandwidth deltas.',
      'Integration with CMDB hardware asset depreciation schedules to align PQC upgrades with natural refresh cycles.',
      'Scenario sensitivity analysis comparing proactive phased migration against emergency post-mandate retrofit surcharges.',
    ],
    evaluationCriteria:
      'Reconcile model unit-cost assumptions against historical TLS/PKI upgrade actuals and binding vendor quotes for HSM partitions and CDN traffic.',
  },
  'board-pitch': {
    productionToolCategory: 'Executive GRC Reporting & Board Governance Portals',
    requiredCapabilities: [
      'Traceable linkage from executive readiness summaries down to dated CBOM discovery scans, Mosca HNDL exposure windows, and regulatory deadlines.',
      'Clear separation between business services (e.g., archiving and retrieval service) and the long-lived assets they protect.',
      'Milestone-gated funding release tracking tied to NIST CSWP 39 / NCCoE SP 1800-38 migration phases.',
    ],
    evaluationCriteria:
      'Verify every quantitative claim in the board briefing is backed by an auditable inventory export or signed vendor attestation in your GRC repository.',
  },
  'breach-simulator': {
    productionToolCategory: 'Cyber Risk Quantification (CRQ / FAIR) & Incident Modeling Tools',
    requiredCapabilities: [
      'Differentiation between Harvest-Now-Decrypt-Later (HNDL) confidentiality breach impact on archived traffic and active quantum signature forgery on authentication/code-signing.',
      'Monte Carlo or scenario-based loss-exceedance modeling incorporating regulatory fines (DORA, GDPR, HIPAA), notification costs, and contract penalties.',
      'Asset-level data-retention horizon mapping ($X + Y > Z$) tied to enterprise data-classification catalogs.',
    ],
    evaluationCriteria:
      'Validate loss-magnitude inputs with legal, privacy, and cyber-insurance actuaries using your organization’s actual record counts and retention schedules.',
  },
  'cost-of-inaction': {
    productionToolCategory: 'Enterprise Risk & Financial Exposure Modeling Platforms',
    requiredCapabilities: [
      'Multi-year delay-penalty modeling capturing talent scarcity premiums, expedited audit remediation fees, and legacy vendor extended-support surcharges.',
      'Mapping of regulatory disallowance dates (2030 NIST deprecation / 2035 disallowance, CNSA 2.0, DORA) to revenue-bearing services.',
      'Comparison of planned multi-year OpEx/CapEx smoothing vs compressed late-stage capital spikes.',
    ],
    evaluationCriteria:
      'Cross-check projected delay surcharges against procurement contract renewal dates and mandatory certification windows (FIPS 140-3, PCI DSS v4.0.1).',
  },
  'cost-model-explorer': {
    productionToolCategory: 'Engineering Estimation & Cloud Capacity Planning Tools',
    requiredCapabilities: [
      'Parametric sizing of engineering labor hours across discovery, PKI hierarchy rebuilds, application refactoring, andinterop testing.',
      'Infrastructure overhead estimation for larger PQC TLS certificates, KMS key wrapping, and HSM throughput scaling.',
      'Exportable work-breakdown structures (WBS) compatible with enterprise portfolio management tools (Jira, ServiceNowSPM).',
    ],
    evaluationCriteria:
      'Calibrate per-application refactoring effort against a timed pilot migration of one representative microservice and one legacy monolith.',
  },
  'crqc-scenario': {
    productionToolCategory: 'Strategic Threat Intelligence & Horizon-Scanning Platforms',
    requiredCapabilities: [
      'Scenario planning across optimistic, baseline, and accelerated Cryptographically Relevant Quantum Computer (CRQC) arrival timelines.',
      'Automated Mosca inequality ($X + Y > Z$) recalculation across all registered business services when threat-horizon assumptions shift.',
      'Mapping of external regulatory milestones (NSA CNSA 2.0, NIST IR 8547, UK NCSC, EU DORA, ANSSI/BSI) onto internal migration waves.',
    ],
    evaluationCriteria:
      'Test how a 3-year acceleration in the CRQC horizon assumption re-orders your top 10 priority migration systems in your enterprise risk register.',
  },
  'risk-register': {
    productionToolCategory: 'Enterprise Governance, Risk & Compliance (GRC) Platforms',
    requiredCapabilities: [
      'Structured cryptographic risk entries distinguishing HNDL confidentiality exposure, signature-forgery exposure, and Grover key-size weakening.',
      'Mandatory attribution of a role owner, review cadence, and linked cryptographic discovery asset ID for every risk entry.',
      'Bi-directional synchronization between risk-treatment states and technical verification tickets.',
    ],
    evaluationCriteria:
      'Audit the enterprise GRC risk register to confirm every cryptographic risk entry links to a live CMDB/CBOM asset ID and has a scheduled review cadence.',
  },
  'risk-treatment-plan': {
    productionToolCategory: 'Enterprise Risk Treatment & Remediation Tracking Systems',
    requiredCapabilities: [
      'Explicit risk-treatment categorization (Mitigate via PQC/Hybrid, Avoid, Transfer, or time-bound Accept with compensating controls).',
      'Automated tracking of residual risk scores only after independent technical verification evidence is attached.',
      'Executive exception-waiver expiration alerts preventing indefinite acceptance of deprecated classical cryptography.',
    ],
    evaluationCriteria:
      'Verify that risk-treatment workflows in your GRC tool block closing a mitigation item until a packet capture or CBOM verification receipt is attached.',
  },
  'compliance-checklist': {
    productionToolCategory: 'Regulatory Compliance Management & Control Mapping Suites',
    requiredCapabilities: [
      'Multi-framework control cross-walking across CNSA 2.0, NIST IR 8547 / SP 800-131A, EU DORA / NIS2, PCI DSS v4.0.1, and ISO/IEC 27001.',
      'Per-obligation evidence attachment slots distinguishing policy documents from technical configuration exports.',
      'Jurisdiction-aware filtering based on the geographic footprint and regulated sectors of each business unit.',
    ],
    evaluationCriteria:
      'Trace one selected framework obligation in your GRC platform to its concrete technical control implementation and dated audit artifact.',
  },
  'audit-checklist': {
    productionToolCategory: 'Internal Audit & Assurance Workpaper Platforms',
    requiredCapabilities: [
      'Structured audit workpapers testing both design effectiveness (cryptographic policy) and operating effectiveness (live endpoint enforcement).',
      'Sampling procedures verifying that CBOM inventories, HSM partition mechanisms, and CA issuance profiles match stated governance policies.',
      'Deficiency and remediation tracking with independent re-test sign-off before audit closure.',
    ],
    evaluationCriteria:
      'Execute a sample internal audit walkthrough on one critical service, verifying that workpapers require independent technical test evidence rather than self-attestation.',
  },
  'compliance-timeline': {
    productionToolCategory: 'Regulatory Horizon & Program Milestone Tracking Tools',
    requiredCapabilities: [
      'Alignment of internal program milestones against external jurisdictional deadlines (2025–2035) with automated lead-time slack calculation.',
      'Dependency alerting when an internal PKI, HSM, or vendor milestone slips past its linked regulatory obligation date.',
      'Exportable milestone schedules for executive steering committees and external regulators.',
    ],
    evaluationCriteria:
      'Verify that every regulatory obligation applicable to your jurisdiction is linked to a dated internal delivery milestone with positive schedule slack.',
  },
  'raci-builder': {
    productionToolCategory: 'Enterprise Program Governance & Service Catalog Systems',
    requiredCapabilities: [
      'Role-based responsibility assignment (Responsible, Accountable, Consulted, Informed) across PKI, Network, AppSec, Procurement, Legal, and Executive roles.',
      'Single-Accountable-owner enforcement per migration workstream to prevent governance deadlocks.',
      'Integration with identity/directory groups and on-call escalation paths for cryptographic incident response.',
    ],
    evaluationCriteria:
      'Check your program RACI matrix to confirm every workstream has exactly one Accountable owner and zero unassigned cryptographic infrastructure domains.',
  },
  'policy-generator': {
    productionToolCategory: 'Enterprise Policy Management & Policy-as-Code Engines',
    requiredCapabilities: [
      'Normative cryptographic standards specification naming approved parameter sets (`ML-KEM-768/1024`, `ML-DSA-65/87`, `SLH-DSA`, `LMS/XMSS`) and classical deprecation dates.',
      'Time-bound cryptographic exception and waiver workflows requiring compensating controls and CISO sign-off.',
      'Translation of written policy clauses into automated CI/CD and Kubernetes admission-control rules (OPA / Rego / Kyverno).',
    ],
    evaluationCriteria:
      'Verify your published enterprise cryptographic policy maps directly to enforceable automated checks in your CI/CD and certificate issuance pipelines.',
  },
  'kpi-dashboard': {
    productionToolCategory: 'Security Metrics, Executive BI & Continuous Control Monitoring',
    requiredCapabilities: [
      'Role-weighted readiness scoring combining automated discovery coverage, PQC protocol adoption, PKI/HSM readiness, and vendor CBOM compliance.',
      'Explicit data-completeness thresholds refusing to display a rolled-up readiness score when underlying domain measurements are missing.',
      'Historical snapshot trending tracking quarter-over-quarter reduction in deprecated classical cryptography.',
    ],
    evaluationCriteria:
      'Confirm that each KPI metric on your executive dashboard is fed by an automated data source (CBOM scanner, CLM, SIEM) with documented refresh timestamps.',
  },
  'vendor-scorecard': {
    productionToolCategory: 'Third-Party Risk Management (TPRM) & Procurement Platforms',
    requiredCapabilities: [
      'Evidence-graded vendor evaluation weighting verified NIST CAVP/CMVP certificates and CycloneDX CBOMs above self-reported roadmap slides.',
      'Product-level PQC capability tracking across FIPS 203 (`ML-KEM`), FIPS 204 (`ML-DSA`), FIPS 205 (`SLH-DSA`), and hybrid protocol support.',
      'Automated reassessment triggers when a critical vendor misses a committed PQC GA delivery date.',
    ],
    evaluationCriteria:
      'Audit top tier-1 vendor scorecards in your TPRM platform by cross-checking claimed FIPS/CAVP validation numbers against the NIST CSRC database.',
  },
  'contract-clause': {
    productionToolCategory: 'Contract Lifecycle Management (CLM) & Legal Playbook Systems',
    requiredCapabilities: [
      'Standardized PQC procurement clauses mandating CycloneDX 1.6+ CBOM delivery, NIST FIPS 203/204/205 support, and cryptographic agility SLAs.',
      'Right-to-audit and vulnerability-remediation timelines for cryptographic flaws or deprecated classical algorithms.',
      'Indemnification and termination-for-cause provisions if a vendor fails to meet regulatory PQC compliance deadlines (e.g., CNSA 2.0, DORA, PCI DSS).',
    ],
    evaluationCriteria:
      'Review standard MSA/RFP templates with legal counsel to ensure mandatory CBOM and PQC migration SLA clauses are included in all new technology renewals.',
  },
  'supply-chain-matrix': {
    productionToolCategory: 'Software Supply Chain Security & Third-Party Dependency Analyzers',
    requiredCapabilities: [
      'Multi-tier dependency mapping identifying upstream open-source cryptographic libraries (`OpenSSL`, `BoringSSL`, `wolfSSL`, `Bouncy Castle`) embedded inside commercial vendor products.',
      'Concentration-risk analysis highlighting single points of cryptographic failure across cloud, HSM, and CA suppliers.',
      'Automated SBOM/CBOM ingestion and transitive vulnerability alerting.',
    ],
    evaluationCriteria:
      'Ingest SBOM/CBOM files from your top 5 software suppliers and map their underlying cryptographic library versions and PQC readiness.',
  },
  'roadmap-builder': {
    productionToolCategory: 'Enterprise Architecture & Portfolio Roadmap Platforms',
    requiredCapabilities: [
      'Multi-year wave sequencing aligned with NIST CSWP 39 phases, dependency order (HSM/KMS -> Root/Issuing PKI -> Network/Edge -> Applications), and regulatory deadlines.',
      'Critical-path analysis identifying prerequisite infrastructure upgrades before application cutover.',
      'Milestone tracking with explicit exit criteria per phase.',
    ],
    evaluationCriteria:
      'Validate that your enterprise roadmap sequences foundational PKI and HSM/KMS readiness ahead of dependent downstream application migrations.',
  },
  'stakeholder-comms': {
    productionToolCategory: 'Program Change Management & Stakeholder Communication Suites',
    requiredCapabilities: [
      'Audience-specific communication playbooks tailored for Board/Executives, Engineering/Product teams, Operations/SRE, and External Customers/Partners.',
      'Clear articulation of customer-facing maintenance windows, TLS client minimum-version requirements, and certificate root-trust updates.',
      'Feedback and escalation channels for interoperability regressions during hybrid PQC rollouts.',
    ],
    evaluationCriteria:
      'Review partner and customer communication templates prior to enabling hybrid TLS or rotating CA roots to ensure clear rollback and support instructions.',
  },
  'kpi-tracker': {
    productionToolCategory: 'Operational Security Telemetry & Program OKR Trackers',
    requiredCapabilities: [
      'Granular operational metrics tracking % of endpoints scanned, % of TLS sessions negotiating `X25519MLKEM768`, % of CAs PQC-capable, and % of tier-1 vendors with verified CBOMs.',
      'Target threshold alerting when migration velocity falls behind the required trajectory for 2030/2035 compliance.',
      'Per-business-unit drilldown exposing lagging infrastructure domains.',
    ],
    evaluationCriteria:
      'Verify that operational KPI trackers pull automated telemetry from ingress gateways, CLM platforms, and CI/CD CBOM pipelines on a weekly/monthly cadence.',
  },
  'deployment-playbook': {
    productionToolCategory: 'Release Orchestration, GitOps & Change-Management Platforms',
    requiredCapabilities: [
      'Canary and blue/green rollout templates for enabling hybrid PQC TLS/IKEv2 and dual/PQC certificates with progressive traffic shifting (1% -> 10% -> 50% -> 100%).',
      'Automated pre-flight checks (MTU path discovery, middlebox compatibility, HSM capacity) and instant one-command rollback triggers.',
      'Post-deployment verification gates confirming PQC negotiation and error-rate stability before promotion.',
    ],
    evaluationCriteria:
      'Execute a staging canary deployment and timed rollback drill using your production GitOps/change-management runbook.',
  },
  'hybrid-transition-planner': {
    productionToolCategory: 'Cryptographic Architecture & Protocol Lifecycle Planners',
    requiredCapabilities: [
      'Dual-mode and PQ/T hybrid transition modeling (Classical -> PQ/T Hybrid -> Pure PQC where mandated by CNSA 2.0, or long-term Hybrid per BSI/ANSSI).',
      'Interoperability matrix tracking client vs server capability across internal and external trust boundaries.',
      'Deprecation scheduling for removing classical fallback groups once relying-party readiness reaches 100%.',
    ],
    evaluationCriteria:
      'Test client-server handshake behavior across all three transition states (classical fallback, hybrid preferred, PQC/hybrid required) in staging.',
  },
  'mti-negotiator': {
    productionToolCategory: 'Protocol Configuration & Cipher-Suite Policy Management Tools',
    requiredCapabilities: [
      'Mandatory-to-Implement (MTI) algorithm preference ordering across TLS 1.3 (`Groups`, `SignatureAlgorithms`), IKEv2, SSH, and CMS/S/MIME.',
      'Detection of incompatible cipher/group intersections between enterprise clients, middleboxes, and partner gateways.',
      'Automated generation of hardened cipher-policy configurations for NGINX, Envoy, HAProxy, OpenSSL, and Java/Go runtimes.',
    ],
    evaluationCriteria:
      'Validate generated MTI cipher policies in staging using `testssl.sh` / `openssl s_client` against both PQC-capable and legacy classical clients.',
  },
  'crypto-api-refactor-audit': {
    productionToolCategory: 'Static Application Security Testing (SAST) & Code Modernization Tools',
    requiredCapabilities: [
      'AST-level code scanning detecting hardcoded classical calls (`RSA_generate_key`, `EVP_PKEY_RSA`, `ECDSA_sign`, fixed buffer sizes) across C/C++, Java, Go, Python, Rust, and C#.',
      'Refactoring guidance mapping legacy primitive calls to crypto-agile KEM (`Encapsulate`/`Decapsulate`) and provider-driven signature interfaces.',
      'CI/CD pull-request gates preventing new hardcoded classical cryptographic dependencies.',
    ],
    evaluationCriteria:
      'Run SAST/CBOM code rules across a target repository and verify that all direct classical asymmetric API call sites are inventoried with file/line precision.',
  },
  'cloud-responsibility-matrix': {
    productionToolCategory: 'Cloud Security Posture Management (CSPM) & Multi-Cloud Governance',
    requiredCapabilities: [
      'Shared-responsibility mapping across IaaS, PaaS, and SaaS layers distinguishing cloud-provider-managed PQC controls (edge TLS, physical HSM firmware) from customer-configured controls (CMK algorithm selection, BYOK wrapping, mTLS).',
      'Catalog cross-referencing of specific cloud services (AWS KMS/CloudHSM, Azure Key Vault/Application Gateway v2, GCP Cloud KMS, IBM Cloud HPCS, OCI KMS/Vault) against verified PQC support.',
      'Automated CSPM drift detection alerting when cloud resources use classical-only KMS keys or TLS policies.',
    ],
    evaluationCriteria:
      'Audit cloud Terraform/IaC templates against your cloud responsibility matrix to confirm customer-owned PQC configuration flags are explicitly set.',
  },
  'crypto-architecture-diagram': {
    productionToolCategory: 'Enterprise Architecture Modeling & Threat-Modeling Platforms',
    requiredCapabilities: [
      'End-to-end data-flow and trust-boundary mapping annotating every link and storage tier with its exact cryptographic protocol, KEM/signature algorithm, and key custodian.',
      'Automated identification of unencrypted internal hops or classical-only bottlenecks along critical service paths.',
      'Versioned architecture-as-code exports linked to CMDB service records.',
    ],
    evaluationCriteria:
      'Walk a critical transaction flow from external client ingress through service mesh to database/backup storage and verify every hop’s live cipher matches the architecture diagram.',
  },
  'management-tools-audit': {
    productionToolCategory: 'Cryptographic Discovery, CLM & Security Tooling Stack',
    requiredCapabilities: [
      'Estate-wide coverage measurement tracking the exact percentage of production hosts, containers, certificates, and repositories actually inspected by discovery/CLM/CBOM tools.',
      'Identification of low-coverage blind spots (<50% estate coverage) such as ephemeral containers, OT/IoT subnets, or appliances without agent support.',
      'Evaluation of management-tool PQC readiness (support for RFC 9881 `ML-DSA` and RFC 9935 `ML-KEM` OIDs without parsing errors).',
    ],
    evaluationCriteria:
      'Compare total active IP/host/repo counts in your CMDB against the distinct asset count scanned by your CBOM and CLM tools in the last 30 days.',
  },
  'crypto-cbom-builder': {
    productionToolCategory: 'CycloneDX CBOM Generators & Software Composition Analysis (SCA)',
    requiredCapabilities: [
      'Generation and ingestion of standards-compliant CycloneDX v1.6+ CBOM documents covering algorithms, keys, certificates, protocols, and underlying crypto libraries.',
      'Automatic detection of End-of-Life (EoL) cryptographic libraries (e.g., `OpenSSL 1.1.1w` EoL `2023-09-11`) alongside classical algorithm exposures.',
      'Deduplicated cross-service rollups linking cryptographic components to owning engineering teams.',
    ],
    evaluationCriteria:
      'Generate a CBOM from a production build artifact, verify it flags any EoL crypto libraries and classical algorithms, and validate the JSON against CycloneDX 1.6 schema.',
  },
  'crypto-vulnerability-watch': {
    productionToolCategory: 'Vulnerability Management, NVD/CVE Feeds & Threat Intelligence',
    requiredCapabilities: [
      'Continuous CPE and Package URL (`purl`) matching correlating deployed cryptographic libraries (`OpenSSL`, `strongSwan`, `Bouncy Castle`, `wolfSSL`, `BIND 9`) against live NVD CVEs and side-channel advisories.',
      'Visibility into CPE coverage gaps where niche PQC libraries or hardware appliances lack standardized NVD CPE identifiers.',
      'Prioritized patching workflows combining CVSS severity with cryptographic exposure context.',
    ],
    evaluationCriteria:
      'Verify your vulnerability scanner maps SBOM/CBOM library versions to NVD CVE feeds and explicitly documents alternative vendor-advisory monitoring for products without CPEs.',
  },
  'program-charter': {
    productionToolCategory: 'Enterprise PMO & Executive Governance Systems',
    requiredCapabilities: [
      'Formal executive sponsorship charter establishing PQC program scope, authority, budget envelope, and cross-functional steering committee cadence.',
      'Explicit definition of in-scope business services, protected long-lived assets, and regulatory compliance drivers.',
      'Escalation and exception-approval governance empowering the PQC Program Office to enforce migration gates.',
    ],
    evaluationCriteria:
      'Confirm the PQC Program Charter is formally signed by executive sponsors (CISO/CIO/CFO) and registered in the enterprise portfolio governance system.',
  },
  'initial-scoping': {
    productionToolCategory: 'Asset Discovery, CMDB & Migration Scoping Platforms',
    requiredCapabilities: [
      'Rapid top-down scoping across network perimeters, PKI hierarchies, identity providers, databases, and high-value data archives.',
      'Prioritization scoring combining data confidentiality lifetime (HNDL risk), regulatory mandate dates, and technical migration complexity.',
      'Identification of immediate quick-win pilot candidates vs complex long-lead hardware/vendor dependencies.',
    ],
    evaluationCriteria:
      'Reconcile initial scoping estimates against automated network TLS/SSH discovery scans and CMDB service-dependency maps.',
  },
  'skills-team-plan': {
    productionToolCategory: 'Learning Management (LMS) & Engineering Competency Platforms',
    requiredCapabilities: [
      'Role-specific training and hands-on lab tracks mapped to NICE Workforce Framework roles (Architects, Developers, PKI/HSM Ops, Network Engineers, GRC).',
      'Practical competency verification requiring engineers to complete staging PQC configuration and troubleshooting labs.',
      'Capacity planning balancing internal upskilling against specialized external cryptography consulting.',
    ],
    evaluationCriteria:
      'Track percentage of engineering and operations staff who have completed role-specific PQC training AND executed a verified staging migration exercise.',
  },
  'infra-modernization-planner': {
    productionToolCategory: 'Infrastructure Capacity Planning & Hardware Asset Management',
    requiredCapabilities: [
      'End-to-end infrastructure readiness assessment across HSMs, KMS, Load Balancers/CDNs, Firewalls/NGFWs, CPU/OS baselines, and PKI CAs.',
      'Identification of hardware appliances requiring physical replacement vs firmware/software upgrades to support FIPS 203/204/205.',
      'Network MTU and compute head-room modeling for multi-kilobyte PQC handshakes and signatures.',
    ],
    evaluationCriteria:
      'Verify every cryptographic hardware appliance model in your CMDB against vendor PQC firmware matrices and EoL/EoS dates.',
  },
  'refresh-cycle-alignment': {
    productionToolCategory: 'IT Asset Management (ITAM) & Procurement Lifecycle Systems',
    requiredCapabilities: [
      'Synchronization of PQC capability requirements with scheduled 3–5 year hardware depreciation, lease expiration, and software enterprise agreement (EA) renewals.',
      'Early-warning alerts flagging upcoming hardware/contract renewals so PQC requirements are inserted before PO signature.',
      'Avoidance of unbudgeted mid-cycle hardware write-offs through proactive refresh alignment.',
    ],
    evaluationCriteria:
      'Audit all hardware and security appliance renewals scheduled over the next 24 months to confirm PQC capability gates are attached to each procurement record.',
  },
  'accelerated-execution-profile': {
    productionToolCategory: 'Incident Response & Rapid Cryptographic Rollover Orchestration',
    requiredCapabilities: [
      'Emergency "break-glass" cryptographic agility playbooks for rapid algorithm/key rollover in response to an unexpected cryptanalytic breakthrough or zero-day implementation flaw.',
      'Automated short-lived certificate re-issuance and CDN/gateway cipher-group hot-swapping within hours rather than months.',
      'Pre-staged backup PQC/hybrid trust anchors and tested fallback communication channels.',
    ],
    evaluationCriteria:
      'Measure actual time-to-rotate (MTTR) during an unannounced staging drill simulating emergency revocation and algorithm swap on a tier-1 service.',
  },
  'data-at-rest-strategy': {
    productionToolCategory: 'Storage Encryption, Backup Archive & KMS Lifecycle Platforms',
    requiredCapabilities: [
      'Verification of `AES-256` (GCM/XTS) and `SHA-384/512` across databases, object stores, tape/cloud archives, and backup snapshots for Grover resistance.',
      'Migration of key-encryption-key (KEK) and envelope-encryption transport from RSA-OAEP/ECDH to FIPS 203 `ML-KEM-768/1024`.',
      'Long-lived record integrity protection using post-quantum archive timestamps (`RFC 3161` / `ERS` with `ML-DSA` or `SLH-DSA`).',
    ],
    evaluationCriteria:
      'Audit KMS key-wrapping algorithms and backup archive encryption configurations to verify `AES-256` data encryption and PQC-ready KEK wrapping.',
  },
  'migration-verification': {
    productionToolCategory: 'Continuous Verification, Packet Inspection & Audit Dossier Systems',
    requiredCapabilities: [
      'Collection and immutable retention of 5-point technical migration evidence per system: observed wire negotiation, negative tamper/downgrade test, PQC cert-chain verification, documented fallback policy, and archived dossier.',
      'Clear status distinction between unreviewed reference notes ("Evidence recorded — review required") and independently verified production deployments.',
      'Automated continuous regression checks alerting if a migrated system reverts to classical-only cryptography.',
    ],
    evaluationCriteria:
      'Independently re-run the packet capture, negative tamper check, and certificate-chain verification command referenced in the migration dossier before granting closure sign-off.',
  },
}

const BUSINESS_AUDIT_STRESS_TESTS: Record<string, BusinessAuditStressTestSpec> = {
  'roi-calculator': {
    flawedArtifactSummary:
      'Sample TCO worksheet budgets $0 for HSM partition upgrades and CDN TLS bandwidth overhead while purchasing classical-only HSMs two years before scheduled refresh.',
    detectedGapCode: 'AUDIT_GAP_UNALIGNED_CAPEX_AND_OMITTED_OVERHEAD',
    governanceRejectionReason:
      'Investment Committee rejects ROI submission because buying non-PQC-upgradable hardware out-of-cycle creates a guaranteed stranded-asset write-off ahead of 2030 deprecation.',
    remediationAction:
      'Align PQC hardware upgrades with CMDB depreciation schedules and incorporate validated HSM NVRAM/throughput and TLS certificate wire-size deltas.',
  },
  'board-pitch': {
    flawedArtifactSummary:
      'Board deck claims "85% Quantum Readiness" without linking to a dated CBOM scan and conflates long-lived customer records (assets) with the archiving service.',
    detectedGapCode: 'AUDIT_GAP_UNVERIFIED_READINESS_METRIC',
    governanceRejectionReason:
      'Audit Committee blocks board sign-off because readiness percentages lack traceable discovery timestamps and fail to distinguish business services from protected assets.',
    remediationAction:
      'Attach dated CBOM/CLM discovery exports to every readiness metric and explicitly map the Records Archiving & Retrieval Service protecting long-lived records.',
  },
  'breach-simulator': {
    flawedArtifactSummary:
      'Risk scenario models active signature forgery and HNDL confidentiality breaches using identical timelines and omits 25-year regulated archive retention ($X + Y > Z$).',
    detectedGapCode: 'AUDIT_GAP_CONFLATED_HNDL_AND_FORGERY_VECTORS',
    governanceRejectionReason:
      'Model Risk Governance rejects the loss-exceedance simulation for failing to separate immediate HNDL ciphertext capture risk from future active CRQC signature forgery.',
    remediationAction:
      'Split HNDL key-establishment exposure ($X + Y > Z$) from authentication/signing forgery risk and bind $X$ to actual enterprise data-retention catalog values.',
  },
  'cost-of-inaction': {
    flawedArtifactSummary:
      'Delay-cost model assumes linear 2029–2030 migration labor availability and omits PCI DSS v4.0.1 / CNSA 2.0 / DORA non-compliance penalties on revenue services.',
    detectedGapCode: 'AUDIT_GAP_UNDERSTATED_LATE_MIGRATION_SURCHARGE',
    governanceRejectionReason:
      'CFO/CISO review rejects the baseline projection because compressed post-2028 remediation ignores vendor extended-support surcharges and regulatory disallowance gates.',
    remediationAction:
      'Incorporate contract renewal cutoffs, mandatory certification lead times (12–18 months for CMVP), and late-stage specialist rate premiums.',
  },
  'cost-model-explorer': {
    flawedArtifactSummary:
      'Engineering WBS applies uniform 16-hour refactoring estimates across 200 applications without distinguishing C/C++ static-linked monoliths from agile sidecar proxies.',
    detectedGapCode: 'AUDIT_GAP_UNCAUGHT_LEGACY_REFACTOR_COMPLEXITY',
    governanceRejectionReason:
      'Architecture Review Board rejects capacity plan due to uncalibrated labor assumptions that omit SAST call-site density and cross-vendor interop testing.',
    remediationAction:
      'Stratify applications by crypto-abstraction maturity (Provider API vs hardcoded RSA/ECDSA calls) and calibrate WBS hours against a timed pilot migration.',
  },
  'crqc-scenario': {
    flawedArtifactSummary:
      'Horizon scan evaluates only a single 2035 CRQC point estimate and leaves 15-year confidentiality-lifetime services scheduled for 2031 migration ($15 + 5 > 9$).',
    detectedGapCode: 'AUDIT_GAP_MOSCA_HORIZON_VIOLATION',
    governanceRejectionReason:
      'Risk Committee rejects scenario plan because under both baseline and accelerated CRQC horizons, $X + Y > Z$ is already violated for long-lived archives.',
    remediationAction:
      'Run multi-horizon sensitivity analysis (optimistic, baseline, accelerated) and immediately reprioritize any service where $X + Y > Z$ into Wave 1 hybrid KEM rollout.',
  },
  'risk-register': {
    flawedArtifactSummary:
      'Risk register entries list generic "Quantum Risk to Enterprise" with no assigned role owner, no CMDB/CBOM asset ID, and no scheduled review cadence.',
    detectedGapCode: 'AUDIT_GAP_ORPHAN_RISK_ENTRY_NO_ASSET_ID',
    governanceRejectionReason:
      'Internal Audit flags a governance deficiency: unowned, asset-unlinked risk entries cannot be tracked to technical remediation or verified at closure.',
    remediationAction:
      'Bind every risk register row to a specific CMDB business service / CBOM asset ID, assign one Accountable owner, and set a quarterly review date.',
  },
  'risk-treatment-plan': {
    flawedArtifactSummary:
      'Treatment plan marks three Tier-1 payment gateways as "Mitigated (Residual Risk: Low)" based solely on a project manager email with zero packet-capture or CBOM evidence.',
    detectedGapCode: 'AUDIT_GAP_UNVERIFIED_RESIDUAL_RISK_REDUCTION',
    governanceRejectionReason:
      'GRC QA rejects status change to "Mitigated" because self-attestation without an independent TLS handshake receipt or negative tamper log violates closure policy.',
    remediationAction:
      'Keep treatment status as "In Progress — Evidence Required" until a verified `X25519MLKEM768` handshake capture and negative test log are attached.',
  },
  'compliance-checklist': {
    flawedArtifactSummary:
      'Compliance matrix marks CNSA 2.0 and NIST IR 8547 obligations as "Compliant" while linking only to a high-level corporate security policy PDF.',
    detectedGapCode: 'AUDIT_GAP_POLICY_ONLY_NO_OPERATING_EVIDENCE',
    governanceRejectionReason:
      'External Assessor rejects control mapping because a written policy statement establishes design intent only, not operating effectiveness on deployed endpoints.',
    remediationAction:
      'Attach both the normative policy clause and dated technical configuration exports (CBOM, CA profile, TLS scan) for each jurisdiction.',
  },
  'audit-checklist': {
    flawedArtifactSummary:
      'Internal audit workpaper relies on 100% management self-assessment questionnaires without independent sampling of HSM partitions, CA chains, or live TLS endpoints.',
    detectedGapCode: 'AUDIT_GAP_SELF_ATTESTATION_WITHOUT_SAMPLING',
    governanceRejectionReason:
      'Chief Audit Executive rejects workpaper package for failing IIA / ISACA standards requiring independent technical re-performance and negative-control testing.',
    remediationAction:
      'Sample at least 10% of in-scope production endpoints and independently re-verify live PQC negotiation, CAVP/CMVP certificates, and tamper rejection.',
  },
  'compliance-timeline': {
    flawedArtifactSummary:
      'Program schedule places Root/Issuing PKI PQC upgrade in Q4 2030, nine months AFTER the linked Q1 2030 application leaf-certificate migration milestone.',
    detectedGapCode: 'AUDIT_GAP_INVERTED_CRITICAL_PATH_DEPENDENCY',
    governanceRejectionReason:
      'PMO Governance gate rejects timeline due to negative schedule slack and an impossible dependency inversion (leaf certs cannot chain to an unissued PQC CA).',
    remediationAction:
      'Sequence HSM/KMS and Root/Issuing CA readiness ahead of downstream leaf-certificate and application cutover waves with >= 6 months slack before regulatory cutoffs.',
  },
  'raci-builder': {
    flawedArtifactSummary:
      'RACI matrix assigns three different executives as "Accountable (A)" for PKI Root Ceremonies and leaves Cloud KMS Key Rotation with zero Accountable owner.',
    detectedGapCode: 'AUDIT_GAP_DUAL_OR_MISSING_ACCOUNTABLE_OWNER',
    governanceRejectionReason:
      'Program Steering Committee rejects RACI matrix because multiple Accountable owners diffuse decision authority while zero Accountable owner creates an unowned blind spot.',
    remediationAction:
      'Enforce exactly one Accountable (A) role per cryptographic workstream and verify every infrastructure domain has at least one Responsible (R) engineering team.',
  },
  'policy-generator': {
    flawedArtifactSummary:
      'Draft Enterprise Cryptographic Policy mandates "Quantum-Safe Encryption Everywhere Immediately" without naming specific FIPS 203/204/205 parameter sets or exception gates.',
    detectedGapCode: 'AUDIT_GAP_NON_NORMATIVE_POLICY_LANGUAGE',
    governanceRejectionReason:
      'Security Architecture & Legal reject policy draft because vague prose cannot be compiled into OPA/Kyverno CI gates or enforced in vendor procurement contracts.',
    remediationAction:
      'Specify exact approved OIDs/parameter sets (`ML-KEM-768/1024`, `ML-DSA-65/87`, `SLH-DSA`, `LMS/XMSS`), deprecation dates, and time-bound CISO waiver criteria.',
  },
  'kpi-dashboard': {
    flawedArtifactSummary:
      'Executive dashboard displays an overall "92% Green PQC Readiness Score" even though 45% of enterprise subnets and ephemeral containers have never been scanned.',
    detectedGapCode: 'AUDIT_GAP_ROLLUP_SCORE_ON_INCOMPLETE_COVERAGE',
    governanceRejectionReason:
      'Data Governance & CISO reject KPI rollup because computing a high readiness percentage over a small scanned subset masks uninventoried shadow cryptography.',
    remediationAction:
      'Enforce a hard completeness threshold (e.g., >= 85% estate discovery coverage) before displaying rolled-up readiness scores, and report unscanned estate percentage prominently.',
  },
  'vendor-scorecard': {
    flawedArtifactSummary:
      'Vendor scorecard awards "Tier-1 Approved (100/100)" to a cloud HSM supplier based on a marketing press release claiming "FIPS 203 Ready" with no CAVP/CMVP number.',
    detectedGapCode: 'AUDIT_GAP_UNVERIFIED_VENDOR_MARKETING_CLAIM',
    governanceRejectionReason:
      'Third-Party Risk Management (TPRM) blocks procurement approval because "FIPS Ready / Designed to Meet" is not a NIST CAVP or CMVP validation certificate.',
    remediationAction:
      'Require verified NIST CSRC CAVP algorithm certificate numbers, CMVP module status (Active vs In Review), and a signed CycloneDX 1.6 CBOM before scoring a vendor green.',
  },
  'contract-clause': {
    flawedArtifactSummary:
      'MSA renewal template commits the organization to a 5-year SaaS lock-in with no CBOM delivery obligation, no PQC migration SLA, and no right to audit cryptography.',
    detectedGapCode: 'AUDIT_GAP_MISSING_CBOM_AND_PQC_SLA_CLAUSES',
    governanceRejectionReason:
      'Legal & Procurement Gate holds contract signature because the agreement lacks enforceable remedies if the vendor fails to deprecate RSA/ECDSA by regulatory deadlines.',
    remediationAction:
      'Insert mandatory CycloneDX 1.6 CBOM delivery upon release, NIST FIPS 203/204/205 support SLAs, and termination/remediation rights tied to CNSA 2.0 / DORA / PCI dates.',
  },
  'supply-chain-matrix': {
    flawedArtifactSummary:
      'Supply-chain inventory lists only top-level commercial vendor names while omitting transitive embedded OpenSSL 1.1.1w (EoL) and non-PQC BoringSSL dependencies.',
    detectedGapCode: 'AUDIT_GAP_UNSCOPED_TRANSITIVE_CRYPTO_DEPENDENCY',
    governanceRejectionReason:
      'Supply Chain Security rejects vendor matrix for failing to inspect Nth-tier cryptographic libraries where actual algorithm constraints and CVEs reside.',
    remediationAction:
      'Ingest transitive SBOM/CBOM dependency trees (`purl` / CPE) for all Tier-1 suppliers and flag embedded End-of-Life cryptographic libraries.',
  },
  'roadmap-builder': {
    flawedArtifactSummary:
      'Multi-year roadmap schedules 100% production cutover in a single "Big Bang" quarter without staging pilots, canary rollouts, or HSM/PKI prerequisite phases.',
    detectedGapCode: 'AUDIT_GAP_MISSING_CANARY_AND_INFRA_PREREQUISITES',
    governanceRejectionReason:
      'Enterprise Architecture rejects roadmap for violating NIST CSWP 39 / SP 1800-38 phased sequencing and omitting rollback validation gates.',
    remediationAction:
      'Structure roadmap into sequenced waves (Discovery -> PKI/HSM Foundation -> Internal Pilot -> Hybrid Canary -> Production Rollout) with explicit exit criteria.',
  },
  'stakeholder-comms': {
    flawedArtifactSummary:
      'External partner notification announces an immediate mandatory cutover to pure PQC TLS (`ML-KEM-1024` only) in 48 hours with no hybrid transition window or rollback path.',
    detectedGapCode: 'AUDIT_GAP_BREAKING_CHANGE_WITHOUT_FALLBACK_WINDOW',
    governanceRejectionReason:
      'Change Advisory Board (CAB) blocks communication and change ticket because abrupt removal of hybrid/classical groups without relying-party readiness testing causes B2B outage.',
    remediationAction:
      'Publish a staged deprecation schedule (Hybrid PQ/T preferred -> Canary test endpoint -> Scheduled classical deprecation) with clear client compatibility requirements.',
  },
  'kpi-tracker': {
    flawedArtifactSummary:
      'Operational OKR tracker relies on manually typed monthly spreadsheet numbers that have not been refreshed or reconciled against live gateway telemetry in 90 days.',
    detectedGapCode: 'AUDIT_GAP_STALE_MANUAL_KPI_TELEMETRY',
    governanceRejectionReason:
      'SRE & Security Operations reject KPI report because stale manual metrics fail to detect silent configuration drift or TLS fallback regressions.',
    remediationAction:
      'Wire KPI trackers directly to automated Prometheus `$ssl_curve` counters, CLM certificate inventories, and CI/CD CBOM scan timestamps.',
  },
  'deployment-playbook': {
    flawedArtifactSummary:
      'Production rollout runbook enables `X25519MLKEM768` and 15 KB `ML-DSA` cert chains across 100% of edge traffic simultaneously with no MTU pre-flight check or rollback command.',
    detectedGapCode: 'AUDIT_GAP_NO_CANARY_OR_ROLLBACK_VERIFICATION',
    governanceRejectionReason:
      'SRE Change Management blocks deployment playbook because enabling large PQC handshakes without progressive traffic shifting (1% -> 10% -> 50% -> 100%) risks middlebox blackholes.',
    remediationAction:
      'Add automated pre-flight MTU/middlebox probes, progressive canary error-budget gates, and a tested 1-command configuration rollback procedure.',
  },
  'hybrid-transition-planner': {
    flawedArtifactSummary:
      'Transition plan disables classical fallback on public-facing retail portals in 2026 while simultaneously permitting unmonitored classical downgrade on internal HVA links.',
    detectedGapCode: 'AUDIT_GAP_INCONSISTENT_HYBRID_POLICY_POSTURE',
    governanceRejectionReason:
      'Cryptographic Architecture Board rejects transition matrix for breaking legacy retail browser compatibility while leaving high-value internal links vulnerable to silent downgrade.',
    remediationAction:
      'Configure PQ/T hybrid (`X25519MLKEM768`) with monitored fallback on public B2C ingress and enforce strict hybrid/PQC-only with downgrade alerting on internal HVA service mesh.',
  },
  'mti-negotiator': {
    flawedArtifactSummary:
      'Generated cipher policy places `X25519MLKEM768` at the bottom of `Groups` below `secp256r1`/`x25519` and retains TLS 1.2 static RSA cipher suites.',
    detectedGapCode: 'AUDIT_GAP_SUBOPTIMAL_GROUP_PREFERENCE_ORDER',
    governanceRejectionReason:
      'Protocol Security Audit rejects configuration because placing PQC hybrid groups after classical groups guarantees peers will always negotiate classical ECDH.',
    remediationAction:
      'Order `X25519MLKEM768:SecP256r1MLKEM768` first in TLS 1.3 `Groups`, enable `server_preference`, and disable TLS < 1.3 static RSA ciphers.',
  },
  'crypto-api-refactor-audit': {
    flawedArtifactSummary:
      'Code modernization audit uses simple `grep "RSA"` text search, missing 40+ `EVP_PKEY_CTX_new_id(EVP_PKEY_EC, ...)` call sites and fixed 256-byte signature buffers.',
    detectedGapCode: 'AUDIT_GAP_MISSED_FIXED_BUFFER_AND_EVP_CALLSITES',
    governanceRejectionReason:
      'AppSec Review rejects refactoring audit because fixed 256-byte stack buffers will buffer-overflow or truncate 3,309-byte `ML-DSA-65` signatures at runtime.',
    remediationAction:
      'Use AST-based SAST rules (Semgrep / CodeQL) to locate all asymmetric primitive calls and fixed-size key/signature buffers, and validate with dynamic memory sanitizers.',
  },
  'cloud-responsibility-matrix': {
    flawedArtifactSummary:
      'Cloud governance worksheet assumes AWS/Azure/GCP automatically migrate customer-managed KMS keys (CMKs) and application mTLS certificates to PQC without customer configuration.',
    detectedGapCode: 'AUDIT_GAP_MISATTRIBUTED_CUSTOMER_CLOUD_CONTROL',
    governanceRejectionReason:
      'Cloud Security Posture (CSPM) audit rejects responsibility matrix because while cloud providers manage physical HSM firmware, customers own CMK algorithm selection and workload mTLS.',
    remediationAction:
      'Explicitly separate provider-managed infrastructure controls from customer-configured Terraform/IaC flags for KMS key specs, ALB/FrontDoor TLS policies, and service mesh mTLS.',
  },
  'crypto-architecture-diagram': {
    flawedArtifactSummary:
      'Architecture diagram shows "PQC TLS 1.3" at the CDN edge but omits the unencrypted / RSA-2048 internal load-balancer-to-microservice and database backup hops.',
    detectedGapCode: 'AUDIT_GAP_UNMAPPED_INTERNAL_TRANSIT_HOP',
    governanceRejectionReason:
      'Threat Modeling Review rejects architecture diagram because edge-only PQC termination leaves internal VPC and cross-region replication links exposed to HNDL.',
    remediationAction:
      'Annotate every hop from client edge through ingress, service mesh, database wire protocol, and archive storage with its verified protocol, KEM/signature algorithm, and key store.',
  },
  'management-tools-audit': {
    flawedArtifactSummary:
      'Tooling audit declares "100% CLM & CBOM Visibility" while the discovery agent is deployed on only 38% of production hosts and crashes when parsing RFC 9881 `ML-DSA` OIDs.',
    detectedGapCode: 'AUDIT_GAP_LOW_ESTATE_DISCOVERY_COVERAGE',
    governanceRejectionReason:
      'Enterprise Architecture rejects tooling sign-off because < 50% estate coverage leaves majority blind spots and legacy ASN.1 parsers fail on PQC certificate OIDs.',
    remediationAction:
      'Reconcile scanned host/repo counts against total CMDB active inventory and verify CLM/scanner parsing of RFC 9881 (`ML-DSA`) and RFC 9935 (`ML-KEM`) certificates in staging.',
  },
  'crypto-cbom-builder': {
    flawedArtifactSummary:
      'Submitted CBOM JSON omits `cryptoProperties.oid`, fails to flag embedded `OpenSSL 1.1.1w` (EoL `2023-09-11`), and lists algorithms without linking to owning services.',
    detectedGapCode: 'AUDIT_GAP_INCOMPLETE_CYCLONEDX_CBOM_SCHEMA',
    governanceRejectionReason:
      'SecOps Automation gate rejects CBOM artifact because missing OIDs, unflagged EoL libraries, and absent service owners prevent automated risk prioritization.',
    remediationAction:
      'Validate generated CBOMs against CycloneDX v1.6 schema, require complete `algorithmProperties` + `oid` fields, and correlate library versions against EoL matrices.',
  },
  'crypto-vulnerability-watch': {
    flawedArtifactSummary:
      'Vulnerability watch relies exclusively on NVD CVE CPE matching, creating a 100% blind spot for specialized PQC libraries and hardware appliances that lack NVD CPE entries.',
    detectedGapCode: 'AUDIT_GAP_UNMONITORED_NON_CPE_PQC_COMPONENTS',
    governanceRejectionReason:
      'Vulnerability Management Audit flags a coverage gap: relying solely on NVD CPEs misses side-channel advisories in `liboqs`, `pqm4`, and vendor HSM firmware bulletins.',
    remediationAction:
      'Combine NVD CPE + GitHub Security Advisory (`purl` / OSV) feeds with direct vendor security bulletin tracking for all non-CPE hardware and PQC cryptographic components.',
  },
  'program-charter': {
    flawedArtifactSummary:
      'Draft PQC Program Charter is authored by a single security architect with no executive sponsor sign-off, no allocated budget authority, and no mandate to block non-compliant releases.',
    detectedGapCode: 'AUDIT_GAP_UNSIGNED_CHARTER_NO_GATE_AUTHORITY',
    governanceRejectionReason:
      'PMO Portfolio Review rejects charter because a working group without CISO/CIO/CFO sponsorship and release-gate authority cannot enforce cross-BU migration deadlines.',
    remediationAction:
      'Secure formal executive sponsor signatures, define the in-scope business services and budget envelope, and grant the PQC PMO binding policy-exception authority.',
  },
  'initial-scoping': {
    flawedArtifactSummary:
      'Initial scoping worksheet inventories only public web servers while omitting internal PKI CAs, code-signing pipelines, VPN concentrators, and 20-year customer record archives.',
    detectedGapCode: 'AUDIT_GAP_OMITTED_PKI_CODESIGN_AND_ARCHIVE_SCOPE',
    governanceRejectionReason:
      'Discovery Review rejects scoping baseline because excluding long-lived archives (HNDL target) and software signing (root-of-trust target) misses the highest-impact exposures.',
    remediationAction:
      'Expand scoping across all five priority domains: External TLS/VPN, Long-Lived Data Archives, PKI/HSM Hierarchy, Code/Firmware Signing, and Tier-1 Vendor Dependencies.',
  },
  'skills-team-plan': {
    flawedArtifactSummary:
      'Workforce plan counts a 20-minute awareness video as "Full Engineering PQC Competency" with zero hands-on OpenSSL/PKI/HSM lab verification.',
    detectedGapCode: 'AUDIT_GAP_SLIDE_TRAINING_WITHOUT_LAB_COMPETENCY',
    governanceRejectionReason:
      'Engineering Leadership rejects training sign-off because passive video completion does not prepare SREs or developers to debug PQC MTU fragmentation or PKCS#11 v3.2 errors.',
    remediationAction:
      'Map NICE Workforce roles to hands-on staging lab exercises (e.g., configuring `X25519MLKEM768`, issuing `ML-DSA` certs, and running negative tamper tests).',
  },
  'infra-modernization-planner': {
    flawedArtifactSummary:
      'Infrastructure plan assumes legacy network HSMs and 10-year-old OT/SCADA PLCs can run `ML-KEM-1024` and `ML-DSA-87` via a simple software patch without checking SRAM/flash or EoL limits.',
    detectedGapCode: 'AUDIT_GAP_UNVERIFIED_HARDWARE_FIRMWARE_COMPATIBILITY',
    governanceRejectionReason:
      'Infrastructure Architecture rejects modernization plan because legacy hardware appliances lacking sufficient NVRAM/FPGA resources require physical replacement or bump-in-the-wire proxies.',
    remediationAction:
      'Cross-reference every HSM, NGFW, load balancer, and embedded MCU model against vendor PQC hardware capability matrices and size replacement CapEx.',
  },
  'refresh-cycle-alignment': {
    flawedArtifactSummary:
      'Procurement schedule renews a 3-year Enterprise Agreement for legacy load balancers and classical CAs in Q3 without attaching PQC capability requirements to the RFP.',
    detectedGapCode: 'AUDIT_GAP_MISSED_RENEWAL_PROCUREMENT_GATE',
    governanceRejectionReason:
      'IT Asset Management (ITAM) blocks PO renewal because locking in a 3-year contract without FIPS 203/204 support forces an unbudgeted mid-term contract buyout.',
    remediationAction:
      'Attach mandatory PQC capability and CBOM gates to every hardware refresh and software EA renewal occurring within the next 36 months.',
  },
  'accelerated-execution-profile': {
    flawedArtifactSummary:
      'Emergency crypto-rollover playbook relies on manual ticket creation across 14 teams with an estimated 6-month certificate replacement timeline and no pre-staged backup CA.',
    detectedGapCode: 'AUDIT_GAP_MANUAL_ROLLOVER_EXCEEDS_INCIDENT_MTTR',
    governanceRejectionReason:
      'Incident Response Review rejects break-glass playbook because a 6-month manual rotation cannot contain an active cryptanalytic or implementation vulnerability.',
    remediationAction:
      'Implement automated ACME/CMPv3 short-lived certificate rotation, pre-stage a secondary PQC/hybrid root of trust, and validate a < 24-hour emergency swap in a game-day drill.',
  },
  'data-at-rest-strategy': {
    flawedArtifactSummary:
      'Storage strategy upgrades database bulk encryption from AES-128 to AES-256 but leaves the KMS Key-Encryption-Keys (KEKs) and backup tape transport wrapped with RSA-2048.',
    detectedGapCode: 'AUDIT_GAP_CLASSICAL_KEK_WRAPPING_ON_AES256_DATA',
    governanceRejectionReason:
      'Cryptography Review rejects data-at-rest architecture because an attacker who harvests the RSA-2048 wrapped KEK header can recover the AES-256 DEK with a CRQC via Shor’s algorithm.',
    remediationAction:
      'Pair AES-256-GCM/XTS data encryption with FIPS 203 `ML-KEM-768/1024` (or hybrid KEM) KEK envelope wrapping and post-quantum RFC 3161 archive timestamps.',
  },
  'migration-verification': {
    flawedArtifactSummary:
      'Closure dossier marks a Tier-1 service as "Verified Complete" with only a screenshot of a green UI badge—missing the wire pcap, negative tamper test log, and `openssl verify` output.',
    detectedGapCode: 'AUDIT_GAP_MISSING_5POINT_VERIFICATION_DOSSIER',
    governanceRejectionReason:
      'Release Assurance & Internal Audit reject closure sign-off because UI screenshots or self-reported notes do not satisfy the mandatory 5-point technical verification standard.',
    remediationAction:
      'Attach all 5 verifiable artifacts before closure: (1) wire negotiation pcap, (2) negative tamper/downgrade refusal log, (3) PQC cert chain verification, (4) fallback policy, and (5) archived dossier hash.',
  },
}

export const BUSINESS_CAPABILITY_CHECKLISTS: Record<string, BusinessCapabilitySpec> =
  Object.fromEntries(
    Object.entries(BUSINESS_CAPABILITY_SEEDS).map(([toolId, seed]) => [
      toolId,
      {
        toolId,
        ...seed,
        sampleVsProductionBoundary: DEFAULT_BUSINESS_BOUNDARY,
        // eslint-disable-next-line security/detect-object-injection
        auditStressTest: BUSINESS_AUDIT_STRESS_TESTS[toolId],
      },
    ])
  )

export const ALL_BUSINESS_TOOL_IDS: string[] = Object.keys(BUSINESS_CAPABILITY_CHECKLISTS)

export function getBusinessCapabilityChecklist(toolId: string): BusinessCapabilitySpec | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return BUSINESS_CAPABILITY_CHECKLISTS[toolId]
}
