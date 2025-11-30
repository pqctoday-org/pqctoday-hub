import { parseTimelineCSV } from './src/utils/csvParser'
import fs from 'fs'
import path from 'path'

const csvPath = path.resolve('./src/data/timeline_11302025.csv')
const csvContent = fs.readFileSync(csvPath, 'utf-8')

try {
  const data = parseTimelineCSV(csvContent)
  console.log('Successfully parsed CSV.')
  console.log('Number of countries:', data.length)
  if (data.length > 0) {
    console.log('First country:', data[0].countryName)
    console.log('First event:', data[0].bodies[0].events[0])
  }
} catch (error) {
  console.error('Parsing failed:', error)
}
