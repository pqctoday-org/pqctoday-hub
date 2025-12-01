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
  Discovery: { start: '#3b82f6', end: '#60a5fa', glow: 'rgba(59, 130, 246, 0.5)' },
  Testing: { start: '#a78bfa', end: '#c4b5fd', glow: 'rgba(167, 139, 250, 0.5)' },
  POC: { start: '#fb923c', end: '#fdba74', glow: 'rgba(251, 146, 60, 0.5)' },
  Migration: { start: '#34d399', end: '#6ee7b7', glow: 'rgba(52, 211, 153, 0.5)' },
  Standardization: { start: '#22d3ee', end: '#67e8f9', glow: 'rgba(34, 211, 238, 0.5)' },
  Guidance: { start: '#facc15', end: '#fde047', glow: 'rgba(250, 204, 21, 0.5)' },
  Policy: { start: '#a8a29e', end: '#d6d3d1', glow: 'rgba(168, 162, 158, 0.5)' },
  Regulation: { start: '#ef4444', end: '#f87171', glow: 'rgba(239, 68, 68, 0.5)' },
  Research: { start: '#8b5cf6', end: '#a78bfa', glow: 'rgba(139, 92, 246, 0.5)' },
  Deadline: { start: '#ef4444', end: '#f87171', glow: 'rgba(239, 68, 68, 0.5)' },
}

import { MOCK_CSV_CONTENT } from './mockTimelineData'

// Helper to find the latest timeline CSV file
function getLatestTimelineContent(): string | null {
  // Check for mock data environment variable
  if (import.meta.env.VITE_MOCK_DATA === 'true') {
    console.log('Using mock timeline data for testing')
    return MOCK_CSV_CONTENT
  }

  // Use import.meta.glob to find all timeline CSV files
  const modules = import.meta.glob('./timeline_*.csv', { as: 'raw', eager: true })

  // Extract filenames and parse dates
  const files = Object.keys(modules)
    .map((path) => {
      // Path format: ./timeline_MMDDYYYY.csv
      const match = path.match(/timeline_(\d{2})(\d{2})(\d{4})\.csv$/)
      if (match) {
        const [, month, day, year] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return { path, date, content: modules[path] as string }
      }
      return null
    })
    .filter((f): f is { path: string; date: Date; content: string } => f !== null)

  if (files.length === 0) {
    console.warn('No dated timeline CSV files found.')
    return null
  }

  // Sort by date descending (latest first)
  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  console.log(`Loading latest timeline data from: ${files[0].path}`)
  return files[0].content
}

// Parse the CSV content to get the timeline data
let parsedData: CountryData[] = []
try {
  const csvContent = getLatestTimelineContent()
  if (csvContent) {
    parsedData = parseTimelineCSV(csvContent)
  } else {
    parsedData = []
  }
} catch (error) {
  console.error('Failed to parse timeline CSV:', error)
  // Fallback to empty array to prevent crash
  parsedData = []
}

export const timelineData: CountryData[] = parsedData

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

      phases.push({
        startYear,
        endYear,
        phase: phaseName,
        type: rowType,
        title: firstEvent.title,
        description: firstEvent.description,
        events: events,
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
