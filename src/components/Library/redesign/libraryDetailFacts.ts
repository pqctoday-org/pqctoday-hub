// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Fields of a Library record that the detail views show besides the core key
 * facts, shared by the desktop drawer and the phone sheet so both list the same
 * things: the catalogue's classification tags (protocol/tool impact, toolchain
 * support, research topics, maths family, NIST round) and the Learn modules
 * that teach with the document.
 */
import type { LibraryItem } from '@/data/libraryData'
import { researchTopicLabel } from '@/data/researchTopics'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

export interface LibraryDetailFact {
  label: string
  value: string
}

/** `a;b; c` → `a, b, c` (blank cells give an empty string). */
function listCell(cell: string | undefined): string {
  return (cell ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ')
}

/** Classification tags the record carries, in display order; empty ones are left out. */
export function libraryClassificationFacts(item: LibraryItem): LibraryDetailFact[] {
  const facts: LibraryDetailFact[] = [
    { label: 'Catalog protocol or tool impact', value: listCell(item.protocolOrToolImpact) },
    { label: 'Catalog toolchain support', value: listCell(item.toolchainSupport) },
    {
      label: 'Research topics',
      value: (item.researchTopics ?? []).map((id) => researchTopicLabel(id) ?? id).join(', '),
    },
    { label: 'Mathematical family', value: (item.mathFamily ?? []).join(', ') },
    { label: 'NIST PQC round', value: item.pqcRound ?? '' },
  ]
  return facts.filter((f) => f.value.trim() !== '')
}

export interface RelatedLearnModule {
  id: string
  title: string
}

/** Learn modules that cite this document (the row's `module_ids`), by catalogue title.
 *  An id with no module in the catalogue is left out, so no link can dead-end. */
export function relatedLearnModules(item: LibraryItem): RelatedLearnModule[] {
  const seen = new Set<string>()
  const out: RelatedLearnModule[] = []
  for (const id of item.moduleIds ?? []) {
    if (seen.has(id)) continue
    seen.add(id)
    // eslint-disable-next-line security/detect-object-injection -- id is looked up, never written
    const mod = MODULE_CATALOG[id]
    if (mod) out.push({ id, title: mod.title })
  }
  return out
}
