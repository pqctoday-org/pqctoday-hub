// SPDX-License-Identifier: AGPL-3.0-only
import { Link } from 'react-router'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { getFrameworkById } from '@/data/complianceData'
import { findLibraryItemByRef } from '@/data/libraryData'
import { softwareData } from '@/data/migrateData'
import { threatsData } from '@/data/threatsData'
import type { RevisionEntry } from '@/hooks/useRevisions'

function artifactFor(domain: string, id: string) {
  const encoded = encodeURIComponent(id)
  switch (domain) {
    case 'module': {
      const module = Object.hasOwn(MODULE_CATALOG, id) ? MODULE_CATALOG[id] : undefined
      if (module) return { label: module.title, href: `/learn/${encoded}` }
      break
    }
    case 'tool': {
      const tool = WORKSHOP_TOOLS.find((tool) => tool.pt_id === id)
      if (tool) return { label: tool.name, href: `/playground/${tool.id}` }
      break
    }
    case 'library': {
      const item = findLibraryItemByRef(id)
      if (item)
        return {
          label: item.documentTitle,
          href: `/library?ref=${encodeURIComponent(item.referenceId)}`,
        }
      break
    }
    case 'compliance': {
      const framework = getFrameworkById(id)
      if (framework) return { label: framework.label, href: `/compliance?framework=${encoded}` }
      break
    }
    case 'threats': {
      if (threatsData.some((threat) => threat.threatId === id))
        return { label: id, href: `/threats?id=${encoded}` }
      break
    }
    case 'migrate': {
      const product = softwareData.find((product) => product.productId === id)
      if (product) return { label: product.softwareName, href: `/migrate?product=${encoded}` }
      break
    }
  }
}

export default function RevisionArtifactLinks({ revision }: { revision: RevisionEntry }) {
  const dedicatedId = revision.domain === 'module' ? revision.module_id : revision.tool_id
  const recordedIds = new Set(revision.record_ids ?? [])
  if (dedicatedId && (revision.domain === 'module' || revision.domain === 'tool'))
    recordedIds.add(dedicatedId)

  if (recordedIds.size === 0)
    return <p className="text-xs text-muted-foreground">No individual record IDs were logged.</p>

  return (
    <ul aria-label="Affected records" className="space-y-1 text-xs">
      {[...recordedIds].map((id) => {
        const artifact = artifactFor(revision.domain, id)
        return (
          <li key={id} className="break-words">
            {artifact ? (
              <Link to={artifact.href} className="text-primary underline underline-offset-2">
                Open current record for {artifact.label}
              </Link>
            ) : (
              <span className="text-muted-foreground">{id} · Current record link unavailable</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
