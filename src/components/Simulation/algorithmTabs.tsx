// SPDX-License-Identifier: GPL-3.0-only
/**
 * SIM_ALGORITHM_TABS (C5-full) — the single registry of embeddable Algorithms
 * tabs, replacing the three bespoke per-tab predicates + mount arms. Each entry
 * maps a tree-step refId to its embed widget and its completion model:
 *   - 'review'  → marked done on open (a reviewed-mark, e.g. Protocol Support).
 *   - { artifact } → a "choice that counts": the embed's Confirm action records
 *     the artifact (tagged with distinct sim provenance via moduleId) and marks
 *     the task done.
 *
 * The pure refId set lives in `embedContract` (so canEmbedStep stays free of
 * component imports); `algorithmTabs.test.ts` asserts the two stay in sync.
 */
import type { FC } from 'react'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import { ProtocolMatrixEmbed } from '@/components/shared/widgets/ProtocolMatrixEmbed'
import { AlgorithmTransitionEmbed } from '@/components/shared/widgets/AlgorithmTransitionEmbed'
import { AlgorithmDetailedEmbed } from '@/components/shared/widgets/AlgorithmDetailedEmbed'

export interface AlgorithmTabEmbedProps {
  /** Confirm the reviewed choices (selected algorithm names). Present only for
   *  the "choice that counts" tabs; review-mark tabs ignore it. */
  onConfirm?: (selected: string[]) => void
  confirmed?: boolean
}

/** How a confirmed tab records its choice (an executive document). */
export interface AlgorithmTabArtifact {
  artifactType: ExecutiveDocumentType
  /** Distinct provenance so a standalone doc never pre-completes the sim task. */
  moduleId: string
  title: string
}

export interface AlgorithmTabSpec {
  /** Header chip label shown under the Simulation-mode bar. */
  label: string
  Component: FC<AlgorithmTabEmbedProps>
  /** 'review' = done on open; otherwise confirm records the artifact + marks done. */
  completion: 'review' | AlgorithmTabArtifact
}

export const SIM_ALGORITHM_TABS: Record<string, AlgorithmTabSpec> = {
  'algorithms-protocol-matrix': {
    label: 'Protocols',
    Component: ProtocolMatrixEmbed,
    completion: 'review',
  },
  'algorithms-transition': {
    label: 'Algorithms',
    Component: AlgorithmTransitionEmbed,
    completion: {
      artifactType: 'crypto-cbom',
      moduleId: 'sim-algorithms-transition',
      title: 'PQC replacement plan (from the simulation)',
    },
  },
  'algorithms-detailed': {
    label: 'Algorithms',
    Component: AlgorithmDetailedEmbed,
    completion: {
      artifactType: 'crypto-architecture',
      moduleId: 'sim-algorithms-detailed',
      title: 'PQC algorithm architecture (from the simulation)',
    },
  },
}
