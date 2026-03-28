import fs from 'fs'

let content = fs.readFileSync('e2e/timeline.spec.ts', 'utf8')

// Fix 1: First fix "renders country flags as SVGs" test
// The lucide-flag check times out because the default selected phase type might be "Deadline" and there might be no flags?
// Actually, let's fix the strict mode violation in the country selector tests by scoping to desktop container.
content = content.replace(
  "const countryButton = page.getByRole('button').filter({ hasText: 'Country' })",
  "const countryButton = page.locator('div[data-testid=\"desktop-view-container\"]').getByRole('button').filter({ hasText: 'Country' })"
)

// Fix 2: "displays new DoD memorandum entry for US" needs to open the US country table to see the document.
content = content.replace(
  "await expect(page.getByText('United States').first()).toBeVisible({ timeout: 15000 })\n    \n    // Check for the new entry we added during the audit\n    await expect(page.getByText('DoD PQC Migration Memorandum').first()).toBeVisible()",
  "await expect(page.getByText('United States').first()).toBeVisible({ timeout: 15000 })\n    \n    // Select US to open the Document Table\n    const countryButton = page.locator('div[data-testid=\"desktop-view-container\"]').getByRole('button').filter({ hasText: 'Country' })\n    await countryButton.click()\n    await page.getByRole('listbox').waitFor({ state: 'visible' })\n    await page.getByRole('option', { name: 'United States' }).click()\n\n    // Check for the new entry we added during the audit\n    await expect(page.getByText('DoD PQC Migration Memorandum').first()).toBeVisible()"
)

fs.writeFileSync('e2e/timeline.spec.ts', content)
