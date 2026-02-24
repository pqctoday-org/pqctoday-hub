/* eslint-disable security/detect-object-injection */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QKDModule } from './index'

// Mock the module store
vi.mock('../../../../store/useModuleStore', () => ({
  useModuleStore: Object.assign(
    () => ({
      updateModuleProgress: vi.fn(),
      markStepComplete: vi.fn(),
      modules: {},
    }),
    {
      getState: () => ({
        modules: {},
      }),
    }
  ),
}))

// Mock crypto.subtle for PostProcessingDemo
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      importKey: vi.fn().mockResolvedValue({}),
      deriveBits: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
})

describe('QKDModule', () => {
  const renderModule = () =>
    render(
      <MemoryRouter>
        <QKDModule />
      </MemoryRouter>
    )

  it('renders the module title', () => {
    renderModule()
    expect(screen.getByText('Quantum Key Distribution')).toBeInTheDocument()
  })

  it('renders tab triggers', () => {
    renderModule()
    expect(screen.getByText('Learn')).toBeInTheDocument()
    expect(screen.getByText('Workshop')).toBeInTheDocument()
    expect(screen.getByText('Exercises')).toBeInTheDocument()
    expect(screen.getByText('References')).toBeInTheDocument()
  })

  it('shows Learn tab content by default', () => {
    renderModule()
    expect(screen.getByText('What is Quantum Key Distribution?')).toBeInTheDocument()
  })

  it('shows introduction sections', () => {
    renderModule()
    expect(screen.getByText('The BB84 Protocol')).toBeInTheDocument()
    expect(screen.getByText('State of the Art')).toBeInTheDocument()
    expect(screen.getByText('Satellite QKD')).toBeInTheDocument()
    expect(screen.getByText('Limitations & NIST Position')).toBeInTheDocument()
  })

  it('switches to Workshop tab on click', () => {
    renderModule()
    fireEvent.click(screen.getByText('Workshop'))
    expect(screen.getByText('Part 1: BB84 Protocol')).toBeInTheDocument()
  })

  it('switches to Exercises tab on click', () => {
    renderModule()
    fireEvent.click(screen.getByText('Exercises'))
    expect(screen.getByText('QKD Exercises')).toBeInTheDocument()
  })
})
