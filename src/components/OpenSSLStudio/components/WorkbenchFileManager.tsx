import React, { useState } from 'react'
import {
  Download,
  Trash2,
  Edit2,
  ArrowUpDown,
  FileKey,
  Archive,
  Upload,
  Plus,
  Eye,
} from 'lucide-react'
import clsx from 'clsx'
import JSZip from 'jszip'
import { useOpenSSLStore } from '../store'
import { useOpenSSL } from '../hooks/useOpenSSL'
import { logEvent } from '../../../utils/analytics'
import { getSecurityLevel } from '../../../utils/security'

export const WorkbenchFileManager: React.FC = () => {
  const {
    addLog,
    addFile,
    files,
    setEditingFile,
    removeFile,
    clearFiles,
    addStructuredLog,
    setViewingFile,
  } = useOpenSSLStore()
  const { executeCommand } = useOpenSSL()
  const [sortBy, setSortBy] = useState<'timestamp' | 'type' | 'name' | 'size'>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [confirmClear, setConfirmClear] = useState(false)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    // eslint-disable-next-line security/detect-object-injection
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatCompactDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

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
            className="px-3 py-1.5 bg-background hover:bg-accent border border-input rounded text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-2"
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
              if (confirmClear) {
                clearFiles()
                logEvent('OpenSSL Studio', 'Clear All Files', files.length.toString())
                setConfirmClear(false)
              } else {
                setConfirmClear(true)
                // Reset after 3 seconds
                setTimeout(() => {
                  setConfirmClear(false)
                }, 3000)
              }
            }}
            disabled={files.length === 0}
            className={clsx(
              'px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2',
              confirmClear
                ? 'bg-red-500 text-foreground hover:bg-red-600 border border-red-500'
                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
              files.length === 0 &&
                'opacity-50 cursor-not-allowed bg-muted border-border text-muted-foreground'
            )}
            title="Delete all files"
          >
            {confirmClear ? (
              'Confirm Clear?'
            ) : (
              <>
                <Trash2 size={14} /> Clear All
              </>
            )}
          </button>
          <button
            onClick={handleBackupAllFiles}
            disabled={files.length === 0}
            className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 disabled:bg-muted disabled:text-muted-foreground border border-primary/40 disabled:border-border rounded text-xs font-medium text-primary disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Backup all files to ZIP"
          >
            <Archive size={14} /> Backup All
          </button>
          <button
            className="px-3 py-1.5 bg-background hover:bg-accent border border-input rounded text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-2"
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
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
          <p>No files yet. Generate or import files to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="p-0">
                  <button
                    className="w-full text-left p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors flex items-center gap-2"
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
                    className="w-full text-left p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors flex items-center gap-2"
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
                    className="w-full text-left p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors flex items-center gap-2"
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
                <th className="p-0">
                  <button
                    className="w-full text-left p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors flex items-center gap-2"
                    onClick={() => {
                      if (sortBy === 'size') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy('size')
                        setSortOrder('desc')
                      }
                    }}
                  >
                    Size <ArrowUpDown size={12} />
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
                  } else if (sortBy === 'size') {
                    comparison = a.size - b.size
                  } else {
                    comparison = a.name.localeCompare(b.name)
                  }
                  return sortOrder === 'asc' ? comparison : -comparison
                })
                .map((file) => (
                  <tr
                    key={file.name}
                    className="border-b border-border hover:bg-accent/50 transition-colors"
                  >
                    <td className="p-3 text-foreground/70 font-mono text-xs whitespace-nowrap">
                      {formatCompactDate(file.timestamp)}
                    </td>
                    <td className="p-2">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-medium',
                          file.type === 'key'
                            ? 'bg-file-key/20 text-file-key-foreground'
                            : file.type === 'cert'
                              ? 'bg-file-cert/20 text-file-cert-foreground'
                              : file.type === 'csr'
                                ? 'bg-file-csr/20 text-file-csr-foreground'
                                : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {file.type.toUpperCase()}
                      </span>
                      {(() => {
                        const level = getSecurityLevel(file.name)
                        if (!level) return null
                        return (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold border border-primary/30 bg-primary/10 text-primary uppercase tracking-tight">
                            L{level}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="p-2 text-foreground font-mono text-sm truncate max-w-[200px]">
                      {file.name}
                    </td>
                    <td className="p-2 text-foreground/70 font-mono text-xs whitespace-nowrap">
                      {formatBytes(file.size)}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
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
                            const content =
                              typeof file.content === 'string'
                                ? new TextEncoder().encode(file.content)
                                : file.content
                            // console.log('View button clicked:', file.name, 'Setting viewingFile state')
                            setViewingFile({ ...file, content })
                            setEditingFile(null) // Close editor if open
                          }}
                          className="p-1.5 hover:bg-primary/20 rounded text-muted-foreground hover:text-primary transition-colors"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingFile(file)
                            setViewingFile(null) // Close viewer if open
                          }}
                          className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
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
                          className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
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
