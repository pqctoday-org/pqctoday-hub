// SPDX-License-Identifier: GPL-3.0-only
//
// Infrastructure layer taxonomy — hoisted out of the unrendered
// `Migrate/InfrastructureStack.tsx` component (item 7, migrate remediation).
// `LAYERS` and `InfrastructureLayerType` are the only pieces of that file with
// real consumers elsewhere (CBOM scanner, vendor risk matrix, Assess step 11,
// module migrate tab); the rest of that component was dead, unrendered code.

import { Server, Monitor, Database, Code, Cloud, ShieldCheck, Network, Laptop } from 'lucide-react'

export type InfrastructureLayerType =
  | 'All'
  | 'Hardware'
  | 'OS'
  | 'Security Stack'
  | 'Database'
  | 'AppServers'
  | 'Libraries'
  | 'SecSoftware'
  | 'Network'
  | 'Cloud'

export const LAYERS = [
  {
    id: 'Cloud',
    label: 'Cloud',
    icon: Cloud,
    description:
      'Cloud KMS, Cloud HSM, Encryption Gateways, Crypto Agility, KMS, IAM, Crypto Discovery, Digital Identity',
    colorToken: '--color-primary',
    colorFallback: '#0ea5e9',
    activeColor: 'bg-card border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]',
    iconColor: 'text-primary',
    borderColor: 'border-primary',
  },
  {
    id: 'Network',
    label: 'Network',
    icon: Network,
    description:
      'VPN, IPsec, Network Security, Network Encryptors, Protocol Analyzers, 5G & Telecom, Testing & Validation',
    colorToken: '--color-info',
    colorFallback: '#3b82f6',
    activeColor: 'bg-card border-info shadow-[0_0_15px_hsl(var(--info)/0.5)]',
    iconColor: 'text-primary',
    borderColor: 'border-info',
  },
  {
    id: 'AppServers',
    label: 'Application Servers',
    icon: Laptop,
    description:
      'TLS/SSL, SSH, Web Browsers, App Servers, Email, Messaging, Blockchain, Payment, VPN, Remote Access, CI/CD',
    colorToken: '--color-secondary',
    colorFallback: '#8b5cf6',
    activeColor: 'bg-card border-secondary shadow-[0_0_15px_hsl(var(--secondary)/0.5)]',
    iconColor: 'text-secondary',
    borderColor: 'border-secondary',
  },
  {
    id: 'Libraries',
    label: 'Libraries & SDKs',
    icon: Code,
    description:
      'Cryptographic Libraries, PQC Libraries, API Security, Code Signing, Digital Signatures, Disk Encryption, SDKs',
    colorToken: '--color-accent',
    colorFallback: '#2d9e6b',
    activeColor: 'bg-card border-accent shadow-[0_0_15px_hsl(var(--accent)/0.5)]',
    iconColor: 'text-accent',
    borderColor: 'border-accent',
  },
  {
    id: 'SecSoftware',
    label: 'Security Software',
    icon: Server,
    description:
      'Data Protection, Digital Identity, Secrets Management, Security Discovery, IoT/OT, AI/ML Security, Supply Chain',
    colorToken: '--color-tertiary',
    colorFallback: '#a855f7',
    activeColor: 'bg-card border-tertiary shadow-[0_0_15px_hsl(var(--tertiary)/0.5)]',
    iconColor: 'text-tertiary',
    borderColor: 'border-tertiary',
  },
  {
    id: 'Database',
    label: 'Database',
    icon: Database,
    description: 'Database Encryption Software',
    colorToken: '--color-success',
    colorFallback: '#22c55e',
    activeColor: 'bg-card border-success shadow-[0_0_15px_hsl(var(--success)/0.5)]',
    iconColor: 'text-accent',
    borderColor: 'border-success',
  },
  {
    id: 'Security Stack',
    label: 'Security Stack',
    icon: ShieldCheck,
    description:
      'KMS, PKI, Crypto & PQC Libraries, CLM, Secrets, IAM, CIAM, Data Protection, Crypto Discovery, TLS/SSL, Digital Identity',
    colorToken: '--color-destructive',
    colorFallback: '#ef4444',
    activeColor: 'bg-card border-destructive shadow-[0_0_15px_hsl(var(--destructive)/0.5)]',
    iconColor: 'text-destructive',
    borderColor: 'border-destructive',
  },
  {
    id: 'OS',
    label: 'Operating System',
    icon: Monitor,
    description: 'Operating Systems, Network OS, Disk & File Encryption',
    colorToken: '--color-warning',
    colorFallback: '#f59e0b',
    activeColor: 'bg-card border-warning shadow-[0_0_15px_hsl(var(--warning)/0.5)]',
    iconColor: 'text-warning',
    borderColor: 'border-warning',
  },
  {
    id: 'Hardware',
    label: 'Hardware & Secure Elements',
    icon: Server,
    description:
      'HSMs, Smart Cards, Secure Boot, Semiconductors, QRNG, QKD, Confidential Computing, 5G & Telecom',
    colorToken: '--color-muted-foreground',
    colorFallback: '#6b7280',
    activeColor:
      'bg-card border-muted-foreground shadow-[0_0_15px_hsl(var(--muted-foreground)/0.5)]',
    iconColor: 'text-muted-foreground',
    borderColor: 'border-muted-foreground',
  },
]
