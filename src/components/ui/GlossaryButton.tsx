import { useState } from 'react'
import { BookOpenText } from 'lucide-react'
import { Glossary } from '../common/Glossary'

export const GlossaryButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-colors border border-primary/30"
        aria-label="Open PQC glossary"
      >
        <BookOpenText size={14} />
        <span>Glossary</span>
      </button>

      <Glossary isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
