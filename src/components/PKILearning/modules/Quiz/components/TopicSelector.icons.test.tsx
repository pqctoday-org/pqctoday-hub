// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { quizCategories } from '@/data/quizDataLoader'
import { QUIZ_ICON_MAP } from './TopicSelector'

describe('quiz category icons', () => {
  it('names an icon TopicSelector knows for every category (an unknown name silently becomes Shield)', () => {
    const unknown = quizCategories
      .filter((c) => !Object.prototype.hasOwnProperty.call(QUIZ_ICON_MAP, c.icon))
      .map((c) => `${c.id}: ${c.icon}`)
    expect(unknown).toEqual([])
  })

  it('maps every name to something React can render', () => {
    for (const [name, Icon] of Object.entries(QUIZ_ICON_MAP)) {
      expect(['function', 'object'], name).toContain(typeof Icon)
    }
  })
})
