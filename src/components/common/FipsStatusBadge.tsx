// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import clsx from 'clsx'
import { getCertsForProduct } from '@/data/certificationXrefData'
import {
  classifyFips,
  pqcBoundary,
  FIPS_STATE_LABEL,
  FIPS_STATE_SHORT,
  type FipsState,
} from '@/utils/fipsStatus'

const TONE: Record<FipsState, string> = {
  module: 'bg-status-success text-status-success',
  embedded: 'bg-status-success text-status-success',
  cavp: 'bg-status-warning text-status-warning',
  'in-process': 'bg-status-warning text-status-warning',
  claim: 'bg-muted text-muted-foreground',
  none: 'bg-muted text-muted-foreground',
  unknown: 'bg-muted text-muted-foreground',
}

const BOUNDARY_TEXT = {
  yes: 'PQC algorithms are inside the validated module boundary.',
  no: 'PQC algorithms are outside the validated module boundary (classical algorithms only).',
  'not-stated': 'Whether the PQC algorithms are inside the validated boundary is not stated.',
} as const

interface FipsStatusBadgeProps {
  fipsValidated: string
  productId?: string
  softwareName?: string
  /** Render nothing for "not validated", "other claim" and "not stated" (compact lists). */
  hideNegative?: boolean
  className?: string
}

/**
 * The one FIPS badge. Its wording comes from `classifyFips`, and a validated
 * module whose PQC algorithms are outside the boundary says so on its face
 * ("FIPS · classical") instead of reading as PQC-validated.
 */
export const FipsStatusBadge: React.FC<FipsStatusBadgeProps> = ({
  fipsValidated,
  productId,
  softwareName,
  hideNegative = false,
  className,
}) => {
  const state = classifyFips(fipsValidated)
  if (hideNegative && (state === 'none' || state === 'claim' || state === 'unknown')) return null

  const certs =
    productId || softwareName ? getCertsForProduct(productId ?? '', softwareName ?? '') : []
  // Active FIPS 140 certificates decide first, by their classicalOnly flag:
  // a classical-only certificate never counts as PQC inside the boundary.
  const boundary = pqcBoundary(fipsValidated, certs)
  const validated = state === 'module' || state === 'embedded'
  const label = validated
    ? `${FIPS_STATE_SHORT[state]}${boundary === 'yes' ? ' · incl. PQC' : boundary === 'no' ? ' · classical' : ''}`
    : FIPS_STATE_SHORT[state]
  const title = [
    FIPS_STATE_LABEL[state],
    validated ? BOUNDARY_TEXT[boundary] : null,
    fipsValidated || null,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <span
      className={clsx(
        'inline-flex items-center text-xs px-1.5 py-0.5 rounded-full',
        TONE[state],
        className
      )}
      title={title}
      data-fips-state={state}
    >
      {label}
    </span>
  )
}
