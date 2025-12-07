import { describe, it, expect } from 'vitest'
import { parseTimelineCSV } from './csvParser'

const validCSV = `Country,FlagCode,OrgName,OrgFullName,OrgLogoUrl,Type,Category,StartYear,EndYear,Title,Description,SourceUrl,SourceDate,Status
United States,us,NIST,National Institute of Standards and Technology,,Event,Standardization,2016,2024,Call for Proposals,Description text...,http://example.com,2016-01-01,Completed
Canada,ca,Gov,Government of Canada,,Analysis,Research,2020,2021,Report Released,Analysis of PQC...,http://canada.ca,2020-05-01,Ongoing`

const quotedCSV = `Country,FlagCode,OrgName,OrgFullName,OrgLogoUrl,Type,Category,StartYear,EndYear,Title,Description,SourceUrl,SourceDate,Status
United States,us,NIST,NIST,,Event,Standardization,2022,2023,"Complex, Title with Comma","Description with ""quotes"" inside",http://example.com,2022-01-01,In Progress`

describe('csvParser', () => {
  it('parses valid CSV correctly', () => {
    const result = parseTimelineCSV(validCSV)
    expect(result).toHaveLength(2)

    const us = result.find((c) => c.countryName === 'United States')
    expect(us).toBeDefined()
    expect(us?.bodies).toHaveLength(1)
    expect(us?.bodies[0].events).toHaveLength(1)
    expect(us?.bodies[0].events[0].title).toBe('Call for Proposals')

    const ca = result.find((c) => c.countryName === 'Canada')
    expect(ca).toBeDefined()
  })

  it('handles quoted fields with commas', () => {
    const result = parseTimelineCSV(quotedCSV)
    expect(result).toHaveLength(1)

    const event = result[0].bodies[0].events[0]
    expect(event.title).toBe('Complex, Title with Comma')
    // Note: The parser logic for inner quotes might need verification,
    // current impl just keeps chars but handles delimiters
    expect(event.description).toContain('Description with "quotes" inside')
  })

  it('handles empty input gracefully', () => {
    const result = parseTimelineCSV('')
    expect(result).toHaveLength(0)
    // Or it might return empty array if split behaves distinctively
  })

  it('handles special CNSA lane for United States', () => {
    const csv = `Country,FlagCode,OrgName,OrgFullName,OrgLogoUrl,Type,Category,StartYear,EndYear,Title,Description,SourceUrl,SourceDate,Status
United States,us,NSA,National Security Agency,,Event,Regulation,2020,2021,CNSA 2.0,Desc...,url,date,status`

    const result = parseTimelineCSV(csv)
    const cnsa = result.find((c) => c.countryName === 'United States (CNSA)')
    expect(cnsa).toBeDefined()
    expect(cnsa?.bodies[0].name).toBe('NSA')
  })
})
