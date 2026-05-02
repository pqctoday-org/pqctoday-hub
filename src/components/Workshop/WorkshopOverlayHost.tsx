// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkshopOverlayStore } from '@/store/useWorkshopOverlayStore'
import { useWorkshopStore, isWorkshopActive } from '@/store/useWorkshopStore'
import { CaptionBar } from './CaptionBar'
import { Spotlight } from './Spotlight'
import { Callout } from './Callout'

/**
 * Renders Spotlight / Callout / CaptionBar overlays from the shared
 * WorkshopOverlayStore. Mounted in MainLayout. Visible whenever the
 * workshop is running, paused, or in video mode — the underlying
 * overlay state is identical across modes; only the trigger differs
 * (timer in video, manual stepper in workshop, idle otherwise).
 */
export const WorkshopOverlayHost: React.FC = () => {
  const navigate = useNavigate()
  const setNavigate = useWorkshopOverlayStore((s) => s.setNavigate)
  const caption = useWorkshopOverlayStore((s) => s.caption)
  const captionVisible = useWorkshopOverlayStore((s) => s.captionVisible)
  const spotlightSelector = useWorkshopOverlayStore((s) => s.spotlightSelector)
  const callouts = useWorkshopOverlayStore((s) => s.callouts)
  const mode = useWorkshopStore((s) => s.mode)

  useEffect(() => {
    setNavigate(navigate)
  }, [navigate, setNavigate])

  if (!isWorkshopActive(mode) && mode !== 'paused') return null

  return (
    <>
      <Spotlight selector={spotlightSelector} />
      {callouts.map((c) => (
        <Callout key={c.id} selector={c.selector} label={c.label} arrow={c.arrow} />
      ))}
      <CaptionBar text={caption} visible={captionVisible} />
    </>
  )
}
