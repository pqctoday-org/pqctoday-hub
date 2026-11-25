// SPDX-License-Identifier: AGPL-3.0-only
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandLogo, FULL_LOGO_SRC } from './BrandLogo'

const ROOT = resolve(__dirname, '..', '..', '..')

/** Width and height from a PNG's IHDR chunk. */
function pngSize(rel: string): [number, number] {
  const b = readFileSync(resolve(ROOT, rel))
  expect(b.subarray(1, 4).toString('latin1'), `${rel} is a PNG`).toBe('PNG')
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

describe('BrandLogo', () => {
  it('shows the full logo with an accessible name on its own pale tile', () => {
    render(<BrandLogo variant="full" size={120} />)
    const img = screen.getByRole('img', { name: 'PQC Today' })
    expect(img.getAttribute('src')).toBe(FULL_LOGO_SRC)
    expect(img.parentElement?.className).toContain('bg-logo-tile')
    expect(img.parentElement?.className).toContain('rounded-xl')
  })

  it('a decorative emblem beside the words "PQC Today" is hidden from assistive technology', () => {
    render(<BrandLogo variant="emblem" decorative />)
    expect(screen.queryByRole('img')).toBeNull() // aria-hidden: not exposed
    expect(screen.queryByAltText('PQC Today')).toBeNull()
  })
})

describe('logo and icon files', () => {
  it('every icon the page, manifest and share card name exists at its declared size', () => {
    const sizes: Record<string, [number, number]> = {
      'public/favicon-16x16.png': [16, 16],
      'public/favicon-32x32.png': [32, 32],
      'public/favicon-light-32x32.png': [32, 32],
      'public/favicon-dark-32x32.png': [32, 32],
      'public/apple-touch-icon.png': [180, 180],
      'public/pwa-192x192.png': [192, 192],
      'public/pwa-512x512.png': [512, 512],
      'public/pwa-1024x1024.png': [1024, 1024],
      'public/pwa-maskable-192.png': [192, 192],
      'public/pwa-maskable-512.png': [512, 512],
      'public/og-image.png': [1200, 630],
      'public/brand/logo-full.png': [800, 800],
      'public/brand/emblem.png': [256, 256],
      'src/assets/brand-emblem.png': [256, 256],
    }
    for (const [file, want] of Object.entries(sizes)) expect(pngSize(file), file).toEqual(want)
  })

  it('index.html links only icons that exist, and none of the retired shield or dark-tile files', () => {
    const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8')
    const hrefs = [
      ...html.matchAll(/<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g),
    ].map((m) => m[1])
    expect(hrefs.length).toBeGreaterThanOrEqual(4)
    for (const h of hrefs)
      expect(existsSync(resolve(ROOT, 'public', h.replace(/^\//, ''))), h).toBe(true)
    expect(html).not.toContain('favicon.svg')
  })

  it('the retired logo files are gone and nothing in the source still names them', () => {
    for (const gone of [
      'public/favicon.svg',
      'public/og-image.svg',
      'src/assets/pqctoday-logo.png',
      'src/assets/PQCT_Logo_V01.png',
    ])
      expect(existsSync(resolve(ROOT, gone)), gone).toBe(false)
    for (const f of [
      'vite.config.ts',
      'src/seo/routeMeta.ts',
      'src/components/Simulation/SimulationView.tsx',
      'src/components/shared/ResumeSimBar.tsx',
    ]) {
      const src = readFileSync(resolve(ROOT, f), 'utf8')
      expect(src, f).not.toContain('favicon.svg')
      expect(src, f).not.toContain('pqctoday-logo.png')
    }
  })

  it('every manifest icon in vite.config.ts exists in public/', () => {
    const cfg = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf8')
    const srcs = [...cfg.matchAll(/\{\s*src:\s*'([^']+\.png)'/g)].map((m) => m[1])
    expect(srcs.length).toBeGreaterThanOrEqual(8)
    for (const s of srcs) expect(existsSync(resolve(ROOT, 'public', s)), s).toBe(true)
  })
})
