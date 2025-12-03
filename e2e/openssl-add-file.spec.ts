import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - Add File', () => {
  test('should allow uploading a file to the VFS', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'OpenSSL Studio' }).click()
    await expect(page.getByRole('heading', { name: 'OpenSSL Studio', level: 2 })).toBeVisible()

    // Navigate to File Manager (Files tab)
    await page.getByRole('button', { name: 'Key Files', exact: true }).click()

    // Create a dummy file to upload
    const fileContent = 'This is a test file content for upload.'
    const fileName = 'upload-test.txt'
    const fileBuffer = Buffer.from(fileContent)

    // Trigger file upload
    // Note: The input is hidden, so we need to handle it carefully
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: fileBuffer,
    })

    // Verify file appears in the list
    await expect(page.getByRole('cell', { name: fileName, exact: true })).toBeVisible()

    // Verify log message
    await page.getByRole('button', { name: 'Operation Logs' }).click()
    await expect(page.getByText(new RegExp(`Uploaded file: ${fileName}`))).toBeVisible()
  })
})
