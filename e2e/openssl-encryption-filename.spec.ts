import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - Encryption Filename', () => {
    test('should auto-set output filename and add to VFS', async ({ page }) => {
        await page.goto('/')
        await page.getByRole('button', { name: 'OpenSSL Studio' }).click()
        await expect(page.getByRole('heading', { name: 'OpenSSL Studio', level: 2 })).toBeVisible()

        // 1. Upload a dummy file
        const fileContent = 'This is a test file content for encryption.'
        const fileName = 'encrypt-test.txt'
        const fileBuffer = Buffer.from(fileContent)

        // Navigate to File Manager (Key Files tab)
        await page.getByRole('button', { name: 'Key Files', exact: true }).click()

        // Trigger file upload
        const fileInput = page.locator('input[type="file"]').first()
        await fileInput.setInputFiles({
            name: fileName,
            mimeType: 'text/plain',
            buffer: fileBuffer,
        })

        // Verify file uploaded
        await expect(page.getByRole('cell', { name: fileName, exact: true })).toBeVisible()

        // 2. Go to Encryption
        await page.getByRole('button', { name: 'Encryption' }).click()

        // 3. Select the file as input
        await page.getByLabel('Input File').selectOption(fileName)

        // 4. Verify output filename is set to <filename>.enc
        // Note: The command preview should update
        const expectedOutFile = `${fileName}.enc`
        await expect(page.locator('code')).toContainText(`-out ${expectedOutFile}`)

        // 5. Run Encryption
        await page.getByLabel('Passphrase').fill('password')
        await page.getByRole('button', { name: 'Run Command' }).click()

        // 6. Verify .enc file is created
        // Note: File creation logs are in the Terminal Output (default tab)
        // await expect(page.locator('.text-blue-300').getByText(new RegExp(`File created:.*${expectedOutFile}`))).toBeVisible()

        // 7. Verify .enc file is in Key Files list
        await page.getByRole('button', { name: 'Key Files' }).click()
        await expect(page.getByRole('cell', { name: expectedOutFile, exact: true })).toBeVisible()

        // 8. Go back to Encryption and select Decrypt
        await page.getByRole('button', { name: 'Encryption' }).click()
        await page.getByRole('button', { name: 'Decrypt' }).click()

        // 9. Select .enc file as input
        await page.getByLabel('Input File').selectOption(expectedOutFile)

        // 10. Verify output filename defaults to original name (without .enc)
        await expect(page.locator('code')).toContainText(`-out ${fileName}`)
    })
})
