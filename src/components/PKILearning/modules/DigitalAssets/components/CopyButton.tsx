import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
    text: string
    label?: string
    className?: string
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, label = 'Copy', className = '' }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            // Modern Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text)
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea')
                textArea.value = text
                textArea.style.position = 'fixed'
                textArea.style.left = '-999999px'
                textArea.style.top = '-999999px'
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                document.execCommand('copy')
                textArea.remove()
            }

            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors ${className}`}
            aria-label={copied ? 'Copied!' : label}
            title={copied ? 'Copied!' : label}
        >
            {copied ? (
                <>
                    <Check size={16} className="text-success" />
                    <span className="text-xs text-success font-medium">Copied!</span>
                </>
            ) : (
                <>
                    <Copy size={16} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">{label}</span>
                </>
            )}
        </button>
    )
}
