import { JSDOM } from 'jsdom'

const fetchText = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

const main = async () => {
  try {
    console.log('Fetching ACVP Search Page to determine count...')
    // IDs: 173-180
    const algoParams = [173, 174, 175, 176, 177, 178, 179, 180]
      .map((id) => `algorithm=${id}`)
      .join('&')
    // Try with a small ipp first to parse the "Total" count from HTML
    const url = `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&${algoParams}&ipp=10`

    const html = await fetchText(url)
    const dom = new JSDOM(html)
    const doc = dom.window.document

    // Look for "Showing X to Y of Z results" or similar text
    // Usually in a span or div with specific class
    const bodyText = doc.body.textContent || ''

    // Regex to find "of X results" or "Total: X"
    // Typical string: "Showing 1 to 10 of 1234 entries" or "1234 results found"
    const match = bodyText.match(/of\s+([\d,]+)\s+/)

    if (match) {
      console.log(`Total Records Detected: ${match[1]}`)
    } else {
      console.log('Could not determine total count from text regex. Dumping typical locations:')
      const pageInfo = doc.querySelector('.dataTables_info')?.textContent
      console.log('dataTables_info:', pageInfo)

      const pagination = doc.querySelector('.pagination')?.textContent
      console.log('pagination:', pagination)

      const resultCount = doc.querySelector('#resultCount')?.textContent // Guess
      console.log('#resultCount:', resultCount)
    }
  } catch (e) {
    console.error(e)
  }
}

main()
