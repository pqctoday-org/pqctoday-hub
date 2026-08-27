// SPDX-License-Identifier: GPL-3.0-only
import { GraduationCap, BookMarked, Route, LayoutGrid, type LucideIcon } from 'lucide-react'
import type { LibraryPurpose } from '@/data/libraryData'

// Pure-moved out of LibraryPurposeDoors.tsx (2026-08-24 audit R3.5) — that
// file also exports the real desktop doors JSX, so MobileLibraryView.tsx
// previously carried its own byte-identical copy of these 4 doors rather
// than importing a desktop view component into the mobile boundary.
export type LibraryPurposeSelection = LibraryPurpose | 'all'

export interface LibraryDoor {
  id: LibraryPurposeSelection
  label: string
  hint: string
  icon: LucideIcon
}

export const LIBRARY_DOORS: LibraryDoor[] = [
  { id: 'all', label: 'Everything', hint: 'The full catalog', icon: LayoutGrid },
  { id: 'education', label: 'Learn', hint: 'Research, analysis & explainers', icon: GraduationCap },
  { id: 'reference', label: 'Reference', hint: 'Standards, specs & policy', icon: BookMarked },
  { id: 'planning', label: 'Plan migration', hint: 'Guidance & report picks', icon: Route },
]
