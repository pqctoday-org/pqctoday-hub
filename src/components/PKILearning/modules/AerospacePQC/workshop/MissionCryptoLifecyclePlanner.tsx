// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Rocket, Clock, AlertTriangle, ShieldCheck, Key } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { SEGMENT_CADENCES } from '../data/aerospaceConstants'
import type { PlatformCategory } from '../data/aerospaceConstants'
import { CRQC_ESTIMATES } from '@/data/regulatoryTimelines'
import { UnresolvedEstimatesNotice } from '@/components/common/UnresolvedEstimatesNotice'

interface PlatformOption {
  id: PlatformCategory
  label: string
  serviceLifeDefault: number
  segment: string
  description: string
}

const PLATFORMS: PlatformOption[] = [
  {
    id: 'commercial-aircraft',
    label: 'Commercial Aircraft',
    serviceLifeDefault: 30,
    segment: 'airborne',
    description:
      'Narrowbody/widebody civil aircraft (A320neo, B787 class). Crypto upgrade via LRU replacement during maintenance windows.',
  },
  {
    id: 'military-aircraft',
    label: 'Military Aircraft',
    serviceLifeDefault: 40,
    segment: 'airborne',
    description:
      'Fighter/transport aircraft (F-35, C-130J class). Type 1 COMSEC modules. Block upgrade program required.',
  },
  {
    id: 'geo-satellite',
    label: 'GEO Satellite',
    serviceLifeDefault: 15,
    segment: 'space',
    description:
      'Geostationary communications/weather satellite. All crypto provisioned pre-launch. No physical access.',
  },
  {
    id: 'leo-constellation',
    label: 'LEO Constellation',
    serviceLifeDefault: 7,
    segment: 'space',
    description:
      'Low-Earth orbit constellation (Starlink/OneWeb class). Shorter life but high count. Software-defined radio allows limited updates.',
  },
  {
    id: 'uav',
    label: 'UAV / Drone',
    serviceLifeDefault: 15,
    segment: 'airborne',
    description:
      'Unmanned aerial vehicle. Command link authentication is critical — PQC prevents command spoofing by quantum-capable adversaries.',
  },
  {
    id: 'launch-vehicle',
    label: 'Launch Vehicle',
    serviceLifeDefault: 1,
    segment: 'ground',
    description:
      'Expendable/reusable launch vehicle. Crypto used for telemetry and range safety commands during short mission duration.',
  },
]

const platformItems = PLATFORMS.map((p) => ({ id: p.id, label: p.label }))

const CURRENT_YEAR = new Date().getFullYear()

