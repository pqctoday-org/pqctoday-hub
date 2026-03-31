const fs = require('fs')
const path = require('path')

const dir = 'src/components/About/sections'
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.tsx'))

for (let file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8')

  // Remove unused state declarations conditionally
  const hooks = [
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

  for (let hook of hooks) {
    // If the hook is only used ONCE in the file (meaning it's the declaration), delete its declaration line
    const regex = new RegExp(hook, 'g')
    const matches = content.match(regex)
    if (matches && matches.length === 1) {
      const lineRegex = new RegExp(`.*${hook}.*\\n`, 'g')
      content = content.replace(lineRegex, '')
    }
    // Also check setter
    const setter = 'set' + hook.charAt(0).toUpperCase() + hook.slice(1)
    const setterRegex = new RegExp(setter, 'g')
    const setterMatches = content.match(setterRegex)
    if (setterMatches && setterMatches.length === 0) {
      // already removed if hook is only 1 match. But what if it's 2 matches but still unused?
    }
  }

  // Same for version and theme
  if ((content.match(/version/g) || []).length === 1) {
    content = content.replace(/.*version = getCurrentVersion.*\n/, '')
  }
  if ((content.match(/theme/g) || []).length === 1) {
    content = content.replace(/.*theme, setTheme.*\n/, '')
  }
  if ((content.match(/requestShowWhatsNew/g) || []).length === 1) {
    content = content.replace(/.*requestShowWhatsNew.*\n/, '')
  }

  fs.writeFileSync(path.join(dir, file), content)
}
console.log('Cleaned unused hooks')
