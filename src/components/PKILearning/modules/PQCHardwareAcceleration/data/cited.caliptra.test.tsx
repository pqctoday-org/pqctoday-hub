// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Caliptra / Adams Bridge figures are documented figures for a named version, not silicon
 * measurements, and masking is not described as free. Sources (read 8 Nov 2026): the Adams Bridge
 * v3.0 columns in the Caliptra 2.1 documentation (adams-bridge commit 753d4d4: AdamsBridge_MLDSA.md,
 * AdamsBridge_MLKEM.md, AdamsBridgeHardwareSpecification.md), the Adams Bridge side-channel
 * presentation (6x area, 37% ML-DSA signing latency, 10% ML-KEM), and the Tessera hardware
 * repository (tessera-rtl commit fc5e739, src/mldsa_mlkem_all_levels/abr_top/rtl/tessera_abr_params_pkg.sv).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { AccelerationIntroduction } from '../components/AccelerationIntroduction'
import { ASIC_ENGINES, CITED_FACTS, MASKING_COSTS, MASKING_TAKEAWAYS } from './cited'
import { AGILITY_STRATEGIES } from './agility'
import ragSummary from '../rag-summary.md?raw'

const flat = (s: string) => s.replace(/\s+/g, ' ')
const adamsRows = MASKING_COSTS.filter((m) => m.impl.startsWith('Caliptra Adams Bridge'))
const adamsText = flat(JSON.stringify(adamsRows))
const allText = flat(
  JSON.stringify({
    MASKING_COSTS,
    MASKING_TAKEAWAYS,
    ASIC_ENGINES,
    CITED_FACTS,
    AGILITY_STRATEGIES,
  })
)

describe('Adams Bridge masking cost', () => {
  it('no longer says masking costs zero extra cycles or only area', () => {
    for (const bad of [
      /zero extra cycles/i,
      /no extra cycles/i,
      /11,056/,
      /the only cost of enabling masking is area/i,
    ]) {
      expect(allText).not.toMatch(bad)
      expect(flat(ragSummary)).not.toMatch(bad)
    }
  })

  it('gives the 2.1-documentation figures with their version', () => {
    expect(adamsRows).toHaveLength(2)
    expect(adamsRows[0].impl).toMatch(/v3\.0/)
    expect(adamsRows[0].impl).toMatch(/Caliptra 2\.1 documentation/)
    expect(adamsText).toMatch(/58 → 63 µs/)
    expect(adamsText).toMatch(/11,144 → 11,986 cycles/)
    expect(adamsText).toMatch(/909,602 → 1,398,044 gate equivalents/)
    expect(adamsText).toMatch(/at most 2 to ML-KEM/)
    expect(adamsRows[0].url).toMatch(/adams_bridge_mldsa\.html$/)
    expect(adamsRows[0].platform).toMatch(/not silicon/)
  })

  it('gives the security presentation figures as a separate row with its own source', () => {
    expect(adamsRows[1].impl).toMatch(/security presentation, version not stated/)
    expect(adamsRows[1].cost).toMatch(/6× area/)
    expect(adamsRows[1].cost).toMatch(/37% more latency for ML-DSA signing/)
    expect(adamsRows[1].cost).toMatch(/10% more for ML-KEM/)
    expect(adamsRows[1].url).toMatch(/adamsbridge-sca-presentation\.pdf$/)
  })

  it('says the cost depends on version and operation', () => {
    expect(MASKING_TAKEAWAYS.join(' ')).toMatch(/depends on the version and the operation/)
    expect(MASKING_TAKEAWAYS.join(' ')).toMatch(/a security presentation \(version not stated\)/)
    expect(MASKING_TAKEAWAYS.join(' ')).not.toMatch(/earlier security presentation/)
    expect(flat(ragSummary)).not.toMatch(/earlier Adams Bridge security presentation/)
  })
})

describe('Adams Bridge speed figures', () => {
  const ab = ASIC_ENGINES.find((a) => a.engine.startsWith('Caliptra Adams Bridge'))

  it('replaces the 26 / 61 / 31 µs phases with the documented 2.1 figures', () => {
    expect(ab?.perf).not.toMatch(/26 \/ 61 \/ 31/)
    expect(ab?.perf).toMatch(/signing round 58 µs \(63 µs protected\)/)
    expect(ab?.perf).toMatch(/decapsulation 19 µs \(20 µs protected\)/)
  })

  it('labels them as documented figures for a named version, not silicon measurements', () => {
    expect(ab?.perf).toMatch(/Documented, not silicon: RTL simulation, 600 MHz, v3\.0/)
  })

  it('replaces the area figure that pre-dated the masking refactor', () => {
    expect(ab?.area).not.toMatch(/0\.1096/)
    expect(ab?.area).toMatch(/0\.0459 mm²/)
  })

  it('leaves no sentence on the page that still gives the old area or the "pre-dates" note', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <AccelerationIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    const page = flat(document.body.textContent ?? '')
    expect(page).not.toContain('a tenth of a square millimetre')
    expect(page).not.toContain('pre-dates a masking refactor')
    expect(page).toContain('about 0.05 square millimetres of 5 nm silicon')
    expect(page).toContain('0.0459 mm²')
  })
})

describe('Tessera accelerator note', () => {
  it('describes it as an open hardware design with its own parameter sets, separate by inference', () => {
    expect(CITED_FACTS.tesseraAccelerator).toMatch(
      /open hardware design, with no silicon or product in the sources read/
    )
    expect(CITED_FACTS.tesseraAccelerator).toMatch(
      /implements every ML-DSA and ML-KEM parameter set, selected at run time/
    )
    expect(CITED_FACTS.tesseraAccelerator).toMatch(/ML-DSA-44\/65\/87 and ML-KEM-512\/768\/1024/)
    expect(CITED_FACTS.tesseraAccelerator).toMatch(
      /reading them as separate designs is our inference, so do not read them as the same engine/
    )
    expect(CITED_FACTS.tesseraAccelerator).toMatch(/does not say how the two relate/)
    expect(CITED_FACTS.tesseraAccelerator).toContain(
      '“MUST have a Caliptra 2.2 subsystem root of trust”'
    )
    expect(CITED_FACTS.tesseraAccelerator).toContain('come from the Caliptra 2.1 documentation')
    expect(CITED_FACTS.tesseraAccelerator).toContain('“scheduled for release in December”')
    expect(CITED_FACTS.adamsBridge).toMatch(/ML-DSA-87 and ML-KEM-1024 parameter sets only/)
  })

  it('uses no product words for Tessera', () => {
    for (const word of ['ships', 'available now', 'certified', 'in every server']) {
      expect(CITED_FACTS.tesseraAccelerator.toLowerCase()).not.toContain(word)
    }
  })

  it('is on the page with a link to the trust-hardware comparison, and in the rag-summary', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <AccelerationIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(document.body.textContent ?? '').toContain(CITED_FACTS.tesseraAccelerator)
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((h) => h === '/learn/arch-quantum-impact?tab=workshop&step=5')
    // one beside the Tessera note and one in the related-modules block
    expect(hrefs).toHaveLength(2)
    expect(
      screen.getAllByRole('link', { name: /Compare with the other trust hardware/ })
    ).toHaveLength(1)
    expect(flat(ragSummary)).toContain(
      "Tessera's accelerator comes from an open hardware design with no silicon or product in the sources read"
    )
  })
})
