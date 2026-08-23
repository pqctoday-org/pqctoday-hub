// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure-move extraction (IMPLEMENTATION-PLAN.md §5.4, E-1) — this was a
 * module-private const inside ExploreView.tsx. Moved verbatim (no field, no
 * value, no ordering changed) so the mobile Explore screen can read the same
 * ten tiles the desktop page reads, rather than a copy. ExploreView.tsx
 * re-imports `TILES`/`ExploreTile` from here under the same names.
 */
import {
  GraduationCap,
  Globe,
  AlertTriangle,
  ShieldCheck,
  ClipboardCheck,
  Shield,
  LayoutDashboard,
  ArrowRightLeft,
  FlaskConical,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

export interface ExploreTile {
  icon: LucideIcon
  title: string
  description: string
  path: string
  /** Alternate destination for gated-curious users (avoids sending them to blocked routes). */
  gatedPath?: string
  accent: string
  /**
   * Minutes for a FIRST LOOK — long enough to decide whether this door is the
   * one you wanted, not to finish anything behind it. B+ remediation 4.6
   * (2026-08-10): "twenty tiles that all look equally important, and none says
   * what it costs in time".
   *
   * These are authored estimates, and the page says so rather than presenting
   * them as measurements. The one exception is '/learn', whose figure is
   * DERIVED from the active persona's real `essentialsMinutes` at render time
   * — that number exists, so quoting anything else would be worse.
   */
  firstLookMinutes: number
}

export const TILES: ExploreTile[] = [
  {
    icon: GraduationCap,
    title: 'Learn PQC Basics',
    description:
      "Start with the essentials. Why quantum computers threaten today's encryption and what's being done about it.",
    path: '/learn',
    firstLookMinutes: 2,
    accent: 'text-primary bg-primary/10',
  },
  {
    icon: Globe,
    title: 'Global Migration Timeline',
    description:
      'See which governments and organizations have already committed to post-quantum cryptography — and when.',
    path: '/timeline',
    firstLookMinutes: 3,
    accent: 'text-secondary bg-secondary/10',
  },
  {
    icon: AlertTriangle,
    title: 'Understand the Threat',
    description:
      '"Harvest now, decrypt later" attacks are happening today. Learn what data is already at risk.',
    path: '/threats',
    firstLookMinutes: 3,
    accent: 'text-status-warning bg-status-warning/10',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Landscape',
    description:
      'NIST, FIPS, NSA CNSA — see which regulations apply to your industry and how to stay ahead.',
    path: '/compliance',
    firstLookMinutes: 4,
    accent: 'text-accent bg-accent/10',
  },
  {
    icon: ClipboardCheck,
    title: 'Assess Your Risk',
    description:
      "A short questionnaire that estimates your organization's exposure to the quantum threat.",
    path: '/assess',
    firstLookMinutes: 10,
    accent: 'text-primary bg-primary/10',
  },
  {
    icon: ArrowRightLeft,
    title: 'Migration Workbench',
    description:
      'Track PQC readiness across your software and infrastructure stack — libraries, protocols, hardware, and more.',
    path: '/migrate',
    firstLookMinutes: 4,
    accent: 'text-secondary bg-secondary/10',
  },
  {
    icon: LayoutDashboard,
    title: 'Command Center',
    description:
      'Executive planning tools — ROI calculators, board packs, vendor scorecards, and a sequenced migration roadmap.',
    path: '/business',
    firstLookMinutes: 5,
    gatedPath: '/learn/pqc-business-case',
    accent: 'text-accent bg-accent/10',
  },
  {
    icon: Shield,
    title: 'Compare PQC Algorithms',
    description:
      'ML-KEM, ML-DSA, SLH-DSA — compare the new NIST-standardized algorithms side by side.',
    path: '/algorithms',
    firstLookMinutes: 4,
    gatedPath: '/learn/pqc-101',
    accent: 'text-secondary bg-secondary/10',
  },
  {
    icon: FlaskConical,
    title: 'Try the Playground',
    description:
      'Generate post-quantum keys, encrypt, sign, and verify with ML-KEM, ML-DSA, and 40+ algorithms — right in your browser.',
    path: '/playground',
    firstLookMinutes: 5,
    accent: 'text-primary bg-primary/10',
  },
  {
    icon: BookOpen,
    title: 'Reference Library',
    description:
      'Standards, research papers, and migration guides — curated and searchable in one place.',
    path: '/library',
    firstLookMinutes: 3,
    accent: 'text-accent bg-accent/10',
  },
]
