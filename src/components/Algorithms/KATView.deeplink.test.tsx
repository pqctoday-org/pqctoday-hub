// SPDX-License-Identifier: GPL-3.0-only
/** `?kat=` — the SLH-DSA KAT variant on the Validation tab. */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { KATView } from './KATView'
import { DEFAULT_SLH_DSA_VARIANT, SLH_DSA_VARIANTS, toSlhDsaVariant } from './katTileConfig'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: false,
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    slotRef: { current: 0 },
    initialize: vi.fn(),
    log: [],
    clearLog: vi.fn(),
    keys: [],
    removeKey: vi.fn(),
    clearKeys: vi.fn(),
  }),
}))

/** The SLH-DSA dropdown trigger, named by the variant it shows. */
const variantTrigger = (value: string) => {
  const v = SLH_DSA_VARIANTS.find((x) => x.value === value)!
  return screen.getByRole('button', { name: `SLH-DSA-${v.label} (Level ${v.level})` })
}

describe('toSlhDsaVariant', () => {
  it.each(SLH_DSA_VARIANTS.map((v) => v.value))('%s round-trips', (v) => {
    expect(toSlhDsaVariant(v)).toBe(v)
  })

  it('is case-insensitive', () => {
    expect(toSlhDsaVariant('shake-256f')).toBe('SHAKE-256f')
  })

  it('falls back to the default for empty or unknown values', () => {
    expect(toSlhDsaVariant(null)).toBe(DEFAULT_SLH_DSA_VARIANT)
    expect(toSlhDsaVariant('All')).toBe(DEFAULT_SLH_DSA_VARIANT)
    expect(toSlhDsaVariant('SHA3-999x')).toBe(DEFAULT_SLH_DSA_VARIANT)
  })
})

describe('KATView — ?kat deep link', () => {
  it('?kat=SHAKE-256f preselects that SLH-DSA variant', () => {
    render(<KATView katParam="SHAKE-256f" />)
    expect(variantTrigger('SHAKE-256f')).toBeInTheDocument()
    expect(screen.getByTestId('kat-slhdsa-tile')).toHaveTextContent('Level 5')
  })

  it('re-reads ?kat on same-route change', () => {
    const { rerender } = render(<KATView katParam="SHA2-192f" />)
    expect(variantTrigger('SHA2-192f')).toBeInTheDocument()
    rerender(<KATView katParam={null} />)
    expect(variantTrigger('SHA2-128s')).toBeInTheDocument()
  })

  it('an unknown ?kat falls back to the default variant without a notice', () => {
    render(<KATView katParam="SHA3-999x" />)
    expect(variantTrigger('SHA2-128s')).toBeInTheDocument()
    expect(screen.queryByTestId('deeplink-notice-not-found')).not.toBeInTheDocument()
  })

  it('picking a variant writes ?kat (the default clears it)', async () => {
    const user = userEvent.setup()
    const onUpdateParams = vi.fn()
    render(<KATView onUpdateParams={onUpdateParams} />)
    await user.click(variantTrigger('SHA2-128s'))
    await user.click(await screen.findByRole('option', { name: 'SLH-DSA-SHAKE-192s (Level 3)' }))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ kat: 'SHAKE-192s' })
    expect(variantTrigger('SHAKE-192s')).toBeInTheDocument()
    await user.click(variantTrigger('SHAKE-192s'))
    await user.click(await screen.findByRole('option', { name: 'SLH-DSA-SHA2-128s (Level 1)' }))
    expect(onUpdateParams).toHaveBeenLastCalledWith({ kat: null })
  })
})
