export type Phase =
  | 'Discovery'
  | 'Testing'
  | 'POC'
  | 'Migration'
  | 'Standardization'
  | 'Guidance'
  | 'Policy'
  | 'Regulation'
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
  // Denormalized fields for easier access
  orgName?: string
  orgFullName?: string
  orgLogoUrl?: string
  countryName?: string
  flagCode?: string
}

export interface RegulatoryBody {
  name: string
  fullName: string
  logoUrl?: string
  countryCode: string
  events: TimelineEvent[]
}

export interface CountryData {
  countryName: string
  flagCode: string
  bodies: RegulatoryBody[]
}

export interface TimelinePhase {
  startYear: number
  endYear: number
  phase: Phase
  type: EventType
  title: string
  description: string
  events: TimelineEvent[]
}

export interface GanttCountryData {
  country: CountryData
  phases: TimelinePhase[]
}
