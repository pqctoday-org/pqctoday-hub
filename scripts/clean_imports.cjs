const fs = require('fs')
const path = require('path')

const dir = 'src/components/About/sections'
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.tsx'))

for (let file of files) {
  let content = fs.readFileSync(path.join(dir, file), 'utf8')

  // The linter complained about these being unused:
  // import type { Workgroup } from '../workgroupData'
  // import { useTheme } from '@/hooks/useTheme'
  // import { useState } from 'react'

  content = content.replace(/import type \{ Workgroup \} from '\.\.\/workgroupData'\n/g, '')
  content = content.replace(/import \{ useTheme \} from '@\/hooks\/useTheme'\n/g, '')
  content = content.replace(/import \{ useState \} from 'react'\n/g, '')

  fs.writeFileSync(path.join(dir, file), content)
}
console.log('Cleaned up remaining unused imports')
