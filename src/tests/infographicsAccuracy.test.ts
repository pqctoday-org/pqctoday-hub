// SPDX-License-Identifier: AGPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { INFOGRAPHIC_SAMPLE_ASSUMPTIONS } from '@/components/PKILearning/common/CuriousSummaryBanner'

const ROOT_DIR = path.resolve(__dirname, '../..')
const INFOGRAPHICS_DIR = path.join(ROOT_DIR, 'public/images/infographics')
const MODULES_DIR = path.join(ROOT_DIR, 'src/components/PKILearning/modules')

const INFOGRAPHIC_TARGET_MODULES = [
  'pki-enrollment-protocols',
  'tls-basics',
  'iot-pqc',
  'ot-pqc',
  'hsm-pqc',
  'migration-program',
  'emv-payment-pqc',
  'network-security-pqc',
  'pqc-testing-validation',
  'crypto-dev-apis',
  'pqc-hw-acceleration',
] as const

function readImageDimensions(buf: Buffer): { width: number; height: number } {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xff) {
        offset++
        continue
      }
      const marker = buf[offset + 1]
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          width: buf.readUInt16BE(offset + 7),
          height: buf.readUInt16BE(offset + 5),
        }
      }
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2
      } else {
        offset += 2 + buf.readUInt16BE(offset + 2)
      }
    }
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff])

describe('Static infographics & visual summary accuracy gate', () => {
  const nonQuizCatalogIds = Object.keys(MODULE_CATALOG).filter((id) => id !== 'quiz')

  it('has one manifest per catalog module (including quiz)', () => {
    expect(nonQuizCatalogIds.length).toBeGreaterThan(0)
    expect(MANIFESTS.length).toBe(Object.keys(MODULE_CATALOG).length)
  })

  it('verifies every non-quiz catalog module has a valid image infographic in public/images/infographics/', () => {
    for (const moduleId of nonQuizCatalogIds) {
      const filePath = path.join(INFOGRAPHICS_DIR, `pqcstd_${moduleId}.png`)
      expect(fs.existsSync(filePath), `Missing infographic for ${moduleId}: ${filePath}`).toBe(true)
      const stat = fs.statSync(filePath)
      expect(stat.size, `Empty infographic file for ${moduleId}`).toBeGreaterThan(10_000)

      const fd = fs.openSync(filePath, 'r')
      const header = Buffer.alloc(16)
      fs.readSync(fd, header, 0, 16, 0)
      fs.closeSync(fd)

      const isValidImageHeader =
        header.subarray(0, 8).equals(PNG_MAGIC) || header.subarray(0, 3).equals(JPEG_MAGIC)
      expect(isValidImageHeader, `Invalid image header for ${moduleId}`).toBe(true)
    }
  })

  it('gives each target module a high-DPI infographic and a sample-assumptions note', () => {
    for (const moduleId of INFOGRAPHIC_TARGET_MODULES) {
      const filePath = path.join(INFOGRAPHICS_DIR, `pqcstd_${moduleId}.png`)
      expect(fs.existsSync(filePath)).toBe(true)
      const buf = fs.readFileSync(filePath)
      const { width, height } = readImageDimensions(buf)
      expect(width, `${moduleId} width (${width}) should be >= 800px`).toBeGreaterThanOrEqual(800)
      expect(height, `${moduleId} height (${height}) should be >= 400px`).toBeGreaterThanOrEqual(
        400
      )
      const assumption = INFOGRAPHIC_SAMPLE_ASSUMPTIONS[moduleId]
      expect(assumption, `Missing INFOGRAPHIC_SAMPLE_ASSUMPTIONS for ${moduleId}`).toBeDefined()
      expect(assumption.title.length).toBeGreaterThan(5)
      expect(assumption.assumptions.length).toBeGreaterThan(20)
    }
  })

  it('verifies every module directory has a non-empty curious-summary.md with structured headings', () => {
    const dirs = fs
      .readdirSync(MODULES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'Quiz')
      .map((d) => d.name)

    expect(dirs.length).toBeGreaterThanOrEqual(75)

    for (const dir of dirs) {
      const summaryPath = path.join(MODULES_DIR, dir, 'curious-summary.md')
      expect(fs.existsSync(summaryPath), `Missing curious-summary.md in ${dir}`).toBe(true)
      const text = fs.readFileSync(summaryPath, 'utf8').trim()
      expect(text.length, `Empty curious-summary.md in ${dir}`).toBeGreaterThan(100)
      expect(
        /^#{1,3}\s+\S+/m.test(text),
        `curious-summary.md in ${dir} must include markdown section headings`
      ).toBe(true)
    }
  })
})
