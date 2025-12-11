import { JSDOM } from 'jsdom'

const fetchText = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

const main = async () => {
  try {
    console.log('Fetching ACVP Search Page...')
    const html = await fetchText(
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search'
    )
    const dom = new JSDOM(html)
    const doc = dom.window.document

    // Find the algorithm select/dropdown
    // Inspecting typical NIST pages, it might be a Select2 or standard select
    // Let's look for known algos like AES or ML-KEM to find the container
    const allOptions = Array.from(doc.querySelectorAll('option'))

    console.log(`Found ${allOptions.length} options. Filtering for crypto names...`)

    const relevant = allOptions
      .filter((opt) => {
        const text = opt.textContent?.toLowerCase() || ''
        return (
          text.includes('ml-') ||
          text.includes('kyber') ||
          text.includes('dilithium') ||
          text.includes('lms') ||
          text.includes('xmss') ||
          text.includes('sphincs') ||
          text.includes('falcon') ||
          text.includes('shake') ||
          text.includes('stateful')
        )
      })
      .map((opt) => ({
        value: opt.getAttribute('value'),
        text: opt.textContent?.trim(),
      }))

    console.log('Relevant Algorithm IDs:')
    console.table(relevant)
  } catch (e) {
    console.error(e)
  }
}

main()
