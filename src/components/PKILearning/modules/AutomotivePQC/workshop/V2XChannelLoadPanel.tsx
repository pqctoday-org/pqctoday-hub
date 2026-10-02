// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router'
import { Radio, AlertTriangle, Info, ArrowRight } from 'lucide-react'
import {
  BSM_RATE_HZ,
  REFERENCE_CHANNEL_MBPS,
  V2X_SIGNATURE_OPTIONS,
  calculateV2XBandwidth,
  vehiclesToFillChannel,
} from '../utils/v2xChannelMath'

/**
 * Aggregate V2X channel load from BSM signatures as vehicle density grows.
 * Moved here from the IoT/OT module's "V2X Broadcast Storm" tab (2026-10-01)
 * and merged into the Sensor Data Integrity step, which already models the
 * per-vehicle V2X message stream.
 */
export const V2XChannelLoadPanel: React.FC = () => {
  const [vehicleCount, setVehicleCount] = useState(100)

  return (
    <div className="glass-panel p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Radio size={14} className="text-primary" />
        <span className="text-sm font-bold text-foreground">
          V2X Channel Load at an Intersection
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">
          Model estimate
        </span>
      </div>

      <p className="text-xs text-foreground/80">
        The table above looks at one vehicle&apos;s V2X stream. On the air, every vehicle in range
        broadcasts Basic Safety Messages at {BSM_RATE_HZ} Hz (SAE J2945/1), and they all share one
        channel. This panel adds up just the signature bytes and compares them with the{' '}
        {REFERENCE_CHANNEL_MBPS} Mbps IEEE 802.11p default data rate.
      </p>

      <div>
        <div className="text-xs font-bold mb-1">Vehicles in radio range: {vehicleCount}</div>
        <input
          type="range"
          aria-label="Vehicles in radio range"
          min="10"
          max="300"
          step="10"
          value={vehicleCount}
          onChange={(e) => setVehicleCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        {V2X_SIGNATURE_OPTIONS.map((opt) => {
          const r = calculateV2XBandwidth(vehicleCount, opt.sigBytes)
          const fill = vehiclesToFillChannel(opt.sigBytes)
          const pct = Math.min(r.channelShare * 100, 100)
          const barColor = r.exceedsChannel
            ? 'bg-status-error'
            : r.channelShare > 0.5
              ? 'bg-status-warning'
              : 'bg-status-success'
          return (
            <div key={opt.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-foreground">
                  {opt.name}{' '}
                  <span className="text-muted-foreground">
                    ({opt.sigBytes.toLocaleString()} B sig)
                  </span>
                </span>
                <span
                  className={`text-xs font-mono ${r.exceedsChannel ? 'text-status-error font-bold' : 'text-foreground'}`}
                >
                  {r.bandwidthUsedMbps.toFixed(2)} Mbps · {(r.channelShare * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                <span>Size: {opt.source}</span>
                <span>Signatures alone fill the channel at ~{fill.toLocaleString()} vehicles</span>
              </div>
              {r.exceedsChannel && (
                <div className="text-[10px] text-status-error mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} /> Signature bytes alone exceed the raw{' '}
                  {REFERENCE_CHANNEL_MBPS} Mbps rate — messages would be lost.
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-status-info/10 rounded-lg p-3 border border-status-info/30 text-[11px] text-foreground space-y-1.5">
        <div className="flex items-start gap-2">
          <Info size={12} className="text-status-info shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p>
              <span className="font-bold">Model limits:</span> only signature bytes are counted. The
              BSM payload, IEEE 1609.2 headers, the certificate or certificate digest attached to
              messages, and MAC/PHY/CSMA contention overhead are all ignored — so a real channel
              congests well below the point flagged here.
            </p>
            <p>
              <span className="font-bold">DSRC vs C-V2X:</span> 6 Mbps is the 802.11p (DSRC /
              ITS-G5) default rate. In the US the FCC moved the 5.9 GHz ITS band from DSRC to C-V2X
              (ET Docket 19-138: 2020 order, finalized in the November 2024 order). C-V2X sidelink
              has a different PHY and capacity, but the conclusion carries over: kilobyte-scale PQC
              signatures on every 10 Hz safety message do not fit a shared broadcast channel, which
              is why designs look at compact signatures, attaching certificates less often, or
              symmetric and hybrid schemes.
            </p>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
        For constrained-device context (memory, power, radio duty cycles), see{' '}
        <Link to="/learn/iot-pqc" className="text-primary inline-flex items-center gap-1">
          IoT &amp; Embedded Device PQC <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
