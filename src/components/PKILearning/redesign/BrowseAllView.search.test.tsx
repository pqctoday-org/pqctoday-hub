// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { BrowseAllView } from './BrowseAllView'
import { useModuleStore } from '@/store/useModuleStore'
import { MODULE_TOPIC_KEYWORDS } from '@/data/moduleTopicSummaries'
import { MODULE_TRACKS } from '../moduleData'

const iotOt = MODULE_TRACKS.flatMap((t) => t.modules).find((m) => m.id === 'iot-ot-pqc')!

const renderBrowse = () =>
  render(
    <MemoryRouter initialEntries={['/learn']}>
      <BrowseAllView personaId={null} />
    </MemoryRouter>
  )

const search = (value: string) =>
  fireEvent.change(screen.getByLabelText('Search modules'), { target: { value } })

describe('BrowseAllView search — match all words + topic keywords', () => {
  beforeEach(() => {
    useModuleStore.setState({ modules: {} })
    localStorage.clear()
  })

  it('premise: the IoT & OT card description does not mention Purdue, its keywords do', () => {
    expect(iotOt).toBeDefined()
    expect(`${iotOt.title} ${iotOt.description}`.toLowerCase()).not.toContain('purdue')
    expect(MODULE_TOPIC_KEYWORDS['iot-ot-pqc'].toLowerCase()).toContain('purdue model')
  })

  it('finds the IoT & OT module for "purdue model for OT"', async () => {
    renderBrowse()
    search('purdue model for OT')
    expect(await screen.findByText(iotOt.title)).toBeInTheDocument()
    expect(screen.queryByText('No modules match your filters.')).not.toBeInTheDocument()
  })

  it('finds it for the single word "purdue"', async () => {
    renderBrowse()
    search('purdue')
    expect(await screen.findByText(iotOt.title)).toBeInTheDocument()
  })

  it('still matches title+description phrases it matched before', async () => {
    renderBrowse()
    search('constrained devices')
    expect(await screen.findByText(iotOt.title)).toBeInTheDocument()
  })

  it('shows the empty state when a word matches nothing', async () => {
    renderBrowse()
    search('purdue zzzznotaword')
    expect(await screen.findByText('No modules match your filters.')).toBeInTheDocument()
  })
})
