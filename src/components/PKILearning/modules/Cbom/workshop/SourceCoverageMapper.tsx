// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { CheckCircle2, AlertTriangle, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Source Coverage Mapper — the "not another scanner / leverage existing agents"
 * tool. Tick the tools/agents you already run; the grid shows which of the five
 * discovery layers are already covered vs the blind spots (= ghost crypto), and
 * recommends the minimal net-new scanning instead of a blanket rollout.
 */

const LAYERS = [
  'Source code',
  'Binary / container',
  'Network / TLS',
  'Infrastructure / KMS',
  'Cloud',
] as const
type Layer = (typeof LAYERS)[number]

interface Tool {
  id: string
  name: string
  note: string
  covers: Layer[]
}

const TOOLS: Tool[] = [
  {
    id: 'qualys',
    name: 'Qualys / Tenable / Rapid7',
    note: 'vuln scanners + on-host agents',
    covers: ['Network / TLS'],
  },
  {
    id: 'venafi',
    name: 'Venafi / Keyfactor / DigiCert',
    note: 'certificate lifecycle',
    covers: ['Network / TLS', 'Infrastructure / KMS'],
  },
  {
    id: 'sbom',
    name: 'SBOM / SCA pipeline',
    note: 'library versions',
    covers: ['Binary / container'],
  },
  { id: 'cspm', name: 'CSPM (Wiz / Prisma / Defender)', note: 'cloud posture', covers: ['Cloud'] },
  {
    id: 'edr',
    name: 'EDR agents (CrowdStrike / Defender)',
    note: 'already on endpoints',
    covers: ['Network / TLS'],
  },
]

// Net-new tools to recommend for whichever layers stay uncovered.
const NET_NEW: Record<Layer, string> = {
  'Source code': 'CBOMkit / sonar-cryptography (source scan)',
  'Binary / container': 'CBOMkit-theia (container/image scan)',
  'Network / TLS': 'Active PQC scanner + passive handshake capture',
  'Infrastructure / KMS': 'HSM/KMS query via PKCS#11 / KMIP',
  Cloud: 'Cloud KMS/cert APIs (AWS/Azure/GCP) + CSPM rules',
}

export function SourceCoverageMapper() {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const covered = new Set<Layer>()
  for (const tool of TOOLS) {
    if (selected.has(tool.id)) tool.covers.forEach((l) => covered.add(l))
  }
  const blindSpots = LAYERS.filter((l) => !covered.has(l))

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Reuse before you deploy</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Tick the tools and agents you already run. A CBOM is an aggregation layer — reuse existing
          telemetry first and scan net-new only where you are blind.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {TOOLS.map((tool) => {
          const on = selected.has(tool.id)
          return (
            <Button
              key={tool.id}
              variant="ghost"
              onClick={() => toggle(tool.id)}
              className={`glass-panel h-auto w-full flex-col items-start justify-start whitespace-normal border p-3 text-left ${
                on ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={16}
                  className={on ? 'text-primary' : 'text-muted-foreground/40'}
                />
                <span className="text-sm font-medium text-foreground">{tool.name}</span>
              </div>
              <p className="ml-6 mt-1 text-xs text-muted-foreground">{tool.note}</p>
            </Button>
          )
        })}
      </div>

      <div className="glass-panel p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Discovery-layer coverage</h4>
        <div className="space-y-1.5">
          {LAYERS.map((layer) => {
            const ok = covered.has(layer)
            return (
              <div key={layer} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{layer}</span>
                {ok ? (
                  <span className="flex items-center gap-1 text-status-success">
                    <CheckCircle2 size={14} /> covered
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-status-warning">
                    <AlertTriangle size={14} /> blind spot
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {blindSpots.length > 0 && (
        <div className="glass-panel p-4 border border-status-warning/30">
          <h4 className="text-sm font-semibold text-foreground mb-2">
            Minimal net-new scanning (only the {blindSpots.length} blind spot
            {blindSpots.length > 1 ? 's' : ''})
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {blindSpots.map((l) => (
              <li key={l}>
                {/* eslint-disable-next-line security/detect-object-injection -- l is a closed union */}
                <span className="text-foreground font-medium">{l}:</span> {NET_NEW[l]}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Everything normalizes to one CycloneDX CBOM.
          </p>
        </div>
      )}
      {blindSpots.length === 0 && selected.size > 0 && (
        <div className="glass-panel p-4 border border-status-success/30 text-sm text-foreground">
          All five layers covered by tools you already run — no net-new scanner rollout required.
        </div>
      )}
    </div>
  )
}
