// SPDX-License-Identifier: GPL-3.0-only

import type { LucideIcon } from 'lucide-react'
import {
  Home,
  GraduationCap,
  ClipboardCheck,
  FileBarChart,
  Globe,
  AlertTriangle,
  Shield,
  BookOpen,
  ArrowRightLeft,
  FlaskConical,
  Activity,
  ShieldCheck,
  Users,
  Info,
} from 'lucide-react'

export interface MindmapItem {
  id: string
  label: string
  route: string
  icon: LucideIcon
  children?: MindmapItem[]
}

export const MINDMAP_ROOT: MindmapItem = {
  id: 'root',
  label: 'PQC Migration',
  route: '/',
  icon: Shield,
  children: [
    {
      id: 'home',
      label: 'Home',
      route: '/',
      icon: Home,
    },
    {
      id: 'assess',
      label: 'Assess',
      route: '/assess',
      icon: ClipboardCheck,
      children: [
        { id: 'assess-quick', label: 'Quick Mode', route: '/assess', icon: ClipboardCheck },
        { id: 'assess-full', label: 'Full Mode', route: '/assess', icon: ClipboardCheck },
      ],
    },
    {
      id: 'report',
      label: 'Report',
      route: '/report',
      icon: FileBarChart,
      children: [
        { id: 'report-risk', label: 'Risk Score', route: '/report', icon: FileBarChart },
        { id: 'report-threats', label: 'Threat Landscape', route: '/report', icon: FileBarChart },
        { id: 'report-timeline', label: 'Timeline', route: '/report', icon: FileBarChart },
      ],
    },
    {
      id: 'learn',
      label: 'Learn',
      route: '/learn',
      icon: GraduationCap,
      children: [
        { id: 'learn-foundations', label: 'Foundations', route: '/learn', icon: GraduationCap },
        { id: 'learn-strategy', label: 'Strategy', route: '/learn', icon: GraduationCap },
        { id: 'learn-protocols', label: 'Protocols', route: '/learn', icon: GraduationCap },
        { id: 'learn-infra', label: 'Infrastructure', route: '/learn', icon: GraduationCap },
        { id: 'learn-apps', label: 'Applications', route: '/learn', icon: GraduationCap },
        { id: 'learn-exec', label: 'Executive', route: '/learn', icon: GraduationCap },
        { id: 'learn-industries', label: 'Industries', route: '/learn', icon: GraduationCap },
        { id: 'learn-roles', label: 'Role Guides', route: '/learn', icon: GraduationCap },
      ],
    },
    {
      id: 'timeline',
      label: 'Timeline',
      route: '/timeline',
      icon: Globe,
      children: [
        { id: 'timeline-americas', label: 'Americas', route: '/timeline', icon: Globe },
        { id: 'timeline-eu', label: 'EU', route: '/timeline', icon: Globe },
        { id: 'timeline-apac', label: 'APAC', route: '/timeline', icon: Globe },
        { id: 'timeline-global', label: 'Global', route: '/timeline', icon: Globe },
      ],
    },
    {
      id: 'threats',
      label: 'Threats',
      route: '/threats',
      icon: AlertTriangle,
      children: [
        { id: 'threats-finance', label: 'Finance', route: '/threats', icon: AlertTriangle },
        { id: 'threats-health', label: 'Healthcare', route: '/threats', icon: AlertTriangle },
        { id: 'threats-gov', label: 'Government', route: '/threats', icon: AlertTriangle },
        { id: 'threats-telecom', label: 'Telecom', route: '/threats', icon: AlertTriangle },
        { id: 'threats-tech', label: 'Technology', route: '/threats', icon: AlertTriangle },
      ],
    },
    {
      id: 'algorithms',
      label: 'Algorithms',
      route: '/algorithms',
      icon: Shield,
      children: [
        { id: 'algo-compare', label: 'Comparison', route: '/algorithms', icon: Shield },
        { id: 'algo-transitions', label: 'Transitions', route: '/algorithms', icon: Shield },
      ],
    },
    {
      id: 'library',
      label: 'Library',
      route: '/library',
      icon: BookOpen,
      children: [
        { id: 'lib-tree', label: 'Tree View', route: '/library', icon: BookOpen },
        { id: 'lib-grid', label: 'Grid', route: '/library', icon: BookOpen },
        { id: 'lib-activity', label: 'Activity Feed', route: '/library', icon: BookOpen },
      ],
    },
    {
      id: 'migrate',
      label: 'Migrate',
      route: '/migrate',
      icon: ArrowRightLeft,
      children: [
        { id: 'mig-crypto', label: 'Crypto Libraries', route: '/migrate', icon: ArrowRightLeft },
        { id: 'mig-tls', label: 'TLS / Protocol', route: '/migrate', icon: ArrowRightLeft },
        { id: 'mig-vpn', label: 'VPN / Network', route: '/migrate', icon: ArrowRightLeft },
        { id: 'mig-hw', label: 'Hardware', route: '/migrate', icon: ArrowRightLeft },
        { id: 'mig-db', label: 'Database', route: '/migrate', icon: ArrowRightLeft },
        { id: 'mig-cloud', label: 'Cloud', route: '/migrate', icon: ArrowRightLeft },
        { id: 'mig-browser', label: 'Web Browsers', route: '/migrate', icon: ArrowRightLeft },
      ],
    },
    {
      id: 'playground',
      label: 'Playground',
      route: '/playground',
      icon: FlaskConical,
      children: [
        { id: 'pg-kem', label: 'KEM', route: '/playground', icon: FlaskConical },
        { id: 'pg-sign', label: 'Sign', route: '/playground', icon: FlaskConical },
        { id: 'pg-hsm', label: 'SoftHSM', route: '/playground', icon: FlaskConical },
      ],
    },
    {
      id: 'openssl',
      label: 'OpenSSL Studio',
      route: '/openssl',
      icon: Activity,
      children: [
        { id: 'ossl-keygen', label: 'Key Gen', route: '/openssl', icon: Activity },
        { id: 'ossl-csr', label: 'CSR', route: '/openssl', icon: Activity },
        { id: 'ossl-certs', label: 'Certificates', route: '/openssl', icon: Activity },
        { id: 'ossl-enc', label: 'Encryption', route: '/openssl', icon: Activity },
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance',
      route: '/compliance',
      icon: ShieldCheck,
      children: [
        { id: 'comp-table', label: 'Table', route: '/compliance', icon: ShieldCheck },
        { id: 'comp-landscape', label: 'Landscape', route: '/compliance', icon: ShieldCheck },
      ],
    },
    {
      id: 'leaders',
      label: 'Leaders',
      route: '/leaders',
      icon: Users,
      children: [
        { id: 'lead-public', label: 'Public', route: '/leaders', icon: Users },
        { id: 'lead-private', label: 'Private', route: '/leaders', icon: Users },
        { id: 'lead-academic', label: 'Academic', route: '/leaders', icon: Users },
      ],
    },
    {
      id: 'about',
      label: 'About',
      route: '/about',
      icon: Info,
    },
    {
      id: 'changelog',
      label: 'Changelog',
      route: '/changelog',
      icon: Activity,
    },
  ],
}

/** Recursively find a MindmapItem by id */
export function findItemById(
  id: string,
  item: MindmapItem = MINDMAP_ROOT
): MindmapItem | undefined {
  if (item.id === id) return item
  for (const child of item.children ?? []) {
    const found = findItemById(id, child)
    if (found) return found
  }
  return undefined
}

/** Flat list of items that can be used as a root (items with children) */
export const ROOT_PICKER_ITEMS: { id: string; label: string }[] = [
  { id: MINDMAP_ROOT.id, label: MINDMAP_ROOT.label },
  ...(MINDMAP_ROOT.children ?? [])
    .filter((c) => c.children && c.children.length > 0)
    .map((c) => ({ id: c.id, label: c.label })),
]
