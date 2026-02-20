import { describe, it, expect } from 'vitest'
import { transformToGanttData, timelineData, timelineMetadata } from './timelineData'
import type { CountryData, TimelineEvent } from '../types/timeline'

describe('timelineData', () => {
  it('loads and processes timelineData efficiently on module init', () => {
    // Should be an array based on the import.meta.glob matching timeline CSVs
    expect(Array.isArray(timelineData)).toBe(true)

    // Metadata is loaded
    if (timelineData.length > 0) {
      expect(timelineMetadata).toBeDefined()
      expect(timelineMetadata?.filename).toBeDefined()
      expect(timelineMetadata?.lastUpdate).toBeInstanceOf(Date)
    }
  })

  describe('transformToGanttData', () => {
    it('groups events correctly into phases and milestones', () => {
      const mockEvent1: TimelineEvent = {
        title: 'Draft Standards',
        phase: 'Guidance',
        description: 'First draft',
        startYear: 2023,
        endYear: 2024,
        type: 'Phase',
        status: 'New',
      }

      const mockEvent2: TimelineEvent = {
        title: 'Initial Research',
        phase: 'Guidance', // same phase key should group
        description: 'Before draft',
        startYear: 2022,
        endYear: 2023,
        type: 'Phase',
      }

      const mockMigration1: TimelineEvent = {
        title: 'Migrate Core',
        phase: 'Migration', // Migration phases group by title
        description: 'Core infra',
        startYear: 2025,
        endYear: 2027,
        type: 'Phase',
      }

      const mockMigration2: TimelineEvent = {
        title: 'Migrate Edge',
        phase: 'Migration',
        description: 'Edge nodes',
        startYear: 2026,
        endYear: 2028,
        type: 'Phase',
      }

      const mockMilestone: TimelineEvent = {
        title: 'Standard Published',
        phase: 'Deadline', // Deadlines group by title
        description: 'Final publication',
        startYear: 2024,
        endYear: 2024,
        type: 'Milestone',
        status: 'Updated',
      }

      const countryData: CountryData[] = [
        {
          region: 'North America',
          countryName: 'USA',
          countryCode: 'US',
          priority: 1,
          bodies: [
            {
              name: 'NIST',
              role: 'Standards body',
              events: [mockEvent1, mockEvent2, mockMigration1, mockMigration2, mockMilestone],
            },
          ],
        },
      ]

      const result = transformToGanttData(countryData)

      expect(result).toHaveLength(1)
      const usGantt = result[0]
      expect(usGantt.country.countryName).toBe('USA')

      // We expect 4 phase groups: Guidance, Migration-Migrate Core, Migration-Migrate Edge, Deadline-Standard Published
      expect(usGantt.phases).toHaveLength(4)

      // They should be sorted by start year
      // Group 1: Guidance (starts 2022)
      expect(usGantt.phases[0].phase).toBe('Guidance')
      expect(usGantt.phases[0].startYear).toBe(2022)
      expect(usGantt.phases[0].endYear).toBe(2024)
      expect(usGantt.phases[0].events).toHaveLength(2)
      expect(usGantt.phases[0].status).toBe('New') // Inherited from mockEvent1

      // Group 2: Deadline (starts 2024)
      expect(usGantt.phases[1].phase).toBe('Deadline')
      expect(usGantt.phases[1].startYear).toBe(2024)
      expect(usGantt.phases[1].endYear).toBe(2024)
      expect(usGantt.phases[1].type).toBe('Milestone')
      expect(usGantt.phases[1].status).toBe('Updated')

      // Group 3: Migrate Core (starts 2025)
      expect(usGantt.phases[2].phase).toBe('Migration')
      expect(usGantt.phases[2].startYear).toBe(2025)

      // Group 4: Migrate Edge (starts 2026)
      expect(usGantt.phases[3].phase).toBe('Migration')
      expect(usGantt.phases[3].startYear).toBe(2026)
    })
  })
})
