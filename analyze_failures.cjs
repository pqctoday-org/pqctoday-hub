const fs = require('fs')

try {
  const content = fs.readFileSync('test-results.json', 'utf8')
  const report = JSON.parse(content)

  const failures = []

  function processSuite(suite) {
    if (suite.specs) {
      suite.specs.forEach((spec) => {
        spec.tests.forEach((test) => {
          if (test.status === 'unexpected' || test.status === 'flaky') {
            // Get error message if available
            const error = test.results[0]?.error?.message?.split('\n')[0] || 'Unknown error'
            failures.push({
              title: spec.title,
              project: test.projectName,
              file: spec.file,
              error: error,
            })
          }
        })
      })
    }

    if (suite.suites) {
      suite.suites.forEach(processSuite)
    }
  }

  processSuite(report)

  console.log(`Total Failures: ${failures.length}`)
  failures.forEach((f) => {
    console.log(`[${f.project}] ${f.title}`)
    console.log(`  Error: ${f.error}`)
  })
} catch (err) {
  console.error('Error parsing JSON:', err)
}
