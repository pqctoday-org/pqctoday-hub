// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { useOpenSSLStore } from '../../store'
import { FilterDropdown } from '../../../common/FilterDropdown'

interface X509ConfigProps {
  selectedCsrKeyFile: string
  setSelectedCsrKeyFile: (value: string) => void
  certDays: string
  setCertDays: (value: string) => void
  digestAlgo: string
  setDigestAlgo: (value: string) => void
  commonName: string
  setCommonName: (value: string) => void
  org: string
  setOrg: (value: string) => void
  country: string
  setCountry: (value: string) => void
}

export const X509Config: React.FC<X509ConfigProps> = ({
  selectedCsrKeyFile,
  setSelectedCsrKeyFile,
  certDays,
  setCertDays,
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
        <span className="text-xs text-muted-foreground block">Private Key</span>
        <FilterDropdown
          selectedId={selectedCsrKeyFile}
          onSelect={(id) => setSelectedCsrKeyFile(id)}
          items={files
            .filter((f) => f.name.endsWith('.key') || f.name.endsWith('.pem'))
            .map((f) => ({ id: f.name, label: f.name }))}
          defaultLabel="Select Private Key..."
          noContainer
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="x509-days-input" className="text-xs text-muted-foreground block">
          Validity (Days)
        </label>
        <input
          id="x509-days-input"
          type="number"
          value={certDays}
          onChange={(e) => setCertDays(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          min="1"
        />
      </div>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Digest Algorithm</span>
        <FilterDropdown
          selectedId={digestAlgo}
          onSelect={(id) => setDigestAlgo(id)}
          items={[
            { id: 'sha256', label: 'SHA-256' },
            { id: 'sha384', label: 'SHA-384' },
            { id: 'sha512', label: 'SHA-512' },
          ]}
          defaultLabel="Select Digest Algorithm"
          noContainer
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="x509-cn-input" className="text-xs text-muted-foreground block">
          Common Name (CN)
        </label>
        <input
          id="x509-cn-input"
          type="text"
          value={commonName}
          onChange={(e) => setCommonName(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder="example.com"
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="x509-org-input" className="text-xs text-muted-foreground block">
          Organization (O)
        </label>
        <input
          id="x509-org-input"
          type="text"
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder="My Organization"
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="x509-country-input" className="text-xs text-muted-foreground block">
          Country (C)
        </label>
        <input
          id="x509-country-input"
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder="US"
          maxLength={2}
        />
      </div>
    </div>
  )
}
