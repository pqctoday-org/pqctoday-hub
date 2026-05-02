// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { threatsData, threatsMetadata } from '@/data/threatsData'
import type { ThreatData } from '@/data/threatsData'

export interface ThreatsDataResult {
  data: ThreatData[]
  metadata: typeof threatsMetadata
  count: number
}

export function useThreatsData(): ThreatsDataResult {
  return useMemo(
    () => ({
      data: threatsData,
      metadata: threatsMetadata,
      count: threatsData.length,
    }),
    []
  )
}
