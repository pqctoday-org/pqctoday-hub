// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { BookOpenText } from 'lucide-react'
import { Glossary } from '../common/Glossary'

export const GlossaryButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-foreground text-sm font-medium transition-colors border border-primary/20"
        aria-label="Open PQC glossary"
      >
        <BookOpenText size={14} />
        <span>Glossary</span>
      </button>

      <Glossary isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
