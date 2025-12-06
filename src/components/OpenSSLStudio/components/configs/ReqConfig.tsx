import React from 'react'
import { useOpenSSLStore } from '../../store'

interface ReqConfigProps {
  selectedCsrKeyFile: string
  setSelectedCsrKeyFile: (value: string) => void
  digestAlgo: string
  setDigestAlgo: (value: string) => void
  commonName: string
  setCommonName: (value: string) => void
  org: string
  setOrg: (value: string) => void
  country: string
  setCountry: (value: string) => void
}

export const ReqConfig: React.FC<ReqConfigProps> = ({
  selectedCsrKeyFile,
  setSelectedCsrKeyFile,
  digestAlgo,
  setDigestAlgo,
  commonName,
  setCommonName,
  org,
  setOrg,
  country,
  setCountry,
}) => {
  const { files } = useOpenSSLStore()

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        2. Configuration
      </span>

      <div className="space-y-3">
        <label htmlFor="csr-key-select" className="text-xs text-muted-foreground block">
          Private Key
        </label>
        <select
          id="csr-key-select"
          value={selectedCsrKeyFile}
          onChange={(e) => setSelectedCsrKeyFile(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Select Private Key...</option>
          {files
            .filter((f) => f.name.endsWith('.key') || f.name.endsWith('.pem'))
            .map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
        </select>
      </div>

      <div className="space-y-3">
        <label htmlFor="csr-digest-select" className="text-xs text-muted-foreground block">
          Digest Algorithm
        </label>
        <select
          id="csr-digest-select"
          value={digestAlgo}
          onChange={(e) => setDigestAlgo(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="sha256">SHA-256</option>
          <option value="sha384">SHA-384</option>
          <option value="sha512">SHA-512</option>
        </select>
      </div>

      <div className="space-y-3">
        <label htmlFor="csr-cn-input" className="text-xs text-muted-foreground block">
          Common Name (CN)
        </label>
        <input
          id="csr-cn-input"
          type="text"
          value={commonName}
          onChange={(e) => setCommonName(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder="example.com"
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="csr-org-input" className="text-xs text-muted-foreground block">
          Organization (O)
        </label>
        <input
          id="csr-org-input"
          type="text"
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder="My Organization"
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="csr-country-input" className="text-xs text-muted-foreground block">
          Country (C)
        </label>
        <input
          id="csr-country-input"
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder="US"
          maxLength={2}
        />
      </div>
    </div>
  )
}
