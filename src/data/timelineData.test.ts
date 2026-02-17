import { describe, it, expect } from 'vitest'
import { transformToGanttData, timelineData, phaseColors } from './timelineData'
import type { CountryData, Phase } from '../types/timeline'

describe('transformToGanttData', () => {
  describe('Phase Grouping Logic', () => {
    it('groups events by phase type', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2024,
                endYear: 2026,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Quantum-Safe Discovery',
                description: 'Initial assessment',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
              {
                startYear: 2027,
                endYear: 2028,
                phase: 'Testing',
                type: 'Phase',
                title: 'Algorithm Testing',
                description: 'Testing algorithms',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result).toHaveLength(1)
      expect(result[0].phases).toHaveLength(2)
      expect(result[0].phases[0].phase).toBe('Discovery')
      expect(result[0].phases[1].phase).toBe('Testing')
    })

    it('creates separate rows for multiple Migration phases with different titles', () => {
      const mockCountry: CountryData = {
        countryName: 'United States (CNSA)',
        flagCode: 'us',
        bodies: [
          {
            name: 'NSA/CNSA',
            fullName: 'National Security Agency / CNSA',
            countryCode: 'us',
            events: [
              {
                startYear: 2025,
                endYear: 2030,
                phase: 'Migration',
                type: 'Phase',
                title: 'National Security Systems (NSS) Migration',
                description: 'NSS migration',
                orgName: 'NSA/CNSA',
                orgFullName: 'National Security Agency / CNSA',
                countryName: 'United States (CNSA)',
                flagCode: 'us',
              },
              {
                startYear: 2026,
                endYear: 2033,
                phase: 'Migration',
                type: 'Phase',
                title: 'Federal Systems Migration',
                description: 'Federal migration',
                orgName: 'NSA/CNSA',
                orgFullName: 'National Security Agency / CNSA',
                countryName: 'United States (CNSA)',
                flagCode: 'us',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result).toHaveLength(1)
      expect(result[0].phases).toHaveLength(2)
      expect(result[0].phases[0].title).toBe('National Security Systems (NSS) Migration')
      expect(result[0].phases[1].title).toBe('Federal Systems Migration')
      expect(result[0].phases[0].startYear).toBe(2025)
      expect(result[0].phases[1].startYear).toBe(2026)
    })

    it('creates separate rows for multiple Deadline milestones with different titles', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2030,
                endYear: 2030,
                phase: 'Deadline',
                type: 'Milestone',
                title: 'RSA 2048 Deprecated',
                description: 'RSA deadline',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
              {
                startYear: 2035,
                endYear: 2035,
                phase: 'Deadline',
                type: 'Milestone',
                title: 'ECC Deprecated',
                description: 'ECC deadline',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result).toHaveLength(1)
      expect(result[0].phases).toHaveLength(2)
      expect(result[0].phases[0].title).toBe('RSA 2048 Deprecated')
      expect(result[0].phases[1].title).toBe('ECC Deprecated')
      expect(result[0].phases[0].type).toBe('Milestone')
      expect(result[0].phases[1].type).toBe('Milestone')
    })

    it('groups non-Migration/Deadline phases by phase type only', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2024,
                endYear: 2025,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery Phase 1',
                description: 'First discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
              {
                startYear: 2025,
                endYear: 2026,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery Phase 2',
                description: 'Second discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result).toHaveLength(1)
      // Both Discovery events should be grouped into ONE phase row
      expect(result[0].phases).toHaveLength(1)
      expect(result[0].phases[0].phase).toBe('Discovery')
      expect(result[0].phases[0].events).toHaveLength(2)
    })
  })

  describe('Status Aggregation', () => {
    it('aggregates status as "New" when any event is New', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2024,
                endYear: 2025,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery',
                description: 'Discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
                status: 'New',
              },
              {
                startYear: 2025,
                endYear: 2026,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery',
                description: 'Discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
                status: 'Updated',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result[0].phases[0].status).toBe('New') // New takes priority
    })

    it('aggregates status as "Updated" when no events are New', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2024,
                endYear: 2025,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery',
                description: 'Discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
                status: 'Updated',
              },
              {
                startYear: 2025,
                endYear: 2026,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery',
                description: 'Discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result[0].phases[0].status).toBe('Updated')
    })

    it('has no status when no events have status', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2024,
                endYear: 2025,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery',
                description: 'Discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result[0].phases[0].status).toBeUndefined()
    })
  })

  describe('Year Range Calculations', () => {
    it('calculates phase duration from min startYear to max endYear', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2024,
                endYear: 2026,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery',
                description: 'Discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
              {
                startYear: 2025,
                endYear: 2028,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery',
                description: 'Discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result[0].phases[0].startYear).toBe(2024)
      expect(result[0].phases[0].endYear).toBe(2028)
    })

    it('sorts phases by start year', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2028,
                endYear: 2030,
                phase: 'Testing',
                type: 'Phase',
                title: 'Testing',
                description: 'Testing',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
              {
                startYear: 2024,
                endYear: 2026,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery',
                description: 'Discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result[0].phases[0].phase).toBe('Discovery') // 2024 comes first
      expect(result[0].phases[1].phase).toBe('Testing') // 2028 comes second
    })
  })

  describe('Type Determination', () => {
    it('identifies Milestone rows when all events are Milestones', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2030,
                endYear: 2030,
                phase: 'Regulation',
                type: 'Milestone',
                title: 'New Regulation',
                description: 'Regulation',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result[0].phases[0].type).toBe('Milestone')
    })

    it('identifies Phase rows when any event is Phase type', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2024,
                endYear: 2026,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery',
                description: 'Discovery',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
              {
                startYear: 2025,
                endYear: 2025,
                phase: 'Discovery',
                type: 'Milestone',
                title: 'Milestone',
                description: 'Milestone',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result[0].phases[0].type).toBe('Phase')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty country data', () => {
      const result = transformToGanttData([])

      expect(result).toEqual([])
    })

    it('handles country with no events', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result).toHaveLength(1)
      expect(result[0].phases).toHaveLength(0)
    })

    it('handles multiple bodies under one country', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Agency 1',
            fullName: 'Agency 1',
            countryCode: 'tc',
            events: [
              {
                startYear: 2024,
                endYear: 2025,
                phase: 'Discovery',
                type: 'Phase',
                title: 'Discovery 1',
                description: 'Discovery 1',
                orgName: 'Agency 1',
                orgFullName: 'Agency 1',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
          {
            name: 'Agency 2',
            fullName: 'Agency 2',
            countryCode: 'tc',
            events: [
              {
                startYear: 2026,
                endYear: 2027,
                phase: 'Testing',
                type: 'Phase',
                title: 'Testing 2',
                description: 'Testing 2',
                orgName: 'Agency 2',
                orgFullName: 'Agency 2',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result).toHaveLength(1)
      expect(result[0].phases).toHaveLength(2)
      expect(result[0].phases[0].events[0].orgName).toBe('Agency 1')
      expect(result[0].phases[1].events[0].orgName).toBe('Agency 2')
    })

    it('handles phase spanning entire timeline (2024-2035)', () => {
      const mockCountry: CountryData = {
        countryName: 'Test Country',
        flagCode: 'tc',
        bodies: [
          {
            name: 'Test Agency',
            fullName: 'Test Agency',
            countryCode: 'tc',
            events: [
              {
                startYear: 2024,
                endYear: 2035,
                phase: 'Migration',
                type: 'Phase',
                title: 'Long Migration',
                description: 'Very long migration',
                orgName: 'Test Agency',
                orgFullName: 'Test Agency',
                countryName: 'Test Country',
                flagCode: 'tc',
              },
            ],
          },
        ],
      }

      const result = transformToGanttData([mockCountry])

      expect(result[0].phases[0].startYear).toBe(2024)
      expect(result[0].phases[0].endYear).toBe(2035)
    })
  })
})

