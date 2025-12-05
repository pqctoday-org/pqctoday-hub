import React from 'react'
import { Play, Settings } from 'lucide-react'
import { useOpenSSLStore } from '../store'
import { useOpenSSL } from '../hooks/useOpenSSL'
import { logEvent } from '../../../utils/analytics'

interface WorkbenchPreviewProps {
  category: string
}

export const WorkbenchPreview: React.FC<WorkbenchPreviewProps> = ({ category }) => {
  const { isProcessing, command, isReady } = useOpenSSLStore()
  const { executeCommand } = useOpenSSL()

  const handleRun = () => {
    executeCommand(command)
    logEvent('OpenSSL Studio', 'Run Command', category)
  }

  if (category === 'files') return null

  return (
    <div className="mt-auto pt-6">
      <button
        onClick={handleRun}
        disabled={isProcessing || !isReady}
        className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg font-bold shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <Settings className="animate-spin" />
        ) : !isReady ? (
          <Settings className="animate-spin" />
        ) : (
          <Play fill="currentColor" />
        )}
        {!isReady ? 'Initializing...' : 'Run Command'}
      </button>
    </div>
  )
}
