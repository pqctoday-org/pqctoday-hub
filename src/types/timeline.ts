export type Phase =
  | 'Discovery'
  | 'Testing'
  | 'POC'
  | 'Migration'
  | 'Standardization'
  | 'Guidance'
  | 'Policy'
  | 'Regulation'
  | 'Research'
  | 'Deadline'

export type EventType = 'Phase' | 'Milestone'

export interface TimelineEvent {
  startYear: number
  endYear: number
  phase: Phase
  type: EventType
  title: string
  description: string
  sourceUrl?: string
  sourceDate?: string
  status?: string // e.g. "Completed", "In Progress", "New", "Updated"

  // Denormalized fields for convenient access
  orgName: string
  orgFullName: string
  orgLogoUrl?: string
  countryName: string
  flagCode: string
}

export interface TimelinePhase {
  startYear: number
  endYear: number
  phase: string
  type: EventType
  title: string
  description: string
  events: TimelineEvent[]
  status?: 'New' | 'Updated'
}

export interface RegulatoryBody {
  name: string
  fullName: string
  logoUrl?: string
  countryCode: string
  events: TimelineEvent[]
  status?: 'New' | 'Updated'
}

export interface CountryData {
  countryName: string
  flagCode: string
  bodies: RegulatoryBody[]
  status?: 'New' | 'Updated'
}

export interface GanttCountryData {
  country: CountryData
  phases: TimelinePhase[]
}
