import React from 'react'
import { FileSearch } from 'lucide-react'
import { useOpenSSLStore } from '../../store'

interface ConfigUtlConfigProps {
    configUtlInFile: string
    setConfigUtlInFile: (value: string) => void
    configUtlOutFile: string
    setConfigUtlOutFile: (value: string) => void
}

export const ConfigUtlConfig: React.FC<ConfigUtlConfigProps> = ({
    configUtlInFile,
    setConfigUtlInFile,
    configUtlOutFile,
    setConfigUtlOutFile,
}) => {
    const { files } = useOpenSSLStore()

    return (
        <div className="space-y-4 animate-fade-in">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
                2. Configuration
            </span>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex gap-2 text-blue-400 mb-1">
                    <FileSearch size={16} className="shrink-0 mt-0.5" />
                    <span className="text-sm font-bold">ConfigUtl</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                    The openssl configutl command is used to read and verify the syntax of OpenSSL configuration files.
                </p>
            </div>

            {/* Input File Selection */}
            <div className="space-y-3">
                <label htmlFor="configutl-input-select" className="text-xs text-muted-foreground block">
                    Configuration File (.cnf)
                </label>
                <select
                    id="configutl-input-select"
                    value={configUtlInFile}
                    onChange={(e) => setConfigUtlInFile(e.target.value)}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                    <option value="">Select a config file (default: openssl.cnf)...</option>
                    {files
                        .filter((f: { name: string }) => f.name.endsWith('.cnf') || f.name === 'openssl.cnf')
                        .map((f: { name: string; size: number }) => (
                            <option key={f.name} value={f.name}>
                                {f.name} ({f.size} bytes)
                            </option>
                        ))}
                </select>
            </div>

            {/* Output Filename */}
            <div className="space-y-3">
                <label htmlFor="configutl-output" className="text-xs text-muted-foreground block">
                    Output File (Optional Dump)
                </label>
                <input
                    id="configutl-output"
                    type="text"
                    value={configUtlOutFile}
                    onChange={(e) => setConfigUtlOutFile(e.target.value)}
                    placeholder="e.g. config_dump.txt"
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50"
                />
                <p className="text-[10px] text-muted-foreground">
                    If specified, the parsed configuration will be dumped to this file.
                </p>
            </div>
        </div>
    )
}