describe('Phase Color Validation', () => {
  it('all CSV categories have valid Phase type definitions', () => {
    const allPhases = timelineData.flatMap((country) =>
      country.bodies.flatMap((body) => body.events.map((event) => event.phase))
    )
    const uniquePhases = [...new Set(allPhases)]

    const validPhases: Phase[] = [
      'Discovery',
      'Testing',
      'POC',
      'Migration',
      'Standardization',
      'Guidance',
      'Policy',
      'Regulation',
      'Research',
      'Deadline',
    ]

    uniquePhases.forEach((phase) => {
      expect(validPhases).toContain(phase)
    })
  })

  it('all CSV categories have corresponding color mappings', () => {
    const allPhases = timelineData.flatMap((country) =>
      country.bodies.flatMap((body) => body.events.map((event) => event.phase))
    )
    const uniquePhases = [...new Set(allPhases)]

    uniquePhases.forEach((phase) => {
      const colors = phaseColors[phase as Phase]
      expect(colors, `Missing color mapping for phase: ${phase}`).toBeDefined()
      expect(colors.start).toBeTruthy()
      expect(colors.end).toBeTruthy()
      expect(colors.glow).toBeTruthy()
    })
  })

  it('all defined phases have color mappings', () => {
    const validPhases: Phase[] = [
      'Discovery',
      'Testing',
      'POC',
      'Migration',
      'Standardization',
      'Guidance',
      'Policy',
      'Regulation',
      'Research',
      'Deadline',
    ]

    validPhases.forEach((phase) => {
      // eslint-disable-next-line security/detect-object-injection
      const colors = phaseColors[phase]
      expect(colors, `Missing color mapping for phase: ${phase}`).toBeDefined()
    })
  })
})
