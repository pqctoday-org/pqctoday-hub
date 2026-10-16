// SPDX-License-Identifier: AGPL-3.0-only
import { Tags } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import type { ResearchTopicCount } from '@/data/researchTopics'

interface ResearchTopicFilterProps {
  topics: readonly ResearchTopicCount[]
  selectedId: string
  onSelect: (id: string) => void
  className?: string
}

/** Single-select research-topic facet. Renders nothing until a document is tagged. */
export function ResearchTopicFilter({
  topics,
  selectedId,
  onSelect,
  className,
}: ResearchTopicFilterProps) {
  if (topics.length === 0) return null
  return (
    <FilterDropdown
      items={topics.map((t) => ({ id: t.id, label: `${t.label} (${t.count})` }))}
      selectedId={selectedId}
      onSelect={onSelect}
      defaultLabel="Research topic"
      ariaLabel="Research topic"
      defaultIcon={<Tags size={14} className="text-primary" />}
      searchable={topics.length > 8}
      className={className}
    />
  )
}
