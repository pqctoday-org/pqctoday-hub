// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import {
  Monitor,
  Globe,
  Shield,
  Scale,
  ArrowLeftRight,
  Server,
  Database,
  Plus,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  GATEWAY_COMPONENTS,
  TOPOLOGY_PRESETS,
  TLS_MODES,
  analyzeTopology,
  type GatewayComponent,
  type TLSMode,
  type TopologyConnection,
} from '../data/gatewayData'
import { Button } from '@/components/ui/button'

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Monitor,
  Globe,
  Shield,
  Scale,
  ArrowLeftRight,
  Server,
  Database,
}

const CONNECTION_COLORS: Record<string, string> = {
  'pqc-hybrid': 'bg-status-success',
  'classical-tls13': 'bg-status-warning',
  'mtls-classical': 'bg-status-warning',
  'mtls-pqc-hybrid': 'bg-status-success',
  passthrough: 'bg-muted-foreground',
  plaintext: 'bg-status-error',
}

export const TopologyBuilder: React.FC = () => {
  const [selectedComponents, setSelectedComponents] = useState<GatewayComponent[]>([
    GATEWAY_COMPONENTS[0], // client
  ])
  const [connections, setConnections] = useState<TopologyConnection[]>([])
  const [showAnalysis, setShowAnalysis] = useState(false)

  const availableComponents = useMemo(
    () => GATEWAY_COMPONENTS.filter((c) => !selectedComponents.find((sc) => sc.id === c.id)),
    [selectedComponents]
  )

  const presetItems = TOPOLOGY_PRESETS.map((p) => ({
    id: p.id,
    label: p.name,
    description: p.description,
  }))

  const tlsModeItems = TLS_MODES.map((m) => ({
    id: m.id,
    label: m.label,
  }))

  const handleLoadPreset = (presetId: string) => {
    const preset = TOPOLOGY_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    const components = preset.components
      .map((cId) => GATEWAY_COMPONENTS.find((c) => c.id === cId))
      .filter(Boolean) as GatewayComponent[]
    setSelectedComponents(components)
    setConnections(preset.connections)
    setShowAnalysis(false)
  }

  const handleAddComponent = (component: GatewayComponent) => {
    const newComponents = [...selectedComponents, component]
    setSelectedComponents(newComponents)
    // Auto-add a connection from the previous last component
    if (selectedComponents.length > 0) {
      const from = selectedComponents[selectedComponents.length - 1].id
      setConnections((prev) => [...prev, { from, to: component.id, mode: 'classical-tls13' }])
    }
    setShowAnalysis(false)
  }

  const handleRemoveComponent = (componentId: string) => {
    setSelectedComponents((prev) => prev.filter((c) => c.id !== componentId))
    setConnections((prev) => prev.filter((c) => c.from !== componentId && c.to !== componentId))
    setShowAnalysis(false)
  }

  const handleConnectionModeChange = (index: number, mode: TLSMode) => {
    setConnections((prev) => prev.map((c, i) => (i === index ? { ...c, mode } : c)))
    setShowAnalysis(false)
  }

  const analysis = useMemo(() => analyzeTopology(connections), [connections])

  return (
    <div className="space-y-6">
      {/* Preset Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-sm font-medium text-foreground">Load preset:</span>
        <FilterDropdown
          items={presetItems}
          selectedId=""
          onSelect={handleLoadPreset}
          defaultLabel="Select a topology preset..."
          noContainer
        />
      </div>

      {/* Topology Canvas */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border min-h-[200px]">
        <div className="text-xs font-bold text-foreground mb-4">Topology</div>

        {selectedComponents.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Add components below or load a preset to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Component flow */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedComponents.map((component, idx) => {
                const Icon = ICON_MAP[component.iconName] || Server
                return (
                  <React.Fragment key={component.id}>
                    <div className="flex flex-col items-center gap-1 min-w-[80px]">
                      <div className="relative group">
                        <div className="w-14 h-14 rounded-xl bg-background border-2 border-border flex items-center justify-center">
                          <Icon size={22} className="text-primary" />
                        </div>
                        {component.id !== 'client' && (
                          <Button
                            variant="ghost"
                            onClick={() => handleRemoveComponent(component.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </Button>
                        )}
                      </div>
                      <span className="text-xs text-foreground text-center font-medium leading-tight max-w-[80px]">
                        {component.name}
                      </span>
                    </div>
                    {/* Connection arrow between components */}
                    {idx < selectedComponents.length - 1 && connections[idx] && (
                      <div className="flex flex-col items-center gap-1 px-1">
                        <div
                          className={`h-1 w-8 sm:w-12 rounded-full ${CONNECTION_COLORS[connections[idx].mode] || 'bg-border'}`}
                        />
                        <ChevronRight size={12} className="text-muted-foreground" />
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Connection mode selectors */}
            {connections.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-foreground">Connection Modes</div>
                {connections.map((conn, idx) => {
                  const fromComp = GATEWAY_COMPONENTS.find((c) => c.id === conn.from)
                  const toComp = GATEWAY_COMPONENTS.find((c) => c.id === conn.to)
                  const modeInfo = TLS_MODES.find((m) => m.id === conn.mode)
                  return (
                    <div
                      key={`${conn.from}-${conn.to}`}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-muted/50 rounded-lg p-3"
                    >
                      <span className="text-xs text-foreground shrink-0">
                        {fromComp?.name} &rarr; {toComp?.name}
                      </span>
                      <div className="flex-1 min-w-[200px]">
                        <FilterDropdown
                          items={tlsModeItems}
                          selectedId={conn.mode}
                          onSelect={(id) => handleConnectionModeChange(idx, id as TLSMode)}
                          noContainer
                        />
                      </div>
                      {modeInfo && (
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={
                              modeInfo.quantumSafe ? 'text-status-success' : 'text-status-warning'
                            }
                          >
                            {modeInfo.quantumSafe ? 'Quantum-safe' : 'Quantum-vulnerable'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Component */}
      {availableComponents.length > 0 && (
        <div>
          <div className="text-xs font-bold text-foreground mb-2">Add Component</div>
          <div className="flex flex-wrap gap-2">
            {availableComponents.map((component) => {
              const Icon = ICON_MAP[component.iconName] || Server
              return (
                <Button
                  variant="ghost"
                  key={component.id}
                  onClick={() => handleAddComponent(component)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm"
                >
                  <Plus size={12} className="text-muted-foreground" />
                  <Icon size={14} className="text-primary" />
                  <span className="text-foreground">{component.name}</span>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {connections.length > 0 && (
        <Button
          variant="gradient"
          onClick={() => setShowAnalysis(true)}
          className="w-full px-4 py-3 font-medium rounded-lg transition-colors"
        >
          Analyze Topology
        </Button>
      )}

      {/* Analysis Results */}
      {showAnalysis && (
        <div className="glass-panel p-6 space-y-4 border-l-4 border-l-primary animate-fade-in">
          <h3 className="text-lg font-bold text-foreground">Topology Analysis</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{analysis.totalSegments}</div>
              <div className="text-xs text-muted-foreground">Total Segments</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div
                className={`text-2xl font-bold ${analysis.vulnerableSegments > 0 ? 'text-status-warning' : 'text-status-success'}`}
              >
                {analysis.vulnerableSegments}
              </div>
              <div className="text-xs text-muted-foreground">Vulnerable</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{analysis.certsNeeded}</div>
              <div className="text-xs text-muted-foreground">Certs Needed</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div
                className={`text-2xl font-bold ${
                  analysis.hndlExposure === 'high'
                    ? 'text-status-error'
                    : analysis.hndlExposure === 'medium'
                      ? 'text-status-warning'
                      : 'text-status-success'
                }`}
              >
                {analysis.hndlExposure.charAt(0).toUpperCase() + analysis.hndlExposure.slice(1)}
              </div>
              <div className="text-xs text-muted-foreground">HNDL Exposure</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-foreground">Recommendations</div>
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                {rec.includes('quantum-safe') ? (
                  <CheckCircle2 size={14} className="text-status-success shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
                )}
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded-full bg-status-success" /> PQC / Quantum-safe
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded-full bg-status-warning" /> Classical / Vulnerable
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded-full bg-status-error" /> Plaintext
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded-full bg-muted-foreground" /> Passthrough
        </div>
      </div>
    </div>
  )
}
