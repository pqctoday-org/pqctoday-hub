// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the Button primitive (M8). Button is imported by ~32 page areas, so
 * its variant/size class mapping, ref forwarding, and prop pass-through are
 * high-blast-radius behaviours worth pinning.
 */
import { createRef } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders a <button> with its children', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: 'Click me' })
    expect(btn.tagName).toBe('BUTTON')
  })

  it('applies the default variant + size classes', () => {
    render(<Button>Default</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-primary')
    expect(btn.className).toContain('h-10')
  })

  it.each([
    ['destructive', 'bg-destructive'],
    ['outline', 'border-border'],
    ['secondary', 'bg-secondary'],
    ['ghost', 'hover:bg-muted/20'],
    ['link', 'underline-offset-4'],
  ] as const)('variant=%s applies its distinguishing class', (variant, token) => {
    render(<Button variant={variant}>v</Button>)
    expect(screen.getByRole('button').className).toContain(token)
  })

  it.each([
    ['sm', 'px-3'],
    ['lg', 'px-8'],
    ['icon', 'w-11'],
  ] as const)('size=%s applies its sizing class', (size, token) => {
    render(<Button size={size}>s</Button>)
    expect(screen.getByRole('button').className).toContain(token)
  })

  it('merges a custom className alongside the variant classes', () => {
    render(<Button className="custom-x">x</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('custom-x')
    expect(btn.className).toContain('bg-primary')
  })

  it('forwards the ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>r</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('fires onClick and passes through native button props', () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} type="submit" aria-label="save">
        s
      </Button>
    )
    const btn = screen.getByRole('button', { name: 'save' })
    expect(btn).toHaveAttribute('type', 'submit')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        d
      </Button>
    )
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })
})
