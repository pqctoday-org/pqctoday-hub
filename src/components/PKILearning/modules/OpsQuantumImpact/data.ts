// SPDX-License-Identifier: GPL-3.0-only
import type { RoleGuideData } from '../../common/roleGuide/types'

export const OPS_GUIDE_DATA: RoleGuideData = {
  roleId: 'ops',
  roleLabel: 'IT Ops / DevOps',
  tagline:
    'You deploy, monitor, and operate the cryptographic infrastructure that protects the organization. PQC migration starts with your toolchain.',

  urgencyStatement:
    'Certificate rotation, VPN tunnel configuration, SSH key management, and TLS termination are all in your domain \u2014 and all will change with PQC. Larger certificates, different key exchange protocols, and new monitoring thresholds mean your operational playbooks need updating before the migration begins. If you manage the infrastructure, you are on the front line of the quantum transition.',

  threatImpacts: [
    {
      id: 'cert-rotation',
      title: 'Certificate Rotation at Scale',
      description:
        'PQC certificates are 10-50x larger. Automated certificate management (ACME, cert-manager) needs testing with new sizes.',
      severity: 'critical',
      timeframe: '2025-2028',
      exampleScenario:
        'Your Kubernetes cluster uses cert-manager to auto-rotate 500 TLS certificates. ML-DSA certificates are 4KB each vs. 400 bytes for ECDSA. The cert-manager CRD size limits are exceeded, and certificate renewal starts failing silently across the cluster.',
    },
    {
      id: 'vpn-ssh-upgrade',
      title: 'VPN & SSH Key Exchange Upgrades',
      description:
        'IPsec IKEv2 and SSH key exchange protocols must transition to PQC across entire device fleets.',
      severity: 'critical',
      timeframe: '2025-2030',
      exampleScenario:
        'Your organization has 2,000 remote workers using IPsec VPN with ECDH key exchange. The security team mandates ML-KEM migration, but 30% of your VPN concentrators don\u2019t support the new protocol version. You face a fleet-wide hardware refresh.',
    },
    {
      id: 'monitoring-thresholds',
      title: 'Performance Monitoring Thresholds',
      description:
        'PQC operations have different performance profiles. Existing monitoring baselines, alerts, and SLAs need recalibration.',
      severity: 'high',
      timeframe: '2025-2028',
      exampleScenario:
        'Your TLS handshake latency alert fires at >10ms. ML-KEM key exchange adds 3-5ms. After PQC migration, you get 10,000 false-positive alerts per day until thresholds are updated. Meanwhile, real performance issues are lost in the noise.',
    },
    {
      id: 'deployment-pipelines',
      title: 'CI/CD Pipeline Updates',
      description:
        'Build, sign, and deploy pipelines need PQC-aware signing verification and certificate validation.',
      severity: 'high',
      timeframe: '2026-2030',
      exampleScenario:
        'Your deployment pipeline verifies container image signatures with ECDSA before rolling out. When the signing team switches to ML-DSA, your verification step fails and blocks all deployments until the pipeline is updated.',
    },
    {
      id: 'config-management',
      title: 'Configuration Management Drift',
      description:
        'Ansible/Terraform/Chef crypto configurations (cipher suites, key types, algorithm settings) must be updated fleet-wide.',
      severity: 'medium',
      timeframe: '2025-2028',
      exampleScenario:
        'Your Ansible playbooks hardcode `tls_cipher_suites: ECDHE-ECDSA-AES256-GCM-SHA384` across 300 servers. PQC migration requires updating every configuration template and testing for backward compatibility during the phased rollout.',
    },
    {
      id: 'incident-response',
      title: 'Incident Response Procedures',
      description:
        'Key compromise procedures, certificate revocation workflows, and crypto-failure runbooks need PQC-specific updates.',
      severity: 'medium',
      timeframe: '2026-2030',
      exampleScenario:
        'A PQC key compromise is detected. Your incident response runbook covers RSA/ECC revocation but has no procedure for ML-DSA key compromise. The team loses hours figuring out the PQC-specific revocation and re-keying process.',
    },
  ],

  selfAssessment: [
    {
      id: 'manages-certs',
      label: 'I manage TLS certificate lifecycle (issuance, renewal, revocation)',
      weight: 15,
    },
    {
      id: 'manages-vpn',
      label: 'I configure and maintain VPN gateways or SSH infrastructure',
      weight: 15,
    },
    {
      id: 'manages-fleet',
      label: 'I manage a fleet of 100+ servers, containers, or devices',
      weight: 10,
    },
    {
      id: 'config-mgmt',
      label: 'I use configuration management tools (Ansible, Terraform, Chef)',
      weight: 10,
    },
    {
      id: 'cicd-pipeline',
      label: 'I maintain CI/CD pipelines with cryptographic verification steps',
      weight: 10,
    },
    { id: 'monitoring', label: 'I set and maintain performance monitoring thresholds', weight: 8 },
    {
      id: 'no-pqc-playbook',
      label: 'We have no operational playbooks for PQC migration or PQC incident response',
      weight: 12,
    },
    {
      id: 'manual-cert',
      label: 'Some certificate operations are still manual (not fully automated)',
      weight: 10,
    },
    {
      id: 'multi-ca',
      label: 'We use certificates from multiple CAs with different PQC timelines',
      weight: 10,
    },
  ],

  skillGaps: [
    {
      id: 'cert-lifecycle',
      category: 'Certificate Operations',
      skill: 'PQC Certificate Lifecycle',
      description:
        'Managing issuance, renewal, rotation, and revocation of PQC and hybrid certificates at scale.',
      targetLevel: 'advanced',
      linkedModules: [{ id: 'pki-workshop', label: 'PKI' }],
    },
    {
      id: 'tls-config',
      category: 'Certificate Operations',
      skill: 'PQC TLS Configuration',
      description: 'Configuring servers, load balancers, and proxies for PQC TLS cipher suites.',
      targetLevel: 'advanced',
      linkedModules: [
        { id: 'tls-basics', label: 'TLS Basics' },
        { id: 'os-pqc', label: 'OS PQC' },
      ],
    },
    {
      id: 'vpn-ssh-config',
      category: 'Network Security',
      skill: 'PQC VPN & SSH Configuration',
      description:
        'Configuring IPsec IKEv2 with ML-KEM and SSH with PQC key exchange across device fleets.',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'vpn-ssh-pqc', label: 'VPN/SSH PQC' },
        { id: 'network-security-pqc', label: 'Network Security' },
      ],
    },
    {
      id: 'kms-ops',
      category: 'Key Management',
      skill: 'KMS Operations for PQC',
      description:
        'Operating key management systems with PQC key types, rotation policies, and envelope encryption.',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'kms-pqc', label: 'KMS & PQC' },
        { id: 'database-encryption-pqc', label: 'Database Encryption' },
      ],
    },
    {
      id: 'fleet-migration',
      category: 'Migration Operations',
      skill: 'Fleet Migration Planning',
      description:
        'Planning and executing phased PQC rollouts across server/container fleets with rollback capabilities.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'migration-program', label: 'Migration Program' }],
    },
    {
      id: 'monitoring-pqc',
      category: 'Migration Operations',
      skill: 'PQC Monitoring & Alerting',
      description:
        'Establishing monitoring baselines for PQC handshake latency, key generation times, and certificate sizes.',
      targetLevel: 'basic',
      linkedModules: [],
    },
    {
      id: 'iot-ops',
      category: 'Specialized Operations',
      skill: 'IoT/OT PQC Operations',
      description:
        'Managing PQC transitions for constrained IoT devices and operational technology systems.',
      targetLevel: 'basic',
      linkedModules: [
        { id: 'iot-ot-pqc', label: 'IoT/OT PQC' },
        { id: 'secure-boot-pqc', label: 'Secure Boot' },
      ],
    },
    {
      id: 'crypto-agility-ops',
      category: 'Specialized Operations',
      skill: 'Operational Crypto Agility',
      description:
        'Maintaining systems that support algorithm switching without downtime or data loss.',
      targetLevel: 'basic',
      linkedModules: [{ id: 'crypto-agility', label: 'Crypto Agility' }],
    },
  ],

  knowledgeDomains: [
    {
      name: 'Certificate & TLS Operations',
      description: 'Master PQC certificate management and TLS configuration at scale.',
      modules: [
        { id: 'tls-basics', label: 'TLS Basics' },
        { id: 'pki-workshop', label: 'PKI' },
      ],
    },
    {
      name: 'Network Protocol Migration',
      description: 'Configure VPN, SSH, and web gateways for PQC key exchange.',
      modules: [
        { id: 'vpn-ssh-pqc', label: 'VPN/SSH PQC' },
        { id: 'web-gateway-pqc', label: 'Web Gateways' },
      ],
    },
    {
      name: 'Key & Infrastructure Management',
      description: 'Operate KMS and HSM infrastructure with PQC algorithms.',
      modules: [
        { id: 'kms-pqc', label: 'KMS & PQC' },
        { id: 'hsm-pqc', label: 'HSM & PQC' },
      ],
    },
    {
      name: 'Migration Execution',
      description: 'Plan and execute phased migrations for fleets and constrained environments.',
      modules: [
        { id: 'migration-program', label: 'Migration Program' },
        { id: 'iot-ot-pqc', label: 'IoT/OT PQC' },
        { id: 'crypto-agility', label: 'Crypto Agility' },
      ],
    },
  ],

  actionItems: [
    {
      id: 'ops-immediate-1',
      phase: 'immediate',
      title: 'Inventory Certificates & Keys',
      description:
        'Create a comprehensive inventory of all TLS certificates, SSH keys, and VPN configurations.',
      checklist: [
        'List all TLS certificates with CA, expiry, key type, and key size',
        'Inventory all SSH authorized_keys and host keys',
        'Document VPN gateway configurations (IKEv2 cipher suites, key exchange)',
        'Check automation tools (cert-manager, ACME) for PQC compatibility',
      ],
    },
    {
      id: 'ops-30d-1',
      phase: '30-day',
      title: 'Lab Test PQC Protocols',
      description: 'Set up a lab environment to test PQC TLS, VPN, and SSH configurations.',
      checklist: [
        'Deploy PQC-enabled TLS termination in lab (nginx/HAProxy with ML-KEM)',
        'Test SSH connection with PQC key exchange (OpenSSH 9.x)',
        'Validate VPN tunnel with hybrid IKEv2 key exchange',
        'Measure PQC handshake latency and compare to current baselines',
      ],
    },
    {
      id: 'ops-90d-1',
      phase: '90-day',
      title: 'Plan Phased Certificate Rollover',
      description: 'Design the migration sequence for certificate and key transitions.',
      checklist: [
        'Categorize certificates by migration priority (internet-facing first)',
        'Design rollback procedures for each migration phase',
        'Update monitoring thresholds for PQC performance profiles',
        'Update deployment playbooks with PQC configuration templates',
        'Test automated certificate renewal with PQC certificates',
      ],
    },
    {
      id: 'ops-6mo-1',
      phase: '6-month',
      title: 'Execute Pilot Migration',
      description: 'Migrate a non-critical system to PQC as a proof-of-concept.',
      checklist: [
        'Select non-critical system for PQC pilot migration',
        'Execute certificate switchover with monitoring enabled',
        'Validate all monitoring and alerting with PQC thresholds',
        'Document operational runbook for PQC incident response',
        'Report findings and establish migration playbook for broader rollout',
      ],
    },
  ],

  quickWins: [
    {
      id: 'qw-cert-list',
      label: 'List all your TLS certificates',
      description:
        'Run a certificate discovery scan. Most organizations don\u2019t know their full cert inventory.',
    },
    {
      id: 'qw-ssh-check',
      label: 'Check your OpenSSH version',
      description: 'OpenSSH 9.x supports hybrid PQC key exchange. Run `ssh -V` on your servers.',
    },
    {
      id: 'qw-vpn-vendor',
      label: 'Check your VPN vendor\u2019s PQC roadmap',
      description: 'Cisco, Palo Alto, and Fortinet have published PQC support timelines.',
    },
  ],

  kpiMetrics: [
    {
      label: 'Certificate Inventory',
      target: '100%',
      description: 'All TLS certificates, SSH keys, and VPN configs inventoried.',
    },
    {
      label: 'Lab Validation',
      target: 'Complete',
      description: 'PQC TLS, SSH, and VPN tested in lab environment.',
    },
    {
      label: 'Monitoring Coverage',
      target: '100%',
      description: 'All crypto operations have PQC-aware monitoring thresholds.',
    },
    {
      label: 'Playbook Coverage',
      target: '100%',
      description: 'Operational playbooks updated for PQC certificate and key operations.',
    },
    {
      label: 'Automation Readiness',
      target: 'Validated',
      description:
        'Certificate automation tools (ACME, cert-manager) tested with PQC certificates.',
    },
    {
      label: 'Pilot Completion',
      target: '1 system',
      description: 'At least one non-critical system fully migrated to PQC.',
    },
  ],
}
