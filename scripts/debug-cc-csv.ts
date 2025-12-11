import { fetchText } from './scrapers/utils.js'
import Papa from 'papaparse'

const debugCC = async () => {
  const url = 'https://www.commoncriteriaportal.org/products/certified_products.csv'
  console.log(`Fetching ${url}...`)
  const csvText = await fetchText(url)

  Papa.parse(csvText, {
    header: true,
    preview: 1, // Get just the first row to see keys
    complete: (results) => {
      if (results.data.length > 0) {
        console.log('--- CSV Headers / First Row Keys ---')
        console.log(Object.keys(results.data[0]))
        console.log('--- Sample Row ---')
        console.log(results.data[0])
      } else {
        console.log('No data found.')
      }
    },
  })
}

debugCC()
