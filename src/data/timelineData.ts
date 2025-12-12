import { parseTimelineCSV } from '../utils/csvParser'
import type {
  CountryData,
  Phase,
  TimelineEvent,
  RegulatoryBody,
  EventType,
  TimelinePhase,
  GanttCountryData,
} from '../types/timeline'

// Re-export types for backward compatibility
export type {
  CountryData,
  Phase,
  TimelineEvent,
  RegulatoryBody,
  EventType,
  TimelinePhase,
  GanttCountryData,
}

// Phase color mappings for Gantt chart visualization
export const phaseColors: Record<Phase, { start: string; end: string; glow: string }> = {
  Discovery: {
    start: 'hsl(var(--phase-discovery))',
    end: 'hsl(var(--phase-discovery))',
    glow: 'hsl(var(--phase-discovery) / 0.5)',
  },
  Testing: {
    start: 'hsl(var(--phase-testing))',
    end: 'hsl(var(--phase-testing))',
    glow: 'hsl(var(--phase-testing) / 0.5)',
  },
  POC: {
    start: 'hsl(var(--phase-poc))',
    end: 'hsl(var(--phase-poc))',
    glow: 'hsl(var(--phase-poc) / 0.5)',
  },
  Migration: {
    start: 'hsl(var(--phase-migration))',
    end: 'hsl(var(--phase-migration))',
    glow: 'hsl(var(--phase-migration) / 0.5)',
  },
  Standardization: {
    start: 'hsl(var(--phase-standardization))',
    end: 'hsl(var(--phase-standardization))',
    glow: 'hsl(var(--phase-standardization) / 0.5)',
  },
  Guidance: {
    start: 'hsl(var(--phase-guidance))',
    end: 'hsl(var(--phase-guidance))',
    glow: 'hsl(var(--phase-guidance) / 0.5)',
  },
  Policy: {
    start: 'hsl(var(--phase-policy))',
    end: 'hsl(var(--phase-policy))',
    glow: 'hsl(var(--phase-policy) / 0.5)',
  },
  Regulation: {
    start: 'hsl(var(--phase-regulation))',
    end: 'hsl(var(--phase-regulation))',
    glow: 'hsl(var(--phase-regulation) / 0.5)',
  },
  Research: {
    start: 'hsl(var(--phase-research))',
    end: 'hsl(var(--phase-research))',
    glow: 'hsl(var(--phase-research) / 0.5)',
  },
  Deadline: {
    start: 'hsl(var(--phase-deadline))',
    end: 'hsl(var(--phase-deadline))',
    glow: 'hsl(var(--phase-deadline) / 0.5)',
  },
}

import { MOCK_CSV_CONTENT } from './mockTimelineData'
import { compareDatasets, type ItemStatus } from '../utils/dataComparison'

