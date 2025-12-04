import React from 'react'

interface RandConfigProps {
    randBytes: string
    setRandBytes: (value: string) => void
    randHex: boolean
    setRandHex: (value: boolean) => void
}

export const RandConfig: React.FC<RandConfigProps> = ({
    randBytes,
    setRandBytes,
    randHex,
    setRandHex,
}) => {
    return (
        <div className="space-y-4 animate-fade-in">
            <span className="text-sm font-bold text-muted uppercase tracking-wider block">
                2. Configuration
            </span>

            <div className="space-y-3">
                <label htmlFor="rand-bytes-input" className="text-xs text-muted block">
                    Number of Bytes
                </label>
                <input
                    id="rand-bytes-input"
                    type="number"
                    value={randBytes}
                    onChange={(e) => setRandBytes(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                    min="1"
                    max="4096"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="randHex"
                    checked={randHex}
                    onChange={(e) => setRandHex(e.target.checked)}
                    className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                />
                <label htmlFor="randHex" className="text-sm text-white cursor-pointer select-none">
                    Output as Hex String
                </label>
            </div>
        </div>
    )
}
