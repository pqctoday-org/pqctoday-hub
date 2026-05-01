// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PersonaSwitchModal } from '@/components/Persona/PersonaSwitchModal'

export const PreviewBanner: React.FC = () => {
  const [switchOpen, setSwitchOpen] = useState(false)

  return (
    <>
      <div
        role="status"
        className="glass-panel border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 flex-wrap"
      >
        <Eye size={15} className="text-primary shrink-0" aria-hidden="true" />
        <p className="text-sm text-muted-foreground flex-1 min-w-0">
          <span className="text-foreground font-medium">Previewing technical content.</span> Switch
          to a technical persona for the full feature surface.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSwitchOpen(true)}
          className="shrink-0 h-7 text-xs"
        >
          Switch role
        </Button>
      </div>

      {switchOpen && <PersonaSwitchModal onClose={() => setSwitchOpen(false)} />}
    </>
  )
}