export const MissionCryptoLifecyclePlanner: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformCategory>('geo-satellite')
  const [serviceLife, setServiceLife] = useState(15)
  const [crqcYear, setCrqcYear] = useState<number>(CRQC_ESTIMATES.workshopDefault)
  const [launchYear, setLaunchYear] = useState(2028)

  const platform = useMemo(
    () => PLATFORMS.find((p) => p.id === selectedPlatform)!,
    [selectedPlatform]
  )

  // When platform changes, reset defaults
  const handlePlatformChange = (id: string) => {
    setSelectedPlatform(id as PlatformCategory)
    const p = PLATFORMS.find((pl) => pl.id === id)
    if (p) setServiceLife(p.serviceLifeDefault)
  }

  const endOfLife = launchYear + serviceLife
  const designPhaseStart = launchYear - 3
  const designPhaseEnd = launchYear - 1
  const overlapStart = Math.max(launchYear, crqcYear)
  const yearsExposed = Math.max(0, endOfLife - overlapStart)
  const crqcIntersects = yearsExposed > 0

  // Lifecycle phases
  const phases = useMemo(() => {
    const result = [
      {
        name: 'Algorithm Selection',
        start: designPhaseStart,
        end: designPhaseStart + 1,
        crypto:
          'Evaluate ML-KEM-768/1024, ML-DSA-44/65/87, LMS/XMSS for platform constraints. NSS links: CNSA 2.0 specifies ML-KEM-1024 and ML-DSA-87',
        color: 'bg-primary/20 border-primary/40',
        critical: true,
      },
      {
        name: 'Crypto Library Integration',
        start: designPhaseStart + 1,
        end: designPhaseEnd,
        crypto: 'Integrate PQC library into firmware, achieve DO-178C/DO-326A certification',
        color: 'bg-secondary/20 border-secondary/40',
        critical: true,
      },
      {
        name: 'Key Provisioning',
        start: designPhaseEnd,
        end: launchYear,
        crypto:
          platform.segment === 'space'
            ? 'Pre-launch key loading in ground HSM. Generate LMS tree leaves for entire mission life.'
            : 'Initial key pair generation and certificate issuance. Deploy to avionics via secure key loader.',
        color: 'bg-status-warning/20 border-status-warning/40',
        critical: platform.segment === 'space',
      },
      {
        name: 'Operational Phase',
        start: launchYear,
        end: endOfLife,
        crypto:
          platform.segment === 'space'
            ? 'PQC key exchange for command/telemetry. SEU-adjusted key refresh. No hardware crypto changes possible.'
            : 'PQC-protected data links. Key rotation per maintenance schedule. LRU crypto module replacement if needed.',
        color: 'bg-status-success/20 border-status-success/40',
        critical: false,
      },
    ]

    // Add CRQC intersection marker
    if (crqcIntersects) {
      result.push({
        name: 'Modeled Operational Overlap',
        start: overlapStart,
        end: endOfLife,
        crypto: `${yearsExposed} operational years overlap the assumed CRQC scenario. Assess quantum-vulnerable public-key authentication and key establishment separately from symmetric encryption. Captured-data exposure depends on the protocol and required confidentiality lifetime.`,
        color: 'bg-status-error/20 border-status-error/40',
        critical: true,
      })
    }

    return result
  }, [
    designPhaseStart,
    designPhaseEnd,
    launchYear,
    endOfLife,
    overlapStart,
    crqcIntersects,
    yearsExposed,
    platform.segment,
  ])

  const timelineStart = Math.min(designPhaseStart, crqcYear)
  const timelineEnd = Math.max(endOfLife, crqcYear + 5)
  const timelineSpan = timelineEnd - timelineStart
  const tickCount = Math.min(timelineSpan + 1, 12)

  // Segment cadence info
  const segmentCadence = SEGMENT_CADENCES.find((s) => s.segment === platform.segment)

  return (
    <div className="space-y-6">
      <UnresolvedEstimatesNotice detail="workshopExample" />
      <p className="text-xs text-muted-foreground">
        This illustrative timing model compares mission operation with an assumed CRQC year; it does
        not assess deployed cryptography. The sample algorithm decision window starts three years
        before launch or delivery and is not a prescribed deadline.
      </p>
      {/* Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="mission-platform"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Platform
          </label>
          <FilterDropdown
            items={platformItems}
            selectedId={selectedPlatform}
            onSelect={handlePlatformChange}
            label="Platform"
          />
        </div>
        <div>
          <label
            htmlFor="mission-launch-year"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Launch / Delivery Year
          </label>
          <input
            id="mission-launch-year"
            type="range"
            min={2026}
            max={2040}
            value={launchYear}
            onChange={(e) => setLaunchYear(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="text-xs font-bold text-foreground">{launchYear}</span>
        </div>
        <div>
          <label
            htmlFor="mission-service-life"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Service Life (years)
          </label>
          <input
            id="mission-service-life"
            type="range"
            min={1}
            max={60}
            value={serviceLife}
            onChange={(e) => setServiceLife(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="text-xs font-bold text-foreground">{serviceLife} years</span>
        </div>
        <div>
          <label
            htmlFor="mission-crqc"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Assumed CRQC Year
          </label>
          <input
            id="mission-crqc"
            type="range"
            /* Deliberately wider than CRQC_ESTIMATES.upperBound (2040): a GEO
               satellite designed today can still be flying in 2045, so the
               planner has to let you push the CRQC date past the shared
               research band. Not drift — a sector-specific range. */
            min={CRQC_ESTIMATES.lowerBound}
            max={2045}
            value={crqcYear}
            onChange={(e) => setCrqcYear(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="text-xs font-bold text-foreground">{crqcYear}</span>
        </div>
      </div>

      {/* Platform Info */}
      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Rocket size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">{platform.label}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{platform.description}</p>
        {segmentCadence && (
          <p className="text-xs text-muted-foreground italic">
            {segmentCadence.constraintDescription}
          </p>
        )}
      </div>

      {/* Lifecycle Timeline */}
      <div className="glass-panel p-4 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock size={16} className="text-primary" /> Crypto Lifecycle Timeline
        </h3>

        {/* Year axis */}
        <div className="relative">
          <div
            role="list"
            aria-label="Illustrative lifecycle year axis"
            className="flex justify-between text-[10px] text-muted-foreground mb-1"
          >
            {Array.from({ length: tickCount }, (_, i) => {
              const year =
                timelineStart + Math.round((i / Math.max(1, tickCount - 1)) * timelineSpan)
              return (
                <span role="listitem" key={i}>
                  {year}
                </span>
              )
            })}
          </div>

          {/* Phase bars */}
          <div className="space-y-2">
            {phases.map((phase) => {
              const leftPct = ((phase.start - timelineStart) / timelineSpan) * 100
              const widthPct = ((phase.end - phase.start) / timelineSpan) * 100
              return (
                <div key={phase.name} className="relative h-8">
                  <div
                    className={`absolute top-0 h-full rounded border ${phase.color} flex items-center px-2 overflow-hidden`}
                    style={{
                      left: `${Math.max(0, leftPct)}%`,
                      width: `${Math.min(100 - leftPct, widthPct)}%`,
                    }}
                  >
                    <span className="text-[10px] font-bold text-foreground whitespace-nowrap truncate">
                      {phase.name} ({phase.start}&ndash;{phase.end})
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CRQC marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-status-error z-10"
            style={{
              left: `${((crqcYear - timelineStart) / timelineSpan) * 100}%`,
            }}
          >
            <div className="absolute -top-5 -left-8 text-[10px] font-bold text-status-error whitespace-nowrap">
              Assumed CRQC {crqcYear}
            </div>
          </div>
        </div>
      </div>

      {/* Phase Details */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Phase Details</h3>
        <div className="space-y-3">
          {phases.map((phase) => (
            <div key={phase.name} className={`rounded-lg p-3 border ${phase.color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground">{phase.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {phase.start}&ndash;{phase.end} ({phase.end - phase.start} yr)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{phase.crypto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness Assessment */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" /> Illustrative Mission Timing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Key size={14} className="text-primary" />
            </div>
            <div
              className={`text-lg font-bold ${crqcIntersects ? 'text-status-error' : 'text-status-success'}`}
            >
              {crqcIntersects ? `${yearsExposed} yr modeled overlap` : 'No operational overlap'}
            </div>
            <div className="text-muted-foreground">Operational Scenario Overlap</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">
              {designPhaseStart}&ndash;{designPhaseStart + 1}
            </div>
            <div className="text-muted-foreground">Sample Algorithm Decision Window</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div
              className={`text-lg font-bold ${designPhaseStart <= CURRENT_YEAR ? 'text-status-error' : 'text-status-warning'}`}
            >
              {designPhaseStart <= CURRENT_YEAR ? 'NOW' : `${designPhaseStart - CURRENT_YEAR} yr`}
            </div>
            <div className="text-muted-foreground">Until Sample Decision Window</div>
          </div>
        </div>

        {crqcIntersects && (
          <div className="flex items-start gap-2 text-xs bg-status-error/10 rounded-lg p-3 border border-status-error/20">
            <AlertTriangle size={14} className="text-status-error shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Modeled overlap:</strong>{' '}
              <span className="text-muted-foreground">
                Under the assumed CRQC year ({crqcYear}), {yearsExposed} operational years overlap
                this scenario. Assess quantum-vulnerable public-key command authentication and key
                establishment. This timing model does not establish that all cryptography is broken;
                symmetric encryption needs its own algorithm and key-strength assessment. Retained
                data may need confidentiality beyond the mission lifetime.
              </span>
            </div>
          </div>
        )}

        {!crqcIntersects && (
          <div className="flex items-start gap-2 text-xs bg-status-success/10 rounded-lg p-3 border border-status-success/20">
            <ShieldCheck size={14} className="text-status-success shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">No operational overlap:</strong>{' '}
              <span className="text-muted-foreground">
                The platform ends operation at or before the selected CRQC year. This is not a
                safety determination: pre-launch provisioning, retained-data confidentiality and
                signature or trust lifetimes still need separate assessment. HNDL exposure depends
                on the protocol and key establishment, and how long captured data needs
                confidentiality.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
