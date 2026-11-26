// SPDX-License-Identifier: AGPL-3.0-only
import { Scale, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { useScrollToHash } from '@/hooks/useScrollToHash'
import { PersonaPageNote } from '@/components/shared/PersonaPageNote'

// Bump this date whenever a substantive edit is made to this file.
const EFFECTIVE_DATE = 'October 4, 2026'
const LAST_UPDATED = 'November 16, 2026'

const TOC_SECTIONS = [
  { number: 1, slug: 'acceptance', title: 'Acceptance of Terms' },
  { number: 2, slug: 'license', title: 'License' },
  {
    number: 3,
    slug: 'educational-disclaimer',
    title: 'Educational Purpose and Cryptographic Disclaimer',
  },
  { number: 4, slug: 'export-compliance', title: 'Export Compliance and Sanctions' },
  { number: 5, slug: 'acceptable-use', title: 'Acceptable Use' },
  { number: 6, slug: 'no-warranty', title: 'No Warranty' },
  { number: 7, slug: 'limitation-of-liability', title: 'Limitation of Liability' },
  { number: 8, slug: 'third-party-content', title: 'Third-Party Content and Attribution' },
  { number: 9, slug: 'intellectual-property', title: 'Intellectual Property' },
  { number: 10, slug: 'privacy-analytics', title: 'Privacy and Analytics' },
  { number: 11, slug: 'modifications', title: 'Modifications' },
  { number: 12, slug: 'governing-law', title: 'Governing Law' },
  { number: 13, slug: 'contact', title: 'Contact' },
] as const

function Section({
  number,
  slug,
  title,
  children,
}: {
  number: number
  slug: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={`terms-${slug}`}
      tabIndex={-1}
      className="glass-panel p-6 scroll-mt-20 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <h2 className="text-lg font-semibold mb-4 font-display text-heading">
        {number}. {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-secondary">{children}</div>
    </section>
  )
}

export function TermsView() {
  useScrollToHash({ focusTarget: true })
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="text-primary shrink-0" size={28} aria-hidden="true" />
          <h1 className="text-2xl font-bold font-display text-heading font-display text-heading">
            Terms of Service
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Legal terms governing the use of PQC Today and its embedded cryptographic software
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Effective Date: {EFFECTIVE_DATE} &middot; Last Updated: {LAST_UPDATED}
        </p>
        <PersonaPageNote route="/terms" className="mt-4" />
        <p className="text-xs text-muted-foreground mt-1">
          This document is updated when the platform&apos;s terms materially change; see the date
          above.
        </p>
      </div>

      <nav aria-label="Table of contents" className="glass-panel p-4 mb-6">
        <h2 className="text-sm font-semibold mb-2 font-display text-heading">Contents</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm list-decimal list-inside">
          {TOC_SECTIONS.map((s) => (
            <li key={s.slug}>
              <Link to={`#terms-${s.slug}`} className="text-accent hover:underline">
                {s.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-4">
        <Section number={1} slug="acceptance" title="Acceptance of Terms">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) apply to your use of the PQC Today website
            at{' '}
            <a
              href="https://www.pqctoday.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              www.pqctoday.com
            </a>{' '}
            (the &ldquo;Platform&rdquo;). If you do not agree to these Terms, do not use the
            website.
          </p>
          <p>
            The source code in the Platform&apos;s GitHub repositories is not governed by these
            Terms. Your rights to use, copy, modify and distribute it come from its licence (section
            2), and these Terms add no conditions to it.
          </p>
        </Section>

        <Section number={2} slug="license" title="License">
          <p>
            The Platform&apos;s source code is licensed under the{' '}
            <strong>GNU Affero General Public License v3.0 (AGPL-3.0-only)</strong>, with a
            commercial licence on request. The full license text is available in the{' '}
            <a
              href="https://github.com/pqctoday-org/pqctoday-hub/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1"
            >
              LICENSE file
              <ExternalLink size={12} aria-hidden="true" />
            </a>
            . Nothing in these Terms restricts rights granted under the AGPL-3.0.
          </p>
        </Section>

        <Section
          number={3}
          slug="educational-disclaimer"
          title="Educational Purpose and Cryptographic Disclaimer"
        >
          <p>
            The Platform is an <strong>educational and research tool</strong> for post-quantum
            cryptography (PQC). All cryptographic operations &mdash; including key generation,
            signing, verification, encryption, decryption, and key encapsulation &mdash; are
            performed <strong>client-side in your browser</strong> using WebAssembly (WASM) modules,
            the Web Crypto API and JavaScript libraries, and are intended{' '}
            <strong>for educational and demonstration purposes only</strong>.
          </p>
          <p className="text-xs bg-accent/10 border border-accent/30 rounded px-3 py-2">
            In short: this is a demo, not a certified crypto library &mdash; never use keys it
            generates to protect anything real.
          </p>
          <p className="font-medium text-foreground">Disclaimer:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              The Platform is not certified. Keys it generates are not suitable for protecting
              production systems, real data, or financial transactions.
            </li>
            <li>
              The Platform is not a substitute for professionally audited cryptographic
              implementations.
            </li>
            <li>
              Assessment results, migration recommendations and compliance guidance are educational
              information, not professional legal, security, or regulatory advice.
            </li>
          </ul>
        </Section>

        <Section number={4} slug="export-compliance" title="Export Compliance and Sanctions">
          <div className="space-y-4">
            <p className="text-xs bg-accent/10 border border-accent/30 rounded px-3 py-2">
              Encryption export controls depend on the item, its distribution and the parties and
              destinations involved. An open-source licence and export authorization are separate
              questions.
            </p>
            <div>
              <h3 className="font-medium text-foreground mb-1">
                4.1 Classification and public availability
              </h3>
              <p>
                The Platform includes real cryptographic software. Encryption software may fall
                under ECCN 5D002, but an algorithm name alone does not determine the classification
                or whether an item is subject to the U.S. Export Administration Regulations (EAR).
                Source code, corresponding object code and modified distributions can require
                different treatment. Consult the{' '}
                <a
                  className="text-primary underline"
                  href="https://www.bis.gov/learn-support/encryption-controls/encryption-items-not-subject-to-ear"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  BIS guidance on encryption items not subject to the EAR
                </a>
                .
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">4.2 Conditions and exceptions</h3>
              <p>
                <a
                  className="text-primary underline"
                  href="https://www.bis.gov/regulations/ear/742"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  EAR section 742.15(b)
                </a>{' '}
                describes the treatment of publicly available encryption source code, including
                applicable notification conditions. License Exception ENC has its own conditions for
                eligible encryption items. This notice does not assert that every Platform component
                or redistribution automatically qualifies for an exception or exemption.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">
                4.3 Your responsibility for export and sanctions law
              </h3>
              <p>
                Users are responsible for the laws applicable to their activities. Check current
                item, destination, end-use and restricted-party rules with{' '}
                <a
                  className="text-primary underline"
                  href="https://www.bis.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  BIS
                </a>{' '}
                and the{' '}
                <a
                  className="text-primary underline"
                  href="https://ofac.treasury.gov/sanctions-programs-and-country-information"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OFAC sanctions programs
                </a>
                . Comprehensive US sanctions on Syria ended effective July 1, 2025; targeted
                restrictions can still apply. See{' '}
                <a
                  className="text-primary underline"
                  href="https://ofac.treasury.gov/sanctions-programs-and-country-information/paarss"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OFAC’s current Syria-related program information
                </a>
                . This section is a notice about the law, not a condition of the software licence.
              </p>
            </div>
          </div>
        </Section>

        <Section number={5} slug="acceptable-use" title="Acceptable Use">
          <p>When using the website, you agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Use it for any unlawful purpose or in violation of any applicable laws or regulations.
            </li>
            <li>Present the website as your own creation.</li>
            <li>
              Attempt to compromise, disrupt, or interfere with its infrastructure or other
              users&apos; access.
            </li>
            <li>
              Scrape, crawl, or harvest data from it in a manner that degrades service for other
              users.
            </li>
          </ul>
          <p>
            PQC Today, LLC does not endorse use of the Platform to develop weapons, conduct
            surveillance, or violate human rights.
          </p>
        </Section>

        <Section number={6} slug="no-warranty" title="No Warranty">
          <p className="uppercase font-medium text-foreground">
            The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, express or implied, including but not limited to warranties of
            merchantability, fitness for a particular purpose, accuracy, or non-infringement.
          </p>
          <p>This is consistent with Sections 15 and 16 of the AGPL-3.0 license.</p>
          <p>
            The Platform aggregates data from public sources including NIST, ETSI, IETF, BSI, ANSSI,
            ISO/IEC, and others. Content may be inaccurate, incomplete, or outdated. You should
            independently verify all information before making decisions based on it.
          </p>
        </Section>

        <Section number={7} slug="limitation-of-liability" title="Limitation of Liability">
          <p className="uppercase font-medium text-foreground">
            To the maximum extent permitted by law, the maintainers, contributors, and affiliates of
            PQC Today shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits, data, or goodwill, arising from your use of or
            inability to use the Platform.
          </p>
        </Section>

        <Section number={8} slug="third-party-content" title="Third-Party Content and Attribution">
          <p>
            The Platform references and aggregates content from third-party organizations including
            but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>NIST</strong> &mdash; National Institute of Standards and Technology
            </li>
            <li>
              <strong>ETSI</strong> &mdash; European Telecommunications Standards Institute
            </li>
            <li>
              <strong>IETF</strong> &mdash; Internet Engineering Task Force
            </li>
            <li>
              <strong>BSI</strong> &mdash; Bundesamt f&uuml;r Sicherheit in der Informationstechnik
            </li>
            <li>
              <strong>ANSSI</strong> &mdash; Agence nationale de la s&eacute;curit&eacute; des
              syst&egrave;mes d&apos;information
            </li>
            <li>
              <strong>ISO/IEC</strong> &mdash; International Organization for Standardization
            </li>
            <li>
              <strong>Common Criteria</strong> (CCRA)
            </li>
          </ul>
          <p>
            The Platform is not affiliated with, endorsed by, or sponsored by any of these
            organizations. All trademarks, service marks, and trade names are the property of their
            respective owners.
          </p>
        </Section>

        <Section number={9} slug="intellectual-property" title="Intellectual Property">
          <ul className="list-disc pl-5 space-y-1">
            <li>The Platform&apos;s source code is licensed under AGPL-3.0-only.</li>
            <li>
              Original educational content, data compilations, and visualizations are copyright of
              the PQC Today maintainers.
            </li>
            <li>
              Third-party standards, specifications, and documents referenced by the Platform are
              subject to their respective licenses and copyright terms.
            </li>
          </ul>
        </Section>

        <Section number={10} slug="privacy-analytics" title="Privacy and Analytics">
          <p>
            The Platform has no user accounts and no login credentials, and no server of its own
            that processes your data. All cryptographic operations and assessments run entirely in
            your browser, using client-side WebAssembly modules, the Web Crypto API and JavaScript
            libraries.
          </p>
          <p>
            We use <strong>Google Analytics 4 (GA4)</strong> on every visit. It starts when a page
            loads, and the Platform has no consent prompt or on/off switch yet. GA4 collects
            anonymous usage data: page views, aggregated interaction events (e.g., which learning
            modules are started or completed, and searches, with the text you type scrubbed of email
            addresses, web addresses, IP addresses and long key-like strings), and basic browser
            details such as language and screen size. GA4 sets cookies that give your browser a
            random identifier so repeat visits can be counted. The page address we send has nothing
            after a &ldquo;?&rdquo; or &ldquo;#&rdquo;. Two automatic GA4 features (site search and
            navigation tracking) read the browser&apos;s own address instead, and can record text
            after a &ldquo;?&rdquo;, such as a search term or the data in a shared-report link.
            Google also receives your IP address when your browser sends these events. We do not
            send names, email addresses or account details. Analytics are disabled entirely when the
            Platform is accessed on localhost.
          </p>
          <p>
            To stop analytics, block them in your browser: use a content blocker that blocks Google
            Analytics requests (google-analytics.com), block cookies for this site, or install
            Google&apos;s opt-out browser add-on.
          </p>
          <p>
            For details on how Google processes analytics data, see{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1"
            >
              Google&apos;s Privacy Policy
              <ExternalLink size={12} aria-hidden="true" />
            </a>
            .
          </p>
          <p>
            The Platform&apos;s <strong>PQC Assistant</strong> chat feature offers two modes. When
            using <strong>Google Gemini Flash</strong>, your chat messages and page context are sent
            to Google&apos;s servers for processing. You must provide your own Google AI API key to
            use this mode. Your API key is stored locally in your browser and is never transmitted
            to PQC Today&apos;s infrastructure. Google&apos;s use of data sent via the Gemini API is
            governed by{' '}
            <a
              href="https://ai.google.dev/gemini-api/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1"
            >
              Google&apos;s Gemini API Terms of Service
              <ExternalLink size={12} aria-hidden="true" />
            </a>
            . Alternatively, you can use the <strong>Local LLM (WebLLM)</strong> mode, which runs
            the AI model entirely in your browser &mdash; no data leaves your device.
          </p>
          <p>
            Local browser storage (localStorage) keeps your learning progress, preferences, saved
            assessments and, if you add one, your AI provider key on your device. We do not receive
            it. It leaves your browser only if you share a report link or use the Gemini cloud mode
            described above.
          </p>
        </Section>

        <Section number={11} slug="modifications" title="Modifications">
          <p>
            We reserve the right to modify these Terms at any time. Changes will be indicated by
            updating the &ldquo;Last Updated&rdquo; date. Continued use of the Platform after
            changes constitutes acceptance of the modified Terms.
          </p>
        </Section>

        <Section number={12} slug="governing-law" title="Governing Law">
          <p>
            These Terms are governed by and construed in accordance with the laws of the State of
            Texas, United States, without regard to its conflict of law provisions.
          </p>
        </Section>

        <Section number={13} slug="contact" title="Contact">
          <p>
            For questions about these Terms, please open a discussion on{' '}
            <a
              href="https://github.com/pqctoday-org/pqctoday-hub/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1"
            >
              GitHub Discussions
              <ExternalLink size={12} aria-hidden="true" />
            </a>{' '}
            or contact the maintainers through the repository.
          </p>
        </Section>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center pt-4 pb-8">
          PQC Today is an open-source, community-driven educational platform. These Terms supplement
          &mdash; and do not replace &mdash; the rights and obligations under the AGPL-3.0 license.
        </p>
      </div>
    </div>
  )
}
