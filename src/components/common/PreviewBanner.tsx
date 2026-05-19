// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PersonaSwitchModal } from '@/components/Persona/PersonaSwitchModal'

export const PreviewBanner: React.FC = () => {
  const [switchOpen, setSwitchOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <div
        role="status"
        className="glass-panel border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3 flex-wrap sm:flex-nowrap"
      >
        <Lock size={15} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium">
            Preview locked — switch to a technical role for the full feature.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            New to PQC? Start with <span className="text-foreground">PQC 101</span> first to build
            the foundation, then come back here.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/learn/pqc-101')}
            className="h-7 text-xs flex-1 sm:flex-none"
          >
            Start PQC 101
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSwitchOpen(true)}
            className="h-7 text-xs flex-1 sm:flex-none"
          >
            Switch role
          </Button>
        </div>
      </div>

      {switchOpen && <PersonaSwitchModal onClose={() => setSwitchOpen(false)} />}
    </>
  )
}
