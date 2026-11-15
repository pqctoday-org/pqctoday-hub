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

export interface BusinessCapabilitySpec {
  toolId: string
  productionToolCategory: string
  requiredCapabilities: [string, string, string]
  evaluationCriteria: string
  sampleVsProductionBoundary: string
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
      'Asset-level data-retention horizon mapping (X + Y > Z) tied to enterprise data-classification catalogs.',
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
      'Automated Mosca inequality (X + Y > Z) recalculation across all registered business services when threat-horizon assumptions shift.',
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

export const BUSINESS_CAPABILITY_CHECKLISTS: Record<string, BusinessCapabilitySpec> =
  Object.fromEntries(
    Object.entries(BUSINESS_CAPABILITY_SEEDS).map(([toolId, seed]) => [
      toolId,
      {
        toolId,
        ...seed,
        sampleVsProductionBoundary: DEFAULT_BUSINESS_BOUNDARY,
      },
    ])
  )

export const ALL_BUSINESS_TOOL_IDS: string[] = Object.keys(BUSINESS_CAPABILITY_CHECKLISTS)

export function getBusinessCapabilityChecklist(toolId: string): BusinessCapabilitySpec | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return BUSINESS_CAPABILITY_CHECKLISTS[toolId]
}
