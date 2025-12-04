import React from 'react'
import { Settings } from 'lucide-react'
import { useOpenSSLStore } from '../store'

export const WorkbenchHeader: React.FC = () => {
    const { files, setEditingFile } = useOpenSSLStore()

    const handleEditConfig = () => {
        const configFile = files.find((f) => f.name === 'openssl.cnf')
        if (configFile) {
            setEditingFile(configFile)
        } else {
            console.warn('openssl.cnf not found in memory yet')
        }
    }

    return (
        <div className="space-y-4">
            <span className="text-sm font-bold text-muted uppercase tracking-wider block">
                0. Configuration
            </span>
            <button
                onClick={handleEditConfig}
                className="w-full p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors flex items-center gap-2 text-sm"
            >
                <Settings size={16} /> Edit OpenSSL Config (openssl.cnf)
            </button>
        </div>
    )
}
