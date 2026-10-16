// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { CKKS_EVIDENCE, ckksEvidenceUrl, type CkksEvidenceKey } from '../data/fheCkksEvidence'

/** Inline link to the published files behind a measured CKKS number. */
export const EvidenceCite: React.FC<{ of: CkksEvidenceKey; children: React.ReactNode }> = ({
  of,
  children,
}) => (
  <a
    href={ckksEvidenceUrl(of)}
    target="_blank"
    rel="noopener noreferrer"
    title={`Evidence record ${CKKS_EVIDENCE[of]}`}
    className="text-primary underline underline-offset-2 hover:text-primary/80"
  >
    {children}
  </a>
)
