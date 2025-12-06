import React, { useState } from 'react'
import { Download, Trash2, Edit2, ArrowUpDown, FileKey, Archive, Upload, Plus } from 'lucide-react'
import clsx from 'clsx'
import JSZip from 'jszip'
import { useOpenSSLStore } from '../store'
import { useOpenSSL } from '../hooks/useOpenSSL'
import { logEvent } from '../../../utils/analytics'

export const WorkbenchFileManager: React.FC = () => {
  const { addLog, addFile, files, setEditingFile, removeFile, clearFiles, addStructuredLog } =
    useOpenSSLStore()
  const { executeCommand } = useOpenSSL()
  const [sortBy, setSortBy] = useState<'timestamp' | 'type' | 'name'>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleExtractPublicKey = (privateKeyFile: string) => {
    if (!privateKeyFile.endsWith('.key') && !privateKeyFile.endsWith('.pem')) {
      addLog(
        'error',
        `Cannot extract public key: '${privateKeyFile}' does not appear to be a private key file(.key or.pem).`
      )
      return
    }

    // Replace extension or append .pub
    let publicKeyFile = privateKeyFile.replace(/\.(key|pem)$/, '') + '.pub'
    if (publicKeyFile === privateKeyFile + '.pub' && !privateKeyFile.includes('.')) {
      publicKeyFile = privateKeyFile + '.pub'
    }

    const command = `openssl pkey -in ${privateKeyFile} -pubout -out ${publicKeyFile}`
    executeCommand(command)
    logEvent('OpenSSL Studio', 'Extract Public Key')
  }

  const handleBackupAllFiles = async () => {
    if (files.length === 0) {
      addLog('error', 'No files to backup.')
      return
    }

    try {
      const zip = new JSZip()

      // Add all files to the zip
      files.forEach((file) => {
        zip.file(file.name, file.content)
      })

      // Generate the zip file
      const blob = await zip.generateAsync({ type: 'blob' })

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `openssl-studio-backup-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addLog('info', `Backed up ${files.length} file(s) to ${a.download}`)
      logEvent('OpenSSL Studio', 'Backup All Files', files.length.toString())
    } catch (error) {
      addLog('error', `Failed to create backup: ${error}`)
    }
  }

  const handleImportFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)

      let importedCount = 0
      const promises: Promise<void>[] = []

      contents.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          promises.push(
            zipEntry.async('uint8array').then((content) => {
              addFile({
                name: relativePath,
                type:
                  relativePath.endsWith('.key') || relativePath.endsWith('.pem')
                    ? 'key'
                    : relativePath.endsWith('.crt') || relativePath.endsWith('.cert')
                      ? 'cert'
                      : relativePath.endsWith('.csr')
                        ? 'csr'
                        : 'binary',
                content,
                size: content.length,
                timestamp: Date.now(),
              })
              importedCount++
            })
          )
        }
      })

      await Promise.all(promises)
      addLog('info', `Imported ${importedCount} file(s) from ${file.name}`)
      logEvent('OpenSSL Studio', 'Import Files', importedCount.toString())

      // Reset the input so the same file can be imported again if needed
      event.target.value = ''
    } catch (error) {
      addLog('error', `Failed to import files: ${error}`)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
          File Manager
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-2"
            onClick={() => document.getElementById('add-file-input')?.click()}
          >
            <Plus size={14} /> Add File
            <input
              id="add-file-input"
              type="file"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return

                try {
                  const content = new Uint8Array(await file.arrayBuffer())
                  addFile({
                    name: file.name,
                    type: 'binary',
                    content,
                    size: content.length,
                    timestamp: Date.now(),
                  })
                  addLog('info', `File uploaded: ${file.name}`)
                  addStructuredLog({
                    command: 'upload',
                    operationType: 'Other',
                    details: `Uploaded file: ${file.name}`,
                    fileName: file.name,
                    fileSize: content.length,
                    executionTime: 0,
                  })
                  // Reset input
                  e.target.value = ''
                } catch (error) {
                  console.error('Failed to upload file:', error)
                  addLog('error', `Failed to upload file: ${file.name}`)
                }
              }}
              className="hidden"
            />
          </button>
          <button
            onClick={() => {
              const btn = document.activeElement as HTMLButtonElement
              if (btn.dataset.confirm === 'true') {
                clearFiles()
                logEvent('OpenSSL Studio', 'Clear All Files', files.length.toString())
                btn.dataset.confirm = 'false'
                btn.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg> Clear All'
                btn.classList.remove('bg-red-500', 'text-foreground', 'hover:bg-red-600')
                btn.classList.add('bg-red-500/10', 'text-red-400', 'hover:bg-red-500/20')
              } else {
                btn.dataset.confirm = 'true'
                btn.innerHTML = 'Confirm Clear?'
                btn.classList.remove('bg-red-500/10', 'text-red-400', 'hover:bg-red-500/20')
                btn.classList.add('bg-red-500', 'text-foreground', 'hover:bg-red-600')

                // Reset after 3 seconds
                setTimeout(() => {
                  if (btn.dataset.confirm === 'true') {
                    btn.dataset.confirm = 'false'
                    btn.innerHTML =
                      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg> Clear All'
                    btn.classList.remove('bg-red-500', 'text-foreground', 'hover:bg-red-600')
                    btn.classList.add('bg-red-500/10', 'text-red-400', 'hover:bg-red-500/20')
                  }
                }, 3000)
              }
            }}
            disabled={files.length === 0}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:bg-white/5 disabled:text-foreground/20 border border-red-500/20 disabled:border-white/10 rounded text-xs font-medium text-red-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Delete all files"
          >
            <Trash2 size={14} /> Clear All
          </button>
          <button
            onClick={handleBackupAllFiles}
            disabled={files.length === 0}
            className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 disabled:bg-white/5 disabled:text-foreground/20 border border-primary/40 disabled:border-white/10 rounded text-xs font-medium text-primary disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Backup all files to ZIP"
          >
            <Archive size={14} /> Backup All
          </button>
          <button
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-2"
            onClick={() => document.getElementById('import-zip-input')?.click()}
          >
            <Upload size={14} /> Import ZIP
            <input
              id="import-zip-input"
              type="file"
              accept=".zip"
              onChange={handleImportFiles}
              className="hidden"
            />
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 text-foreground/20 text-sm">
          No files generated yet.
          <br />
          Generate keys, CSRs, or certificates to see them here.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-0">
                  <button
                    className="w-full text-left p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-2"
                    onClick={() => {
                      if (sortBy === 'timestamp') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('timestamp')
                        setSortOrder('desc')
                      }
                    }}
                  >
                    Timestamp <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="p-0">
                  <button
                    className="w-full text-left p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-2"
                    onClick={() => {
                      if (sortBy === 'type') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('type')
                        setSortOrder('asc')
                      }
                    }}
                  >
                    Type <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="p-0">
                  <button
                    className="w-full text-left p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-2"
                    onClick={() => {
                      if (sortBy === 'name') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('name')
                        setSortOrder('asc')
                      }
                    }}
                  >
                    Filename <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="text-right p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {files
                .slice()
                .sort((a, b) => {
                  let comparison = 0
                  if (sortBy === 'timestamp') {
                    comparison = a.timestamp - b.timestamp
                  } else if (sortBy === 'type') {
                    comparison = a.type.localeCompare(b.type)
                  } else {
                    comparison = a.name.localeCompare(b.name)
                  }
                  return sortOrder === 'asc' ? comparison : -comparison
                })
                .map((file) => (
                  <tr
                    key={file.name}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3 text-foreground/70 font-mono text-xs">
                      {new Date(file.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={clsx(
                          'px-2 py-1 rounded text-xs font-medium',
                          file.type === 'key'
                            ? 'bg-amber-500/20 text-amber-200'
                            : file.type === 'cert'
                              ? 'bg-blue-500/20 text-blue-200'
                              : file.type === 'csr'
                                ? 'bg-purple-500/20 text-purple-200'
                                : 'bg-gray-500/20 text-gray-200'
                        )}
                      >
                        {file.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-foreground font-mono text-sm">{file.name}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingFile(file)}
                          className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="View/Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            const content = file.content
                            const blobPart =
                              typeof content === 'string' ? content : (content as Uint8Array)
                            const blob = new Blob([blobPart as unknown as BlobPart], {
                              type: 'application/octet-stream',
                            })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = file.name
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                            logEvent('OpenSSL Studio', 'Download File', file.type)
                          }}
                          className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        {(file.name.endsWith('.key') || file.name.endsWith('.pem')) && (
                          <button
                            onClick={() => handleExtractPublicKey(file.name)}
                            className="p-1.5 hover:bg-primary/20 rounded text-muted-foreground hover:text-primary transition-colors"
                            title="Extract Public Key"
                          >
                            <FileKey size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            removeFile(file.name)
                            logEvent('OpenSSL Studio', 'Delete File', file.type)
                          }}
                          className="p-1.5 hover:bg-red-500/20 rounded text-muted-foreground hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
