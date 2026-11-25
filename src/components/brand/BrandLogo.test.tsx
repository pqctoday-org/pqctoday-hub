// SPDX-License-Identifier: AGPL-3.0-only
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandLogo, FULL_LOGO_DARK_SRC, FULL_LOGO_SRC } from './BrandLogo'

const ROOT = resolve(__dirname, '..', '..', '..')

/** Width and height from a PNG's IHDR chunk. */
function pngSize(rel: string): [number, number] {
  const b = readFileSync(resolve(ROOT, rel))
  expect(b.subarray(1, 4).toString('latin1'), `${rel} is a PNG`).toBe('PNG')
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

describe('BrandLogo', () => {
  it('has one accessible name, on its own tile, and both pictures hidden from assistive technology', () => {
    render(<BrandLogo variant="full" size={120} />)
    const logo = screen.getByRole('img', { name: 'PQC Today' })
    expect(logo.className).toContain('bg-logo-tile')
    expect(logo.className).toContain('rounded-xl')
    expect(logo.querySelectorAll('img[aria-hidden="true"]')).toHaveLength(2) // eslint-disable-line testing-library/no-node-access
  })

  it('carries the light full logo for light mode and the dark full logo for dark mode', () => {
    render(<BrandLogo variant="full" />)
    const logo = screen.getByRole('img', { name: 'PQC Today' })
    const light = logo.querySelector('[data-theme-logo="light"]') // eslint-disable-line testing-library/no-node-access
    const dark = logo.querySelector('[data-theme-logo="dark"]') // eslint-disable-line testing-library/no-node-access
    expect(light?.getAttribute('src')).toBe(FULL_LOGO_SRC)
    expect(dark?.getAttribute('src')).toBe(FULL_LOGO_DARK_SRC)
    expect(light?.className).toContain('brand-logo-light')
    expect(dark?.className).toContain('brand-logo-dark')
  })

  it('has different light and dark emblems', () => {
    render(<BrandLogo variant="emblem" />)
    const logo = screen.getByRole('img', { name: 'PQC Today' })
    const light = logo.querySelector('[data-theme-logo="light"]')?.getAttribute('src') // eslint-disable-line testing-library/no-node-access
    const dark = logo.querySelector('[data-theme-logo="dark"]')?.getAttribute('src') // eslint-disable-line testing-library/no-node-access
    expect(light).toBeTruthy()
    expect(dark).toBeTruthy()
    expect(light).not.toBe(dark)
  })

  it('a decorative emblem beside the words "PQC Today" is hidden from assistive technology', () => {
    render(<BrandLogo variant="emblem" decorative />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})

describe('theme switching rules in index.css', () => {
  const css = readFileSync(resolve(ROOT, 'src/styles/index.css'), 'utf8')

  it('shows the light logo by default and swaps to the dark logo under the .dark class (not only the device setting)', () => {
    expect(css).toMatch(/\.brand-logo-dark\s*\{\s*display:\s*none/)
    expect(css).toMatch(/\.dark \.brand-logo-light\s*\{\s*display:\s*none/)
    expect(css).toMatch(/\.dark \.brand-logo-dark\s*\{\s*display:\s*block/)
    expect(css).not.toMatch(/prefers-color-scheme[^{]*\{[^}]*brand-logo/)
  })

  it('gives dark mode its own navy tile instead of the pale one', () => {
    const dark = css.slice(css.indexOf('\n  .dark {'))
    expect(dark).toMatch(/--logo-tile:\s*222 74% 10\.6%/)
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
      'public/brand/logo-full-dark.png': [640, 640],
      'public/brand/emblem.png': [256, 256],
      'public/brand/emblem-dark.png': [256, 256],
      'src/assets/brand-emblem.png': [256, 256],
      'src/assets/brand-emblem-dark.png': [256, 256],
    }
    for (const [file, want] of Object.entries(sizes)) expect(pngSize(file), file).toEqual(want)
  })

  it('index.html links only icons that exist, and none of the retired shield or old tile files', () => {
    const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8')
    const hrefs = [
      ...html.matchAll(/<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]*href="([^"]+)"/g),
    ].map((m) => m[1])
    expect(hrefs.length).toBeGreaterThanOrEqual(4)
    for (const h of hrefs)
      expect(existsSync(resolve(ROOT, 'public', h.replace(/^\//, ''))), h).toBe(true)
    expect(html).not.toContain('favicon.svg')
    expect(html).toMatch(/favicon-dark-32x32\.png"\s+media="\(prefers-color-scheme: dark\)"/)
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
