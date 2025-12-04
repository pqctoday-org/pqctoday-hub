import React from 'react'
import { Download, Upload, Trash2, Save } from 'lucide-react'
import { ProgressService } from '../../services/storage/ProgressService'
import { useModuleStore } from '../../store/useModuleStore'

export const SaveRestorePanel: React.FC = () => {
  const { loadProgress, resetProgress, getFullProgress } = useModuleStore()

  const handleExport = () => {
    const progress = getFullProgress()
    ProgressService.exportToFile(progress)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const progress = await ProgressService.importFromFile(file)
      loadProgress(progress)
      alert('Progress restored successfully!')
    } catch (error) {
      alert(`Failed to restore progress: ${error}`)
    }
  }

  const handleReset = () => {
    if (!confirm('Are you sure? This will delete ALL local progress!')) {
      return
    }

    resetProgress()
    ProgressService.clearLocal()
    alert('Progress reset complete!')
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
        <Save className="text-primary" />
        Progress Management
      </h2>

      <div className="space-y-6">
        {/* Export Section */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-white">💾 Save Progress</h3>
          <p className="text-sm text-muted mb-3">Download your progress as a file. Keep it safe!</p>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 
                         text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              Export Progress
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-white">📥 Restore Progress</h3>
          <p className="text-sm text-muted mb-3">Upload a previously saved progress file</p>

          <div className="flex gap-2">
            <label
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 
                              text-white rounded hover:bg-purple-700 cursor-pointer transition-colors"
            >
              <Upload size={16} />
              Import Progress
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Reset Section */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-red-400">🗑️ Reset Progress</h3>
          <p className="text-sm text-muted mb-3">Delete all local progress and start fresh</p>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/50
                       text-red-400 rounded hover:bg-red-600/30 transition-colors"
          >
            <Trash2 size={16} />
            Reset All Progress
          </button>
        </div>

        {/* Auto-save Status */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Auto-save to browser:</span>
            <span className="text-sm text-green-400 font-medium">✓ Enabled (every minute)</span>
          </div>
          <p className="text-xs text-muted mt-1 opacity-60">
            Progress is automatically saved to your browser's storage. Export manually for backup!
          </p>
        </div>
      </div>
    </div>
  )
}
