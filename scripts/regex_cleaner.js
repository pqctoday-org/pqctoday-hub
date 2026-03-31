const fs = require('fs')
const path = require('path')
const dir = 'src/components/About/sections'
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.startsWith('temp_'))

for (let file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8')
  let lines = content.split('\n')

  const stateVars = [
    'theme',
    'setTheme',
    'version',
    'requestShowWhatsNew',
    'isJourneyModalOpen',
    'selectedWorkgroup',
    'isShowAllDiscussions',
    'isMissionOpen',
    'isWorkgroupsOpen',
    'isSbomOpen',
    'isCryptoBuffSitesOpen',
    'isCryptoBuffBooksOpen',
    'isDataPrivacyOpen',
    'isPqcAssistantOpen',
  ]

  let newLines = []
  for (let line of lines) {
    let keep = true
    if (
      line.includes('const [') ||
      line.includes('const {') ||
      line.includes('const version') ||
      line.includes('const requestShow WhatsNew')
    ) {
      for (let sv of stateVars) {
        if (line.includes(sv)) {
          // check if it's used elsewhere in 'content' (more than 1 match)
          const m = content.match(new RegExp('\\b' + sv + '\\b', 'g'))
          if (m && m.length === 1) {
            keep = false // delete declaration
          }
        }
      }
    }
    if (keep) newLines.push(line)
  }
  fs.writeFileSync(path.join(dir, file), newLines.join('\n'))
}
console.log('Done regex cleanup')
