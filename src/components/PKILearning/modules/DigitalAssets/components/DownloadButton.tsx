import React from 'react'
import { Download } from 'lucide-react'

interface DownloadButtonProps {
    data: Uint8Array | string
    filename: string
    label?: string
    className?: string
    mimeType?: string
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
    data,
    filename,
    label = 'Download',
    className = '',
    mimeType = 'application/octet-stream',
}) => {
    const handleDownload = () => {
        try {
            let blob: Blob

            if (typeof data === 'string') {
                // Convert hex string to binary
                const bytes = new Uint8Array(data.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
                blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType })
            } else {
                blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType })
            }

            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Failed to download:', err)
        }
    }

    return (
        <button
            onClick={handleDownload}
            className={`inline-flex items-center gap-2 px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors ${className}`}
            aria-label={label}
            title={label}
        >
            <Download size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </button>
    )
}
