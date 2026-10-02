// SPDX-License-Identifier: GPL-3.0-only
/**
 * Step 6 — LPWAN airtime for a signed firmware update (generalised 2026-10-01
 * from the Energy & Utilities RF-mesh simulator). The corrected lesson: the
 * signature is a few percent of an update's bytes; whether a cell can be
 * updated in its window is decided by the image size, multicast vs unicast,
 * and the link. All numbers are model estimates.
 */
import React, { useState } from 'react'
import { Radio, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { algorithmById } from '../constants'
import { LPWAN_TECHS, firmwareAirtime, EU868_DUTY_CYCLE, type LpwanTech } from '../utils/lpwanMath'

export interface LpwanConfig {
  techId?: LpwanTech
  sigAlgId?: string
  multicast?: boolean
  firmwareKB?: number
  devicesPerCell?: number
}

const SIG_CHOICES = [
  'ecdsa-p256',
  'lms-h10-w4',
  'fn-dsa-512',
  'ml-dsa-44',
  'ml-dsa-65',
  'ml-dsa-87',
]

const fmtH = (h: number) =>
  h >= 48
    ? `${(h / 24).toFixed(1)} days`
    : h >= 1
      ? `${h.toFixed(1)} h`
      : `${(h * 60).toFixed(1)} min`

export const LpwanAirtimeSimulator: React.FC<{ initial?: LpwanConfig }> = ({ initial }) => {
  const [techId, setTechId] = useState<LpwanTech>(initial?.techId ?? 'wisun-fsk')
  const [sigAlgId, setSigAlgId] = useState(initial?.sigAlgId ?? 'ml-dsa-44')
  const [firmwareKB, setFirmwareKB] = useState(initial?.firmwareKB ?? 150)
  const [devicesPerCell, setDevicesPerCell] = useState(initial?.devicesPerCell ?? 1000)
  const [hops, setHops] = useState(3)
  const [multicast, setMulticast] = useState(initial?.multicast ?? false)
  const windowHours = 24

  const tech = LPWAN_TECHS.find((t) => t.id === techId) ?? LPWAN_TECHS[0]
  const alg = algorithmById(sigAlgId)
  const input = {
    techId,
    firmwareBytes: firmwareKB * 1024,
    signatureBytes: alg.outputBytes,
    keyBytes: 0,
    devicesPerCell,
    multicast,
    hops,
    windowHours,
  }
  // cheap arithmetic — recomputed every render
  const result = firmwareAirtime(input)
  const classical = firmwareAirtime({
    ...input,
    signatureBytes: algorithmById('ecdsa-p256').outputBytes,
  })
  const elapsed = result.dutyCycleHours ?? result.cellHours
  const classicalElapsed = classical.dutyCycleHours ?? classical.cellHours

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Push one signed firmware update to every device in a cell. Compare the signature&apos;s
        share of the bytes with the effect of switching from unicast to multicast — the second
        matters far more.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-4 space-y-4">
          <div>
            <span className="text-xs font-bold text-foreground block mb-1">Link</span>
            <FilterDropdown
              noContainer
              selectedId={techId}
              onSelect={(id) => setTechId(id as LpwanTech)}
              items={LPWAN_TECHS.map((t) => ({ id: t.id, label: t.name }))}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {tech.rateSource}. {tech.notes}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block mb-1">
              Signature on the update
            </span>
            <div className="grid grid-cols-2 gap-2">
              {SIG_CHOICES.map((id) => {
                const a = algorithmById(id)
                return (
                  <Button
                    key={id}
                    variant={id === sigAlgId ? 'default' : 'outline'}
                    onClick={() => setSigAlgId(id)}
                    className="h-auto py-1.5 text-[11px] flex flex-col items-start"
                  >
                    <span className="font-bold">{a.name}</span>
                    <span className="opacity-80">{a.outputBytes.toLocaleString('en-US')} B</span>
                  </Button>
                )
              })}
            </div>
          </div>
          <Slider
            label="Firmware image"
            value={firmwareKB}
            unit="KiB"
            min={16}
            max={512}
            step={16}
            onChange={setFirmwareKB}
          />
          <Slider
            label="Devices in the cell"
            value={devicesPerCell}
            unit=""
            min={100}
            max={5000}
            step={100}
            onChange={setDevicesPerCell}
          />
          {tech.mesh && (
            <Slider
              label="Mesh hops"
              value={hops}
              unit=""
              min={1}
              max={6}
              step={1}
              onChange={setHops}
            />
          )}
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={multicast}
              onChange={(e) => setMulticast(e.target.checked)}
              className="accent-primary"
            />
            Deliver by multicast (one copy per cell, as FUOTA and Wi-SUN multicast do)
          </label>
        </div>

        <div className="glass-panel p-4 space-y-4" data-testid="airtime-results">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Radio size={16} className={result.fitsWindow ? 'text-success' : 'text-destructive'} />
            Airtime — model estimate
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Box label="Update size" value={`${(result.payloadBytes / 1024).toFixed(1)} KiB`} />
            <Box
              label="Signature share"
              value={`${(result.signatureShare * 100).toFixed(1)}%`}
              note={`${alg.outputBytes.toLocaleString('en-US')} B of ${result.payloadBytes.toLocaleString('en-US')} B`}
            />
            <Box label="Copies sent" value={result.copies.toLocaleString('en-US')} />
            <Box
              label={
                result.dutyCycleHours !== undefined ? 'Wall time (1% duty cycle)' : 'Channel time'
              }
              value={fmtH(elapsed)}
              note={`with ECDSA instead: ${fmtH(classicalElapsed)}`}
            />
            {result.frames !== undefined && (
              <Box label="LoRaWAN frames per copy" value={result.frames.toLocaleString('en-US')} />
            )}
          </div>
          {result.fitsWindow ? (
            <div className="flex gap-2 text-xs bg-success/10 border border-success/20 rounded-lg p-3">
              <CheckCircle2 size={16} className="text-success shrink-0" />
              Fits the {windowHours}-hour window.
            </div>
          ) : (
            <div className="flex gap-2 text-xs bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <AlertTriangle size={16} className="text-destructive shrink-0" />
              <span>
                Exceeds the {windowHours}-hour window
                {classicalElapsed > windowHours
                  ? ' — and so does the same update signed with ECDSA. The image and delivery mode cause this, not the PQC signature.'
                  : '.'}
              </span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            IP links: rate × {(tech.efficiency * 100).toFixed(0)}% MAC/PHY efficiency, ÷ hops on a
            mesh (each hop re-sends on the shared channel). LoRaWAN: per-frame time on air (SF7/125
            kHz, CR 4/5, 13 B MAC overhead) and a {EU868_DUTY_CYCLE * 100}% duty cycle. Not a packet
            capture.
          </p>
        </div>
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  unit: string
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <div className="text-xs font-bold flex justify-between mb-1">
        <span>{label}</span>
        <span className="font-mono text-primary">
          {value.toLocaleString('en-US')} {unit}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </label>
  )
}

function Box({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-muted/20 p-3 rounded-lg border">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-mono font-bold">{value}</div>
      {note && <div className="text-[10px] text-muted-foreground">{note}</div>}
    </div>
  )
}
