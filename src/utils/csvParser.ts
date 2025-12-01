import type { CountryData, Phase, TimelineEvent, EventType } from '../types/timeline'

export function parseTimelineCSV(csvContent: string): CountryData[] {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.trim())

  // Helper to parse CSV line respecting quotes
  const parseLine = (line: string): string[] => {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const dataRows = lines.slice(1).map(parseLine)
  const countriesMap = new Map<string, CountryData>()

  dataRows.forEach((row) => {
    if (row.length < headers.length) return

    // Expected Headers: Country,FlagCode,OrgName,OrgFullName,OrgLogoUrl,Type,Category,StartYear,EndYear,Title,Description,SourceUrl,SourceDate,Status
    const [
      countryName,
      flagCode,
      orgName,
      orgFullName,
      orgLogoUrl,
      typeStr,
      category,
      startYearStr,
      endYearStr,
      title,
      description,
      sourceUrl,
      sourceDate,
      status,
    ] = row

    // Special handling for CNSA (NSA) to create a separate lane
    let effectiveCountryName = countryName
    if (countryName === 'United States' && orgName === 'NSA') {
      effectiveCountryName = 'United States (CNSA)'
    }

    // Ensure country exists
    if (!countriesMap.has(effectiveCountryName)) {
      countriesMap.set(effectiveCountryName, {
        countryName: effectiveCountryName,
        flagCode,
        bodies: [],
      })
    }

    const country = countriesMap.get(effectiveCountryName)!

    // Ensure body exists
    let body = country.bodies.find((b) => b.name === orgName)
    if (!body) {
      body = {
        name: orgName,
        fullName: orgFullName,
        logoUrl: orgLogoUrl,
        countryCode: flagCode,
        events: [],
      }
      country.bodies.push(body)
    }

    // Create event
    const event: TimelineEvent = {
      startYear: parseInt(startYearStr, 10),
      endYear: parseInt(endYearStr, 10),
      phase: category as Phase,
      type: (typeStr as EventType) || 'Phase',
      title: title.replace(/^"|"$/g, ''),
      description: description.replace(/^"|"$/g, ''),
      sourceUrl,
      sourceDate,
      status: status?.trim(),
      // Populate denormalized fields
      orgName,
      orgFullName,
      orgLogoUrl,
      countryName: effectiveCountryName,
      flagCode,
    }

    body.events.push(event)
  })

  return Array.from(countriesMap.values())
}
