// SPDX-License-Identifier: GPL-3.0-only

import { useMemo } from 'react'
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
  FileText,
  Box,
  User,
  Calendar,
  Layers,
} from 'lucide-react'
import type { MindmapItem } from './mindmapData'
import { libraryData } from '@/data/libraryData'
import { threatsData } from '@/data/threatsData'
import { softwareData } from '@/data/migrateData'
import { leadersData } from '@/data/leadersData'
import { timelineData } from '@/data/timelineData'
import { complianceFrameworks } from '@/data/complianceData'
import { MODULE_TRACKS } from '@/components/PKILearning/moduleData'

/** Group an array by a key function */
function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const existing = groups.get(key)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(key, [item])
    }
  }
  return groups
}

function buildLearnChildren(): MindmapItem[] {
  return MODULE_TRACKS.map((track) => ({
    id: `learn-${track.track.toLowerCase().replace(/\s+/g, '-')}`,
    label: track.track,
    route: '/learn',
    icon: GraduationCap,
    children: track.modules.map((mod) => ({
      id: `mod-${mod.id}`,
      label: mod.title,
      route: `/learn/${mod.id}`,
      icon: GraduationCap,
    })),
  }))
}

function buildLibraryChildren(): MindmapItem[] {
  const byCategory = groupBy(libraryData, (d) => d.categories?.[0] ?? 'Other')
  return [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({
      id: `lib-cat-${category.toLowerCase().replace(/\W+/g, '-')}`,
      label: `${category} (${items.length})`,
      route: '/library',
      icon: BookOpen,
      children: items.map((item) => ({
        id: `lib-${item.referenceId}`,
        label: item.documentTitle,
        route: '/library',
        icon: FileText,
      })),
    }))
}

function buildThreatsChildren(): MindmapItem[] {
  const byIndustry = groupBy(threatsData, (t) => t.industry)
  return [...byIndustry.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([industry, items]) => ({
      id: `threat-ind-${industry.toLowerCase().replace(/\W+/g, '-')}`,
      label: `${industry} (${items.length})`,
      route: '/threats',
      icon: AlertTriangle,
      children: items.map((t) => ({
        id: `threat-${t.threatId}`,
        label: `${t.threatId} — ${t.cryptoAtRisk}`,
        route: '/threats',
        icon: AlertTriangle,
      })),
    }))
}

function buildMigrateChildren(): MindmapItem[] {
  const byLayer = groupBy(softwareData, (s) => s.infrastructureLayer ?? 'Other')
  return [...byLayer.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([layer, items]) => ({
      id: `mig-layer-${layer.toLowerCase().replace(/\W+/g, '-')}`,
      label: `${layer} (${items.length})`,
      route: '/migrate',
      icon: Layers,
      children: items.map((s) => ({
        id: `mig-${s.softwareName.toLowerCase().replace(/\W+/g, '-')}`,
        label: s.softwareName,
        route: '/migrate',
        icon: Box,
      })),
    }))
}

function buildLeadersChildren(): MindmapItem[] {
  const byType = groupBy(leadersData, (l) => l.type ?? 'Other')
  return [...byType.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, items]) => ({
      id: `lead-type-${type.toLowerCase().replace(/\W+/g, '-')}`,
      label: `${type} (${items.length})`,
      route: '/leaders',
      icon: Users,
      children: items.map((l) => ({
        id: `lead-${l.name.toLowerCase().replace(/\W+/g, '-')}`,
        label: l.name,
        route: '/leaders',
        icon: User,
      })),
    }))
}

function buildTimelineChildren(): MindmapItem[] {
  return timelineData.map((country) => ({
    id: `tl-${country.countryName.toLowerCase().replace(/\W+/g, '-')}`,
    label: `${country.countryName} (${country.bodies.reduce((n, b) => n + b.events.length, 0)})`,
    route: '/timeline',
    icon: Globe,
    children: country.bodies.map((body) => ({
      id: `tl-${country.countryName}-${body.name}`.toLowerCase().replace(/\W+/g, '-'),
      label: `${body.name} (${body.events.length})`,
      route: '/timeline',
      icon: Globe,
      children: body.events.map((ev, i) => ({
        id: `tl-ev-${country.countryName}-${body.name}-${i}`.toLowerCase().replace(/\W+/g, '-'),
        label: ev.title,
        route: '/timeline',
        icon: Calendar,
      })),
    })),
  }))
}

function buildComplianceChildren(): MindmapItem[] {
  const byType = groupBy(complianceFrameworks, (f) => f.bodyType ?? 'Other')
  return [...byType.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, items]) => ({
      id: `comp-type-${type.toLowerCase().replace(/\W+/g, '-')}`,
      label: `${type.replace(/_/g, ' ')} (${items.length})`,
      route: '/compliance',
      icon: ShieldCheck,
      children: items.map((fw) => ({
        id: `comp-${fw.id}`,
        label: fw.label,
        route: '/compliance',
        icon: ShieldCheck,
      })),
    }))
}

function buildFullTree(): MindmapItem {
  return {
    id: 'root',
    label: 'PQC Migration',
    route: '/',
    icon: Shield,
    children: [
      { id: 'home', label: 'Home', route: '/', icon: Home },
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
        children: buildLearnChildren(),
      },
      {
        id: 'timeline',
        label: 'Timeline',
        route: '/timeline',
        icon: Globe,
        children: buildTimelineChildren(),
      },
      {
        id: 'threats',
        label: 'Threats',
        route: '/threats',
        icon: AlertTriangle,
        children: buildThreatsChildren(),
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
        children: buildLibraryChildren(),
      },
      {
        id: 'migrate',
        label: 'Migrate',
        route: '/migrate',
        icon: ArrowRightLeft,
        children: buildMigrateChildren(),
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
        children: buildComplianceChildren(),
      },
      {
        id: 'leaders',
        label: 'Leaders',
        route: '/leaders',
        icon: Users,
        children: buildLeadersChildren(),
      },
      { id: 'about', label: 'About', route: '/about', icon: Info },
    ],
  }
}

/** Recursively find a MindmapItem by id */
function findItemById(id: string, item: MindmapItem): MindmapItem | undefined {
  if (item.id === id) return item
  for (const child of item.children ?? []) {
    const found = findItemById(id, child)
    if (found) return found
  }
  return undefined
}

/** Collect items that can serve as a root (items with children, up to depth 2) */
function collectRootPickerItems(root: MindmapItem): { id: string; label: string }[] {
  const items: { id: string; label: string }[] = [{ id: root.id, label: root.label }]
  for (const child of root.children ?? []) {
    if (child.children && child.children.length > 0) {
      items.push({ id: child.id, label: child.label })
    }
  }
  return items
}

export function useMindmapData() {
  return useMemo(() => {
    const tree = buildFullTree()
    return {
      tree,
      rootPickerItems: collectRootPickerItems(tree),
      findItem: (id: string) => findItemById(id, tree),
    }
  }, [])
}
