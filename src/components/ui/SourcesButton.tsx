import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { SourcesModal } from './SourcesModal'
import type { ViewType } from '../../data/authoritativeSourcesData'

interface SourcesButtonProps {
  viewType: ViewType
}

export const SourcesButton = ({ viewType }: SourcesButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-colors border border-primary/30"
        aria-label={`View authoritative sources for ${viewType}`}
      >
        <BookOpen size={14} />
        <span>Sources</span>
      </button>

      <SourcesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewType={viewType}
      />
    </>
  )
}
