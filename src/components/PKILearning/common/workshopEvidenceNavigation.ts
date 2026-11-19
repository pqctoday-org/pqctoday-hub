// SPDX-License-Identifier: AGPL-3.0-only
import { createContext } from 'react'

export const WorkshopEvidenceNavigation = createContext<
  ((trigger: HTMLButtonElement) => void) | null
>(null)
