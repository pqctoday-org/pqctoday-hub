// SPDX-License-Identifier: GPL-3.0-only

export type ToolCategory = 'passive-discovery' | 'active-scanning' | 'benchmarking' | 'interop' | 'side-channel' | 'inventory'
export type ToolLicense = 'open-source' | 'commercial' | 'freemium'

export interface TestingTool {
  id: string
  name: string
  vendor: string
  category: ToolCategory
  license: ToolLicense
  description: string
  pqcSupport: string
  strengths: string[]
  limitations: string[]
  repositoryUrl?: string
  productUrl: string
  bestFor: string
}

export const TESTING_TOOLS: TestingTool[] = [
  // Passive Discovery
  {
    id: 'cryptonext-compass',
    name: 'COMPASS Network Probe',
    vendor: 'CryptoNext Security',
    category: 'passive-discovery',
    license: 'commercial',
    description: 'Passive high-performance cryptographic data detection network probe. Identifies all cryptographic algorithms across 100+ IT/OT protocols via SPAN/TAP without packet injection.',
    pqcSupport: 'ML-KEM, ML-DSA, SLH-DSA (NIST CAVP certified)',
    strengths: ['Zero packet injection — production-safe', 'NIST NCCoE recommended', 'First EU vendor with all 3 NIST PQC CAVP certifications', '100+ IT/OT protocols', 'Hardened appliance with PQC-secured management'],
    limitations: ['Commercial pricing', 'Appliance deployment required', 'Cannot validate active PQC support — passive only'],
    productUrl: 'https://www.cryptonext-security.com/en/products-cryptography-discovery-and-inventory/',
    bestFor: 'Critical infrastructure, regulated industries requiring NIST NCCoE-recommended tooling',
  },
  {
    id: 'pqc-flow',
    name: 'pqc-flow',
    vendor: 'CipherIQ',
    category: 'passive-discovery',
    license: 'open-source',
    description: 'Open-source passive analyzer detecting PQC in encrypted network traffic. Analyzes TLS/SSH/QUIC flow metadata without storing payload content.',
    pqcSupport: 'ML-KEM, ML-DSA, hybrid algorithms in TLS 1.3, SSH, QUIC',
    strengths: ['Free and open source', 'Privacy-preserving (no payload storage)', 'Lightweight — runs on commodity hardware', 'Supports TLS 1.3, SSH, QUIC'],
    limitations: ['No OT protocol support', 'Community-supported (no SLA)', 'Requires manual deployment and tuning'],
    repositoryUrl: 'https://github.com/CipherIQ/pqc-flow',
    productUrl: 'https://github.com/CipherIQ/pqc-flow',
    bestFor: 'Teams starting crypto discovery without budget for commercial tools',
  },
  {
    id: 'viavi-observer',
    name: 'Observer Analyzer',
    vendor: 'VIAVI Solutions',
    category: 'passive-discovery',
    license: 'commercial',
    description: 'Enterprise network protocol analyzer supporting 740+ protocols with SSL/TLS monitoring, certificate validation, and Threat Forensics for retrospective cryptographic analysis.',
    pqcSupport: 'TLS/SSL monitoring — PQC detection in development',
    strengths: ['740+ protocol support', 'Threat Forensics for historical analysis', 'Enterprise support and SLA', 'Integrates with VIAVI TeraVM ecosystem'],
    limitations: ['PQC detection not yet production-ready', 'Commercial pricing', 'Windows-primary platform'],
    productUrl: 'https://www.viavisolutions.com/en-us/enterprise/products/observer-analyzer',
    bestFor: 'Enterprises already using VIAVI ecosystem for network management',
  },

  // Active Scanning
  {
    id: 'pqcscan',
    name: 'pqcscan',
    vendor: 'Anvil Secure',
    category: 'active-scanning',
    license: 'open-source',
    description: 'High-performance open-source TLS and SSH scanner written in Rust. Probes endpoints for PQC algorithm support, hybrid key exchange detection, and quantum-vulnerable configurations.',
    pqcSupport: 'Detects ML-KEM, ML-DSA hybrid algorithms; PQC OID identification',
    strengths: ['Fast Rust implementation', 'TLS + SSH scan modes', 'JSON + HTML report output', 'Binary releases for Linux/macOS/Windows', 'BSD licensed'],
    limitations: ['Active scanning only — not passive', 'No OT protocol support', 'No GUI'],
    repositoryUrl: 'https://github.com/anvilsecure/pqcscan',
    productUrl: 'https://github.com/anvilsecure/pqcscan',
    bestFor: 'DevSecOps pipelines, scheduled endpoint audits, quick PQC readiness checks',
  },
  {
    id: 'cryptolyzer',
    name: 'CryptoLyzer',
    vendor: 'Community (c0r0n3r)',
    category: 'active-scanning',
    license: 'open-source',
    description: 'Multi-protocol cryptographic analyzer for TLS, SSL, SSH, and DNSSEC. Custom protocol parser with comprehensive cipher suite recognition and JA3/HASSH fingerprinting.',
    pqcSupport: 'Emerging — detects experimental PQC algorithm OIDs',
    strengths: ['Multi-protocol: TLS, SSH, DNSSEC', 'JA3/HASSH fingerprinting', 'Python API for automation', 'Comprehensive cipher suite database'],
    limitations: ['PQC support still emerging', 'No dedicated hybrid KEM detection', 'Community-supported'],
    repositoryUrl: 'https://gitlab.com/coroner/cryptolyzer',
    productUrl: 'https://gitlab.com/coroner/cryptolyzer',
    bestFor: 'Security engineers needing multi-protocol analysis with Python automation',
  },

  // Benchmarking
  {
    id: 'viavi-teravm',
    name: 'TeraVM Security Test',
    vendor: 'VIAVI Solutions',
    category: 'benchmarking',
    license: 'commercial',
    description: 'Cloud-enabled platform for PQC performance benchmarking of VPN gateways and IPSec systems. Emulates tens of thousands of concurrent users with realistic application traffic.',
    pqcSupport: 'ML-KEM, ML-DSA, SLH-DSA — all NIST standards',
    strengths: ['Purpose-built for PQC performance testing', 'Cloud-native deployment', 'Realistic workload emulation (video, collaboration)', 'Hybrid scenario support (PQC initiator + classical responder)', 'QNu Labs QKD/QRNG test badging'],
    limitations: ['Commercial pricing', 'Primarily VPN/IPSec focused', 'Requires test infrastructure'],
    productUrl: 'https://www.viavisolutions.com/en-us/news-releases/viavi-introduces-performance-testing-post-quantum-cryptography-deployments',
    bestFor: 'Enterprises validating VPN gateway capacity before PQC rollout',
  },
  {
    id: 'keysight-cyperf',
    name: 'CyPerf',
    vendor: 'Keysight Technologies',
    category: 'benchmarking',
    license: 'freemium',
    description: 'Cloud-native network security test platform validating hybrid PQC TLS 1.3 handshakes at scale. Community Edition available free.',
    pqcSupport: 'X25519+ML-KEM-768 hybrid TLS 1.3',
    strengths: ['Community Edition free', 'Cloud-native (AWS/Azure/GCP)', 'Up to 400 Gbps stateful traffic', 'Integrates with BreakingPoint for security testing'],
    limitations: ['Full PQC algorithm range limited to hybrid X25519+ML-KEM-768', 'Commercial version for full features', 'Primarily TLS/network focused — not IPSec'],
    productUrl: 'https://www.keysight.com/us/en/products/security-attack-emulation/security-attack-emulation-software/cyperf.html',
    bestFor: 'Cloud-native teams needing free-to-start PQC TLS performance testing',
  },
  {
    id: 'pqc-leo',
    name: 'PQC-LEO',
    vendor: 'Open Source (crt26)',
    category: 'benchmarking',
    license: 'open-source',
    description: 'Automated PQC benchmarking framework measuring computational and TLS-layer performance for all NIST PQC algorithms across x86 and ARM. Peer-reviewed in academic literature.',
    pqcSupport: 'All NIST PQC standards via OpenSSL + OQS provider',
    strengths: ['Fully automated test suite', 'x86 + ARM support', 'Academic rigor — peer-reviewed', 'Generates comparative analysis reports', 'Free and open source'],
    limitations: ['Lab/research focused — not enterprise-scale', 'Requires OpenSSL + OQS provider setup', 'No GUI'],
    repositoryUrl: 'https://github.com/crt26/pqc-evaluation-tools',
    productUrl: 'https://github.com/crt26/pqc-evaluation-tools',
    bestFor: 'Researchers and architects generating hardware sizing data for PQC migration planning',
  },

  // Interoperability
  {
    id: 'oqs-test-server',
    name: 'OQS Interop Test Server',
    vendor: 'Open Quantum Safe',
    category: 'interop',
    license: 'open-source',
    description: 'Public test infrastructure at test.openquantumsafe.org offering all NIST PQC algorithm combinations across separate test ports for TLS interoperability validation.',
    pqcSupport: 'All NIST KEMs and signature algorithms + hybrid combinations',
    strengths: ['Free public access', 'All algorithm combinations', 'Maintained by OQS project (Linux Foundation)', 'Reference for RFC compliance'],
    limitations: ['Public server — not for sensitive testing', 'No SLA', 'Network-dependent (external service)'],
    repositoryUrl: 'https://github.com/open-quantum-safe/oqs-demos',
    productUrl: 'https://test.openquantumsafe.org',
    bestFor: 'Validating client PQC implementation against known-good reference server',
  },

  // Side-Channel
  {
    id: 'keysight-inspector',
    name: 'Inspector',
    vendor: 'Keysight Technologies',
    category: 'side-channel',
    license: 'commercial',
    description: 'Device security testing platform with Crypto 3 framework for PQC side-channel analysis (TVLA) and fault injection testing. Dilithium TVLA generator and Known Key Analysis for ML-DSA.',
    pqcSupport: 'ML-DSA (production), ML-KEM (pre-release), SLH-DSA (pre-release)',
    strengths: ['Purpose-built TVLA for ML-DSA/ML-KEM', 'Captures millions of traces/second', 'Fault injection testing', 'FIPS 140-3 Level 4 validation support', 'NXP + PQShield validated'],
    limitations: ['Commercial pricing (significant investment)', 'Lab environment required', 'Specialized expertise needed', 'Hardware testbench required for physical testing'],
    productUrl: 'https://www.keysight.com/us/en/cmp/2025/pqc-security.html',
    bestFor: 'Semiconductor vendors and device manufacturers seeking CMVP certification',
  },
  {
    id: 'chipwhisperer',
    name: 'ChipWhisperer',
    vendor: 'NewAE Technology',
    category: 'side-channel',
    license: 'open-source',
    description: 'Open-source side-channel analysis and fault injection platform. Community standard for power analysis research on embedded cryptographic implementations.',
    pqcSupport: 'Community PQC modules for Kyber/Dilithium power analysis',
    strengths: ['Open source — affordable', 'Large community and tutorial base', 'Supports power analysis + fault injection', 'Python API for automation', 'Academic standard tool'],
    limitations: ['Lower capture rate than commercial tools', 'Requires hardware (ChipWhisperer board)', 'PQC modules still research-quality', 'Not certified for formal FIPS evaluation'],
    repositoryUrl: 'https://github.com/newaetech/chipwhisperer',
    productUrl: 'https://www.newae.com/chipwhisperer',
    bestFor: 'Research labs and security teams building early PQC implementation validation capability',
  },

  // Inventory
  {
    id: 'cbomkit',
    name: 'CBOMkit',
    vendor: 'IBM (Open Source)',
    category: 'inventory',
    license: 'open-source',
    description: 'Toolset for Cryptography Bill of Materials generation via git repository scanning. Produces CycloneDX CBOM standard output compatible with existing SBOM toolchains.',
    pqcSupport: 'Detects quantum-vulnerable algorithm usage in source code and binaries',
    strengths: ['Git repository integration', 'CycloneDX CBOM standard', 'Free and open source', 'IBM-contributed to CycloneDX 1.6 SBOM spec'],
    limitations: ['Code-level analysis only — not network scanning', 'Requires source code access', 'PQC detection still maturing'],
    repositoryUrl: 'https://github.com/cbomkit/cbomkit',
    productUrl: 'https://github.com/cbomkit/cbomkit',
    bestFor: 'Development teams generating crypto inventory from source code as part of SBOM/CBOM compliance',
  },
]

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, { label: string; description: string }> = {
  'passive-discovery': { label: 'Passive Discovery', description: 'Monitor network traffic without injection' },
  'active-scanning': { label: 'Active Scanning', description: 'Probe endpoints for PQC support' },
  benchmarking: { label: 'Performance Benchmarking', description: 'Measure PQC impact on throughput & latency' },
  interop: { label: 'Interoperability Testing', description: 'Validate cross-vendor PQC compatibility' },
  'side-channel': { label: 'Side-Channel / TVLA', description: 'Assess implementation security' },
  inventory: { label: 'Crypto Inventory', description: 'Catalog all cryptographic assets' },
}

export const TOOL_LICENSE_LABELS: Record<ToolLicense, { label: string; color: string }> = {
  'open-source': { label: 'Open Source', color: 'text-status-success' },
  commercial: { label: 'Commercial', color: 'text-status-info' },
  freemium: { label: 'Freemium', color: 'text-status-warning' },
}
