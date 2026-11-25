// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import {
  ask,
  answerOf,
  openDrawer,
  seedHub,
  trackForeignRequests,
} from './fixtures/assistantDrawer'

/**
 * The Assistant answers from the Hub's own records, on the device. With every request to another
 * host refused, a supported question still gets its answer with the Hub's own sources and links, a
 * follow-up gets its own answer, and a question the records do not cover says so in plain words
 * instead of inventing one. No language model and no model provider are involved at any step.
 */
test.describe('Assistant answers from the Hub records, with no network beyond the Hub', () => {
  test.setTimeout(60_000)

  test('answers a supported question with a source and a link, and is honest about one it cannot answer', async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin
    // Anything that is not the Hub itself is refused: an answer that arrives anyway came from the Hub.
    await page.context().route(
      (url) => url.origin !== origin && url.protocol.startsWith('http'),
      (route) => route.abort()
    )
    const foreign = trackForeignRequests(page, baseURL!)
    await seedHub(page)
    await page.goto('/timeline')
    const drawer = await openDrawer(page)

    const supported = await ask(page, drawer, 'What is ML-KEM?')
    await expect(supported.getByText(/^Closest source:/)).toBeVisible()
    // Every resource names its kind and its place in the Hub, and links to a Hub page.
    const rows = supported.getByRole('listitem')
    expect(await rows.count()).toBeGreaterThan(0)
    await expect(
      rows
        .first()
        .locator('p')
        .filter({ hasText: /^(LM-|GL:|LIB:|ALG:|TOOL:|PAGE:|CMP:)/ })
    ).toBeVisible()
    await expect(
      supported
        .getByRole('button', {
          name: /^(Read here|Go to module|Go to page|Try it here|Go to section):/,
        })
        .first()
    ).toBeVisible()

    // A follow-up gets its own answer, and the first keeps its own resources.
    const followUp = await ask(page, drawer, 'What is ML-DSA?')
    await expect(followUp).not.toHaveText(await supported.innerText())
    await expect(answerOf(drawer, 'What is ML-KEM?').getByRole('listitem').first()).toBeVisible()

    // Words the records do not know are answered with the closest resources and no claim.
    const unknown = await ask(page, drawer, 'zxqvjwkpfrx zjqblwmvrqp zkvfhtjg')
    await expect(
      unknown.getByText(
        'Broad match: the Hub has no direct answer to this. These are the closest resources.'
      )
    ).toBeVisible()
    await expect(unknown.getByRole('group', { name: 'Direct answer' })).toHaveCount(0)

    expect(foreign, 'no request left the Hub').toEqual([])
    // The page offers no way to reach the old test hooks of the model chat.
    expect(
      await page.evaluate(() =>
        ['__e2e_chat_send', '__e2e_chat_store'].filter((key) => Reflect.has(window, key))
      )
    ).toEqual([])
  })
})
