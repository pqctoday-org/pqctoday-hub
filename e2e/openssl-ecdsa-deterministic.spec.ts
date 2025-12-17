import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - Deterministic ECDSA', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/openssl')
        await expect(page.getByRole('heading', { name: 'OpenSSL Studio' })).toBeVisible({ timeout: 20000 })
    })

    test('verifies deterministic ECDSA (RFC 6979)', async ({ page }) => {
        // 1. Generate P-256 Key
        await page.getByRole('button', { name: /Key Generation/ }).click()
        await expect(page.locator('#algo-select')).toBeVisible()
        await page.locator('#algo-select').selectOption('EC')
        await page.locator('#curve-select').selectOption('P-256')

        // Ensure keys are unique per run
        const keyName = `ec-p256-${Date.now()}.key`
        // We can't rename easily in UI, so we rely on default naming but clean up
        // Actually, just let it generate key.pem/pub.pem. 
        // To avoid conflict, we clear files first?
        await page.getByRole('button', { name: 'Clear All' }).click()

        await page.getByRole('button', { name: 'Generate Key' }).click()
        await expect(page.getByText('File generated: key.pem')).toBeVisible()

        // 2. Create Data File
        await page.getByRole('button', { name: 'Add File' }).click()
        const dataFile = 'data.txt'
        // Logic to add file: The UI has a hidden file input. 
        // Use simpler approach: Echo content to file via command? 
        // Or simpler: configutl? No.
        // Let's use the browser tool logic to input file, or just use what's available.
        // The test runner can execute `openssl rand -out data.txt 32` via UI.
        await page.getByRole('button', { name: 'Random' }).click()
        await page.getByLabel('Output File').fill('data.txt')
        await page.getByLabel('Number of Bytes').fill('32')
        await page.getByRole('button', { name: 'Generate Random' }).click()
        await expect(page.getByText('File generated: data.txt')).toBeVisible()

        // 3. Sign Twice
        await page.getByRole('button', { name: 'Digest / Sign' }).click()
        await page.getByRole('button', { name: 'Sign' }).click() // Select Sign mode
        await page.getByLabel('Private Key').selectOption('key.pem')
        await page.getByLabel('Data File').selectOption('data.txt')

        // Sig 1
        await page.getByLabel('Signature Output').fill('sig1.bin')
        await page.getByRole('button', { name: 'Sign', exact: true }).click()
        await expect(page.getByText('Signature generated: sig1.bin')).toBeVisible()

        // Sig 2
        await page.getByLabel('Signature Output').fill('sig2.bin')
        await page.getByRole('button', { name: 'Sign', exact: true }).click()
        await expect(page.getByText('Signature generated: sig2.bin')).toBeVisible()

        // 4. Compare Sig 1 and Sig 2
        // We can use `openssl dgst -sha256 sig1.bin` and `sig2.bin` and compare hashes output in terminal?
        // Or verify via JS in browser context?
        // Let's use `openssl dgst -sha256` on the signature files themselves to see their hash.

        await page.getByRole('button', { name: 'Digest / Sign' }).click()
        // Reset to digest mode
        await page.getByRole('button', { name: 'Digest' }).click()

        // Hash Sig 1
        await page.getByLabel('Input File').selectOption('sig1.bin')
        await page.getByLabel('Hash Algorithm').selectOption('SHA256')

        // We need to capture the output. The UI shows it in "Operation Log" or Terminal.
        // Let's trigger hash.
        await page.getByRole('button', { name: 'Compute Hash' }).click()

        // Get the last log entry or terminal output.
        // The output should be something like "SHA256(sig1.bin)= <hex>"
        // This is tricky to capture reliably from the terminal component in e2e without detailed selectors.
        // Alternative: Use `openssl cmp -cmd cmp -in1 sig1.bin -in2 sig2.bin`? OpenSSL doesn't have `cmp` command standardly exposed usually? `cmp` is not standard openssl command.

        // Better: Use `diff` via run_command? No, this is WASM.
        // Better: Use `openssl dgst` on both and manually check text content in the log.

        // Just verify they are identical by checking file manager file sizes? No, size doesn't prove content.

        // Let's just check if `openssl dgst -sha256 sig1.bin` output equals `openssl dgst -sha256 sig2.bin` output in the logs/terminal.

        // Implementation:
        // Run hash on sig1.bin
        await page.getByRole('button', { name: 'Compute Hash' }).click()
        const log1 = page.locator('.terminal-line').last()
        const text1 = await log1.innerText()

        // Run hash on sig2.bin
        await page.getByLabel('Input File').selectOption('sig2.bin')
        await page.getByRole('button', { name: 'Compute Hash' }).click()
        const log2 = page.locator('.terminal-line').last()
        const text2 = await log2.innerText()

        // Check if hashes are distinct? No, if deterministic, sig1 == sig2, so hash(sig1) == hash(sig2).
        // If they are DETerministic, they should be EQUAL.

        // Extract the hex part.
        const hash1 = text1.split('= ')[1]
        const hash2 = text2.split('= ')[1]

        expect(hash1).toBe(hash2)
    })
})
