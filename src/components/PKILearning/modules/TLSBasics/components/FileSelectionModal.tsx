import React, { useMemo, useState } from 'react'
import { X, FileText } from 'lucide-react'
import { useOpenSSLStore } from '../../../../OpenSSLStudio/store'
import type { VirtualFile } from '../../../../OpenSSLStudio/store'
import { motion } from 'framer-motion'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (content: string) => void
  title?: string
  filter?: (file: VirtualFile) => boolean
}

export const FileSelectionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select File',
  filter,
}) => {
  const { files } = useOpenSSLStore()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFiles = useMemo(() => {
    let res = files
    if (filter) res = res.filter(filter)
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      res = res.filter((f) => f.name.toLowerCase().includes(lower))
    }
    return res
  }, [files, filter, searchTerm])

  const handleSelect = (file: VirtualFile) => {
    if (typeof file.content === 'string') {
      onSelect(file.content)
    } else {
      // Convert Uint8Array to string (assuming PEM/Text)
      const decoder = new TextDecoder()
      onSelect(decoder.decode(file.content))
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <input
            type="text"
            placeholder="Search files..."
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-grow overflow-auto p-2 space-y-1">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No files found in Workbench.
            </div>
          ) : (
            filteredFiles.map((file) => (
              <button
                key={file.name}
                onClick={() => handleSelect(file)}
                className="w-full flex items-center gap-3 p-3 rounded hover:bg-muted transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 group-hover:text-primary">
                  <FileText size={16} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-sm truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{file.type}</span>
                    <span>•</span>
                    <span>{file.size} bytes</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/50 text-xs text-muted-foreground">
          Files are loaded from the OpenSSL Studio Workbench.
        </div>
      </motion.div>
    </div>
  )
}
