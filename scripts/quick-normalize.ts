import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { normalizeAlgorithmList } from './scrapers/utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_PATH = path.join(__dirname, '../public/data/compliance-data.json')

const main = () => {
  console.log('Loading data from', DATA_PATH)
  if (!fs.existsSync(DATA_PATH)) {
    console.error('Data file not found!')
    process.exit(1)
  }

  const raw = fs.readFileSync(DATA_PATH, 'utf-8')
  const data = JSON.parse(raw)

  console.log(`Normalizing ${data.length} records...`)

  let changedCount = 0

  const normalized = data.map(
    (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      record: any
    ) => {
      const originalPqc = record.pqcCoverage

      // Normalize string fields
      const newPqc = normalizeAlgorithmList(originalPqc)

      // Check if changed
      if (JSON.stringify(originalPqc) !== JSON.stringify(newPqc)) {
        changedCount++
      }

      return {
        ...record,
        pqcCoverage: newPqc,
        classicalAlgorithms:
          typeof record.classicalAlgorithms === 'string'
            ? normalizeAlgorithmList(record.classicalAlgorithms)
            : record.classicalAlgorithms,
      }
    }
  )

  console.log(`Updated ${changedCount} records with normalized PQC strings.`)

  fs.writeFileSync(DATA_PATH, JSON.stringify(normalized, null, 2))
  console.log('Done! Saved to', DATA_PATH)
}

main()