// Helper to find the latest two timeline CSV files
function getLatestTimelineFiles(): {
  current: { content: string; filename: string; date: Date } | null
  previous: { content: string; filename: string; date: Date } | null
} {
  // Check for mock data environment variable
  if (import.meta.env.VITE_MOCK_DATA === 'true') {
    console.log('Using mock timeline data for testing')
    return {
      current: { content: MOCK_CSV_CONTENT, filename: 'MOCK_DATA', date: new Date() },
      previous: null,
    }
  }

  // Use import.meta.glob to find all timeline CSV files
  const modules = import.meta.glob('./timeline_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  // Extract filenames and parse dates
  const files = Object.keys(modules)
    .map((path) => {
      // Path format: ./timeline_MMDDYYYY.csv or ./timeline_MMDDYYYY_suffix.csv
      // eslint-disable-next-line security/detect-unsafe-regex
      const match = path.match(/timeline_(\d{2})(\d{2})(\d{4})(?:_.*)?\.csv$/)
      if (match) {
        const [, month, day, year] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        // eslint-disable-next-line security/detect-object-injection
        return { path, date, content: modules[path] as string }
      }
      return null
    })
    .filter((f): f is { path: string; date: Date; content: string } => f !== null)

  if (files.length === 0) {
    console.warn('No dated timeline CSV files found.')
    return { current: null, previous: null }
  }

  // Sort by date descending (latest first)
  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  console.log(`Loading latest timeline data from: ${files[0].path}`)
  if (files.length > 1) {
    console.log(`Comparison data loaded from: ${files[1].path}`)
  }

  return {
    current: {
      content: files[0].content,
      filename: files[0].path.split('/').pop() || files[0].path,
      date: files[0].date,
    },
    previous:
      files.length > 1
        ? {
            content: files[1].content,
            filename: files[1].path.split('/').pop() || files[1].path,
            date: files[1].date,
          }
        : null,
  }
}

// Parse the CSV content to get the timeline data
let parsedData: CountryData[] = []
let metadata: { filename: string; lastUpdate: Date } | null = null

try {
  const { current, previous } = getLatestTimelineFiles()

  if (current) {
    const currentCountries = parseTimelineCSV(current.content)
    const previousCountries = previous ? parseTimelineCSV(previous.content) : []

    // Flatten events to compare them
    // Unique ID for event: Country + Org + Phase + Title
    const flattenEvents = (countries: CountryData[]) => {
      return countries.flatMap((c) =>
        c.bodies.flatMap((b) =>
          b.events.map((e) => ({
            ...e,
            id: `${c.countryName}:${b.name}:${e.phase}:${e.title}`,
          }))
        )
      )
    }

    const currentEvents = flattenEvents(currentCountries)
    const previousEvents = flattenEvents(previousCountries)

    // Compute status map
    const statusMap = previous
      ? compareDatasets(currentEvents, previousEvents, 'id')
      : new Map<string, ItemStatus>()

    // Inject status into the nested structure
    parsedData = currentCountries.map((c) => ({
      ...c,
      bodies: c.bodies.map((b) => ({
        ...b,
        events: b.events.map((e) => {
          const id = `${c.countryName}:${b.name}:${e.phase}:${e.title}`
          return {
            ...e,
            status: statusMap.get(id),
          }
        }),
      })),
    }))

    metadata = { filename: current.filename, lastUpdate: current.date }
  } else {
    parsedData = []
  }
} catch (error) {
  console.error('Failed to parse timeline CSV:', error)
  // Fallback to empty array to prevent crash
  parsedData = []
}

export const timelineData: CountryData[] = parsedData
export const timelineMetadata = metadata

/**
 * Converts timeline events into Gantt-compatible data with phases and milestones
 */
export function transformToGanttData(countries: CountryData[]): GanttCountryData[] {
  return countries.map((country) => {
    const allEvents = country.bodies.flatMap((body) => body.events)

    // Group events by unique identifier (Phase + Title) to allow multiple phases of same type
    // This is crucial for CNSA which has multiple "Migration" phases
    const phaseMap = new Map<string, TimelineEvent[]>()

    allEvents.forEach((event) => {
      // Create a unique key for grouping
      // For Milestones, we might want to group them if they are the same phase?
      // Actually, for CNSA, we want distinct rows for distinct migration efforts.
      // Let's group by Title if it's a Migration phase, otherwise by Phase.
      let key = event.phase as string

      if (event.phase === 'Migration') {
        key = `${event.phase}-${event.title}`
      } else if (event.phase === 'Deadline') {
        // Keep Deadlines separate too if they have different titles
        key = `${event.phase}-${event.title}`
      }

      if (!phaseMap.has(key)) {
        phaseMap.set(key, [])
      }
      phaseMap.get(key)!.push(event)
    })

    const phases: TimelinePhase[] = []

    // Create phase rows
    phaseMap.forEach((events) => {
      // Sort events by startYear
      events.sort((a, b) => a.startYear - b.startYear)
      const firstEvent = events[0]

      // Determine if this row is a "Milestone" row or "Phase" row
      const isMilestoneRow = events.every((e) => e.type === 'Milestone')
      const rowType: EventType = isMilestoneRow ? 'Milestone' : 'Phase'

      // Calculate phase duration based on events
      const startYear = Math.min(...events.map((e) => e.startYear))
      const endYear = Math.max(...events.map((e) => e.endYear))

      // Extract the actual phase name from the event, not the key
      const phaseName = firstEvent.phase

      // Determine aggregated status for the phase row
      // If ANY event in the group is New/Updated, mark the phase as modified
      const aggregatedStatus = events.some((e) => e.status === 'New')
        ? 'New'
        : events.some((e) => e.status === 'Updated')
          ? 'Updated'
          : undefined

      phases.push({
        startYear,
        endYear,
        phase: phaseName,
        type: rowType,
        title: firstEvent.title,
        description: firstEvent.description,
        events: events,
        status: aggregatedStatus, // Propagate status to UI model
      })
    })

    // Sort phases by start year
    phases.sort((a, b) => a.startYear - b.startYear)

    return {
      country,
      phases,
    }
  })
}
