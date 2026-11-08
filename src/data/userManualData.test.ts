// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { pageManuals, type PageId } from './userManualData'
import { STEP_META, TRACK_INFO } from '@/components/Assess/redesign/assessFlowModel'
import { DOMAIN_META } from '@/components/Assess/redesign/tones'
import { REPORT_SECTION_LABELS } from './reportSectionToCswp39'
import { CSWP39_ZONE_DETAILS, CSWP39_ZONE_ORDER } from './cswp39ZoneData'
import { MODULE_TRACKS } from '@/components/PKILearning/moduleData'
import {
  TOTAL_MODULE_COUNT,
  TRACK_COUNT,
} from '@/components/PKILearning/redesign/learnRedesign.helpers'

// The text of one guide: its summary, every section and every tip.
function guideText(id: PageId): string {
  // eslint-disable-next-line security/detect-object-injection -- id is a closed PageId union
  const m = pageManuals[id]
  return [m.summary, ...m.sections.flatMap((s) => [s.heading, s.body]), ...(m.tips ?? [])].join(
    '\n'
  )
}

const NUMBER_WORDS: Record<number, string> = {
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
}

describe('the Risk Assessment guide matches the questions the wizard asks', () => {
  const text = guideText('assess')

  it('names every question the wizard asks', () => {
    for (const meta of Object.values(STEP_META)) {
      expect(text, `question "${meta.label}"`).toContain(meta.label)
    }
  })

  it('names the question groups the step rail shows', () => {
    for (const domain of Object.values(DOMAIN_META)) {
      expect(text, `group "${domain.label}"`).toContain(domain.label)
    }
  })

  it('states the real question count and length of each track', () => {
    expect(text).toContain(
      `${TRACK_INFO.quick.label} (${TRACK_INFO.quick.count} questions, about ${TRACK_INFO.quick.minutes} minutes)`
    )
    expect(text).toContain(
      `${TRACK_INFO.comprehensive.label} (${TRACK_INFO.comprehensive.count} questions, about ${TRACK_INFO.comprehensive.minutes} minutes)`
    )
  })

  it('describes the index as a modelled priority aid, not a measurement', () => {
    expect(text).toMatch(/not a measured risk probability/)
  })
})

describe('the Readiness Report guide matches the report', () => {
  const text = guideText('report')

  it('names every report section', () => {
    for (const label of Object.values(REPORT_SECTION_LABELS)) {
      expect(text, `section "${label}"`).toContain(label)
    }
  })

  it('names the four index categories', () => {
    for (const category of [
      'Quantum Exposure',
      'Migration Complexity',
      'Regulatory Pressure',
      'Organizational Readiness',
    ]) {
      expect(text).toContain(category)
    }
  })

  it('shares reports by token and calls the old per-parameter links approximate', () => {
    expect(text).toContain('?share=')
    expect(text).toMatch(/approximate/)
  })
})

describe('the Command Center guide matches the page', () => {
  const text = guideText('business-center')

  it('names every zone of the plan', () => {
    for (const zone of CSWP39_ZONE_ORDER) {
      // eslint-disable-next-line security/detect-object-injection -- zone is a closed union
      expect(text, `zone ${zone}`).toContain(CSWP39_ZONE_DETAILS[zone].title)
    }
  })

  it('says the plan has as many zones as the page shows', () => {
    const word = NUMBER_WORDS[CSWP39_ZONE_ORDER.length]
    expect(word).toBeDefined()
    expect(text).toContain(`${word} zones`)
  })

  it('no longer promises the earlier five sections or a rich-text editor', () => {
    expect(text).not.toMatch(/five sections/i)
    expect(text).not.toMatch(/rich text/i)
    expect(text).not.toContain('Vendor/Supply Chain')
  })
})

describe('the Learning Center guide matches the module inventory', () => {
  const text = guideText('learn')

  it('states the number of modules the Learn page counts', () => {
    expect(text).toContain(`${TOTAL_MODULE_COUNT} modules`)
  })

  it('states the number of tracks and names every one', () => {
    // eslint-disable-next-line security/detect-object-injection -- a small numeric count
    const word = NUMBER_WORDS[TRACK_COUNT]
    expect(word).toBeDefined()
    expect(text).toContain(`${word} tracks`)
    for (const { track } of MODULE_TRACKS) {
      expect(text, `track "${track}"`).toContain(track)
    }
  })

  it('names the three views of the Learn page', () => {
    for (const view of ['My Path', 'Browse all', 'Guided routing']) {
      expect(text).toContain(view)
    }
  })
})

describe('the FAQ guide describes search as the page does', () => {
  it('says a question must contain every typed word, not any of them', () => {
    const text = guideText('faq')
    expect(text).toMatch(/every word you type/)
    expect(text).not.toMatch(/match any word/i)
  })
})

describe('the Migration Workbench guide describes the catalogue without a product count', () => {
  const text = guideText('migrate')

  it('does not call the whole catalogue PQC-ready or quote a fixed product count', () => {
    expect(text).not.toMatch(/\d+\+\s*PQC-ready/)
    expect(text).not.toMatch(/PQC-ready software products/)
    expect(text).toContain('each with its own PQC status')
  })
})
