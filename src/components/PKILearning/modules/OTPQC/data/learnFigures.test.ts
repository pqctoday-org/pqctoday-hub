// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Every number in Learn text must equal what the workshop computes"
 * (plan E17 / E23). The Learn tab and the exercises read these figures at
 * render time; rag-summary.md quotes them as literals. This test pins the
 * figures AND checks that each literal in rag-summary.md is still what the
 * workshop computes — change a formula and this fails until the prose is
 * updated too.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  svIntervals,
  zoneRanking,
  substationExercise,
  consequenceDefaults,
  gasWithPqcFirmware,
  roadmapDefault,
  roadmapLargeFleet,
  signingProjectLms,
  lmsH20Bytes,
  mldsa87Bytes,
} from './learnFigures'
import { OT_EXERCISES } from '../components/OTPQCExercises'
import { OT_PROTOCOLS } from './otProtocolData'

const rag = fs.readFileSync(path.resolve(__dirname, '../rag-summary.md'), 'utf8')
const zone = (id: string) => zoneRanking.find((z) => z.id === id)!
const sub = (id: string) => substationExercise.find((z) => z.id === id)!
const cons = (id: string) => consequenceDefaults[id]

describe('workshop figures quoted in Learn / exercises / rag-summary', () => {
  it('SV intervals', () => {
    expect(svIntervals.map((s) => s.micros)).toEqual([250, 208, 69])
    expect(rag).toContain('(250, 208 and 69 µs apart)')
  })

  it('Zone planner defaults', () => {
    expect(zoneRanking.map((z) => [z.id, z.priority, z.driver])).toEqual([
      ['iiot-connectors', 100, 'hndl'],
      ['remote-access', 100, 'hndl'],
      ['dmz', 100, 'hndl'],
      ['control', 90, 'forgery'],
      ['sis', 90, 'forgery'],
      ['process', 80, 'forgery'],
      ['enterprise', 70, 'hndl'],
      ['supervisory', 64, 'forgery'],
      ['site-ops', 50, 'hndl'],
    ])
    expect(rag).toContain(
      `IIoT & cloud connectors, Remote & vendor access and Industrial DMZ ${zone('dmz').priority} (HNDL), Basic control and SIS ${zone('control').priority} (forgery), Process / field devices ${zone('process').priority}, Enterprise ${zone('enterprise').priority}, Supervisory control ${zone('supervisory').priority}, Site operations ${zone('site-ops').priority}`
    )
  })

  it('Substation planner exercise profile', () => {
    expect(substationExercise.map((z) => [z.id, z.priority])).toEqual([
      ['wan-iccp', 91],
      ['station-bus', 88],
      ['engineering', 87],
      ['ied-firmware', 70],
      ['process-bus', 34],
      ['time-sync', 21],
    ])
    expect(rag).toContain(
      `ranks WAN ${sub('wan-iccp').priority}, station bus ${sub('station-bus').priority}, engineering ${sub('engineering').priority}, IED firmware ${sub('ied-firmware').priority}, process bus ${sub('process-bus').priority}, time sync ${sub('time-sync').priority}`
    )
  })

  it('Consequence scorer defaults', () => {
    expect(
      Object.fromEntries(Object.entries(consequenceDefaults).map(([k, v]) => [k, v.compound]))
    ).toEqual({
      'transmission-scada': 44,
      'gas-pipeline': 46,
      'water-treatment': 59,
      'rail-etcs': 72,
      'chemical-sis': 63,
      'discrete-line': 14,
      'hospital-bas': 33,
      'hydro-spillway': 90,
    })
    expect(gasWithPqcFirmware.compound).toBe(9)
    expect(rag).toContain(
      `hydro spillway ${cons('hydro-spillway').compound}, rail ETCS ${cons('rail-etcs').compound}, chemical SIS ${cons('chemical-sis').compound} (critical); water treatment ${cons('water-treatment').compound}, gas pipeline ${cons('gas-pipeline').compound}, transmission SCADA ${cons('transmission-scada').compound} (high); hospital building automation ${cons('hospital-bas').compound} (medium); assembly line ${cons('discrete-line').compound} (low)`
    )
    expect(rag).toContain(`the gas pipeline drops to ${gasWithPqcFirmware.compound}`)
  })

  it('Roadmap defaults and large fleet', () => {
    expect([
      roadmapDefault.totalMonths,
      roadmapDefault.finishYear,
      roadmapDefault.signingRootsFinish,
    ]).toEqual([60, 2030, 2027])
    const rollout = roadmapLargeFleet.phases.find((p) => p.id === 'site-rollout')!.durationMonths
    expect([rollout, roadmapLargeFleet.finishYear, roadmapLargeFleet.lateCount]).toEqual([
      192, 2043, 1,
    ])
    expect(rag).toContain(
      `${roadmapDefault.totalMonths} months, ending ${roadmapDefault.finishYear}, signing roots done ${roadmapDefault.signingRootsFinish}`
    )
    expect(rag).toContain(
      `rollout runs ${rollout} months and the programme ends in ${roadmapLargeFleet.finishYear}`
    )
  })

  it('Signing lab', () => {
    expect([lmsH20Bytes, mldsa87Bytes, signingProjectLms.yearsToExhaustion]).toEqual([
      1776, 4627, 0.2,
    ])
    expect(rag).toContain('H20/W8 = 1,776 B signature, 60 B public key')
    expect(rag).toContain('ML-DSA-87 = 4,627 B')
    expect(rag).toContain(`exhausted after ${signingProjectLms.yearsToExhaustion} years`)
  })

  it('Protocol count', () => {
    expect(OT_PROTOCOLS).toHaveLength(14)
    expect(rag).toContain(`${OT_PROTOCOLS.length} OT protocols`)
  })
})

describe('exercises', () => {
  it('one exercise per workshop step, in order', () => {
    expect(OT_EXERCISES.map((e) => e.config.step)).toEqual([0, 1, 2, 3, 4, 5])
  })
  it('observe text carries the computed numbers', () => {
    const byId = Object.fromEntries(OT_EXERCISES.map((e) => [e.id, e.observe]))
    expect(byId['zones-forgery-vs-hndl']).toContain(
      `at ${zone('control').priority}, driven by forgery`
    )
    expect(byId['substation-transmission']).toContain(`scores only ${sub('process-bus').priority}`)
    expect(byId['consequence-firmware']).toContain(`falls to ${gasWithPqcFirmware.compound}`)
    expect(byId['roadmap-site-count']).toContain(`ends in ${roadmapLargeFleet.finishYear}`)
    expect(byId['signing-project-lms']).toContain(
      `after ${signingProjectLms.yearsToExhaustion} years`
    )
  })
})
