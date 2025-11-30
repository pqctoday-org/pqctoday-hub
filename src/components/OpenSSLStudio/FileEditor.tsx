import { useState } from 'react'
import { X, Save, FileText, ArrowRightLeft } from 'lucide-react'
import { useOpenSSLStore } from './store'
import clsx from 'clsx'

export const FileEditor = () => {
  const { editingFile, setEditingFile, addFile } = useOpenSSLStore()

  const [content, setContent] = useState(() => {
    if (!editingFile) return ''
    if (typeof editingFile.content === 'string') {
      return editingFile.content
    } else {
      // Binary file - default to hex
      return Array.from(editingFile.content)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ')
    }
  })

  const [viewMode, setViewMode] = useState<'ascii' | 'hex'>(() => {
    if (!editingFile) return 'ascii'
    return typeof editingFile.content === 'string' ? 'ascii' : 'hex'
  })

  const [error, setError] = useState<string | null>(null)

  const handleToggleMode = () => {
    setError(null)
    if (viewMode === 'ascii') {
      // Convert ASCII to Hex
      const encoder = new TextEncoder()
      const bytes = encoder.encode(content)
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ')
      setContent(hex)
      setViewMode('hex')
    } else {
      // Convert Hex to ASCII
      // Remove spaces and newlines
      const cleanHex = content.replace(/[\s\n]/g, '')
      if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
        setError('Invalid Hex characters. Cannot switch to ASCII.')
        return
      }

      const bytes = new Uint8Array(
        cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
      )

      const decoder = new TextDecoder('utf-8')
      try {
        const ascii = decoder.decode(bytes)
        setContent(ascii)
        setViewMode('ascii')
      } catch {
        setError('Invalid UTF-8 sequence. Cannot switch to ASCII.')
      }
    }
  }

  const handleSave = () => {
    if (!editingFile) return

    let finalContent: string | Uint8Array = content

    if (viewMode === 'hex') {
      const cleanHex = content.replace(/[\s\n]/g, '')
      if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
        setError('Invalid Hex data. Cannot save.')
        return
      }
      finalContent = new Uint8Array(
        cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
      )
    }

    addFile({
      ...editingFile,
      content: finalContent,
      timestamp: Date.now(),
    })
    setEditingFile(null)
  }

  if (!editingFile) return null

  return (
    <div className="glass-panel flex flex-col overflow-hidden mb-6 animate-fade-in shrink-0 h-96 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
      {/* Header */}
      <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-primary/20 text-primary">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              {editingFile.name}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-muted uppercase">
                {editingFile.type}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMode}
            className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors border border-white/5"
            title={`Switch to ${viewMode === 'ascii' ? 'Hex' : 'ASCII'} mode`}
          >
            <ArrowRightLeft size={12} />
            {viewMode === 'ascii' ? 'ASCII' : 'HEX'}
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button
            onClick={() => setEditingFile(null)}
            className="p-1.5 hover:bg-white/10 rounded text-muted hover:text-white transition-colors"
            title="Close Editor"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-0 overflow-hidden flex flex-col relative">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setError(null)
          }}
          className={clsx(
            'flex-1 w-full bg-black/40 p-4 font-mono text-sm text-white/90 resize-none outline-none focus:bg-black/60 transition-colors custom-scrollbar',
            viewMode === 'hex' && 'tracking-wider'
          )}
          spellCheck={false}
          placeholder={viewMode === 'hex' ? '00 01 02 03...' : 'Type content here...'}
        />
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-500/20 border border-red-500/50 text-red-200 text-xs p-2 rounded backdrop-blur-md">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-white/5 flex justify-end gap-2">
        <button
          onClick={() => setEditingFile(null)}
          className="px-3 py-1.5 rounded hover:bg-white/10 text-white transition-colors text-xs font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 rounded bg-primary hover:bg-primary/90 text-white transition-colors flex items-center gap-2 text-xs font-medium shadow-lg shadow-primary/20"
        >
          <Save size={14} />
          Save Changes
        </button>
      </div>
    </div>
  )
}
