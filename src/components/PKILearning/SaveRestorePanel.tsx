import React, { useState, useEffect } from 'react'
import { Download, Upload, Trash2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProgressService } from '../../services/storage/ProgressService'
import { useModuleStore } from '../../store/useModuleStore'

// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export const SaveRestorePanel: React.FC = () => {
  const { loadProgress, resetProgress, getFullProgress } = useModuleStore()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [storageHealth, setStorageHealth] = useState<{
    available: boolean
    warnings: string[]
  } | null>(null)

  // Track last save time
  useEffect(() => {
    const unsubscribe = useModuleStore.subscribe((state) => {
      setLastSaved(new Date(state.timestamp))
    })
    return unsubscribe
  }, [])

  // Check storage health on mount
  useEffect(() => {
    ProgressService.checkStorageHealth().then((health) => {
      setStorageHealth({ available: health.available, warnings: health.warnings })
      if (!health.available) {
        toast.error('Storage is not available. Progress may not be saved.')
      } else if (health.warnings.length > 0) {
        health.warnings.forEach((warning) => toast.error(warning, { duration: 5000 }))
      }
    })
  }, [])

  const handleExport = () => {
    try {
      const progress = getFullProgress()
      ProgressService.exportToFile(progress)
      toast.success('Progress exported successfully!')
    } catch (error) {
      toast.error(
        `Failed to export progress: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const loadingToast = toast.loading('Restoring progress...')

    try {
      const progress = await ProgressService.importFromFile(file)
      loadProgress(progress)
      toast.success('Progress restored successfully!', { id: loadingToast })
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, { id: loadingToast })
      } else {
        toast.error('Failed to restore progress', { id: loadingToast })
      }
    }

    // Reset the input so the same file can be uploaded again
    e.target.value = ''
  }

  const handleReset = () => {
    if (
      !confirm(
        'Are you sure? This will delete ALL local progress including modules, artifacts, and preferences!'
      )
    ) {
      return
    }

    try {
      resetProgress()
      toast.success('All progress has been reset')
    } catch (error) {
      toast.error(
        `Failed to reset progress: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
        <Save className="text-primary" />
        Progress Management
      </h2>

      {/* Auto-save Status - Moved to top for visibility */}
      <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Auto-save to browser:</span>
          {storageHealth?.available ? (
            <span className="text-sm text-green-400 font-medium">✓ Enabled on changes</span>
          ) : (
            <span className="text-sm text-red-400 font-medium">✗ Unavailable</span>
          )}
        </div>
        {lastSaved && storageHealth?.available && (
          <p className="text-xs text-muted-foreground">Last saved {formatTimeAgo(lastSaved)}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2 opacity-80">
          Your progress is automatically saved to browser storage. Use the options below for backups
          or cross-device transfer.
        </p>
      </div>

      <div className="space-y-6">
        {/* Export Section */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">💾 Export Progress</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Download a backup file to transfer between devices or keep as safety backup.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 
                         text-foreground rounded hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              Export Progress
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">📥 Import Progress</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Restore from a previously exported file (overwrites current progress)
          </p>

          <div className="flex gap-2">
            <label
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 
                              text-foreground rounded hover:bg-purple-700 cursor-pointer transition-colors"
            >
              <Upload size={16} />
              Import Progress
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Reset Section */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-lg font-semibold mb-2 text-red-400">🗑️ Reset All Progress</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Delete all modules, artifacts, and preferences. This cannot be undone.
          </p>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/50
                       text-red-400 rounded hover:bg-red-600/30 transition-colors"
          >
            <Trash2 size={16} />
            Reset Everything
          </button>
        </div>
      </div>
    </div>
  )
}
