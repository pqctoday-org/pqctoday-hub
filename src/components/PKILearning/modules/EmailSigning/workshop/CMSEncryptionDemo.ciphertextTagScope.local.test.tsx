// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CMSEncryptionDemo } from './CMSEncryptionDemo'
import { CMS_AUTH_ENVELOPED_DATA_STRUCTURE as tree } from '../data/emailSigningConstants'

describe('CMS AuthEnvelopedData ciphertext and tag teaching', () => {
  it('keeps ciphertext in the content-info child and mac as a separate envelope field', () => {
    const envelope = tree.children!.find((node) => node.label === 'AuthEnvelopedData')!
    const info = envelope.children!.find((node) => node.label === 'authEncryptedContentInfo')!
    expect(info.children!.find((node) => node.label === 'encryptedContent')!.value).toBe(
      '[Encrypted email bytes (ciphertext); authentication tag is in mac]'
    )
    expect(info.children!.some((node) => node.label === 'mac')).toBe(false)
    expect(envelope.children!.find((node) => node.label === 'mac')!.value).toBe(
      '[Explicit AES-GCM authentication tag, separate from encryptedContent]'
    )
  })

  it.each(['RSA Key Transport', 'ML-KEM (RFC 9629)'])(
    'shows separate fields and preserves keyboard expansion in %s mode',
    (mode) => {
      render(<CMSEncryptionDemo />)
      fireEvent.click(screen.getByRole('button', { name: mode }))
      const content = screen.getByRole('button', { name: 'authEncryptedContentInfo' })
      content.focus()
      fireEvent.keyDown(content, { key: 'Enter' })
      expect(
        screen.getByText(/Encrypted email bytes \(ciphertext\); authentication tag is in mac/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Explicit AES-GCM authentication tag, separate from encryptedContent/)
      ).toBeInTheDocument()
      expect(screen.getByText('(2.16.840.1.101.3.4.1.46)')).toBeInTheDocument()
      expect(screen.getByText(/recipient-specific structure/)).toBeInTheDocument()
      fireEvent.keyDown(content, { key: ' ' })
      expect(
        screen.queryByText(/Encrypted email bytes \(ciphertext\); authentication tag is in mac/)
      ).not.toBeInTheDocument()
      expect(
        screen.getByText(/Explicit AES-GCM authentication tag, separate from encryptedContent/)
      ).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: '4. CMS Wrap' }))
      expect(screen.getByRole('button', { name: 'ContentInfo' })).toHaveClass('bg-primary/10')
    }
  )
})
