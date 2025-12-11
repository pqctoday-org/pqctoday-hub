import { JSDOM } from 'jsdom'

const fetchText = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

const main = async () => {
  try {
    console.log('Testing different ACVP search strategies...\n')

    // Test 1: Just ML-KEM
    console.log('=== Test 1: ML-KEM only (179, 180) ===')
    let url =
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&algorithm=179&algorithm=180&ipp=10000'
    let html = await fetchText(url)
    let dom = new JSDOM(html)
    let rows = Array.from(dom.window.document.querySelectorAll('tr')).filter(
      (r) => r.querySelectorAll('td').length >= 4
    )
    console.log(`Found ${rows.length} rows`)

    // Test 2: Just ML-DSA
    console.log('\n=== Test 2: ML-DSA only (176, 177, 178) ===')
    url =
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&algorithm=176&algorithm=177&algorithm=178&ipp=10000'
    html = await fetchText(url)
    dom = new JSDOM(html)
    rows = Array.from(dom.window.document.querySelectorAll('tr')).filter(
      (r) => r.querySelectorAll('td').length >= 4
    )
    console.log(`Found ${rows.length} rows`)

    // Test 3: Just LMS
    console.log('\n=== Test 3: LMS only (173, 174, 175) ===')
    url =
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&algorithm=173&algorithm=174&algorithm=175&ipp=10000'
    html = await fetchText(url)
    dom = new JSDOM(html)
    rows = Array.from(dom.window.document.querySelectorAll('tr')).filter(
      (r) => r.querySelectorAll('td').length >= 4
    )
    console.log(`Found ${rows.length} rows`)

    // Test 4: No algorithm filter (all implementations)
    console.log('\n=== Test 4: No algorithm filter ===')
    url =
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&ipp=100'
    html = await fetchText(url)
    dom = new JSDOM(html)
    rows = Array.from(dom.window.document.querySelectorAll('tr')).filter(
      (r) => r.querySelectorAll('td').length >= 4
    )
    console.log(`Found ${rows.length} rows`)
    if (rows.length > 0) {
      const vendors = rows.slice(0, 5).map((r) => r.querySelectorAll('td')[0]?.textContent?.trim())
      console.log('First 5 vendors:', vendors)
    }
  } catch (e) {
    console.error(e)
  }
}

main()
