// SPDX-License-Identifier: AGPL-3.0-only AND CC-BY-4.0
import React from 'react'

export const APPLIED_QUANTUM_FRAMEWORK_URL = 'https://pqcframework.com'
export const CC_BY_4_URL = 'https://creativecommons.org/licenses/by/4.0/'

interface Props {
  /** Section of the framework the module adapts, e.g. "SOC Implementation". */
  section: string
  /** Page range in the framework, e.g. "165–175". */
  pages: string
}

/**
 * Visible credit for module content adapted from the Applied Quantum PQC Migration
 * Framework, which is licensed under CC BY 4.0: names the creator, links the source and
 * the licence, and says the material was adapted (the licence's attribution terms).
 */
export const AppliedQuantumCredit: React.FC<Props> = ({ section, pages }) => (
  <p className="text-xs text-muted-foreground mt-6" data-testid="cc-by-credit">
    Parts of this module are adapted from the{' '}
    <a
      href={APPLIED_QUANTUM_FRAMEWORK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      Applied Quantum PQC Migration Framework v2.1
    </a>{' '}
    by Marin Ivezi&#263; / Applied Quantum, &ldquo;{section}&rdquo; section, pp.&nbsp;{pages},
    licensed under{' '}
    <a
      href={CC_BY_4_URL}
      target="_blank"
      rel="noopener noreferrer license"
      className="text-primary hover:underline"
    >
      CC BY 4.0
    </a>
    . Changes: the material was condensed, reorganised and adapted for this module.
  </p>
)
