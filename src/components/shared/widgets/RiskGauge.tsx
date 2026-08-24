// SPDX-License-Identifier: GPL-3.0-only
import clsx from 'clsx'
import { riskConfig, type RiskLevel } from '@/data/riskConfig'

interface RiskGaugeProps {
  score: number
  level: RiskLevel
}

/** Semicircle arc length for r=80: πr. Used to drive stroke-dasharray so the
 *  filled-arc length is proportional to the score. */
const ARC_LENGTH = Math.PI * 80

/**
 * SVG needle gauge showing a 0–100 risk score. Canonical widget — do not
 * duplicate the SVG in callers. Report and Command Center both consume this.
 *
 * Notes:
 * - The colored arc uses `stroke-linecap="butt"` so rounded caps don't
 *   visually overstate the fill (the earlier version added ~6 units of
 *   extra red on the leading edge because of the round cap).
 * - Needle angle maps linearly from score 0 → −90° (left) to 100 → +90° (right).
 */
export function RiskGauge({ score, level }: RiskGaugeProps) {
  // eslint-disable-next-line security/detect-object-injection
  const config = riskConfig[level]
  const clamped = Math.max(0, Math.min(100, score))
  const angle = (clamped / 100) * 180 - 90
  const filledLength = (clamped / 100) * ARC_LENGTH
  // Nudge text up slightly so a near-vertical needle at score≈50 doesn't
  // overlap the score numeral.
  const textY = 86

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="w-32 h-20 md:w-48 md:h-28"
        role="img"
        aria-label={`Risk score: ${score} out of 100, rated ${config.label}`}
      >
        <title>{`Risk gauge showing score of ${score}/100`}</title>
        {/* Background track — full semicircle, rounded caps look fine here */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-border"
          strokeLinecap="round"
        />
        {/* Colored fill — linecap='butt' so the visible length matches the score exactly */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className={config.color}
          strokeLinecap="butt"
          strokeDasharray={`${filledLength} ${ARC_LENGTH}`}
        />
        {/* Needle — slightly shortened (r=56) so it doesn't collide with the score text */}
        <line
          x1="100"
          y1="100"
          x2={100 + 56 * Math.cos((angle * Math.PI) / 180)}
          y2={100 - 56 * Math.sin((angle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="3"
          className="text-foreground"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" fill="currentColor" className="text-foreground" />
        <text
          x="100"
          y={textY}
          textAnchor="middle"
          className={config.color}
          fill="currentColor"
          fontSize="28"
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      <div className={clsx('text-lg font-bold mt-1 flex items-center gap-1.5', config.color)}>
        {/* Color dot replaces the emoji — platform-independent, matches the gauge color. */}
        <span
          aria-hidden="true"
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: config.dotHex }}
        />
        {config.label}
      </div>
    </div>
  )
}
