# Changelog

<!-- markdownlint-disable MD024 MD052 MD060 -->

All notable changes to this project are documented here, newest release first.

**Format:** `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD`, then an optional one-sentence
plain-language summary of the release, then `###` sections (`Added`, `Changed`,
`Fixed`, `Data`, `Security`).

**Writing style — write every entry for a reader, not a reviewer.** The
`/changelog` page shows these entries to real users, so write them that way the
first time (don't ship dev-speak and reformat later):

- **Lead with the outcome.** Start each entry with what changed for the user —
  what they can now do, see, or trust — not the mechanism. Bold the entry with a
  plain-language title: `- **What changed, in plain words** [view:/page]: …`.
- **Keep the `[view:/page]` and `[persona:id]` tags** — they drive the page's
  filters and "For me" view. Valid persona ids: `executive`, `developer`,
  `architect`, `researcher`, `ops`, `curious`. Tag every entry with the
  surface(s) it affects. `persona:ops` in particular is under-used relative to
  how often ops-relevant work actually ships (07-19 audit finding) — tag it
  explicitly whenever an entry touches deployment, certificate lifecycle, TLS
  configuration, or crypto inventory, even if another persona is also tagged.
- **Put the human-readable detail in the sentence; leave deep internals out.**
  Filenames, function names, commit hashes, byte offsets, and spec section
  numbers belong in the PR/commit, not here. Keep concrete specifics a user
  cares about (page names, feature names, what was broken, counts).
- **One entry = one user-visible change.** If it has no user-visible effect,
  it probably doesn't need a changelog entry.

## [4.61.0] - 2026-08-28

Two new Developer tabs teach PKCS#11 v3.2 and KMIP 3.0 by letting you build, run, and export a real sequence of calls, not just read about one.

### Added

- **A PKCS#11 v3.2 Developer tab, with a drag-and-drop sequence builder** [view:/playground] [persona:developer]: drag key generation, sign/verify, encrypt/decrypt, and key-agreement primitives onto a canvas, bind each step's inputs to an earlier step's outputs, and run the whole sequence for real against the same in-browser HSM engine the rest of the PKCS#11 playground uses — on your own dedicated token slot, so it never disturbs what you're doing elsewhere on the page. The generated Python is the real PKCS#11 v3.2 classic API (`C_SignInit`/`C_Sign`, not a simplified wrapper), and downloads unmodified as a script you can run in the separately distributed dev sandbox.
- **A KMIP 3.0 + crypto-agility Developer tab** [view:/playground] [persona:developer] [persona:architect]: pick a template — a full governed key lifecycle, an ML-KEM round trip, a policy dry-run comparison — see its real ordered steps, and run them against the same KMIP + crypto-agility policy engine the rest of the KMIP playground uses. The governed-lifecycle template ends on a policy refusal that's graded as a pass, not a failure: signing with a key before it's been activated is denied by design, and that honest "no" is the point.
- **Guided lessons for both new tabs** [view:/playground] [persona:developer]: a short, real walkthrough — drag a primitive, bind it, run it, read the result — that drives the actual controls rather than narrating a static tour.
- **Every generated script exports as real Python you can take to the sandbox** [view:/playground] [persona:developer]: both tabs' Export button downloads a file with a short provenance header (hub version, date, and a note that it runs unmodified in the dev sandbox) prepended to the same code shown in the editor.
- **A KMIP Developer tab you can now build by dragging, not just fill in from a template** [view:/playground] [persona:developer] [persona:architect]: the Start-from templates remain, but you can now drag lifecycle operations and the three governance step types (load a policy, dry-run a decision, expect a refusal) straight onto the canvas and assemble a sequence from nothing — the same freeform builder the PKCS#11 tab already had. Rebinding a step to a different key, reordering steps, and deleting one all re-check the sequence live.
- **A real LMS/HSS parameter-set picker on the PKCS#11 Developer tab** [view:/playground] [persona:developer]: the stateful hash-based signature primitive previously always used one fixed, small parameter set. It now offers the H10 tree height by name in the generated code (`CKP_LMS_SHA256_M32_H10`) — timed and proven to complete comfortably in-browser before shipping; larger heights were tried and left out because they measurably hang, not because they weren't tested.
- **The KMIP Developer tab's Sign step can now carry a genuinely binary payload** [view:/playground] [persona:developer]: a text/hex toggle on the message field lets hex mode emit a real Python `bytes.fromhex(...)` literal instead of text pretending to be hex, for testing non-UTF-8 data the way the real client actually has to.

### Fixed

- **The precache manifest was 108 KB heavier than it needed to be** [view:/playground] [persona:developer]: a Pyodide lockfile the Developer tabs' Python runtime uses at runtime, not at install, was being swept into the installable app shell by a blanket JSON pattern.
- **The mobile "unread updates" indicator could get permanently stuck on, for every visitor** [persona:curious] [persona:developer]: once a changelog entry for a not-yet-released version landed in this file — which happens routinely, ahead of the actual version bump — there was no way to ever mark it "seen": the red dot on the ⋯ menu stayed on for everyone until the version number caught up. The unread check is now capped at the version actually running.
- **The PKCS#11 Developer tab's C++ engine could never provision its own practice token** [view:/playground] [persona:developer]: switching the engine selector to C++ silently broke this tab specifically, because that engine reports every slot as having a token present the instant it exists, not just once one has actually been set up — so its dedicated token slot could never be created. Both engines now work, and the summary rail names which one ran your sequence.
- **A runaway script in either Developer tab could hang the browser tab indefinitely** [view:/playground] [persona:developer]: the 15-second timeout used to just give up and report failure while the script kept running unseen in the background — for a tight loop with no natural pause point, it couldn't even manage that much, since the timeout's own clock could never get a turn to run either. A dedicated background watchdog now delivers a real interrupt, the same way pressing Ctrl-C would, so the script actually stops.

## [4.59.0] - 2026-08-26

The compliance requirements catalogue grows by a third and every requirement in it is now traceable to a quote that really appears in the document it cites, 126 Library documents say which Learn modules teach them, and mobile Library and Timeline gain the Document Analysis panel desktop already had.

### Added

- **Document Analysis now opens from Library and Timeline detail views on your phone** [view:/library] [view:/timeline] [persona:researcher] [persona:architect] [persona:developer] [persona:curious]: the collapsible panel that explains what a document covers, who it affects, and which parts of the site it connects to was desktop-only — it was never built for mobile. It now opens from both detail sheets. It also stays hidden entirely when a document has nothing to show, instead of opening onto an empty panel, and detail grids no longer spend scarce phone width on rows that just said "N/A" or "Citations: 0".

- **687 more compliance requirements, drawn from 65 more sources** [view:/compliance] [persona:architect] [persona:executive] [persona:ops]: the requirements catalogue behind the compliance drawer, the maturity tiles, and the agility explorer goes from 2,022 requirements across 229 sources to 2,708 across 294. New coverage includes Saudi Arabia's NCS-1:2020, New Zealand's NZISM, Australian ASD/ACSC guidance, US sector rules (NRC 10 CFR 73.54, FRA Positive Train Control), APRA CPS 234, and 5G Americas.

### Changed

- **126 Library documents now tell you which Learn modules teach them** [view:/library] [view:/learn] [persona:curious] [persona:researcher] [persona:architect]: a document's entry links onward to the modules that cite it, so a standard you land on is no longer a dead end. 35 more documents gained the algorithm family or the protocol/tool impact they were missing.

### Fixed

- **83 compliance requirements quoted text that is not in the document they cite** [view:/compliance] [persona:architect] [persona:researcher] [persona:ops]: every requirement was re-checked against its actual source document, and those that could not be traced to real text were retired rather than left standing. Several were quoting a site's landing page instead of the standard itself — Saudi Arabia's NCS-1:2020 requirements, for example, now cite the standard's PDF rather than nca.gov.sa's front page. The catalogue is now fully grounded.

- **Learn module pages ran flush against both edges of the screen on phones** [view:/learn] [persona:curious]: this affected every module page whenever the active persona is Curious.

- **The SBOM module cited CISA's 2026 revision twice and the 2021 original not at all** [view:/learn] [persona:developer] [persona:architect]: an automated citation sweep repointed the module's reference to the current standard without noticing the module already cited it separately, in the section that compares the two documents side by side. Its "Minimum Elements" section describes the 2021 original in detail, so the duplicate is now removed.

## [4.58.0] - 2026-08-25

A round of fixes to the mobile layer shipped in 4.57.0, found by testing it live on a phone: Assess, Compliance, Migrate, and Algorithms each had a screen that still fell through to the desktop layout, plus assorted overflow and state bugs.

### Added

- **Assess now covers the same 13 steps on mobile as on desktop, with a quick/comprehensive track picker** [view:/assess] [persona:executive] [persona:architect] [persona:ops] [persona:developer]: mobile previously stopped after 6 steps. Retention, credential lifetime, deployment scale, crypto-agility, infrastructure layers, and your compliance timeline pressure are now all part of the mobile flow, matching desktop.
- **Compliance and Migrate: tapping a framework or a vendor's roadmap entry now opens a real detail view** [view:/compliance] [view:/migrate] [persona:architect] [persona:executive] [persona:ops]: these rows looked tappable on mobile but previously did nothing. Compliance shows the same "about this standard" detail as desktop; Migrate shows certification lookups and vendor roadmap detail, with supporting proof collapsed by default rather than shown upfront.
- **Algorithms: a real Protocol Support screen and a real KAT validation screen on mobile** [view:/algorithms] [persona:developer] [persona:architect] [persona:researcher]: both used to fall through to the full desktop layout squeezed onto a phone. KAT validation now runs genuine WASM-executed test vectors against ML-KEM, ML-DSA, and SLH-DSA directly on the device.

### Fixed

- **Assess's compliance step showed an incomplete, unranked list of frameworks instead of what actually applies to you** [view:/assess] [persona:architect] [persona:executive]: it now uses the same applicability engine as desktop, correctly tiered (mandatory, recognized, cross-border, advisory).
- **"Replace a classical algorithm" dumped up to 38 options onto one flat, unsorted screen** [view:/algorithms] [persona:developer] [persona:architect]: real data, unusable presentation. Options are now grouped by function and capped to the 6 most relevant, with the rest one tap away.
- **The Algorithms Transition and Detailed Comparison screens showed the full desktop search bar, filter deck, and 5-tab switcher squeezed onto a phone** [view:/algorithms] [persona:developer] [persona:architect] [persona:researcher]: both now render a distilled, phone-native layout. Detailed Comparison's side-by-side compare mode has no mobile layout yet, so mobile shows the browse view only; desktop is unaffected.
- **Text ran off the right edge of the screen instead of wrapping on 7 mobile screens** [view:/threats] [view:/patents] [view:/leaders] [view:/library] [view:/playground] [view:/business] [view:/compliance] [persona:curious] [persona:researcher] [persona:ops]: Threats, Patents, Community, Library, Playground, Business Tools, and Compliance cards all had the same inherited-`nowrap` defect.
- **Interactive simulation play on mobile lost your progress if you navigated away and came back** [view:/simulation] [persona:developer] [persona:architect]: state now survives the round trip.
- **A card on the Algorithms landing screen ran its description text off the edge of the phone** [view:/algorithms] [persona:curious].

## [4.57.0] - 2026-08-24

A real mobile experience across the whole app, an ACVP validator that now runs and checks against genuine NIST test vectors, and an accuracy pass across Learn's home boards, MLS/EO 14412 citations, and the compliance maturity catalogue.

### Added

- **A real, phone-native version of every screen** [view:/] [persona:curious] [persona:developer] [persona:architect] [persona:executive] [persona:researcher] [persona:ops]: navigation, Home, Learn, Workshop, Timeline, Threats, Algorithms, Library, Community, Patents, About, Compliance, Migrate, Assess, Report, Command Center, and interactive Simulation play now all have a distilled mobile layout, on by default. Playground's 31-tool catalogue and Business Tools' 36-tool catalogue were individually checked for phone usability rather than just resized. Five Reference-set screens that looked tappable but had no click handlers now open real detail views. Desktop is unaffected — every touched screen was checked to render identically at desktop width with the mobile layout off.

### Fixed

- **The ACVP validator claimed a "real execution / FIPS 140-3 proof" it wasn't actually running** [view:/playground] [persona:developer] [persona:architect] [persona:ops]: it now points at the validator that genuinely performs it. Its stored test vectors turned out to be self-generated rather than sourced from NIST — every ML-KEM, ML-DSA, SLH-DSA, and SHA vector is now byte-exact NIST data (SLH-DSA coverage went from 1 of 12 parameter sets to all 12). 26 checks that were silently skipping now show up as skipped instead of disappearing, and the tool's own documentation no longer understates its algorithm-family coverage.
- **Four retired EU eIDAS requirements were loading as active** [view:/compliance] [persona:architect] [persona:researcher]: a sort bug in how the maturity-requirements catalogue merges its correction files let an older file outrank the newer one that superseded it, silently reviving rows that had already been deprecated.
- **40 accuracy defects corrected across all 36 role-based home boards** [view:/] [persona:executive] [persona:developer] [persona:architect] [persona:researcher] [persona:ops] [persona:curious].
- **A module cited an old MLS draft while its own text described the current one, and four modules stated EO 14412 deadlines without citing where those dates come from** [view:/learn] [persona:developer] [persona:architect] [persona:ops]: both corrected. Editing a module was also incorrectly marking it as freshly reviewed for readers — fixed.
- **FIPS 140-3 and SP 800-230 were each listed twice in the Library** [view:/library] [persona:researcher] [persona:architect]: deduplicated.

## [4.56.0] - 2026-08-23

A large accuracy pass across the Learn modules — dozens of citations now point at the standard that is actually current — plus a References tab showing what each module cites, working autosave in the business tools, and a keyboard-navigable, higher-contrast interface.

### Added

- **Every Learn module now has a References tab showing exactly what it cites** [view:/learn] [persona:curious] [persona:researcher] [persona:architect]: each cited standard is listed and linked straight to its Library entry, so you can check a module's sources without hunting for them. Which documents a module cites is now also enforced — a module that makes a dated claim has to declare the document that claim comes from.
- **Related modules, and 25 more pages reachable from search** [view:/learn] [persona:curious]: modules now suggest what to read next, and 25 pages that existed but could only be found by knowing their URL now appear in global search.
- **Slide export no longer depends on a third-party generator** [view:/learn] [persona:executive] [persona:architect]: exports are written directly in the PowerPoint format, which removes a large dependency from the download and fixes exports that came out corrupted.

### Fixed

- **Nine modules cited a TLS specification that was replaced in July 2026** [view:/learn] [persona:developer] [persona:architect] [persona:ops]: they pointed at RFC 8446, which RFC 9846 now obsoletes. All nine repointed, along with a module citing an SBOM document superseded by CISA's 2026 revision and another citing a retired NIST random-number publication. In total 65 citations that pointed at withdrawn or superseded Library entries now point at the live ones.
- **The 5G module told readers to implement a profile 3GPP never defined** [view:/learn] [persona:developer] [persona:architect] [persona:ops]: its plain-English summary described a post-quantum profile that does not exist in the specification. Corrected.
- **A payment module described card authorisation cryptography wrongly** [view:/learn] [persona:developer] [persona:architect]: it said an EMV ARQC is something you sign with ML-DSA. An ARQC is a MAC, and the module now says so.
- **Wrong key and signature sizes in three places** [view:/learn] [persona:developer] [persona:architect]: FrodoKEM sizing was wrong, a crypto-agility sizing hint understated post-quantum key sizes by a factor of four, and a Merkle Tree Certificate proof was given as 736 bytes when a standalone proof is 384.
- **Business-tool drafts are no longer silently lost** [view:/business] [persona:executive] [persona:architect]: the tools claimed to autosave but did not, so work could disappear on navigating away. Autosave is now real.
- **Modules that had dropped out of the guided paths are back** [view:/learn] [persona:curious] [persona:researcher]: several modules existed but were unreachable from any role's learning path. They have been reinstated, and a check now fails the build if it happens again.
- **Keyboard and screen-reader navigation through module tabs** [view:/learn] [persona:curious]: tabbed sections across the site now follow the standard accessibility pattern, and a contrast problem affecting readability was fixed.
- **Phone and tablet layout fixes** [view:/learn] [persona:curious] [persona:ops]: step labels, log panels and wide tables no longer overflow their containers on small screens; 22 dropdowns that used the raw browser control now match the rest of the interface.
- **The Assistant's local model had weaker anti-hallucination instructions than the cloud one** [persona:developer] [persona:researcher]: two rules present in the cloud prompt — never invent a certification status, never claim a product supports an algorithm unless the source says so — had been dropped from the on-device prompt, which is the more hallucination-prone path. Restored.
- **The Assistant stopped padding answers with weak sources** [persona:researcher] [persona:curious]: when it could not find enough strongly-matching passages it filled the remainder with whatever scored next, however poorly. Those weak matches diluted the answer and widened what its own fact-check treated as supported. It now stops at a quality floor instead.
- **The sandbox no longer overstates what it supports** [view:/playground] [persona:developer] [persona:ops]: a scenario summary claimed 8 certificate formats where the underlying tool supports fewer.
- **A secure-boot page linked to a superseded PKCS#11 draft** [view:/learn] [persona:developer] [persona:ops]: it now points at the ratified version.
- **The Algorithms page said what its memory column cannot tell you** [view:/algorithms] [persona:developer] [persona:architect]: the RAM figures are peak working-set measurements from one implementation, not a portable requirement, and the column now says so rather than implying a hardware bar.

### Data

- **Every claim about a source document is now backed by a verified copy** [view:/library] [persona:researcher] [persona:architect]: 181 stored documents were brought under hash verification after individual screening, and the number of unverified stored copies went from 249 to 1. Where no fetch can retrieve a document — four paywalled standards among them — that is now recorded with the reason instead of left looking unchecked.
- **Duplicate and misattributed Library entries cleaned up** [view:/library] [persona:researcher]: 13 duplicate documents were merged (two of them filed under misleading names), and 11 entries that credited the European Commission for other organisations' work now name the real publisher. A compliance entry that attributed South Korea's KCMVP scheme to NIST now attributes it to KISA.
- **Six documents were serving a catalogue or project page instead of the standard itself** [view:/library] [persona:researcher] [persona:architect]: including FIPS 206, whose evidence was the NIST project page rather than the draft. Each now has the real document.
- **eIDAS is described correctly** [view:/compliance] [persona:executive] [persona:architect]: Regulation 910/2014 was marked as superseded. It is amended, not superseded, and the amending text that actually applies has been added.
- **The protocol matrix is current against the IETF datatracker** [view:/algorithms] [persona:developer] [persona:architect]: every drafted specification that had moved on was refreshed, and RFC 9954 added. The TLS module's hybrid key agreements are now cited as RFC 10024, which became a Standards Track RFC on 2026-08-10.
- **Six algorithms the site already had data for are now in the catalogue** [view:/algorithms] [persona:developer] [persona:researcher]: they were present in the underlying data but never surfaced.

## [4.55.0] - 2026-08-19

More product briefs and user manuals are linked, a batch of vendor data mistakes are corrected, the Industry Landscape page no longer sends you to the wrong Learn module, and changing your role on mobile actually works now.

### Data

- **Product brief and user manual links, now on 695 of 1,011 catalog products** [view:/migrate] [persona:ops] [persona:architect]: was 670. Each new link is backed by a downloaded, verified copy of the document it points to, not just a search result.
- **Vendor data cleanup: 2 new vendors registered, 5 mismapped products repointed, 4 stale product rows retired** [view:/migrate] [persona:ops] [persona:architect]: Codegic (Pakistan-based PKI vendor) and Zhengzhou Xinda Yimi Technology (the actual maker of the "MiXin PQC01" chip) are now in the vendor registry, and 5 products that had been pointed at the wrong vendor now point at the right one. Separately, a discontinued product (ID Quantique's Cerberis XGR QKD) and 3 rows that turned out to be duplicates of Utimaco's current u.trust HSM line (their unique details were preserved by folding them into that surviving entry first) were retired, each backed by a live-reverified source.

### Fixed

- **The Industry Landscape page no longer points "Supply Chain / Logistics" at the wrong Learn module** [view:/algorithms] [persona:researcher] [persona:architect]: it linked to the vendor/software supply-chain risk module, but this industry's actual topics — port PKI, electronic bills of lading, customs systems — have nothing to do with that. It now shows no module rather than a misleading one, until a dedicated one exists.
- **Changing your role on mobile actually works now** [persona:curious] [persona:researcher] [persona:executive] [persona:developer] [persona:architect] [persona:ops]: two separate bugs made the role switcher unreachable on phones and tablets. If no role was set yet, there was no button anywhere in the mobile menu to open the picker. And once the screen was wide enough to show the desktop-style top bar (e.g. landscape orientation), the switcher button could scroll out of view with no indication there was more to scroll to. Both fixed.

## [4.54.0] - 2026-08-19

More than double the product catalog now links straight to a vendor's own brief and user manual, 22 newly-discovered PQC patents are indexed, and every citation on the protocol-interoperability matrix now resolves to real evidence.

### Data

- **Product brief and user manual links more than doubled, to 670 of 1,011 catalog products** [view:/migrate] [persona:ops] [persona:architect]: was 327. Each link is backed by a downloaded, verified copy of the document it points to, not just a search result.
- **22 new patents added — 7 of them post-quantum — and a taxonomy error caught before it shipped** [view:/patents] [persona:researcher] [persona:architect]: 1,806 active patents now, up from 1,784. Every new filing passed the security-classification screen; of the 22, 7 also met the stricter bar the site's "PQC & hybrid" view uses (a named PQC algorithm, or hybrid/PQC-only design) — the rest are adjacent crypto patents kept for context. A batch of 13 pre-existing entries had briefly mis-tagged the McEliece cryptosystem as "classical" cryptography rather than the NIST round-4 post-quantum candidate it actually is — corrected before merge, so the error never reached the site.
- **Every citation on the protocol interoperability matrix now resolves to real evidence** [view:/algorithms] [persona:developer] [persona:architect]: 13 protocol specifications the matrix cited (RFC 6488, RFC 10024, and 11 IETF drafts covering hybrid PQC in JOSE, PKINIT, SSH, RPKI, and EAP) had no backing library entry or were filed under a mismatched id, so their citations went nowhere. All 13 now resolve.

## [4.53.0] - 2026-08-18

Hybrid certificates in the workshop now cover all six algorithm pairings the current standard recommends — and can be verified, not just generated — while the landing page loads noticeably less up front.

### Added

- **Hybrid certificate workshop now offers all six recommended algorithm pairings** [view:/learn] [persona:developer] [persona:architect] [persona:ops]: pick from a dropdown covering the combinations the composite-signature standard recommends for general use, when RSA is required, when bandwidth matters, when you need the highest security level, and when signature malleability is a concern. Previously only one pairing could be generated.
- **Certificates you generate can now be checked, not just downloaded** [view:/learn] [persona:developer] [persona:architect]: the inspector verifies both halves of a hybrid certificate — the post-quantum signature and the classical one — and tells you which failed and why. Before this, nothing in the workshop could confirm a hybrid certificate was actually valid.
- **RSA key sizes are enforced against the standard** [view:/learn] [persona:architect] [persona:ops]: a certificate claiming the RSA-3072 profile while carrying a weaker 2048-bit key is now rejected outright, as the specification requires, rather than passing unnoticed.

### Fixed

- **Hybrid certificates generated by the workshop were malformed and would be rejected elsewhere** [view:/learn] [persona:developer] [persona:architect]: the classical signature was written in the wrong format, so every composite certificate the workshop had produced would fail against any conformant implementation. Certificates generated from now on are correct; any downloaded previously should be regenerated.
- **Key-splitting (M-of-N custody) had stopped working entirely** [view:/playground] [persona:ops] [persona:architect]: creating split keys failed for every key, while the system continued to advertise the feature as available. Split custody works again, including the Learn walkthrough that teaches it.
- **The site downloads noticeably less before it can show you anything** [persona:curious] [persona:ops]: the landing page was pulling in the entire dataset — library, timeline, compliance, threats and more — because of a single import needed only once you ask the assistant a question. That now loads on demand.

### Changed

- **HQC and FN-DSA now appear in the default algorithm view** [view:/algorithms] [persona:architect] [persona:developer] [persona:executive]: both are NIST selections whose FIPS documents are not published yet, and the default "Certified" filter was hiding them — including FN-DSA-512, which the executive view already highlights as a headline algorithm. They still show a "Draft" badge and are still excluded from anything claiming FIPS validation, so nothing is presented as more final than it is.
- **Industry Landscape tiles sort by cybersecurity opportunity** [view:/industry] [persona:executive] [persona:architect]: tiles order by estimated market opportunity and show the badge they are sorted by, so the ranking is visible rather than implied.

### Data

- **Market-size figures refreshed, with Healthcare, Education and Water restored** [view:/industry] [persona:executive] [persona:researcher]: no remaining row is older than 2024, and three sectors that had lost their market-size rows are back after re-checking sources.
- **Superseded spreadsheet generations archived** [persona:ops]: older copies of the library, quiz and industry data moved to the archive folder. Nothing is deleted and the site reads the newest generation exactly as before.

## [4.52.0] - 2026-08-17

Industry Landscape now covers Cryptocurrency/Blockchain consensus mechanisms, migrate-catalog product tiles link straight to vendor documentation, and the AI assistant recovers hundreds of sentences it was previously cutting off mid-thought.

### Added

- **Cryptocurrency/Blockchain coverage added to Industry Landscape** [view:/algorithms] [persona:researcher] [persona:developer] [persona:architect]: new entries cover Solana's transaction signing, Cardano's Ouroboros consensus (VRF + Key-Evolving Signatures), and related chain-specific cryptography — each backed by primary vendor/protocol documentation, not secondary reporting.
- **Three new signature mechanism families tracked** [view:/algorithms] [persona:developer] [persona:architect]: EdDSA, BLS, and Schnorr are now first-class mechanism families across the algorithm taxonomy, closing a gap where chains using them (Solana, Ethereum consensus, Polkadot) had no home in the crypto inventory.
- **Product Brief and User Manual links on migrate-catalog product tiles** [view:/migrate] [persona:ops] [persona:architect]: where a vendor publishes one, it now links directly from the product card instead of requiring a search.

### Fixed

- **AI assistant answers recover sentences that used to get cut off mid-thought** [persona:curious] [persona:researcher]: a text-extraction bug was splitting sentences at inline elements (tooltips, bold text) and discarding the short fragments — sometimes dropping the subject of the sentence entirely. Recovered content across all Learn modules.
- **Two Learn modules (Government & Defense, Trust Services) now fully searchable by the AI assistant** [view:/learn] [persona:curious]: these shipped without the summaries the assistant and search index depend on; both are now indexed.

### Data

- Re-verified ~130 migrate-catalog products against current vendor evidence (spotcheck batches 39–64). [persona:ops] [persona:architect]
- Refreshed the AI assistant's search index (16,322 chunks, up from 15,620) to reflect all of the above. [persona:curious] [persona:researcher]

## [4.51.0] - 2026-08-16

Industry Landscape rows now show whether their cited evidence names the crypto directly or is a governance driver proven elsewhere, and the Journey panel stops missing milestones in Command Center and OpenSSL Studio.

### Added

- **Industry Landscape rows now show what kind of evidence backs them** [view:/algorithms] [persona:researcher] [persona:developer] [persona:architect]: a new citation-type badge distinguishes rows whose linked document names the claimed cryptography directly from rows where the citation is a governance/institutional driver (HIPAA, PCI DSS, NRC, and similar) and the actual proof lives in a separate reference. 43 of 74 sourced rows were in the second category and previously looked identical to the first.
- **75 of 80 Industry Landscape use cases now link to their Library evidence entry** [view:/algorithms] [persona:researcher] [persona:developer]: up from 45 — each use case now points at the actual standard or document backing its claim, not just a citation string.
- **Protocol Matrix flags FIDO as historical, with the standard that superseded it** [view:/algorithms] [persona:developer] [persona:architect]: previously listed without context.

### Changed

- **The Journey panel no longer misses milestones from Command Center or OpenSSL Studio** [view:/business] [view:/playground/openssl] [persona:curious] [persona:developer] [persona:ops]: actions taken in those two tools weren't wired into milestone tracking, so progress there went unrecorded. Off-path exploration is now also surfaced instead of silently dropped.

## [4.50.3] - 2026-08-15

The two new PKCS#11 v3.2 library entries (Profiles and Usage Guide) now show full details instead of blank fields.

### Data

- **PKCS#11 v3.2 Profiles and Usage Guide have full detail pages** [view:/library] [persona:researcher] [persona:developer]: these two documents were added to the catalog with citation and metadata but no extracted content — their detail pages showed mostly blank fields. Both are now fully enriched: authors/editors, mechanisms covered, and key conformance takeaways.

## [4.50.2] - 2026-08-15

Library search now finds documents by their standard number no matter how it's written — "PKCS11", "PKCS-11", and "PKCS #11" all now find the same results.

### Fixed

- **Search matches standard numbers regardless of spacing or punctuation** [view:/library] [persona:researcher] [persona:developer]: searching a standard's number the way people actually type it — "pkcs11" as one word — silently missed almost every document about it, because titles and catalog IDs are written with a space or a hyphen ("PKCS #11", "PKCS-11"). Search now treats those forms as equivalent, so a one-word search finds every real document.

## [4.50.1] - 2026-08-15

Search results now cite roughly 800 more library documents whose citation links had quietly stopped resolving, and 13 compliance records that weren't being scored for trust are now scored.

### Fixed

- **Search results cite the source passage again for ~800 library documents** [view:/library] [persona:researcher] [persona:developer]: the citation-linking step behind search hadn't been re-run since a prior data snapshot, so as the library grew, roughly 800 documents accumulated with a working search entry but no link back to the actual passage in the source document — a citation you couldn't follow. Re-run against the current library; a small, named residue of 13 documents genuinely can't be linked (a handful of file formats the extractor can't read text from) and is tracked openly rather than hidden behind a passing check.
- **13 compliance records are now scored for trust** [view:/compliance] [persona:researcher] [persona:ops]: these records existed on the Compliance page but weren't being factored into the trust-tier scoring that backs the page's confidence indicators, because the search index they're checked against was out of date.

## [4.50.0] - 2026-08-14

The PKCS#11 playground now runs the audited v3.2 engines rather than older builds, names every mechanism it advertises instead of showing raw hex, and cites the current standard — plus five correctness fixes found by auditing the two engines against each other.

### Fixed

- **The playground runs the engines the conformance work actually fixed** [view:/playground] [persona:developer] [persona:architect] [persona:ops]: the browser HSM was still running older builds, so months of PKCS#11 v3.2 conformance work was described on the page but not present in what you clicked. Every engine bundle the site ships — both HSM engines and the four protocol wrappers — is rebuilt from the released engines and pinned, and a check now blocks any release where the page and the engine have drifted apart again.
- **The mechanism list reads as mechanism names, not hex codes** [view:/playground] [persona:developer]: browsing what the emulated HSM supports showed "CKM_UNKNOWN" and a raw number for roughly 37 entries on one engine and 21 on the other — including standard v3.2 mechanisms and the post-quantum ones the key-encapsulation panel advertises by name elsewhere on the same page. All of them are named now, and a test checks the table against what the engines really advertise, so a future engine release cannot quietly reintroduce the gap.
- **Panes no longer wipe each other's operation log** [view:/playground] [persona:developer]: switching panes cleared the shared PKCS#11 call log, discarding the record of what you had just run.
- **The key-encapsulation workbench waits for the engine to be ready** [view:/playground] [persona:developer]: it could be operated before the HSM had finished starting, which failed in a way that looked like the feature was broken.
- **Hierarchical-deterministic wallet derivation keeps working** [view:/learn] [persona:developer] [persona:architect]: the HD-wallet lesson in the digital-assets module derives child keys through the emulated HSM. The page and the engine had each been passing that request in the same non-standard shape — agreeing with each other while disagreeing with the standard — so correcting the engine would have broken the lesson outright. Both now follow the specification, and the derived keys are checked against the published BIP32 test vectors.
- **Standards citations point at sections that exist** [view:/playground] [persona:researcher] [persona:developer]: the playground cited section numbers from PKCS#11 v2.40 while describing v3.2 behaviour, so following a citation led to the wrong part of the standard, or to nothing. Roughly 35 user-facing references were corrected against the current text.
- **Two cryptographic reading errors, found by running the engines against each other** [view:/playground] [persona:developer]: a test-vector reader was cutting two bytes off a curve point given in its bare form, and a signature option controlling whether a message is pre-hashed was read at the wrong width — accepted silently rather than rejected. Both are now covered by tests.

### Changed

- **One implementation of stateful hash-based signatures instead of three** [persona:developer]: three near-duplicate copies had drifted apart; they are now a single implementation, so a fix lands everywhere at once.

## [4.49.0] - 2026-08-12

The library sorts by when a document was actually published rather than when we last touched its record, and the business tools' dollar figures, quotations and vendor guidance have been checked against the documents they cite — three of five financial constants turned out to be wrong.

### Added

- **The library shows each document's own publication date, and sorts by it** [view:/library] [persona:researcher] [persona:architect] [persona:ops] [persona:developer]: "Newest first" ordered by catalog activity — the day our record last changed — so a decade-old RFC whose entry we tidied last week outranked a standard published this month. Publication dates now come from the document itself, 966 of 1,029 documents carry one, and every role opens on that ordering. "Recently updated" is still there for anyone who wants the old behaviour. Dates print at the precision the publisher actually states: a year for an ISO edition, a month for an RFC, never a manufactured day.
- **Records say when they were last checked against the source** [view:/library] [persona:researcher] [persona:ops]: 799 documents now carry a "verified" date, shown on the card and in the detail panel and counted in the trust score. It is deliberately absent on records nobody has re-checked, so it never implies a check that did not happen.
- **Standards citations in the business tools reach the document** [persona:executive] [persona:architect] [persona:developer]: the tools cite their sources inline — "[NIST SP 800-57 Part 3]", "[FIPS 203]" — as plain text you had to go and find. Those citations are now links into the library entry for the document, in the app and in what the tools export.

### Changed

- **The financial baselines were read from the reports, not their landing pages** [persona:executive]: the last release could only mark them "cited but unverified", because the evidence on hand was a landing page for each report. Both non-IBM sources have now been retrieved and read in full, and three of five constants were wrong — the small-firm annual breach probability was 2%, which is where that series _starts_, in 2008; it is 8.7% today. Every figure now cites the figure number it came from. The IBM per-sector figures stay behind a registration wall, and every place they appear now says plainly that they are unverified.

### Fixed

- **A blank reached an exported board deck with no warning** [persona:executive]: the tools warn before you export a document that still has an unfilled blank in it, and the warning did not recognise a lowercase one — the Board Pitch's governance section ships "...systems retiring before [date]", and that string reached slide 9 of a real .pptx. The same warning also cried wolf on the tool with the most citations, reporting "7 unfilled placeholders" and then listing NIST SP 800-57, FIPS 203/204/205 and CISA guidance among them. Citations and headings are no longer counted as blanks; blanks are.
- **The Monte-Carlo histogram disagreed with the summary above it** [persona:executive]: the Cost Model Explorer's chart kept its own copy of the programme-cost term, which stopped being updated when that cost became horizon-scaled. The histogram and the percentiles under it differed from the summary bar by $4.7M at a ten-year horizon and $11.3M at twenty.
- **The Cost of Inaction export named no industry, then used one** [persona:executive]: the exported analysis omitted which industry it had been run for while its numbers depended on that choice, so two exports that disagreed looked like the same analysis.
- **Vendor guidance contradicted this site's own catalogue** [view:/migrate] [persona:architect] [persona:ops]: a tool's hardware-security-module advice named vendors and support states that the product catalogue on this site does not agree with. It now follows the catalogue.
- **A tool said the French authority accepts a NIST signature algorithm on its own** [persona:architect] [persona:ops]: ANSSI's position is that post-quantum algorithms are acceptable in hybrid with a classical one for the transition period; the tool presented ML-DSA as accepted outright.
- **Two quotations attributed to the NIST crypto-agility white paper were not verbatim** [persona:architect] [persona:researcher]: both silently dropped words from inside a sentence that the tools render on screen and in exports as a direct quote. Restored from the document, and two live references to a section of it that does not exist were removed.
- **The Supply Chain Risk Matrix took ~19 seconds to appear** [view:/learn] [persona:architect] [persona:ops]: with nothing selected it listed all 912 catalogue products with an icon each — 15,343 elements. Large layers now show a count and a link to Migrate until you pick your own infrastructure.

### Data

- **Publication dates derived from the cached evidence** [view:/library] [view:/timeline] [view:/migrate] [persona:researcher] [persona:ops] [persona:architect]: for the library, timeline and vendor roadmaps, with the remaining rows accounted for rather than left blank and unexplained. Cyentia and NetDiligence are registered as the trusted sources they were already being used as, 18 superseded CSV revisions that nothing reads are archived, and the search index is rebuilt.

## [4.48.1] - 2026-08-12

Seven playground tools now show a review that matches the version you are actually using, and the library stops implying a draft still says something it no longer says.

### Fixed

- **Seven playground tools showed a review of an older version than the one running** [view:/playground] [persona:researcher] [persona:developer] [persona:architect]: each tool carries a version and a "reviewed" mark, and the two had drifted apart for every tool changed in the last release — the mark referred to a version that was no longer what you were using. All seven re-reviewed and re-recorded against their current version.
- **The library implied an internet draft still covers JSON web token encryption** [view:/library] [persona:developer] [persona:architect]: the record describes the version we cite and cache, which is correct — but that version was superseded in July by one rewritten for a different format entirely, dropping the token-encryption part completely. The record now says so, and explains that citing the earlier version is deliberate rather than an oversight. Five internal cross-references that quote passages the newer version deleted now carry the same explanation.

## [4.48.0] - 2026-08-11

Compliance answers "which rules bind me, and why" instead of listing every rule that exists; the business tools stop telling executives that doing nothing is free; every page now says whether it adapts to your role, and the ones that quietly didn't have been fixed or made honest about it.

### Added

- **Compliance opens on the rules that bind you** [view:/compliance] [persona:executive] [persona:architect] [persona:ops]: the page led with an explanation of what compliance is, then a catalogue of every instrument we track, leaving you to work out which ones apply. It now opens on a Rules & Standards register — the rules that reach your organisation, each one saying why it reaches you, and what changed recently. The catalogue is still there for anyone who wants it, one tab over.
- **A reading room for the requirement itself** [view:/compliance] [persona:architect] [persona:ops]: a rule named a document and left you to go find it. You can now read the specific requirement text a row rests on without leaving the page.
- **Bring your own crypto inventory into the assessment** [view:/assess] [persona:ops] [persona:architect]: the assessment asked you to describe an estate it had no way to see. It now imports a CBOM, offers reference estates if you have not built one yet, shows what each answer actually moves, and can produce a researcher-profile report.
- **Which vendors have actually committed, and what they said** [view:/migrate] [persona:executive] [persona:researcher]: an executive lens over the catalogue showing vendor commitments as commitments rather than product rows, and the underlying claims as a corpus researchers can work through.
- **Two more ways into the same data** [view:/timeline] [view:/threats] [persona:curious] [persona:developer]: a newcomer track through the timeline that does not assume you already know the standards, and a protocol-shaped lens on threats for developers who think in TLS and SSH rather than in sectors.
- **Deadlines you can put in a calendar, evidence you can sort by strength** [view:/timeline] [view:/library] [persona:ops] [persona:researcher]: ops can export dated obligations to a calendar instead of transcribing them; researchers can order sources by how strong the evidence behind them is.
- **Business tools show where their numbers come from** [persona:executive] [persona:architect]: each tool's own page now names the standards it implements and links the hub material behind it, rather than presenting a figure with no provenance.

### Changed

- **One quantum model across the whole tool suite** [persona:executive]: the tools disagreed with each other — different assumed arrival years for a cryptographically relevant quantum computer, different underlying models — so two tools could answer the same question differently in the same session. They now share one model and one arrival year.
- **The financial baselines say which are proven** [persona:executive]: every dollar figure in the business tools rested on three sources cited only in code comments. All three were fetched and cached, and the tools now distinguish a figure with a published source behind it from an assumption.
- **Every surface declares how it treats your role** [persona:curious]: nothing recorded which pages adapt to a role, so a broken adaptation and a deliberate decision not to adapt looked identical on screen. Both are now declared, which means the page can tell you when it is deliberately showing you everything rather than leaving you guessing.

### Fixed

- **One place to set who you are, instead of three** [view:/compliance] [view:/library] [view:/timeline] [view:/threats] [persona:curious] [persona:ops]: Compliance carried four filter controls at once — the role selector in the top bar, a trust-tier box floating on its own, a country/sector row inside the page, and a second copy of that same country/sector pair a little further down. Scope is now set in one place. The trust-tier control has been removed from all five pages that had one; links that already carry a tier still filter exactly as before.
- **Choosing your role in the top bar did nothing to the compliance page** [view:/compliance] [persona:executive] [persona:architect]: the page read your role once as it loaded and then stopped listening, so switching role updated the label at the top and left the page below it unchanged — still saying "Global", still empty. It follows the top bar now, and the region it shows is the region you picked.
- **"Country: Any" returned nothing at all** [view:/compliance] [persona:ops] [persona:architect]: choosing a sector but no country produced an empty page, which reads as "nothing applies to you" when it means "you have not narrowed this down yet". The register was matching your sector against the wording used in the source documents rather than the wording on the menu you picked from — so a bank looking for finance rules missed the hundred-odd rules filed as "Finance & Insurance". Picking a sector alone now lists every instrument for it. The same mismatch was also hiding rules that genuinely bind you: an organisation in France now sees ten mandatory instruments where it previously saw six.
- **The register is called Rules & Standards** [view:/compliance] [persona:curious] [persona:executive]: it was "Obligations", which promised more than the tab delivers — most entries are standards and certification schemes that apply to you, not legal duties, and the page separates those two things on purpose. Existing links to the tab still work.
- **The Cost of Inaction Analyzer said inaction was free** [persona:executive]: at its own defaults, with no binding mandate, it reported that delaying eight years cost less than migrating now — the opposite of the tool's entire premise, presented as a calculation. Two of its scoring axes also could not express the answer they were being asked for.
- **A tool attributed section titles to a NIST document that does not contain them** [persona:architect]: the headings it cited were invented. They now match the published document.
- **Five surfaces shipped unreachable** [persona:curious] [persona:ops]: found by opening the app and probing it rather than by reading the code — three in one round and two in another, including the simplified compliance view and the playground notice. Green tests had reported all of them fine.
- **The left rail is navigation again** [persona:curious]: it had drifted into explaining itself instead of moving you anywhere, and the role picker flickered when opened. The rail now says what it is for and gets out of the way, and the picker states the trade you are making when you choose a role.
- **A standards citation could not reach the standard** [persona:architect] [persona:researcher]: citations named a document without linking to it. They resolve now.
- **Unfilled template placeholders could leave the app** [persona:ops]: exported documents could carry raw `{{token}}` placeholders into a deliverable. The app warns before that happens.
- **The About page had no top-level heading** [persona:developer]: a screen-reader user landing on it had no page title to orient from.
- **The Learn modules are current again** [view:/learn] [persona:architect] [persona:developer]: every module has now been reviewed against its own cited sources — the backlog that had been stuck since March is cleared. Two modules blocked on unavailable evidence were closed against primary sources, and one long-standing error was corrected: a 17KB figure quoted as a certificate size is a whole certificate chain.

### Data

- **Seventy-nine library records gained a plain-language summary** [view:/library] [persona:researcher]: entries that gave a title and a link and nothing else now say what the document is and why it matters to the transition.
- **Duplicate Common Criteria certificates collapsed onto stable ids** [view:/migrate] [persona:ops]: the same certificate appeared more than once under different generated ids, so a product could look certified twice. The first attempt at this recomputed each id from fields derived after the fact, and a real scrape then disproved it — not one of the 889 ids it produced matched the 821 the pipeline actually mints, because a certificate showing no assurance level was hashed as the word "None" where the pipeline hashes an empty value. The cross-reference now maps onto the pipeline's own output by identity rather than by recomputed hash.
- **Seven Marvell certificates stopped being attributed to a Thales product** [view:/migrate] [persona:ops]: Azure Dedicated HSM runs Thales Luna 7 hardware while Marvell LiquidSecurity is Azure _Managed_ HSM — a distinction this release had already corrected once, with Microsoft's own overview as the evidence. Regenerating the certificate cross-reference brought the error back, because that run read the product catalogue as it stood before the correction. The seven rows are gone again, and the certificate list for both Azure services is accurate.
- **The authoritative-sources region field is nearly complete** [persona:researcher]: filled from 38% to 97%, so filtering sources by region stops silently hiding most of them.
- **Proof age is now tracked, not just displayed** [view:/migrate] [persona:ops]: the reader-facing half already showed how old each product's evidence was, but nothing tracked the backlog behind it. It does now — 114 claims whose proof document carries no publication date, and 120 more that are stale.

### Security

- **CI stops running files that are not in the repository** [persona:ops]: three new audit gates were wired into the pipeline and silently dropped by a catch-all ignore rule, so the pipeline was green locally and failed in CI with a missing-module error — the fifth time this exact failure has happened. A check now refuses a pipeline that references a file the repository does not contain.
- **A data-regression waiver with an expiry date** [persona:ops]: the gate that catches unexpected drops in record counts can now be waived for a known, dated reason instead of being switched off, and each source's identifier scheme is tested on its own.

## [4.47.0] - 2026-08-10

The About page stops stating eleven wrong version numbers about the app you are looking at; three library records stop citing organisations that were never registered; thirty-six compliance write-ups a tooling bug had quietly deleted are back; and quiz answers finally have somewhere to record which document their fact comes from.

### Added

- **Quiz answers can now say which document the fact came from** [view:/learn] [persona:curious] [persona:researcher]: every question linked to our own page about the topic, and nothing recorded the published document the correct answer actually rests on — so that part of the quiz's trust rating read a permanent "not applicable", with the stated reason that there was no field for it. A dimension declared unmeasurable never gets the column that would measure it. All 1,027 questions now carry a source and source link, empty for the moment and filled only by review — nothing invents one. The score reads 0 of 1,027, which is the honest number and the worklist.

### Fixed

- **The About page listed eleven wrong version numbers** [view:/about] [persona:developer] [persona:curious]: the page names by hand which version of some 88 components this app is built from, nothing ever checked it, and eleven were wrong in BOTH directions — it claimed React Router 7.17.0 where the app ships 8.3.0, and claimed a Framer Motion newer than the one actually shipping. Being confidently wrong on this page is worse than saying nothing, because a reader has no way to tell which of the 88 entries to trust. All eleven corrected, and the page is now checked against what the app really installs, so it cannot drift again unnoticed.
- **Three library records cited trusted sources that did not exist** [view:/library] [persona:researcher]: four citations resolved to nothing at all while every validation gate reported zero errors. Two organisations were added to the registry rather than repointed at the nearest existing one — the DoD Cyber Crime Center is a different organisation from DISA, and folding one into the other would have made the citation resolve while making it wrong.
- **Three claims in the Learn modules were false, found by reading them against their own cited evidence** [view:/learn] [persona:architect] [persona:developer]: the automated pass reported no contradictions in any of them. One module said the zero-trust architecture guidance cross-references the 2025 key-encapsulation guidance — impossible, since the former is from 2020, and our own cached copy of it contains no mention of the latter, of encapsulation, or even of "quantum". The same module called that 2025 document a draft (it went final in September 2025) and said it mandates hybrid key exchange (it specifies approved ways to combine keys). The HSM module's exercise answer overstated what module-level FIPS 140-3 validation covers for post-quantum algorithms.
- **A Learn module cited an initial public draft as though it were binding** [view:/learn] [persona:architect]: worse, the "evidence" cached for it was a landing page — a JavaScript shell containing none of the document. The real PDF, once downloaded and read, neither uses the language attributed to it nor sets the requirement the module built on it. The claim now rests on the documents that do establish it.
- **The architect's Explore card was the ops card with two synonyms swapped** [view:/] [persona:architect]: read next to the other five, its second sentence was word-for-word the ops board's and its first differed by two words. Six boards repeating each other is worse than five plus a gap — a reader moving between roles learns the cards are filler and stops reading the ones that do say something.
- **Twenty CI gates were being skipped on every pull request** [persona:ops]: a known-red security audit sat fifth in the job, and because a failing step aborts everything after it, formatting, linting, every data audit, the build, the unit suite and the browser smoke tests never ran. The pipeline reported failure while validating almost nothing, and both of the previous day's releases had that whole list run by hand instead. The audit now runs last. Its finding is unchanged and merging still needs an override; what changes is that the checks which can catch a regression get to run.

### Data

- **Thirty-six compliance maturity write-ups a tooling bug had deleted are restored** [view:/compliance] [persona:architect] [persona:ops]: the generator fix stopped the loss recurring but recovered nothing already lost. The damage was also larger than first reported — looking only for runs that reduced a document count found six files, but a run that drops nine documents while adding eight hides in plain sight. Walking every version of every file instead found 36 missing across ten, including the whole FIPS 140-3 implementation-guidance set and nine government policy documents.
- **One vocabulary for document types across the library** [view:/library] [persona:researcher]: the type field had grown to 92 different values over 804 records — 38 of them used exactly once, "Specification" and "specification" both present, Internet-Draft spelled three ways. It is now ten. Where a value named a subject rather than a kind of document, the row was resolved from what it actually cites rather than remapped by name. Records left blank are deprecated ones kept for completeness: picking a type for a record nobody curated would be inventing data to satisfy a check.
- **A product catalogue entry conflates two different Azure HSM services** [view:/migrate] [persona:ops]: Microsoft's own documentation says the Dedicated HSM runs Thales hardware, while the Marvell hardware belongs to the Managed HSM — the catalogue carries one row naming both. Reported rather than edited, since catalogue changes go through evidence review.

### Security

- **The search index the site answers from is now signed** [persona:ops]: the text corpus was attested but the 46 MB embedding index built from it — the thing that actually decides which passage an answer cites — was not. Both are now signed and verified. The list of what must be signed had been written down twice, once in the signer and once copied by hand into the verifier; both now read one shared file, and a test fails if the verifier grows its own copy again.
- **The three browser crypto engines were rebuilt from current source** [view:/playground] [persona:developer] [persona:ops]: the KMIP engine gained a classical-baseline TLS profile and was verified by running its own test suite inside the browser build rather than by trusting the build's exit code — including a hybrid post-quantum key exchange completing end to end. The other two rebuilt byte-for-byte identical, which is the expected result and the proof that nothing else moved.
- **Dependency updates** [persona:ops]: Playwright, the testing-library packages and Vitest coverage; the Tailwind group; the React flow-diagram library; and four GitHub Actions.

## [4.46.0] - 2026-08-12

The entropy tool now runs both of the health tests the NIST standard requires rather than one, and catches a bad sample it used to pass; the 5G tool finally admits it does post-quantum cryptography, so searching for it works; and every tool page gains a proper heading and a genuinely useful "try this next".

### Added

- **The entropy tester now runs both health checks the NIST standard asks for** [view:/playground] [persona:researcher] [persona:developer] [persona:architect]: it ran only the first of the two, which spots a source that gets stuck repeating one value. The second one — now added — spots a source that merely drifts toward a value without repeating it, which the first cannot see at all. This matters: the tool ships a deliberately-bad "Repeating Pattern" sample to demonstrate poor randomness, and that sample was quietly _passing_ the only health check it ran. It now fails, as it should.

### Fixed

- **The 5G tool no longer hides the post-quantum half of what it does** [view:/playground] [persona:developer] [persona:architect] [persona:researcher]: it builds concealed subscriber identities three ways, one of them post-quantum — but its catalogue entry mentioned only the classical algorithms. Searching the lab for ML-KEM returned thirteen tools and never this one, on a site about post-quantum migration. It now appears, and the description says what it actually offers.
- **Searching for "post-quantum" now finds post-quantum tools** [view:/playground] [persona:curious] [persona:executive] [persona:developer]: typing the subject of the entire site matched two tools out of thirty-four, because most entries were written using the abbreviation instead. Both spellings now find the same things, as do the older names for the algorithms — searching Kyber, Dilithium or SPHINCS+ finds ML-KEM, ML-DSA and SLH-DSA.
- **The firmware signing tool lists all four algorithms it offers** [view:/playground] [persona:developer] [persona:ops]: it advertised one, and not even the one it starts you on.
- **Two unfinished tools now say they are unfinished** [view:/playground] [persona:developer] [persona:architect]: the certificate enrollment and group messaging tools are still early, but looked exactly like finished ones. They now carry the same work-in-progress notice other early tools do, and a new check stops any future early tool shipping without it.
- **The developer sandbox page stopped showing visitors a terminal command** [view:/playground] [persona:developer] [persona:ops]: when the container isn't available — which is the normal case for anyone browsing the site — the page told you to run a Docker command inside a folder that only exists on a maintainer's laptop. It now explains what the sandbox is and points at the access request.
- **"Try this next" now suggests where you actually are** [view:/playground] [persona:curious] [persona:developer]: every tool in a category recommended the same two tools, so following the suggestion from most tools sent you in a small circle.
- **Every tool page now has a proper main heading** [view:/playground] [persona:curious]: all but one opened with no top-level heading, which makes a page harder to navigate with a screen reader.
- **The "reviewed" mark now says what it means** [view:/playground] [view:/learn] [view:/library] [view:/compliance] [view:/migrate] [view:/timeline] [persona:researcher] [persona:executive]: it showed a name and a date but never the word "reviewed", so it did not read as the counterpart to the "Unreviewed" mark beside it. Checks done by an automated pass are now labelled as such, rather than looking the same as a person signing something off.

### Data

- **The JWT tool's encryption reference now names the exact draft it follows** [view:/playground] [view:/learn] [persona:developer] [persona:architect]: the internet draft it cites was rewritten in July and no longer covers this use at all. The lesson is correct against the earlier version, so it now says which version, explains what changed, and links to that version rather than to a page that would show a reader something different from what they just ran.

## [4.45.0] - 2026-08-09

Whichever role you pick, your home page now reaches every part of the site rather than a sixth of it; the protocol readiness matrix stops overstating how far six protocols have actually got; the quiz gains questions for the two audiences that had the fewest; and compliance maturity coverage grows from four source documents to forty-eight.

### Added

- **Your home page now reaches the whole site, whichever role you picked** [view:/] [persona:executive] [persona:developer] [persona:architect] [persona:researcher] [persona:ops] [persona:curious]: each role's home page offered six destinations, so most of the site was only one click away if you happened to have chosen the "right" role — and invisible otherwise. Every role now opens onto all eighteen sections, with six use cases apiece written for that role, and the cards in each board's grid are links in their own right rather than decoration. A new check fails the build if any role ever stops reaching any section, so this cannot quietly erode again.
- **Twelve new quiz questions for the two audiences that had the fewest** [view:/learn] [persona:curious] [persona:executive]: someone arriving simply curious had 103 questions available to them against an architect's 630 — six times fewer, for the widest possible audience. Eight new questions are written in plain language for that reader, and four more for executives cover the decisions they actually face: what to ask a vendor, what the 2030 and 2035 dates really bind you to, and what the budget shape looks like.
- **Forty-four more people in the PQC community roster** [view:/leaders] [persona:researcher] [persona:curious]: 345 entries to 389.

### Fixed

- **Six protocols in the readiness matrix were shown one stage further along than they are** [view:/algorithms] [persona:architect] [persona:developer]: TLS 1.3, DTLS 1.3, FIDO2, MACsec and S/MIME each read as further through standardisation than the IETF's own record supports, because a working group handing a draft to the IESG had been recorded as the later IESG review step. All six now match what the datatracker actually says, checked by hand rather than taken from the feed. Six further changes the feed proposed were deliberately not made: each rested on a related enabling document rather than on the mechanism for that protocol.
- **Hand-written notes in the readiness matrix are no longer overwritten by the updater** [view:/algorithms] [persona:architect]: an automated refresh could replace a multi-line, human-verified explanation with a generated one-line summary — including, on one run, a note that existed specifically to record an earlier mistake and stop it recurring. The updater now leaves any note a person wrote alone and reports it instead.
- **The "just curious" home page works on a phone again** [view:/] [persona:curious]: its mobile board could not be reached at all, and what it showed was hard-coded rather than drawn from the same content as every other role.
- **Two compliance records now link to the document they rely on, not a company homepage** [view:/compliance] [persona:architect] [persona:ops]: the UAE National Encryption Policy and the TCG TPM 2.0 entries each cited a site's front page, which cannot evidence the requirement claimed against it. Both now point at the actual published document.
- **Search now ranks documents that have been replaced by a newer version properly** [view:/library] [persona:researcher] [persona:architect]: when a standard or draft was superseded, anything citing the older version lost its trust rating entirely and was ranked as an unknown source — below results from sources we actually rate lower. Those citations now inherit the rating of the document that replaced them. It affects 97 compliance maturity requirements and 15 document summaries.
- **Forty-five quiz questions no persona filter could ever reach are back in circulation** [view:/learn] [persona:architect] [persona:developer] [persona:ops] [persona:executive]: their persona tags were separated with commas where the quiz reads them as pipe-separated, so those questions matched nobody and silently never appeared. Architects regain 45, developers 36, ops 6 and executives 2.

### Data

- **Known-vulnerability data rebuilt against the current product cross-reference** [view:/migrate] [persona:ops] [persona:developer]: it had been generated from a superseded product file. Now 153 products and 1,152 vulnerabilities.
- **Industry Landscape: the crypto each of three industries actually relies on, filled in from their own cited documents** [view:/algorithms] [persona:researcher] [persona:architect]: payment ecosystems, telecoms subscriber security and rail signalling. The remaining incomplete rows were left blank on purpose — for most of them, the cited document genuinely contains no post-quantum content, and an honest blank beats a plausible guess.
- **Compliance maturity coverage goes from four source documents to forty-eight** [view:/compliance] [persona:executive] [persona:architect] [persona:ops]: 82 requirements to 475. The first four were the EU payment services directive, the ASC X9 financial-services quantum risk report and two ENISA reports — documents the extraction had been stopping partway through. A full sweep then took the same treatment across the rest of the catalogue: certification schemes, standards bodies, government policy and technical standards, including a re-read of KMIP and the NIST assessment guidance. Where a document was skipped, that is recorded rather than left as a silent gap.
- **Forty-six people in the community roster still have no peer-review status, down from a hundred and twenty-one** [view:/leaders] [persona:researcher]: each classification says whether that person's own named technical work has actually completed formal peer review or standardisation, verified against a primary artefact rather than inferred. Eight entries that recorded a citation where a person's name belongs now name their real authors.
- **Dead and redirected links repaired across the community roster, vendors and patents** [view:/leaders] [view:/migrate] [view:/patents] [persona:researcher] [persona:ops]: fifteen or so links that had rotted — a renamed BSI path, two vendor pages that moved, and one that looked missing but turned out to be a page returning a "not found" message with a success code, so no automated check had ever caught it. Neither patent flagged as missing was fabricated; both were real and simply relocated.
- **Eleven more compliance records name the standards they depend on** [view:/compliance] [persona:architect].
- **Nine more product certification links** [view:/migrate] [persona:ops].

### Security

- **Refreshing the site's search index no longer takes 40 minutes for no reason** [persona:ops]: the index file stamps itself with the time it was built, so rebuilding it looked like a change even when nothing had actually changed — and the freshness check then demanded a full rebuild. It now compares the content itself. It still catches a genuinely edited entry, which is what the check exists for.
- **A build check that could never have run is now able to run** [persona:ops]: the check that proves every role's home page reaches every section was added without the file it invokes, so it would have failed to start on any machine but the one that wrote it. Third time this particular trap has caught a check here; the rule that hides these files now names it explicitly.

## [4.44.1] - 2026-08-09

Product catalog corrections: a tool that has shipped for weeks stops being listed as unfinished, two rows that contradicted their own descriptions are resolved, and rows claiming post-quantum support now say which algorithms they actually mean.

### Fixed

- **A working KMIP server was listed as still in development** [view:/migrate] [persona:architect] [persona:developer] [persona:ops]: the pqctoday-kmip entry said "planned / in-development" and credited a third-party library it does not use. Running it shows the opposite — it creates and signs with ML-DSA-65, does ML-KEM-768 key establishment, and runs on our own software HSM. The claim came from a research pass that never executed the thing it described.
- **25 catalog entries said "yes, with details" and then named no details** [view:/migrate] [persona:architect] [persona:ops]: each made an unqualified post-quantum claim with no algorithm behind it. All 25 now name the algorithms their own capability descriptions already documented. Nine further rows were deliberately left unfilled, because their own text names no specific algorithm and inventing one is the defect being fixed.
- **Two entries contradicted their own descriptions** [view:/migrate] [persona:developer]: SOPS is now marked as delegating post-quantum key wrapping to its age plugin rather than providing it directly, and osslsigncode is marked partial — its ML-DSA-65 signing is real, its Windows validation chain is not post-quantum capable.

### Data

- **Four tools added to the migrate catalog** [view:/migrate] [persona:developer] [persona:ops]: the software HSM, benchmark harness and age plugin the sandbox has been running with no catalog entry at all, plus OpenSSL 3.6 — recorded with the fact a reader adopting it most needs, that 3.6 is not a long-term-support branch and reaches end of life on 2026-11-01.

## [4.44.0] - 2026-08-08

Compliance maturity coverage more than quadruples as documents that were being read only part-way through are now read in full, a batch of library entries that pointed at landing pages get their real source documents, invented requirements are removed, and installing the site for offline use gets dramatically lighter.

### Added

- **Compliance maturity coverage more than quadruples — from 48 tracked requirements to 200** [view:/compliance] [persona:executive] [persona:architect] [persona:ops]: the extraction had been stopping part-way through long documents, so anything past that point was invisible. Re-reading them end to end surfaced 152 more requirements, including a GSMA guidance document whose extraction a timeout had cut off mid-way.
- **15 new documents in the library, and 24 compliance records now link straight to the source document they are based on** [view:/library] [view:/compliance] [persona:researcher] [persona:architect]: previously several records cited a framework without any way to open the thing they cited.

### Fixed

- **Installing the site for offline use is roughly three times lighter** [view:/] [persona:curious] [persona:ops]: the install was pulling down all 161 archived vendor proof documents — around 55 MB of evidence pages nobody needs to start the app — which pushed the offline install to 53.64 MB across 264 files. It is back to 16.82 MB across 103. The proof documents are still available; they now load when you open one instead of all at once, up front.
- **Vendor proof documents open properly instead of showing the site's own home page** [view:/migrate] [persona:architect] [persona:ops]: following a proof link handed back the app shell rather than the evidence page.
- **Invented requirements removed, and repaired records for Canada's CSE and FIPS-198** [view:/compliance] [persona:executive] [persona:researcher]: a set of CMMC, NZISM and KMIP requirements did not exist in the documents they claimed to come from, and have been withdrawn rather than left in place.
- **12 library documents pointed at a landing page instead of the document itself** [view:/library] [persona:researcher]: each now resolves to the real source.
- **Three broken tool links in the sandbox scenarios** [view:/playground] [persona:developer]: they pointed at repositories that have moved or never existed.

### Data

- **The SSH sandbox scenario now covers OpenSSH 10.4 and compares two post-quantum signature schemes side by side** [view:/playground] [persona:developer] [persona:architect]: a hardware-backed ML-DSA-65 key next to OpenSSH's own software-only composite scheme — the same handshake, with the difference being where the key actually lives.
- **The migrate catalog gains the pqctoday-strongswan-pkcs11 fork** [view:/migrate] [persona:developer] [persona:ops].
- **Every in-browser crypto engine rebuilt against the current HSM release, and OpenSSL moved to 3.6.3** [view:/playground] [persona:developer] [persona:architect] [persona:ops]: the KMIP, PKCS#11, SSH and OpenSSL engines that run inside your browser had drifted behind the HSM they are built from. All five were rebuilt and re-verified in a real browser — a live SSH handshake signing with ML-DSA-65 and a full hybrid ML-KEM key exchange, and a KMIP round trip that creates a key, signs with it, and verifies the signature entirely in WebAssembly.

## [4.43.0] - 2026-08-08

Algorithm status pages get corrected for two real misclassifications, threat and timeline records gain dozens of missing links and cross-references, the PKI CRL workshop stops mislabeling a duplicate certificate, and About is reachable from mobile navigation again.

### Fixed

- **About is reachable from the mobile navigation menu again** [view:/about] [persona:curious]: it was missing from the mobile "More" sheet — reachable on desktop only.
- **The CRL Generator workshop no longer lists a phantom duplicate certificate, and explains real failures instead of a bare status code** [view:/learn] [persona:developer] [persona:architect]: OpenSSL Studio's own achievement tracking was silently mirroring every certificate a second time, and that mirror could show up in the revocation list as a duplicate — or, for the CA's own certificate, as itself. Error messages from failed OpenSSL operations now show the actual reason instead of just "exited with an error."
- **Two algorithm status mislabels corrected** [view:/algorithms] [persona:researcher] [persona:architect]: SMAUG-T, NTRU+, HAETAE and AIMer were still shown as "Round 1 candidates" — they're South Korea's actual 2025 KpqC competition winners. Separately, Aigis-enc and Aigis-sig were mislabeled as Korean KpqC submissions; they're Chinese CACR submissions and are now linked to their real source.
- **Timeline and Compliance cross-references filled in** [view:/timeline] [view:/compliance] [persona:researcher] [persona:ops]: 5 new government milestones added (Australia's APRA, France's AMF, Brazil's BACEN, Uruguay's AGESIC, plus a Denmark record correctly relinked instead of duplicated), 15 records got their missing source-authority link resolved, and a Thailand record's protocol claim was corrected after tracing a fabricated version number back to its source.
- **Every threat-landscape record now links to the Learn module that explains it** [view:/threats] [persona:ops] [persona:developer]: the last 21 records missing that link have been filled in by hand.
- **Three role-board tiles showed a placeholder label instead of a real one** [persona:executive] [persona:developer] [persona:architect] [persona:ops]: the developer, architect and ops boards' capstone tile said the literal word "capstone" instead of a real title.

### Security

- Patched 3 known vulnerabilities in bundled third-party libraries: a sanitizer bypass, a diagram-rendering prototype-pollution/DoS issue, and an ID generator that could loop indefinitely on bad input. A 4th (an image-dimension parser, pulled in by the PPTX export feature) has no upstream fix available yet; we've confirmed the affected code path isn't reachable from anything this site actually does with it.

## [4.42.0] - 2026-08-07

The app installs roughly 250 MB lighter and works offline sooner, algorithm pages let you read a spec or try a tool without losing your place, and Compliance's maturity data is reconnected after a data-archival sweep silently broke it.

### Added

- **Algorithm pages let you read the spec or try a tool without losing your place** [view:/algorithms] [persona:developer] [persona:researcher] [persona:architect]: the Spec and Try links on every algorithm's CTA row used to navigate you away, so opening a spec meant re-applying your filters and sort when you came back. Both now open in place — a specification drawer or an in-workshop try panel over the page you were already on.
- **Patents now has a Sources button, like every other data page** [view:/patents] [persona:researcher]: it was the only page missing one. The gap wasn't a missing button — neither of the two source registries the site tracks contained a single patent-issuing authority. Every one of the 1,185 patent records is now traceable to the USPTO record of grant.
- **The crypto lab warns you before you open a tool your device can't run** [view:/playground] [persona:developer]: opening a tool that needs SharedArrayBuffer or a Chromium-based browser used to just spin until it silently failed. It now names the missing capability up front.
- **Command Center's filters are shareable** [view:/business] [persona:ops] [persona:architect]: search, category, CSWP.39 zone, framework phase and audience filters used to reset on navigation. A filtered view can now be linked, bookmarked or shared and comes back exactly as you left it.
- **Developers get a report built for developers** [view:/report] [persona:developer]: every other role had a tailored readiness report; picking the developer persona silently fell back to the generic, no-persona version. It now opens with your CBOM, discovery and migration-toolkit sections up front.
- **A "Runs on this device" filter in the crypto lab** [view:/playground] [persona:developer]: the device-capability badge on each tool card already told you which ones your browser can run; there was no way to filter to just those. One toggle now hides everything your device can't run, using the exact same check as the badge so the two can never disagree.
- **Command Center's tool grid can be grouped by framework phase or CSWP.39 zone** [view:/business] [persona:ops] [persona:architect]: every tool already carried both, but you could only narrow to one at a time, not see the whole catalogue organized that way. A "Group by" selector sits alongside the existing filters; Category stays the default.
- **Crypto lab tools link back to the module that explains them** [view:/playground] [persona:developer] [persona:curious]: modules already linked forward to their related tool; opening a tool with no learning context had no path back. Tool detail now shows a "Related module" row wherever one exists.

### Fixed

- **Compliance's maturity and governance requirements are reconnected on every pillar** [view:/compliance] [persona:executive] [persona:architect] [persona:ops]: a data-archival sweep on 07-26 silently broke the link between three cited documents and the maturity corpus that powers the pillar view. The corpus is restored and reconnected across all pillars, with a new coverage-merge check to catch the next silent loss before it ships.
- **Compliance detail tiles no longer overflow their own card** [view:/compliance] [persona:executive]: long framework text spilled out of its tile. Review provenance — who reviewed it, and when — now lives in the detail view instead of competing for the same cramped space.
- **The CT Log simulator's Certificate Authority can now sign, not just verify** [view:/learn] [persona:developer] [persona:architect]: the key inspector only ever registered the CA's public key, even though every Signed Tree Head is signed with the private half it never showed — so the panel displayed a CA that verified but apparently could not sign.
- **Eight real accessibility violations fixed across the business and crypto-lab tools** [view:/business] [view:/playground] [persona:ops] [persona:researcher]: unlabelled form fields on every business tool (37 tools share one builder), three tooltips a screen reader couldn't read, contrast failures on the secondary button and info text in both themes, and in-paragraph links only distinguishable by color. This is the first real accessibility scan of this tier — it had been excluded from the page-level scan because the tools' WASM load times made a scan unreliable.
- **The Algorithms "FIPS-validated" and "NIST picks" quick views now show the right rows** [view:/algorithms] [persona:researcher] [persona:architect]: "FIPS-validated" matched any row tagged Certified, which includes non-FIPS regional standards (AIMer, HAETAE and others tiered "regional" precisely because they are not FIPS-certified). "NIST picks" matched only Lattice-family rows, which silently excluded SLH-DSA — a Hash-based standard and one of NIST's three named picks. Both now check the row's real FIPS designation instead.
- **The homepage's "continue where you left off" banner is back** [view:/] [persona:curious] [persona:developer]: it rendered unconditionally on the old generic hero; the persona-journeys redesign replaced that hero for anyone with a role selected — the majority of visits — and dropped the banner along with it, by omission rather than decision. Restored for returning visitors.
- **The executive algorithm card gives EU visitors EU-correct guidance** [view:/algorithms] [persona:executive] [persona:architect]: the card's compliance pick list was written for US/NIST FIPS requirements and shown to every region unchanged. BSI and ANSSI don't just prefer different algorithms, they disagree on the rules themselves — ANSSI does not consider standalone (non-hybrid) ML-KEM or ML-DSA compliant at all, where BSI does. The card now reflects each authority's own published guidance rather than one blended answer.
- **The side panel's tab row hints when there's more to scroll to** [persona:developer] [persona:ops]: at an ordinary 1280px desktop width, the panel's own column is too narrow to show all five tabs at once, quietly hiding Bookmarks and FAQ off the right edge with no sign they existed. The row already scrolled, it just never said so — it now fades at the edge and is keyboard-scrollable.
- **Every row in the main navigation is reachable in one keyboard stop, not two** [persona:ops] [persona:researcher]: the desktop rail, mobile bottom row, and both sections of the mobile "More" sheet each rendered a real button nested inside a real link — invalid HTML that gave keyboard and screen-reader users two separate stops and two announcements per row, doubling the keystrokes to reach anything. Each row is now a single focusable, accessible element; sighted mouse and touch behavior is unchanged.

### Changed

- **First-visit install size cut by roughly 250 MB** [persona:developer] [persona:ops]: the offline install used to pull in every WASM crypto engine, every infographic and every route's JS chunk before it could finish — 289 MB across 927 files, up to 81 seconds, with zero offline capability until it completed. Only what's needed to boot is precached now; everything else loads once on first use and is cached from then on, so the app installs in a fraction of the time and works offline sooner. A new build gate fails the build if the install payload creeps back up.
- **Search loads only when you open it** [persona:developer]: the search index and trust-score data, about 21 MB, used to load on every page whether or not you ever opened search. It now loads the first time you open the search box.
- **The crypto lab grid shows browser-runnable tools by default** [view:/playground] [persona:developer]: roughly 41% of the tool cards were Docker-only sandbox scenarios mixed in with the 34 tools that actually run in your browser. The grid now defaults to what you can run here, with the rest one click away.
- **Search finds workshop and business tools even on broad queries** [view:/] [persona:developer] [persona:ops]: a broad query like "ML-KEM" could push the two tool registries out of the results entirely, since they're a small slice of a much larger document corpus. Tool results are now guaranteed a slot.
- **The vendor roadmap tracker states its real denominator** [view:/migrate] [persona:executive] [persona:ops]: the headline count of vendors with a published roadmap didn't say what it was a fraction of, reading like a count of the whole field. It now spells out "of N vendors with a stated PQC commitment" plainly.

## [4.41.0] - 2026-08-02

Every role's home page now offers three different ways in rather than one, each
pointing at its own tool, and the numbers those pages quote are computed rather
than typed. The PKCS#11 playgrounds gained a live call log and a real view of
what is on the token, and every crypto engine on the site was rebuilt current.

### Added

- **Your role's home page now offers three ways in, not one** [view:/] [persona:executive] [persona:developer] [persona:architect] [persona:researcher] [persona:ops] [persona:curious]: each role opens on its own board and can switch between the three most common reasons someone in that role comes here — 18 boards in total, each with its own headline, evidence, tools and next steps. The three options come from the migration phases the site already models for your role, not from a marketing list. Your choice is remembered, and a link you share shows the board you were looking at rather than the reader's own saved preference.
- **OpenSSL Studio shows what the security token actually did** [view:/playground] [persona:developer] [persona:ops]: it was the only hardware-token playground with no call trace — you saw friendly narration and timings but never the real operations, or whether one failed. It now shows the same live call log the HSM Workshop, VPN and SSH simulators do, with the token's genuine success or error code for each call. The panel also states plainly which work it can and cannot see, so an empty log is never mistaken for an idle token.
- **You can now read what is really stored on the token** [view:/playground] [persona:developer] [persona:ops]: the Studio's key list only ever showed keys _it_ had created in the current session, so it missed keys made in another tab or restored from a saved snapshot, and it kept listing keys the token no longer held. A new "Read from token" button asks the token for its real inventory. It deliberately never attempts to read private key material — that is the wrong habit to learn, even where the token would correctly refuse.
- **The SSH simulator shows the keys it created** [view:/playground] [persona:developer] [persona:ops]: the VPN simulator has always shown a key inspector per peer, and both generate keys through the same engine — but on the SSH side the log told you what happened while nothing told you what now exists.
- **The TPM inspector shows how many temporary slots are in use** [view:/playground] [persona:developer] [persona:architect]: it only ever reported the permanent storage area, while the 3-slot temporary budget that Learn, the Command Builder, Compliance and Attestation all draw on was invisible — even though running it out is a real and confusing failure. The count is read from the TPM itself, so it includes objects created in other tabs, and "couldn't ask" stays clearly distinct from "none in use".
- **Replaced keys show what they superseded** [view:/playground] [persona:ops] [persona:architect]: rekeying recorded the link between the old and new key but only displayed it in the Migration tab, so anyone working from the Agility Workbench saw two unrelated rows. The keystore table now shows the lineage.

### Fixed

- **Fourteen tool links on the role home pages opened the wrong page** [view:/] [view:/business] [persona:executive] [persona:developer] [persona:architect] [persona:researcher] [persona:ops] [persona:curious]: every business-tool button on the new role boards led to the executive home board instead of the tool it named. Nothing appeared to fail — you simply landed somewhere plausible and wrong. All fourteen now open their real tool, and the check that missed this was tightened so a link that resolves to the wrong page fails the build rather than passing quietly.
- **The researcher's field watch reported zero updates to everyone, permanently** [view:/] [persona:researcher]: it compared each document's publication date against the moment _you_ last visited, which can only ever count documents published since your last visit — and as the newest document in the catalogue dates from June, every visitor since then saw "0 revisions" on every field they follow, no matter how much had changed. It now reports what changed in the current release of the library, the same question for every visitor, and shows real counts. Its headline also claimed nothing _you had cited_ was retracted, which was never something this site could know.
- **The exposure card drew the wrong conclusion from its own numbers** [view:/] [persona:executive] [persona:researcher]: it listed twelve years of data secrecy and a five-year migration, then told you to start by 2028 — a date that ignored the twelve-year figure printed directly above it, and which the Threats page contradicted by twelve years for the same question. Working the standard calculation properly (a quantum computer around 2033, minus twelve years of secrecy, minus five years of migration) the honest answer is that the window to protect data encrypted today closed in 2016. The card now says so, and shows its full working, matching how the Threats page already reports a deadline that has passed. The quantum-computer date is also now taken from the site's single source rather than typed, so neither figure can drift from the numbers above it.
- **Opening a Learn module could complete it before you had read anything** [view:/learn] [persona:curious] [persona:developer]: sections were marked read the instant they appeared on screen, so on a module with one section left, simply opening it triggered the "Module complete" celebration — reported from the live site. A section now has to stay on screen long enough to actually be read, and scrolling straight past no longer counts.
- **A failed Root CA step left an unusable key behind** [view:/learn] [persona:ops] [persona:architect]: the PKI workshop saved the private key before creating the certificate, so if certificate creation failed the key stayed in your keystore with no certificate. The next step then told you no Root CA existed and to go back and make one — while the orphaned key sat visible in the dropdown. The key and certificate now save together or not at all, and a failed attempt says clearly that nothing was kept.
- **Boards pointed at tools they did not describe** [view:/] [persona:executive] [persona:developer] [persona:architect] [persona:researcher] [persona:ops] [persona:curious]: the same handful of destinations were reused across many boards — one tool appeared on six of them — while the "what you walk out with" items often described something the board did not link to at all. Every board now has its own tools, no destination is used twice, and each board's three promises map onto its own links. One link was removed entirely because it led to a page that first demands you complete an assessment.
- **Modern elliptic-curve keys were filed as symmetric keys** [view:/playground] [persona:ops] [persona:developer]: X25519 and X448 keys found on a token were recorded in the key inventory as AES keys, which misreads both what the key is and what it can do.
- **Resetting the VPN simulator left sessions open on the token** [view:/playground] [persona:ops]: each reset discarded the on-screen state but not the token sessions behind it, so repeated runs accumulated open sessions for as long as the page stayed loaded.
- **Writing a key "to the token" could silently produce an exportable file instead** [view:/playground] [persona:developer] [persona:ops]: a command written one way reads as though it generates the key inside the token, but it actually writes an ordinary exportable private key to the workspace and leaves the token empty — after which later commands cannot find the key. It now warns before running and names the option that genuinely creates a token-resident key. It stays a warning rather than a block: this is a teaching tool, and the mistake is worth seeing.

### Changed

- **Every crypto engine on the site was rebuilt current** [view:/playground] [persona:developer] [persona:ops] [persona:architect]: the security-token engine behind the HSM Workshop, the TPM bridge, the MLS workshop and the SSH simulator was months out of date, and the OpenSSL build was a patch release behind. All six engines are now current and OpenSSL Studio reports 3.6.3. Signing operations that recover the original message, which the engine supported but the site reported as unimplemented, now work.
- **The MLS workshop says which implementation you are driving** [view:/playground] [persona:developer]: its architecture table describes the production server component, which read as a description of what the browser workshop runs. Both are genuinely token-backed, which made the distinction easy to miss, so it is now stated.

### Security

- **Token isolation and login fixes** [view:/playground] [persona:ops] [persona:developer]: the rebuilt security-token engine includes fixes for a login race condition and for isolation between separate tokens, so operations in one cannot affect another.

## [4.40.0] - 2026-08-02

Text and controls across the light theme now meet the WCAG AA contrast
standard, and the navigation loses three controls that duplicated the top bar.

### Fixed

- **Small text is readable again throughout the light theme** [view:/] [view:/timeline] [view:/library] [view:/compliance] [view:/migrate] [persona:executive] [persona:ops] [persona:curious]: the teal, green, amber and red used for labels, chips, badges and counts were picked to work as background fills and were too pale to read as text — several fell below half the contrast the accessibility standard requires, and worse again where coloured text sat on a tinted chip of the same colour. Every one of those colours is now dark enough to pass, adjusted by the smallest amount that does so, so the palette still looks like itself. Dark mode is unchanged; it already passed.
- **Cards, table rows and framework tiles work with a keyboard and a screen reader** [view:/library] [view:/threats] [view:/compliance] [view:/migrate] [persona:researcher] [persona:ops]: these were built as one big clickable block that also contained its own buttons — bookmark, add-to-plan, review badges — so assistive technology announced the whole card as a single control and the buttons inside it could not be reached at all. Each card now has a proper focusable title, and the controls inside it are reachable on their own. Clicking anywhere on the card still works.
- **The achievement celebration appears when you earn it, not later** [view:/learn] [persona:curious] [persona:developer]: an award earned by finishing a module was often saved unshown and then popped up at a random later moment — typically the next time you opened a different module, making it look like opening a module had completed it. Celebrations are now shown in the moment or not at all; the award itself is still recorded and still appears in your badges.
- **Horizontally scrolling strips can be scrolled without a mouse** [view:/compliance]: keyboard users could not reach or move them.

### Changed

- **The assistant and your journey map are both in the top bar** [view:/] [persona:executive] [persona:developer] [persona:architect] [persona:researcher] [persona:ops] [persona:curious]: the large floating assistant bubble that followed you around every page is gone, along with the single leftover icon at the bottom of the left bar. "Ask" is now "Assistant", and "Journey" sits next to it. Embedded copies of the site keep the floating button, since they have no top bar.
- **The Reference group in the left bar starts open** [view:/] [persona:curious] [persona:researcher]: Algorithms, Library, Community, Patents, Timeline and Threats were hidden behind a collapsed section on a fresh visit. It can still be collapsed.
- **The Learn page is less crowded** [view:/learn] [persona:curious] [persona:executive]: the role selector has gone — it was a second copy of the one in the top bar — and "Guided routing" is now a third choice alongside My Path and Browse all, rather than a separate button above them. Quiz moves up beside the page description. Two panels that only re-offered modules already on your path were removed: the assessment shortcut, which frequently recommended modules you had already finished, and the "PQC for Your Organization" strip, whose modules were all already in the executive path.
- **Role pages promise what they actually deliver** [view:/] [persona:ops] [persona:executive]: the IT Ops page asked "Will your HSMs survive the cutover?" above a tool that sizes fleets rather than answering that; "Size my fleet" opened the wrong tool entirely; and "Import my cert inventory" offered something the site cannot do. The executive page's "See a finished example" led to an empty report instead of the example. All four now match reality, and the worked example is available to every role.

## [4.39.1] - 2026-08-02

### Fixed

- **PQC 101's key generation works in both panes again** [view:/learn] [persona:developer] [persona:curious]: workshop step 3 generates a classical key and a post-quantum key, both written to the same filename. The second one to run reported "key file not produced" even though it had generated a real key — the browser's file store recognised the name as already present and never announced that the contents had been replaced. Whichever pane ran second failed, regardless of algorithm.
- **Learn is visible on the left bar without expanding anything** [view:/] [persona:curious] [persona:developer]: it sat inside the Reference group, which starts collapsed, so on a fresh visit it wasn't on screen at all — grouped with standing lookup material despite being a primary destination. It now has its own row directly under Home.

## [4.39.0] - 2026-08-02

A round of genuine bug fixes found by re-checking last week's UX audit against the actual code — a migration deadline that displayed a date in the past, filters that returned nothing, links that went nowhere, and a Share button that sent people to an empty page. Also roughly 26 MB less to download on your first visit.

### Fixed

- **The Threats page no longer shows a migration deadline that has already passed as if it were upcoming** [view:/threats] [persona:executive] [persona:architect]: for sectors with long data-secrecy requirements the Mosca calculation genuinely lands in the past — for government and defence it's 2003 — but it was printed as a bare year under "Your migration deadline", which read like a broken calculator. It now says plainly that the window closed and how many years ago, keeping the real number and the real (uncomfortable) conclusion intact.
- **The Algorithms region filter actually returns results** [view:/algorithms] [persona:architect] [persona:researcher]: 7 of its 10 options silently returned nothing because the filter list and the underlying data used different names for the same regulators. The list is now built from the real values in both data files, and a guard test fails the build if they drift apart again.
- **Sharing your readiness report now sends a working link** [view:/report] [persona:executive]: the top-bar Share button sent a bare page address, so recipients landed on "No Report Yet" while the sender saw a success message. It now shares the same self-contained link the in-page share button always produced.
- **The Migration Workbench feeds the Roadmap Builder again** [view:/migrate] [persona:ops] [persona:architect]: products chosen in the workbench never reached the Roadmap Builder, and saving or restoring your work silently discarded the plan entirely. Both now read your real selection.
- **Migrate's references to learning modules are clickable** [view:/migrate] [persona:developer] [persona:ops]: 749 curated module references rendered as plain text with nowhere to go. Product identifiers (CPE/PURL) now link out too.
- **Patent links to algorithms work for older patents** [view:/patents] [persona:researcher]: patents filed before standardisation use the original names — Kyber, Dilithium, SPHINCS+, Falcon — while the Algorithms page uses the final FIPS names, so more than half the links went nowhere. Working links went from 44% to 66% of patents.
- **First-time visitors can reach the whole site from the desktop menu** [view:/] [persona:researcher]: anyone who hadn't picked a role — including every first-time visitor — saw only five menu entries, with no route at all to 13 destinations including the readiness check and report. On phones the full menu had been there the whole time.
- **The Compliance table view can open framework details** [view:/compliance] [persona:executive]: only the card view could; clicking a table row did nothing. Shared links pointing at a specific framework now open it, rather than briefly highlighting it.
- **The Library's top pick for executives opens** [view:/library] [persona:executive]: the first "Start here" recommendation pointed at a document that had since been renamed, so it was a dead click.
- **OpenSSL Studio shows the right documentation for post-quantum algorithms** [view:/openssl] [persona:developer]: the per-command help never matched any PQC algorithm, so it always fell back to a generic page.
- **The curious mobile home screen's buttons work** [view:/] [persona:curious]: both main buttons did nothing when tapped.
- **The About page no longer describes a cloud-sync control that doesn't exist** [view:/about]: it told you that you could turn sync off from the home page. There is no sign-in anywhere in the app, so sync can't be turned on or off at all — the page now says so.
- **Migrate's page header stays put** [view:/migrate]: it shifted position depending on whether you had anything selected to share, and carried a second Share button of its own. Share now lives only in the top bar, as on every other page.

### Changed

- **About 26 MB less to download on your first visit** [persona:developer]: eight superseded copies of the library enrichment data were being bundled into the app even though only the newest is ever read.
- **The footer year is computed rather than hardcoded**, so it stops going stale.

### Added

- **Phone-sized browser testing** [persona:developer]: the automated test suite ran only at desktop sizes, on a product where the phone experience is the weakest area. A mobile test run now exists (not yet gating merges).

## [4.38.0] - 2026-08-02

A page-by-page pass across Algorithms, Compliance, Library, Migrate, Playground, Threats, Timeline, and the Command Center — unlocking content that was gated for no good reason, replacing hand-typed lists with the real catalogue behind them, and giving pages honest error states instead of silent blank ones.

### Added

- **Algorithms shows the ACVP verification claim up front** [view:/algorithms] [persona:developer] [persona:researcher]: "verified against NIST ACVP vectors in your browser" was two clicks deep inside the Validation tab; it's now a badge in the page header that jumps straight there.
- **Timeline shows how fresh each country's data is** [view:/timeline] [persona:researcher] [persona:ops]: a per-country "Verified" date now appears next to each flag, and per-region cards show how many countries have reached Migration or Standardization. The verification dates have been collected since July but were never shown anywhere.
- **Library shows corpus health at a glance** [view:/library] [persona:researcher]: active vs. deprecated document counts, with the reasons, as a header chip.
- **Migrate covers vendors who have announced a roadmap, not just those with nothing** [view:/migrate] [persona:architect] [persona:ops]: the gap card now also appears for roadmap-only assets, with wording that distinguishes "a path exists but isn't shipping yet" from "no path exists at all." A new Vendor Concentration Risk panel scores single-source dependency, vendor concentration, certification gaps, and geographic concentration from the real catalogue.
- **Command Center gains a first-visit board-pack walkthrough** [view:/business] [persona:executive]: a 3-step route through the Board Pitch Builder, ROI Calculator, and Policy Template Generator, shown once and dismissable. The CSWP.39 zone map also gets working step-forward/step-back controls that wrap around the loop, and its "N of M created" headers now name the artifact types you're actually missing.

### Fixed

- **The Algorithms Protocol Support table is no longer locked for new visitors** [view:/algorithms] [persona:curious]: it was hidden until you'd visited other tabs first — a reference table teaches nothing by being hidden.
- **Threats opens with the headline estimate, detail one click away** [view:/threats] [persona:researcher]: the CRQC per-source citation list and the hardware-trajectory chart both rendered fully expanded on load; one "Sources" toggle now controls both. The CRYPTO 2025 Chevignard–Fouque–Schrottenloher result (which cut the logical-qubit estimate for RSA-2048 from ~4,098 to ~1,730) was already driving the security grading but its citation had never been shown anywhere.
- **Compliance tells you when a load fails instead of looking empty** [view:/compliance] [persona:researcher]: a failed first load rendered as a blank page; there's now a loading skeleton and a retry banner shared across all four tabs. The "For You" view for first-time visitors is also cut back to a single "does this affect me?" card plus a link to the full landscape.
- **Timeline says what actually went wrong** [view:/timeline] [persona:researcher]: a permanent "Loading Timeline Data… Please wait" message that could never resolve (the data is bundled, not fetched) is replaced with a real error state and a reload action.
- **Timeline's enrichment analysis is one click, not two** [view:/timeline] [persona:researcher]: clicking a Gantt bar hid the full 8-dimension analysis behind a second toggle, while clicking a document row showed it directly. Both paths now behave the same.
- **The Playground's mobile tool list matches the real catalogue** [view:/playground] [persona:developer]: the mobile Crypto Lab kept its own hand-copied list of 21 tools against a real registry of 64 — it had gone stale, with dead entries and an entire missing Digital Identity category. It now reads the registry directly.
- **Sandbox-gated Playground tools are dimmed, not hidden** [view:/playground] [persona:developer] [persona:ops]: tools needing the local Docker runtime used to vanish from the grid and from search when it wasn't running, so you couldn't tell they existed. They now stay visible with a Sandbox badge, and clicking one explains the requirement. The Developer Sandbox card carries the same badge up front.
- **The Playground's engineering surfaces are hidden from non-engineering roles** [view:/playground] [persona:executive] [persona:curious]: the HSM Playground's ACVP tab and C++/Rust engine selector are workbench controls; they're now hidden for the Curious and Executive roles, including via direct link.
- **Library detail restores its evidence links** [view:/library] [persona:researcher]: the per-requirement evidence quote, its location and confidence, the link into the matching Business Center zone, and the link into the Compliance CSWP.39 explorer had all been dropped in the redesigned detail panel.
- **The "Start here" row on the Playground overview is 3 tools, not 6** [view:/playground] [persona:curious]: it read as a second full grid rather than a starting point.

### Changed

- **The AI Assistant's anti-fabrication rules are stricter**: it must not invent direct quotations, must not infer beyond what its sources explicitly state, must name both sources when they disagree rather than silently picking one, and must say which dataset it's citing rather than a generic "the database."

## [4.37.0] - 2026-08-01

A full front-door and navigation redesign built around six personas — Executive, Developer, Security Architect, IT Ops, Researcher, and Curious Explorer — replacing the flat top nav with a two-section rail and giving every persona a real first win instead of a generic hero banner.

### Added

- **A new "Who's asking?" front door** [persona:executive] [persona:developer] [persona:architect] [persona:ops] [persona:researcher] [persona:curious]: pick your role from 6 cards up front — each stating your real first win in minutes (e.g. "Run a real ML-KEM handshake · 5 min" for developers, "Size your HSM fleet · 10 min" for ops) — and land straight on a board built around it, instead of a multi-step wizard before you see anything. Nothing is hidden afterward, and "Show me everything" skips personalization entirely and stays skipped.
- **A real navigation rail, not a flat row** [persona:executive] [persona:developer] [persona:architect] [persona:ops] [persona:researcher] [persona:curious]: the left rail now groups your persona's destinations into three collapsible sections — Workflow (assess, report, migrate, compliance, business), Practice (simulation, playground, explore), and Reference (algorithms, library, leaders, learn, timeline, threats; collapsed by default) — with Home first and About last. Everything else stays reachable by search, direct URL, and the mobile "More" sheet.
- **One place to change who you are and where you work** [persona:executive] [persona:developer] [persona:architect] [persona:ops] [persona:researcher] [persona:curious]: the persona switcher and the region/industry pill are now a single top-bar dropdown, and FAQ, Glossary, User Manual, and Share share one compact style beside it. Every page's own duplicate persona picker is gone — Compliance, Library, and Playground each had one that wrote to the same shared setting as the global switcher.
- **A single page-actions strip in the top bar** [persona:researcher] [persona:ops]: Info, Export, Endorse, and Flag now appear once, in a consistent place, on all 11 data pages that offer them, instead of each page rendering its own row of buttons. The Info button also works for the first time — it was previously a hover-only tooltip with no click behavior and no keyboard or touch access at all.
- **The Sources panel now names the data file behind the page** [persona:researcher]: alongside each authoritative source's own verification date, you can see which underlying dataset the page is actually reading and when it was last updated.
- **Six persona boards, each with a real first win**: Executive gets an 8-question board-ready risk assessment with the regulatory dates that already bind them; Developer gets a live X25519MLKEM768 handshake with the PKCS#11 call log open; Security Architect gets a direct route into the Crypto Agility Control Plane (previously three clicks deep with no nav entry at all); IT Ops gets the HSM Capacity Calculator front and center instead of buried in a 50+ tool grid; Researcher gets an unfiltered evidence workspace instead of a funnel; Curious gets a 6-minute "what actually breaks" demo.
- **A dedicated mobile experience for new/non-technical visitors** [persona:curious]: a simpler, single-screen layout with a persistent 5-tab bottom bar, replacing the desktop-style nav mobile visitors were getting before.
- **Researchers can now watch specific topics for changes** [persona:researcher]: follow fields you actually work in (e.g. "Lattice / ML-KEM," "Hash-based / Stateful signatures") and see revision and deprecation counts since your last visit, instead of rechecking the whole corpus by hand.

### Fixed

- **The buttons on every persona board now actually go somewhere** [persona:executive] [persona:developer] [persona:architect] [persona:ops] [persona:researcher] [persona:curious]: all 12 board call-to-action buttons (2 per persona) were inert — they rendered but did nothing at all. Each now lands on its real destination, and the module chips at the bottom of each board link to their Learn modules instead of being decorative text.
- **Switching roles no longer leaves you scrolled past the new page's buttons** [persona:executive] [persona:developer] [persona:architect] [persona:ops] [persona:researcher] [persona:curious]: this was the actual cause of "nothing on the page responds" reports — switching persona kept your old scroll position, so the new board's heading and buttons rendered above the visible screen. They were never broken, just off-screen.
- **Persona board numbers are read from the real data, not typed by hand** [persona:executive] [persona:developer] [persona:architect] [persona:ops] [persona:researcher] [persona:curious]: signature sizes, HSM throughput, track durations, featured artifacts, report sections, and module lists now come from the underlying sources, so they can't quietly go stale. One was already wrong — the researcher board advertised a "16-check" TCG compliance runner that has since grown to 25 checks.
- **Board copy no longer prints internal code names at readers** [persona:executive] [persona:developer] [persona:architect] [persona:ops] [persona:curious]: nine strings across four persona boards literally displayed source-file and constant names ("Sizes read from algorithmProperties.ts") as if they were user-facing text.
- **The Glossary and User Manual panels close when you click outside them** [persona:curious]: both were trapped inside another element's stacking layer, so clicking the backdrop did nothing. The AI Assistant panel's close button is also reachable again at narrow widths.
- **Business Center opens straight into the Command Center** [view:/business] [persona:executive]: the Dashboard/Tools tab bar is gone — Business Tools is its own rail entry rather than a second tab hidden behind Command Center.
- **Breadcrumb trails removed from every page**: redundant with the persona rail and the page title.
- **The "show me everything" escape hatch actually works now** [view:/learn] [persona:curious]: a button that looked functional but was silently wired to nothing now correctly switches to the full, unfiltered module catalog.
- **OpenSSL Studio no longer has two separate front doors** [view:/playground] [persona:developer] [persona:architect] [persona:ops]: it's reachable from the Playground tool grid; the redundant standalone nav item is gone (a direct link to the page still works if you had it bookmarked).
- **The AI Assistant no longer sends you to a dead personalization link** [persona:curious]: it was still offering a URL that stopped doing anything when the old setup wizard was retired.
- **Compliance no longer shows a generic Sources button** [view:/compliance] [persona:researcher]: its provenance is shown inline per record, and the generic source list reappeared there when the top bar was consolidated.

## [4.36.0] - 2026-08-01

A three-phase mobile UX remediation: five app-wide root causes fixed once each, 28 high-severity page-specific bugs resolved, and a 51-finding touch-target sweep across 40 files — plus two real functional bugs caught along the way that weren't mobile-specific at all.

### Fixed

- **The AI Assistant button no longer covers page content while you scroll on mobile** [persona:curious]: the floating button now shrinks and fades while you scroll (restoring once you stop), fixing real content it was blocking on 21 of 30 audited mobile pages — Assess's save button, Quiz answers, Timeline cards, KMIP3.0 operation rows, and more.
- **The glossary panel no longer crowds out tool content on mobile** [view:/playground] [persona:developer] [persona:ops]: OpenSSL Studio, HSM Playground, TPM Playground, and KMIP3.0's Learn/Commands tabs now default to a collapsed glossary rail below 1024px instead of an always-expanded one.
- **Mobile navigation hints when there's more to scroll to, and fits better** [persona:curious]: the bottom nav row now fades at its edge instead of hard-clipping item labels, and Threats + Library moved into the "More" sheet so the always-visible row isn't overcrowded on a 390px screen.
- **A hidden Compliance tab is visible again on mobile** [view:/compliance] [persona:researcher]: the CSWP.39 Agility Explorer tab was scrolled off-screen with no indication it existed; the tab bar now scroll-fades like the rest of the app.
- **Search is now reachable on mobile** [persona:curious]: sitewide search (Cmd/Ctrl+K) previously had zero touch-reachable entry point on any page; it's now in the mobile "More" sheet.
- **iPhone/iPad users get honest guidance on the VPN/SSH live-crypto gate** [view:/learn] [persona:curious]: previously told to "use Chrome, Edge, or Brave," which doesn't help on iOS, where every browser runs on the same underlying engine as Safari. Now explains the platform limitation and points to the written walkthrough instead.
- **Simulation's mobile locked-screen header and full-migration flow no longer clip or drop options** [view:/simulation] [persona:curious]: the header no longer clips on phone, "watch full migration" now offers all 3 scope options on mobile instead of silently dropping two, and the narrated auto-run overlay's text is scrollable again.
- **The Algorithms "Transition Guide" tab is reachable again on mobile** [view:/algorithms] [persona:researcher]: a regression had made the tab bar permanently center-aligned regardless of whether its contents actually overflowed the screen.
- **TPM Playground's EK Certs tab no longer hangs forever** [view:/playground] [persona:ops] [persona:developer]: a real bug, reproducible on desktop too — development-mode double-mounting raced two certificate reads against the same lock; now guarded.
- **Threats dashboard cards no longer take up to a minute to appear** [view:/threats] [persona:researcher]: a fade-in delay was compounding across industry groups instead of resetting, so later sectors could take ~60 seconds to become visible.
- **Playground Workshop's tool list and detail modal now work on mobile** [view:/playground] [persona:developer]: the category sidebar closes itself after you pick a tool instead of pushing the tool list off-screen, and the Tool Detail Modal no longer clips content at both edges.
- **The embedded (vendor-hosted) view's navigation and sidebar work correctly on mobile** [persona:developer]: top-bar items are no longer geometrically unreachable, and the sidebar collapses to the same narrow layout mobile users get elsewhere.
- **51 more controls across 40 files now meet the app's 44px mobile touch-target minimum** [persona:curious]: a second, wider sweep across Assess, Business Center, Library, Migrate Workbench, OpenSSL Studio, PKI Learning, Patents, Report, Threats, and the AI Assistant panel itself.
- **Smaller mobile fixes**: Migrate Workbench's guidance card layout, Compliance's Gantt label column and evidence-filter row, Business Center CTA collisions and hover-only actions, Learn's step-progress row, Timeline's phase-dot row, Industry Landscape card overflow, Vendor Risk's FIPS tier list, and OpenSSL Studio's Command Preview header clipping.

## [4.35.0] - 2026-08-01

The Financial Services & Payments module gains a real Open Banking & PSD2 section, a revived BSI standard and 4 real evidence documents replace low-quality captures in the Library, and 22 broken glossary links across 9 modules are fixed.

### Added

- **New section: Open Banking & PSD2 Strong Customer Authentication** [view:/learn] [persona:developer] [persona:architect]: the Financial Services & Payments module now covers the actual legal basis for EU open banking — PSD2 Article 97's two-factor authentication requirement, the RTS's dedicated-interface obligation that created open-banking APIs, the mandatory fallback mechanism, eIDAS certificate requirements for third-party providers, and the deliberately technology-neutral encryption wording that lets a bank migrate to hybrid ML-KEM without waiting on new legislation. Sourced from the actual EU directive and regulation text (eur-lex.europa.eu blocks automated fetches; read against the UK's official retained-EU-law mirror instead), not summarized from general knowledge.

### Fixed

- **BSI-AIS-20-31 standard revived a second time** [view:/library] [persona:researcher]: the first fix cached the standard's landing page instead of the document itself; now points at the real PDF.
- **4 more Library documents replaced with the real thing** [view:/library] [persona:researcher]: a EU roadmap, a BIS paper, a G7 statement, and an MAS advisory were each cached as a landing page, an abstract, a press release, or a JS shell instead of the actual document — every downstream claim resting on them was unverifiable until now.
- **22 broken glossary links fixed across 9 Learn modules** [view:/learn] [persona:curious]: tooltips for terms like CBOM, CRQC, TDE, PSK, and SNI were passing a display string the glossary didn't recognize (e.g. "Column-Level Encryption (CLE)" instead of the glossary's "Column-Level Encryption"), so hovering did nothing. Most were one-line corrections; 6 terms (LDAP, OpenSSL, GRC, WAF, PSK, SNI) had no glossary entry at all and now do.
- **The financial sector's "no dated mandate" claim, qualified** [view:/learn] [persona:researcher]: the module correctly says no body sets a dated _algorithm_ mandate the way CNSA 2.0 does for Government & Defense — but didn't mention that the EU's Coordinated Implementation Roadmap does set a dated _transition_ expectation (high-risk systems by end-2030) that reaches EU banks through NIS2 and DORA. Both statements are now in the text, each qualified correctly.
- **"PQC Candidates & Lifecycle" title corrected** [view:/learn] [persona:curious]: the module's internal topic summary called it "& Standardisation Lifecycle," one word longer than the module's actual title.

### Data

- **library_07312026_r2.csv and trusted_sources_07312026_r7.csv refreshed** [view:/library] [persona:researcher]: consolidates this batch's evidence and citation fixes.
- **Search index refreshed** to match all of the above.

## [4.34.0] - 2026-07-31

The Digital ID module gets real mdoc/SD-JWT credential flows and links back from the compliance frameworks it covers, 10 new real regulations and 17 certification schemes join Standardization & Compliance, and this week's Financial Services quiz and module content is corrected.

### Added

- **Digital ID module: real mdoc selective disclosure and the share chooser** [view:/learn] [persona:developer] [persona:architect]: the EUDI Wallet workshop now performs actual ISO 18013-5 selective disclosure over mdoc credentials, plus a share-chooser step and an over-18 age-proof flow, replacing placeholder walkthroughs.
- **Compliance frameworks link back to the module that teaches them** [view:/compliance] [persona:curious] [persona:developer]: eIDAS, GDPR, DORA, NIS2, HIPAA, and PCI-DSS now show a "Learn this" section in their detail drawer, closing a gap where modules linked out to Compliance but nothing linked back.
- **Deadlines can now derive from the timeline** [view:/compliance] [view:/timeline] [persona:researcher]: framework deadlines wired to Digital ID (EUDI Wallet rollout) now pull from the single timeline source of truth instead of a separately hand-maintained date.
- **Compliance deadlines: separate start and finish dates, sortable by finish** [view:/compliance] [persona:executive] [persona:ops]: deadlines with a phased rollout (e.g. wallet deployment vs. full PQC readiness) now show both dates as a machine-readable range instead of one ambiguous string.
- **The Simulation routes Digital ID from the government sector track** [view:/simulation] [persona:curious]: playing the government sector now surfaces the Digital ID module at the right moment instead of only being reachable from Learn.

### Fixed

- **Digital ID module: corrected wrong facts, refreshed stale spec references, fixed a shared-session bug** [view:/learn] [persona:developer]: the EUDI workshop now shares one PKCS#11 session across its steps instead of silently reopening it, the Learn tab's declared reading sections are all real (none were placeholders), Related Resources labelling is corrected, and 15 glossary terms that had become unreachable are linked again.
- **The EUDI Wallet rollout date no longer overwrites the EU's PQC deadline** [view:/timeline] [persona:researcher]: adding the new EUDI Wallet timeline row had been silently replacing the EU's separate post-quantum migration deadline on the same chart.
- **3 fabricated PQC standards removed from the Library, a 4th corrected** [view:/library] [persona:researcher]: none of the three had a real published source; 5 additional dead Library links were repaired, and paid standards now show a free plain-language summary instead of only a paywalled link.
- **Financial Services & Payments module (LM-044): factual and consistency corrections** [view:/learn] [persona:researcher]: corrected outdated figures and internal contradictions, re-pointed 8 dead links (7 in-module, 1 cross-module), and restored the Mastercard PQC posture claims now that the underlying whitepaper is readable again.
- **Financial Services & Payments quiz: 2 answers corrected, 2 learner paths now assessed** [view:/assess] [persona:curious]: the quiz previously said ~4-5 billion payment cards are in circulation (stale; EMVCo's real end-2024 figure is 14.7 billion) and credited Visa with publishing the first PQC readiness framework (it's Mastercard, verified against the actual paper); 7 new questions now cover the module's Banking & Settlement and Retail & E-Commerce paths, which previously had zero quiz coverage.
- **5 modules' listed duration/difficulty corrected to match their actual content** [view:/learn] [persona:curious].

### Data

- **10 new real compliance regulations added, across the US, EU, Canada, and 6 emerging markets** [view:/compliance] [persona:researcher].
- **17 new certification schemes added and cross-linked into trusted sources** [view:/compliance] [persona:researcher].
- **20 organization rows corrected after wrongly claiming a PQC mandate** [view:/compliance] [persona:researcher]: each was checked against its own source document; only records that actually state a mandate keep that label.
- **13 missing EU member states added to the jurisdictions registry** [view:/compliance] [persona:researcher], and the region map now derives from that registry instead of a separately maintained list.
- **Compliance industry filter fixed to return what you actually select** [view:/compliance] [persona:researcher]: duplicate industry options were collapsed and the filter's matching logic corrected.
- **Mastercard's 2025 PQC industry-awareness whitepaper added to Industry Landscape** [view:/algorithms] [persona:researcher]: sourced from the downloaded PDF, covering its HNDL framing and its comparison of PQC against QKD.
- **Search index refreshed** to match all of the above.

## [4.33.0] - 2026-07-31

Learn modules and Playground tools now show a real, working revision history instead of a button that always claimed everything was up to date.

### Added

- **Learn modules and Playground tools now show their real review status** [view:/learn] [view:/playground] [persona:developer] [persona:architect] [persona:researcher]: every module and hands-on tool page now carries the same "Reviewed by / Unreviewed" badge already shown on Library, Timeline, Compliance, and Algorithms — clicking it opens the full revision history: who reviewed it, when, and what changed. The previous button checked a system that had never actually been wired up and always claimed "up to date," regardless of the real state.

### Data

- **Corrected 4 mislabeled entries in the site's revision-history log** [view:/revisions] [persona:researcher]: one entry had 29 unrelated Playground-tool ids bundled into it under the wrong category; one had a garbled id corrected to its real module; three had garbled ids with no live match and were removed rather than guessed at.

## [4.32.0] - 2026-07-30

Two new Learn modules cover government/defense and trust-service PQC migration, community leaders are now cross-linked to their patents and open-source projects, and this week's vendor, certification, and threat-watch data is refreshed.

### Added

- **Two new Learn modules: Government & Defense, and Trust Services** [view:/learn] [persona:architect] [persona:ops]: cover CNSA 2.0 mandates and Federal PKI transition planning, and qualified e-signature/timestamp longevity under eIDAS — both mapped to NICE Framework v2.2.0 roles.
- **Leaders now link to their patents and open-source projects** [view:/leaders] [persona:researcher]: community leader profiles cite the PQC patents they're first-named inventor on and the open-source products they maintain, each linking straight into the Patents and Migrate catalogs as a second and third form of validated proof alongside existing library citations.
- **Product-id and inventor deep links into Patents and Migrate** [view:/patents] [view:/migrate] [persona:researcher]: the Migrate catalog and Patents explorer now accept direct id-based links, powering the new Leaders cross-links above.

### Data

- **Library, compliance, algorithms, migrate, assessment, and threats catalogs refreshed** [view:/library] [view:/compliance] [view:/algorithms] [view:/migrate] [persona:researcher]: this week's verification and enrichment pass across all six catalogs, including 2 new vendor roadmap entries (IronCore Labs, PQSecure Technologies) and 7 vendors confirmed to have no public PQC roadmap yet.
- **Product certifications and CRQC-watch data re-synced** [view:/migrate] [view:/threats] [persona:researcher]: certification records re-scraped and re-matched against the catalog; the quantum-computing capability watch re-verified against all 6 estimate sources.
- **OpenSSH 10.4's composite signature support noted in the Protocol Support matrix** [view:/algorithms] [persona:developer]: experimental, opt-in ML-DSA-44+Ed25519 host-key support shipped 2026-07-06.

## [4.31.0] - 2026-07-30

A new Industry Landscape tab on the Algorithms page shows what crypto mechanisms each industry actually relies on today — cross-referenced against real standards, official market-size figures, and live threat data.

### Added

- **Industry Landscape tab** [view:/algorithms] [persona:architect] [persona:executive] [persona:researcher]: a new tab next to Protocol Support lets you explore either by industry or by crypto mechanism — 75 real-world use cases across 21 industries, each citing an active threat record. Standards chips deep-link into the Library, use cases link into Protocol Support, and market-size badges link to the official source (BEA, Census, IMF, WHO, IEA, World Bank, ITU, and Fed only — no analyst estimates).
- **"Learn: &lt;industry&gt;" links on industry pages** [view:/algorithms] [persona:curious]: the 8 industries with a matching Learn module (aerospace, automotive, digital assets, payments, energy, 5G, healthcare, IoT) now show a direct link into that module alongside the existing Threats link. The 13 industries without one yet are a known, reported gap rather than a silent absence.

### Data

- **34 industry standards, verified to actually name a crypto mechanism** [view:/algorithms] [persona:researcher]: every standards row was checked against its own cached document text — 16 candidates that only referenced general governance (no specific mechanism) were dropped rather than padded in, and mechanism attributions were corrected where the source didn't say what an earlier draft assumed (e.g., RFC 5280 cites RSA, not a PQC algorithm).
- **8 new Library documents added, each independently downloaded and verified** [view:/library] [persona:researcher]: UNISIG SUBSET-137 (rail key management), the WCO SAFE Framework, IMO maritime cyber-risk guidelines, the NAIC Insurance Data Security Model Law, AACS, DVB BlueBook A165, UN Regulation 155, and the W3C Verifiable Credentials Data Model v2.0.
- **Insurance industry re-grounded** [view:/algorithms] [persona:researcher]: the Munich Re cyber-insurance quantum-risk citation is now checked against the actual cached report text rather than resting on an unverified reference.

## [4.30.1] - 2026-07-30

Four Migrate catalog entries had the wrong company listed as their maker, and five Library/Compliance citations that pointed at inaccessible pages now resolve to the real source documents.

### Data

- **4 products' vendor attribution corrected** [view:/migrate] [persona:researcher]: Secure-IC Securyzr, MTG AG CARA, Mozilla Firefox, and sigstore/cosign were each linked to the wrong company (a South Korean government standards body, a telecom operator, an unrelated open-source foundation, and a different foundation, respectively) instead of their real makers.
- **5 Library and Compliance citations now resolve to real source documents** [view:/library] [view:/compliance] [persona:researcher]: a French national cybersecurity position paper, a UN vehicle cybersecurity regulation, an EU cross-government security-measures reference document, and the EU's cybersecurity certification scheme regulation were previously either missing their cached copy or pointed at a page that never served the document (a bot-check page or a language-selection screen).
- **A community leader's citation now points at a real, current document** [view:/leaders] [persona:researcher]: pointed at an IETF draft that has since been published as an RFC; updated to cite the published version.

## [4.30.0] - 2026-07-29

The Simulation got a full accuracy, usability, and teaching pass: every factual claim was re-verified against its source, hands-on play is now a clearly named option (and phones can watch the narrated overview), and the game finally explains its own scoring.

### Added

- **"Play it yourself" is now a named way to play** [view:/simulation] [persona:curious] [persona:executive]: the PLAY menu previously offered only the three narrated tours — the interactive board, the actual game, was something you had to discover by dismissing the menu. A fourth card now explains it and drops you straight onto the board.
- **Watch the Executive Overview on your phone** [view:/simulation] [persona:executive]: the narrated walkthrough — captions, phase intros, and playback controls — now works on phones. The full playable board still needs a tablet or desktop screen.
- **Terms & glossary inside the sim** [view:/simulation] [persona:curious]: a new "Terms & glossary" entry in the ⋯ MORE menu opens plain-English definitions of every sim term (Mosca, HNDL, TNFL, CBOM, hybrid vs pure, crypto-agility) plus the full PQC glossary — previously these definitions only appeared if you switched on Guided mode during the intro tour.
- **The grade card explains its own math** [view:/simulation] [persona:curious]: a "How scoring works" note on the run-complete screen spells out the scale — points lost per quarter over par, per trap picked, and the A/B/C/D thresholds — instead of showing bare numbers.
- **Save your roadmap at the finish line** [view:/simulation] [persona:executive]: the run-complete screen now has "Save my roadmap" — it files the draft roadmap into the Command Center and downloads a markdown summary, so you no longer had to remember to commit your plan before finishing.
- **What happens after the migration closes** [view:/simulation] [persona:architect] [persona:ops]: a new teaching moment at the verification phase covers compromise response — what a rehearsed algorithm swap looks like when something breaks after the program ends — linking to the SOC operations lesson.

### Changed

- **Wrong picks now state their price** [view:/simulation] [persona:curious]: trap feedback says exactly what the misstep cost ("this pick cost you 2 quarters of rework") instead of leaving you to find the setback notice elsewhere.
- **Playback progress no longer disappears** [view:/simulation]: during narrated runs, the progress bar stays visible after the explanation panel auto-collapses, and the current narration line remains readable — so muted or hard-of-hearing viewers don't lose the words.
- **Dialogs keep keyboard focus where it belongs** [view:/simulation]: all simulation dialogs now trap Tab focus inside themselves (previously you could tab out into the live board behind the overlay), and changing a header dial announces its new value to screen readers.

### Fixed

- **Payment-industry claim brought up to date** [view:/simulation] [persona:executive]: the retail scenario said PCI had "published no PQC requirements" — true when written, but PCI's hardware security module standard added PQC requirements in May 2026. The claim is now scoped correctly to PCI DSS.
- **Deadline attribution corrected** [view:/simulation] [persona:researcher]: the 2035 national-security-systems completion date was credited to the wrong policy document — it comes from CNSA 2.0; NSM-10 set the whole-of-government goal. Two CVE severity scores in the vulnerability-watch demo were also corrected against the National Vulnerability Database.
- **The quantum-threat window now adds up** [view:/simulation] [persona:researcher]: the narration's CRQC planning band and its "years to Q-Day" figures had drifted apart (the math only worked from a 2024 vantage point), and the healthcare board deck contradicted its own scenario document. Both now derive from the sim's single Q-Day anchor, so they can never disagree again — and a test guards it.
- **Fictional planning dates no longer read as overdue** [view:/simulation]: the demo organization's plan showed "Planned 2025" milestones as if they were still upcoming. All in-fiction dates now track the program's start year, and the protocol table reflects current real-world standards maturity (the SSH and IPsec hybrid drafts have advanced considerably).

### Data

- **India moved out of the jurisdiction picker** [view:/simulation] [persona:researcher]: India's entry had no curated hybrid/end-state stance, so picking it silently enforced nothing. It's now reference-tier (like China) until a citable national stance is sourced — its notes and authority information remain.
- **Framework cross-references verified against source documents** [view:/simulation] [persona:researcher]: every phase's mapping to ETSI TR 103 619, the Dutch PQC Migration Handbook, and the PQCC Migration Roadmap was re-checked against the actual documents — including the full PQCC roadmap PDF, which showed risk prioritisation belongs under "Baseline Understanding," not "Planning and Execution." Four mappings were corrected.

## [4.29.2] - 2026-07-29

Four organizations behind recently-added Library documents — an aviation standards consortium, an ISO committee, and Italy's and Japan's national cybersecurity bodies — are now tracked as verified sources instead of showing no source at all.

### Data

- **4 new trusted sources registered** [view:/library] [persona:researcher]: AEEC/SAE (aviation engineering standards), ISO/TC 210 (the medical-device quality-management committee), Italy's national cybersecurity agency (ACN), and Japan's Cabinet Secretariat PQC liaison conference were missing from the source registry entirely — a gap found while completing the 52 Library entries in the previous release. The 5 Library rows that cited them are now linked to a real, verified source instead of showing none.
- **6 cached evidence documents recovered** [persona:researcher]: six Library source documents had corrupted local copies (binary PDF content saved with a mismatched extension) that silently produced empty results in automated enrichment. Re-fetched cleanly from their original public URLs.

## [4.29.1] - 2026-07-29

52 Library documents that were sitting as bare, unreviewed stubs now show real information — document type, industries, authors, migration urgency, and more — instead of blank fields.

### Data

- **52 Library entries completed with real, cited detail** [view:/library] [persona:researcher] [persona:architect] [persona:developer]: recently-added documents (IETF drafts, national cryptography guidelines from Italy/Spain/Australia/Japan, NIST publications, ISO standards, and more) previously showed almost nothing beyond a title and link. Every field — document type, applicable industries, authoring organization, related standards, migration urgency, and confidence — was researched from the document's own text and is now populated.
- **4 duplicate/superseded entries cleaned up** [view:/library] [persona:researcher]: a draft that's now been published as an RFC, a duplicate composite-signature draft stub, a duplicate arXiv paper URL variant, and a superseded protocol draft are now correctly marked and linked to their current versions instead of appearing as separate, unrelated entries.

## [4.29.0] - 2026-07-28

The Algorithms catalog now describes hybrid key exchange properly — the pairing of a classical algorithm with a post-quantum one, which is how most real PQC deployments are rolling out.

### Added

- **Hybrid key exchange is now catalogued beyond TLS** [view:/algorithms] [persona:architect] [persona:developer] [persona:ops]: the catalog previously listed only three hybrids, all TLS-specific, so anything hybrid outside a browser connection simply wasn't described. It now covers 20, grouped so you can tell at a glance whether a mechanism works anywhere or only inside one protocol.
- **X-Wing, the general-purpose hybrid** [view:/algorithms] [persona:developer]: combines X25519 with ML-KEM-768 and isn't tied to any single protocol, which is why it turns up in file and secrets encryption as well as on the wire. Its specification is in the Library too, so citations to it resolve.
- **Post-quantum SSH key exchange** [view:/algorithms] [persona:ops] [persona:developer]: the published RFC 9941 mechanism that OpenSSH has shipped by default for some time, plus the three ML-KEM hybrids currently moving through the IETF — so you can look up what your SSH server is actually negotiating.
- **Composite certificates for PKI** [view:/algorithms] [persona:architect] [persona:ops]: twelve combinations that let a single certificate carry both a post-quantum and a classical key under one identifier, instead of issuing and managing two certificates side by side. Key and message sizes are listed for each, so the certificate-size impact is visible before you commit to one.
- **The SLSA v1.1 specification joins the Library** [view:/library] [persona:developer] [persona:ops]: the supply-chain integrity framework the sandbox's artifact-signing walkthrough is built around, so that reference now resolves to a real document.

### Changed

- **The three existing TLS hybrids are relabelled to say they're TLS-specific** [view:/algorithms]: they were filed under a generic "Composite" label that couldn't distinguish "usable anywhere" from "only inside TLS" — the distinction that made general-purpose hybrids invisible in the first place.
- **The WireGuard sandbox walkthrough is retired** [view:/playground] [persona:ops]: the only post-quantum WireGuard we could ship still used a pre-standardisation algorithm that FIPS 203 has replaced, and no upgrade exists — the upstream project hasn't migrated, and the one implementation that has is tied to a commercial VPN account. Post-quantum VPN coverage is unaffected: the IKEv2 walkthrough uses fully standardised ML-KEM.

### Fixed

- **83 more Migrate catalog products now show up under the right migration step** [view:/migrate] [persona:architect] [persona:ops]: they had no step tagged at all, so they were invisible to the Assess/Plan/Test/Migrate/Launch filter no matter which stage you were looking at. Each was tagged from its own existing PQC-support evidence, not guessed — confirmed-unsupported products are marked Assess, vendor-announced roadmaps get Assess+Plan, and confirmed PQC-ready libraries and hardware get Test/Migrate or Migrate/Launch depending on whether you'd integrate them or deploy them as-is.
- **76 catalog entries were missing their internal product identifier** [persona:developer]: all deprecated, superseded listings that predate the identifier being required. Backfilled so every row in the catalog is addressable the same way.

### Data

- Two SSH entries deliberately leave key sizes blank. Their specification doesn't state them and the sizes depend on an encoding defined in a different document, so the field says nothing rather than showing a number that looks more authoritative than it is.

## [4.28.0] - 2026-07-28

A big data-accuracy and coverage pass across Migrate, Vendor Roadmaps, Timeline, Trusted Sources, Threats, and Algorithms — plus real fixes to broken certificate links, a mis-detected PQC algorithm, and several data-pipeline bugs found along the way.

### Added

- **13 previously-broken product certificate links now resolve to the real NIST validation record** [view:/migrate] [persona:developer] [persona:architect]: products like Hikvision, HPE, Oracle, PQSecure, Xiphera, and three Chainguard FIPS builds had a placeholder certificate reference instead of a working link — most now show real, verified PQC algorithm support (ML-KEM, ML-DSA, SLH-DSA, LMS) pulled from their actual NIST validation page.
- **New Migrate catalog entries**: IBM's Quantum Safe Migration Orchestrator, Ledger's post-quantum SDK (ML-KEM/ML-DSA in hardware-wallet firmware), and dozens of other products spanning cryptographic libraries, HSMs, and PKI tooling.
- **27 new authoritative sources** [persona:researcher] [persona:architect]: national cybersecurity authorities and industry bodies across APAC, the Middle East, and Latin America (South Korea's KpqC, Saudi Arabia's NCA, FS-ISAC, NIST NCCoE, and more), closing real regional gaps in source coverage.
- **18 new industry threat & compliance documents** [view:/threats] [persona:ops] [persona:architect]: real sector-specific PQC guidance across finance (BIS, FINMA, MAS, X9), energy (NERC), healthcare (HSCC), telecom (ANSSI IPsec transition guide), and critical infrastructure.
- **New vendor roadmaps**: SEALSQ's quantum-resistant ASIC (QASIC) program, Ericsson's telecom PQC migration strategy (ML-KEM/ML-DSA/SLH-DSA with a 2031/2035 timeline), and first-time roadmaps for 13 more vendors.
- **14 new government PQC milestones on the Timeline** [view:/timeline] [persona:executive] [persona:ops]: including Germany's classified-systems 2030 deadline, a UK NCSC industry workshop report, and an FAA Request for Information on quantum-safe air traffic control systems.

### Changed

- **Classic McEliece is now shown as a fully standardised algorithm** [view:/algorithms]: it was formally adopted as ISO/IEC 18033-2 Amendment 2 in June 2026, on top of its existing German BSI recommendation.
- **9 NIST digital-signature candidates (UOV, SQIsign, FAEST, SNOVA, MAYO, HAWK) now show Round 3 status** [view:/algorithms], reflecting NIST's May 2026 advancement announcement; CROSS and LESS are marked as not advancing.

### Fixed

- **A product with LMS/HSS hash-based signatures was incorrectly marked as having no post-quantum support** [persona:developer]: the extraction process didn't recognize LMS and HSS as post-quantum algorithm families (it only looked for the newer lattice-based ones), so a FIPS-validated cryptographic module's real PQC certification was being missed.
- **Three catalog entries had inaccurate claims corrected** after a routine accuracy check: HAProxy's PQC support claim is confirmed accurate (a misread GitHub issue had suggested otherwise), Entrust's platform description was verified against the source, and Scality RING9's product-name evidence link was pointing at a page that had since been renamed.
- **A threat-database document's evidence file was corrupted at the source** (a PDF had been saved as unreadable binary data), which led the system to guess a protocol-coverage claim from the document's title alone. The real document was re-downloaded and the extraction redone with genuine supporting evidence.
- Several internal consistency checks (duplicate source entries, stale playground scenario references, and a couple of new-algorithm classification gaps) were caught and fixed before release.

## [4.27.0] - 2026-07-26

The Library page now shows who reviewed each document and when, four documents that had been silently showing site-navigation text instead of their real content are fixed, and seven Timeline milestones get their review badge back.

### Added

- **Library documents now show their review status** [view:/library] [persona:developer] [persona:architect] [persona:researcher]: every document card and its detail view carries a "Reviewed by / Unreviewed" badge, matching the same signal already shown on Learn modules, Timeline, and Compliance. Clicking a reviewed badge opens the full revision history — who reviewed it, when, and what changed.

### Changed

- **The About page's Trust Engine section now explains the actual review pipeline** [view:/about] [persona:curious] [persona:executive]: previously silent on how a record actually gets reviewed, it now explains that every data update is proposed (often with AI assistance), checked against its source, and only takes effect once a maintainer approves it — plus a new bullet on the AI-assisted marker already shown in the audit trail below.

### Fixed

- **Four recently-added Library documents had broken extracted content** [view:/library] [persona:researcher]: these are expired IETF individual drafts whose overview page doesn't inline the document's abstract, so the pipeline had captured only site-navigation text instead of the real content. Re-fetched from the stable archive URL and re-analyzed.
- **Brand-new Library documents no longer sort to the bottom of "Newest first"** [view:/library] [persona:developer]: a freshly-added document has no "last updated" date yet, only a publication date, and the sort only looked at the former — so the newest addition to the catalog could appear last instead of first. It now falls back to the publication date when there's no update date.
- **Seven Timeline milestones show their review badge again** [view:/timeline] [persona:ops] [persona:researcher]: a data-repair pass found these rows' review records were keyed to internal labels instead of the milestone's real id, so the badge never matched and silently showed nothing. Fixed as part of a broader repair of 49 mismatched review records across Compliance, Timeline, and Migrate data.

## [4.26.0] - 2026-07-25

OpenSSL Studio gets a working hardware-token workbench backed by a genuinely independent PQC engine, the TPM 2.0 Playground stops corrupting itself when two panels are used at once, and seven Learn modules get the infographic they were missing.

### Added

- **OpenSSL Studio has a new PKCS#11 (HSM) workbench you can actually generate keys in** [view:/openssl] [persona:developer] [persona:architect] [persona:ops]: generate ML-DSA-44/65/87, ML-KEM-512/768/1024, or EC-P256 keys directly inside a software token, then pick a key and run only the operations it can really do — self-signed certificate, CSR, sign and verify for signing keys; encapsulate and decapsulate for KEM keys. Private keys never leave the token; every operation runs the real `openssl` command against it, and the command is shown to you before it runs.
- **The token behind OpenSSL Studio is now a genuinely independent implementation** [view:/openssl] [persona:developer] [persona:researcher]: the previous PKCS#11 engine used OpenSSL's own crypto library as its only backend, so "OpenSSL talking to an HSM" was really OpenSSL calling itself in a circle — proving nothing about interoperability. It has been replaced with a pure-Rust engine that shares no code with OpenSSL, so a key generated in the token and used by the CLI now exercises two independent implementations.
- **Seven Learn modules now show their infographic** [view:/learn] [persona:curious] [persona:executive] [persona:architect]: CBOM, Crypto Registry, PQC GRC, SBOM, Skills & Team Structure, SOC Implementation, and Verification & Closure had been shipping with the infographic pane hidden because no image existed. Module infographic coverage goes from 55 of 63 to 62 of 63.
- **The TPM 2.0 Playground now proves the spec revision it claims, instead of asserting it** [view:/playground/tpm-playground] [persona:developer] [persona:researcher]: the first lesson stated the engine's TCG specification version and errata level as settled fact without ever asking the engine — and until a paired engine fix, that claim was wrong. It now queries the TPM live and shows the real answer. The Compliance Suite also gained a TPM2_NV_Certify check, a command that was previously untestable anywhere in the Playground, and it verifies the returned digest against an independently computed one rather than just accepting a success code.

### Fixed

- **The TPM 2.0 Playground no longer corrupts its own results when two panels run at once** [view:/playground/tpm-playground] [persona:developer] [persona:architect]: all seven panels drive a single TPM engine that can only handle one operation at a time, with nothing preventing overlap. Two independent operations interleaving mid-sequence could silently corrupt shared state — most visibly as lesson T5 reporting a signature failure after five clean steps, because the signature had been computed over the wrong message. Operations now run one at a time, including a whole "Run all" sequence, so a double-click can't interleave a second run into the first.
- **Certificate steps that use an EC key in OpenSSL Studio's HSM demos now work** [view:/openssl] [persona:developer] [persona:ops]: any EC private key restored from the token was rejected as unreadable ("Failed to load keys from slot"), because the key was stored without recording which curve it used. Post-quantum keys were unaffected, which is why the dual-signature demo's ML-DSA certificate step always worked while the classical certificate step right after it always failed.
- **OpenSSL Studio's Workbench buttons no longer get pushed off the screen** [view:/openssl] [persona:developer]: after running a command with a lot of output, the log panel grew without limit and stretched the whole page — leaving the operation buttons roughly fourteen screens down. The terminal and log panels now have a fixed height ceiling and scroll internally.
- **OpenSSL Studio's Explore and Learn tabs now tell you when the engine fails to load** [view:/openssl] [persona:developer] [persona:researcher]: if the engine failed to start, both tabs sat on "waiting to initialize" forever with no error and no way to retry short of reloading the page. They now show the real error and a retry button, which the Workbench tab already did.
- **A data-refresh bug that could have un-published two RFCs on the Algorithms page is fixed** [view:/algorithms] [persona:developer] [persona:architect] [persona:researcher]: the tool that refreshes the Protocol Matrix from the IETF datatracker wrote whatever the feed reported without comparing it to what the page already showed, so a superseding draft or a bad lookup could move a protocol _backwards_ in its standardization stage. Run against the current feed it would have applied 17 such downgrades, two of which would have shown a published RFC as not yet published. Backwards moves are now blocked and reported instead of written.
- **Approving one Protocol Matrix correction no longer applies all of them** [view:/algorithms] [persona:ops]: in the maintenance review flow, approving a single suggested stage change caused every pending change in the report to be written, so rejecting one had no effect. Only the approved items are applied now, and each is re-checked against the current report first so a stale approval is skipped and flagged rather than writing the wrong value.

### Data

- **11 new standards documents added to the Library** [view:/library] [persona:researcher] [persona:architect]: each downloaded, cached, and enriched from its own source document.
- **2 new industry threat framework entries** [view:/threats] [persona:executive] [persona:architect].
- **3 government timeline entries retired because their source links no longer resolve** [view:/timeline] [persona:researcher]: two European Commission milestones and a Nigerian data-protection milestone. The entries are marked retired rather than deleted, so the record of what was once claimed — and why it no longer holds — is preserved.
- **Australia keeps its 2030 deadline** [view:/timeline] [persona:executive] [persona:researcher]: an automated link check had flagged the Australian Signals Directorate's end-of-2030 legacy-crypto deadline as unreachable and retired it, which would have quietly removed Australia's deadline from the Timeline and the Simulation and fallen the country back to a generic estimate. The source is reachable by a person and its document is cached — the government site simply refuses automated downloads — so the entry stays.
- **Three timeline entries now appear under their country again** [view:/timeline] [persona:researcher]: a Malaysian and two Czech entries had been added without the internal identifier the page groups and scores by, leaving them out of their country's grouping.

### Changed

- **Changelog entries now name the page they affect instead of showing a raw path** [view:/changelog] [persona:curious]: the OpenSSL Studio, TPM 2.0, KMIP 3.0, and PKCS#11 surfaces had no display name, so their tags rendered as unreadable URLs.

## [4.25.5] - 2026-07-25

OASIS published the next revision of the KMIP 3.0 spec since our last update; this release moves the Protocol Matrix and the KMIP 3.0 Playground onto it.

### Changed

- **The Algorithms page's Protocol Matrix now cites the published KMIP 3.0 spec, not the earlier draft** [view:/algorithms] [persona:developer] [persona:architect] [persona:researcher]: the hybrid key-exchange row previously described ML-KEM/X25519 support as "ahead of the published draft"; the spec now defines that support natively, so the row was corrected to reflect standard-compliant behavior rather than an extension, and hybrid key exchange is now shown as fully testable in the Playground rather than not applicable.
- **The KMIP 3.0 Playground's tour, glossary, quiz, and command reference now cite the published spec throughout** [view:/playground/cacp] [persona:developer] [persona:architect]: every remaining reference to the earlier working draft has been updated to the spec's actual published designation, and a batch of spec section numbers shown in lesson text and the command reference were corrected to match where the spec renumbered them.
- **The Revoke reason picker in the KMIP 3.0 Playground now offers all 10 real revocation reasons, up from 5** [view:/playground/cacp] [persona:developer]: it was missing two reasons that were already valid under the prior spec, plus three new ones the latest spec just added, while the neighboring Deactivate picker already listed a complete set — both now match.
- **The KMIP 3.0 Playground's in-browser engine was rebuilt against the latest published spec** [view:/playground/cacp] [persona:developer] [persona:architect]: picks up the reason-picker fix above along with the underlying spec-citation and terminology corrections, so the live Playground matches what the rest of the site now says.

## [4.25.4] - 2026-07-24

### Added

- **The TPM 2.0 Playground's Learn tab now shows each step's real wire exchange inline** [view:/playground/tpm-playground] [persona:developer] [persona:architect]: every lesson step displays the actual TPM command and response it sent, in a collapsible hex panel, including ones triggered internally by a step's own helper calls — not just the ones a step calls directly. Any non-success response now also shows a real decoded return-code name and description, not just a raw hex code, covering the full TCG-specified error space instead of a small hardcoded list.

## [4.25.3] - 2026-07-24

### Fixed

- **Corrected 2 wrong spec-section citations in the KMIP 3.0 Playground** [view:/playground/cacp] [persona:developer] [persona:architect]: two places pointed at "§6.4" for content that's actually documented elsewhere in the spec (the real content — a message-envelope rule — lives at §8.2.3, Response Batch Item). Also corrected the Rekey tour step's description, which said a keystore entry "migrates in place"; the engine actually mints a new key and deactivates and supersedes the old one, which the tour now says.
- **Fixed a silently wrong algorithm codepoint in the KMIP 3.0 patch tables** [view:/playground/cacp] [persona:developer]: RC4 was mapped to DSA's codepoint instead of its own. Found by a new completeness test added as part of this fix; RC4 isn't currently offered anywhere in the Playground's UI, so this had no live impact, but is corrected so it can't surface a wrong value if RC4 is ever exposed.
- **Added a completeness check for KMIP 3.0's WD19 draft delta** [view:/playground/cacp] [persona:developer] [persona:architect]: documents every codepoint that's genuinely new in the WD19 draft versus the published CSD01 baseline, and a new automated test now fails if a future spec patch isn't accounted for by one of those two sources or an explicit documented exception — closing a gap where a future drift could go unnoticed.

## [4.25.2] - 2026-07-24

### Added

- **The PKCS#11 Learn tab now shows each step's own call log inline** [view:/playground/hsm] [view:/learn] [persona:developer]: previously the real HSM calls a step made only appeared in a shared log panel at the bottom of the lesson, so it wasn't obvious which calls belonged to the step you were looking at. Each step now shows its own compact table (function, arguments, return code, duration), with the reason shown inline for any failed call.

### Fixed

- **The PKCS#11 Learn tab's call log no longer shows confusing internal housekeeping as failed calls** [view:/playground/hsm] [view:/learn] [persona:developer]: a defensive startup check and a per-step registry sync — neither of them lesson content — were going through the same logging path as real operations. This showed every lesson's very first step starting with two unexplained "failed" calls, and every successful step in all 17 lessons ending with an empty init/cleanup bracket. Neither was ever meant to be learner-visible, and now isn't.

## [4.25.1] - 2026-07-24

### Added

- **OpenSSL Studio's Learn tab now shows the real command output under each step** [view:/playground/openssl] [persona:developer] [persona:researcher]: every step displays the actual OpenSSL output it produced, inline — previously only a few steps showed any output, and what they showed was a garbled mix of the real result and the app's own internal debug narration (which used the same message channel with no way to tell them apart). All 11 lessons now show a clean, real log per step, including the actual error text for lessons that expect a refusal.

### Fixed

- **OpenSSL Studio's Learn tab no longer breaks partway through multi-step lessons** [view:/playground/openssl] [persona:developer] [persona:researcher]: "Run all" reused a stale snapshot of files created by earlier steps in the same run, so any lesson with 3 or more chained steps (certificate signing, PKCS#12 bundling, the TLS Simulator capstone, and others) could fail partway through even though each step worked correctly on its own.
- **OpenSSL Studio's failure detection and error messages are now accurate** [view:/playground/openssl] [persona:developer] [persona:researcher]: a failed command could silently look like success, because only a thrown exception was checked and this build reports failure as a plain nonzero exit code instead — this was making the Algorithm Explorer wrongly report the non-functional `pkcs11` provider as "Verified functional," and breaking the Learn tab's refusal-check lessons. Both now correctly detect failure, and error messages show the real underlying reason (e.g. "Module initialization failed!") instead of a generic status code.

## [4.25.0] - 2026-07-24

An OpenSSL Studio release: a new guided Learn tab and a live Algorithm Explorer, both running the real openssl.wasm engine bundled with the site (not simulated output).

### Added

- **New 11-lesson Learn tab for OpenSSL Studio** [view:/playground/openssl] [persona:developer] [persona:architect] [persona:researcher]: pairs each classical operation with its post-quantum replacement — key generation, certificate requests, signing and verification, ML-KEM key exchange, an honesty check on LMS/HSS keygen, an encryption/hashing myths lesson, key derivation, PKCS#12 bundling, random generation, and configuration — plus a TLS Simulator capstone. Every command runs for real against the site's OpenSSL engine, with a glossary rail and a short quiz after each lesson.
- **New "Explore" tab shows every algorithm this exact OpenSSL build actually supports** [view:/playground/openssl] [persona:developer] [persona:researcher]: a searchable, filterable list grouped by algorithm family, built from live queries against the real engine rather than static documentation. Every non-default provider is functionally tested (not just checked for a self-reported "active" flag) before its algorithms are shown as usable — this caught the bundled `pkcs11` provider correctly listing ML-KEM, ML-DSA, and 3 hybrid composite signatures but not yet actually functional in this environment, and the Explorer reports it as such instead of overclaiming.

## [4.24.2] - 2026-07-24

A maintenance-pipeline accuracy pass: several standards, catalog, timeline, glossary, and leaders-profile corrections found and verified during a full end-to-end review of the data maintenance process.

### Data

- **5 protocols advanced in the Standards Support Matrix, reflecting real IETF progress** [view:/algorithms] [persona:developer] [persona:architect]: Kerberos PKINIT's hybrid signature now shows an active individual draft, IKE/IPsec's pure-signature track reached IETF Last Call, DNSSEC's pure and hybrid signature tracks show an active individual draft (previously "no work identified"), and FIDO2's hybrid signature draft is now a formal working-group document. A companion automated drift check was also caught over-applying: 17 of 23 proposed updates would have wrongly shown protocols moving _backward_ (standards don't un-publish) — those were rejected and are being fixed at the source before the next run.
- **Corrected HAWK's post-quantum signature status in the Migrate catalog** [view:/migrate] [persona:developer] [persona:researcher]: the reference implementation was still listed under NIST's Round 2 evaluation; NIST's own published update confirms it advanced to Round 3.
- **4 more Migrate catalog products now show a verified certification** [view:/migrate] [persona:researcher]: Quantum Xchange Phio TX (FIPS 140-3 + ACVP), Chelpis's post-quantum library (3 ACVP validations), Securosys's Primus CyberVault (5 ACVP validations), and Pure Storage's Purity encryption module (FIPS 140-3) — each individually verified against NIST's own records, not auto-matched.
- **Fixed 2 Migrate catalog products linked to the wrong company** [view:/migrate]: Eviden's Trustway Proteccio HSM and Forward Edge-AI's Space Router had each been attributed to an unrelated, similarly-named vendor.
- **2 more Timeline milestones now show a verified source organization** [view:/timeline] [persona:researcher]: two NUKIB (Czech Republic national cyber agency) entries were missing their country/organization attribution on intake; both are now fully attributed and cross-referenced against the agency's registry entry.
- **Fixed 3 broken "learn more" links in the Glossary** [view:/library]: IKEv2 and RFC 9370 pointed at a retired duplicate reference id, and SM2 pointed at a since-deprecated standard with no working source — SM2 now links to the active IETF draft covering its actual post-quantum hybrid use.
- **Cleaned up 37 mislabeled entries in the authoritative sources directory** [view:/library] [persona:researcher]: organization-type labels using inconsistent spelling/spacing (e.g. "Industry Workgroup" vs. the standard "Industry_Workgroup") were normalized; this directory is now actively monitored for freshness and accuracy going forward.
- **10 more Leaders profiles now show a verified peer-review credential** [view:/leaders] [persona:researcher]: each was independently confirmed against NIST, IETF, or an academic publication record (not inferred from the profile's own bio text) — including catching and correcting one profile that cited the wrong RFC.

## [4.24.1] - 2026-07-24

### Fixed

- **The TPM Playground's compliance check no longer fails after visiting the Learn tab first** [view:/playground] [persona:developer] [persona:researcher]: the emulated chip only has 3 key-object slots, and the compliance check assumed it was always starting with all of them free. Working through Learn tab lessons (or the Command Builder) first could leave a slot occupied, so creating the attestation key — and everything that depends on it — would fail with an out-of-memory error instead of running. The compliance check now clears its own slots before it starts, regardless of what ran before it.

## [4.24.0] - 2026-07-23

A TPM 2.0 Playground release: a new guided Learn tab teaching classical-vs-post-quantum TPM operations side by side, and a fix to the underlying crypto bridge that had been silently substituting placeholder data for real ML-DSA signatures and ML-KEM key exchanges.

### Added

- **New guided Learn tab for the TPM 2.0 Playground** [view:/playground] [persona:developer] [persona:architect] [persona:researcher]: 8 step-by-step lessons — from booting the emulated chip through attestation — that pair a classical TPM operation (RSA signing, RSA key transport, hash-then-sign) against its post-quantum replacement (ML-DSA signing, ML-KEM key exchange, streaming signatures) and run both for real against the live in-browser TPM. Includes a glossary of TPM commands and terms, and short knowledge checks after each lesson.

### Fixed

- **The TPM Playground's post-quantum cryptography is now genuinely real** [view:/playground] [persona:developer] [persona:researcher]: ML-DSA signatures and ML-KEM key exchanges were silently falling back to placeholder data instead of running through the actual post-quantum crypto engine, even though the playground's status indicator reported everything as active. Both are now real, and the status indicator only reports active when it actually is.
- **The TPM Playground's Command Builder no longer sends made-up data for multi-step operations** [view:/playground] [persona:developer]: decrypting a key exchange, verifying a signature, or completing a streaming signature used to send synthetic placeholder bytes instead of the real result from the step you just ran — it now chains your actual results through, and tells you when a prerequisite step hasn't been run yet instead of silently guessing.
- **The TPM Playground's compliance checklist can no longer misreport a passing score** [view:/playground] [persona:developer] [persona:ops]: if the automated 24-point compliance run was interrupted partway through, it could still show a clean "all checks passed" result — it now honestly reports how many checks actually ran.

## [4.23.0] - 2026-07-24

A PKCS#11 Learn tab release: a new lesson on key-trust policy, and a more trustworthy call log across the whole HSM playground.

### Added

- **New "Trust & wrapping policy" lesson in the PKCS#11 Learn tab** [view:/playground/hsm] [persona:developer] [persona:architect]: walks the real policy chain a security officer uses to designate one key as trusted for wrapping others — including the part that surprises people, that a normal user can never grant that trust themselves, not even to a key they just created.

### Fixed

- **The PKCS#11 workshop and Learn tab's call log now shows what actually happened, by default** [view:/learn] [view:/playground/hsm] [persona:developer]: a filter meant to hide routine housekeeping was also hiding real operations — logging in, discovering supported algorithms, and reading or writing key policies — so entire early lessons used to show an empty log the whole way through. Also added a plain-English toggle that was silently non-functional in both places.
- **A skipped lesson step could display as "refused, correctly" when it had actually crashed** [view:/playground/hsm] [persona:developer]: jumping ahead to a later step before finishing earlier ones could trigger an unrelated error that still showed as the intended outcome. Both the workshop and the Learn tab now also block jumping ahead until each step's prerequisites are done.
- **Refreshed the HSM playground's underlying crypto engines** [view:/playground/hsm] [persona:developer] [persona:ops]: carried over several correctness fixes already made to the engines but not yet reflected on the site, including a login-timing race and an RSA encryption parameter-handling fix.

## [4.22.1] - 2026-07-24

Small accuracy pass: Ops nav reachability, a persistence fix on mobile Timeline, softer Patents copy, several stale-citation and dead-link corrections across Learn, and a CACP KMIP 3.0 playground accuracy fix.

### Changed

- **Added Algorithms to the IT Ops navigation** [view:/algorithms] [persona:ops]: the Certified-filter view and deployment-relevant status hints are now reachable from the Ops nav, matching every other technical persona.
- **The mobile Timeline's "All phases" view now stays selected** [view:/timeline] [persona:ops]: switching off the one-phase-at-a-time swipe carousel used to reset on your next visit; your choice is now remembered.
- **Softened the /patents preview banner for curious visitors** [view:/patents] [persona:curious]: the page was never actually locked for curious users, but the banner said "Preview locked" anyway — it now reads as a suggestion to build background first, not a rejection.

### Fixed

- **Corrected a stale 2024 data-breach citation** [view:/learn] [persona:executive]: the ROI calculator's methodology panel and the Risk Management module's intro both still cited IBM's 2024 report ($4.88M) after the underlying numbers had already moved to 2025's $4.44M global average.
- **Corrected the "10-50x larger certificates" claim in the last two places it survived** [view:/learn] [persona:architect] [persona:curious]: the real figure is roughly 4-7x (already fixed elsewhere) — the Security Architect module and the Ops plain-language summary still had the old number.
- **Replaced personal email contact links on the About page** [view:/about]: the sandbox-access and embedding-mode request links pointed at a personal Gmail address; they now go through the same trackable GitHub request form used everywhere else on the site.
- **Reviewed and corrected 8 Learn modules' internal citation lists** [view:/learn] [persona:developer] [persona:architect] [persona:ops]: PKI Workshop, KMS & PQC Key Management, Web Gateway PQC, VPN/IPsec & SSH, Email & Document Signing, Code Signing, IoT & OT Security, and Merkle Tree Certificates had never had their standards/algorithm references or example figures checked against the lesson content since being scaffolded — several had stale or disconnected numbers (e.g. the VPN/SSH module's handshake-size examples didn't match the sizes its own simulator computes); all are now verified and the "last reviewed" date is honest.
- **Corrected spec citations and a dormant algorithm-mapping bug in the CACP KMIP 3.0 playground** [view:/playground/cacp] [persona:developer] [persona:architect]: a few Learn and Commands-tab surfaces cited a KMIP protocol section that doesn't exist in either published draft, and one legacy cipher option was silently mapped to the wrong protocol code — never reachable through the playground's UI, but now fixed and covered by an automated check so it can't drift back unnoticed.

### Data

- **Resolved 7 library entries flagged for URL review** [view:/library] [persona:researcher]: 3 were confirmed live and cleared, 1 was repointed from a generic homepage to its actual report page, and 3 were deprecated after their sources couldn't be confirmed (one was an internal preview link with no matching published article).
- **Backfilled related-standards links on 3 compliance entries** [view:/compliance] [persona:researcher]: UK ICO encryption guidance, Norway's NSM principles, and Brazil's BACEN Resolution 4.893 now cross-reference the frameworks they parallel or implement.

## [4.22.0] - 2026-07-19

A major Simulation release: a six-wave accuracy and gameplay overhaul, real hub data flowing through the sim's documents and events, and a refreshed NIST library entry.

### Added

- **Simulation results now appear on the Executive Report** [view:/report] [view:/simulation] [persona:executive]: a run's readiness, compliance posture, phase maturity, transformation objectives and overall grade are pulled straight from your committed sim roadmap instead of staying siloed inside the Simulation.
- **One unified scoreboard for the Simulation** [view:/simulation]: readiness, compliance, and phase maturity used to be three separate, inconsistently-scored systems — they're now one scoreboard so your progress reads the same way everywhere.
- **Hover/tap definitions for Simulation terms** [view:/simulation] [persona:curious] [persona:executive]: threat-readiness labels (HNDL, TNFL) and other jargon on the rail and ribbon now show a plain-language definition on hover or tap.
- **Simulation achievements and shareable challenge replays** [view:/simulation] [persona:executive] [persona:curious]: earn achievements as you play (they count in the site-wide achievement tracker), and share a run's seed so someone else can replay the exact same event sequence.
- **Edge migration is now a first-class Simulation step, reachable by everyone** [view:/simulation]: the core scoring mechanic was previously buried in an Expert-mode side rail; Guided players and the auto-run can now drive it too.
- **Events with real stakes** [view:/simulation]: world events now carry mechanical consequences, traps cost the same everywhere, and each run is scored (quarters-vs-par, traps hit, on-time objectives).

### Changed

- **The Simulation's demo documents are now the real tools' own output** [view:/simulation] [persona:executive] [persona:architect]: 15 more of the documents the sim shows during tours and fast-forward — the risk register, KPI dashboard and tracker, migration roadmap, RACI matrix, policy draft, audit checklist, deployment playbook, CRQC scenario, and more — are rendered by the same logic the real Command Center tools use, so a tool fix shows up in the sim automatically. 30 of 35 document types now work this way; three showed literal placeholder text before.
- **The Simulation's event pool now partly reflects real, current data** [view:/simulation]: some world events cite actual NIST library publications and the real per-country regulator name, instead of being 100% hand-authored fiction.
- **Several Simulation surfaces read your real data** [view:/simulation] [view:/migrate]: the architecture panel reflects your actual product selection, the pilot-picking step opens on your own migration plan when you have one, Phase 7's vendor artifacts derive from real vendor records, and the assessment preview shows your two-track split.

### Fixed

- **Corrected a wrong standards citation in the Audit Readiness Checklist** [view:/business] [persona:researcher]: the Exceptions section cited NIST CSWP 39 §5.1 for exception-process guidance the document doesn't contain; seven other CSWP 39 citations across the tools were individually verified against the current document and confirmed accurate.
- **Fixed a text-overflow bug in the PKCS#11 HSM Learn tab** [view:/playground] [persona:developer]: long lesson titles were overlapping the lesson content; lesson steps now also show the live PKCS#11 call log and generated-key list without switching tabs.
- **Removed a false product claim from the Simulation's event pool** [view:/simulation]: an event asserted a hardware-acceleration feature that doesn't exist in the named product; the event is now version-free.

### Data

- **NIST CSWP 39 refreshed to Update 1** [view:/library] [persona:researcher]: the December 2025 original was withdrawn and superseded by NIST on June 29, 2026 — the library entry, cached document, and extracted summary now reflect the current version, including its added citation of SP 800-131Ar3.

## [4.21.11] - 2026-07-18

A guided Learn tab for the PKCS#11 HSM Playground, and a new Developer Sandbox
card on the Playground overview.

### Added

- **PKCS#11 HSM Playground now has a guided Learn tab** [view:/playground] [persona:developer] [persona:architect]: two tracks — PKCS#11 Foundations, and the v3.2 / post-quantum transition — with worked lessons, a searchable glossary rail, knowledge checks, and classical-vs-PQC comparison tables. It's now the tab you land on when you open the playground; the existing hands-on workbench is still there, one tab over, with two-way links between a lesson and the matching live operation.
- **Developer Sandbox card on the Crypto Lab overview** [view:/playground] [persona:developer]: the Docker-backed sandbox — network protocol scenarios plus a live PKCS#11 dev catalog comparing the same operation in Python, Java, C, C++, and Rust — previously had no link pointing at it anywhere in the Playground and was only reachable if you already knew its URL. It's now a card alongside Interactive Playground, PKCS#11 HSM, and KMIP Control Plane, and opens straight on the developer catalog instead of the generic scenario list.

### Fixed

- **KMIP Control Plane: mechanism panel now cites the spec section for every operation** [view:/playground] [persona:developer], with a working link back to the matching Learn lesson.

A major integrity pass on the Leaders / PQC Community page, more KMIP 3.0
playground fixes, a new collapsible layout for Threats, and large-scale
re-verification across Library, Timeline, and Threats data.

### Added

- **Threats: top-level sections are now collapsible** [view:/threats] [persona:researcher] [persona:executive] — Your Exposure, CRQC Threat Horizon, and the Threat Catalog can each be tucked away independently. All default open.

### Fixed

- **Leaders / PQC Community: every profile independently re-verified against live sources** [view:/leaders] [persona:researcher]: a new automated proof-gate audit was added, and ~155 curated rows across the community pool were individually checked or corrected — the entire previously-unverified backlog. 73 misfiled reference links were repaired (citations that pointed at nothing, sitting in the wrong field). A duplicate profile (two entries for the same person) was merged.
- **KMIP 3.0 Playground: further compliance-audit gaps closed** [view:/playground] [persona:developer]: async batch indicator now wired through instead of hardcoded off, a corrected tooltip, and the browser-based conformance replay now matches native results exactly.
- **Trusted-sources registry: a 420-row divergence between two conflicting files reconciled** — traced to a URL-quality classifier bug; all 42 conflicting rows resolved, the correct 420 rows restored.
- **A duplicate vendor registration removed**: the same organization (Centre for Development of Telematics) had two separate, active entries.

### Data

- **Library: large-scale re-verification** [view:/library] [persona:researcher] — 404 documents flagged as changed were re-checked and re-enriched, 171 more re-cached after a cache bug fix, and 28 of the 33 PDFs found corrupted yesterday were resolved with real, verified content.
- **Timeline and Threats: re-verification of documents flagged as changed** [view:/timeline] [view:/threats] [persona:researcher] — 29 timeline and 42 threats reference documents re-cached and re-enriched after fixing the underlying cache-drift bugs; several wrong-content and duplicate-row issues corrected along the way.
- **Compliance-landscape: related standards backfilled** for the EU Cybersecurity Certification scheme (EUCC) and Brazil's ANPD PQC framework.
- **5 more product certifications verified** [view:/migrate] [persona:researcher].

## [4.21.9] - 2026-07-17

Spec-accuracy fixes across the KMIP 3.0 and HSM playgrounds, a batch of
newly-discovered vendor roadmaps, and re-verified evidence across Timeline
and Threats.

### Fixed

- **KMIP 3.0 Playground documentation corrected against the actual OASIS draft** [view:/playground] [persona:developer] [persona:architect]: the spec-only-algorithm list was wrong (Ed25519, FrodoKEM, and Classic-McEliece are actually runnable, not spec-only), a section reference was mislabeled, and a claim that no official KMIP 3.0 test vectors exist yet was false — OASIS has published 102 draft-stage test vectors, which this playground already replays.
- **HSM Playground: 2 spec-label corrections** [view:/playground] [persona:developer]: LMS was cited as if `CKM_LMS` were a real PKCS#11 v3.2 constant (it isn't — LMS routes through `CKM_HSS`), and SLH-DSA parameter sets cited the wrong spec section. Neither changes what the playground actually does.
- **Timeline: a citation's date precision corrected** [view:/timeline] [persona:researcher] from month-only to the exact, source-confirmed date.

### Data

- **40 vendor roadmaps reviewed, 1 new genuine find added**: Algorand Foundation's real PQC roadmap (Falcon-1024/512, FN-DSA, ML-DSA, hybrid Ed25519+Falcon consensus signing) [view:/migrate] [persona:architect].
- **Threats: 72 documents with confirmed content drift re-verified and re-enriched** [view:/threats] [persona:researcher], after fixing a bug that had been causing PDFs to falsely register as "drifted."
- **1 Timeline entry deprecated**: Indonesia's BSSN row, after its source (bsn.go.id) proved unreachable at the network level across every recovery attempt — will be re-activated if the source comes back.

## [4.21.8] - 2026-07-17

A routine maintainer-review pass adds new Compliance entries, fixes a Timeline
citation error, and refreshes Library, Vendor Roadmaps, Product Certifications,
and CVE data.

### Fixed

- **Timeline: corrected an ETSI document-number error and improved date precision on 2 entries** [view:/timeline] [persona:researcher].

### Data

- **5 new Compliance entries added**: Estonia's E-ITS framework, the CRI Profile, Sweden's Cybersäkerhetslag (SFS 2025:1506), OMB Memorandum M-19-03, and National Security Memorandum 22 [view:/compliance] [persona:researcher]. A 6th drafted candidate (MiCA) turned out to duplicate an existing row for the same regulation and was deprecated instead of kept.
- **`related_standards` confirmed for 43 more Compliance rows** [view:/compliance] [persona:researcher].
- **8 new Library documents enriched** [view:/library] [persona:researcher].
- **5 vendor roadmap pages refreshed** [view:/migrate] [persona:architect].
- **20 product certifications re-verified** [view:/migrate] [persona:researcher].
- **CVE database refreshed** against the latest NVD data.

## [4.21.7] - 2026-07-17

Compliance's trust panel and crosswalk registry now cover every active
framework, Timeline's citations and trust links are fully verified across all
255 active milestones, and Migrate's vendor-risk cards now factor in real CVE
exposure.

### Fixed

- **Compliance now shows a real Source & trust panel, with full traceability coverage** [view:/compliance] [persona:researcher] [persona:architect]: every framework row now shows when its data was last verified, and all 167 active rows are registered in the concept crosswalk registry so "Tested by / Cited by / Related" chains resolve everywhere, not just for some rows. DORA's trusted-source link was corrected and EIOPA added as a recognized source; the last 14 rows without CSWP.39 governance tags (including FIPS-203/204/205) are now tagged.
- **Timeline citations and trust links fully verified across all 255 active milestones** [view:/timeline] [persona:researcher]: replaced dead or wrong-page citation links (Israel, NIST, Malaysia, BSI, Spain, PIONIER-Q and others), corrected several factual dates and details (Estonia, PIONIER-Q, the US Executive Order, NSA, BSI), and closed every remaining gap linking a milestone to its trusted source. Every event now carries a stable ID that survives future title corrections.
- **Migrate vendor-risk cards now reflect real CVE exposure** [view:/migrate] [persona:architect] [persona:ops]: vendor-risk cards previously didn't factor in known CVEs at all; they now surface real exposure data, alongside 3 corrected data errors and honesty fixes across all 4 migration workbench tabs (Plan, Replace, Roadmaps, product detail) that were showing misleading status text.

### Data

- **27 Timeline-to-Compliance citation links backfilled** [view:/compliance] [view:/timeline] [persona:researcher], raising Timeline's related-standards coverage from 32.5% to 43.1%.
- **420 missing entries backfilled into the trusted-sources registry** [persona:researcher]: also fixes a duplicate-key bug that had been silently dropping cross-reference rows.
- **Migrate's certification and CPE cross-reference data fully regenerated** [view:/migrate] [persona:architect] against the latest product catalog.

## [4.21.6] - 2026-07-16

The Compliance page's CSWP.39 governance tags (the badges showing which
frameworks touch crypto governance, inventory, observability, assurance, or
lifecycle) now come from real, full document text instead of a truncated,
noisy extraction — plus new content across Timeline, Threats, Library, and
Migrate from a maintainer review pass.

### Fixed

- **Compliance framework governance tags are now genuinely reflective of each document, not just partially filled** [view:/compliance] [persona:researcher] [persona:architect]: the tagger used to read only the first 8,000 characters of each source with no cleanup, so for most .gov/.org pages that budget was entirely cookie banners and navigation menus before any real regulation text — and PDF sources were misread as garbage text entirely, with no error. Both are fixed; every active framework was re-tagged, with several (e.g. UK NCSC, NERC CIP, MAS's cybersecurity advisory) gaining tags they'd been missing, and one incorrect tag removed (MiCA, which its own source confirms isn't a cryptography standard).
- **5 Compliance entries that were never really about post-quantum cryptography are now hidden** [view:/compliance] [persona:researcher]: IEC 62443 (evidence permanently inaccessible), the FCA's and MAS's general risk-management guidance, MiCA, and an Argentina cyber-agency reference — all confirmed, by their own document text, to not be PQC-specific. They're marked inactive rather than deleted, so the record stays auditable.

### Data

- **New Timeline entry**: NSPM-12, the presidential memorandum setting the National Security Systems post-quantum migration track (target: full migration by 2035), re-establishing CNSS authority under NSA's Director.
- **New Threats entry**: the Hong Kong Monetary Authority's Fintech Promotion Blueprint, introducing a Quantum Preparedness Index for Hong Kong's banking sector.
- **22 new Library documents** [view:/library] [persona:researcher]: NIST's draft post-quantum updates to the PIV (federal employee ID card) standards, plus new IETF drafts.
- **Vendor roadmaps refreshed for Microsoft and Cloudflare** [view:/migrate] [persona:architect]; a duplicate Cisco entry was removed.
- **13 more Migrate catalog products verified** [view:/migrate] [persona:researcher]: AT&T and STMicroelectronics products classified, 11 more ACVP-certified products added; 3 duplicate submissions and 1 unsupported PQC claim were rejected rather than added.

## [4.21.5] - 2026-07-15

The Compliance page's traceability drawer now shows only real, data-backed
relationships instead of fabricated boilerplate, and the Library, Timeline,
Threats, and Migrate catalogs pick up a large batch of newly verified content
following a full review of the maintainer agent's pending proposals.

### Fixed

- **Compliance traceability chains no longer show fabricated claims** [view:/compliance] [persona:researcher] [persona:architect]: every framework row's "Tested by," "Cited by," and "Related & overlapping" details used to fall back to hardcoded, generic text (e.g. "Tested by: ACVP / FIPS 140-3" on rows that were never actually tested that way) whenever real data was missing. All three pillars now build these chains only from real extracted relationships and CSV citations, or show an honestly short chain when no data exists yet — never a made-up claim.

### Data

- **17 new PQC-certified products added to Migrate**, verified directly against their real NIST ACVP certificates [view:/migrate] [persona:researcher] [persona:architect]: includes Chainguard's FIPS OpenSSL provider (6 build variants), Alibaba Cloud Crypto, TASS Crypto Engine, Citrix and Crypto4A's FIPS modules, DINAMO's HSM library, and two open-source PQC implementations (noble-post-quantum, KU Leuven's ML-DSA-OSH).
- **18 new vendors registered with verified GLEIF legal-entity records** [view:/migrate] [persona:researcher]: including Chainguard, Thales Trusted Cyber Technologies, Dell Technologies (for the BSAFE product line), Analog Devices, AT&T Enterprises, and STMicroelectronics — each checked against the real GLEIF registry, not just a name guess.
- **20+ new documents added to Library and Timeline** [view:/library] [view:/timeline] [persona:researcher]: new IETF drafts covering post-quantum TLS, IKEv2, EAP, GSS-API, and JOSE/COSE, plus NIST's proposed post-quantum update to the PIV (Personal Identity Verification) standards, and government milestone updates.
- **Fixed a duplicate timeline entry**: a Federal Register notice for Executive Order 14412 was being tracked as a separate event from the White House's own six-milestone entry for the same order; consolidated into the existing entry.

## [4.21.4] - 2026-07-14

Vendor Risk and certificate details get clearer in-place drill-downs on
/migrate, the Protocol Support matrix picks up TLS 1.3's new RFC plus two
new tracked protocols, and a data-quality pass recovers, verifies, and
corrects more of the Migrate catalog's supporting evidence.

### Changed

- **Vendor Risk matrix rows and dependencies now expand in place** [view:/migrate] [persona:architect] [persona:executive]: clicking a product or one of its dependency chips in the risk matrix now opens full product details right there, instead of leaving you to look it up elsewhere. The "Migration Gap" axis (previously "Likelihood," which was really measuring migration progress, not risk) now shows plain labels like "Severe Gap" or "Minimal Gap" instead of raw percentages, and layers with no risk now show as individual badges instead of one long sentence.
- **Products with multiple certifications of the same type now show all of them** [view:/migrate] [persona:architect]: a product with, say, two FIPS validations used to only surface the newest one. A popover now lists every certification with its date and link.

### Data

- **Protocol Support matrix updated for TLS 1.3, Wi-Fi, and Fibre Channel** [view:/algorithms] [persona:developer] [persona:architect]: TLS 1.3 now points at RFC 9846, which formally obsoletes the original RFC 8446 (also updated on /library). Added two new tracked protocols: IEEE 802.11bt (Wi-Fi PQC, still pre-draft) and Fibre Channel FC-SP-3, which already has a real production deployment (Broadcom Emulex SecureHBA, 120,000+ units shipped) using ML-KEM-1024/ML-DSA-87.
- **More Migrate products verified against their real supporting documents** [view:/migrate] [persona:researcher] [persona:architect]: recovered evidence for several products whose proof documents were previously unreachable, and corrected two rows whose cited source didn't actually discuss the specific PQC claim being made (their assessment is now flagged for review rather than silently trusted).

## [4.21.3] - 2026-07-14

A large data-quality pass: hundreds of Migrate products got a real
PQC-support assessment, Compliance framework tags now come from the
actual regulation text instead of a one-line summary, and Library
reference coverage is complete.

### Data

- **Hundreds of products on /migrate now have a real, evidence-backed PQC assessment instead of "Unknown"** [view:/migrate] [persona:researcher] [persona:architect]: worked through the full backlog — 318 products assessed from their actual product documentation or vendor announcement, and 44 previously-missing proof documents recovered and matched back to their product.
- **Compliance framework tags now reflect the actual regulation text, not a one-line summary** [view:/compliance] [persona:researcher] [persona:architect]: the crypto-posture-management tags (governance, inventory, observability, assurance, lifecycle) shown for each framework had been silently computed from a short hand-written description since a document-reading bug went unnoticed for weeks; re-tagged all 152 frameworks that have a downloaded source document, correcting 70 of them to match what the regulation actually says.
- **Every Library reference document is now fully enriched** [view:/library] [persona:researcher]: the last 11 documents lacking a topic summary and metadata are filled in, closing out full coverage.
- **In-app search now covers all of the above** [persona:developer] [persona:curious]: the search index was rebuilt to include the newly added and corrected records.

## [4.21.2] - 2026-07-13

### Data

- **Cleaned up vendor PQC-roadmap entries and verified trusted-source links** [view:/migrate] [view:/library] [persona:researcher] [persona:architect]: every vendor roadmap entry was checked against a real standard — is it a genuine company-wide PQC strategy, or just a single product's page that had been miscategorized? 57 entries that didn't qualify were removed or corrected, with the underlying evidence moved to the right product listing where it belonged. Also live-verified 83 previously-unconfirmed trusted source links and recovered 6 Timeline source documents that had gone missing.
- **Reconciled a forked same-day data lineage across 7 datasets** [view:/migrate] [view:/library] [view:/compliance] [persona:researcher] [persona:architect]: two parallel work branches had independently updated the same vendor, certification, product-catalog, library, and trusted-source data on the same day; merged them row-by-row rather than picking one side, so no independent corrections or additions from either branch were lost.

## [4.21.1] - 2026-07-11

### Fixed

- **The Simulation's playback bar now closes when you dismiss it** [view:/simulation] [persona:executive] [persona:curious]: after an auto-run finished, the bottom transport bar stayed on screen and its Close button did nothing — it now dismisses correctly (and the next phase run re-opens its completion screen as expected).

### Data

- **Recovered Library source documents and reconciled catalog data** [view:/library] [view:/migrate] [persona:researcher] [persona:architect]: restored 2 real Library documents flagged as low-quality and fixed a `<noscript>` false-positive in the source-quality check; reconciled a forked same-day vendor/migrate catalog lineage, removed a duplicate vendors file, and refreshed vendor and migrate-catalog enrichment.

## [4.21.0] - 2026-07-11

Share buttons across every hands-on tool, a single-phase completion screen
for the Simulation, deep-linkable Algorithms protocol-matrix views, and a
broad data-quality pass that repairs document revision chains and tightens
the data-integrity gates.

### Added

- **Share buttons on every hands-on tool** [view:/playground] [view:/business] [persona:developer] [persona:executive]: every Playground tool surface and Business Center tool now has a share button, so you can link someone straight to the exact tool.
- **A completion screen for a single Simulation phase** [view:/simulation] [persona:executive] [persona:curious]: after playing one phase with "Play This Phase", you get an honest end screen scoped to just that phase — no whole-program or maturity claims.

### Changed

- **The Algorithms Protocol Matrix is now deep-linkable** [view:/algorithms] [persona:developer] [persona:architect]: the Protocol Matrix view and its filters are captured in the URL (and a dead sub-tab parameter was fixed), so you can share a link to a specific filtered matrix and the PQC Assistant can point you to it.
- **The PQC Assistant can now link to all 63 Playground tools** [view:/playground] [persona:developer] [persona:curious]: the assistant's knowledge base now carries one entry per tool, so it can deep-link you to any of them.

### Fixed

- **Repaired the Migrate workbench guided tour** [view:/migrate] [persona:architect] [persona:developer]: the guided-tour steps pointed at click targets that had moved; they now land correctly.

### Data

- **Repaired document revision chains and marked superseded editions** [view:/library] [persona:researcher] [persona:architect]: fixed broken revision-roll-in chains across the Library (including the PKCS#11 v3.1 and v3.2 draft editions, now shown as previous revisions of the final v3.2 OASIS Standard) plus 22 others; deprecated a vendor whose site is now a parked domain; refreshed vendor, migrate-catalog, and library enrichment.
- **Tightened the data-integrity gates**: added a revision-chain validator (DS21) and corrected the enrichment-heading and algorithm-transition validators so they match the real data.

## [4.20.0] - 2026-07-10

A consolidation release: a hands-on KMIP Command Lab for certificate
operations in the playground, a fix to the Report page's CBOM Builder link,
and a broad data-quality sweep that rebuilds the site's trust-spine
registries and refreshes the algorithm and learning-module data.

### Added

- **A Command Lab for KMIP certificate operations** [view:/playground] [persona:developer] [persona:architect]: the KMIP 3.0 tab now runs certificate operations — Certify, Validate, and public-key verification — in the browser against a rebuilt engine, with per-operation forms, an expanded glossary, extra lessons, and knowledge checks so you can learn each command hands-on.
- **Composite (hybrid classical+PQC) certificates end-to-end** [view:/playground] [persona:developer] [persona:architect]: the Commands tab surfaces the LAMPS composite-signature algorithms, and the in-browser engine now issues and validates composite ML-DSA+ECDSA certificate chains for real — each component signature independently verified.
- **Cross-plane certificate showcases** [view:/playground] [persona:developer] [persona:architect]: WP-3/4/6 demos — observe a KMIP-issued certificate as a raw PKCS#11 object, watch `CKA_ALLOWED_MECHANISMS` enforcement across planes, and run FrodoKEM/Classic McEliece through the PKCS#11 side.

### Changed

- **Refreshed the algorithm reference data** [view:/algorithms] [persona:researcher] [persona:developer]: the algorithm properties, status tiers, and candidate-family data were rebuilt from a fresh, canonical July 2026 reference snapshot so the tables and pickers reflect the current standardization state.
- **Rebuilt the site's data trust-spine** [view:/library] [persona:architect] [persona:researcher]: the registries the site trusts (glossary, sources, migrate proofs, timeline evidence) were rebuilt to be complete, canonical, and consistency-guarded, and the data validators can now actually fail on defects instead of passing silently.
- **Added PKCS#11 v3.2 as a finalized OASIS Standard to the Library** [view:/library] [persona:developer] [persona:architect]: the June 2026 OASIS Standard is now the active reference, with the earlier Committee Specification Draft kept as a previous revision rather than deleted.

### Fixed

- **The Report page's CBOM Builder link now lands in the right place** [view:/report] [persona:architect] [persona:developer]: corrected the CBOM Builder deep link so it opens the builder directly, backed by new real-browser test coverage.
- **Corrected content across several PKI learning modules** [view:/learn] [persona:developer] [persona:curious]: the EMV payment, IoT/OT, PQC candidates, governance, skills/team-structure, and standards-bodies modules picked up data and copy corrections from the trust-spine sweep.
- **Fixed a compliance KPI and cleaned up certification data** [view:/compliance] [persona:executive] [persona:architect]: corrected a fine-lookup key mismatch that affected an executive KPI, fixed PQC-coverage on several certification records against their published NIST security policies, and populated product links across certification cross-reference rows.
- **Tidied the Migrate catalog** [view:/migrate] [persona:architect] [persona:developer]: deprecated three duplicate product entries, corrected an inaccurate PQC-support claim, fixed a status label that showed non-PQC products as fully verified, and remapped catalog rows to the current category taxonomy.
- **Recovered broken Library sources and cross-references** [view:/library] [persona:researcher] [persona:architect]: restored missing or broken source documents (including two corrected ETSI version numbers) and repointed internal cross-references, and fixed leader resource links.
- **Re-enriched and recovered more Library documents** [view:/library] [persona:researcher] [persona:architect]: refreshed enrichment on several long documents with an improved pre-filter (e.g. ANSSI PQC SSH/IPsec guidance, APRA CPS 234, OpenSSL 3.x docs) and recovered two more cached sources with stale URLs.

### Data

- **New canonical algorithm reference snapshot (July 2026)** replaces the older implementation-attacks table; timeline snapshot refreshed with fresh enrichment.
- **Expanded the patents dataset** [view:/patents] [persona:researcher] [persona:executive]: added newly-enriched PQC-relevant patents from the 2016–2022 backlog and widened the harvest beyond the US to include European (EP) and international (WO) filings, with a patent detail-drawer UI fix.

## [4.19.0] - 2026-07-09

A hands-on release for the KMIP playground, the Report page, the Business
Center, and the Simulation board: the in-browser KMIP engine is rebuilt from
the real 0.13.1 engine with eight more operations now genuinely executed
instead of simulated, the report gains a Cryptographic Bill of Materials
section built on the new CycloneDX 1.7 standard, the Simulation board's
framework references were audited line by line against what actually ships,
and a sourcing sweep across the Business Center tools corrected several
citation and data errors.

### Added

- **Three new KMIP lessons with a guided tour, glossary, and knowledge checks** [view:/playground] [persona:developer] [persona:architect]: the CACP Learn track now continues past the basics with three new walkthroughs (lessons 7–9), a guided tour of the KMIP 3.0 tab, an in-context glossary, and knowledge checks so you can confirm what you learned.
- **A rollback recipe for batch key migrations** [view:/playground] [persona:ops] [persona:architect]: the KMIP workbench now ships a batch-Undo rollback recipe plus validated pass/fail scenarios for each migration policy, so you can see what a safe abort looks like before trying one for real.
- **The Report page now includes a Cryptographic Bill of Materials (CBOM) section** [view:/report] [persona:architect] [persona:executive]: your report can now show the site's machine-readable inventory of cryptographic assets alongside the existing risk and compliance sections.

### Changed

- **The site's CBOM now follows CycloneDX 1.7** [view:/report] [persona:architect] [persona:developer]: upgraded from 1.6, adopting the new Cryptography Registry identifiers and adding classical (non-PQC) crypto assets, so the inventory names algorithms the same way scanning tools do.
- **Eight KMIP operations promoted from simulated to real** [view:/playground] [persona:developer]: the in-browser KMIP engine was rebuilt from engine release 0.13.1; operation labels are now honest about which commands execute for real versus which are simulated, and the OASIS test-corpus replay is aligned to the exact engine baseline it runs against.
- **Reorganized the Report page's internal code for easier maintenance** [view:/report] [persona:developer] [persona:architect]: the report's sections (risk breakdown, compliance impact, recommended actions, threat landscape, and others) now each live in their own file instead of one large file. This is an internal, behind-the-scenes change — the report itself looks and behaves exactly the same, including sharing a report link and viewing a sample report.

### Fixed

- **Corrected several sourcing and citation errors across Business Center tools** [view:/business] [persona:executive] [persona:architect]: the Cost Model Explorer's breach-probability default now uses the same sourced, size-tiered figure as the ROI Calculator and Breach Cost Model instead of an older unsourced flat estimate; the CRQC Scenario Planner's "Software/Firmware Signing" compliance deadline was corrected from 2025 to 2030 to match the actual exclusive-use date (2025 was NSA's earlier "prefer by" milestone, not the deadline); the Policy Template Generator no longer cites NIST SP 800-88 (a media-sanitization standard) as if it were a key-destruction standard; the Supply Chain Risk Matrix no longer claims NIST's crypto-agility guidance defines a specific "six asset class" taxonomy (it doesn't — this is the tool's own simplified classification); the Audit Readiness Checklist's citation for CMVP/CAVP validation evidence was corrected to the right section; and several tools' references to NIST's crypto-agility guidance were updated to the current, non-withdrawn version of that document.
- **Simulation framework references now match what actually ships** [view:/simulation]: corrected gate approval authorities, stale live/gap labels on linked tools and reports, and drift in each phase's list of produced artifacts.
- **Simulation jargon is now explained where it appears** [view:/simulation] [persona:curious] [persona:executive]: terms like TNFL and the governance vocabulary get plain-language glosses, activities surface their teaching text, and the board now shows which phases run in parallel instead of implying a strict sequence.
- **Closed topical gaps in Simulation phase content** [view:/simulation]: fixed Phase 5 wave content, filled Phase 1 and 2 topical gaps, corrected the Phase 3 risk-scoring label, and added the missing Foundations F.5 coverage.

## [4.18.0] - 2026-07-09

A cross-page accuracy release covering Editorial Independence, Simulation, Explore, the Landing page, and the Sponsor page: the Editorial Independence page's promises about sponsor badges and the anonymous tipline now match what's actually built, the Simulation board acknowledges when Researcher and Curious visitors are shown the Executive seat by default, the Explore launcher's "recommended for you" badges are now driven by a single source of truth instead of a hand-maintained list, the Landing page's headline facts and role-adaptation summary are now derived from live data instead of hardcoded text, and the Sponsor page's tier benefits now match what's actually delivered today.

### Fixed

- **The Editorial Independence page's "Sponsor" badge claim is now real** [view:/editorial-independence] [view:/migrate] [persona:executive]: the badge is now genuinely wired to the sponsor list and appears on a product's Migrate listing only when that vendor is an actual sponsor. It shows for zero products today (there are no sponsors yet), but the mechanism is live and will work the moment a sponsor is added.
- **The anonymous tip line promise is now honest about its status** [view:/editorial-independence]: it's labeled as planned rather than implying it already exists, with a working pseudonymous GitHub Discussions link as an interim way to reach us.
- **Funding-source language on the Editorial Independence page now matches the real Sponsor page** [view:/editorial-independence] [view:/sponsor]: removed a reference to a "Consultant tier" that doesn't exist; the real tiers (Supporter, Sponsor, Patron) are now named consistently in both places.
- **Added a table of contents with jump-links to the Editorial Independence page** [view:/editorial-independence], matching the pattern already used on the Terms and About pages.
- **The Simulation board now explains why Researcher and Curious visitors start in the Executive seat** [view:/simulation] [persona:researcher] [persona:curious]: previously this happened silently with no explanation; a dismissible banner and a hint on the seat switcher now point these visitors to the tour best suited to them.
- **Fixed mismatched phase recommendations in the Simulation board's "keep learning" prompts** [view:/simulation] [persona:architect] [persona:ops]: the architect and operations personas were being pointed to Learn content for phases that aren't actually part of their role, and were missing content for phases that are.
- **Corrected stale "coming soon" labels on several Simulation framework references** [view:/simulation] [persona:researcher]: a few report and business-tool destinations referenced as not-yet-built were actually already live; those references now point to the real, working pages.
- **Added a cross-reference between the Simulation board's "TNFL" label and the Report page's "HNFL" label** [view:/simulation] [view:/report]: these refer to the same "harvest-now" risk concept under two different names; each page now links to the other so the terminology isn't confusing.
- **Explore page's "recommended for you" badges no longer drift out of sync with the rest of the site** [view:/explore]: badges are now computed from the same persona-recommendation data used elsewhere, instead of a separately hand-maintained list that could disagree with it.
- **Added a Migrate tile to the Explore launcher** [view:/explore] [persona:ops], and Playground and Library tiles for developers and researchers.
- **Fixed the Explore page's Command Center tile for the Curious persona** [view:/explore] [persona:curious]: clicking it previously sent Curious visitors to a page they don't have access to; it now sends them to the relevant learning module instead.
- **Corrected a stale "2-minute questionnaire" claim on the Explore page's Assess tile** [view:/explore]: the fast-track assessment now takes about 6 questions; the copy no longer cites an outdated time estimate.
- **The Landing page's headline facts are now pulled from live data** [view:/] [persona:executive] [persona:researcher]: the executive tagline's compliance-deadline reference and the researcher tagline's "just landed" standards reference previously were hand-typed and could go stale; both now recompute from the same Timeline and Library data shown elsewhere on the site.
- **The Landing page's persona welcome modal now lists your recommended pages from a single source** [view:/]: previously each persona's "featured surfaces" text was written by hand and could disagree with the site's actual navigation and recommendations; it's now generated from the same data.
- **Renamed the misleading "Standards Tracked" stat on the Landing page to "Library Documents"** [view:/]: the number was always a count of Library entries, not standards specifically.
- **Replaced browser popup alerts with the site's normal notification style** [view:/] in the backup/restore settings panel.
- **Removed a non-functional Google Drive sync option** [view:/] from the backup/restore settings panel that was permanently disabled and had no way to turn on.
- **Fixed the Landing page's `?picker=open` link** [view:/]: following this link from other pages now actually opens the persona picker instead of doing nothing.
- **Sponsor page benefits now match what's actually delivered** [view:/sponsor] [persona:executive]: perks that aren't built yet (listing-traffic reports, a full-time standards analyst, a monthly compliance digest) are now honestly labeled as planned rather than implied to be active today; the "thank-you note in the changelog" perk is now real and appears on the Changelog page.
- **Sample-report link on the Sponsor page now opens a real example report** [view:/sponsor] [view:/report]: previously it pointed at an empty report page; it now opens a working sample that doesn't affect your own saved progress.
- **Replaced a personal email address with the official contact address** [view:/sponsor].
- **Funding-goal line items on the Sponsor page now link to where you can verify them** [view:/sponsor] [view:/revisions] [view:/editorial-independence]: for example, the "monthly vendor-mapping refresh" goal links to the page showing that refresh history.

## [4.17.0] - 2026-07-09

A cross-page accuracy release covering Timeline, Compliance, Threats, Patents, Leaders, Learn, and the Library: deadline mandates on the Timeline are now individually sourced and labeled instead of guessed, the Compliance page covers the actual federal executive order behind the 2030/2031 deadlines, the Threats page's quantum-computer arrival estimate is now the same number everywhere it appears, Patents share links no longer lose your filters, Leaders profiles are split into a curated set and the full contributor list, several Learn modules got corrected facts and real quiz coverage, and dozens of Library references were re-verified, fixed, or retired.

### Fixed

- **Every deadline on the Timeline now shows whether it's a binding legal mandate, informal guidance, or still-draft language** [view:/timeline] [persona:executive] [persona:architect]: most rows previously had no label at all. All deadline and CNSA 2.0 migration rows are now individually labeled from their own primary source, and the popover and the headline deadline banner now agree with each other instead of computing "binding" two different ways.
- **The Timeline's chart no longer clips future or historical entries to a fixed 2024–2035 window** [view:/timeline]: the year axis now scales to whatever data is actually in view.
- **Malformed dates in the Timeline's underlying data no longer silently render as blank bars** [view:/timeline]: bad values are now excluded with a logged warning instead of failing invisibly.
- **The Compliance page now covers the actual U.S. executive order behind the post-quantum migration deadlines** [view:/compliance] [persona:executive]: the operative order (with its 2030 key-establishment and 2031 digital-signature deadlines) previously only appeared on the Timeline page, not in the Compliance framework list.
- **Several "plain-English summary" blurbs on the Compliance page were overstating what their underlying framework actually requires** [view:/compliance] (including DORA, CNSA 2.0, ANSSI, and BSI guidance): rewritten to match what's actually in the framework record, including the difference between a binding deadline and a staged recommendation.
- **The Compliance Records tab no longer shows a live-sounding "Refresh Data" button that does nothing on the deployed site** [view:/compliance]: it's now disabled with an explanation, and the freshness date reflects the actual data snapshot instead of the moment you loaded the page.
- **The Compliance page's "New to PQC compliance?" intro banner no longer reappears every visit** [view:/compliance] once you've already seen it.
- **Threat-horizon (Q-Day) estimates now agree across the whole Threats page** [view:/threats]: the hero summary, the trajectory chart, the economics calculator, and the capability strip previously each computed their own version of "when could a quantum computer break today's encryption," and could disagree with each other. All four now derive from one shared calculation.
- **Fixed a false-positive bug in the Threats page's "harvest-now" vs. "forge-now" risk classification** [view:/threats]: threats whose description merely mentioned a post-quantum replacement algorithm's name (like ML-KEM or ML-DSA) were sometimes being misclassified based on that mention alone. Threats that genuinely can't be classified from available data now say so honestly instead of defaulting to a guess.
- **The Threats page now shows why each threat was vetted the way it was** [view:/threats] [persona:researcher]: peer-review status, confidence level, the body that vetted it, and any data-quality notes are now visible in the threat detail view, and CRQC arrival-estimate citations are now clickable links to their sources.
- **Merged two near-duplicate industry categories on the Threats page** [view:/threats] ("Critical Infrastructure" and "Energy / Critical Infrastructure") that were splitting the same sector's threats across two filter buckets.
- **Threat classification definitions are now readable on touchscreens** [view:/threats]: they previously only appeared on hover, which doesn't work on mobile; tapping now opens the same explanation.
- **Fixed a data-loading bug that could conflate "this patent has no post-quantum relevance score" with "this patent scored zero"** [view:/patents].
- **Sharing a filtered Patents view now preserves what you were actually looking at** [view:/patents]: the corpus scope (post-quantum only vs. everything) and your chosen columns weren't part of the shareable link, so recipients could land on a different view than the one you sent. Also added a Share button to the page, which it didn't previously have.
- **Corrected the classification of Classic McEliece across the Patents catalog** [view:/patents]: it was mislabeled as a classical (pre-quantum) algorithm; it's actually a NIST post-quantum Round 4 candidate, recommended by Germany's BSI. Fixed on all 13 affected records.
- **Patent search now finds algorithms by either their original filing-era name or their finalized NIST name** [view:/patents] (e.g. "Kyber" and "ML-KEM," or "Dilithium" and "ML-DSA," now both work).
- **Added a small glossary for patent-specific terms** [view:/patents] [persona:developer] (CPC classification codes, priority/filing/issue dates, independent claims), available as inline tooltips.
- **The Leaders page now separates the curated, individually-vetted profile set from the larger auto-imported contributor list** [view:/leaders]: it previously showed all 332 profiles mixed together with no way to tell which had been individually reviewed. The default view now shows the 208 curated profiles, with a toggle to see everyone.
- **Refreshed and spot-checked Leaders profile data** [view:/leaders], fixing two out-of-date entries and adding a visible "verified as of" date to each profile.
- **Fixed a bug where an executive's explicit "sort by name" choice on the Leaders page was silently overridden back to a relevance-based order** [view:/leaders] [persona:executive].
- **Added a Skeptic/Critic filter category to the Leaders page** [view:/leaders] and a couple of previously-missing sourced entries to that category and to Industry Adopter.
- **Fixed two overstated claims in Learn module content** [view:/learn] [persona:executive]: a national security algorithm mandate was described as a blanket 2030 government-wide requirement (it's staged and scoped to national security systems), and a post-quantum certificate size comparison significantly overstated the size difference versus real measured figures (it said certificates are 10–50x larger; they're actually roughly 4–7x larger).
- **Learn checkpoints now only count as "passed" once you've actually scored well enough on them** [view:/learn]: previously, simply opening every module in a section marked its checkpoint as passed regardless of quiz performance. Existing progress isn't reset; you'll see a one-time notice explaining the change.
- **Fixed a Learn progress-tracking bug where browsing a "curious mode" module's workshop steps counted as completing them** [view:/learn]: viewing now only marks a module as viewed; workshop credit requires actually doing the workshop.
- **Three previously-orphaned Learn modules (governance/risk, team staffing, and SOC incident response) now have quiz coverage and are properly routed into the relevant role-based learning path** [view:/learn], instead of being reachable only by direct link with no way to test your understanding.
- **Retired a redundant Learn module that duplicated a newer, fuller one on team staffing** [view:/learn], and retired the old five-mode Learn dashboard (old links now redirect to the current Learn experience).
- **Learn module reference panels now show when each module's content was last reviewed** [view:/learn] [persona:researcher].
- **Filled in missing descriptions for 29 Library entries** [view:/library] that previously just repeated the document's title with no summary of what it actually covers.
- **Re-checked every Library link that was flagged as broken or unverified** [view:/library]: of the 100+ flagged links, the large majority were confirmed live and corrected (including a wrong ETSI document version), and the remainder that are genuinely unreachable (or fabricated document numbers that don't exist in the issuing standards body's catalog) are now retired instead of sitting in the catalog unresolved.
- **Fixed a Library entry that incorrectly implied FN-DSA (FIPS 206) has already been published** [view:/library]; it remains in draft.
- **Corrected a mismatched document title on a Library reference** [view:/library] that had been carrying an unrelated draft's title instead of its own.
- **Normalized a handful of Library confidence scores that were on the wrong 0–1 scale** [view:/library] instead of the 0–100 scale used everywhere else, and surfaced the confidence score in the document detail view.
- **The Library can now be filtered by why you're looking something up** [view:/library] (reference material vs. general education), corrected for about 40 entries that a keyword-based guess had filed under the wrong purpose.

### Data

- Refreshed the Timeline, Compliance, Patents, Leaders, and Library datasets with new dated snapshots and re-verified sourcing; added quiz question coverage for previously-untested Learn topics (software bill of materials, cryptography bill of materials, crypto-algorithm registry naming, and post-quantum verification/closure).

## [4.16.0] - 2026-07-09

A cross-page accuracy and trust release touching Report, Business tools, Revisions, Changelog, FAQ, Playground, OpenSSL Studio, Terms, About, and Migrate: shared report links now show the sender's real score, breach-cost defaults finally agree across three business tools, the revisions feed surfaces corrections that were previously invisible, the Playground and OpenSSL Studio get clearer status indicators and fewer dead ends, the Migrate workbench now shows which products are still awaiting verification proof, and several dead links and stale numbers are fixed across the site.

### Fixed

- **Shared and example report links now show the exact score the sender saw** [view:/report]: previously, opening a shared link recomputed the score from scratch, so a scoring-logic update after a link was shared could silently show the recipient a different result than the sender intended. Older links already in circulation still open, now with a note that they're an approximate view.
- **Viewing someone else's shared report can no longer overwrite your own saved assessment** [view:/report]: a partial safeguard only covered visitors who already had a saved assessment; first-time visitors opening a shared link were having their own (not-yet-started) assessment silently populated with the sender's data. Every input a shared report displays — industry, country, current cryptography, persona, and more — is now drawn strictly from the sender's snapshot.
- **ROI and vendor-risk figures now flag when they're using default estimates** [view:/report] [persona:executive]: the fast-track assessment path skips some inputs (like vendor dependency), so those sections were quietly falling back to neutral assumptions with no indication. They now show a "uses default estimates" note.
- **Breach-probability defaults now agree across the ROI Calculator, Breach Cost Model, and Cost of Inaction tools** [view:/business] [persona:executive]: two of the three tools were using an unsourced flat 15% instead of the sourced, size-tiered default (from Cyentia's 2025 breach research) the site had already adopted elsewhere, so the same organization could get three different breach-cost estimates depending which tool they used. All three now share one sourced default, with a simple small/average/large organization picker to adjust it.
- **Fixed a stale year in the ROI Calculator's source citation** [view:/business]: it cited a 2024 report; the figures themselves were already the 2025 update.
- **The Roadmap Builder now cites the actual federal order and deadlines behind the PQC transition mandate** [view:/business] [persona:executive]: added a sourced callout with the order number and both key-establishment and signature deadlines, verified against the official published text.
- **The "data" category on the Revisions feed was invisible** [view:/revisions]: a filtering bug hid every entry logged under the data-corrections category (28 entries) from the page entirely; it's now visible like every other category, and empty categories now auto-hide instead of sitting there as a dead click.
- **The Revisions feed was missing about seven weeks of real corrections** [view:/revisions]: several dataset updates had shipped without being logged. Backfilled with accurate before/after summaries tied to the actual changes, and the feed's signature was re-verified.
- **Freshness date labels on the Changelog page were showing the wrong file's date** [view:/changelog]: a pattern-matching bug meant some "last updated" chips (Compliance, Timeline) skipped past the newest snapshot to an older one. Also fixed the Software freshness chip, which had been pointing at a renamed file and so never appeared at all.
- **Cleaned up mislabeled role tags on several changelog entries** [view:/changelog] so each one now correctly routes to the researcher, developer, ops, or architect "For me" filter instead of a generic catch-all.
- **Fixed a dead reference link on the FAQ page** [view:/faq]: a NIST document link had gone stale after the underlying reference was renamed; FAQ links to renamed references now resolve automatically instead of opening an empty page.
- **Merged two near-duplicate FAQ questions about the Cryptography Bill of Materials** [view:/faq] into one clearer answer.
- **Fixed an inconsistent step count on the FAQ page** [view:/faq]: the risk assessment wizard's step count was quoted as both 13 and 14 in different places; confirmed the real count (13) and made every mention match.
- **Fixed the project's GitHub repository name** [view:/faq] where it had been quoted incorrectly.
- **Replaced a few exact module/document/product counts on the FAQ page with wording that won't go stale** [view:/faq] (e.g. "dozens of modules" instead of a fixed number that was already out of date).
- **The Docker-based playground tool no longer shows a dead, unresponsive embedded window when the sandbox isn't reachable** [view:/playground] [persona:developer]: it now checks whether the sandbox is actually reachable and shows a clear "request access" link instead of a blank iframe pointed at a local address that only works for the sandbox's own operators.
- **Renamed the KMIP control-plane tool consistently across the Playground** [view:/playground] so its name, banner, and page heading all match instead of showing three different names for the same tool.
- **Replaced a personal email link for sandbox-access requests with a trackable request form** [view:/playground].
- **Fixed OpenSSL Studio's documentation links** [view:/openssl] [persona:developer]: every "view docs" link across all OpenSSL commands pointed at a broken or outdated page (wrong version, malformed URL); all now go to the correct, current OpenSSL documentation.
- **Removed a non-functional option from OpenSSL Studio's configuration-file helper command** [view:/openssl] that produced an "unknown option" error when used, and clarified that the command itself requires OpenSSL 3.6 or newer.
- **OpenSSL Studio's post-quantum key/signature tools now note the OpenSSL version they require** [view:/openssl] [persona:developer] (3.5 or newer for ML-KEM, ML-DSA, and SLH-DSA), so it's clear up front rather than discovered via an error.
- **Fixed OpenSSL Studio's key-decapsulation example, which was using the wrong output flag** [view:/openssl] and silently producing empty results in some cases.
- **OpenSSL Studio now shows a clear error and retry option if the underlying engine fails to load** [view:/openssl], instead of leaving the page stuck on "Initializing..." indefinitely.
- **Marked two OpenSSL Studio example commands as reference-only** [view:/openssl] since they use shell piping the in-browser tool can't run directly, and running them now shows a clear message instead of a confusing partial result.
- **Fixed the Terms page's binding-acceptance clause, which pointed to a retired mirror site that no longer resolves** [view:/terms]: it now correctly references the live production site.
- **Added a table of contents with jump-to-section links to the Terms page** [view:/terms], plus a note on when the terms were last substantively updated.
- **Added plain-language summaries above the Terms page's export-control section and its "don't use generated keys in production" guidance** [view:/terms], so the legal text now has a plain-English preview.
- **The About page's platform statistics (module counts, dataset sizes, and similar figures) are now computed from the live data** [view:/about] instead of hand-typed numbers that could silently drift out of date as datasets grew.
- **Fixed an overstated "refreshed weekly" claim about compliance data on the About page** [view:/about]; it now shows the actual last-updated date.
- **Fixed the About page's "last security audit" date, which no longer matched the actual audit report it was describing** [view:/about].
- **The About page's changelog link now navigates within the app instead of triggering a full page reload** [view:/about].
- **The Migrate workbench now labels NIST IR 8547 as a draft** [view:/migrate] everywhere it's cited, rather than implying it's a finished standard.
- **Vendor roadmap entries in Migrate now show when they were last verified, plus a "new" or "updated" marker** [view:/migrate], so it's clear how current each vendor's stated plans are.
- **Fixed a duplicate Migrate workbench address** [view:/migrate] that could show two different URLs for the same page; both now lead to the same place.
- **Each migration wave in the Migrate planner now explains why it's sequenced where it is** [view:/migrate] [persona:architect], and the "harvest now, decrypt later" risk term is explained in plain language the first time it appears.
- **Fixed a handful of product records in the migration catalog with inconsistent verification labels** [view:/migrate] so their status now displays correctly.

### Added

- **Search on the Changelog page** [view:/changelog]: a free-text box now filters entries by title and body, on top of the existing category and role filters.
- **Explanatory tooltips on the Changelog page's freshness indicators** [view:/changelog] clarifying what each date measures and what a stale marker means.
- **Filters by zone, phase, and audience on the Business tools grid** [view:/business] [persona:executive], in addition to the existing category and text search.
- **FAQ questions aimed at your role now float to the top of their section** [view:/faq] with a small "For you" marker, when you've selected a persona (executive, developer, architect, ops, or researcher).
- **The Business Center's learning module list now collapses by default for advanced users** [view:/business] [persona:developer], keeping its header visible so it's a one-click expand rather than taking up space unasked.
- **The Playground's algorithm picker now shows a "Draft" badge with an explanatory tooltip for algorithms that aren't yet finalized standards** [view:/playground] [persona:developer], so it's clear at a glance which selections are backup candidates rather than production-ready standards.
- **Executive-persona guidance banners added to three more Playground tools** [view:/playground] [persona:executive] (the interactive, HSM, and KMIP control-plane tools), pointing toward the business-focused Command Center and Compliance views instead of leaving executives on a developer-oriented tool.
- **Products in the Migrate workbench now show a verification badge and last-verified date** [view:/migrate], and the page now tells you how many catalog entries are hidden because they're still awaiting verification proof, instead of leaving that count invisible.
- **The Migrate workbench's asset guidance is now tailored for executive and developer views** [view:/migrate] [persona:executive] [persona:developer], highlighting the systems (cloud key management, TLS, code signing, databases) most relevant to each role instead of showing the same generic list to everyone.

## [4.15.0] - 2026-07-08

A Learn modules and Patents refresh release: two new modules close a cross-reference gap that's existed since earlier modules started pointing at them, the Patents page now highlights what's new since your last visit, and Algorithms defaults to only showing FIPS-validated results.

### Added

- **A "recently added" view for Patents, and click-to-drill on the filing-year chart** [view:/patents] [persona:researcher]: newly published or updated patents are now marked so you don't have to compare snapshots yourself to spot what's new, and clicking a bar in the filing-year chart now filters straight to that year.
- **A CycloneDX Cryptography Registry learning module** [view:/learn/crypto-registry] [persona:developer]: covers CycloneDX's standardized naming registry for cryptographic algorithms and curves, with hands-on algorithm-normalizer and curve-lookup workshops.
- **A Software Bill of Materials (SBOM) learning module** [view:/learn/sbom] [persona:developer]: covers SBOM formats and generation tooling and how an SBOM feeds into a CBOM — closing a gap where SBOM was referenced by several other modules but had no dedicated module of its own.

### Fixed

- **The Algorithms page now defaults to showing only FIPS-validated algorithms** [view:/algorithms]: it previously defaulted to also showing unvalidated/candidate entries, several with stale round-status left over from before NIST's May 2026 update (NIST IR 8610) moved or eliminated them. Also removed two fabricated placeholder algorithm entries and replaced 14 citations that pointed to unrelated papers with verified sources.

### Data

- Added CycloneDX, NTIA, OASIS CSAF/VEX, and SPDX reference entries to the library catalog backing the new SBOM and Crypto Registry modules.

## [4.14.0] - 2026-07-07

A Migrate data accuracy release: a broad, evidence-based cleanup of the product and vendor catalog closes hundreds of unproven or vague claims, fixes mistagged vendors and duplicate listings, and restores a site-wide data-quality check that had been silently broken for months.

### Fixed

- **Two product listings had quietly reverted to disproven claims** [view:/migrate] [persona:ops]: a Futurex HSM and a Renesas/Veridify chip were both re-showing post-quantum support that an earlier correction had already disproven, with nothing catching the regression. Both are corrected again, this time with an automated check in place so it can't silently happen a third time.
- **429 product and vendor entries cited a source that didn't actually exist** [view:/migrate]: some had no citation at all; others cited one that had never been registered anywhere, which is worse, because nothing was flagging it. Nearly all now point at a real, checkable source.
- **~175 product listings said "yes, it supports this" with no specifics** [view:/migrate]: several were a literal unfilled placeholder. Each now names the actual technology involved, sourced from the product's own saved evidence or fresh research — not guessed.
- **A dozen products were tagged to the wrong company**, including two duplicated vendor records and one of pqctoday's own project listings misattributed to an unrelated company. All retagged to the correct vendor.
- **Several duplicate product listings merged** [view:/migrate]: the same product was showing up twice under slightly different names citing the same announcement.
- **Two products were claiming current support for something their own documentation says is still just a future plan** [view:/migrate]: corrected to show "planned" instead of "yes."
- **The site's overall data-quality checking tool had been silently broken since April** and couldn't run at all — a cleanup had removed a file it depended on. Restored, and confirmed the missing file was genuinely safe to bring back (no private information in it).
- **A "successful" evidence download was actually a bot-block page in disguise**, twice — caught by reading the content instead of trusting the download status, and fixed so it can't slip through silently again.

### Data

- Closed the evidence-download backlog for the migrate catalog's trust-score archive from 580 missing entries down to 10.
- Removed 117 leftover categories from the migration-priority dashboard that predated a recent category reorganization, after individually checking each one so nothing intentional was deleted.
- Added a new automated check ensuring every product and vendor entry's cited source actually resolves to something real, mirroring an existing check already used elsewhere on the site.

## [4.13.0] - 2026-07-07

A Threats page redesign: one continuous page instead of a hidden second tab, a consolidated actions menu, and a simplified view-mode set. Plus a refreshed SEO feature list reflecting the site's current surface.

### Added

- **The Threats page's most decision-forcing number — the CRQC migration deadline — is now visible without clicking a tab** [view:/threats]: the page previously split into a "Threat Catalog" tab (default) and a "CRQC Threat Horizon" tab; nothing on the default tab prompted anyone to find the second one. Both are now one continuous page, with the sector-exposure summary, the economics header, the capability strip, and the real CRQC trajectory chart all visible by default.

### Changed

- **Threats page actions consolidated into one menu** [view:/threats]: each threat card/row showed up to 8 small controls at once (criticality pill, ID, status, class badge, Shor-tier badge, trust score, Endorse, Flag, bookmark). Endorse and Flag now live behind a single "···" menu shared by both the card and table views; bookmark stays a dedicated visible control.
- **Mobile Threats view now uses the same component as desktop** [view:/threats]: the mobile list was a separate, hand-maintained implementation that had quietly drifted out of sync — it was missing the class badge, Shor-tier badge, trust score, and bookmark toggle entirely. It's now the same responsive grid used everywhere else, so a future change can't silently disappear on mobile again.
- **Removed the "Industry Stack" view mode on Threats** [view:/threats]: it duplicated grouping already available via the section headers and left-rail table of contents, with more visual weight and less density.
- **The Shor-tier badge moved from the Criticality column to the crypto-at-risk row it actually describes** [view:/threats]: Shor tier is about how easily the underlying crypto breaks, not a second criticality scale; this also narrows the table and reduces horizontal scrolling.
- **The landing page's feature list is up to date** [view:/]: it still said "49 Hands-on Learning Modules" (now 62) and didn't mention the Simulation, the Threats CRQC dashboard, or the Business Center tools at all.

## [4.12.0] - 2026-07-06

A crypto-agility, algorithms, and Migration Workbench release: FrodoKEM and Classic McEliece now run for real in the CACP Playground per BSI TR-02102-1; the Migration Workbench gets a search-and-confirm UX pass; several algorithm data gaps are closed; and the Breach Scenario Simulator / Cost of Inaction Analyzer are rebuilt on a verified 2025 risk model with realistic migration timing.

### Added

- **A "Memory space required" section in the HSM Capacity Calculator** [view:/playground/hsm-capacity] [persona:architect]: estimates how many keys (private key plus certificate) fit in a given HSM's key-storage budget across classical, hybrid, and post-quantum key types, with the underlying formula and its assumptions shown and editable rather than hidden.
- **New Deep Dive learning content on three more simulation phases** [view:/simulation]: previously only Phase 6 had optional deep-dive material; Phase 1, Phase 5, and Foundations now have it too, adding practice tools for already-required lessons and covering several previously-untouched topics (AI security, secure messaging, automotive, digital ID/assets, developer crypto APIs, hash-based signatures, PQC candidate algorithms).
- **A signature-forgery risk panel in the Breach Scenario Simulator** [view:/learn/pqc-business-case] [persona:executive]: the cost model only covers harvest-now-decrypt-later risk (confidentiality); this explains the separate risk to digital signatures and why it argues for protecting signatures by the time a quantum computer exists, rather than immediately like encrypted data.
- **A "latest safe migration start year" and "cost of waiting" reading in the Breach Scenario Simulator and Cost of Inaction Analyzer** [view:/learn/pqc-business-case]: both tools now name the specific year migration must start by to stay protected — based on how long your data must stay secure, how long migration takes, and when a quantum computer is likely to exist — instead of only a dollar total.
- **A "crossover year" reading in the Cost of Inaction Analyzer** [view:/learn/pqc-business-case]: shows the specific year delaying migration becomes permanently more expensive than migrating now.
- **Search in the Migration Workbench's asset list** [view:/migrate] [persona:architect]: filter both "what you run" and the foundations list by name instead of scrolling the full catalog, with a mobile drawer version of the same list.
- **A "See all" option when the asset list is narrowed to your role** [view:/migrate]: role-matched assets still float to the top by default, but you can now drop back to the full canonical list without switching roles.
- **A "Check vendor roadmaps instead" link when a category has no mapped catalog products yet** [view:/migrate]: routes straight to the Vendor Roadmaps tab instead of leaving you at a dead end.
- **A "Your vendors" section at the top of Vendor Roadmaps** [view:/migrate]: vendors tied to products you've already selected are grouped and shown first, ahead of the full vendor list.
- **A "Research needed" filter on the Algorithms page** [view:/algorithms] [persona:researcher]: narrows the browse table to algorithms with unresolved research gaps in their data instead of leaving the existing per-row gap badge undiscoverable.
- **A "No known implementation" badge on the Algorithms browse table** [view:/algorithms]: flags every algorithm with zero indexed real-world implementations, next to the existing "Research needed" badge, using the same lookup the Implementations drilldown uses so the two can never disagree.
- **FrodoKEM and Classic McEliece now run for real in the crypto-agility playground** [view:/playground/cacp] [persona:developer]: previously listed as not-yet-runnable; selecting either from the algorithm picker's Commands tab now produces a genuine CreateKeyPair → Activate → Encapsulate → Decapsulate round trip, backed by new BSI TR-02102-1-compliant support in the underlying engine.

### Changed

- **Deep-dive resources on the Simulation page are now visually distinct from required steps** [view:/simulation]: they previously used the same styling as required steps, making them easy to mistake for mandatory; now shown in a tinted panel with a persistent "OPTIONAL" badge.
- **Migration in the Cost of Inaction Analyzer now takes realistic time to complete** [view:/learn/pqc-business-case]: previously switched instantly from fully exposed to fully protected on the day you chose; now ramps down over a migration duration you can set, and stops counting newly-harvested data once migration begins rather than once it finishes.
- **An empty Migration Workbench now invites you to build a plan instead of showing a 0% score** [view:/migrate]: a plan with nothing in it read as failing readiness; it now shows a plain "Build your migration plan" prompt with a direct link to add what you run.
- **Clearing a plan or removing a multi-product asset in the Migration Workbench now asks for confirmation** [view:/migrate]: the button arms on first click and fires on a second click within a few seconds, instead of deleting immediately on one click.
- **The Vendor Risk supply-chain matrix's optional pipeline-documentation fields are now collapsed by default** [view:/migrate]: the SBOM/CMDB source notes were taking up permanent space above the risk matrix itself; they're now tucked behind a "Document your pipeline (optional)" toggle.
- **The Threats page shows one persona signal instead of three at once** [view:/threats]: a role-narrowing banner, an in-page role-pill row, and silent dimming on non-matching cards used to all appear together; the role-pill row is now a single "Set your role" / "Viewing as: X · change" link into the same role switcher used everywhere else on the site, and dimmed cards now explain why via a tooltip instead of just fading silently.

### Fixed

- **The Breach Scenario Simulator and Cost of Inaction Analyzer no longer assume a quantum computer already exists** [view:/learn/pqc-business-case]: the previous model multiplied breach costs by a fixed "quantum risk" factor as if decryption were already possible today; both tools now weight that risk by how likely a quantum computer actually exists within your chosen time horizon, using a 2025 expert-survey estimate, and blend it with today's classical-only risk.
- **Breach cost figures were citing a stale 2024 report and had drifted from it for 8 of 11 industries** [view:/learn/pqc-business-case]: refreshed to IBM's 2025 Cost of a Data Breach report, read directly from the source; the 2 industries with no matching report sector are now labeled as estimates rather than presented as cited figures.
- **Cost of Inaction's regulatory deadlines and fines were invented, flat per-industry constants** [view:/learn/pqc-business-case]: every industry showed the same made-up 2030 deadline and fine regardless of what actually applies to it; both now derive from the same compliance and country-deadline data used elsewhere on the site, correctly distinguish a real binding requirement from non-binding guidance, and show "no applicable mandate found" rather than a fabricated date when neither exists.
- **Switching industries between the Breach Scenario Simulator and Cost of Inaction Analyzer could silently keep the previous industry's numbers** [view:/learn/pqc-business-case]: the tools now detect the mismatch and fall back to the newly-selected industry's own baseline instead.
- **About a quarter of Threats entries could never appear in any role's default view** [view:/threats]: threats tagged Cross-Industry, Education/Research, Critical Infrastructure, or Hardware Security Modules (including the NIST FIPS 203/204/205/206 finalizations and the HQC selection) had no matching role bucket; every role now includes them.

### Data

- **Filled several composite/hybrid and HPKE-PQ algorithm data gaps** [view:/algorithms]: composite/hybrid draft sizes and HPKE-PQ cycle counts are now computed from their components instead of left blank, with encoding-convention caveats noted. A handful of genuinely unbenchmarked candidates (two Classic McEliece parameter sets, five NIST round-2 signature candidates) are left marked "Research needed" with notes on why, rather than filled with guesses.
- **Corrected LAC's standardization status** [view:/algorithms]: previously described as "continued as a domestic reference design"; it won its CACR competition but has no evidence of adoption as an actual OSCCA/GB standard, so the summary now matches what's actually verifiable.
- **Fixed an inconsistent RSA key-size encoding on a composite algorithm row** [view:/algorithms] (id-MLDSA44-RSA2048-PSS-SHA256): its public-key size had mixed two different RSA encoding conventions in the same row; recomputed to match the PKCS#8/SPKI convention used everywhere else in the table.
- **Added BIKE-1/3/5 implementation cross-references** [view:/algorithms]: linked to their liboqs implementation entries.

## [4.11.0] - 2026-07-05

A crypto-agility and simulation release: the CACP playground gains a new **Migration** tab that walks a seven-key business estate from classical crypto through hybrid to full post-quantum, a full KMIP 3.0 operation tester and a real OASIS conformance-corpus replay; the simulation gets one unified PLAY entry point with new sector-specific deep-dive content; and the HSM Capacity Calculator's fleet-sizing formula is corrected after being found to undercount by up to 46%. Backed by a rebuilt engine (v0.10.0) that adds Ed25519 signing and real classical X25519/X448 key agreement.

### Added

- **A new "Migration" tab in the crypto-agility playground** [view:/playground/cacp] [persona:architect]: build a seven-key estate (encryption, key-agreement, and signing keys) by _business name only_ — the active policy decides every algorithm — then switch Classical → Hybrid → Full PQC and watch each vulnerable key rekey to its post-quantum successor the first time you use it. Every key keeps its business handle across the migration; old and new versions are shown side by side with their state and lineage.
- **A migration map** [view:/playground/cacp]: a table showing which key label serves which operation and what each policy resolves it to under Classical, Hybrid, and Full PQC, with the active mode highlighted.
- **A live key-object inspector in the Migration tab** [view:/playground/cacp]: the real KMIP objects on the tab's engine — label, unique ID, type, algorithm, state, quantum-safety, and the rekey link from a retired key to its successor.
- **A KMIP log inside each key tile** [view:/playground/cacp]: every operation you run on a key is logged in place, tagged with the mode (Classical / Hybrid / Full PQC) it ran under and expandable to the underlying policy/KMIP/PKCS#11 events.
- **Guided "Learn" walkthroughs and an operation Reference in the playground** [view:/playground/cacp]: classical→PQC walkthroughs (create/activate, sign & verify, key encapsulation, hedged hybrid, and more) that run for real against the in-browser engine, plus a per-operation reference with parameter forms and a shared glossary.
- **Test any of KMIP 3.0's 66 operations directly in the crypto-agility playground** [view:/playground/cacp] [persona:developer]: a "Commands" sub-tab runs a real request through the engine for every operation — including honest "not supported" rejections for the 15 that aren't — with the full decoded response visible in an execution log.
- **Replay the real OASIS KMIP 3.0 conformance test corpus in your browser** [view:/playground/cacp] [persona:developer]: a "Corpus Replay" sub-tab runs all 102 mandatory/optional OASIS transcripts plus 42 vendored PQC interop tests entirely client-side, with any skips labeled and explained.
- **One unified "▶ PLAY" entry point for the simulation** [view:/simulation]: replaces two separate, unlabeled buttons with a single entry point that opens a choice screen showing all 3 ways to play — Executive Overview, Full Migration Journey, and Play This Phase — each with its audience and estimated duration visible up front, and a Standard/Deep Dive checkbox per choice. Play This Phase now runs the same narrated, auto-advancing playthrough as the other two, just scoped to the one phase you pick, and genuinely clears that phase's maturity gates. A resumable run skips straight back in via "▶ Resume" instead of reopening the choice screen.
- **The crypto-agility (CACP/KMIP) workshop is now playable from inside the simulation** [view:/simulation] [view:/playground/cacp]: previously listed as relevant to Phase 6 but never actually embedded in any run.
- **New Deep Dive learning content for Phase 5, tailored by sector** [view:/simulation]: finance (identity & access management), government (PIV/CAC-style enrollment protocols), telecom (API/JWT security for network-API exposure), and retail (transactional email/receipt signing) each get sector-specific optional content that never affects your maturity score.
- **A plain-language verdict card, a hybrid-signing transition toggle, and a sizing headroom slider in the HSM Capacity Calculator** [view:/playground/hsm-capacity] [persona:architect].
- **The Crypto Architecture PDF export now includes the actual diagram** [view:/learn] [view:/business]: previously the diagram was stripped down to a text stub to avoid bundling a renderer; it's now rendered client-side and appended as an image page.

### Changed

- **The About page's software bill of materials now lists the current engine** [view:/about]: the pqctoday-hsm crypto engine entries were refreshed to v0.10.0 (Ed25519 + classical X25519/X448 KEM, label-only migration).
- **The Crypto Architecture diagram is easier to read** [view:/learn] [view:/business]: nodes are now grouped into color-coded subgraphs by component kind (application/protocol/library/key-store/HSM/CA) instead of one flat diagram of identical gray boxes, reducing clutter as more components are added.
- **The Vendor Scorecard and its exported reports now show vendor names instead of internal vendor IDs** [view:/learn] [persona:executive]: the per-vendor readiness table, low-readiness list, and both exported documents used to display the raw ID.

### Fixed

- **Signature verification after a post-quantum migration** [view:/playground/cacp]: migrating a signing key to ML-DSA could leave the old public key active and make a valid new signature read as invalid; the whole key pair is now retired together, so verification is reliable across hybrid and full-PQC.
- **A key-agreement error after switching to a post-quantum policy** [view:/playground/cacp]: establishing a shared secret after migrating a key could fail with a "bad arguments" error because the operation still pointed at the retired key; it now follows the migrated key.
- **The guided sign-and-verify lessons** [view:/playground/cacp]: verification and key-encapsulation steps failed because the public key wasn't activated first; the lessons now activate both halves.
- **The HSM Capacity Calculator was undercounting how many HSMs you need, by up to 46%** [view:/playground/hsm-capacity] [persona:architect]: it sized a shared fleet on its single worst algorithm instead of summing every algorithm's share of HSM time, even though the tool itself describes a shared fleet where any HSM can run any algorithm (a medium-sized organization's estimate went from 37 to 49 HSMs once corrected). Also corrects a per-location explainer that divided demand incorrectly, several externally-verified-wrong standards citations (ETSI, IETF drafts, a nonexistent DNSSEC draft, a Marvell FIPS certification claim), and realigns all 10 use cases with the protocol matrix — SSH and IKEv2 now correctly show the standardized hybrid classical+ML-KEM mode instead of pure PQC, and code signing gains an SLH-DSA option.
- **The PQC Assistant chat no longer gets permanently stuck after the browser reclaims GPU memory from a backgrounded tab** [persona:developer]: this could happen because the local model holds several gigabytes of GPU memory that browsers aggressively reclaim from background tabs; the assistant now detects this, reloads the model, and retries your message automatically instead of leaving it failing silently.

## [4.10.0] - 2026-07-05

A crypto-agility, simulation, and accuracy release: the CACP playground gains real Ed25519/ECDH operations with an in-app guide, the simulation adds country-specific standards guidance and a reflective run-complete ending, and a wave of accuracy fixes corrects a report-sharing bug that could silently overwrite a recipient's own assessment, a fabricated compliance evidence chain, a stale CVE feed, and several other content and accessibility issues.

### Added

- **Compare Ed25519 and ECDH key operations in the crypto-agility playground** [view:/playground/cacp]: both are now runnable end-to-end in the workbench (create, sign/verify, key agreement), backed by a rebuilt engine — previously spec-only entries with nothing to actually test.
- **A "Key tags" field in the crypto-agility workbench** [view:/playground/cacp]: tag real key-creation operations with governance attributes so tag-gated policies (CNSA, BSI, the 2030 migration policy) can actually be exercised interactively, instead of only in dry-run mode.
- **An in-app guide for the crypto-agility playground** [view:/playground/cacp]: a "Guide" button opens a full walkthrough of the policy model without leaving the page.
- **A "Recover" column in the crypto-agility policy coverage matrix** [view:/playground/cacp]: shows the real verdict for Verify/Decrypt/Decapsulate operations alongside Create/Protect, surfacing gaps that were previously invisible.
- **Two new implementation-attack categories in the Algorithms view** [view:/algorithms]: kleptography (deliberately backdoored crypto, e.g. the Dual_EC_DRBG backdoor) and AI-assisted cryptanalysis, each with real, cited research — including a reminder that today's classical RSA/ECDSA/AES are exposed to these independent of quantum progress.
- **Germany, France, and UK now have their own cited standards guidance in the simulation** [view:/simulation]: national migration deadlines were already tracked, but the underlying standards-body guidance (BSI, ANSSI, NCSC) is now named and sourced per country instead of only the US.
- **The simulation's run-complete ending now offers a reflection and next steps** [view:/simulation]: finishing the full maturity climb now surfaces your top recurring mistakes (each linking to the Learn module that addresses it) and the same "what to do next" links the shorter Executive Overview ending already had.
- **A "Practice in the Simulation" link from Learn now jumps to the exact phase you just studied** [view:/learn] [view:/simulation]: previously it always opened the simulation from the very beginning.
- **The Verification & Closure phase's reference tool now opens inside the simulation** [view:/simulation]: it used to leave the simulation entirely; it now embeds like every other reference step.

### Changed

- **The Architecture diagram in the simulation now reflects your real migration progress** [view:/simulation]: node status used to be a fixed snapshot (and had drifted from the actual product catalog for some vendors); it now derives live from the same catalog data used everywhere else, updates as you make migration decisions, and adds a legend, dark-mode-aware colors, and an accessible label.
- **Small text in the disclaimer banner and the homepage tagline is now easier to read** [view:/about] [view:/]: the color used didn't meet minimum contrast guidelines at that size; corrected.

### Fixed

- **The Crypto Vulnerability Watch tool's CVE data was 66 days stale** [view:/business] [persona:developer]: the automated update pipeline had been silently failing since mid-June; restored, refreshed against 96 tracked components (631 CVEs), and the update job now fails loudly instead of silently if it breaks again. The tool now also clearly discloses what it doesn't cover (side-channel research, AI-assisted cryptanalysis, quantum-computing progress) with links to the tools that do.
- **Corrected a citation mismatch for where vulnerability management sits in the CSWP 39 framework** [view:/business], shown inconsistently across the tool, the report mapping, and the module registry.
- **Fixed an overlapping layout in the About page's software bill-of-materials section** [view:/about].
- **The crypto-agility policy engine no longer blocks unrelated operations because of an unrelated governance rule** [view:/playground/cacp]: a reported bug ("CNSA 2.0 allows AES-256 but denies Encrypt/Decrypt") traced to governance-attribute rules that were gating every operation instead of just key creation; corrected across the engine, policy files, and the visual policy simulator, with ~20 new regression scenarios covering every fixed policy.
- **The Migration Verification tool no longer cites the wrong standard for key destruction** [view:/business]: it referenced NIST SP 800-88, which covers media sanitization, not key destruction; corrected to point to your organization's own key-destruction standard.
- **Several accuracy corrections to the simulation's narration** [view:/simulation]: the CRQC timing estimate is now labeled as a planning assumption rather than stated as fact, a false "hybrid cryptography is mandated by CSWP 39" claim was removed (NIST permits but doesn't require it), stage-gate decision authorities now match the framework's own table, and an HSM firmware claim now derives from the hub's own product data instead of a stale hand-typed fact.
- **The Executive Overview walkthrough now presents the budget case before the program charter** [view:/simulation] [persona:executive]: it previously opened with the charter, before the financial case that's supposed to justify it.
- **Fixed onboarding never appearing for anyone who started the simulation via a direct run link** [view:/simulation]: the first-run tour was being permanently marked "seen" just to avoid interrupting an active run.
- **The simulation's destructive confirmations (reset, start over) are now accessible, styled dialogs** [view:/simulation] instead of the browser's native confirm popup.
- **A shared assessment link no longer silently overwrites your own in-progress report** [view:/report]: opening someone else's `?share=` link used to immediately apply their answers to your own assessment and mark it complete, contradicting the page's own "read-only snapshot" banner; it now only loads the shared snapshot if you haven't started your own assessment yet, and otherwise explains why the link didn't load.
- **The Algorithms page's suggested "Standardized" filter for developers no longer leads to a dead end** [view:/algorithms] [persona:developer]: the filter value it applied didn't exist, so clicking the primary suggested action showed zero results; it now applies the correct "Certified" filter.
- **Common Criteria certificates that were never checked for PQC support no longer look identical to ones checked and found clean** [view:/compliance]: 889 of 1,081 records had simply never been run through PQC detection, but displayed the same "No PQC Mechanisms Detected" label as the 20 that were actually analyzed; unanalyzed records now show "Not Yet Analyzed."
- **The compliance mandate detail no longer shows a fabricated migration-evidence trail for mandates that don't actually specify one** [view:/compliance]: most non-marquee mandates were rendered with an identical, hardcoded "FIPS 140-3 validated → ML-KEM/ML-DSA → CMVP evidence" chain regardless of what the mandate actually requires; it's now built only from each mandate's real per-row fields.
- **The compliance glossary no longer cites a draft NIST specification as published** [view:/compliance]: NIST IR 8547 is still a draft; the glossary's "Standard" definition now cites FIPS 205 instead.

## [4.9.0] - 2026-07-04

A business-case and report release: PQC cost models get an honest rebuild with a new side-by-side comparison tool, the exec-tour's financial docs are now generated from that same math, and the assessment report gains discovery, vendor-risk, and program-ownership sections alongside several accuracy corrections.

### Added

- **Compare six PQC cost-estimation methods side by side** [view:/learn] [view:/business] [persona:executive]: a new Cost Model Explorer runs one scenario through parametric, bottom-up, Monte-Carlo, judgemental, analogical, and risk/ALE costing families at once, including a live seeded Monte-Carlo simulation, so you can see how far the methods diverge instead of trusting a single number.
- **A "Choosing a Costing Model" methodology guide** [view:/learn]: explains the six cost-model families with authoritative anchors (migration timelines by organization size, Mosca's inequality, the OMB $7.1B federal estimate) and two new peer-reviewed/preprint library references.
- **Search and filter the Roadmap Builder's regulatory deadline list** [view:/business] [persona:executive]: the 82-entry deadline panel now has a search box and a country filter instead of one unsorted wall of chips.
- **A program-level ownership block in the assessment report** [view:/report] [persona:executive]: capture the program owner, budget owner, and accountable executive — the accountability level boards actually ask about, distinct from the per-finding "Responsible" column.
- **A cryptographic discovery / inventory section in the report** [view:/report]: shows your self-reported algorithms (or coarse categories if unknown) as a starting inventory, explicitly labelled "not a scan," with links to the CBOM learning module and Migrate's inventory tooling.
- **A third-party & vendor PQC risk section in the report** [view:/report]: lists the catalog products matched to your industry/infrastructure profile, their vendor, and that vendor's tracked PQC commitment, framed by your assessed vendor-dependency model.

### Changed

- **Exec-tour and board-deck financial figures are now generated from the same math as the real tools** [view:/simulation] [persona:executive]: the ROI, breach-cost, cost-of-inaction, and board-pitch numbers shown in the narrated executive walkthrough are computed live from shared calculations rather than hand-authored estimates, so they can no longer drift from what you'd get running the tools yourself.
- **Breach Simulator, Cost of Inaction Analyzer, and Cost Model Explorer are now full Command Center tools** [view:/business] [view:/simulation]: reachable directly from the Command Center and completable as simulation steps, not just standalone workshop exercises.
- **Program Charter and Initial Scoping Assessment now match the migration framework more completely** [view:/learn] [persona:executive]: the charter adds purpose/objectives, scope, success criteria, and escalation triggers, offers all 8 steering-committee seats, and models a three-tier decision cadence (PMO/SteerCo/Board); scoping now captures a per-system priority tier and ownership rather than a flat list.
- **Quick assessments no longer silently upgrade to "comprehensive"** [view:/assess]: the quick track was collecting two fields that flipped an internal completeness flag, so it was mislabelled and never showed the upgrade nudge or section locks — the quick path is now genuinely lighter, and report locks reflect the assessment mode you actually chose.
- **The report's table of contents now covers every section** [view:/report]: the ROI Calculator, progress-over-time, and workforce-gap sections are now reachable from both the desktop rail and mobile menu, and the mobile section-jump menu now tracks your scroll position like the desktop rail does.
- **The report's persona-aware summary appears once, at the top** [view:/report]: the "what this means for you" narrative previously appeared twice with two different framings; it now lives solely in the top verdict block and reflects your actual result rather than a static per-persona blurb.
- **The report footer's next-step suggestions now reflect your actual result** [view:/report]: previously ordered by persona alone, the suggested next step now leads with the destination your specific findings point to (e.g. Migrate for a vulnerable algorithm, the executive tools for a hard compliance deadline).

### Fixed

- **The Breach Scenario Simulator's cost model was inflated roughly 2.5–10x** [view:/business] [view:/learn]: it was double-counting reputational cost and the quantum-risk multiplier, and its industry breach-cost table had drifted from the source figures; rebuilt on a single documented baseline.
- **The Cost of Inaction Analyzer's regulatory penalty never actually applied**, and quantum risk was double-counted when fed from the Breach Simulator [view:/business] [view:/learn]: both calculation bugs are fixed, and "migrate now" no longer shows zero residual risk.
- **The ROI Calculator now cross-checks its estimate against an independent method** [view:/business]: rather than presenting one bottom-up number as certain, it reconciles it against an assessment-derived estimate and flags whether the two agree.
- **Removed a fabricated standards quote and an overstated outcome claim from the Roadmap Builder** [view:/business].
- **Report's Share, Print, and Board-pack buttons now give honest feedback** [view:/report]: they previously could fail or succeed silently; the Download PDF button is relabelled "Print / Save as PDF" to match what it actually does.
- **The report's harvest-now-decrypt-later narrative no longer conflates your regulatory migration deadline with the separate quantum-computer arrival estimate** [view:/report]: the two drivers are now named distinctly wherever the deadline is shown.
- **The Framework Risk Lens panel was silently blank on every comprehensive assessment** [view:/report] [view:/simulation]: a scoring bug left it uncomputed on that path; now fixed.
- **An inverted-polarity bug in the organizational-readiness score could show the best-prepared organizations as highest-risk** in the QRA heatmap and framework-feasibility tile [view:/report]: corrected across scoring, display, and stored results.
- **The example report shown to first-time visitors used invalid data tokens and rendered as a near-empty report** [view:/report]: now uses valid tokens and shows a realistic example.

## [4.8.0] - 2026-07-03

A crypto-agility and business-tools release: the CACP playground gains scripted policy test-scenarios and a workbench picker, a persona deep-link bug is fixed, and 30 Command Center business tools are corrected after a fresh accuracy audit.

### Added

- **Try validated test scenarios in the crypto-agility playground** [view:/playground/cacp]: the Policy screen's workbench now has a scenario picker loaded with validated positive/negative test cases tied to each shipped policy, and the Visual tab's graph trace is now driven directly by the real engine rather than a simulated approximation — what you see highlighted is what the engine actually decided.
- **A Q-Day horizon stat in the simulation's KPI row** [view:/simulation] [persona:executive]: alongside the win-rate score, the simulation now shows years-to-Q-Day and the modelled horizon year, clearly marked as an illustrative planning anchor rather than a published date.
- **ENISA hybridization report added to the library** [view:/library]: closes three gaps in the protocol-support matrix's sourcing.

### Changed

- **CACP playground A-grade UX pass** [view:/playground/cacp]: engine/UI sync, batch-operation test coverage, and general Phase 3 polish across the crypto-agility playground.

### Fixed

- **30 Command Center business tools corrected after a fresh accuracy audit** [view:/business] [persona:executive]: a 2026-07-03 grading pass found several tools scoring C or lower; the underlying calculations and logic (not just wording) were corrected. The Executive Overview's narrated walkthrough now generates its explainer text directly from each tool's real logic instead of a hand-maintained copy, so the two can no longer drift apart.
- **`?persona=` deep links no longer lose the chosen persona** [view:/learn] [persona:executive] [persona:developer]: combining a `?persona=` link with workshop-video autostart triggered a race condition that silently reset the persona to Executive regardless of what the link specified. Anyone sharing or following a non-executive workshop link now lands on the right persona.
- **Restored the Executive Report reference in Verification & Closure** [view:/simulation] [persona:executive]: an earlier content edit had dropped the only entry point back to the board-facing closure summary from that step.
- **CACP Lesson 3's rekey sequence had a genuine ordering bug**, now fixed [view:/playground/cacp].
- **Clearer error when a KMIP batch step references an unset ID placeholder** [view:/playground/cacp]: instead of a raw internal error, the playground now shows a plain message explaining what happened.
- **Corrected the AWS-LC FIPS certificate number** cited in the product catalog [view:/migrate].

## [4.7.0] - 2026-07-02

An accuracy, learning, and crypto-agility release: a hub-wide factual re-audit corrects roughly 150 errors, learners get a shorter essentials-first path, executives can watch the whole migration play out as a guided walkthrough, and the crypto-agility playground gains a visual policy editor plus hybrid key exchange.

### Added

- **Watch the whole migration play out as a guided executive walkthrough** [view:/simulation] [persona:executive]: a new Executive Overview runs the real simulation from start to finish as a narrated, board-framed tour — phases advance on their own, the scenario clock is frozen so there's no deadline pressure, and each step reveals the idea behind it (harvest-now-decrypt-later, Mosca's inequality, hybrid, the two-track plan) and the artifacts it produces. Start it from the Executive Overview button or a `?run=exec` link.
- **A shorter, essentials-first learning path** [view:/learn] [persona:developer] [persona:executive]: My Path now leads with an Essentials track that covers the must-know material first and ends with a capstone on those essentials, so you can get the core in one sitting before deciding how much deeper to go.
- **Try hybrid (classical + PQC) key exchange in the playground** [view:/playground/cacp]: the in-browser crypto-agility playground now bundles a hybrid KEM and a policy tester, so you can exercise a hybrid-migration policy end-to-end against the real engine.
- **See your crypto-agility policy as a flowchart** [view:/playground/cacp]: the Policy screen now has a **Visual** tab that draws a policy as a decision pipeline — a request flows top-to-bottom through the rules in order and exits at Allow, Rekey, or Deny. Add rules from a palette, edit them inline, reorder and toggle them, drag nodes around, and switch between a vertical "waterfall" and a left-to-right "pipeline" layout.
- **Watch a request travel through your policy** [view:/playground/cacp]: build a sample request on the Visual tab's Simulate panel, press Run, and a token animates along the exact path the request takes, ending on the verdict the real in-browser engine returns. The simulator now faithfully honours every rule type — including validity dates, key attributes, usage masks, and mechanism matches — so the animated verdict matches exactly what the engine would decide, with no rule silently passed.
- **Catch policy mistakes before they bite** [view:/playground/cacp]: the Visual tab's Check panel flags conflicting rules (an algorithm both allowed and denied), dead defaults, empty rules that match nothing, and disabled rekey rules that would stop keys migrating — and clicking an issue jumps to the offending rule. The generated policy YAML is always one click away in a drawer.

### Changed

- **The product catalog is easier to browse and better sourced** [view:/migrate]: the catalog's category taxonomy was consolidated from 130 overlapping labels down to 61 clean categories, and vendor/product entries were re-audited against their source proof so the filters and vendor roadmaps line up with what vendors actually ship.
- **Crypto-agility policies stay in sync and match the standards** [view:/playground/cacp]: the playground's policy catalog is now guarded by a sync gate, and its CNSA-2.0 and FIPS policies were corrected — single-tree LMS/XMSS only for firmware/software signing, Register/Import gated alongside Create, all 12 SLH-DSA parameter sets recognised, and honest transition dates.

### Fixed

- **A hub-wide accuracy sweep** [view:/algorithms] [view:/learn] [view:/compliance] [view:/faq] [view:/about] [view:/migrate] [view:/library]: a 2026-07-01 re-audit corrected roughly 150 factual errors across rendered pages, Learn modules, the FAQ, data files, and page metadata — including CNSA 2.0 timelines and approved algorithms, FIPS 206 now shown as a draft, removal of a fabricated "Windows enables PQC by default" claim, corrected 3GPP and KMIP references, and site self-description counts derived from real values (62 modules, 838 products, 332 leaders, 688 library entries, 34 tools). A second, web-verified pass on 2026-07-02 corrected a further set of details: vendor roadmap dates (NXP, Arm/Mbed-TLS), a mis-attributed AWS certificate reference, the RFC 9901 vs SD-JWT-VC label, the signature on-ramp status (now nine third-round candidates per NIST IR 8610), the correct Bouncy Castle release that first shipped the final NIST algorithms, the published KMIP version, the Windows PQC update reference, and several chatbot-answer citations — while confirming that RFC 9980 (Post-Quantum Cryptography in OpenPGP) is genuinely published and keeping it cited as an RFC.
- **Learning paths send the right roles to the right modules, with correct standards** [view:/learn] [persona:developer]: persona paths were reconciled (developer targeting and estimated path times fixed), the TLS module now cites the correct standard (RFC 8446), and the ACME walkthrough carries an accurate disclaimer.
- **Straight talk about what the playground preview does** [view:/playground/cacp]: corrected the Preview's "no audit" wording and labelled FrodoKEM honestly rather than implying support the engine doesn't provide.

### Data

- **Refreshed datasets and search index** [view:/explore] [view:/migrate] [view:/leaders]: the leaders, compliance, algorithm-reference, library, module-QA, and vendor-roadmap datasets were revised (older files archived) and the site's search/RAG index was rebuilt so search reflects the corrected content.

## [4.6.0] - 2026-06-30

A simulation-fidelity and executive-experience release: every simulation phase now matches the published migration framework exactly, executives get a purpose-built view across the whole hub, the protocol support matrix is updated to what's actually shipping today, and the product catalog had an accuracy sweep.

### Added

- **The simulation now opens workshops and learning modules at exactly the right step** [view:/simulation] [view:/learn] [persona:executive] [persona:architect]: when the simulation links you into a playground workshop or an embedded learning module — for example, directing you to a specific hands-on exercise — it now opens at precisely the step it intended rather than always starting from the beginning. Shared or bookmarked workshop links that include a step number also restore reliably to that position.
- **Executives and business leaders now get a tailored path through every part of the hub** [view:/algorithms] [view:/leaders] [view:/timeline] [view:/explore] [view:/revisions] [view:/simulation] [view:/business] [view:/about] [persona:executive]: when your role is set to Executive, each page now surfaces the right context for a business decision-maker rather than technical implementation detail. Algorithms shows which standards you're required to adopt and links straight to your compliance deadlines. Leaders opens with a board-level readout on what quantum risk means for governance and what peer organisations are doing. Timeline shows a compact view of the deadlines that matter most for your sector and region. Explore opens directly at the simulation so executives can start the guided migration run without navigating elsewhere. Business Center highlights the handful of tools most useful to an executive. About opens with a condensed executive summary. The simulation itself defaults to Guided mode on first visit for executive and curious-role users so they see the narrative flow rather than the dense expert console.
- **Security Level in the algorithm comparison panel now explains what "112 bits" means** [view:/algorithms] [persona:architect] [persona:developer]: hovering the Security Level label in the comparison panel shows a plain-language tooltip that explains classical security bits — why RSA-2048 gives only 112 bits (GNFS sub-exponential attack), why P-256 gives 128 bits (Pollard's rho), and why Shor's algorithm reduces classical key security to effectively zero. No more looking it up elsewhere.

### Changed

- **The simulation's guided content for all eight phases now matches framework v2.1** [view:/simulation] [persona:executive] [persona:architect]: a full audit of Phases 0–7 and the Verify & Close stage corrected every misaligned gate label, wrong module registration, and missing step against the published framework. Phase 0 (Governance) now includes PQC migration charter content and an executive pitch builder. Phase 1 (Discovery) adds estate-mapping steps and the correct inventory pitfalls. Phase 2 adds the SOC 2 module at the right step. Phase 3 correctly registers the migration-program start and links to the timeline. Phase 4 adds a threat-horizon activity. Phase 5 links TLS basics at the right moment. Phase 6 adds an HSM key-wrap bridge step. Phase 7 adds risk-register entries at two activity steps. Verify & Close removes incorrect SP 800-88 citations and now correctly spans gate labels through G8.
- **The PQC Protocol Support Matrix is updated to reflect what's actually deployed today** [view:/algorithms] [persona:architect] [persona:developer] [persona:researcher]: a freshness pass verified against IETF datatracker and vendor sources on 2026-06-30 corrects several stale entries. OpenPGP now shows RFC 9980 as published (June 2026) rather than queued. OpenSSH correctly notes that ML-KEM-768 has been the default since OpenSSH 10.0 (April 2025), not 9.9. Six new real-world deployments are documented: Mozilla Firefox, Google Android 17, Microsoft AD CS ML-DSA, Cloudflare ML-DSA origin certificates, AWS expanded default-on, and Signal's SPQR/Triple Ratchet. IETF stage updates: tls-mlkem advanced to WG Last Call (draft-08), lamps-cms-composite-kem moved to IESG submission, ikev2-mlkem is at draft-08 with a DISCUSS. Each entry now has a Sources section with links to the primary references so you can verify the status directly.

### Data

- **Migration product catalog refreshed with proof sweep (06302026_r1)** [view:/migrate] [persona:architect]: 912-row audit of the active product catalog corrected two P0 accuracy errors — a broken proof URL was fixed, and a pre-release product's proof quality was corrected from "valid" to "missing" — plus a broader pass over vendor evidence quality. Catalog ID set is a superset of the previous version.
- **CBOM refreshed with vendor accuracy caveats** [view:/playground/cacp] [persona:architect] [persona:developer]: the software bill-of-materials timestamp is updated to 2026-06-30. Three vendor entries carry new accuracy caveats: EJBCA's ML-DSA support requires version 9.3 or later with an experimental feature flag enabled; Delinea's listing notes their implementation is Kyber (pre-FIPS 203) and ML-KEM compliance is unconfirmed; Splunk's description is updated to reflect the 10.4 GA release.

## [4.5.0] - 2026-06-29

A mobile-ready and data-consistency release: the hub now works on phones across all pages, jurisdiction data is unified into one source of truth, the simulation generates industry-specific artifacts, and compliance facts in your report warn you when deadlines have been updated since your assessment.

### Added

- **The hub now works on a phone** [view:/algorithms] [view:/compliance] [view:/library] [view:/migrate] [view:/learn] [view:/simulation] [view:/timeline] [view:/playground] [persona:executive] [persona:architect] [persona:developer]: a full mobile pass across all 28 pages fixes the most serious usability problems on small screens — tap targets that were too small to hit reliably are enlarged, tab bars that overflowed the screen are now scrollable with abbreviated labels, table views that broke on narrow widths are replaced with card or scroll layouts, and drawers have primary actions that don't get cut off. The simulation requires a tablet or larger screen (a "please use a larger device" screen appears on phones). Desktop layout is unchanged.
- **The simulation now shows optional learning steps tailored to your sector** [view:/simulation] [persona:executive] [persona:architect]: when you're in a sector-specific playthrough (financial services, healthcare, government, and others), the simulation rail now surfaces one or two recommended learning modules directly below the phase you're working on — one early in the process and one later. These are suggestions, not requirements; they never block progress, but they connect you to the learning content most relevant to your industry at the moment it's most useful.
- **The migration simulation generates artifacts matched to your sector** [view:/simulation] [persona:executive] [persona:architect]: when the guided auto-run completes an activity step, the draft documents it produces — policy excerpts, risk registers, vendor assessments, and others — are now written to reflect your chosen sector rather than a generic template. Across 7 sectors and 27 artifact types, the output reads like it belongs to your organisation's context.
- **Your assessment results now appear inside the simulation** [view:/simulation] [view:/assess] [persona:executive] [persona:architect]: if you've completed an assessment before starting the simulation, your situational factors (things like a near-term compliance deadline or a large cryptographic footprint) show up as highlighted boosts at the start of the simulation, and the score drivers from your assessment are explained in the governance phase — so you can see directly how your organisation's profile shapes the migration path.
- **Related compliance frameworks now navigate directly to the right entry** [view:/compliance] [persona:executive] [persona:architect] [persona:researcher]: when a compliance framework's detail panel lists related frameworks — Common Criteria, EUCC, ACVP, and others — clicking any of them now opens that framework's own detail panel directly instead of doing nothing.

### Changed

- **Jurisdiction data is now consistent across every part of the hub** [view:/assess] [view:/simulation] [view:/compliance] [view:/timeline] [persona:executive] [persona:architect]: the list of supported countries was previously scattered across five separate hardcoded lists that could disagree with each other. All of them now draw from a single managed source, so the country picker in the assessment, the simulation's jurisdiction panel, and the compliance timeline all show the same set and the same information. Canada, Japan, South Korea, Singapore, and India now have their own tailored migration archetypes in the simulation. India's CII deadline has been corrected to 2027 (previously showed 2033). EU is now handled as its own jurisdiction — with ENISA's hybrid-then-pure mandate — rather than falling back to the German profile. UK is correctly excluded from automatic EU compliance cascade.
- **Compliance deadlines and facts in your report now stay in sync with the live data** [view:/report] [view:/assess] [view:/compliance] [persona:executive] [persona:architect]: when you complete an assessment, the app now takes a snapshot of the compliance frameworks you've selected, including their deadlines. If you open your report later and the underlying deadline for one of those frameworks has been updated, the report shows a clear notice so you know the data has changed since your assessment was generated — you're never silently reading a stale deadline without knowing it.
- **Fixed compliance deadline errors across several frameworks** [view:/compliance] [view:/report] [persona:executive] [persona:architect]: CNSA 2.0's full-transition target was corrected from 2035 to 2033, and several frameworks (NIS2, DORA, PCI-DSS) that showed a past deadline where none applies have been cleared. The FIPS-140-3 preface text now loads correctly instead of showing blank.
- **HSM vendor comparison in the Crypto Management module stays current automatically** [view:/learn] [persona:architect] [persona:developer]: the list of HSMs in the Crypto Management Modernization learning module — covering the major hardware security module vendors and their PQC readiness — now pulls its PQC posture badges directly from the product catalog instead of hardcoding them. That means a catalog update flows through to the learning module without a separate edit. Crypto4A QxHSM was also added to the list; Azure Dedicated HSM is now correctly flagged as end-of-life.

## [4.4.0] - 2026-06-27

A playground-and-feedback release: the crypto playground is reorganized around what you want to do, the SSH simulator now runs a genuine post-quantum handshake, you can endorse or flag any resource again across the hub, and the in-browser HSM's self-tests run reliably with live progress.

### Added

- **Endorse or flag any resource again, everywhere** [view:/algorithms] [view:/patents] [view:/compliance] [view:/library] [view:/threats] [view:/migrate] [persona:architect] [persona:researcher]: the Endorse and Flag buttons — which let you vouch for a resource or report a problem with it — are back on every page and on individual items (algorithms, patents, compliance frameworks, library documents, threats, and the products on Migrate) after several page redesigns had quietly dropped them. Each button opens the matching discussion so your feedback lands in the right place.

### Changed

- **A clearer crypto playground, organized around what you want to do** [view:/playground] [persona:architect] [persona:developer]: the playground landing was redesigned so you can find a tool by intent — a new command palette (⌘K or "/") jumps straight to any tool, an "I want to…" row and verb-based views group tools by what they actually do, and a run-context filter lets you show only what runs in your browser versus what needs the sandbox. The large categories are split into readable sub-groups, each tool now explains where it runs before you start it, and a built-in guard makes sure the auto-synced sandbox tools can never silently go missing.
- **The SSH playground now runs a real OpenSSH post-quantum handshake** [view:/playground/pqc-ssh-sim] [persona:developer] [persona:architect]: The PQC SSH simulator drives the genuine OpenSSH 10.x binary compiled to WebAssembly — a real ML-KEM-768 + X25519 key exchange with ML-DSA-65 host and user authentication — instead of a model. You can watch the actual PKCS#11 calls (including the `C_Sign` operations that keep both private keys inside the in-browser software HSM), see the real signature sizes on the wire-packet ladder, and compare a genuine classical handshake (ECDSA + curve25519) side-by-side with the post-quantum one. Algorithm choices the real binary can't run yet stay clearly labelled "modeled," and a Config tab shows the matching `sshd_config`/`ssh_config`.

### Fixed

- **The in-browser HSM self-tests run reliably and show live progress** [view:/playground/hsm] [view:/playground/cacp] [persona:architect] [persona:developer]: the ACVP conformance tests no longer dead-end with a "session not open" error when the page has been idle or reloaded — the run quietly re-establishes the HSM session and continues — and while the suite runs you now see a live "running… (N done)" progress label instead of a button that looks frozen.
- **"Exit to hub" is a visible button in the simulation** [view:/simulation] [persona:executive] [persona:architect]: leaving the migration simulation no longer means hunting through the "More" menu — there's now a clear "← Exit to hub" button right on the console.
- **The simulation stops offering to resume a run that isn't there** [view:/simulation] [persona:executive]: the "Resume Simulation" bar only appears when you actually have a playthrough in progress, instead of showing up with nothing to resume.
- **All in-browser HSM self-tests now use published, authoritative test vectors** [view:/playground/hsm] [persona:architect] [persona:developer]: ECDSA, EdDSA, AES-CTR, HKDF, PBKDF2, SLH-DSA, and HSS/LMS tests previously ran against self-generated values; they now run against the canonical published vectors (RFC 6979, RFC 8032, NIST SP 800-38A, RFC 5869, NIST ACVP). Tests that only checked output length now verify the actual bytes. The XMSS and LMS sign/verify panels are also available in the playground's Stateful Signatures tab.

## [4.3.0] - 2026-06-26

A consolidation release that brings several in-flight improvements together: a faster way into the standards Library, a new policy-and-batch workbench in the crypto playground, clearer "binding versus guidance" labelling on migration deadlines, a more consistent learning-module layout, and refreshed, better-sourced timeline and library data.

### Added

- **Start the Library from what you're here to do** [view:/library] [persona:executive] [persona:architect] [persona:researcher]: the Library now opens with three plain-language doors at the top — **Learn** (research and analysis), **Reference** (standards, specs and policy), and **Plan migration** (guidance and report picks) — so you can pick an intent instead of scanning the whole catalog first. Choosing a door narrows everything to that set and re-counts the category list on the left to match; "Everything" still shows the full library, and all your existing filters and search keep working inside whichever door you pick.
- **See which migration deadlines are legally binding versus guidance** [view:/timeline] [view:/assess] [view:/report] [persona:executive] [persona:architect]: national post-quantum deadlines are now labelled as binding mandates or as guidance across the Timeline, the assessment, and the migration roadmap in your report, so you can tell at a glance which dates carry legal force and which are recommended planning targets. Where a jurisdiction's status isn't verified, the app falls back to the general Q-Day planning horizon rather than implying a mandate that doesn't exist.
- **Explore and compare crypto policies in the playground** [view:/playground/cacp] [persona:architect] [persona:researcher]: the Crypto-Agility Control Plane has a new Policy view with a library of 13 ready-made policies, grouped by what each one demonstrates — post-quantum defaults, compliance regimes (NSA CNSA 2.0, FIPS, and Germany's BSI), transition roadmaps, and mechanism-level controls. Pick any policy and see, in plain terms, what it enforces: the algorithms it defaults to, what it denies, what it quietly migrates, an at-a-glance map of which algorithms are allowed versus denied, and a visual timeline for any date-based rules. Switching the active policy takes one click, and every operation immediately follows it.
- **Test what the selected policy actually does — preview or for real** [view:/playground/cacp] [persona:architect] [persona:researcher]: the workbench runs a set of representative requests against whichever policy you've selected and shows, for each one, whether it's allowed, denied, or quietly upgraded to a post-quantum algorithm. **Preview** is a read-only dry-run — no keys are created and your selection doesn't change — so you can compare two regimes side by side by flipping the policy and previewing again. **Run for real** executes each request as a genuine KMIP batch through the same engine the workbench uses, landing real keys in the keystore and logging every step in the activity trail, while still never changing the active policy.
- **Run several KMIP operations as one request** [view:/playground/cacp] [persona:architect] [persona:researcher]: a new Batch & Macros view shows KMIP's batching — create a key, activate it, and sign with it in a single round trip, where each step automatically points at the key the previous step created, with one-click recipes to try it. You can also choose how a failure is handled, including an "undo" mode that rolls back the earlier successful steps so the whole batch is all-or-nothing.
- **Your report now points you to the right next step** [view:/report] [persona:executive] [persona:architect] [persona:researcher]: a completed report ends with three recommended next moves — run the guided simulation, build your migration plan, or open the executive tools — ordered so the most relevant one for your role leads, so you're never left wondering what to do with the findings.

### Changed

- **A cleaner, easier-to-read migration simulation** [view:/simulation] [persona:executive] [persona:architect]: the Mission Control console got a usability pass — the command bar now leads with the main actions (Play all, Commit, End Quarter) and tucks the rest into a "More" menu; the intel panel keeps your two most important panels visible and folds the rest behind a "show more" toggle; phases and controls are bigger and easier to click; active text is more legible; and tools show a loading placeholder while they open. Same features, just calmer and quicker to scan.
- **A more consistent layout across the learning modules** [view:/learn] [persona:architect] [persona:developer]: the PQC 101 introduction and other modules now share one common module layout, so navigation, progress, and the "practice in the simulation" hand-off behave the same way everywhere — and your completion now sticks when you revisit a module instead of resetting.
- **The guided simulation playthrough now starts quiet** [view:/simulation] [persona:executive] [persona:curious]: the "watch the full migration" auto-run begins with the spoken narration turned off by default — you can still switch voice-over on whenever you like — so the walkthrough no longer starts talking unprompted.
- **A refreshed crypto engine in the playground** [view:/playground/cacp] [view:/about] [persona:architect] [persona:developer]: the in-browser C++ HSM engine was rebuilt from the latest source so playground demos run against current code, and the About page's software bill of materials was updated to match (softhsmv3 0.6.1, plus the new CACP/KMIP component).

### Data

- **Refreshed and re-sourced the national PQC timeline** [view:/timeline] [persona:executive] [persona:researcher]: the EU, Germany, and Japan entries were re-enriched from their primary government and technical sources (correcting earlier contaminated notes), the June 2026 US Executive Order is now attributed to its formal number (EO 14412), and an India DST registry entry was added — with the on-site search index rebuilt so these read accurately everywhere.
- **A cleaner, better-sourced standards Library** [view:/library] [persona:architect] [persona:researcher]: 56 records that had no retrievable source and couldn't be enriched are now hidden as deprecated, 20 reference papers gained full enrichment, and unmaintained local preview images were removed in favour of linking straight to the authoritative source.
- **Better-sourced compliance landscape with every regulator named** [view:/compliance] [persona:executive] [persona:architect] [persona:researcher]: every active compliance entry now carries a resolvable authoritative source and a source-quality flag, 43 national and sector regulators (banking, privacy, aviation, and more across every region) were added to the source registry so each framework traces back to the body that issued it, and the posture-pillar chips on each framework now read in plain language instead of an internal code.

## [4.2.1] - 2026-06-25

A correctness-and-polish release: a broad accuracy pass across the learning modules and the reference data behind them, plus shareable links that restore where you left off, an on-site assistant that links you straight to the right place, and a more realistic migration simulation.

### Changed

- **Shareable links that reopen exactly where you left off** [view:/migrate] [view:/learn] [view:/assess] [view:/algorithms] [view:/timeline] [persona:architect]: you can now copy a link that restores your context across the hub — your product selection on Migrate, your track, persona, and mode on Learn, the screen you're on in Assess, a specific protocol on the Algorithms "Protocol Support" view, and individual Leaders and Timeline entries — so a bookmarked or shared link brings the page back the way you saw it.
- **The on-site assistant links you straight to the right place** [view:/] [persona:architect] [persona:researcher]: the PQC assistant now covers the expanded site and answers with direct deep links to the specific page and section, instead of pointing you at a top-level page.
- **A more realistic migration simulation** [view:/simulation] [persona:executive] [persona:architect]: your readiness score is now grounded in your actual crypto estate through a two-gate model (so it reflects what you have genuinely migrated), a difficulty lever adjusts the program budget, and a late-stage setback can roll back a connection you had already migrated — so the playthrough behaves more like a real program.

### Fixed

- **A site-wide accuracy pass across the learning modules and their reference data** [view:/learn] [persona:architect] [persona:researcher]: corrected post-quantum standards facts, migration deadlines, and outbound links across many modules — including Secure Boot, Migration Program, and Aerospace — and across the source catalogs behind them, so what you read on the page and cite from it matches the authoritative sources.
- **Accurate retirement deadlines in the Decommissioning & Program Closure module** [view:/learn] [persona:executive] [persona:architect]: the lesson, its plain-language summaries, and the workshop now present the 2030/2035 dates as NIST's _draft_ timeline rather than settled rules, note that only the weaker (112-bit) keys are affected in 2030, and describe the UK NCSC milestones correctly (2028 discovery and planning, 2031 highest-priority migration, 2035 full migration) — so the schedule you plan against matches the sources. The module also now points to CISA's January 2026 list of product categories with post-quantum-ready options when you procure replacements.
- **Source lists restored on two learning modules** [view:/learn] [persona:architect] [persona:researcher]: the Decommissioning & Program Closure and Cryptography Bill of Materials modules were showing "No references found"; their full reference lists are back — including a current ISO/IEC 27001:2022 entry — so you can open the standards behind each module again.
- **Every entry in the Leaders directory shows its correct trust tier** [view:/leaders] [persona:researcher]: fixed records whose comma-containing fields were splitting and dropping the trust tier, which had left some leaders un-tiered.
- **The "What's New" pop-up closes when you click outside it** [view:/]: fixed a layering bug that stopped click-outside-to-dismiss from working, so the release-notes pop-up behaves like the site's other dialogs.

### Data

- Rebuilt and re-signed the searchable knowledge index, plus the OSCAL and CBOM artifacts, after the accuracy and reference updates, so on-site search and the provenance trail stay in sync.

## [4.2.0] - 2026-06-25

Version 4.2.0 adds two new hands-on learning modules — building a Cryptography Bill of Materials and running a clean program decommissioning and closure — and lands a large accuracy pass that corrects post-quantum standards facts, deadlines, and outbound links across the site. It also removes the old duplicate "legacy" pages and improves how reliably pages are indexed by search engines.

### Added

- **Two new hands-on modules: building a CBOM and closing out a migration** [view:/learn] [persona:architect] [persona:developer] [persona:executive]: a new **Cryptography Bill of Materials (CBOM)** module walks you through layered cryptographic discovery and producing a machine-verifiable inventory, and a new **Decommissioning & Program Closure** module covers retiring classical crypto, assembling the migration-verification evidence, and recording a defensible program closeout. Both include data-driven workshop tools and now appear at the right steps inside the migration simulation.

### Changed

- **A cleaner site with no duplicate "legacy" pages** [view:/migrate] [view:/library] [view:/assess] [view:/patents]: the older duplicate versions of the Migrate, Library, Assess, and Patents pages have been removed, so the redesigned pages are now the only ones — no more confusing parallel set.
- **More reliable search-engine indexing** [view:/]: every page now carries the correct canonical link, the sitemap is complete, and pages are pre-rendered for crawlers, so the site is indexed more reliably and analytics no longer double-counts a visit.

### Fixed

- **More accurate post-quantum standards facts** [view:/library] [view:/algorithms] [view:/timeline] [persona:architect] [persona:researcher]: corrected the status and versions of several key standards (for example, NIST IR 8547 is still a draft and FIPS 206 / FN-DSA is not yet published), fixed the QKD-related IR number, and tidied other standards details across the Library, Algorithms, and Timeline.
- **Correct CNSA 2.0 deadlines and signature target** [view:/compliance] [view:/migrate] [persona:executive] [persona:architect]: fixed the CNSA 2.0 deadline scope and dates and corrected the signature target to ML-DSA-87, so the guidance matches the actual NSA requirements.
- **Honest framing of when a quantum computer could break today's crypto** [view:/threats] [view:/timeline] [persona:executive]: the 2029 "cryptographically-relevant quantum computer" date is now presented as an aggressive planning anchor rather than a settled fact, and overstated or fabricated claims on the Threats page (plus incorrect AES deprecation dates) were corrected.
- **Re-checked leadership profiles and repaired broken links** [view:/leaders] [persona:researcher]: leadership and source profiles were re-verified against primary sources (removing fabricated entries), and dead or irrelevant outbound links across the site were repointed to working, relevant sources.

### Data

- Refreshed the searchable knowledge index and re-signed the attestable data files after the standards and timeline source updates, so on-site search and the provenance trail stay in sync with the corrected content.

## [4.1.1] - 2026-06-23

Version 4.1.1 adds a dedicated CRQC Threat Horizon view and read-only inspection of the artifacts the simulation generates, makes the standards Library quicker to filter, extends the migration timeline to ten national programs, paces the "watch the full migration" auto-run by its narration, and is honest when a referenced document has no reachable source.

### Added

- **A dedicated CRQC "Threat Horizon" view** [view:/threats] [persona:executive] [persona:architect] [persona:researcher]: the Threats page has a new **CRQC Threat Horizon** tab that gathers the "when could a cryptographically-relevant quantum computer arrive" picture into one place — an expanded watch on quantum-computing progress with the Mosca "act-by" calculator shown by default — and the migration simulation now opens straight to it when it explains the threat timeline.
- **Inspect what the simulation generates, in place** [view:/simulation] [persona:architect] [persona:developer]: any artifact the auto-run produces (charters, plans, CBOMs and the like) can now be opened read-only from the artifacts panel, so you can read exactly what was created at each step without leaving your run.

### Changed

- **The Library is faster to narrow down** [view:/library] [persona:executive] [persona:developer] [persona:architect]: the standards library gained quicker ways to cut the list down — filter by region, by cryptographic algorithm family, and with one-click quick-filter chips, plus a "New" badge that flags recently added or updated documents — and these filters now behave correctly when the Library is opened inside the migration simulation.
- **The migration timeline now covers ten national programs** [view:/timeline] [view:/simulation] [persona:executive] [persona:architect]: Australia (protect by 2030) and India (2033) join the countries with proof-backed migration deadlines, the EU's final compliance year is set to 2035, and an unsupported 2027 Czech deadline was removed — so the Timeline page and a non-US simulation run reflect a wider, more accurate set of national deadlines.
- **"Watch the full migration" is now paced by its narration** [view:/simulation] [persona:curious] [persona:executive]: the auto-run lets the spoken explanation drive each transition instead of a fixed timer, reads out the resources it touches at each step, shows its commentary as a clean readable panel, collapses the phase panel once you've heard the intro, and a single play button resumes exactly where you paused. A United States run loads the June 2026 Executive Order scenario by default.

### Fixed

- **Library documents with no reachable source now say so** [view:/library] [persona:developer] [persona:architect]: when a referenced document has no retrievable copy, the Library now shows a clear "Source not available" state instead of a silent or broken link, and 13 documents whose source could not be recovered are marked accordingly.

### Data

- **More Library documents open with a full summary** [view:/library] [persona:developer] [persona:architect]: 27 documents were enriched with detailed summaries and another 6 hard-to-source documents were recovered and added, so more Library entries open with a full picture rather than a bare title.

## [4.1.0] - 2026-06-23

Version 4.1 lets you watch a complete post-quantum migration run itself in the Migration Simulation, rebuilds that run around three plain goals tied to the new US Executive Order, and brings the redesigned Library, Migrate, Assess, Compliance, Learn, Algorithms, Patents, Report and Threats pages — each rebuilt around a single role selector — out of preview.

### Added

- **Watch your whole migration play out on its own** [view:/simulation] [persona:curious] [persona:executive] [persona:architect]: a new "Watch the full migration" mode runs the simulation from start to finish for you — moving through every phase, filling each tool with sensible example answers, and narrating what's happening as it goes. You can speed it up, slow it down, or step in at any point, and it ends on a short celebration of the goals you set out to hit. It's the quickest way to see what a complete migration looks like before you run your own.

### Changed

- **The Simulation now tracks three clear goals instead of a countdown you couldn't win** [view:/simulation] [persona:executive] [persona:architect]: the old "you're N years past the danger line" gauge is replaced by a progress panel built around what a migration actually has to achieve — put governance in place, protect your most sensitive "harvest-now" data first, and finish migrating everything — each shown against its target year. Four bars below it track the real order of work (urgent data first, then signatures, then the rest), and a "harvest-now exposure" figure falls as you protect data, so you watch the risk closing instead of staring at a number you can never beat.
- **A US run now follows the new Executive Order's deadlines** [view:/simulation] [persona:executive] [persona:architect]: a United States migration is now paced to the June 2026 US post-quantum Executive Order — protect key exchange by 2030 and signatures by 2031 — and the goals, dates and standards shown in the run (FIPS 203 for key exchange, FIPS 204 for signatures) match it. Because the dates are read from each country's timeline data, other national timelines can drive their own version of the same three goals.
- **Backing up your progress to Google Drive is hidden for now** [view:/] [persona:curious] [persona:executive] [persona:developer]: the option to sync your work to Google Drive has been hidden while it's reworked. Saving and loading a backup file on your own device is unchanged, so you can still move your work between machines.
- **Hands-on labs now open right inside the Simulation** [view:/simulation] [persona:architect] [persona:developer]: several simulation steps can now launch a live lab in place — measuring a classical-vs-PQC TLS handshake, ML-KEM key-wrapping for cloud KMS, building an enterprise PQC PKI chain, and an A/B handshake-throughput test — so you can practice the real thing without leaving your run. These are optional bonus steps: each appears when a live lab session is available and never blocks your phase progress when it isn't.
- **Recording your progress in the Simulation now works the same way everywhere** [view:/simulation] [persona:architect] [persona:developer]: every tool and embedded panel inside the simulation now uses one consistent two-step action — Save your input, then Mark the step complete — instead of different labels and behaviours from one tool to the next, so it's always clear how to capture your work and move on. Steps that open a hub tool (for example the migration catalog) now land directly on the right view for that step rather than a generic page.
- **The Library is far easier to navigate** [view:/library] [persona:executive] [persona:developer] [persona:architect]: the standards library was rebuilt around a single role selector that tailors the starting picks, sort order and emphasis to how you work. The crowded row of controls is now one clean, search-led deck with the rest of the filters tucked into a quiet side rail; a single "Recently changed" strip surfaces new and updated documents at the top instead of two stacked feeds; each result is a lighter, scannable card that opens a detail drawer for the full picture — key facts, CSWP-39 requirements, trust evidence, and every earlier revision of the document; and every role now gets a "Start here" set so you are never staring at a blank page. The previous layout is still available at /library/legacy.
- **Migrate opens the redesigned Migration Workbench by default** [view:/migrate] [persona:architect] [persona:developer]: the Workbench — which frames migration around the cryptography you actually run, with replace / plan tabs and vendor roadmaps — is now what you land on at /migrate, instead of being parked on a separate URL that nothing linked to.
- **The Patents page leads with answers instead of a wall of charts** [view:/patents] [persona:executive] [persona:architect] [persona:researcher]: the page now opens on a clear scope control (post-quantum & hybrid, or all crypto) plus five headline numbers — patents in scope, high migration impact, core-invention quantum, how many map to FIPS 203/4/5, and the top assignee — and clicking any of them takes you straight to those patents. The Insights tab is reorganised into a filing-year overview, the four landscape charts, the four rankings that matter, and a "More breakdowns" section for the long tail. Browsing a patent now slides its full detail in over the table — with prev/next and arrow-key navigation through your current results — instead of shrinking the table away. The previous layout is still available at /patents/legacy.
- **The Quantum Risk Report tells you what your result means and what you're missing** [view:/report] [persona:executive] [persona:architect] [persona:developer]: the report now opens with a plain-language verdict tailored to your role — so you get what your score _means_ before the detail — and a control bar at the top lets you switch role to re-lead the whole report. If you took the quick assessment, the two sections that genuinely need the full assessment (your per-domain risk breakdown and your risk-score-over-time trend) now show a clear preview with a one-click way to finish and unlock them, instead of silently disappearing; your algorithm migration map and roadmap stay fully visible on the quick path. The progress-over-time chart also explains itself before you have enough history to draw a trend.
- **The Algorithms page is rebuilt as "Post-Quantum Algorithms & Protocols"** [view:/algorithms] [persona:architect] [persona:developer] [persona:executive]: the stack of notices that used to push the data below the fold is now one clean control deck — search, quick picks, the CNSA 2.0 lens and filters in a single bar. The Detailed tab is now a single sortable table where you can compare every metric at once, plus a Compare mode that puts the side-by-side matrix front and centre and marks the best value in each row; implementation attacks and the live known-answer-test validator moved into their own Validation tab. Protocol Support now stays visible for newcomers (shown locked with a hint) instead of disappearing, and its detailed view is rebuilt as expandable, one-per-protocol cards.
- **The migration plan reads consistently and every product opens its details** [view:/migrate] [persona:architect] [persona:developer]: in Plan & sequence, the cryptography you run and the cross-cutting Foundations & infrastructure now present products the same way — one row per chosen product, grouped by category — and any product expands in place to its roadmap, certifications and evidence. A new **Cryptographic hardware** category pulls chips/semiconductors, PQC hardware and confidential computing out of the oversized "Platforms & infrastructure" bucket so the catalog is easier to navigate.
- **The Assessment is now a guided two-pane wizard** [view:/assess] [persona:executive] [persona:architect] [persona:developer]: the assessment was rebuilt so you choose what you want out of it up front, then work through the questions with a step map down one side and your progress always in view, finishing on a review-and-done screen instead of being thrown straight into the report. It's now what you land on at /assess, and the previous version stays available at /assess/legacy.
- **The Compliance page is rebuilt around define → validate → mandate** [view:/compliance] [persona:executive] [persona:architect]: the page now tells one clear story — what the rules define, how you validate against them, and what's mandated where — with a role selector that re-leads the whole page for how you work, a step-by-step pipeline, and a detail drawer that traces each requirement back to its source, including the CSWP-39 authoritative-evidence grid.
- **Learn opens as a focused two-mode page** [view:/learn] [persona:curious] [persona:executive] [persona:developer] [persona:architect]: the Learn page was rebuilt around two clear choices anchored by an always-visible role selector — **My Path** (your role's guided journey: phases, checkpoint quizzes, a "continue where you left off" card, a progress dial, and a final capstone that unlocks once you've finished your path) and **Browse all** (the full module catalog grouped by track, with search, filters, and a grid/list toggle). The expert-only views (the NICE workforce-competency lens and the researcher's browse-by-algorithm) move into an opt-in Advanced area but surface automatically for the Executive/GRC and Researcher roles, and a **Quiz** button is always available in the header so you can test yourself at any time. The previous five-mode dashboard stays at /learn/legacy.
- **Guided mode in the Simulation is now a genuinely simpler view** [view:/simulation] [persona:curious] [persona:executive]: turning on Guided no longer just adds captions — it now hides the dense right-hand intel panels and gives you a focused board (your phase journey + the next decision), so newcomers aren't overwhelmed. Turn it off for the full Expert console with every panel.
- **You can try the Simulation with a sample organization** [view:/simulation] [persona:curious] [persona:executive]: the simulation used to be locked until you finished an assessment. Now the start screen also offers "Explore with a sample organization" — it loads a representative Finance & Banking run so you can play immediately, and running your own assessment replaces it with your real numbers.
- **The Threats page now opens with your own exposure** [view:/threats] [persona:executive] [persona:architect] [persona:ops]: instead of two stacked context panels before any threat, the page leads with a compact "Your sector exposure" hero — how many threats apply to your sector(s), the Critical/High split, the decrypt-later vs forge-later breakdown, the CRQC consensus window, and a **per-sector migration deadline** (Mosca's Z − X − Y, where longer-lived sectors like government/health get an earlier safe-start year). The detailed Threat-Economics framing and full CRQC watch are still one click away, collapsed beneath. Multi-sector selection is unchanged.
- **Threats filters and cards now match the rest of the hub** [view:/threats] [persona:executive] [persona:architect] [persona:developer]: the filter bar is now the consolidated control deck used across the redesigned pages — a role lens (switch your role to re-scope the page), visible severity and class chips, sector + search, and a live "Showing X of Y" count — and each threat is a cleaner, scannable card (severity bar, at-a-glance class/Shor/trust badges, an at-risk-crypto → PQC chip row, and an "Open dossier" affordance). All filters and multi-sector selection are unchanged.

### Fixed

- **Finishing a Simulation phase now fully fills its readiness** [view:/simulation] [persona:executive] [persona:architect]: some phases top out below the maximum maturity level by design, which left their readiness bar stuck part-full forever and held overall program maturity down even after you'd cleared everything there was to do. Each phase is now measured against its own ceiling, so completing a phase reads as 100% done and your program maturity can climb as intended.
- **Clicking a Patents chart now takes you to the matching patents** [view:/patents] [persona:researcher] [persona:architect]: drilling into a chart or headline number on the Patents dashboard now applies the filter and switches you to the results list with a "Filtered from the dashboard" note — previously it set a hidden filter but left you on the chart, so you had to hunt for the right tab yourself.
- **The Migration Simulation is now reachable from the top navigation** [view:/simulation] [persona:executive] [persona:curious]: the simulation was missing from the nav bar for every role, so there was no way to find it without knowing the URL — it now appears for everyone, right after Home.
- **The simulation keeps your place when you step out to a hub resource** [view:/simulation] [persona:curious] [persona:architect]: opening a reference, assessment or workshop from inside the simulation now keeps a "Resume Simulation" header on screen the whole time, so a live run is never lost on a redirect — and that header correctly disappears once you deliberately leave the simulation with the "← HUB" button, reappearing only when you re-open the sim.
- **You can now choose products in every Migrate category, and pick more than one** [view:/migrate] [persona:architect] [persona:developer]: the "Choose" button did nothing for the Foundations & infrastructure categories (identity, network, platforms, crypto libraries and more) and, where it did work, picking a second product silently un-picked the first — so a selection never seemed to stick. Every category is now selectable, each pick stays put, and you can keep several products per category, each listed in your plan.
- **Payment products are no longer mis-filed under Blockchain** [view:/migrate] [persona:architect]: payment cryptography systems (e.g. Thales payShield, Futurex Vectera) were showing under "Blockchain & digital assets" — they now sit with HSMs, and payment research is grouped with national/sector programs.
- **Algorithm comparison shows the real limit and never traps a filter** [view:/algorithms] [persona:developer] [persona:architect]: the compare tray now reflects the true capacity (up to 6, not the old "Max 3" label), and choosing a security-level filter no longer prevents you from switching to a different level.
- **Protocol Support spec links open the in-app Library entry** [view:/algorithms] [persona:architect] [persona:developer]: clicking an RFC or draft in a protocol's Specifications (or a matrix cell) now opens that document's Library entry inside the app — which itself carries the external link — instead of bouncing you straight to the raw external RFC page. 74 of the 76 referenced specs now resolve to an exact Library tile.
- **The reports you download from the Business Center are more accurate and cleaner** [view:/business] [persona:executive] [persona:architect]: a pass across the Business Center tools fixed both accuracy issues and the exported files themselves — Word documents now lay out as proper tables, PDFs no longer show garbled characters, and the CSV exports are correct — so the artifacts you download (vendor scorecard, KPI tracker, risk register, roadmaps and more) read correctly and match what's on screen.
- **NIST IR 8547 and FIPS 206 status corrected app-wide** [view:/learn] [view:/migrate] [view:/compliance] [persona:executive] [persona:developer]: several places wrongly showed NIST IR 8547 as "final (March 2025)" and FIPS 206 (FN-DSA) as already published. Checked against NIST's official publications list, IR 8547 is still an Initial Public Draft (November 2024) and FIPS 206 is not yet published — the wording is now accurate and a dead "final" link was fixed.

### Data

- **The new US Executive Order on post-quantum cryptography is in the Library and on the Timeline** [view:/library] [view:/timeline] [persona:executive] [persona:developer] [persona:architect]: The June 2026 US Executive Order "Securing the Nation Against Advanced Cryptographic Attacks" (its formal Executive Order number is not yet assigned) is now a searchable Library reference and appears on the migration Timeline with its binding dates — name a post-quantum lead within 30 days, protect key exchange by 2030, and signatures by 2031.
- **RFC 9980 (Post-Quantum Cryptography in OpenPGP) added to the Library** [view:/library] [persona:developer] [persona:architect]: the published RFC form of the OpenPGP-PQC draft is now a searchable Library reference, so the Protocol Support matrix can link to it directly.
- **NIST IR 8610 added to the Library** [view:/library] [persona:developer] [persona:architect]: the final Status Report on the Second Round of NIST's Additional Digital Signature Schemes (May 2026) is now a searchable Library reference, and a duplicate NIST SP 1800-38B stub entry was removed.

## [4.0.0] - 2026-06-20

Version 4.0 makes the Migration Simulation the heart of the app — your learning modules, business tools, workshops, the product catalog, the timeline and the algorithm comparisons now run _inside_ the simulation instead of sending you elsewhere — and adds a real in-browser KMIP control plane + PKCS#11 HSM, a much-expanded and re-validated protocol-support matrix, and new SOC / GRC / Team learning modules. The PQC VPN simulator now also runs the post-quantum IKEv2 handshake for real — hybrid key exchange, message fragmentation, and tunnel (CHILD_SA) negotiation all execute in the browser instead of being narrated — and every byte is inspectable in a new live packet capture.

### Added

- **The Protocol Support matrix is fresher, clearer, and covers more ground** [view:/algorithms] [persona:architect] [persona:developer]: it now tracks **PKCS#11 v3.2, KMIP 3.0, Signal (PQXDH) and Sigstore** alongside the existing protocols; the standardization-stage scale was corrected to follow the real IETF order (a draft moving from public Last Call to the steering group now reads as a step _forward_, not back), with a new "IETF stage" explainer that lays out all seven official steps; several rows were refreshed to the latest draft revisions (TLS, X.509/CMS, IKE/IPsec, SSH), Proton Mail's May-2026 post-quantum OpenPGP rollout is shown as a live deployment, and the "work in progress" banner is gone now that the data is validated and sourced. Behind it, five new IETF drafts were added to the searchable Library and the Cryptsoft KMIP/PKCS#11 SDK was added to the product catalog.
- **A real key-management control plane you can run in your browser** [view:/playground/cacp] [persona:developer] [persona:architect]: a new Crypto Lab workshop runs a genuine KMIP 3.0 control plane and a software security module (PKCS#11 HSM) entirely in your browser tab — no server, no Docker. Three guided steps: pick a policy and watch the _same_ operation get allowed, blocked, or automatically upgraded to a post-quantum algorithm (and only when the engine truly upgrades it — the page won't claim an upgrade that didn't happen); run create → activate → sign/verify (or key encapsulate/decapsulate) as real requests and see the actual response — a readable breakdown _and_ the raw bytes that came back; then see the keys the engine really created, plus a step-by-step trail tying the policy, the request, and the hardware-style operation together. If the in-browser engine ever errors, it now says so instead of quietly stalling.
- **A Guided vs Expert view for the in-browser control plane** [view:/playground/cacp] [persona:curious] [persona:developer]: the Crypto Lab control plane now opens in a newcomer-friendly **Guided** mode — plain-English "what this means" notes after each step, with the deep internals (raw wire bytes, PKCS#11 mechanism strings, key IDs) tucked away — and a one-click switch to **Expert** mode for full fidelity. The active policy now sits in a sticky strip at the top (so flipping it visibly drives everything below), and the keystore, KMIP wire response, and activity trail are consolidated into one tabbed inspector instead of three stacked panels.
- **A refreshed Crypto Lab landing that's easier to start from** [view:/playground] [persona:developer] [persona:curious]: the workshop landing was reorganized around a clearer set of tools and demos (the old multi-filter tool browser is retired), so it's quicker to find where to begin and to jump into the featured KMIP control-plane lab.
- **The NICE Framework is now a searchable library reference** [view:/library] [persona:executive] [persona:developer]: the NIST cybersecurity workforce framework (SP 800-181 Rev 1) joins the reference library — searchable from the assistant, with its work roles and competency areas summarized.
- **Watch real VPN packets on the wire** [view:/playground/vpn-sim] [persona:developer] [persona:researcher]: a new Live Wire Capture section shows every IKEv2 message the two in-browser strongSwan daemons exchange — a sequence diagram, a click-to-inspect packet list with parsed ISAKMP headers and hex dumps, and a post-handshake scorecard (bytes on wire, round trips, which PQC RFCs were actually used).
- **Hybrid mode runs a real second key exchange** [view:/playground/vpn-sim] [persona:architect] [persona:developer]: ML-KEM-768 runs in IKE_SA_INIT and classical ECDH now follows in a genuine IKE_INTERMEDIATE round (RFC 9370 multiple key exchanges) — previously this round was simulated log lines.
- **Real IKEv2 message fragmentation** [view:/playground/vpn-sim] [persona:ops]: oversized post-quantum messages (an ML-DSA-signed IKE_AUTH is ~9 KB) now split into real RFC 7383 fragments and reassemble on the peer — you can watch the fragment train in the packet capture.
- **The tunnel itself is now negotiated** [view:/playground/vpn-sim] [persona:architect]: the handshake completes with a real CHILD_SA — ESP keys derived and SPIs assigned — instead of a simulated "tunnel established" message. (Sending traffic through the tunnel is the one remaining roadmap item.)
- **Learn section and mode comparison for the VPN workshop** [view:/playground/vpn-sim] [persona:curious] [persona:developer]: collapsible explainers covering the IKEv2 exchange flow, why classical/hybrid/pure-PQC differ for Harvest-Now-Decrypt-Later, how SKEYSEED chaining works, and why IKE_SA_INIT can never be fragmented — plus a side-by-side comparison of all three modes with handshake sizes per authentication method.
- **Follow a guided migration program across the whole app** [view:/business] [view:/assess] [view:/report] [persona:executive] [persona:architect]: a new Migration Program rail down the left of every page lays the 8-phase (0–7) migration journey over the existing model — click a phase to jump to the right page and see just that phase's tools and sections, or collapse the rail to a slim icon strip (it remembers your choice). Phases owned by your role are marked "your view".
- **Get a board-ready Quantum Readiness Assessment** [view:/report] [persona:executive]: the Report now assembles a full QRA from your assessment — an executive summary with a maturity score, an estate heatmap, a prioritized backlog with assigned owners, a regulatory gap analysis, and a compliance mapping.
- **See your urgency as Mosca's Inequality** [view:/assess] [view:/threats] [view:/timeline] [persona:executive] [persona:researcher]: your data shelf-life (X) plus migration time (Y) versus the quantum-threat year (Z) is now shown as the named X+Y>Z decision with an "urgent vs regular adopter" verdict, plus four discrete urgency tiers with start/deploy windows.
- **Three new Command Center tools to stand up the program** [view:/business] [persona:executive]: a Program Charter (sponsor, steering committee, budget), an Initial Scoping Assessment (top-20 systems, estate size, key vendors), and a Skills & Team Plan (roles, FTE sizing, build/borrow/buy) — each saved as a downloadable artifact.
- **Export a CycloneDX CBOM from the product catalog** [view:/migrate] [persona:developer] [persona:architect]: Migrate now exports a machine-readable Cryptographic Bill of Materials for your selected products, plus a migration playbook covering deployment waves, a data-at-rest strategy, defense-in-depth, and AI-assisted-migration provenance.
- **A CNSA 2.0 lens on the algorithm catalog** [view:/algorithms] [persona:architect] [persona:developer]: toggle a CNSA 2.0 view to see which algorithms are required (ML-KEM-1024, ML-DSA-87), below the floor, or excluded (SLH-DSA), with the 2027–2035 transition timeline and per-jurisdiction hybrid guidance.
- **Crosswalk the framework to NIST CSF, PQCC, ETSI and the Dutch handbook** [view:/compliance] [persona:executive]: a new view maps each migration phase to NIST CSF 2.0, the PQCC roadmap, ETSI TR 103 619 and the Dutch PQC Migration Handbook, names which deliverable satisfies each regulation, and shows a jurisdiction-by-jurisdiction hybrid-stance matrix.
- **Three new learning modules: SOC, GRC and Team** [view:/learn] [persona:ops] [persona:executive]: SOC for PQC (five detection use cases, threat intelligence, incident-response playbooks, tabletop exercises), PQC GRC (the three-level KRI cascade, risk appetite, the regulatory horizon report), and Building Your PQC Team (roles, FTE sizing, training).
- **Planning instruments on Threats and Timeline** [view:/threats] [view:/timeline] [persona:architect]: Threats now separates harvest-now (HNDL) from forge-later (HNFL) classes with per-threat detection guidance; Timeline adds a 5-year roadmap overlay, the "2026–2030 squeeze" of converging deadlines, and milestone gates.
- **Your program maturity now tracks your progress automatically** [view:/simulation] [persona:executive]: program maturity (0–5, across inventory, governance, pilots, vendors, compliance, crypto-agility and risk) is no longer a form you fill in — it's derived and rises as you play the simulation. Completing your assessment makes you "Aware" (Level 1); Levels 2–5 are earned phase by phase as you progress; your overall level is always your weakest area ("a chain is only as strong as its weakest link"), and the simulation shows it live as you complete phases.
- **Play the always-on Foundations track in the simulation** [view:/simulation] [persona:executive] [persona:architect]: Foundations — maturity, KPIs and the evidence dossier, crypto-agility, regulatory mapping, skills and team, and migration verification & program closure — is now playable alongside the eight phases, each step backed by a real hub tool or workshop, with "right move vs common-failure" decision cards.
- **Four more Command Center tools to run the program** [view:/business] [persona:architect] [persona:ops] [persona:executive]: an Infrastructure Modernization Planner (PKI, HSM/KMS, network and capacity in one plan), a Refresh-Cycle Alignment table (ride already-funded hardware/cloud refreshes), an Accelerated Execution Profile (a pre-drafted contingency package for when the quantum timeline moves), and a Data-at-Rest Strategy (per store: re-encrypt, key-wrap, crypto-shred, delete or accept) — each saved as a downloadable artifact.
- **Your assessment's risk dimensions now show in the simulation** [view:/simulation] [persona:executive] [persona:architect]: the simulation's risk-scoring phase now displays the four scoring dimensions from your assessment — harvest-now exposure (HNDL), forge-later/signature risk (TNFL), regulatory pressure and migration feasibility — next to your migration backlog and two-track plan.
- **Compare and commit your PQC algorithms without leaving the simulation** [view:/simulation] [persona:architect] [persona:executive]: the Algorithms "Transition" and "Detailed Comparison" tabs now open right inside the migration board — map your classical→PQC replacements, or weigh candidates by key size, performance and security level, then confirm to record a CBOM / crypto-architecture for that phase. Both are reachable from the phase's resource rail.
- **The migration program now has a finish line** [view:/simulation] [persona:executive]: clearing all eight phases ends with a verdict that ties your run back to the Mosca clock — whether you reached PQC readiness before Q-Day or finished past it with assets exposed — instead of just another "cleared" badge.
- **In-sim study now pays off** [view:/simulation] [persona:curious] [persona:executive]: finishing a learning module while playing the simulation now shows the same belt + awareness-score reward card you get on the Learn pages, so studying inside the sim counts toward your progress.
- **Key fingerprints in the Crypto Lab** [view:/playground] [view:/report] [persona:developer] [persona:architect]: keys you create in the in-browser keystore now show a short fingerprint (a key check value), so you can tell keys apart and confirm two keys match at a glance — shown in the keystore, the key-encapsulation tab, and the report.
- **Tune the vendor scorecard's weights live** [view:/scorecard] [persona:executive] [persona:architect]: you can now adjust how much each factor counts in the vendor scorecard and watch the rankings update immediately, so the scoring can match your own priorities.

### Changed

- **Cybersecurity workforce mappings refreshed to the current (2025) NICE Framework** [view:/learn] [persona:executive] [persona:developer]: the Learn area's work roles and competency areas now follow the current NICE Framework (Components v2.2.0) — each role carries its official current code, the familiar job title is kept for recognition, and the sample skill references are refreshed to ones that still exist in today's framework.
- **The simulation now runs on your own assessment** [view:/simulation] [view:/assess] [persona:executive] [persona:architect]: the PQC Migration Simulation starts from your completed assessment — your sector, size and jurisdiction are read from it so the game models your real organization (it shows your real country and maps the rules to the closest modeled jurisdiction). If you haven't assessed yet, the simulation points you to the assessment first; you can still change your role and difficulty, and your program maturity is shown derived from your progress (it rises as you complete phases).
- **A quick assessment now gives you the full risk view** [view:/assess] [view:/report] [persona:curious] [persona:executive]: a short assessment now produces the same category scores, harvest-now/forge-later risk windows and Quantum Readiness Assessment heatmap that previously needed the comprehensive path — so a fast pass still fills out your Report and feeds the simulation.
- **Delegating a phase to your AI team is now honest** [view:/simulation] [persona:executive] [persona:architect]: a phase you hand to the AI team is marked "run by AI — understanding unverified" and always nudges you to study what you skipped, so a delegated program can't quietly read as "ready."
- **Wrong moves now teach instead of just buzzing** [view:/simulation] [persona:architect] [persona:developer]: picking a trap in a decision card now reveals the sound move and why it differs — and, when you're behind the Mosca clock, spells out the consequence in your own terms (years over the line, your sector's data exposed past Q-Day).
- **A clearer first-run guide for the simulation** [view:/simulation] [persona:curious]: the walkthrough now explains what people trip on — that your organization comes from your assessment, how the locked maturity bands and any-order steps work, what delegating to the AI team costs, and which difficulty to start on.
- **Jump from a sandbox scenario to its PQC Protocol Matrix row** [view:/playground] [view:/algorithms] [persona:developer] [persona:architect]: hands-on sandbox scenarios (TLS, SSH, VPN, PKI, S/MIME, OpenPGP, JWT, TPM and more) now show a "Related — … in the PQC Protocol Matrix" link that opens the matrix with that protocol's readiness details already expanded.

### Fixed

- **Compliance timelines now read phased deadlines correctly and only mark a deadline "met" with real proof** [view:/business] [view:/simulation] [persona:executive]: a phased deadline like "2025–2030 (phased)" is now treated as its binding final year (2030) instead of the earliest phase-in date, so deadlines no longer look years more urgent than they are — and a deadline only counts as met once you mark a covering certification milestone complete, not merely by planning one.
- **VPN workshop facts corrected across the board** [view:/playground/vpn-sim] [persona:researcher]: wrong NIST citation (SP 800-232 → SP 800-227), an impossible "fragmented IKE_SA_INIT" animation (now a lesson on why it can't fragment), the hybrid SKEYSEED formula (RFC 9370 chains secrets, never XORs them), several PKCS#11 mechanism labels, and byte totals that didn't match the running configuration.
- **ML-DSA certificate authentication was always working — now the workshop says so** [view:/playground/vpn-sim] [persona:developer]: stale warnings claimed the daemon couldn't handshake with ML-DSA certs; the end-to-end test suite was silently pointing at a removed route. The tests now cover all three modes with ML-DSA auth, and the copy reflects reality.
- **Honest handshake sizing** [view:/playground/vpn-sim] [persona:architect]: the stats tiles now grow IKE_AUTH by the selected authentication method (PSK ~0.5 KB up to ML-DSA-87 ~12 KB) instead of showing a fixed number that hid the dominant post-quantum cost.
- **A readable event feed with reduced motion** [view:/simulation] [persona:curious]: with "reduce motion" on, the simulation's live event feed is now a static, scrollable list so every message is readable — previously the scrolling ticker snapped and stranded most messages off-screen.
- **Trustworthy timeline and national-guidance facts in the simulation** [view:/simulation] [persona:executive] [persona:researcher]: the Q-Day year the Mosca clock races is now consistent with the rest of the app's quantum-timeline estimates, and the national PQC stances read accurately — Australia/ASD is no longer overstated as "discouraging hybrid," and Germany/France hybrid is framed as a long-term posture through the transition.
- **The Vendor & Supply Chain phase is correctly continuous** [view:/simulation] [persona:executive]: the final phase no longer shows a one-time "gate certified" — it's an ongoing discipline in the framework, so the simulation now treats it as continuous rather than a box you tick once.
- **The Playground sandbox lists only scenarios that actually run** [view:/playground] [persona:developer] [persona:architect]: the interactive sandbox's scenario list is now generated from the sandbox's own source of truth and kept in lockstep with it, so stale and placeholder scenarios no longer show up — what you can pick is exactly what executes (30 scenarios across 7 tracks), each mapped to the PQC protocols it exercises.

### Data

- **Two foundational frameworks added to the Library** [view:/library] [persona:executive] [persona:architect]: NIST Cybersecurity Framework (CSF) 2.0 and the Dutch PQC Migration Handbook (2nd edition) are now in the reference corpus — searchable and enriched, and the sources behind the new framework crosswalk.
- **Product catalog accuracy overhaul** [view:/migrate] [view:/compliance] [persona:architect] [persona:developer]: a full re-check of the ~950-product catalog. A new vendor registry (38 vendors added, products linked to it); dozens of evidence-backed corrections from a record-by-record validation, with every previously-unverifiable product now resolved with a source; seven product categories (cloud key managers, databases, network firewalls, hardware security modules, identity, secrets managers and operating systems) rebuilt to read their post-quantum status from one central list instead of conflicting copies; IBM's cloud HSM corrected to Hyper Protect Crypto Services; and 276 products tagged to the migration phase they belong to.
- **The hands-on sandbox catalog now matches what actually runs** [view:/playground] [persona:developer] [persona:architect]: scenario descriptions, tools and algorithms were brought in line with the real demos — scenarios that no longer run were removed, several that overstated what they tested (an HSM that wasn't used, a KMIP version that isn't ratified, a "battery drain" figure that was only an estimate) now say so plainly, and the catalog reflects the scenarios you can actually launch.
- **Every persona can now find the sandbox** [view:/playground] [persona:researcher] [persona:executive] [persona:curious]: the hands-on scenarios were only offered to the developer, architect and ops personas, so researchers, executives and curious learners saw none of them. Each scenario is now tagged to the personas it fits, so the sandbox shows up for everyone.

## [3.19.5] - 2026-06-09

The Threats page is fresher and more accurate — corrected post-quantum standards status, more sources you can open, and consistent severity labels.

### Fixed

- **Corrected the status of NIST's fourth signature standard** [view:/threats] [persona:architect]: The cross-industry "NIST standards finalization" threat said FIPS 206 (FN-DSA/Falcon) was published in August 2024 alongside ML-KEM, ML-DSA and SLH-DSA. In fact only those first three were finalized then — FIPS 206 is still in draft, with final publication expected in late 2026 to 2027. The entry now says so, and the HQC backup-algorithm note (now tracked toward FIPS 207) was refreshed to a 2026 draft and 2027 final.
- **Consistent severity labels across every threat** [view:/threats]: A few threats showed severity in mixed casing ("CRITICAL", "HIGH") or an off-scale "Medium-High" value that could sort or filter oddly. Every threat now uses the standard Critical / High / Medium scale.

### Changed

- **More threats link to a primary source you can actually open** [view:/threats]: Re-verified the source documents behind the threat catalog and re-captured fresh copies. The share of active threats backed by an authoritative primary source rose from roughly a quarter to well over half, and every active threat now has an archived copy of its source on file.

### Data

- **Refreshed quantum-threats dataset (2026-06-09)** [view:/threats]: New self-contained snapshot covering the 110 active industry threats, with refreshed source links, complete industry tags, and updated standards references.

## [3.19.4] - 2026-06-08

Compliance frameworks now say plainly whether PQC is required or just recommended, and sector names read in plain English.

### Fixed

- **Compliance frameworks no longer over-state legal force** [view:/compliance]: Several frameworks were flagged as hard mandates when they are actually recommendations or expectations. ANSSI is now shown as a recommendation (not a legal mandate), DORA as resilience obligations that imply but don't explicitly require PQC, and eIDAS 2.0 and FedRAMP as expected/indirect rather than in force today. In all, 42 frameworks were re-characterized so you can tell at a glance what is required versus advised.

### Changed

- **Readable industry names in the compliance views** [view:/compliance]: Frameworks that were tagged with raw industry codes (e.g. "54") now show the real sector name — "Government & Defense", "Finance", "Healthcare" — in the framework chips, the detail panel, and the focus view.

## [3.19.3] - 2026-06-08

A cleaner, more accurate Algorithms page — no duplicate entries, corrected standardization labels, and a live algorithm count.

### Fixed

- **Algorithms page now shows the real count and a working "Top picks" link** [view:/algorithms]: The page advertised a fixed "42 algorithms" even though the catalog had grown well beyond that — it now shows the actual number loaded. The executive "View Top" shortcut was labeled "Top 5" but highlighted only four, and pointed at an algorithm name that no longer exists (so nothing highlighted); it now correctly shows the top four and links to the right entry (FN-DSA-512).

### Data

- **Duplicate algorithm rows removed and standardization labels corrected** [view:/algorithms]: Four algorithms (HQC, Classic McEliece, LMS, XMSS) showed up both as a generic row and as their specific parameter sets (e.g. HQC-128/192/256), double-counting in filters and totals — the redundant generic rows are gone. Several standardization labels were also corrected: FrodoKEM is now shown as a NIST Round 3 alternate (it was never in Round 4), BIKE reflects Round 4 concluding in 2025 with HQC selected, and Classic McEliece 460896 is labeled BSI Level 3 (it was mislabeled Level 1).

## [3.19.2] - 2026-06-07

Restored 12 compliance regulation documents that previously failed to open in the Library.

### Data

- **12 compliance documents restored in the Library** [view:/library]: Regulation documents that wouldn't open before now load correctly as their real PDFs — 7 EU laws (NIS2, DORA, GDPR, eIDAS, the EU Cyber Resilience Act, MiCA, and the 2024 PQC recommendation), 4 US rules (HIPAA, FERPA, COPPA, FDA 21 CFR Part 11), and Singapore's MAS Technology Risk Management guidelines. Five further sources (UNECE R155, CMMC 2.0, NZISM, Kenya DPA, DISA STIG) are still blocked by anti-bot protection and are tracked as known-unreachable.

## [3.19.1] - 2026-06-07

Corrected the dataset counts shown on the About page.

### Changed

- **About page data counts corrected** [view:/about]: The "Platform Data" figures on the About page had drifted behind the live app. They now match what's actually shipping — including Library Resources (741), Algorithm Reference (102), Compliance Frameworks (165), Migrate Products (838), Industry Leaders (341), and PQC Patents (928) — and the total curated-records badge now reads 4,500+.

## [3.19.0] - 2026-06-07

A broad update across Timeline, Library, Migrate, Patents, and Threats — new filters, tidier Library tiles, fully sourced timeline events, and corrected vendor data.

### Added

- **Timeline — filter by organization type** [view:/timeline]: A new Government / Standards / Vendors filter on the migration timeline. Government bodies and standards groups show by default; commercial vendors and quantum-hardware/blockchain entries are one click away in the dropdown. Filtered views are shareable by URL.
- **Library — multiple versions of a document collapse into one tile** [view:/library]: Older drafts and superseded editions of the same document now appear as a single, up-to-date tile (with a "Previous revisions" list in the detail view) instead of three or four near-duplicate tiles.

### Data

- **Timeline — every event now backed by an authoritative source** [view:/timeline]: All 234 timeline events now link to an official primary source, with English translations cached alongside non-English government documents (China, South Korea, Taiwan, Japan, Spain). The old yes/no confidence score is replaced by a graded 0–100 confidence rating, and India's quantum-roadmap entries now point at the May 2026 DST report.
- **Timeline — Gantt ordering and sources cleaned up** [view:/timeline]: Deadline milestones now sort into the correct lane instead of jumping to the front, and a full audit confirmed every active milestone resolves to a real source document on file.
- **Library — freshness sweep: 100 confirmed updates across 794 documents** [view:/library]: A web sweep against the original issuers refreshed 72 documents to their latest version, retired 21 superseded ones (e.g. TLS 1.2 → 1.3), and added 2 new RFCs. Notable bumps include BSI TR-02102-1 (2026 edition), NIST SP 800-63-4, and PKCS#11 v3.2.
- **Migrate — corrected vendor roadmaps and a bigger product catalog** [view:/migrate]: Fixed a vendor-ID mix-up that showed the wrong company's roadmap on a product (e.g. Trezor's roadmap appearing under A10 Networks) — 27 assignments corrected. The catalog grew to 838 products and vendor roadmaps to 115, with cleaner cert links in the expanded rows.
- **Threats — 7 blocked evidence sources recovered** [view:/threats]: Seven industry-threat sources that previously failed to download (UN R155, GSMA PQC/eSIM, DoD CMMC, FERC) are now archived, so the threats evidence set is complete at 112 of 112.
- **Patents — corpus grown to 928 with verified data** [view:/patents]: Added 24 newly granted PQC patents and backfilled verification across all 928 records, so every patent now carries a relevance rating and verified dates with no incomplete rows.

### Changed

- **Timeline — retired events no longer clutter the Gantt** [view:/timeline]: Deprecated timeline rows are now excluded from the chart and the New/Updated indicator, and confidence is shown as a transparent 0–100 grade computed from source quality, peer review, recency, and date precision.
- **Playground — Sandbox category hidden when the sandbox is offline** [view:/playground]: Picking the "Sandbox" filter when no sandbox backend is running used to produce an empty grid with no explanation. The filter now only offers categories that actually have available tools.

### Fixed

- **Workshop player — gap-audit fixes: fixtures fetch, reload flow pinning, persona-aware step lists, Finish CTA, a11y** [view:workshop-panel]: Nine fixes from an end-to-end audit of the guided workshop player (right-panel Workshop tab + Video Mode overlay engine). (1) `flow.fixturesUrl` was fetched route-relative in both `useWorkshopFixtures` and `VideoOverlay`'s duplicated inline loader — from any nested route (`/learn/*`) the request resolved to `/learn/workshop/fixtures/…`, hit the SPA fallback, and every `fill-from-fixture` cue silently no-op'd; now fetched root-relative (same bug class as the manifest fetch fixed earlier in `workshopFlowLoader`), and `VideoOverlay` reuses the hook instead of its own copy. (2) Reload mid-workshop could silently swap flows: `flowOverrideId` is deliberately session-scoped (v5 persistence migration) but `mode`/`currentFlowId`/`currentStepId` persist, so after a reload `RunningView`/`VideoOverlay` resolved the persona-matched flow and restarted it at step 1 with the other flow's `completedStepIds`; `useWorkshopManifest` now pins the active entry to the store's `currentFlowId` whenever a workshop is running/paused/recording. (3) `flattenFlow` was called with persona facets (industry/role/proficiency) by `useWorkshopUrlAutostart` + `useWorkshopAutoComplete` but without them by the panel's Start/Record handlers, `RunningView`, and `VideoOverlay` — latent step-list divergence the moment any flow ships a step-level `when:` filter; all callers now pass the full context, the agenda preview applies the same filter via the newly exported `stepMatchesContext`, and a regression test pins the behaviour. (4) Manifest load failures were swallowed (`error` returned by the hook, never rendered) leaving "No workshop flows in the catalogue" with no recourse; the panel now shows an error card with a force-refetch Retry. (5) The Curious flow declared `proficiencies: ["curious"]` so no real persona (basics/expert) could ever match or even see it in compatible tabs — widened to `"*"`. (6) `public/workshop/index.json` had drifted from the flow files (executive entry claimed 44 steps vs 41 actual; four entries missing `date`); regenerated, and the private builder now prefers the flow's declared `id` so persisted `currentFlowId` values stay stable across regenerations. (7) Video-mode Skip marked the step complete (panel Skip deliberately doesn't) — `advanceToNext(markComplete=false)` aligns the semantics. (8) The last step of a manual workshop dead-ended on a disabled Next; `WorkshopStepCard` now renders a Finish CTA that marks the step done, fires `workshop-finished`, and exits without the confirm dialog. (9) A11y: `CaptionBar` is a polite `aria-live` region instead of `aria-hidden` (captions are the narration — screen readers must hear them; TTS is opt-in), and the auto-hiding `VideoControlBar` gets `inert` while faded out so its buttons can't take keyboard focus inside an `aria-hidden` subtree. Cleanup folded in: dead `WORKSHOP_FLOWS` array + `resolveWorkshopFlow` removed from `src/data/workshopRegistry.ts` (superseded by the JSON manifest loader), duplicate `'workshop'` member dropped from the `RightPanelTab` union, `labelForRegion` covers EU/UK/JP/OTHER, and the pre-flight region picker surfaces a persona-derived region (e.g. EU) instead of hiding the active selection.

### CI

- **Guardrail against wrong vendor-roadmap links** [view:CI]: A new build check catches the exact bug that put Trezor's roadmap on A10 Networks, failing the build if a product points at a retired or mismatched vendor.
- **Trust-engine signature verification now actually runs in CI** [view:CI]: The attestation-verification step had been silently skipped on every build; it now genuinely runs, so any tampering or signature drift in the published trust artifacts fails the build.

## [3.18.0] - 2026-06-04

Playground gets Learn-style views and filtering plus a live sandbox-availability check, with eight learn-module fact corrections and a multi-source data refresh.

### Added

- **Playground — Learn-style views and filtering** [view:/playground]: The Playground now has the same view modes and filtering as the Learn page — browse tools as a path, stack, cards, or table, and filter by category, persona, and NICE work role.
- **New library reference — _Exploiting ML-DSA bugs_ (Bernstein, 2026)** [view:/library]: A cryptanalysis paper by Daniel J. Bernstein reproducing two real ML-DSA implementation flaws that forge signatures in about a second on a laptop, with notes on which libraries were affected.

### Changed

- **Playground — live sandbox availability with click-for-access** [view:/playground]: A status chip in the header now shows whether the interactive sandbox is online. When it's offline, clicking it opens a short "request access" prompt instead of the old dead-end banner, and sandbox-only scenarios are hidden until a backend is actually available.
- **Learn — NICE role view hides irrelevant modules** [view:/learn]: Picking a NICE work role now hides non-relevant competency areas and modules entirely, instead of just dimming them, so the catalog isn't a wall of greyed-out cards.

### Fixed

- **Trust-engine exports are now reproducible** [view:/migrate][view:/compliance]: The OSCAL and CBOM compliance exports were being stamped with the current time on every build, which invalidated their signatures even when nothing changed. They're now generated deterministically and re-signed, so signatures stay valid until the underlying data actually changes.
- **Playground no longer crashes on load** [view:/playground]: Fixed three separate cases where the Playground page could crash to an error screen on first visit due to module load-ordering issues.
- **Playground sandbox terminal accepts input again** [view:/playground]: The interactive terminal in embedded sandbox scenarios (VPN, TLS 1.3, SSH) showed a cursor but ignored keystrokes; the live connection behind it is fixed, and separate browser tabs no longer collide.
- **Learn modules — eight factual corrections** [view:/learn]: Two review passes corrected wrong references and stale figures across the learning content, including:
  - JWT and Hybrid Crypto modules cited unrelated RFCs in their test panels — now corrected to the right specs.
  - The KMS module mis-dated PKCS#11 v3.2 (it's a June 2024 standard).
  - The Quantum Threats module updated its P-256 qubit estimate to the March 2026 Google figure (≤1,200 logical qubits) everywhere.
- **Module "Complete" button now sticks** [view:/learn]: Marking the final step of a module complete now correctly flips the module to "completed" — a single fix that repaired the same behavior across 20 modules.

### Data

- **Protocol Matrix → Library links all resolve** [view:/algorithms][view:/library]: Every RFC and draft referenced in the PQC Protocol Support matrix now links to a real Library entry (15 broken references fixed, including 5 newly added IETF drafts for SSH, TLS, and JOSE/COSE).
- **Migrate — catalog and certification refresh** [view:/migrate][view:/algorithms]: A health sweep restored 10 dropped algorithm-implementation rows, reconnected orphaned product links, and refreshed the certification data — surfacing 29 new PQC certifications including Caliptra, IBM, Red Hat NSS, and wolfCrypt.
- **Migrate — product catalog integrity sweep** [view:/migrate][view:/algorithms]: Fixed 74 products pointing at missing vendors, removed 10 incorrect algorithm-support claims, added 3 important missing products (libgcrypt, libsodium, HPE ArubaOS-CX), and introduced a clear PQC-status column for every product.
- **Library — corrected G7 central-bank quantum report source** [view:/library]: The G7 central-bank quantum-readiness paper now uses the official Banque de France press release and the clean public PDF instead of a watermarked draft.

## [3.17.5] - 2026-06-02

Fixed 10 reported issues across the Learn catalog and crypto workshops, plus several in-browser HSM engine corrections.

### Fixed

- **KMS workshop — ML-KEM envelope encryption works again** [view:/learn/kms-pqc][view:/playground]: The ML-KEM-768 / AES key-wrap envelope-encryption demo failed with an attribute error on both in-browser crypto engines; the engines were rebuilt so the workshop completes end-to-end.
- **Playground — XMSS and ECDSA P-521 self-tests pass** [view:/playground]: Stateful XMSS signing and ECDSA P-521 sign/verify in the algorithm test panel were failing on the in-browser engine; both are fixed.
- **Hybrid Crypto workshop — pure ML-KEM certificate generation fixed** [view:/learn/hybrid-crypto]: Generating a certificate for a pure ML-KEM key produced an empty file; it now creates a real certificate (signed by a temporary ML-DSA issuer), with private keys never leaving the browser sandbox.
- **Network Security workshop — step 6 no longer crashes** [view:/learn/network-security-pqc]: Clicking into the sixth step crashed the workshop because a step was missing from its list; the step is restored.
- **"Complete Module" now works across 20 modules** [view:/learn]: Modules weren't flipping to "completed" after the final step was marked — a single fix repaired the behavior for all affected modules.
- **Playground — mechanism inspector shows readable names** [view:/playground]: Five PKCS#11 mechanisms that displayed as raw hex codes now show their proper names.

### Added

- **Two new library references** [view:/library]: A preprint on quantum-resilient organizational identity (PQC "corridors", business wallets, vLEIs) and the Cloud Security Alliance's June 2026 Crypto News newsletter.

### Data

- **Compliance exports refreshed** [view:/compliance][view:/migrate]: The OSCAL and CBOM exports were regenerated to include the new Tectia SSH Quantum-Safe Edition entry and recent catalog additions.

## [3.17.2] - 2026-05-30

Every learning persona path now includes the recently added modules.

### Changed

- **Learning paths now include all current modules** [view:/learn]: Six persona paths were updated to add modules that existed in the catalog but were missing from the recommended sequences (MLS Group Messaging, Stateful Signatures, Healthcare PQC, EMV Payment PQC, and more), with refreshed time estimates and track descriptions.

## [3.17.1] - 2026-05-31

Fixed duplicate-looking products in the Migrate catalog and re-activated five products.

### Fixed

- **Migrate — no more duplicate-looking products** [view:/migrate]: Deprecated products from the May catalog refactor were still showing and appeared as duplicates (e.g. five copies of AnyDesk). They're now correctly hidden, giving an accurate active-product count.

### Data

- **Five products re-activated in Migrate** [view:/migrate]: Tectia SSH, IVPN, libcrux, Trail of Bits ml-dsa, and InfoSec Global AgileSec are back after their PQC support was re-verified against public sources.

## [3.17.0] - 2026-05-30

Role-aware ("persona") personalization across all seven main pages, a NICE Framework workforce view, a TLS downgrade-attack workshop, and many new references.

### Added

- **NICE Framework view in the learning workshops** [persona:executive][persona:architect][persona:developer][view:/learn]: Organizes all 55 modules by NIST workforce competency areas; pick a work role to highlight the relevant modules and track your progress through them.
- **TLS downgrade-attack walkthrough** [view:/learn]: A new interactive tab in the TLS 1.3 module shows a normal hybrid connection, an attacker stripping post-quantum protection, and how the mitigations defend against it.
- **Role-aware default filters across all seven main pages** [persona:executive][persona:developer][persona:architect][persona:ops][persona:curious][view:/library][view:/compliance][view:/migrate][view:/assess][view:/playground][view:/threats][view:/timeline]: Migrate, Assess, Playground, Threats, Timeline, Library, and Compliance now open already focused on content relevant to your role; one click shows everything.
- **More NIST Round 2 signature algorithms in the Playground** [view:/playground][view:/algorithms]: MAYO, CROSS, OV/UOV, SNOVA, FN-DSA, and FrodoKEM are now interactive in the key generator and sign/verify panels.
- **Executive Board Pack export** [persona:executive][view:/report]: The assessment report can now download a board-ready package (executive summary, key findings, recommended actions, compliance-deadline CSV, and a machine-readable profile).
- **Compliance "For You" views for every role** [persona:developer][persona:ops][persona:curious][view:/compliance]: All six roles now have tailored compliance content — from a developer's CI-gate scaffold to a plain-English orientation for newcomers.
- **Less overwhelming Compliance and Library pages** [view:/compliance][view:/library]: Both pages now show a focused starting set per role (with curated "start here" picks) instead of the full firehose of rows.
- **"For me" filter on the changelog** [persona:curious][view:/changelog]: Filter changelog entries down to the ones relevant to your role.
- **New products, references, and a community profile**: Five Red Hat products added to Migrate; Circle's post-quantum security roadmap and several finance-sector papers added to the Library; Steven Vaile added to the community leaders.

### Fixed

- **Various page fixes** [view:/playground][view:/library][view:/migrate]: Corrected the embedded sandbox URL (was showing a blank frame), stopped deprecated rows from leaking into the Library and Migrate views, and refreshed several stale library entries with real content.

### Data

- **Product catalog enrichment** [view:/migrate]: 716 products processed and 30 new ones added; 95.9% of active products now have a verified proof-of-PQC link.

## [3.16.0] - 2026-05-19

Deep UX improvements to the Algorithms, Compliance, and Learn pages, a NICE workforce gap report, real in-browser PKI enrollment — and a critical browser-crypto security fix.

### Added

- **NICE workforce gap report in Assess** [persona:executive][persona:architect][view:/assess]: The assessment now maps your profile to NIST competency areas and produces a ranked list of roles to hire or upskill, a suggested learning order, and a downloadable report.
- **PKI Enrollment Protocols module** [persona:developer][persona:architect][view:/learn]: Run real certificate-enrollment protocols (CMP and EST) in the browser with actual cryptography — key generation, enrollment, ML-KEM proof-of-possession, and a hybrid certificate comparison.
- **Composite certificates in the S/MIME workshop** [persona:developer][view:/learn]: The workshop can now produce real composite (PQC + classical) certificates and signatures using three standardized algorithm combinations.
- **Bigger Protocol Support matrix** [view:/algorithms]: Expanded to 20 protocols (adding COSE, JOSE, EST/CMP, 5G, DTLS, FIDO, MACsec, UEFI Secure Boot) with 24 verified real-world deployments, and every empty cell now explains why there's no deployment yet.

### Changed

- **Algorithms page redesign** [view:/algorithms]: Live in-browser benchmarks on every transition row, a protocol heatmap that names transport blockers on hover, collapsible deep-dive sections, and a 3-step wizard on mobile instead of a long card list.
- **Compliance and Learn page improvements** [view:/compliance][view:/learn]: Compliance promotes the NIST CSWP.39 cross-walk to a permanent tab and adds smoother mobile scrolling; Learn respects reduced-motion settings and shows clearer progress with resume buttons and a responsive tab bar across all 54 modules.

### Fixed

- **In-browser HSM workshops fixed** [view:/learn]: Several S/MIME and KMS workshop steps that failed when signing or generating keys in the simulated HSM now work, including ML-DSA signing, ML-KEM encryption, and key generation.
- **Compliance and Command Center show the right country's rules** [view:/compliance][view:/business]: Fixed cases where, for example, an Australian finance profile saw EU and French regulations instead of the Australian ones; a new build check rejects unknown country codes.

### Security

- **Critical — browser AES-GCM authentication fixed** [view:/learn]: The in-browser crypto engine was silently ignoring the "additional authenticated data" on AES-GCM, so encryption that looked authenticated wasn't. Fixed across all affected code paths and locked down with an official test vector. Only the in-browser engine was affected.

### Data

- **Accuracy and evidence sweeps**: 21 factual corrections across the Threats content; 113 threat-evidence documents archived with provenance; a Library record with entirely wrong metadata (NIST IR 8477) corrected from the source PDF; threat enrichment expanded to cover all 112 threat IDs.

## [3.15.0] - 2026-05-12

A richer HSM Capacity Calculator and an overnight content-enrichment refresh.

### Added

- **HSM Capacity Calculator — per-region view and a "how many HSMs?" explainer** [view:/playground]: For multi-site fleets, the calculator now shows one card per location (with example global regions) and a step-by-step explainer of how a target transaction rate translates into a number of HSMs, citing the vendor benchmarks behind the math.

### Data

- **Overnight content-enrichment refresh** [view:/library][view:/timeline][view:/threats]: A roughly 31-hour enrichment run refreshed the concept cross-walk (957 connections, with a new evidence-verification gate that auto-rejects unsupported claims), and re-enriched 725 library documents, 235 timeline events, and 88 threat records. The in-app search corpus was rebuilt and re-signed to match.

## [3.14.8] - 2026-05-11

### Fixed

- **IR 8477 xwalk enrichment: sentinel rows for zero-yield docs**: The `--skip-existing` flag now records docs that returned no relationships (sentinel row with `review_status='no_extractions'`), preventing redundant re-processing on subsequent runs. Previous behaviour caused ~40 hours of wasted compute re-scanning the same ~470 zero-yield docs on every enrichment pass.

## [3.14.7] - 2026-05-11

### Reverted — v3.14.6's Gemini-extracted xwalk edges (trust-engine violation)

**v3.14.6 promoted 9 IR 8477 xwalk edges sourced from a Gemini 3.1 Pro extraction run.** During that session it became evident that at least 3 of the 9 emitted `evidence` quotes closely echoed the example row in the orchestrator prompt rather than literal text from the source PDFs — i.e. the model was almost certainly hallucinating the evidence string while emitting plausible-looking `(from, to, relationship_type)` tuples. None of the 9 promoted rows had been verified against the actual source-doc text before merge.

The trust-engine architecture is "source-grounded by construction" (doc §16.1) — every claim must anchor to a cached source passage and pass the cross-check validators (N20/N21). Allowing un-verified evidence into production poisons the audit trail the entire platform depends on: downstream OSCAL + CBOM exports inherit the trust signal, SME signatures aggregate into reviewer attribution, and the corpus regeneration ingests the rows as authoritative.

The right answer when an SME-grade source like ASC X9 or NY DFS doesn't yet have edges in the production xwalk is **"this concept has no graph yet"** — not "fill it in with a less-trusted extraction path".

### What was reverted

- `src/data/concept_xwalks_05112026_r2.csv` — restored to v3.14.5 state (948 rows, was 957 after v3.14.6).
- `src/data/concept_xwalks_05112026_r1.csv` — restored to v3.14.5 state (1037 rows, was 1045 after v3.14.6).
- `src/data/concept_xwalk_candidates_05112026.csv` — public mirror restored to v3.14.5 state.

### What was preserved

- The 15 Gemini-emitted rows in `pqctoday-priv/cowork/concept_xwalk_candidates_05082026.csv` are kept but marked `review_status=rejected`, `reviewed_by=auto-revert-v3.14.7`, `reviewed_date=2026-05-11`, with a `notes` field appended explaining the trust reason. Preserving them in cowork — rather than deleting — keeps the audit trail intact: future SME review can re-promote any row after verifying the evidence quote is a verbatim substring of the source PDF.

### Effect on the UI

The Concept Graph icon disappears again from **ASC X9 Financial PKI & PQC Standards** and **NY DFS 23 NYCRR 500** tiles (their backing concepts have no edges in production again). The v3.14.5 `hasGraphEdges` gate does the right thing: empty graphs no longer surface as clickable icons.

### Policy decision

- **Gemini will not be used for IR 8477 xwalk evidence extraction going forward.** The `qwen3.6:27b` single-model discipline is the production-grade path: N20/N21 cross-checks verify every claim against TF-IDF passages from the cached source doc. The right way to fill the ASC X9 / NY DFS / PQC Coalition gap is to investigate why the local enrichment skipped those docs and re-run the Ollama pipeline targeting them.
- **Gemini may still be used for non-evidence-bearing tasks** — drafting registry display labels, classifying `source_type`, suggesting `concept_id` kebab forms. The risk is bounded when no `evidence` field downstream depends on the output.
- **Future hardening (separate PR):** extend the N20/N21 validators with a `CM-EVIDENCE-SUBSTRING` check that, for every `evidence` value in a production xwalk row, verifies it is a verbatim substring of the cached source-doc text. This catches drift regardless of which model produced the row.

### Verified

`npx vitest run src/data src/components/Compliance` → 330/330 pass after revert. tsc silent.

## [3.14.6] - 2026-05-11

### Added — 15 Gemini-extracted xwalk candidates for ASC X9 + NY DFS docs

Filled the data gap for the 5 source documents that the local Ollama enrichment had skipped (the cause of the empty Concept Graph icons on the ASC X9 and NY DFS compliance tiles in v3.14.5). Used Gemini 3.1 Pro with a parallel-sub-agent orchestrator prompt — one sub-agent per source doc, 3–4 IR 8477 relationships extracted per doc, returned as IR-8477-compliant CSV.

**Source docs processed** (from `public/library/`):

- `ASC-X9-TR-50-2019-Quantum-Techniques-CMS.pdf` → 3 candidates (RFC 5990, NIST PQC Project, RFC 5652)
- `ASC-X9-IR-F01-2022-Quantum-Computing-Risk-Study.pdf` → 3 candidates (DHS PQC Roadmap, Mosca's Theorem, NIST NCCoE)
- `ASC-X9-PQC-Financial-Readiness-2025.pdf` → 3 candidates (FIPS 203, FIPS 204, NSA CNSA 2.0)
- `ASC-X9-Financial-PKI.html` → 3 candidates (FIPS 203, FIPS 204, RFC 8446)
- `NY-DFS-23-NYCRR-500-A2.pdf` → 3 candidates (NIST CSF, ISO/IEC 27001, FIPS 140-3)

After staging in `pqctoday-priv/cowork/concept_xwalk_candidates_05082026.csv` and running `scripts/merge-xwalk-candidates.ts`:

- **9 of 15 newly mergeable** — the rest were orphans (`to_concept` doesn't resolve to a registered library/compliance/timeline ID — e.g. `Mosca's Theorem` is an abstract concept, `DHS PQC Roadmap` has no source doc, `NIST PQC Standardization Project` is too vague to map to a single record).
- 1 invalid-vocab finding: `Mosca's Theorem` row used `rationale_type=semantic` which the merge script's vocab validator rejects (it lags v3.14.0's IR 8477 alignment). Known issue, separate fix.
- Final: **957 rows** in `concept_xwalks_05112026_r2.csv` (was 948 in v3.14.5).

### Effect on the UI

- **ASC X9 Financial PKI & PQC Standards** tile — Network icon now appears, graph populates with FIPS 203, FIPS 204, RFC 8446 (and via equivalence the `ASC-X9-PQC-Readiness-2025` graph picks up FIPS 203/204 + NSA CNSA 2.0).
- **NY DFS 23 NYCRR 500** tile — Network icon now appears, graph populates with FIPS 140-3 (NIST CSF + ISO/IEC 27001 are orphan but didn't land).
- Other ASC X9 docs (TR-50, IR-F01-2022, Financial-PKI) gain graph entry-points where they didn't have edges before.

### Pipeline note

The `merge-xwalk-candidates.ts` reads from the private `pqctoday-priv/cowork/` directory, not the public `src/data/concept_xwalk_candidates_*.csv` mirror. Appending to the mirror file silently has no effect on a merge run. Future Gemini-extraction iterations should append directly to the cowork file.

### Known follow-ups

- **80 unresolved endpoint references** in the migrated xwalk (unchanged from v3.14.5) — concepts like `CA-B-Forum-Ballot-SMC014`, `CNSS Policy #15`, `NIST CSF 2.0` need registry entries.
- **PQC Coalition** still has no source doc — needs to be downloaded before extraction.
- **SOC 2** still requires hand-authored edges (AICPA paywalled).
- **Merger vocab validator stale** — rejects `semantic`/`syntactic`/`functional`. Fixable by aligning `scripts/mergeXwalkCandidates.ts` (or similar) to the v3.14.0 IR 8477 closed set.

### Verified

`npx vitest run src/data src/components/Compliance` → 330/330 pass; tsc silent.

## [3.14.5] - 2026-05-11

### Improved — Concept Graph icon now hides when graph would be empty + matcher handles NIST doc-suffix variants

When a user clicks a compliance tile's Network icon and lands on an empty graph (only the centre node, no edges), that's a confusing UX — the icon implied something to explore. This release addresses both why the graphs were empty and the surface symptom.

- **New `hasGraphEdges(centerConceptId)` helper** in [`src/utils/conceptXwalkGraph.ts`](src/utils/conceptXwalkGraph.ts). Returns true only when the centre concept (or any of its equivalent canonicals) has at least one xwalk edge. The Network icon on framework cards in **ComplianceLandscape**, **FrameworkDetailPopover**, and the executive **FrameworkDeadlineCard** is now gated on this — tiles whose backing concepts have no SME-authored relationships yet (SOC 2, NY DFS 23 NYCRR 500, NIST NCCoE SP 1800-38 at compliance-id level, ASC X9, PQC Coalition, etc.) no longer offer the icon.
- **Matcher in `equivalentCanonicals` relaxed** to treat a trailing single alpha letter as a token boundary, so a centre concept `nist-nccoe-sp-1800-38` (compliance row) now matches library entries `nist-nccoe-sp-1800-38a`, `-38b`, `-38c` — the doc-suffix convention NIST uses for sub-parts of the same regulation. Digit suffixes still don't match, so `fips-2` does not gobble `fips-203`.

### Data — 92 new xwalk edges promoted from candidate staging

Ran [`scripts/merge-xwalk-candidates.ts`](scripts/merge-xwalk-candidates.ts) against the Ollama-generated candidates that had been accumulating over the last 3 days of enrichment. Net result on `concept_xwalks_05112026_r2.csv`:

- **+92 new edges** promoted out of 939 candidates (rest were already in production or had unresolved `to_concept` references — 52 orphan candidates).
- Post-merge cleanup dropped **83 duplicate `xwalk_id` rows** (merge-tool collision; first occurrence kept) and **5 `not_related` rows** (the IR 8477 vocabulary includes `not_related` but project convention is to omit those — they're documented as edges that aren't edges).
- Final row count: **948** (was 944).

### Known follow-ups (not addressed in this release)

- **No new edges for SOC 2, ASC X9, NY DFS, PQC Coalition.** Source documents exist in `public/library/` for ASC X9 (4 docs) and NY DFS, but the Ollama enrichment either skipped them or extracted no relationships. Need to re-run `scripts/enrich-ir8477-xwalk.py` targeting those specific docs. SOC 2 source is AICPA-paywalled — would need manual edge authoring.
- **80 unresolved endpoint references** in the migrated xwalk (`to_concept_id` empty) — these point at concepts that aren't yet in `concept_registry`. CM-CONCEPT validator will flag these as WARNING.

### Verified

`npm test src/data src/components/Compliance` → 330/330 pass. tsc silent.

## [3.14.4] - 2026-05-11

### Fixed — SBOM panel showing actually-installed versions (not package.json caret floors)

The previous v3.14.3 release accidentally **downgraded** several SBOM version labels because it read the `^X.Y.Z` floor from `package.json` instead of the resolved version in `node_modules`. SBOM panels should show what's actually shipping in the bundle, not the minimum the project will accept.

**Reverted downgrades** to true installed versions:

- Framer Motion: v12.27.5 → **v12.35.0** (restored)
- Tailwind CSS: v4.1.17 → **v4.2.4** (also picks up the new patch since the original SBOM)
- React Router: v7.12.0 → **v7.13.1** (restored)
- Zustand: v5.0.10 → **v5.0.12** (picks up new patch)
- ESLint: v9.39.2 → **v9.39.4** (restored)
- Prettier: v3.8.0 → **v3.8.1** (restored)

**Other corrections from running `node -p require('pkg/package.json').version`**:

- @mlc-ai/web-llm: v0.2.81 → **v0.2.83** (was a guess; resolved is newer)
- lodash: v4.17.23 → **v4.18.1**

The user-corrected entries from v3.14.3 stay (those were genuine fixes, not downgrades):

- Lucide React (v0.577.0 → v1.14.0) — was a stale carry-over from the legacy 0.x scheme
- Playwright (v1.58.2 → v1.59.1) — was understated
- pqctoday-tpm caption (v0.2.0 → v0.3.0) — matched the linked URL
- New entries: @xyflow/react, dagre, @tanstack/react-virtual, @noble/post-quantum, @peculiar/x509, jspdf+autotable, docx, pptxgenjs, cborg, lodash, Local AI & Embeddings section

### Verified

`node -p "require('<pkg>/package.json').version"` against every entry now matches what the SBOM panel displays. 5/5 About-page tests pass; tsc silent.

## [3.14.3] - 2026-05-11

### Updated — About / Software Bill of Materials section

Refreshed [`src/components/About/sections/SbomSection.tsx`](src/components/About/sections/SbomSection.tsx) to match the live `package.json`. Drift had accumulated over the last several minor releases; this release brings the user-visible SBOM panel back in line with what's actually installed.

**Version corrections** — SBOM was claiming versions that didn't match the live package.json:

- Framer Motion: v12.35.0 → **v12.27.5**
- Lucide React: v0.577.0 → **v1.14.0**
- Tailwind CSS: v4.2.2 → **v4.1.17**
- React Router: v7.13.1 → **v7.12.0**
- Zustand: v5.0.11 → **v5.0.10**
- ESLint: v9.39.4 → **v9.39.2**
- Prettier: v3.8.1 → **v3.8.0**
- Playwright: v1.58.2 → **v1.59.1** (was understated)
- pqctoday-tpm caption corrected v0.2.0 → **v0.3.0** to match the linked release URL.

**New entries** that were shipping in production without appearing in the SBOM:

- **@xyflow/react v12.10.1** + **dagre v0.8.5** — the graph + auto-layout stack added for the Compliance → Concept Graph icon (v3.14.0).
- **@tanstack/react-virtual v3.13.24** — table virtualization on Migrate / Library.
- **@noble/post-quantum v0.6.1** — ML-DSA-65 attestation for `revisions.jsonl` + `rag-corpus.json` (per doc §12.5 T12).
- **@peculiar/x509 v2.0.0** — certificate parsing in the playground.
- **jspdf + jspdf-autotable**, **docx**, **pptxgenjs**, **cborg**, **lodash** — export + utility libs that were in deps but absent from the SBOM panel.
- **New "Local AI & Embeddings" section** covering `@mlc-ai/web-llm` (in-browser Qwen 3 8B), `@huggingface/transformers` (bge-small embeddings), and `@react-oauth/google`.

### Behind the scenes

- No new dependencies introduced — this is a doc-truth-update only. The 5 About-page tests still pass; tsc silent.

## [3.14.2] - 2026-05-11

### Fixed

- **Compliance Concept Graph now populates for tiles whose `compliance.id` differs from the long-form display label the xwalk uses** (CNSA 2.0, NIS2 Directive, DORA, eIDAS 2.0, etc.). Previously clicking these tiles opened a modal showing only the centre node alone — the xwalk edges authored against the long form (e.g. `NSA CNSA 2.0` → `guidance:nsa-cnsa-2-0`) didn't connect to the centre canonical (`guidance:cnsa-2`) so the 1-hop filter returned zero edges. `buildConceptGraph` now also walks registry entries whose `kebab(sourceRowId)` token-contains the centre tile's kebab — pulling in the cross-store cousins that hold the edges. Edge endpoints get remapped back to the single centre id so the rendered graph stays visually focused (no duplicate "CNSA 2.0" + "NSA CNSA 2.0" node pair).
- **Minimum needle length 4** on the equivalents matcher prevents short generic tokens (`iso`, `gov`) from collapsing unrelated entries. Tiles whose compliance.id kebabs to fewer than 4 chars get only their direct edges — acceptable for those edge cases.

### Behind the scenes

- New `equivalentCanonicals(center)` helper in [`src/utils/conceptXwalkGraph.ts`](src/utils/conceptXwalkGraph.ts) — ~25 LOC. Uses the existing `conceptRegistry` export.

## [3.14.1] - 2026-05-11

### Fixed

- **Concept Graph icon now appears on every Landscape framework card** (was missing on ~90 of 123). The initial registry was built only from xwalk endpoints, capturing 33 compliance frameworks; cards whose `id` didn't appear as a xwalk endpoint (NIS2, DORA, eIDAS, BOI-PQC, CCCS-ITSM, Jordan Financial Sector PQC Roadmap, and many more) couldn't resolve to a canonical concept_id and so the icon was hidden. The build script now enumerates every record in compliance / library / timeline / algo-xref as a Pass A pre-pass, then maps xwalk endpoints to the existing canonicals. Result: **1,154 canonical concepts** (up from 392), **0 unresolved xwalk endpoints**, and the icon appears on every framework card.
- **`build-concept-registry.ts` kebab function** now treats `.` as a separator alongside whitespace/underscore/slash. Previously `kebab("NSA CNSA 2.0")` produced `nsa-cnsa-20` (stripping the dot and fusing `2` + `0`); now produces `nsa-cnsa-2-0`, allowing the matcher to correctly identify `CNSA-2` as a token inside it.
- **`migrate-xwalk-ids.ts` re-migration safety:** the script now finds the next available `_rN` revision when the natural target file already exists, instead of refusing to write. Also handles the case where the input CSV already has `from_concept_id`/`to_concept_id` columns (preserves position instead of duplicating).

### Schema

- **`concept_registry` CSV gains an `aliases` column** — semicolon-delimited list of (a) alternate display-label forms used by xwalk endpoints, and (b) secondary store-key bindings of the form `<table>:<id>`. The loader's `conceptIdByStoreKey` index now also picks up secondary bindings.

### Known limitation (queued for the next release)

- Cards whose `id` doesn't directly match an xwalk endpoint (e.g. clicking CNSA 2.0 → centerConceptId is `guidance:cnsa-2`, but xwalk uses display*label `NSA CNSA 2.0` → canonical `guidance:nsa-cnsa-2-0`) will see an empty graph with the message *"No concept-xwalk edges for this framework."\_ This is correct given the current canonical-id assignment — the deeper fix is a curated equivalence table in the registry, or a runtime "equivalent canonicals" lookup in the graph builder. Tracked for the next release.

## [3.14.0] - 2026-05-11

### Highlights

- **Knowledge-model alignment to NIST IR 8477.** Three small data-model gaps were blocking the doc's D3 worked-example graph (CSWP 39 → FIPS standards → algorithms) from being faithfully renderable end-to-end. All three are now closed: the `rationale_type` vocabulary matches IR 8477 §3.2 exactly, PQC parameter sets have their own first-class xref table, and every xwalk endpoint resolves through a new canonical concept-id registry.
- **Concept graph icon on every compliance framework card.** Click the Network icon on any framework tile (Landscape view, detail popover, or For You executive timeline) to open an interactive xyflow graph centred on that framework — 1-hop xwalk neighbourhood plus synthetic `implements` edges to the default NIST PQC parameter sets, matching the doc's IR 8477 worked example.

### Trust Engine — IR 8477 vocabulary alignment (PR 1)

- **`XwalkRationaleType` enum now matches doc §3.2 closed set exactly:** `syntactic | semantic | functional | technical_dependency | policy_reference | implementation_guidance | timeline_anchor`. Previously the enum was missing the first three doc-named values and carried two custom values (`equivalence`, `specialization`) instead — rows authored against the doc's vocabulary were being silently dropped at load.
- **17 rows rewritten** in a one-shot migration (`/tmp/migrate-xwalk-rationale.ts`): 14 × `equivalence` → `semantic`, 3 × `specialization` → `functional`. New CSV `concept_xwalks_05112026.csv` per `CSVmaintenance.md §1` (never edit in place).
- **12 candidate rows rewritten** the same way in the LLM-staging `concept_xwalk_candidates_05112026.csv` so the next `merge-xwalk-candidates.ts` run doesn't trip the new validator gate.
- **Loader + validator vocab sets** updated in `conceptXwalkData.ts` and both `CM-2` / `CM-Xwalk-VOCAB` checks in `trust-engine-checks.ts`.

### Trust Engine — algorithm parameter-set xref (PR 2)

- **New `standard_implements_algo_xref` table** (18 rows) gives every NIST PQC parameter set a first-class schema home outside the IR 8477 concept-xwalk. `implements` is intentionally not added to the IR 8477 `relationship_type` enum — D3's dotted edges are synthesised at render time from this xref.
- Full NIST PQC matrix seeded: ML-KEM-512/768/1024 (FIPS 203), ML-DSA-44/65/87 (FIPS 204), and all 12 SLH-DSA variants (SHA2 × 3 levels × s/f + SHAKE × 3 levels × s/f, FIPS 205). The three D3-canonical defaults — ML-KEM-768, ML-DSA-65, SLH-DSA-SHA2-128f — are flagged `is_default=yes`.
- **New loader** `src/data/standardImplementsAlgoXref.ts` with `paramSetsByStandard` and `standardByParamSet` O(1) lookup maps.
- **New validator** `CM-ALGO-XREF` (4 sub-checks): standard_id resolves to library row, param_set matches the canonical PQC regex, family is in `{KEM | DSA | HBS}`, and exactly one `is_default=yes` per standard.

### Trust Engine — canonical concept registry + xwalk migration (PR 3a + 3b + 3c)

- **New `concept_registry_05112026.csv`** (392 rows) maps every distinct xwalk endpoint to a canonical id like `framework:nist-cswp-39`, `guidance:cnsa-2`, `standard:fips-203`, `algorithm:ml-kem-768`, `timeline:nss-acquisitions-cnsa-2-0-required`. Closes the "ghost concept" problem where `NIST CSWP 39` had ~100 incoming/outgoing edges but no backing record. **99.5% of concepts auto-resolved** by deterministic join against library / compliance / timeline / algo-xref; the remainder is concept-only or SME-review.
- **Programmatic builder** `scripts/build-concept-registry.ts` with name-based heuristics for the source_type classifier (framework / guidance / standard / algorithm / timeline / concept_only).
- **New loader** `src/data/conceptRegistry.ts` with `conceptByCanonicalId` and `conceptIdByStoreKey` indexes plus a `conceptIdForStoreKey(table, id)` helper.
- **New validator** `CM-REGISTRY` (3 sub-checks): source_type in closed set, concept_id uniqueness, source_row_id resolves to a real record in the named table.
- **Xwalk migration to canonical ids** — `concept_xwalks_05112026_r2.csv` adds `from_concept_id` and `to_concept_id` columns alongside the original human-readable strings. **99.8% of endpoint references auto-populated** via deterministic registry join. The remaining 2 (`xw-517`, `xw-518` using `NIST SP 800-90B` with spaces) were closed by renaming to the dashed form that matches the library reference_id.
- **New validator** `CM-CONCEPT` (2 sub-checks, WARNING severity): from/to_concept_id is non-empty AND resolves to a registry row. Promotion to ERROR after next SME sweep.
- **`conceptIdFor*` accessors added** to `libraryData.ts`, `complianceData.ts`, `timelineData.ts`, and `standardImplementsAlgoXref.ts` so hub components holding a domain row can resolve its canonical id in O(1).
- **`ConceptXwalkRecord` interface gains** `fromConceptId` and `toConceptId` fields; existing `fromConcept`/`toConcept` strings preserved as human-readable labels.

### Compliance — Concept Graph icon (UI)

- **New Network icon on every framework card** in `ComplianceLandscape`, in the `FrameworkDetailPopover` header, and on `FrameworkDeadlineCard` (Executive timeline view). Click opens a portal modal with the framework's xwalk neighbourhood rendered as an interactive graph.
- **`FrameworkConceptGraph` component** (`src/components/Compliance/FrameworkConceptGraph.tsx`) — first use of `@xyflow/react` inside the public hub bundle. Uses `dagre` (~30 KB, MIT) for LR auto-layout. Custom node renderer colour-codes by `source_type` using semantic tokens; framework (primary), guidance (status-error), standard (status-success), algorithm (purple), timeline (status-warning). Dashed strokes for synthetic `implements` edges to the default parameter set on FIPS 203/204/205. Includes zoom/fit Controls and a MiniMap.
- **Graph builder utility** `src/utils/conceptXwalkGraph.ts` filters `conceptXwalkData` to edges whose `fromConceptId === centerConceptId || toConceptId === centerConceptId`, then optionally extends with synthetic `implements` edges to algorithm leaves via `paramSetsByStandard.get(standardId)` (defaults only by default).
- **Modal wrapper** `FrameworkConceptGraphModal.tsx` matches the existing `FrameworkDetailPopover` pattern (portal, FocusLock, Escape close, body-scroll lock).
- **`ComplianceTable` was intentionally skipped** — its rows are per-certification (FIPS CMVP / CC / ACVP), not per-framework, so concept-graph generation doesn't apply.

### Data artefacts regenerated

- `public/data/rag-corpus.json` — **10,847 chunks, 16.1 MB** (10s regen). PROV-DM 100% on `was_attributed_to`; all 10,788 deep-links validated.
- `public/data/embeddings.bin` + `embeddings-meta.json` — **15.9 MB / 420 KB** (173s regen). Re-aligned with the regenerated corpus via `npm run generate-embeddings` (bge-small-en-v1.5 quantized int8, 384-dim).
- `public/data/pqctoday-oscal*.json` + `pqctoday-cbom.json` — regenerated by `npm run build`.

### Validator suite — new gates

- `CM-2` + `CM-Xwalk-VOCAB` extended to enforce IR 8477 §3.2 closed rationale_type set (existing checks now reflect new vocab).
- `CM-ALGO-XREF-STD`, `CM-ALGO-XREF-PARAM`, `CM-ALGO-XREF-FAM`, `CM-ALGO-XREF-DEFAULT` — referential integrity for the new algorithm xref.
- `CM-REGISTRY-TYPE`, `CM-REGISTRY-DUP`, `CM-REGISTRY-REF` — referential integrity for the new concept registry.
- `CM-CONCEPT-FROM`, `CM-CONCEPT-TO` — xwalk canonical-id resolution (WARNING).

### Known pre-existing issue (not addressed in this release)

- `scripts/validators/__tests__/duplicate-checks.test.ts` and `qa-semantic-checks.test.ts` overwrite `public/data/rag-corpus.json` with synthetic data during their setup phase. They do attempt a backup/restore (`.qa-semantic-test-backup`) but there's no SIGTERM handler — if the test is killed mid-run (CI timeout, OOM, manual abort), the production corpus is left corrupted. Will be fixed in a separate PR.

### Behind the scenes

- All Trust Engine model alignment changes verified by 53/53 → 337/337 → 330/330 progressively widening test runs; production `npm run build` clean.
- New dependency: `dagre@^0.8.5` + `@types/dagre` (~30 KB, MIT) — first graph-layout library in the hub bundle, not a crypto library (outside CLAUDE.md's "no new crypto libs without permission" rule).

## [3.13.0] - 2026-05-11

### Highlights

- **Local AI is now framed as exploratory and gated behind explicit consent.** After observing the in-browser models confidently fabricate FIPS 203 algorithm names ("Sphinx", "Tapestry") and use deprecated terminology ("Kyber" for ML-KEM), we narrowed the local-AI surface to a single best-available model and require two distinct user acknowledgements before any local session can start. Cloud (Gemini Flash) is now visually surfaced as the **Recommended** path for any factual question.
- **Local catalog narrowed to one model — Qwen 3 8B.** Smaller in-browser models (1.7B–4B parameters) hallucinate too aggressively on PQC standards content; we'll re-expand the catalog when on-device models reach the accuracy bar this app needs.
- **Chat panel can now expand to ~85vw** for users who want to read longer responses without dragging — a new toggle in the panel header switches between partial (~40vw) and expanded width, and the choice persists across reloads.

### Local AI — quality gating

- **Double acknowledgement required before any local-AI session.** Two checkboxes, neither pre-checked, neither saved across sessions:
  1. _"I understand that local AI may fabricate algorithm names, standards, dates, and other facts, and I will verify every named entity in its responses against the source pages before relying on it."_ — required to enable **Get Started**.
  2. _"I understand that local AI is an exploratory feature, that current results do not meet the accuracy bar of this app, and I am proceeding on that basis. I will not screenshot or share local-AI responses as if they were authoritative."_ — required to enable the final **Agree & Download** button.
     Backing out of the consent flow resets both checkboxes so prior consent can never be passively reused.
- **Cloud (Gemini Flash) card now badged as Recommended** with a primary-coloured affirmation banner: _"Meets this app's accuracy bar — Gemini 2.5 Flash reliably grounds its answers in the retrieved PQC corpus, honors the 'answer only from context' instruction, and uses current standard names (ML-KEM, ML-DSA — not the deprecated Kyber/Dilithium)."_ Border bumped to a thicker primary outline so the Cloud card visually wins the side-by-side comparison.
- **Local card now badged as Experimental** with a yellow warning banner: _"Accuracy is currently below our bar — Local AI runs entirely in your browser, but small on-device models (1.7–8B parameters) routinely fabricate facts about specific algorithms, standards, and dates."_ Footer note explains we're monitoring local-AI progress and will reintroduce a tiered catalog when models improve.

### Local AI — catalog overhaul

- **Catalog reduced from five models to one.** Removed Qwen 3 0.6B, Qwen 3 1.7B, Qwen 3 4B, Llama 3.2 3B, and Phi 3.5/4 Mini; kept only **Qwen 3 8B** (`Qwen3-8B-q4f16_1-MLC`, ~5.7 GB VRAM, ~4.5 GB download). Justification: it has the newest training cutoff (early 2025) of any 7B+ model in the MLC registry, the strongest instruction-following at that size, and avoids the dominant failure modes of the smaller alternatives (Phi 4 Mini's repetition loops on structured prompts; Qwen 3 4B's `<think>`-mode trap; Llama 3.2 3B's confident hallucination of named entities).
- **Every catalog entry's `maxContextLength` corrected to 4096.** Previous values claimed 8K (Qwen 3 1.7B/4B, Llama 3.2 3B) and 16K (Phi 3.5 Mini), but every MLC-compiled WebLLM build is hard-capped at 4K — the over-claimed values were silently clamping or erroring at runtime when the slider went above 4K. The misleading "Largest context window" tip on Phi was the most visible symptom.
- **Qwen 3 0.6B VRAM corrected** from 604 MB → 1403 MB (off by 2.3×) and download size from 0.4 GB → 0.6 GB before the model was dropped from the catalog. The previous values would have made the "Fastest" tier look much cheaper than it actually was.
- **Persistence migration `v8 → v9 → v10 → v11`** in `useChatStore.ts`. Whatever local model an existing user previously had selected, they now land on Qwen 3 8B (or Cloud) without being silently reset to the default — the migration walks through the intermediate states (Phi 3.5 → Phi 4 → Llama 3.2 3B → Qwen 3 8B; Qwen 3 0.6B → Qwen 3 1.7B → Qwen 3 8B). Persisted `localContextWindow > 4096` is also clamped down to 4096 so stale slider values don't break model init.
- **Single-model UI affordance:** when the catalog has only one entry the model picker renders as a static labelled box instead of a useless single-item dropdown.

### Local AI — reliability fix for Qwen `<think>` mode

- **`/no_think` is now injected into both the system prompt and the trailing user turn** for Qwen 3 models. The previous user-only injection was flaky on Qwen 3 4B (and 8B with long system prompts) — the model would honor the directive sometimes and ignore it other times, leaving the entire response trapped inside an unclosed `<think>...</think>` block that the post-stream stripper removed, producing an empty assistant bubble with citations populated but no content.
- **Empty post-strip output now surfaces a partial reasoning excerpt with a notice** instead of silently rendering an empty bubble. When Qwen ignores `/no_think` and produces only thinking content, the user sees: _"The local model produced reasoning but no final answer (its 'thinking mode' wasn't suppressed). Partial reasoning shown below — try a shorter question or switch to a smaller Qwen variant."_

### Right panel — width toggle

- **New maximize / minimize toggle in the panel header.** Click it to expand the right panel from ~40vw to ~85vw for easier reading of long chat responses; click again to shrink back. Animated 200 ms width transition; state persists across reloads via a new `isExpanded` flag in `useRightPanelStore` (migration `v5 → v6`, defaults existing users to partial). Hidden on mobile (panel is already full-width below `sm:` breakpoint).

### Fixed — chat panel header

- **Provider chip in the chat header now shows just the model name.** Previously the trim regex was `/ \(.*\)$/` which only matches parens at end-of-string; once we added taglines like `"Llama 3.2 3B (1.5 GB) — Strong instruction following"`, the regex stopped matching and the entire long label rendered into the header, eating horizontal space and pushing the action icons around. Replaced with `.split(/ \(| —/)[0]` so the chip displays only e.g. `"Llama 3.2 3B"`.
- **Action icons in the chat header no longer wrap to a second line.** Removed `flex-wrap` from the icon row and added `shrink-0`; the title group on the left already has `min-w-0` + `truncate` so it compresses gracefully instead.

### Fixed — provider setup screen

- **Context Window preset cards no longer collapse into one mashed line.** The cards were rendered with `<Button variant="ghost">` (default size), whose base classes include `inline-flex items-center justify-center whitespace-nowrap` — these flattened the card's two-row internal layout into a single horizontal line, producing strings like `"4K tokensSafe default9 chunks · 60% coverageAny GPU"`. Switched to `size="tile"` which provides `flex-col items-start whitespace-normal` defaults, with `min-h-0 p-2.5` overrides to keep the compact card height and `w-full` on inner flex rows.
- **Duplicate "Model" label removed.** The outer `<span>Model</span>` plus a `label="Model"` prop on `<FilterDropdown noContainer>` was rendering "Model" twice. Removed the dropdown's `label` prop; the outer span is now the single label.
- **Help text updated** to describe only the surviving model and to redirect factual queries to Cloud.

### Behind the scenes

- WebLLM catalog file (`src/services/chat/WebLLMService.ts`) carries an explicit header comment documenting the rationale for the single-model catalog and the criterion for re-expansion.
- All chat / local-AI / right-panel changes verified by `npx tsc --noEmit` and 391 passing tests across `src/services/chat/`, `src/store/`, `src/components/Chat/`, and `src/components/RightPanel/`.

## [3.12.1] - 2026-05-11

### Fixes

- **`/about` page no longer crashes in production.** `GlobalRevisionsFeed` was building its entity-label map at module-load time via an IIFE that iterated `WORKSHOP_TOOLS`, `MODULE_CATALOG`, and `conceptXwalkData`. Under prod code-splitting one of those imports could be `undefined` at init time, raising `TypeError: z is not iterable` and breaking the entire `/about` route. The label map is now built lazily on first lookup with null-guards on each source.
- **`/compliance` "For You" tab — industry filter now actually filters.** Three independent issues were combining to make the editable industry dropdown look broken:
  - **Duplicated controls.** Two filter strips were stacked on the tab — `<GeoFilter>` / `<SectorFilter>` / `<RoleFilter>` (URL-driven, NAICS codes) above a `<ProfileSummary>` (assessment-store-driven, freeform industry names). Removed the top Geo + Sector chips on this tab; `<ProfileSummary>` is now the sole country/industry editor (`<RoleFilter>` for persona remains).
  - **NAICS ↔ freeform vocabulary mismatch.** The compliance CSV stores industries as NAICS 2-digit codes (`'92'`, `'52'`, …) but `<ProfileSummary>` writes freeform names (`'Government & Defense'`, …). The framework matcher did exact `industries.includes(profile.industry)` with no normalisation, so freeform picks never matched any rows. Added `expandIndustriesForMatching` in `applicabilityEngine.ts` to expand CSV NAICS codes with their freeform aliases before classifying — both vocabularies now match the same rows.
  - **URL `profileOverride` shadowed user edits every render.** `ForYouSection` was building a `profileOverride` from URL params (`?country=`, `?industry=`, `?ind=`, `?geo=`, `?sector=`) and persona `selectedIndustries[0]`. `useApplicability` merged as `override ?? store`, so any URL/persona value silently shadowed the assessment-store write made by `<ProfileSummary>`. Rewrote `ForYouSection` to drop the override entirely and instead mirror those URL params into the assessment store on first mount only — keeps backwards-compat with workshop deep links while letting subsequent edits propagate.

_Internal detail: `src/components/ui/GlobalRevisionsFeed.tsx`, `src/components/Compliance/ComplianceView.tsx` (`ForYouSection`), `src/utils/applicabilityEngine.ts` (`expandIndustriesForMatching`, applied in `applicableFrameworks`)._

## [3.12.0] - 2026-05-10

### Highlights

- **Trust badges are now meaningful across the whole site.** Three independent bugs in the trust-tier scoring code were quietly forcing every product, every algorithm, and most leaders into the "Low" tier regardless of their actual evidence. After this release, **319 records (15.7% of the corpus) move out of "Low"**, and many now show "Authoritative" or "High" reflecting their real-world FIPS / Common Criteria / peer-reviewed status.
- **New `/agility` dashboard** — view your organisation's cryptographic-agility maturity on the NIST CSWP 39 model (4 levels × 5 pillars: inventory, governance, lifecycle, observability, assurance).
- **Citations now show provenance.** Every chunk in the chat/search corpus carries metadata describing where it came from, when it was generated, by whom, and which source document it was derived from.
- **Library research coverage jumped from 73% → 92%** after a full enrichment re-bake of 155 documents.
- **Cross-page industry filter actually works now** — selecting "Finance & Banking" on the home page no longer leaves the Compliance view empty because of a hidden taxonomy mismatch.
- **The trust-engine roadmap is complete.** All 13 sub-plans (review gates, persona filtering, OSCAL export, maturity dashboard, etc.) are now ✅.

### Trust scores

- **Products** previously all scored "Low" — the engine wasn't reading the FIPS / CC / ACVP certificate evidence that the product catalog already carried. Tier distribution: **0 / 0 / 0 / 825** → **1 / 43 / 140 / 641** Authoritative / High / Moderate / Low (184 products lifted; 22% of the catalog).
- **Algorithms** previously all scored "Low" — the engine wasn't reading peer-review / vetting / FIPS-standard signals from the algorithm reference data. Tier distribution: **0 / 0 / 0 / 163** → **0 / 82 / 30 / 51** (112 algorithms lifted; 69%). The 82 "High" records are the FIPS-standardised PQC algorithms — ML-KEM, ML-DSA, SLH-DSA, LMS, XMSS, etc.
- **Leaders** previously had no records in the "Authoritative" or "High" tiers. A field-name bug was silently failing the inheritance from each leader's authored library documents. After the fix, **31 Authoritative / 30 High / 55 Moderate / 224 Low** (was 0 / 0 / 93 / 247) — 61 leaders gained Authoritative or High status from their now-correct connection to peer-reviewed publications.
- **Overall corpus:** 47 / 446 / 786 / **2,035** → **79 / 601 / 918 / 1,716** Authoritative / High / Moderate / Low.

_Internal detail: fixes live in `src/data/trustScore/trustScoreData.ts`. Products inherit vetting bodies from `certificationXrefData.ts`. Algorithms read a new `src/data/algorithmTrustData.ts` sync loader. Leaders use a new `keyResourceRefs?: string[]` field on the `Leader` type to look up library `referenceId`s (the existing `keyResourceUrl` field holds URLs and was being used by accident as a lookup key). A parallel bug in `LibraryDetailPopover.tsx`'s reverse-lookup is fixed the same way._

### New: `/agility` maturity dashboard

- New top-level route rendering the NIST CSWP 39 Cryptographic-Agility Maturity grid — 4 levels (Partial → Risk-Informed → Repeatable → Adaptive) across 5 pillars (inventory, governance, lifecycle, observability, assurance).
- KPI bar above the grid shows grid coverage %, mean confidence, and source-record count so you can see at a glance how complete the extraction is.
- Empty-state copy points operators at the enrichment script when the CSWP 39 slice has no rows.

_Internal detail: `src/components/Agility/AgilityView.tsx` reuses the existing `MaturityEvidenceGrid` component over a CSWP-39-filtered slice of `maturityRequirements`. Route registered in `src/App.tsx` as a lazy-loaded child of `MainLayout`._

### Library, search & citations

- 155 documents fully re-enriched against the latest dimension model — library coverage **92% (726/787)** up from 73% (571/787). PQC-dense documents (KEM/signature specs, TLS ML-KEM, XMSS/LMS, IKEv2 PQC drafts) averaged 15 of 28 dimensions populated.
- RAG search corpus rebuilt — **10,845 chunks**, +217 versus the previous build. Document-enrichment chunks are 1,611 of the total.
- Every chunk now ships with full PROV-DM provenance metadata (`entity_id`, `was_generated_by`, `was_attributed_to`, `was_derived_from`, `source_doc`, `source_passages`) so chat and search citations can show exactly where an answer came from.
- Embedding index (15.9 MB) rebuilt against the new corpus; `corpusHash` invariant restored and verified by `corpus-trust-invariants.test.ts` (10 tests, all green).

### Compliance & industry filtering

- The industry filter dropdown on **Compliance** now shows human-readable labels — `"Finance & Insurance (52)"` instead of bare `"52"`. Out-of-vocab values seeded from cross-page state still surface so you can see exactly what the active filter is.
- Cross-page industry filter actually matches now. URL parameters and persona-store values like `"Finance & Banking"` are auto-resolved to the matching NAICS code (`"52"`) before filtering, so navigating from a persona-aware page into Compliance no longer mysteriously empties the view.
- Trust-tier filter on **Compliance → Landscape** now applies to the facet partitioning — selecting "Authoritative" correctly filters per-facet counts for bodies / standards / certifications / regulations.

_Internal detail: `SectorFilter.tsx` exports `NAICS_LABELS` and a `resolveToNaics()` helper backed by the existing `INDUSTRY_TO_NAICS` alias table. `ComplianceView.tsx` routes two `useState` initialisers and one tab-switch effect through it. `LandscapeTab.tsx` consumes `useTrustTierFilter` + `matchesTrustTierFilter` before partitioning frameworks._

### Fixed

- The **"Why shown?" popover** on derived compliance standards no longer gets clipped by the page shell. Renders via React portal with viewport-aware positioning (flips above/below the trigger based on available space, clamps horizontally to viewport).
- **Test runs no longer silently corrupt the RAG corpus.** `scripts/generate-rag-corpus.ts` called `main()` at module top level, so anything that imported its helper functions (including the unit test for `sanitize` and friends) silently rewrote `public/data/rag-corpus.json` as a side effect. Wrapped in the standard `if (import.meta.url === ...)` guard.
- **The RAG corpus and its embedding sidecar now stay byte-stable through commits.** Prettier's pre-commit hook had been reformatting `public/data/rag-corpus.json` from minified to pretty-printed, which changed the file's `sha256` hash and broke the `corpusHash` invariant verified by `corpus-trust-invariants.test.ts`. The corpus and `embeddings-meta.json` are now in `.prettierignore`.

### Behind the scenes

- The **trust-engine implementation roadmap is now 13 / 13 ✅** — all sub-plans complete on this branch: foundation, learn-module + workshop-tool review gates, library + algorithms + compliance + timeline + migrate + threats + assessment + leaders data domains, enrichment pipeline + PROV-DM, Compliance-For-You trust paths, timeline-claims evidence layer, UI trust layer, persona filtering, OSCAL export, and the new `/agility` maturity dashboard.
- The CSWP 39 + Q&A citation validators (`CM-W`, `CM-C`, `QA-S`, `QA-CSWP`) are operational. They currently surface **38 modules** with stale `lastReviewed` dates and **707 Q&A rows** missing citation references — these are the SME-review queue the validators were designed to produce, not bugs to fix in code.
- Trust-tier baseline snapshot captured at `reports/trust-tier-snapshot.json` for ongoing measurement; re-run via `npx vitest run …measure-tier-distribution.test.ts` whenever data changes meaningfully.

## [3.11.0] - 2026-05-10

### Highlights

- **Search now understands what you mean, not just what you type.** Typing "TLS hybrid" on Library, Migrate, Patents, Compliance, Threats, Timeline, Community, or Algorithms now also returns documents that talk about KEM hybrid in TLS 1.3 — even when none of those words appear literally. The classic keyword search is still the floor; semantic matches are added on top.
- **Free-text Compliance suggestions in the Assessment.** Step 5 has a new "Describe your context" textarea that recommends the top 5 frameworks for your situation and lets you add them with one click.
- **Five new behind-the-scenes data-quality watchers** that surface candidate fixes (missing references, possible duplicates, possible counter-claims, weak topic coverage) for SME review. They generate review queues; they don't auto-edit data.
- **Trust-tier baseline captured** at 47 Authoritative / 446 High / 786 Moderate / 2,035 Low so future shifts can be measured against this snapshot.

### Semantic search across the site

- Single shared `useSemanticSearch` hook wired into **8 list-driven views** (Library, Patents, Migrate, Compliance Landscape, Threats, Timeline, Community, Algorithms — both transitions and filteredAlgorithms slices) plus the Assessment wizard's Compliance step.
- **Lexical floor preserved everywhere.** If the embedding runtime hasn't loaded, the page falls back cleanly to the existing keyword filter — no behavioural regression.
- **Score interleave on Patents** — semantic hits are now merged with lexical hits by normalised score, so high-relevance semantic-only matches don't get pushed to the bottom of the list.
- **Improved empty-state copy** on Library / Migrate / Compliance: shows "semantic search is still loading…" while the runtime warms up, and "no direct or semantically related X found" once it has run.
- **Small "✨ Expanded with semantically related matches" hint** appears above results when semantic search added items the keyword filter wouldn't have surfaced.

_Internal detail: `src/services/search/useSemanticSearch.ts` (modes idle / loading / lexical / semantic, 250 ms debounce, 7 unit tests). Reuses the existing chunk pool from `UnifiedSearchService` so there's no duplicate corpus fetch. `embeddingRetrieval.ts` now exports `cosineSearchByChunkId`, `getChunkVector`, `getEmbeddingDimensions` for the new validators below._

### Data-quality watchers (admin-portal review queues)

Five offline scripts that run against the embedding index and produce review queues for subject-matter experts. None of them auto-edit data, and they all ship as WARNING/INFO so they can't break CI:

- **Missing-reference candidates** — for every record flagged as having no source citation, suggests the top 3 trusted-source candidates by semantic similarity. Drives the admin-portal "MR-1" queue.
- **Trusted-source cross-reference proposer** — proposes new `(resource, source)` links for records that should probably cite an existing trusted source but don't. 449 candidates from 2,675 resources on the current corpus.
- **Semantic data-quality checks** (six new) — main-topic grounding, PQC-algo mention, threats↔timeline coupling, Tier-1 corroboration, standards-body vocab, compliance-framework vocab. Full sweep over 1,611 enrichment chunks takes ~0.7s.
- **Pair-wise duplicate detector** — flags near-duplicate records within Library / Migrate / Timeline. 300 candidate pairs surfaced on the current corpus.
- **Counter-claim auto-discovery** — clusters Authoritative-tier chunks and surfaces cross-source pairs that may disagree. Explicitly framed as "candidates for SME review" because many pairs are jurisdictional peers (NSA/US vs ANSSI/FR) rather than contradictions.

_Internal detail: lives under `scripts/validators/` and `scripts/`. Severity stays WARNING/INFO until SMEs sample 30 findings and confirm precision. Promotion plan documented in the relevant script docstrings. All five tolerate a mid-write `rag-corpus.json` via try/catch + `isCorpusParseable()` so they self-skip instead of crashing during enrichment runs._

### Fixed

- **Validators no longer crash mid-enrichment.** Three validators (`missing-reference-checks`, `qa-semantic-checks`, `duplicate-checks`) plus five test files now tolerate a partially-written `rag-corpus.json` and self-skip with empty findings instead of failing.
- **Counter-claim output explicitly framed as candidates, not declarations.** The script's docstring + test assertions clarify that cross-source pairs (e.g. NSA vs ANSSI on the same algorithm) are jurisdictional peers, not stance disagreements — the algorithm can't tell those two cases apart, so the output is a queue for human review.

### Behind the scenes

- **Trust-tier baseline snapshot** captured at `reports/trust-tier-snapshot.json` — 3,314 records distributed 47 / 446 / 786 / 2,035 Authoritative / High / Moderate / Low. Re-run the `measure-tier-distribution` test after data changes to compare.
- **Genuinely deferred to a later cycle**: ERROR-severity promotion of the six new semantic data-quality checks (waiting on two enrichment cycles + an SME-reviewed precision sample); the "after" half of the 5–8% tier-lift measurement (waits on admin-portal queue approvals); a live browser smoke test of all 9 semantic-search surfaces.

## [3.10.0] - 2026-05-10

### Highlights

- **Trust tier filter on five views.** Library, Migrate, Compliance, Threats, and Timeline now have a tier-filter chip in the URL (`?tier=`) — show only Authoritative, only High, or any combination.
- **Chat citations now show trust tier.** Every citation in a chat answer is labelled with its tier so you can see at a glance how authoritative the source is.
- **⌘K command palette is tier-aware.** Authoritative and High results outrank Moderate / Low ones, and there's a persistent "Authoritative only" toggle.
- **Timeline events show a freshness pill** — current (≤1 year old), stale (1–2 years), or critical (>2 years) — based on the underlying source date.
- **A long-tail of broken trust links is fixed.** Tier-resolution previously failed for 1,316 records ("orphans" — chunks whose trust tier could not be resolved). After this release: just 13 left. **99% improvement.**

### Trust signals across the UI

- **TrustTierFilter chip** (`?tier=` URL parameter, multi-select) on Library, Migrate, Compliance, Threats, Timeline. Per-layer counts on Migrate and the 4 Landscape memos on Compliance update consistently with the active selection.
- **Records tab on Compliance** honours the filter via a source → framework-id mapping.
- **CitationTierChip** rendered next to every citation in chat answers. The chip's `aria-label` reflects the engine's tier exactly so screen readers don't lose the signal.
- **⌘K palette tier-aware ranking** — applies the same trust-tier multiplier (Authoritative ×1.20, High ×1.10, Moderate ×1.00, Low ×0.80, Unknown ×0.95) as the chat retrieval path. Persistent "Authoritative only" toggle saved to `localStorage`.
- **TimelineEvidenceBadge freshness pill** in both compact (card) and full (popover) modes, derived from each event's `sourceDate`.

_Internal detail: `src/components/common/TrustTierFilter.tsx`, `ChatMessage.tsx`, `UnifiedSearchService.searchPalette()`, `TimelineEvidenceBadge.tsx`. 79 new Vitest contract tests + 4 Playwright E2E specs validate the surface._

### Fixed — Trust-tier resolution orphans (1,316 → 13)

Five distinct fixes diagnosed and applied:

- **Deprecated leaders no longer appear in the corpus.** `generate-rag-corpus.ts` now matches the loader's `filterActive` filter (closes 1 orphan).
- **Timeline events register all their lookup keys** — `${country} — ${title}`, `${country}:${body} — ${title}`, and the "United States" un-rename for NSA-organised events (closes 235 timeline + most doc-enrichment orphans).
- **Enrichment chunks routed by their collection** — document-enrichment chunks were always being mapped to "library" regardless of their actual source. Now read `metadata.collection` (library / timeline / threats / catalog) (closes 982 orphans).
- **Classical algorithms excluded from trust scoring** — RSA, ECDH, ECDSA, Ed25519/Ed448 etc. are migration sources, not trust subjects (closes 15 algorithm orphans).
- **49 missing PQC algorithm variants added** to the transitions data — BIKE, SLH-DSA fast variants, more Classic-McEliece, SMAUG-T, NTRU+, Aigis, HAETAE, AIMer, MAYO, HAWK, LMS/XMSS, ML-DSA hybrids (closes 49 algorithm orphans).

### Fixed

- **Timeline event titles no longer get truncated to 50 characters** by `scripts/download-timeline.js`. The hard truncation had been propagating into manifest labels → enrichment refIds → corpus chunks, orphaning 19 records.
- **Trusted-source cross-reference deduplication** — removed 3 duplicate `(resource, source)` tuples that were inflating the source-credibility dimension's density bonus.
- **3 cached library documents re-fetched** so every chunk's `prov.source_doc` resolves.

### Behind the scenes

- **Corpus invariant CI gate** — `src/__tests__/corpus-trust-invariants.test.ts` (7 tests) pins tier coverage, PROV-DM chain integrity, and freshness across the ~10,800-chunk corpus. Thresholds are monotone-decreasing so regressions fail closed.
- **C1–C10 acceptance contract** — 79 new Vitest contract tests plus 4 Playwright E2E specs (`trust-tier-filter`, `timeline-freshness-badge`, `cmdk-trust-order`, `chat-citation-tier`) validate the trust-engine acceptance layer end-to-end under Chromium.
- ESLint config extended to lint `scripts/**` cleanly without per-file env directives.

## [3.9.0] - 2026-05-10

### Highlights

- **"Leaders" is now called "Community"** across the whole site — main nav, breadcrumb, embed layout, route presets, and the About page.
- **Clicking a community member expands their detail inline** instead of opening a modal popover. Same on both card and table views, with a clear chevron toggle.
- **Behind-the-scenes data quality improved** — 10 more validator warnings cleared (from 31 down to 21), 9 more library documents enriched, and the trusted-source map refreshed against the latest IETF downloads.

### Community page (formerly Leaders)

- Renamed across **all UI surfaces**: main navigation, breadcrumb, embed layout, route presets, About page discussion panel.
- **Inline expand/collapse on Community detail** — both card view and table view share the same expansion pattern (chevron toggle, `aria-expanded`). Closing the previous detached modal popover.
- **Deprecated rows hidden from listings** — the loader now filters by `status === 'active'` (matching the DS-series self-containment schema introduced in 3.8.0), so retired entries are preserved in the CSV but no longer visible in the UI.

_Internal detail: new `LeaderDetailSection` component replaces `LeaderDetailPopover`; `leadersData.ts` filters by `status`; latest data file is `leaders_05102026.csv`._

### Data quality cleanup

- **9 more library documents enriched** via Ollama — coverage 571 / 787 (72.6%, up from 562 / 787).
- **Validator warnings: 31 → 21** across six checks:
  - 2 completed timeline events gained `trusted_source_id` (CISA PQC Products, PKI Consortium).
  - Algorithm canonicalisation refined — ECC → Classical, Hybrid Auth / Framework → Hybrid PQC, SSH / PSK / all-transition added to the skip list.
  - 41 invalid `Relevant PQC Today Features` tokens fixed across library / timeline / threats enrichments.
  - 5 missing trusted sources added (McKinsey, Ponemon, AppViewX, Gartner, Venafi).
  - 6 local files that failed quality checks had their `local_file` cleared (EU HTML stubs, APRA / OpenSSL / ref-joseph library entries, AUTO-002 threat).
  - 64 records gained a `related_standards` citation column across compliance / timeline / threats CSVs.
- **Trusted-source map refreshed** against the latest IETF library downloads — 275 sources, 467 documents, 2,163 cross-reference rows.

_Internal detail: validator codes touched — CM-T-01, GC-3, N23-E, CM-ORPHAN, N22, MR-1. Data files — `trusted_sources_05102026.csv`, `trusted_source_xref_05102026.csv`. Algorithm rows from the prior xref carried forward unchanged._

## [3.8.0] - 2026-05-10

### Highlights

- **Records can no longer silently disappear from the data files.** Until this release, regenerating any CSV from scratch (which several enrichment scripts did) could lose rows that lived only in the previous version. Going forward, obsolete rows are marked `deprecated` instead of being deleted, and they're carried forward to every new file so the latest version is always self-sufficient. This closes a silent-data-loss risk that had quietly dropped **1,270 records** across the corpus.
- **318 records restored or formally preserved** across Library (80), Compliance frameworks (7), Vendors (1), Threats × Industries (3), Community (146 preserved as deprecated), and Product Catalog (81 preserved as deprecated).
- **CI now refuses pull requests that would silently drop records.** New `promote-cowork.ts --force-drop` flag is required if you ever do need to delete something deliberately.
- **8 new validator gates** monitor data self-containment + the controlled vocabularies used by persona filters.

### Data self-containment guarantee

- **Three new columns** on every record-bearing CSV in `src/data/`: `status` (active / deprecated / obsolete), `deprecated_at` (ISO date), `deprecated_reason` (human-readable).
- **Rows are never deleted.** When a record is no longer relevant, it's marked `deprecated` and stays in the file. The UI loaders hide it; the data files keep it.
- **Loader helpers**: `src/data/loaderUtils.ts` exports `filterActive()` and `partitionByStatus()`. Backwards-compatible — rows without the `status` column are treated as active.
- **Eight new validators in CI** — CSV self-containment, MD-enrichment self-containment, collision-aware status checks, four controlled-vocabulary gates (countries, industries, region-scope, threat-industries, roles), and a trust-path orphan check.
- **All eight ship as WARNING.** A staged `DS_SEVERITY=ERROR` environment variable will flip them to hard fails in CI once the residual count is acceptable.

_Internal detail: spec at `pqctoday-priv/docs/platform/data/csv-status-schema.md`; CSV management protocol updated in `CSVmaintenance.md §11`. Validator gates live in `scripts/validators/self-containment-checks.ts` and are wired through `scripts/validate-data-integrity.ts`._

### Writer-side protections (eight scripts)

Eight data-writing scripts have been updated so they can never silently drop records:

- **Enrichment writers** (`enrich-docs-ollama.py`, `enrich-compliance-cswp39-tags.py`, `apply-extraction-to-catalog.py`) — non-empty-wins merge, plus an explicit warning when an input has fewer rows than the previous version.
- **Cross-reference generators** (`match_certifications.py`, `generate-cpe-xref.py`, `generate-purl-xref.py`) — upsert preserves dropped rows as `deprecated_at=today, deprecated_reason='not in regen'`.
- **Promotion script** (`promote-cowork.ts`) — refuses to drop records present in production but absent from cowork unless you pass `--force-drop`. Closes the deletion-audit gap.

### Tooling + execution

- **Generic backfill tool** (`scripts/backfill-csv-self-containment.py`) — detects status-column collisions (e.g. the algorithm reference CSV's existing `status` column for standardisation vocab) and falls back to `lifecycle_status`. Includes a re-normalise hook that updates trust tiers and vocab tags after backfill.
- **Phase 3 orchestrator** (`scripts/queue-phase3.sh`) — runs the full backfill → re-enrichment → corpus regen → validator sweep as one atomic step.
- **Enrichment merger** (`scripts/merge-enrichment.py --in-place --all`) folds scattered enrichment markdowns into one self-contained latest file per family.
- **80 restored library records re-enriched** (qwen3.6:27b + nomic-embed-text pre-filter) in 41 min.
- **RAG corpus regenerated** to 10,704 chunks. Both `revisions.jsonl` and `rag-corpus.json` re-signed with the production ML-DSA-65 attestation key (kid `11b723084d047b4c`). End-to-end trust path complete: chunk → `was_attributed_to` → `trusted_sources` → `trust_tier` → tier multiplier.

### Restored data

| Family                           | Restored                      | Notes                                                                                                       |
| -------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Library                          | 80 records                    | e.g. ANSSI-PQC-Position-2022, 3GPP TS 33.501 Rel-19, FIPS-207-HQC, NSA-QKD-Advisory-2023, ISO-IEC-23837-1/2 |
| Compliance frameworks            | 7 frameworks                  | e.g. AU-MALABO, EUCC-V2                                                                                     |
| Vendors                          | 1 row                         |                                                                                                             |
| Quantum threats × HSM industries | 3 rows                        |                                                                                                             |
| Community (Leaders)              | 146 preserved as `deprecated` | reason: 2026-03-13 leaders policy filter                                                                    |
| PQC product catalog              | 81 preserved as `deprecated`  | reason: catalog refactor pre-2026-05                                                                        |
| **Total**                        | **318 records**               | across 6 families; the status columns now exist on 10 families                                              |

### Validator score-card (start → end)

| Check                      | Before | After | Result                         |
| -------------------------- | -----: | ----: | ------------------------------ |
| CSV self-containment       |    638 |   225 | −65%                           |
| MD self-containment        |    632 |    52 | −91%                           |
| Controlled-vocab tags (×5) |    238 |     0 | ✓ PASS                         |
| Status-column collisions   |      — |     0 | ✓ PASS (10 families managed)   |
| Trust-path orphans         |      — |  1.5% | well under 10% abort threshold |

### Housekeeping

- 21 CSVs and 51 enrichment MDs archived to `src/data/archive/` and `src/data/doc-enrichments/archive/` (the "keep 2 versions" rule from `CSVmaintenance.md`). Safe to archive because each latest file is now independently self-sufficient.

_Internal detail: 22-task implementation plan + tracker + schema spec at `pqctoday-priv/docs/platform/data/data-self-containment-implementation-{plan,tracker}.md` and `csv-status-schema.md`._

## [3.7.0] - 2026-05-09

### Added

#### Trust Engine — Plans 08–12 (IR 8477 trust paths, claims evidence, UI trust layer, persona filtering, OSCAL)

- **Trust path traversal** (`src/utils/trustPathTraversal.ts`) — graph walk over
  `concept_xwalks_*.csv` IR 8477 edges, producing `DerivedResult[]` with
  per-hop `TrustPath` objects. Confidence propagation formula:
  `sourceTierScore × relationshipMultiplier × (edgeConfidence / 100)`.
  Traversal is persona-aware: relationship-type allowlists, per-persona
  confidence thresholds, max derived-result caps, and optional 2-hop for
  researcher persona. `not_related` edges are always excluded.

- **`useApplicabilityWithPaths` hook** (`src/hooks/useApplicabilityWithPaths.ts`)
  — wraps the existing `useApplicability` hook, calls `traverseXwalkPaths`,
  and returns `{ directResults, derivedResults }`. Consumed by
  `ApplicabilityPanel` and `ExecutiveTimelineView`, replacing the bare
  `useApplicability` call.

- **`TrustPathPopover` component** (`src/components/Compliance/TrustPathPopover.tsx`)
  — "Why shown?" ghost-icon trigger that opens a `.glass-panel` popover
  displaying source standard → relationship type → derived standard, evidence
  quote, reviewer, review date, and colour-coded confidence score
  (`text-status-success` ≥70, `text-status-warning` 40–69,
  `text-status-error` <40). Wired into `ApplicabilityPanel` and
  `ExecutiveTimelineView` derived-result sections.

- **`derived` tier in `ApplicabilityTier`** — sixth tier appended after
  `advisory`; renders after direct-match tiers in all persona lenses.
  `ApplicabilityResult` gains an optional `trustPath?: TrustPath` field.

- **Per-persona `trustPathConfig`** in `applicabilityLens.ts` — each persona
  lens declares `allowedRelationships`, `confidenceThreshold`,
  `maxDerivedResults`, and `twoHopEnabled`. Executive: subset_of /
  superset_of / equivalent only, cap 5. Developer/architect/ops: all
  relationship types, varying caps. Researcher: all types, 2-hop, cap 25.

- **Timeline claims evidence** (`src/components/Timeline/TimelineEvidenceBadge.tsx`,
  `scripts/backfill-timeline-confidence.ts`) — evidence badge on timeline
  events surfacing the `confidence_score` from the timeline CSV.
  `confidence_score` column added to `timeline_05092026.csv`. Badge uses
  status-colour tokens (green ≥80, amber 50–79, red <50).

- **UI trust layer — revision signals** (`src/components/ui/CitationTierChip.tsx`,
  `RevisionDrilldownPanel.tsx`, `ReviewedBadge.tsx`, `GlobalRevisionsFeed.tsx`,
  `ContentUpdatesFeed.tsx`, `src/hooks/useRevisions.ts`) — per-record
  `CitationTierChip` shows authoritative / core / supporting / contextual tier
  from `trusted_source_id`. `ReviewedBadge` surfaces latest reviewer +
  verified date from `revisions.jsonl`. `RevisionDrilldownPanel` shows full
  revision history for a resource. `GlobalRevisionsFeed` and
  `ContentUpdatesFeed` list recent changes site-wide. `/revisions` route
  registered in `App.tsx`.

- **Vocab normalization — Plan 11** (`src/data/pqc-vocab-overlay.json`,
  `scripts/normalize-vocab-tags.py`) — deterministic ISO 3166-1 alpha-2 /
  NAICS 2-digit / NICE role-code normalization. `countries` and `industries`
  columns in `compliance_05092026.csv` fully normalized to controlled
  vocabulary. `region_scope` in `library_05092026_r2.csv` normalized.
  `applicable_roles` in 79 `module-qa/*.csv` files normalized to
  `PQC-ROLE-*` codes. `pqc-vocab-overlay.json` documents all PQC-specific
  overlay codes (`PQC-REGION-*`, `PQC-SECTOR-*`, `PQC-ROLE-*`).

- **Faceted filter components** (`src/components/common/GeoFilter.tsx`,
  `SectorFilter.tsx`, `RoleFilter.tsx`) — ISO 3166 country multi-select,
  NAICS group multi-select, and NICE work-role filter. All URL-persisted.
  Wired into Library, Compliance, Migrate, and Learn views.

- **OSCAL assessment-results export** (`scripts/generate-oscal.ts`,
  `public/data/pqctoday-oscal.json`, `public/data/pqctoday-cbom.json`) —
  generates SP 800-53A assessment-results OSCAL JSON from compliance CSV
  and xwalk edges; generates a CycloneDX CBOM (Cryptography Bill of
  Materials) from the algorithm and migrate CSVs. Both artifacts are
  served at `/data/pqctoday-oscal.json` and `/data/pqctoday-cbom.json`.

- **CM-G and CM-E validator gates** in `scripts/validators/trust-engine-checks.ts`
  — CM-G checks that ≥80% of compliance/library records carry controlled-vocab
  `countries`/`industries` tags; CM-E checks that ≥80% carry a
  `confidence_score`. Both gate on Plan 11 normalization state and emit
  WARNING until DS17 promotes them to ERROR.

#### Data self-containment — Phase 1 foundations (DS01–DS04, DS09–DS13, DS18–DS20)

- **Status-column schema** (DS01) — `csv-status-schema.md` (in priv) defines
  the `status` / `deprecated_at` / `deprecated_reason` column trio. Default
  `active`; backwards-compatible: rows without the column treated as active.
  Rows are never deleted — obsolete rows are marked `status='deprecated'`.

- **`loaderUtils.ts`** (DS02, `src/data/loaderUtils.ts`) — three shared
  helpers: `filterActive<T>(rows)` (production view, drops deprecated),
  `partitionByStatus<T>(rows)` (audit view, returns both buckets),
  `isDeprecated(row)` (convenience check). Demonstrated in `vendorData.ts`
  (Vendor type gains `status`, `deprecatedAt`, `deprecatedReason`). Other
  13 loaders pick up the pattern during DS14 per-family backfill.

- **CM-SC + CM-SC-MD validators** (DS03) — `self-containment-checks.ts`
  detects records present in an older CSV version but absent from the latest
  (638 CSV-row findings, 632 MD-file findings — all WARNING until DS17).
  CM-STATUS validates that any row with a `status` column uses only
  `active` / `deprecated` values.

- **CM-VT-\* vocab-tag validators** (DS19) — six checks: CM-VT-COUNTRIES,
  CM-VT-INDUSTRIES, CM-VT-REGION-SCOPE, CM-VT-THREAT-INDUSTRY, CM-VT-ROLES,
  CM-STATUS. All wired into `validate-data-integrity.ts`. Current baseline:
  countries/industries/threat-industry pass; region-scope 2 G7 findings;
  roles 232 `legal` alias findings.

- **CM-ORPHAN trust-path pre-flight** (DS20) — walks every CSV family with
  status+deprecated columns and a `trusted_source_id` column; flags rows
  whose `trusted_source_id` doesn't resolve to an active trusted source.
  Severity ERROR if orphan rate >10%, else WARNING. Currently passes.

- **`promote-cowork.ts` deletion audit** (DS09) — script refuses to silently
  drop records present in production but absent from the cowork directory
  unless `--force-drop` is passed explicitly; guides SMEs toward
  `status='deprecated'` instead.

- **`backfill-csv-self-containment.py`** (DS13) — generic dry-run + write
  backfill tool; per-record manifest support; `--deprecate-restored`
  bulk-mark; ID-column hints for 27 CSV families. Post-run re-normalize
  hook via `run_normalizers()` (DS18).

#### IR 8477 xwalk — r1 (916 edges)

- **`concept_xwalks_05092026_r1.csv`** — 916 SME-reviewed edges (864
  `intersects_with`, 21 `subset_of`, 14 `superset_of`, 13 `equivalent`);
  5 `not_related` edges removed from earlier draft. Confidence: 373 high,
  126 medium, 21 low. Covers CSWP 39 → FIPS 203/204/205, SP 800-131A,
  RFC 9629, and broad inter-algorithm relationships across the full PQC
  corpus.

### Fixed

- **SLH-DSA recall regression in golden-queries** — corpus growth to 10 360
  chunks diluted SLH-DSA IDF scores; `algo-slh-dsa-*` chunks were never
  indexed under the `"slh-dsa"` entity key because the baseName regex
  (`/-\d+.*$/`) stripped `-128s` leaving `"slh-dsa-sha2"`. Two fixes:
  (1) `UnifiedSearchService.indexEntity()` now pushes a 2-component root
  alias (`"slh-dsa"`) for all algorithm source chunks with ≥3 hyphen
  components; (2) `RetrievalService.search()` adds an algorithm-family
  guarantee for `comparison` intent queries — ensures at least one
  `algo-{family}` chunk per explicitly named family reaches the context
  window, mirroring the existing library and timeline guarantees.

- **`useChatSend` test failures after trust-engine refusal gate** —
  `buildTrustRefusal` added to `useChatSend.ts` in Plan 10 was absent from
  the Vitest `@/services/chat/RetrievalService` mock, causing a
  `TypeError` before streaming that made 6 tests fail silently. Mock
  updated: `buildTrustRefusal: vi.fn().mockReturnValue(null)`.

## [3.6.0] - 2026-05-07

### Added

- **Dataset 05062026 promotion** — 23 enriched CSVs replace their predecessors
  across all data modules. Every record now carries tier-classified provenance
  (`trusted_source_id`, `trusted_source_id_status`), URL quality flags
  (`*_url_quality`: `reachable_200` / `redirect_3xx` / `paywall_heuristic` /
  etc.), ISO-formatted dates alongside human-readable labels, and
  `data_quality_notes`. Key additions per module:
  - **Leaders** — `KeyResourceUrls` is now plural (`;`-split multi-link) +
    `KeyResourceRefs` mapping each URL to an authoritative source ID.
  - **Algorithms transitions** — `Deprecation_Date_ISO` / `Standardization_Date_ISO`
    added for machine sorting while display labels remain human-readable.
  - **Algorithm reference** — `status_url_quality` flag; column names migrated to
    snake_case; `signature_ciphertext_bytes` / `sign_encaps_cycles_relative` renamed
    for schema consistency.
  - **Vendors** — `lei_coverage_flag` + `website_url_quality` + `gleif_url_quality`
    for LEI/GLEIF verification status.
  - **Trusted sources** — new `trusted_source_xref` cross-reference table linking
    source IDs to every CSV that cites them.
  - **OpenSSL docs map** — extended from 2 columns (`command`, `doc_file`) to 6
    (`+openssl_version`, `doc_url`, `pqc_relevant`, `date_stamp`); loader updated
    accordingly.
  - **Implementation attacks** — two new tables
    (`pqc_implementation_attacks_05062026.csv` and
    `algorithms_implementation_attacks_table_05062026.csv`) cataloguing per-algorithm
    side-channel, fault-injection, RNG, secret-handling, API-misuse risk with IACR
    citations and mitigation notes. Served by new `implementationAttacksData.ts`
    loader + `ImplementationAttacks` type + Vitest unit tests.
  - **URL validation gate** — 1 566 URLs probed (HEAD requests + browser-UA
    pass-2 for 117 anti-bot URLs); 94 broken URLs patched in proposed CSVs
    before promotion.
  - **Reference document download** — 35 new documents added to
    `public/library/`, `public/threats/`, and `public/timeline/` archives;
    manifests and skip-lists updated.
  - **`UrlQualityBadge` component** — semantic-token badge keyed off
    `*_url_quality` enum values; used in leaders, library, threat, and vendor
    views.
- **Migrate — click-to-detail on product tiles** — clicking any `SoftwareCard`
  in the grid opens the `ProductExtractionModal` with full enrichment data.
  All internal interactive elements (bookmark, hide, compare, repo link,
  UpdateProduct, Ask) stop propagation so inner actions still work.
  (`SoftwareCard.tsx`, `SoftwareCardGrid.tsx`, `MigrateView.tsx`)
- **Compliance — click-to-detail on landscape tiles** — clicking any framework
  card in the Landscape tab opens `FrameworkDetailPopover` directly. Cards
  gain `role="button"` + `tabIndex` + `onKeyDown` for full keyboard access.
  (`ComplianceLandscape.tsx`, `LandscapeTab.tsx`, `ComplianceView.tsx`)
- **Compliance detail pane — CSWP.39 maturity requirements** — when a
  framework has linked library refs that map to CSWP.39 governance data, the
  `FrameworkDetailPopover` now shows a "CSWP.39 Maturity Requirements" section
  listing each requirement with pillar badge, tier, asset class, requirement
  text, and evidence location. (`FrameworkDetailPopover.tsx`)
- **Business Center — `LearningFrameBanner` replaces WIP warning** — the
  "Work in progress" amber banner is replaced by a `LearningFrameBanner` that
  names the Command Center as a _Worked example_ organised around NIST CSWP.39
  Fig 3. First-time learners now see what kind of artefact the page is (a
  reference program, not a workspace they're already behind on). Banner shows
  the persona-derived density label (`Basic` / `Intermediate` / `Advanced`).
  (`BusinessCenterView.tsx`, `LearningFrameBanner.tsx`)
- **Business Center — persona-aware density system** — new `lib/density.ts`
  derives a `Density` value (`basic` / `intermediate` / `advanced`) from the
  active persona + experience level (`executive`/`curious` → basic,
  `ops`/`architect` → intermediate, `developer`/`researcher` → advanced;
  `experienceLevel` from the persona store overrides the persona default).
  Density gates: CSWP-tier badges and §-ref chips in zone panels
  (`showAdvancedZoneMetadata`), sub-element grouping (`showSubElementGroups`),
  per-zone wires (`showZoneWires`), and action-item cap
  (`actionItemCap`: 3 / 4 / 5). At `basic` density the default open zone
  anchors to Assets (`BASIC_DENSITY_DEFAULT_ZONE`) instead of the
  persona-derived zone. (`lib/density.ts`, `BusinessCenterView.tsx`,
  `CSWP39ZonePanel.tsx`, `ActionItemsSection.tsx`)
- **Business Center — action items cap + personalisation copy** —
  `ActionItemsSection` accepts a `cap` prop (driven by density) that limits
  items rendered above the fold. When items are hidden a `+N more` hint
  appears directing the user to switch to developer or researcher persona. Title
  changed to "Your next steps"; subtitle "Personalised to your industry, persona,
  and assessment so far." added. (`ActionItemsSection.tsx`)
- **Compliance — `LearningFrameBanner` + `GlossaryStrip`** — a small
  `LearningFrameBanner` (persona-aware density label, "Reference Catalog"
  framing) appears at the top of the Compliance page. Below it a `GlossaryStrip`
  renders four always-visible chips — Body · Standard · Certification ·
  Regulation — with colour swatches that match the `LandscapeTypeFacet`, so the
  facet doubles as a legend. (`LearningFrameBanner.tsx`,
  `GlossaryStrip.tsx`, `ComplianceView.tsx`)
- **Compliance — unified Landscape tab** — the four legacy desktop tabs
  (Standards / Technical / Certification / Compliance) are merged into a single
  "Landscape" tab backed by a `LandscapeTypeFacet` type selector. Old `?tab=`
  deep links (`standards`, `technical`, `certification`, `compliance`) remain
  backward-compatible: they resolve to the appropriate facet value on load. The
  CSWP.39 cross-walk jump sets the facet instead of swapping tabs.
  (`LandscapeTab.tsx`, `LandscapeTypeFacet.tsx`, `ComplianceView.tsx`)
- **8 new learn module workshop steps** — interactive steps added across eight
  modules, each with a colocated math/engine utility and unit tests where applicable:
  - **ArchQuantumImpact — Step 5 "Strangler Fig"** (`StranglerFigArchitect`):
    model gradual migration of a legacy monolithic service using a PQC API
    Gateway pattern.
  - **CryptoMgmtModernization — Step 9 "CLM Vendor Evaluator"**
    (`CLMVendorEvaluator`): interactive scorecard comparing Venafi, AppViewX, and
    Keyfactor on PQC readiness criteria; mapped to CSWP.39 §5.1 Govern.
  - **IAMPQC — Step 6 "Identity Proxy"** (`IdentityProxySimulator`): simulate
    translating PQC SAML assertions to classical RSA for legacy identity-unaware
    applications.
  - **IoTOT — Step 6 "Hardware Constraints"** (`HardwareConstraintsSimulator`):
    simulate Secure Boot RAM load latency under ML-DSA and Automotive V2X
    Broadcast Storm overhead.
  - **NetworkSecurityPQC — Step 6 "Network Telemetry"**
    (`NetworkTelemetryAnalyzer`): analyze PQC certificate and handshake payload
    sizes against TCP `initcwnd` constraints and model fragmentation latency.
  - **AISecurityPQC — Step 8 "VRAM Sizing Guide"** (`VRAMSizingCalculator`,
    `aiVramMath.ts`): model GPU VRAM overhead of terminating large PQC
    cryptographic payloads at high-concurrency LLM inference endpoints; supports
    NVIDIA L4 / A10G / A100 GPU profiles, Llama 3 8B and 70B model weights, and
    classical / hybrid / pure-PQC crypto payload profiles.
  - **EnergyUtilities — Step 6 "RF Mesh Simulator"** (`RFMeshSimulator`,
    `rfMeshMath.ts`): model Time-on-Air and network saturation of 900 MHz
    Wi-SUN smart meter mesh networks under PQC payload loads; compares daily
    meter-read and firmware-update payloads for classical ECDSA vs pure-PQC
    ML-DSA-87; surfaces mesh-collapse risk when ToA exceeds the 24 h reporting
    window.
  - **KmsPqc — Step 6 "AWS Policy Lab"** (`AwsKmsPolicyLab`,
    `kmsPolicyEngine.ts`): write and validate an AWS KMS Key Policy JSON that
    enforces Hybrid PQC TLS connections via `aws:tlsCipherSuites`; policy engine
    checks for a Deny statement, correct action coverage, and a `_PQ`
    cipher-suite condition.
- **`pqctoday-tpm` listed in About SBOM** — added to the Cryptography & PQC
  section alongside softhsmv3, with link to the public repo
  (`pqctoday-org/pqctoday-tpm`), BSD-3-Clause license, version v0.3.0, and
  description noting TCG V1.85 PQC support (ML-KEM-768 + ML-DSA-65 command
  codes 0x1a3–0x1aa, Emscripten WASM build, fork of swtpm + libtpms).
  (`SbomSection.tsx`)
- **New `compliance-checklist` artifact builder** — net-new
  `ComplianceChecklistBuilderStandalone` builds one checklist section
  per starred framework on `/compliance`, pre-checks the
  "Identified PQC dependency" item for frameworks that the assessment
  flagged as `requiresPQC`, and pre-fills industry/country/deadline per
  framework. Wired into `businessToolsRegistry`,
  `businessToolComponents`, `cswp39StepMapping` (orphan entry removed),
  and the registry drift-guard test allowlist. Closes the long-standing
  "🚫 no builder mapped" gap.
  (`ComplianceChecklistBuilderStandalone.tsx`,
  `businessToolsRegistry.tsx`, `businessToolComponents.tsx`,
  `lib/cswp39StepMapping.ts`, `businessToolsRegistry.test.ts`)
- **5 new FAQ entries** spanning algorithm selection, hash-based signatures,
  hardware, regional timelines, and payments compliance: "When should I use
  ML-KEM vs ML-DSA vs SLH-DSA?", "What are LMS and XMSS, and how do they
  differ from SLH-DSA?", "What is the difference between physical and logical
  qubits?", "What PQC timelines exist for Japan, Singapore, and Australia?",
  "What does PCI DSS 4.0 require for PQC?". (`FAQ/faqData.ts`)
- **Vendor PQC roadmap pipeline** — end-to-end pipeline from discovery to
  in-app display:
  - **CSV** (`migrate_vendor_roadmap_05072026.csv`): 50 vendors with
    `roadmap_url`, `coverage_notes`, and `roadmap_title`; 32 have confirmed
    public roadmap URLs covering AWS, Azure, Google, Apple, Cisco, Palo Alto,
    CrowdStrike, Cloudflare, Okta, HashiCorp, IBM, and others.
  - **Download script** (`scripts/download-vendor-roadmaps.js`): follows the
    same pattern as `download-library.js`; downloads each roadmap page to
    `public/vendor-roadmaps/{vendor_id}_{safe_name}.html`, writes
    `manifest.json` + `skip-list.json`. 26 pages archived locally.
    Added `download:vendor-roadmaps` and `download:vendor-roadmaps:dry` npm
    scripts.
  - **Enrichment** (`scripts/enrich-vendor-roadmaps-ollama.py`, gitignored):
    feeds each downloaded page through `qwen3.6:27b` to extract PQC algorithms
    announced, target migration dates, products/services covered, compliance
    frameworks cited, hybrid mode support, GA status, customer action required,
    and key commitment quotes. Outputs
    `src/data/doc-enrichments/vendor_roadmap_enrichments_05072026.md`
    (25 HIGH/MEDIUM entries).
  - **Loader** (`src/data/vendorRoadmapEnrichmentData.ts`): `import.meta.glob`
    auto-discovers all `vendor_roadmap_enrichments_*.md` files; parser extracts
    structured fields and builds a `vendor_id → VendorRoadmapEnrichment` map.
  - **UI** (`VendorRoadmapPanel.tsx`): rendered inside the `SoftwareTable`
    expanded row when a vendor has a roadmap entry; shows PQC algorithms as
    mono-font chips, target dates, hybrid mode support, compliance frameworks,
    and the first key quote with a GA status chip (GA / Preview / Beta /
    Planned). External link opens the source roadmap page.
  - **Filter** (`MigrateView.tsx`): "Has PQC Roadmap" toggle in both desktop
    `FilterDrawer` and mobile `MobileFilterDrawer` filter panels; active count
    increments correctly.

### Fixed

- **SourcesModal crash on new `source_type` values** — the groups initializer
  only pre-declared three fixed keys; new values in the 05062026 authoritative
  sources CSV caused a `Cannot read properties of undefined (reading 'push')`
  crash. Fixed with a dynamic `if (!groups[key]) groups[key] = []` guard.
  (`SourcesModal.tsx`)
- **Algorithm transition dates displayed in ISO format** — `Deprecation_Date_ISO`
  had priority over `Deprecation_Date_Label` in the loader, so "2030-01-01"
  was shown instead of "2030 (Deprecated) / 2035 (Disallowed)". Priority swapped
  so the human label always wins. (`algorithmsData.ts`)
- **Golden-queries Recall@15 regression after corpus growth** — corpus grew from
  9 929 to 10 068 chunks after promotion, pushing `assessment-guide` entries past
  rank 15. Fixed by adding a `+0.15` `categoryBump` for the `assessment-guide`
  category in the corpus generator. (`generate-rag-corpus.ts`)
- **Migrate filter drawer clipped inside sticky toolbar** — `backdrop-blur` on
  the sticky filter bar creates a CSS containing block that confined
  `FilterDrawer` and `MobileFilterDrawer`'s `fixed inset-0` dialog to the
  toolbar's 88 px bounding box instead of the full viewport. Fixed by wrapping
  both drawers in `createPortal(…, document.body)`, the same escape hatch
  already used by `FilterDropdown`. Raised z-index to `z-[120]` so the drawer
  clears the DisclaimerModal (`z-[110]`) and other overlays.
  (`FilterDrawer.tsx`, `MobileFilterDrawer.tsx`)
- **"Has PQC Roadmap" toggle missing from desktop filter** — the toggle was
  wired in the mobile `MobileFilterDrawer` `filterContent` but omitted from the
  desktop `FilterDrawer` `filterContent`. Added the button to the Properties
  section of the desktop filter panel. (`MigrateView.tsx`)
- **Assess quick-mode step count corrected to 8** — `ModeSelector` description
  updated from "6 questions" to "8 questions" and time estimate from "~2 minutes"
  to "~3 minutes" to reflect the two additional steps (`Infra`, `Timeline`)
  already present in `STEP_TITLES_QUICK`. (`AssessView.tsx`, `AssessWizard.tsx`)
- **Command Center crash opening Compliance Timeline artifact under
  `/business#zone-governance`** — `ComplianceGantt`'s phase-legend path looked
  up `phaseColors[phase]` without a fallback and unconditionally read
  `colors.start` / `colors.glow`, throwing "Cannot read properties of undefined
  (reading 'start')" whenever `presentPhases` contained a value not in the
  canonical color map (e.g. legacy CSV phase or a phase added without a
  matching color entry). The cell-rendering path on line 132 already had the
  defensive fallback; ported it to the legend path on line 423. Pre-existing
  bug, surfaced by the user opening the artifact. (`ComplianceGantt.tsx`)
- **PQC 101 phantom "Hands-on 5/5" caption** in generic-overview's
  `p-learn-pqc101` step — the Workshop tab only has 4 hands-on steps but
  the captions claimed 5 with stale labels ("Why Pqc / Whats Changing /
  The Timeline / Who Acts / Next Steps"). Step regenerated from the cue
  generator so captions pull current `WORKSHOP_STEPS` (4) and current
  `LEARN_SECTIONS` labels (5). (`generic-overview_05022026.json`)
- **Executive `p-landing` step referenced removed home-page sections** —
  the prior CTA fix only updated `ROLE_ADAPTATIONS` modal copy; the
  workshop captions still mentioned "four journey sections: Start, My
  Journey, Assess & Report, Keep Up to Date" (which were removed in the
  LandingView refactor). Rewrote tasks, narration, and the first cue to
  describe the current persona-personalised hero CTAs (Start the Journey
  and Open Command Center) and the three OnboardingCTAs panel below
  (Watch Quick Overview, Browse Workshops, Start Your Journey).
  Spotlight + callout cues unchanged — `landing-cta-primary` /
  `landing-cta-secondary` selectors still exist.
  (`executive-basics-finance-and-banking-amer-apac_05022026.json`)
- **Executive Finance & Banking workshop — comprehensive accuracy, completeness,
  and audio review** — full 7-dimension audit of the 44-step US/CA/AU flow;
  all P1/P2/P3 gaps resolved. Key fixes: `prereq-02` "Beginner experience" →
  "Basics proficiency" and caption "three picks" → "four picks"; `au-01`
  narration softened to match ASD ISM-1917 actual requirement (new deployments,
  not a blanket prohibition); `ca-03` Bill C-27 marked as proposed (not enacted);
  `au-02` unconfirmed LATICE date removed; `au-05` unverified ACVP cert number
  removed; 8 empty-cue US/CA region steps (us-02–05, ca-02–05) populated with
  full navigate/spotlight/caption/advance cue sets; `au-05-migrate` replaced
  with `au-05-library` covering ASD ISM December 2024 + NIST FIPS 203/204 +
  NIST IR 8547; `a3-cswp-risk` updated with explicit per-country deadline
  framing (2030 ASD, 2031 CCCS high-priority, 2035 NIST disallow); all 10
  `f-mod-*` narrations enriched with one orientation sentence each; region
  knowledge-checkpoint captions and `/assess` re-entry navigate cues added to
  final step of each region chapter; `exec-quantum-impact` and
  `pqc-risk-management` `estMinutes` bumped 3 → 5; manifest `totalEstMinutes`
  updated 127 → 131 with `stepCountNote` clarifying 44 total / 34 per-region
  path. (`executive-basics-finance-and-banking-amer-apac_05022026.json`,
  `public/workshop/index.json`)
- **TPM PQC Crypto Bridge (Issue #9)** — replaces placeholder byte stubs
  (0xCC/0xDD/0xEE) in the pqctpm WASM with real ML-KEM-768 and ML-DSA-65
  cryptographic operations routed through softhsmv3 Rust WASM via PKCS#11 v3.2.
  Architecture: C `CryptMlKem.c` / `CryptMlDsa.c` EM_JS hooks → `Module._pqcBridge`
  (JS) → softhsmv3. Two new compliance checks added: V185-017 (KEM round-trip —
  `ss_encap === ss_decap` byte-for-byte) and V185-018 (DSA non-trivial — signature
  ≠ placeholder pattern); Phase 10 bridge validation in the compliance runner.
  `TPM2_Decapsulate` now receives the real ciphertext from the preceding
  `TPM2_Encapsulate`, and `TPM2_SignDigest` produces a cryptographically valid
  3309-byte ML-DSA-65 signature verifiable against the AK public key. WASM build
  updated to include EM_JS bridge entry points. (`pqcCryptoBridge.ts`,
  `tpmBridge.ts`, `ComplianceRunner.tsx`, `tpmCommandDefs.ts`,
  `public/wasm/pqctpm.js`, `public/wasm/pqctpm.wasm`)
- **TTS caption interruptions eliminated — generation counter** —
  `window.speechSynthesis.cancel()` synchronously fires the previous
  utterance's `onend`, overwriting `speechEndedAt` and releasing the scheduler
  block before the new caption started speaking. Fixed with a module-level
  `_speechGeneration` counter: incremented before each `cancel()` call so the
  stale `onend` sees a mismatched generation and is ignored.
  (`useWorkshopOverlayStore.ts`)
- **TTS audio still interrupted — `speechSynthesis.speaking` primary guard** —
  `utter.onend` can fire before audio fully drains on some browsers (known Web
  Speech API bug). Added `window.speechSynthesis?.speaking` as the first check
  in the RAF scheduler; if the browser reports speech in progress the scheduler
  breaks regardless of `speechEndedAt`. The 1500 ms buffer remains as a
  secondary guard after `speaking` becomes false. (`WorkshopStepCard.tsx`)
- **TPM Playground full TCG V1.85 PQC compliance** — V185-012 through
  V185-016 now pass (Encapsulate / Decapsulate / SignDigest with correct
  RC, output sizes, and 3309-byte ML-DSA-65 signature). All 16/16 checks
  green. Required: WASM `wasm_platform.c` calling
  `TPMLIB_SetProfile("default-v1")` before `MainInit` to runtime-enable
  PQC command codes 0x1a3–0x1aa; Emscripten stubs for `CryptMlKemEncap` /
  `CryptMlKemDecap` / `CryptMlDsaSign` returning deterministic placeholder
  output (avoiding EVP crashes from fake key material); serializer fixes
  for TPM2_Encapsulate (`TPM_ST_NO_SESSIONS`, no auth area) and
  TPM2_SignDigest (`inScheme=ALG_NULL`, TPM2B size prefix, context+hint
  trailing fields); `MLKEM_CT_SIZES` per-param-set ciphertext lengths;
  CommandBuilder resolves real transient key handle.
- **References tab deduplicated across foundation modules** — every `f-mod-*`
  step repeated the same `select-tab: References` cue, "References — primary
  sources every claim is cited from." caption, and "Note Reference standards"
  task. All three removed from the 9 modules after `f-mod-exec-quantum-impact`;
  the first module keeps them to establish the pattern once.
  (`executive-basics-finance-and-banking-amer-apac_05022026.json`)
- **Assess wizard navigation broken after workshop reset** — `useSeedAssessFromPersona`
  used a one-shot `seededRef`. When the workshop navigated to `/assess?reset=1`
  while `AssessView` was already mounted (same-route navigation doesn't remount),
  `reset()` cleared `industry` but the ref blocked re-seeding. Step 1's
  `canProceed()` returned `false` → Next button disabled → workshop click silently
  dropped. Fixed by replacing the ref guard with reactive deps `[industry,
assessmentStatus]`: the hook re-seeds from persona whenever `industry` is empty,
  covering both fresh mounts and post-reset scenarios.
  (`useSeedAssessFromPersona.ts`)
- **p-assess step: only 6 of 8 wizard steps driven; submit never fired** —
  root cause: `targetMs` caps the RAF cue scheduler at `STEP_DURATION_MS[speed] × 6 = 60 s`
  at normal speed, so any cue with `tMs > 60 000` never fires. The old last click
  was at `tMs = 138 000`. Fixed by compressing all p-assess cues to ≤ 50 s: all
  8 Quick-mode steps (industry → timeline) are navigated, and `assess-submit` fires
  at `tMs = 50 000`. Caption corrected from "six questions" → "eight questions".
  (`executive-basics-finance-and-banking-amer-apac_05022026.json`)
- **p-report step: wrong section order, hidden sections cited, all TOC clicks missed** —
  same 60 s `targetMs` cap: last click was at `tMs = 179 200`, never firing. Sections
  also visited in wrong order (Key Findings before Risk Score) and cited two sections
  explicitly hidden for executive persona (Algorithm Migration) or unpopulated in
  Quick mode (HNDL/HNFL). Rewrote cues to follow actual executive TOC order
  (Risk Score → Key Findings → Executive Summary → Compliance Impact → Recommended
  Actions → Migration Roadmap), compressed all 6 TOC clicks to ≤ 45 s.
  (`executive-basics-finance-and-banking-amer-apac_05022026.json`)
- **Command Center artifact drawer "works only once"** — `generate-artifact` and
  `view-artifact` cues failed on the second artifact per step because the first
  drawer remained open, covering the artifact card list. Added
  `data-workshop-target="artifact-drawer-close"` to the ArtifactDrawer X button;
  both `generate-artifact` and `view-artifact` handlers in the overlay store now
  close any open drawer before calling `retrySelector`.
  (`ArtifactDrawer.tsx`, `useWorkshopOverlayStore.ts`)

### Changed

- **Learn modules — removed stale `content.ts` / `curious-summary-curious.md`
  files** — 14 modules that completed migration to the `rag-summary.md` +
  `index.tsx` pattern had their legacy `content.ts` and
  `curious-summary-curious.md` stubs deleted: EnterpriseKeyMgmt,
  FinancialLedgers, HardwareSecurityModules, HybridCerts, ICSScada,
  IKEEnhancements, IdentityMgmtCerts, LogIntegrity, NetworkProtocols,
  PKCS11PQC, QuantumCloud, QuantumKeyDistribution, QuantumSafeVPN, SecureBoot.
- **Compliance For You tab — inline detail panes for resources** — clicking
  a library doc, threat, timeline event, embedded framework event, or framework
  card in the For You tab now opens the corresponding detail modal in place
  instead of navigating away to `/library`, `/threats`, `/timeline`, or
  `/compliance?framework=…`. Reuses the existing `LibraryDetailPopover`,
  `ThreatDetailDialog`, and `TimelineDocumentDetailPopover` modals. Adds a new
  `FrameworkDetailPopover` showing framework metadata + clickable cross-links
  to referenced library docs and timeline events (each opens its own detail
  modal, replacing the framework one). The user stays on the For You tab
  throughout. Item components (`ThreatItem`, `LibraryDocItem`, `TimelineItem`,
  `FrameworkItem`, plus embedded year/title rows inside `FrameworkDeadlineCard`)
  accept an optional `onSelect` callback — when supplied they render as a
  `<button>`; when absent they keep the existing `<Link>` navigation, so the
  assessment report and command-center summary card are unaffected. Wired for
  both executive (`ExecutiveTimelineView`) and non-executive
  (`ApplicabilityPanel`) personas. (`ComplianceView.tsx`,
  `ApplicabilityPanel.tsx`, `ExecutiveTimelineView.tsx`,
  `FrameworkDeadlineCard.tsx`, `applicability/parts/items.tsx`,
  `FrameworkDetailPopover.tsx`)
- **Country-specific deadline timeline on For You tab** — the top
  `DeadlineTimeline` bar now filters to the resolved country's frameworks
  whenever the For You tab is active and shows a `[Country] deadlines` pill
  next to the title; on every other tab it reverts to the consolidated
  all-frameworks view. Country is resolved through `useApplicability` so the
  URL filter (`?country=…`) wins, falling back to the user's assessment-store
  profile. Optional `label` prop added to `DeadlineTimeline`.
  (`ComplianceView.tsx`, `ComplianceLandscape.tsx`)
- **Command Center artifact pre-fill — full coverage across all 22
  artifacts** — every artifact builder now opens with defaults derived
  from the user's persona, assessment, and starred selections from
  `/compliance`, `/threats`, `/migrate`, and `/timeline`, with a
  `PreFilledBanner` listing the contributing source pages and a Clear
  action. Foundation hook `useExecutiveModuleData` extended with
  `myFrameworks` / `myProductIds` / `myProducts` / `myThreatIds` /
  `myThreats` / `myTimelineCountries` / `myTimelineCountryData` so every
  builder reads cross-page user data through one canonical hook.
  (`useExecutiveModuleData.ts`, all 22 artifact builders under
  `BusinessCenter/adapters/`, `BusinessCenter/tools/`, and
  `PKILearning/modules/*/components/`)
- **`crypto-vulnerability-watch` highlights tracked-algorithm CVEs** —
  CVE rows whose summary mentions any algorithm in your bookmarked
  `/threats` (matched against each threat's `cryptoAtRisk` field) now
  render an amber `TRACKED` badge next to the CVE ID. The cross-page
  link is no longer banner-only; bookmarking a threat for RSA-2048 on
  `/threats` actively flags every RSA CVE in the watch table.
  (`CryptoVulnerabilityWatch.tsx`)
- **`policy-draft` rotation period seeded from `cryptoAgility`** — the
  Maximum Key Rotation Period default now considers crypto agility
  alongside data sensitivity: `hardcoded` → 2 years, `agile` + critical
  data → 90 days. `cryptoAgility` is also surfaced in the seed banner.
  (`PolicyTemplateGenerator.tsx`)
- **`vendor-scorecard` opens roadmap dimension first for heavy
  vendor-dependency** — when the assessment reports
  `vendorDependency === 'heavy-vendor'` the PQC Roadmap dimension is
  pre-expanded so reviewers see roadmap risk first; banner mentions the
  source. (`VendorScorecardBuilder.tsx`)
- **`contract-clause` shows "High vendor exposure" hint above the
  editor** — when `vendorDependency` is `heavy-vendor` or `mixed` an
  amber callout above the clause sections recommends tighter penalty
  caps, audit-rights frequency, and termination triggers; banner
  mentions the source. (`ContractClauseGenerator.tsx`)
- **`supply-chain-matrix` filters industry threats to supply-chain
  scope** — replaces the misleading "industry-specific supply-chain
  threats" tally (which counted every industry threat) with a
  keyword-filtered subset matching `/(supply-chain|vendor|third-party|`
  `sbom|cbom|component|backdoor|firmware|hsm|library)/i` against threat
  description, threatId, and `cryptoAtRisk`.
  (`SupplyChainRiskMatrix.tsx`)
- **Chat assistant Bloch-sphere icon** — the right-panel chat FAB now
  shows the new `ChatBotFlow.gif` Bloch-sphere animation instead of the
  generic Lucide `Bot` icon, and the FAB grew from 14×14 to 24×24 to
  give the animation room to read. Supporting `<QubitIcon>` wrapper
  added for reuse elsewhere in the app. (`RightPanelFAB.tsx`,
  `ui/QubitIcon.tsx`, `public/ChatBotFlow.gif`)

### Data

- **May 4 data accuracy refresh** — full audit of all data sources against
  trusted references. Changes users will see across the app:

  **Timeline** — OpenSSL 3.5.0 (April 2025) added as the milestone when
  ML-KEM, ML-DSA, and SLH-DSA first shipped natively in the world's most
  widely used TLS library. IBM Kookaburra and IBM Quantum Advantage correctly reclassified as
  forward-looking roadmap targets rather than completed milestones. One
  unverified entry removed (NXP/PQShield pilot — cited source did not support
  the claim). Source attribution improved across the full timeline.

  **Threats** — Two new threats added: _AI-assisted cryptanalysis_ (emerging
  ML models that accelerate lattice-reduction attacks, potentially reducing
  security margins of ML-KEM-512 before a quantum computer exists) and _HSM
  key-size incompatibility_ (ML-KEM and ML-DSA keys are far larger than RSA
  keys — legacy HSM firmware buffer limits can block deployment).

  **Library** — OpenSSL 3.5.0 release notes added as a reference document.
  NIST IR 8547 links to its Initial Public Draft (November 2024). FIPS 203, 204, and 205
  publication dates corrected (a data artifact had incorrectly set them to
  April 2026). Seven IETF drafts annotated with current expiry/status. One
  abandoned draft (NTRU Prime SSH, last updated 2022) removed.

  **Migrate** — Android 16 PQC support correctly scoped to Chrome/WebView
  TLS only (platform-level ML-DSA Keystore support is Android 17, which is
  already a separate entry). Thales payShield 10K status changed to Unknown —
  no public PQC roadmap exists for the payment HSM product line. FileVault
  clarified as not a PQC migration target — AES-256-XTS disk encryption is
  already quantum-resistant. Mavenir Cloud RAN flagged as simulation-only.
  OpenSSL 3.5.0 added as a product entry. Hardware category labels
  standardised across all entries.

  **Algorithms** — HQC correctly shows "NIST Round 4 Selection" (not
  "Candidate"). FN-DSA (Falcon) correctly shows "FIPS 206 (Draft)". KpqC
  algorithms correctly show "KpqC Selected" for the Korean standard.

  **Sources panel** — NSA, CISA, BSI, NCSC UK, ANSSI, and ENISA now appear
  in the Sources panel on Timeline, Threats, and Library views (their flags
  were previously left blank despite being primary data contributors).

- **OpenSSL 3.5.0 enriched** — full AI-assisted enrichment added for the
  new OpenSSL 3.5.0 library entry, covering TLS hybrid key exchange, FIPS
  140-3 compliance context, implementation prerequisites, and known security
  patches in the 3.5.x series.
- **Vendor PQC roadmap data** — `migrate_vendor_roadmap_05072026.csv` covers
  50 vendors; 26 roadmap pages downloaded to `public/vendor-roadmaps/`;
  `vendor_roadmap_enrichments_05072026.md` contains 25 HIGH/MEDIUM extractions
  via `qwen3.6:27b`, each capturing algorithms, migration dates, GA status,
  compliance frameworks, and key commitment quotes.
- **Learn module reference and product mappings curated** — a full 53-module
  gap audit was run against the library and product catalogs. Every module's
  mapped references and products were reviewed against the module's actual topic
  scope; off-topic and redundant entries were removed and clearly relevant
  unmapped items were added. Net effect on the two data files:

  _Library_ (`library_05052026.csv`): 176 ref-to-module links removed,
  323 added — modules such as `slh-dsa`, `stateful-signatures`, `qkd`, and
  `entropy-randomness` gained missing foundational standards (FIPS 203/204/205,
  SP 800-208, ETSI QKD specs) while unrelated standards were pruned.

  _Product catalog_ (`pqc_product_catalog_05052026.csv`): 876 product-to-module
  links removed, 300 added — algorithm-specific modules (`ml-kem`, `ml-dsa`,
  `slh-dsa`) no longer surface generic TLS scanners or IAM suites; vertical
  modules (`healthcare-pqc`, `aerospace-pqc`, `emv-payment-pqc`) now surface
  sector-specific products instead of the full catalog.

- **Learn module search powered by topic-scope summaries** — the Learn
  dashboard filter and the PQC Assistant / ⌘K palette now search against
  authoritative per-module scope paragraphs and sub-topic keyword lists
  generated by the gap audit, not just module titles and short descriptions.
  Searching for a term like "Mosca's theorem", "CBOM", "NIST IR 8547", or
  "ACME EST enrollment" now surfaces the correct module even when those
  terms don't appear in the module title. Implemented as 53 new
  `module-topic-summaries` RAG chunks (priority 1.1) plus a `?raw` markdown
  import wired into the dashboard filter predicate. Corpus grows from 12,156
  to 12,209 chunks. (`src/data/module-topic-summaries.md`,
  `moduleTopicSummaries.ts`, `Dashboard.tsx`, `generate-rag-corpus.ts`)
- **RAG search index regenerated** (12,209 chunks) to reflect all data updates.

### Internal

- `npx tsc -b` clean; full vitest suite passes.

## [3.5.64] - May 3, 2026

### Added

- **4 new persona workshop flows** — developer, devops, researcher,
  curious. Curious is a page-tour only flow with no module deep-dives.
  (`public/workshop/{developer,devops,researcher,curious}-*.json`)
- **Executive workshop flow gains 2 modules** — `data-asset-sensitivity`
  and `standards-bodies`. Foundations 44 → 50 min, total 118 → 127 min.
- **Quiz showcase close step** in all 7 workshop flows — ~12 cues each,
  ends at the Start button without running an actual quiz. 7 stable
  `data-workshop-target` selectors added. (`QuizIntro.tsx`,
  `TopicSelector.tsx`)
- **20 PKI Learning module Introductions instrumented** with
  `data-section-id` anchors for deterministic workshop scroll-to cues —
  5 role-guide modules via the shared `RoleIntroduction.tsx`, plus 15
  module-specific Introductions covering 73 sections total.
- **Three new workshop cue kinds** for Command Center artifact
  builders: `generate-artifact`, `view-artifact`, `download-artifact`.
  (`Workshop.ts`, `ArtifactCard.tsx`)
- **6 governance sub-steps** (`a1a-a1f`) replace the single A1 step,
  walking through artifacts in each CSWP §5 sub-element via
  `generate-artifact` cues.
- **TPM playground scenario flow tab** alongside the compliance
  checklist — 6-phase command narrative (TPM init → self-test →
  capability discovery → entropy verification → ML-KEM-768 EK creation →
  ML-DSA-65 AK creation) with live send/recv lines, dynamic byte counts,
  and a TCG V1.85 PQC key hierarchy summary table. (`ComplianceRunner.tsx`)
- **TPM V1.85 compliance suite extended to 16/16**: five new checks
  V185-012 through V185-016 cover `TPM2_Encapsulate` (RC + output sizes:
  ss=32B, ct=1088B per FIPS 203 ML-KEM-768), `TPM2_Decapsulate` (RC +
  shared-secret size), `TPM2_SignDigest` (RC + sigAlg=0x00A1), and
  signature size = 3309B (FIPS 204 ML-DSA-65). Scenario flow tab gains
  Phases 7–9 with dynamic byte counts. (`ComplianceRunner.tsx`)
- **TPM bridge error surfacing** — `getLastTpmErr()` /
  `clearLastTpmErr()` expose `printErr` output from the WASM module so
  the compliance runner can show failure detail. (`tpmBridge.ts`)
- **`useModuleStore.markLearnSectionRead(moduleId, sectionId)`** —
  idempotent set-true setter for scroll-position-driven section
  completion tracking. (`useModuleStore.ts`)
- **Workshop voice "Test Voice" button** next to the On/Off toggle for
  diagnosing browser TTS issues. (`WorkshopPanel.tsx`)

### Changed

- **LearnStepper — sticky TOC + all-DOM render**: 8 PKI Learning
  modules (ComplianceStrategy, PQCBusinessCase, PQCGovernance,
  MigrationProgram, StandardsBodies, StatefulSignatures, SLHDSAModule,
  EmailSigning) used a one-section-at-a-time stepper, which made
  workshop `scroll-to` cues silently fail and broke browser Cmd-F /
  hash-anchor deep-links. Now every section mounts simultaneously
  inside `<section data-section-id="...">` blocks; the numbered-circle
  nav becomes a sticky table-of-contents that smooth-scrolls to
  anchors. `IntersectionObserver` (50% threshold) marks each section
  read as the user scrolls past; "Mark as Read" button kept as manual
  override. (`LearnStepper.tsx`)
- **`LEARN_SECTIONS` registry aligned to rendered DOM** — trimmed
  phantom entries from 7 modules (quantum-threats, hybrid-crypto,
  hsm-pqc, qkd, data-asset-sensitivity, secure-boot-pqc, code-signing)
  plus 4 LearnStepper modules (pqc-business-case, migration-program,
  stateful-signatures, email-signing); relabeled 3 LearnStepper
  modules' sections (compliance-strategy, pqc-governance,
  standards-bodies) to match rendered text. IDs preserved so user
  progress survives. (`moduleData.ts`)
- **Dynamic workshop caption timing** — next caption fires at
  `previous_speech_end + 1.5s` instead of a fixed `2.5 × ttsPace`
  multiplier. Eliminates dead air after short captions and absorbs
  long ones without truncation. Speech estimated at ~14 chars/sec at
  the 0.85 narration rate. (`VideoOverlay.tsx`, `WorkshopStepCard.tsx`)
- **WaveNet / neural voice auto-pick** when no `ttsVoiceURI` is set —
  prefers Google WaveNet, Microsoft Aria/Guy/Davis/Jenny, and Apple
  Premium / Enhanced / Neural / Siri voices over the system default.
  (`WorkshopPanel.tsx`)
- **Workshop cue generator drops `learnTabIsStepper` flag** for the 6
  LearnStepper modules — they now use the standard
  `scroll-to [data-section-id="X"]` cue pattern instead of the fragile
  `click learn-stepper-next` workaround. pqc-101 keeps the flag (its
  PQC101Module has a separate internal stepper). 9 workshop-flow steps
  regenerated across architect / executive / researcher flows.
  (`scripts/generate-module-tour-cues.ts`)
- **"Workshop N/M:" → "Hands-on N/M:"** rename across 212 captions in
  all workshop flows + the cue generator template, clarifies the tab
  boundary (the Workshop tab is now Hands-on).
- **Workshop speed picker → Preview vs Presentation modes**.
  Preview = fixed 5/10/20s per step (captions only, no cue clicks);
  Presentation = cues fire at authored `tMs × multiplier`
  (slow=2x, normal=1x, fast=0.5x). Default is Presentation.
  (`useWorkshopStore.ts`)
- **Workshop persona-driven flow matching** —
  `findAllCompatible(manifest, ctx)` returns every flow whose match
  accepts the persona, sorted most-specific first with the generic
  fallback last. Null persona facets are wildcards. WorkshopPanel grew
  an inner per-flow tab bar in Recommended.
  (`useWorkshopManifest.ts`, `WorkshopPanel.tsx`)
- **Stale `ROLE_ADAPTATIONS` strings** updated to match the current
  `PERSONA_HERO_CTA` map for 5 personas (executive, developer,
  architect, ops, researcher). (`PersonalizationSection.tsx`)
- **Caption-driven section auto-scroll** — when a `caption` cue text
  matches a visible h1/h2/h3 on the current page (multi-candidate
  extraction + scoring), engine smooth-scrolls to the heading.
  Constrained to `<main>` headings first; falls back to all h1-h3.
- **Workshop content cleanup** — Executive flow dedupe (40 → 33 steps,
  142 → 125 min); Generic flow consolidates 34 single-caption per-page
  steps into 19 multi-caption steps (34 → 20 min); About/Timeline/
  Compliance captions aligned to real headings.
- **`CuriousSummaryBanner.tsx`** reorganised (~116 lines).
- **`MainLayout.tsx`** trimmed (-6 lines); **`PageAccuracyFeedback.tsx`**
  removed.
- **WorkshopPrereqList rewritten** — side-by-side "Your: X / Needs: Y"
  rows per axis. Mismatch rows show ⚠ + buttons for Switch persona /
  Pick another flow.
- **Executive flow widened** to `proficiencies: ['basics', 'expert']`.

### Fixed

- **Workshop captions read 1/4 → 2/4 → 3/4 → 4/4 in cue order** — the
  prior `LEARN_SECTIONS` trim preserved cue order while remapping
  labels to the new DOM order, leaving section numbers jumping (1/4 →
  3/4 → 4/4 → 2/4). 6 step instances reordered: `f-mod-hybrid-crypto`
  (architect / developer / researcher), `f-mod-secure-boot-pqc`
  (architect), `f-mod-qkd` (architect / researcher).
- **Stale "Section 3 of 5" caption** in architect
  `f-mod-data-asset-sensitivity` cue 8 — was missed by the prior
  trim's regex (used `of 5` form, not `Section 3/3:`). Now reads
  `"Section 3/3: Risk Methodology (NIST RMF, ISO 27005, FAIR)"`.
- **52 caption rewrites** across architect / developer / devops /
  executive / researcher flows after `LEARN_SECTIONS` trim —
  renumbered N/M denominators, dropped phantom-section captions + their
  preceding `scroll-to` cues, retargeted scroll-to selectors to
  canonical section IDs.
- **One HARD caption mismatch** — `f-mod-exec-quantum-impact` cue 0
  promised "FIPS 203/204" but the module never teaches it; rewritten
  to "CNSA 2.0 deadlines" (whyItMatters + narration + caption).
- **Workshop region scoping** — agenda preview computes minutes from
  the picked region's chapters, not the cross-region
  `flow.totalEstMinutes`.
- **Workshop click cue retry** — `click` / `expand-section` /
  `collapse-section` now retry up to 4×200ms when the target selector
  hasn't rendered yet.
- **Workshop selectTab handles label/value mismatch** (e.g. "Tools &
  Products" / `tools`) via prefix-substring match; retries 4×200ms
  when tabs aren't yet in DOM.
- **Workshop URL deep-link fixes** for /threats, /leaders, /compliance
  — old codes (`industry=FIN`, `country=US`) replaced with values that
  match CSV columns or page-component fallbacks.
- **Workshop slow/fast math fix** — `PRESENTATION_SPEED_MULTIPLIER`
  was inverted; slow now plays 2× authored, fast plays 0.5×.
- **Workshop no-cue step duration cap** — Presentation mode was
  waiting the full `estMinutes` for caption-only intro steps; now
  capped to `STEP_DURATION_MS[speed] × 3` (~30s normal).
- **Workshop persona region propagation** — `pickedRegion` now derived
  from the persona store's `selectedRegion` (americas → US, apac → AU,
  eu → EU) and resets on persona change.
- **Workshop preview mode skips cues entirely** — was firing clicks
  before pages rendered, then the safety advance jumped to the next
  step's URL.
- **Workshop auto-scroll on navigate** — `applyCue` extends with
  `nextCues?` parameter; after a `navigate` cue settles (~700ms),
  auto-scrolls window to top.
- **Command Center bypass when workshop is active** —
  `BusinessCenterView` skips the WelcomeState empty-state when a
  workshop is active so artifact-create cues find their targets even
  on a fresh user.
- **Workshop voice on Chrome** — 10-second `setInterval` keepalive on
  `speechSynthesis.resume()` prevents Chrome's silent 15s idle pause.
  (`WorkshopPanel.tsx`)
- **Workshop voice priming on user gesture** — `setTtsEnabled` setter
  speaks an inaudible priming utterance on the click that turns voice
  on, so the first real caption always plays. (`useWorkshopStore.ts`)
- **Assess wizard auto-walks** — 12 step files instrumented with
  `assess-not-sure`; Wizard Next button gets `assess-next` /
  `assess-submit`. Executive `f7-assess` cue chain clicks Quick mode →
  8 steps × "I'm not sure" → Generate Report.
- **TPM Playground V1.85 compliance** — V185-008 (CreatePrimary
  ML-KEM-768 EK) and V185-010 (ML-DSA-65 AK) were silently returning
  RC=0x00000101 because the `__EMSCRIPTEN__` stubs in
  `CryptMlKemGenerateKey` and `CryptMlDsaGenerateKey` called
  `RAND_bytes()`, which fails under `FILESYSTEM=0` (no `/dev/urandom`).
  Both stubs now use the TPM's own AES-256-CTR DRBG via
  `DRBG_Generate(rand, …)`; fallback path seeds from the key's own
  `d‖z` bytes via `memcpy` expansion. V185-001 through V185-011 pass.
- **TPM V1.85 use-phase commands** (Encapsulate / Decapsulate /
  SignDigest) all returned `TPM_RC_COMMAND_CODE (0x143)` because
  libtpms defaults to the null runtime profile, which excludes V1.85
  command codes 0x1a3–0x1aa. Fixed by calling
  `TPMLIB_SetProfile("{\"Name\":\"default-v1\"}")` before
  `TPMLIB_MainInit()` in `wasm_platform.c`.
- **TPM WASM stubs for use-phase crypto** — `CryptMlKemEncapsulate`,
  `CryptMlKemDecapsulate`, and `CryptMlDsaSign` now have
  `#ifdef __EMSCRIPTEN__` stubs that return deterministic placeholder
  output (0xCC/0xDD/0xEE bytes) of the spec-correct size instead of
  calling EVP APIs that fail on fake key material. (`CryptMlKem.c`,
  `CryptMlDsa.c`)
- **TPM2_Encapsulate wire format** — command was built with
  `TPM_ST_SESSIONS` and an RS_PW auth area; encapsulation is a
  public-key-only operation that requires `TPM_ST_NO_SESSIONS` (no auth
  area, 14-byte command total). Sending an auth session produced
  `0x98b` (`TPM_RCS_HANDLE + TPM_RC_S + TPM_RC_1`). Fixed in
  `tpmSerializer.ts` and `ComplianceRunner.tsx`; response offset
  corrected 14→10 (NO_SESSIONS header is 10B). (`tpmSerializer.ts`,
  `ComplianceRunner.tsx`)
- **TPM2_SignDigest wire format** — `inScheme` was 0x0000 (invalid);
  must be 0x0010 (`TPM_ALG_NULL`). Digest was missing its `TPM2B` size
  prefix. Both fixed; trailing `context.size=0` and `hint.size=0`
  fields added per `SignDigest_fp.h`. (`tpmSerializer.ts`,
  `ComplianceRunner.tsx`)
- **CommandBuilder** no longer gates Encapsulate / Decapsulate /
  SignDigest as unimplemented; `effectiveHandleNum` resolves the actual
  transient key handle from the loaded-object store and passes it to
  `serializeDemoCommand`. (`CommandBuilder.tsx`)
- **TPM SHA-2 hash table wrappers** (`CryptHash.c`) — `HASH_DEF_TEMPLATE`
  stored OpenSSL `SHA256_Init` / `Update` / `Final` (all return `int`)
  in `HASH_METHODS` slots typed `void`. Under
  `EMULATE_FUNCTION_POINTER_CASTS=1` in Emscripten 5.x, return-type
  mismatches still trap via `call_indirect`. Thin `static void` wrapper
  functions (`tpmHashStart_SHA256_w`, etc.) eliminate the mismatch for
  all four hash algorithms used in WASM.
- **TPM `EMULATE_FUNCTION_POINTER_CASTS=1`** added to
  `wasm/CMakeLists.txt` to handle argument-count mismatches in
  remaining indirect calls (ECC, RSA big-num tables).

### Data

- **Patents data refresh** — `patents_04262026_r2`, `patents_05012026`,
  `patents_05022026` replaced with `patents_05022026_r2` +
  `patents_05032026`. PatentDetail and PatentsTable updated for the
  new schema.
- **Infographics regeneration** — ~50 NotebookLM-generated `nllm_*.jpg`
  removed; replaced with `pqcstd_*.png` set generated by the new
  pqctoday-standard pipeline.

### Internal

- **Multi-Session Safety Rules** added to `CLAUDE.md` after a parallel
  session destroyed workshop content via `git reset --hard && git clean
-fd`. Recovery required extracting `Write` tool calls from the
  session transcript at `~/.claude/projects/.../{session-id}.jsonl`.
  Now-mandatory rules: WIP commits early, status-check + confirmation
  handshake before destructive ops, leave unfamiliar files alone.
- **Semantic caption-vs-content audit** covered 446 of 703 module-tour
  captions across all 7 workshop flows. Found 1 HARD mismatch (fixed
  above) + 7 modules with `LEARN_SECTIONS` registry drift (all
  addressed above).
- **Workshop bug-fix wave + artifact-management cues** — 23 commits
  since `c9b184b8` covering URL deep-link fixes, region scoping,
  collapsibles + click cue retry, three new artifact cue kinds, the
  Security Architect flow (`architect-basics-all-all_05032026.json`),
  caption-driven section auto-scroll, `learn-stepper-{prev,next,
complete}` selectors on 14 architect module index files, and
  workshop content cleanup (Executive 40 → 33 steps, Generic 34 → 19).
- `npx tsc -b` clean; `npx vitest run` 2086/2086 pass.

## [3.5.63] - May 2, 2026

Playground UX audit Wave 2A/2B/2C: error UX hardening across workshop tools,
WasmModeIndicator in HSM Key Derivation, isStepComplete gating in all three
blockchain flows, and supporting UX additions (SSH hybrid KEX rationale, Source
Combining FilterDropdown, HD Wallet mnemonic panel, Solana tamper toggle,
Patents full-text search, 5G scenario intro strip, PKI Workshop artifact strip).

### Added

- **Patents — full-text search panel**: `PatentSearchPanel` component uses
  `minisearch` to index all patents by title, assignees, abstract, and PQC
  algorithms. Results appear as cards with algorithm badges and a direct link
  to the patent detail. Keyboard-accessible with `<Input>` and clear button.
  (`PatentSearchPanel.tsx`, `PatentsView.tsx`)

- **5G SUCI — scenario intro strip**: `ScenarioIntroStrip` component renders
  an attacker vs. subscriber perspective toggle (`role="group"`) above the SUCI
  flow, making the scenario context immediately visible without scrolling.
  (`ScenarioIntroStrip.tsx`, `SuciFlow.tsx`)

- **PKI Workshop — artifact summary strip**: `ArtifactSummaryStrip` at the top
  of the workshop surfaces all generated CSRs, CA keys, and certificates as icon
  chips, giving users a persistent view of what they've built across steps.
  (`PKIWorkshop/index.tsx`)

- **HD Wallet — BIP-39 mnemonic word grid**: After Step 0 completes,
  a 24-word mnemonic panel appears with per-word index numbers and a note
  that the final word encodes checksum bits. Conditional on `isStepComplete`.
  (`HDWalletFlow.tsx`)

- **HD Wallet — extractable-key security callout**: After Step 3 completes,
  an `AlertTriangle` callout explains that address derivation required extracting
  the private bytes from the HSM — and why production deployments avoid this.
  (`HDWalletFlow.tsx`)

- **Solana — tamper-signature toggle**: A WCAG-compliant custom checkbox
  (`role="checkbox"`, `aria-checked`, keyboard-navigable) lets users flip one
  signature byte before Step 9, producing a live `❌ INVALID` result to
  demonstrate that even a single-bit change breaks verification. (`SolanaFlow.tsx`)

- **SSH Sim — hybrid KEX rationale callout**: During and after the PQC phase,
  an inline `ShieldCheck` panel explains why `mlkem768x25519-sha256` combines
  X25519 with ML-KEM-768 and what "both algorithms must break" means in practice.
  (`SshSimulationPanel.tsx`)

- **SSH Sim — wire-packets view switcher**: Three-way toggle (list / diagram /
  compare) lets users see packet payloads as a flat list, a visual flow diagram,
  or a side-by-side classical vs. PQC comparison. (`SshSimulationPanel.tsx`)

- **SSH Sim — beginner PKCS#11 mode**: `pkcs11BeginnerMode` toggle (default on)
  hides raw CK handle numbers and replaces them with plain-English operation
  labels. Expert mode reveals all handle IDs. (`SshSimulationPanel.tsx`)

### Fixed

- **VPN Simulator — `translateCryptoError` + `<ErrorAlert>`**: All catch blocks
  in `VpnSimulationPanel.tsx` now route errors through `translateCryptoError()`.
  The top-level error display is upgraded from a bare `<p className="text-xs
text-status-error">` to `<ErrorAlert>` with `role="alert"`. SharedArrayBuffer
  unavailability surfaces as a named inline badge rather than a raw error string.
  (`VpnSimulationPanel.tsx`)

- **Source Combining — `translateCryptoError`**: PKCS#11 error strings from the
  HSM source-combining operations are now routed through `translateCryptoError()`
  before reaching the existing `<ErrorAlert>`. Combination-method selector
  upgraded from a raw `<select>` to `<FilterDropdown>`. (`SourceCombiningDemo.tsx`)

- **SSH Sim — `translateCryptoError` + `<ErrorAlert>`**: Raw error strings in
  the SSH handshake runner replaced with `translateCryptoError()` output;
  the phase-level error display upgraded to `<ErrorAlert>`. (`SshSimulationPanel.tsx`)

- **HSM Key Derivation — `WasmModeIndicator`**: `WasmModeIndicator` added
  beside `LiveHSMToggle` to surface WASM-simulation mode for the SP 800-108
  KDF demo, matching the pattern established in `TokenMigrationLab` and
  `FirmwareSigningMigrator`. (`HSMKeyDerivationDemo.tsx`)

- **Library — staleness badge excludes Expired/Superseded**: `DocumentCard`
  now suppresses the `· verify` staleness badge for documents whose
  `documentStatusBucket` is `Expired` or `Superseded` — they are already
  visually dimmed, so the badge was redundant. (`DocumentCard.tsx`)

### Changed

- **Bitcoin — `isStepComplete` step gating**: `gatedHandleNext` callback
  blocks advancement and surfaces an inline error if the user clicks Next
  before executing the current step. (`BitcoinFlow.tsx`)

- **Solana — `isStepComplete` step gating**: Same `gatedHandleNext` pattern
  as Bitcoin. (`SolanaFlow.tsx`)

- **HD Wallet — `isStepComplete` step gating**: Same `gatedHandleNext` pattern;
  Step 2 action label updated to `'Demonstrate Derivation'`. (`HDWalletFlow.tsx`)

### Internal

- `tsc --noEmit` clean; 2021 unit tests pass.

## [3.5.62] - May 1, 2026

Wave 3 UI audit completion: all P1, P2, and P3 items shipped. Learn module
workshop UX fixes for EntropyTestingDemo, SuciFlow, and MerkleTreeCerts.

### Added

- **OpenSSL Studio — persona cheat sheet strip**: When `developer` persona is
  active, a strip above the workbench shows 6 clickable command shortcuts
  (genpkey / req / x509 / dgst / kem / enc) that switch the active category.
  When `researcher` persona is active, the strip shows quick-jump links to
  ML-KEM, ML-DSA, TLS 1.3, PKCS#12, and X.509 specs in the Library and
  Algorithms pages. (`OpenSSLStudioView.tsx`)

- **Library — citation staleness badge**: Documents with `lastUpdateDate` older
  than 2 years that are still in Active or Draft status show a `· verify`
  warning next to the date in the card. Expired/Superseded/Withdrawn docs are
  excluded (already visually dimmed). (`DocumentCard.tsx`)

- **Assess — "Save link" CTA**: A "Save link" button (Link2 icon) in the wizard
  navigation bar copies `/assess?step=N` to the clipboard with a toast. Wizard
  answers are auto-persisted to localStorage, so the link resumes progress on
  the same device. (`AssessWizard.tsx`)

- **Algorithms — executive "Top 5" shortcut**: A "View Top 5 →" button appears
  in the executive persona hint strip. Clicking it highlights ML-KEM-768,
  ML-DSA-65, SLH-DSA-SHA2-128s, and Falcon-512 in the Detailed tab.
  (`AlgorithmsView.tsx`)

- **Timeline — search auto-scroll**: Each country's first `<tr>` in the Gantt
  gets an `id` attribute. When `filterText` changes and results exist, the first
  matching row scrolls into view with smooth behavior. (`SimpleGanttChart.tsx`)

- **About — deploy timestamp**: `__BUILD_TIMESTAMP__` (injected by Vite at build
  time) shown as a "Deployed: …" sub-line under the version in Release Notes.
  (`ReleaseNotesSection.tsx`)

- **Compliance — cert-records cross-link**: `FrameworkCard` footer now includes
  a "Certs →" chip for frameworks whose `bodyType === 'certification_body'`,
  linking to `/compliance?tab=records&q=<enforcementBody>`. (`ComplianceLandscape.tsx`)

- **Patents — "Explore Related" cross-links**: `PatentDetail` panel gains an
  "Explore Related" section with Algorithms and Library deep-links derived from
  `patent.pqcAlgorithms` and `patent.standardsReferenced`. (`PatentDetail.tsx`)

- **SuciFlow — SUPI input validation**: Live format guard enforces 15-digit
  MCC+MNC+MSIN. An inline error message appears below the field when the value
  is non-empty but not yet 15 digits. (`SuciFlow.tsx`)

- **SuciFlow — Perspective switcher in config panel**: `ScenarioViewSwitcher` now
  appears inline in the configuration panel under a "Perspective" heading, making
  the attacker vs. subscriber toggle discoverable without scrolling to the top.
  (`SuciFlow.tsx`)

- **SuciFlow — HSM/OpenSSL mode indicator**: A status badge below `LiveHSMToggle`
  shows whether the demo is running in PKCS#11/softhsmv3 mode (ShieldCheck,
  success color) or OpenSSL software mode (Shield, muted). (`SuciFlow.tsx`)

- **MerkleTreeCerts — two-stage reset confirmation**: Replaced browser `confirm()`
  with an inline confirmation row ("Reset all steps?" + Yes/Cancel buttons),
  eliminating the native dialog. (`MerkleWorkshopSteps.tsx`)

- **MerkleTreeCerts — step-dependency warning**: When the user navigates to Step 2
  or Step 3 without having built a tree in Step 1, an `AlertTriangle` banner
  prompts them to complete Step 1 first with a direct link. (`MerkleWorkshopSteps.tsx`)

- **MerkleTreeCerts — workshop completion card**: After completing all 5 steps a
  success card ("Workshop complete!") summarises what was covered and links back
  to the theory in the Learn module. (`MerkleWorkshopSteps.tsx`)

- **MerkleTreeCerts — step nav accessibility**: Step navigation buttons gain
  `title` and `aria-label` attributes. (`MerkleWorkshopSteps.tsx`)

- **Entropy Testing — paste-hex error state**: `pasteHexError` state tracks
  malformed paste input and surfaces an inline error message below the test
  results area. (`EntropyTestingDemo.tsx`)

- **Entropy Testing — mode-switch state preservation**: Changed from early-return
  per-mode render to CSS visibility (`block`/`hidden`) so collected samples and
  test results are preserved when switching between "Bit Flip" and "Paste Hex"
  modes without re-generating data. (`EntropyTestingDemo.tsx`)

- **QRNG Demo — live randomization**: Replaced static `QRNG_SAMPLE_64/128`
  constants with `generateSimulatedQrng(bytes)` using `crypto.getRandomValues()`.
  Each page load and sample-size change produces a fresh sample, making the
  entropy visualisation more instructive. (`QRNGDemo.tsx`)

- **Envelope Encryption — per-sub-operation progress labels**: `progressLabel`
  state shows the active sub-operation during execution ("Generating key pair…",
  "Wrapping DEK…", "Encapsulating shared secret…", etc.). Step wizard "Complete &
  Next" is gated on `executedSteps.has(currentStep)` so users must run each
  operation before advancing. Changing the algorithm resets `executedSteps`.
  Flow diagram and artifact table are collapsible panels (ChevronDown animation).
  (`EnvelopeEncryptionDemo.tsx`)

- **Cert Capacity Calculator — relative-size toggle**: A "Relative" toggle above
  the bar chart switches the Y-axis between absolute byte counts and percentages
  relative to the smallest algorithm (ECDSA P-256). An inline narrative below the
  chart describes the storage/bandwidth/CPU trade-offs in plain English using live
  computed values. (`CertCapacityCalculator.tsx`)

### Changed

- **Playground — "Crypto Workshop" → "Crypto Lab"**: Renamed across
  `PlaygroundWorkshop.tsx` and `MobilePlaygroundOps.tsx` to resolve terminology
  overlap with the PKI Learn module's "Workshop" tab.

- **Compliance — Leaders cross-links**: `LeaderDetailPopover` footer now links to
  `/timeline?country=<country>` and `/compliance?industry=…` for each leader.

- **Patents — executive default sort**: When `selectedPersona === 'executive'`
  and no explicit sort preference is stored, Patents defaults to `impactScore`
  descending. (`PatentsView.tsx`)

- **Learn Dashboard — "Path" terminology**: Filter sidebar and mobile drawer now
  show "Path" / "All Paths" (was "Track" / "All Tracks"). (`Dashboard.tsx`)

- **Timeline — persona hint strip**: Each persona sees a one-line context tip
  below the page header. (`TimelineView.tsx`)

- **Algorithms — persona hint strip**: Same pattern as Timeline, with an
  additional "View Top 5 →" shortcut for the executive persona.

### Internal

- `tsc --noEmit` clean; 2021 Vitest unit tests pass.

## [3.5.59] - May 1, 2026

### Added

- **Product catalog module mapping — 100% coverage**: All 743 products in
  `pqc_product_catalog_05012026_r2.csv` now have `learning_modules` values.
  Previously 204 products (27%) were unmapped. New `scripts/enrich-module-mappings-ollama.py`
  ran two passes: Pass 1 tagged 84 products with `slh-dsa` (keyword match on
  SLH-DSA/SPHINCS+/FIPS 205 in description); Pass 2 used `qwen3.6:27b` to
  assign 1–6 module IDs to each unmapped product.

- **`slh-dsa` module fully stocked**: Was EMPTY (0 products). Now has 92
  products — CRITICAL tier — covering libraries, HSMs, CLM tools, and
  blockchain implementations that explicitly support FIPS 205.

- **`scripts/generate-module-gap-report.py`**: One-shot analysis script that
  reads the product catalog and `moduleData.ts`, computes per-module product
  counts by category and infrastructure layer, assigns coverage tiers
  (CRITICAL/GOOD/SPARSE/GAP/EMPTY), and writes `tasks/module-gap-report.md`.

- **`crypto-mgmt-modernization` module cleanup**: Removed 17 misclassified
  products (storage arrays, MDM/endpoint, DLP, messaging apps) that Ollama
  incorrectly tagged as CPM tools. Module now contains 22 accurate entries:
  CLM tools, PKI software, crypto discovery platforms, and KMS.

### Fixed

- **`TEEHSMTrustedChannel.tsx` import syntax error**: `translateCryptoError`
  import was inserted inside another import block, breaking `tsc`. Moved to
  its own import statement.

- **Workshop WASM error messages**: Replaced raw PKCS#11 error codes and
  Emscripten stack traces with user-readable summaries across 8 workshop
  components (`TEEHSMTrustedChannel`, `HybridSignatures`, `SLHDSALiveDemo`,
  `LMSKeyGenDemo`, `FirmwareSigningMigrator`, `HybridCertFormats`,
  `TokenMigrationLab`, `LiveSshHandshakeRunner`) via new shared
  `translateCryptoError()` in `src/utils/cryptoErrorHint.ts`.

- **`cryptoErrorHints.ts` deprecated**: Inline PKI Workshop error-hint
  function consolidated into shared `src/utils/cryptoErrorHint.ts` which adds
  PKCS#11 v3.2 return-code patterns on top of the original OpenSSL patterns.

### Added (components)

- **`WasmModeIndicator`** (`src/components/shared/WasmModeIndicator.tsx`):
  New shared indicator banner that shows live vs simulation fallback state in
  workshop components. Wired into `TokenMigrationLab`, `FirmwareSigningMigrator`,
  `HSMKeyDerivationDemo`, and `SLHDSALiveDemo`.

- **Reset / Start Over buttons**: `HSMKeyDerivationDemo` (QKD module) and
  `SLHDSALiveDemo` gain a `RotateCcw` reset button to restart the demo flow
  without reloading the page.

### Internal

- `tsc --noEmit` clean; all 232 unit tests pass.

## [3.5.33] - May 1, 2026

Wave 1 UX/UI implementation: 8 P0/P1 plans executed covering persona access,
analytics instrumentation, filter UX, table virtualization, compliance tab
overflow, and shareable report URLs.

### Added

- **Developer persona unlocked for /business**: Developer persona can now
  access the Business Center; `KpiPersonaId` widened to include `developer`
  with weighted KPI scores across 10 metrics. `KpiPersonaSelector` gains a
  Code2 icon for the developer tab. (`personaConfig.ts`, `kpiCatalog.ts`)

- **Analytics: persona-labeled events + 4 new event types**: `personaLabel()`
  helper appends `|p=<persona>|x=<level>` to every module-lifecycle event.
  Added `logAchievementUnlocked`, `logBookmarkToggle`, `logEndorsementGiven`,
  `logQuizAnswer` — wired into achievement, bookmark, endorsement stores and
  the Quiz wizard. (`analytics.ts`, all four stores, `QuizWizard.tsx`)

- **FilterDrawer**: New `src/components/common/FilterDrawer.tsx` — universal
  slide-in filter panel. Used by `/migrate` to collapse secondary facets
  (vendor, verification, license, WIP, sort, restore-hidden) out of the
  toolbar, keeping the primary bar to Layer + Category + search + view toggle.

- **Table virtualization**: `/migrate` SoftwareTable and `/compliance` Cert
  Records table now use `@tanstack/react-virtual` for row virtualization
  (`max-h-[72vh]`, sticky `thead`). Eliminates layout jank on large datasets.
  (`SoftwareTable.tsx`, `ComplianceTable.tsx`)

- **Compliance tab overflow menu**: `MoreTabsMenu` component collapses
  Standardization Bodies, Certification Schemes, and CSWP.39 Framework into a
  "More ▾" overflow dropdown, leaving three primary tabs visible. Active
  secondary tab is promoted to the strip. (`MoreTabsMenu.tsx`, `ComplianceView.tsx`)

- **Shareable report URL token**: `/report?share=<base64url>` replaces the
  previous 12-param query string. `encodeShareToken`/`decodeShareToken`
  encode all assessment inputs into a compact JSON blob. `ReportView` decodes
  the token and shows a "Viewing a shared report" read-only banner.
  (`reportShareToken.ts`, `ReportContent.tsx`, `ReportView.tsx`)

- **Removed curious dead config**: `BC_ZONE_EMPHASIS_BY_PERSONA` pruned of its
  unreachable `curious` entry (curious is nav-blocked from /business).
  Type narrowed to `Partial<Record<PersonaId, BCZoneEmphasis>>`.

### Internal

- Added `@tanstack/react-virtual` dependency.
- Global vitest setup mocks `@tanstack/react-virtual` so table tests pass in
  jsdom (no layout engine). Updated `kpiCatalog.test.ts`, `ComplianceView.test.tsx`,
  and `ReportContent.test.tsx` to reflect new developer KPI access and compact
  share token format.
- All 2015 unit tests pass; `tsc --noEmit` clean.

## [3.5.32] - May 1, 2026

Routine dependency hygiene: 5 Dependabot updates landed in one batch after
local CI verification, plus a transitive override that closes the last
remaining moderate-severity vulnerability flagged by GitHub Security. No
runtime or visible behaviour changes.

### Security

- **`postcss` 8.5.6 → 8.5.13** (closes **GHSA-qx2v-qp2m-jg93** — XSS via
  unescaped `</style>` in CSS stringify output). Transitive dependency
  upgraded; no source code touches.

- **`uuid` pinned to ^14.0.0 via `overrides`** (closes **GHSA-w5hq-g745-h8pq**
  — missing buffer-bounds check in `v3`/`v5`/`v6` when a `buf` argument is
  provided). The advisory is theoretical for our usage —
  `vite-plugin-top-level-await` only calls `uuid.v5(seed, namespace)` without
  a `buf` argument — but the override eliminates the dependency-graph signal
  cleanly.

### Changed

- **`lucide-react` 0.577.0 → 1.14.0** (major). The 1.0 cut was an API
  stabilisation, not a breaking icon rename: all 746 icon imports across the
  app continue to resolve, and the icon SVGs render identically.

- **`@tailwindcss/vite` + `tailwindcss` 4.2.2 → 4.2.4** (patch). Bug fixes
  in the vite plugin and core engine; no Tailwind directive surface changes.

- **`@mlc-ai/web-llm` 0.2.81 → 0.2.83** (patch). PQC Assistant model loader.

- **`zustand` 5.0.11 → 5.0.12** (patch).

### Internal

- **Verified locally before push**: full vitest run (2014 / 2014), `tsc -b`,
  `npm run build`, and `npm audit` — all green at every stage of the bump
  sequence in an isolated worktree.

- **Eslint group bump (#175) not yet adopted** — `eslint v10` requires
  `eslint-plugin-jsx-a11y` to publish a release that peers on
  `eslint^10`; current `6.10.2` caps at `eslint^9`. Will pick up
  automatically on the next Dependabot retry once jsx-a11y ships.

## [3.5.31] - May 1, 2026

A second data-substrate sweep on the same day: vendor partnerships now have a
proper schema, SaaS-only products land in their own cross-reference family,
the assessment wizard knows which compliance frameworks and threats each
question maps to, the maturity corpus consolidates into a single canonical
file, and the trust-score tooltip honestly distinguishes verified attribution
from heuristic guesses.

### Added

- **Vendor partnerships table** — joint ventures and integration partnerships
  (Mastercard / Giesecke+Devrient / Thales, SK Telecom / Thales, Renesas /
  Veridify, etc.) are now first-class data: each multi-vendor product gets
  one row per partner in `vendor_partners_05012026.csv` (32 rows across 15
  products), with a "primary" / "partner" role. The catalog row points to
  the primary vendor's `VND-XXX`; the rest of the partnership lives in the
  partner table. 24 new partner vendors added (`VND-333` … `VND-356`)
  including Mastercard, Mozilla, Renesas, IBM Research, CISA, and more.

- **SaaS cross-reference family** — 11 SaaS-only products that have no CPE,
  pURL, or certification representation (AWS Certificate Manager, AnyDesk,
  BeyondTrust Pathfinder, Descope, Galileo, Hex Trust, Komainu, Metaco
  Harmonize, Stytch, etc.) now live in `migrate_saas_xref_05012026.csv` with
  a SaaS URL and a `deployment_model` (`managed-service`, `api-platform`,
  `hybrid-cloud`).

- **Assessment wizard FK columns** — `pqcassessment` gains explicit
  `compliance_id` and `threat_id` columns (semicolon-delimited multi-value)
  so the assessment can link to specific compliance frameworks (CNSA-2,
  FIPS-140-3, HIPAA, GDPR, PCI-DSS, ISO/SAE 21434, eIDAS 2.0, GSMA NG.116,
  etc.) and threat IDs (CROSS-001, AUTO-001, AERO-001, GOV-001, CRYPTO-001,
  IOT-001, ENERGY-001, etc.) per question. New validator checks **N12-B**
  and **N12-C** enforce both FKs.

### Changed

- **Maturity governance corpus consolidated** — the loader previously merged
  five files at runtime (`04232026`, `04242026`, `04302026`, plus two in the
  legacy `YYYYMMDD` format). Those five are merged at build time into one
  canonical `pqc_maturity_governance_requirements_05012026.csv` (1,332 rows /
  189 reference IDs after dedup), and the five sources are archived. Loader
  behaviour is unchanged; only the file layout is cleaner.

- **Assessment wizard content refresh** — all 83 rows now carry an explicit
  `compliance_deadline` and `compliance_notes` anchored on CNSA 2.0 (2025
  preferred / 2030 required / 2035 disallow), CISA Jan 2026 PQC categories,
  and ANSSI PG 083 v3 (Mar 2026, hybrid by 2026-2028, full PQC by 2030).
  Industry-specific use cases get sector deadlines (V2X / OTA aligned with
  ISO/SAE 21434, AVIONICS with RTCA DO-326A, SCADA with IEC 62443).

- **Trust-score cross-reference scoring distinguishes verified vs heuristic
  attribution** — `inferred` and `category-inferred` `trusted_source_xref`
  matches now count at half-weight, and the tooltip rationale explicitly
  reports the split (e.g. _"5 cross-reference(s) (3 verified, 2 heuristic)"_).
  Pure-heuristic attributions are flagged in plain text. Two new dimension
  tests cover the split.

- **Authoritative-source freshness sweep** — 21 auth_sources rows + 43
  trusted_sources rows last verified ≥90 days ago were HEAD-checked against
  their primary URLs. 54 came back live (`Last_Verified_Date` advanced to
  today); 10 returned 404, blocked, or timed out and were either left at
  their old date or marked `Pending` for manual review.

### Fixed

- **CHANGELOG version-number duplicates** — versions 3.5.19 through 3.5.27
  were each defined twice (April 25-26 set vs April 27-30 set). The April
  25-26 entries were superseded by the later releases; both
  `corpus-invariants.test.ts` and `generate-rag-corpus.test.ts` failed on
  the duplicate IDs. Removed the 10 superseded duplicate entries; both tests
  now pass.

- **Validator graph-consistency now recognizes vendor_partners** — `GC-1`
  and `GC-5` previously flagged partner-only vendors (Mozilla, Mastercard,
  IBM Research, etc.) as orphans because they had no direct catalog vendor_id.
  Both checks now count `vendor_partners` edges, so legitimate partner
  vendors no longer appear as orphans.

### Internal

- **Validator: 99 → 101 checks**, 87 → 90 passing, 0 errors. New: N12-B,
  N12-C. Cleared: GC-1, GC-5 partner-vendor false positives. RAG corpus
  regenerated (8511 → 8503 chunks, reflects the deduped CHANGELOG).

- **Test suite: 2010/2012 → 2014/2014** — both stale corpus tests now pass.

## [3.5.30] - May 1, 2026

This release closes a long backlog of cross-reference gaps in the data layer.
The Library now contains every standard, RFC, and policy that the rest of the
site already cited; the Migrate page knows the vendors behind 31 products it
previously labeled with bare names; and the trust-source attribution badges
catch up to the current data after a 32-day lag.

### Added

- **32 missing Library entries** — IEC 62443, IEEE 1609.2 Amendment, ISO/IEC
  18033-2, ISO/IEC NP 29192-8, CAB Forum SC-081v3, ENISA EUDI Wallet Security,
  FIPS 207 (HQC), Samsung-Thales ML-KEM eSE 2026, NSA CSfC PQC Guidance
  Addendum, Australia ASD PQC Guidance, China OSCCA / GB/T / YD/T standards,
  RFC 9142, RFC 9528, W3C WebAuthn Level 3, and 16 others. Compliance pages,
  Leaders bios, and Quiz questions that previously linked to nothing now resolve
  to real reference cards.

- **30 new vendor profiles** — Akamai, Fastly, Mozilla, Opera, Tailscale,
  ZeroTier, Netskope, OVHcloud, Rambus, Quantropi, QNu Labs, IronCore Labs,
  Versa Networks, Forward Networks, SimpleX, Spherity, SWIFT, ASUSTOR, ETAS,
  Dyber (Fraunhofer SIT), Internxt, Postfix Project, QANplatform, Session
  Technology Foundation, SignQuantum, PQSecure Technologies, TrustCloud,
  WinSCP, Applivery, Prestige Systems, backbone-hq. Migrate cards for 31
  products (Qrypt + 30) now have proper vendor attribution instead of the
  raw product name.

### Changed

- **Trusted-source cross-reference refreshed** — `trusted_source_xref` grew
  from 1281 to 1600 rows after a regen against the current Library and Migrate
  catalog. The 63 stale references it carried (35 to renamed Library entries,
  28 to renamed Migrate products) are gone.

- **`migrate_purl_xref` regenerated against the current product catalog** —
  every catalog entry is now represented (155 with detected package URLs,
  588 explicitly marked `not_found`). The previous file was 29 days behind.

- **`migrate_certification_xref` regenerated** — picked up 51 new
  product↔certificate links (754 → 805 rows) including the new vendor profiles.

- **Catalog vendor IDs normalized to `VND-XXX` format** — 31 catalog rows
  that previously stored raw vendor names ("Akamai", "Fastly", "Qrypt") now
  point to proper vendor codes. Vendor lookup, vendor counts, and the trust
  badges all see the same data.

### Fixed

- **Two corrupted Library archive files removed** — `OpenSSL-3x-Docs.html`
  was a 314-byte JavaScript redirect stub (not real content), and
  `ref-joseph-transitioning.pdf` was HTML mislabeled as a PDF. Both deleted;
  the OpenSSL Library card now points only to the live URL since the archive
  was unusable.

- **Trusted-source-xref test was rejecting legitimate cross-resource
  attributions** — the uniqueness check used `(resourceId, sourceId)` as the
  key, which incorrectly flagged `GSMA-NG116` and `ETSI-EN-303645` as
  duplicates because they appear under both `library` and `compliance`
  resource types attributed to the same source. Fixed to include
  `resourceType` so the same standard can legitimately be attributed in
  multiple contexts.

### Internal

- **Data integrity validator: 6 ERRORs → 0**, 86 → 87 checks passing. The
  remaining 2 warnings (1 sparse-enrichment quiz item, 1 enrichment metadata
  referencing a non-existent "Performance" page) are content-quality issues
  for a future enrichment pass, not structural defects.

- **CSV archive hygiene** — 21 obsolete CSV versions moved to
  `src/data/archive/` so each family now keeps only the two latest versions
  in `src/data/` (per CSVmaintenance.md), restoring the New/Updated badge
  diff window.

- **RAG corpus regenerated** — 8463 → 8511 chunks reflecting the merged
  Library and remapped Migrate catalog.

## [3.5.29] - April 30, 2026

The app gets a new logo, the top navigation no longer overflows on standard
laptop screens, and pages stop drifting sideways when wide content is on
screen. The Compliance page is also tidier on phones — filters wrap into
neat rows and overflowing strips show a soft fade so it's clear there's
more to scroll to.

### Added

- **Brand refresh across favicons, PWA icons, and social previews** — Browser
  tab favicon, the Apple "Add to Home Screen" tile, all PWA install icons
  (192/512/1024 px), and the social-share image (Twitter/Slack/LinkedIn
  previews) all use the new "PQC Today — For a Quantum Safe World" artwork.
  The favicon shows a glyph-only crop so it stays readable at 32 px; larger
  icons keep the full wordmark.

- **Android adaptive home-screen icons** — Two new "maskable" icons
  (`pwa-maskable-192.png`, `pwa-maskable-512.png`) let Android render the
  app's home-screen tile as a circle, squircle, or whatever shape your
  launcher uses, with the glyph centered in the safe area so the OS never
  crops the logo.

### Changed

- **Top navigation no longer scrolls horizontally on typical laptops** —
  Each nav item now stacks the icon over a small label (matching the
  existing mobile pattern) instead of icon-next-to-label. The row is
  noticeably narrower so all items fit on common 1440 / 1366 px viewports
  without horizontal scrolling. The active-state border, dividers, and
  touch targets are unchanged.

- **Compliance filter chips on mobile** — Organization, Industry, Region,
  and Deadline filters now collapse to half-width pairs on phones and
  expand to their natural width on tablets and up. Easier to tap and
  scan; nothing wraps awkwardly into a narrow column.

- **Compliance mobile tab strip and CSWP.39 framework matrix show a soft
  right-edge fade** — When the tab list (Bodies, Tech Stds, Cert Schemes,
  Frameworks, Records, CSWP.39) or the framework × maturity table extends
  past the screen edge, a subtle gradient hints there's more content to
  scroll to. Pure visual affordance — no behavior change.

### Fixed

- **Pages no longer drift sideways on phones** — The inner scroll wrapper
  was silently allowing horizontal scroll whenever any child (a wide chart,
  a table, a long code block) extended past the viewport, so the entire
  page could be swiped left/right past the header gutters. Locked the
  wrapper to vertical scrolling only; wide visualizations still scroll
  inside their own bordered containers as intended.

## [3.5.28] - April 30, 2026

The CSWP.39 governance dataset on the Compliance page now covers 1,332 requirements
from 189 source documents (up from 970 / 107). The Library page gained a CSWP.39
filter, and clicking any library card now shows the obligations extracted from
that source inline — with the original quote that justifies each one.

### Added

- **See every CSWP.39 requirement extracted from a library document, inline** —
  Open any library card and a new section lists each obligation grouped by the
  CSWP.39 pillar it serves (Governance, Inventory, Observability, Assurance,
  Lifecycle). Every entry shows its maturity tier, the requirement statement,
  the exact quote from the source document that supports it, and where in the
  document it appears. Library cards without extracted requirements simply
  don't show this section.

- **"CSWP.39" filter on the Library page** — A new toggle next to "My"
  narrows the grid to library documents that carry extracted CSWP.39
  governance obligations. The count next to it (e.g. "CSWP.39 (189)") tells
  you at a glance how broad the coverage is.

- **+362 new CSWP.39 governance obligations** drawn from 80 newly-analyzed
  source documents, including:
  - **Government & Policy** — NSA CNSA 2.0, DoD CIO post-quantum memo, OMB M-23-02,
    Executive Order 14306, the EU NIS Cooperation Group roadmap, ANSSI's PQC
    FAQ, UK NCSC migration timelines, GSA's PQC buyer's guide, and more.
  - **Migration playbooks** — UK NCSC migration timelines, IETF RFC 8555 (ACME),
    IETF RFC 9763 (multi-algorithm certificates), the Cloud Security Alliance
    practitioner's guide, and others.
  - **Protocols** — GSMA PQ.03 telecom guidelines, IETF RFC 8784 (PSK in IKEv2),
    ETSI hybrid key-exchange specs, and similar.
  - **Standards** — ITU-T X.509 (2019), NIST SP 800-131A Rev. 3, ETSI GS
    QKD 008, FIPS 198-1, and more.

### Changed

- **Compliance → CSWP.39 explorer headline** updates automatically: "1,332
  requirements from 189 sources" (was 970 / 107). The pillar × tier matrix
  and the "view requirements from this source" link from a library card both
  pick up the new content with no extra steps.

## [3.5.27] - April 30, 2026

A major Command Center upgrade: every zone is now wired, your assess answers and
"My X" selections flow through to artifact builders, the page copy adapts to
your persona, and artifacts gain an approval workflow + audit trail. Library
cards link to their CSWP.39 zone and the CBOM tool now overlays live CMVP
matches next to its illustrative cert numbers.

### Added

- **All six CSWP.39 zones now have data wires** — Management Tools (the last
  empty zone) shows a 4-tile dashboard: bookmarked products, playground tools,
  infrastructure layers covered, and FIPS-validated count. Mitigation surfaces
  bookmarked playground tools as candidate gateways. Risk Management surfaces
  bookmarked threats. The Command Center is no longer "wires + WIP zones" — it's
  fully populated.

- **Persona-aware Command Center copy** — The page title and tagline change to
  match your selected persona: Executive sees _"Crypto Risk — Board View"_,
  Architect sees _"Crypto Architecture — System View"_, Ops sees _"Migration &
  Mitigation — Run View"_, plus tailored copy for Developer, Researcher, and
  Curious personas.

- **"Suggested by your assessment" badges on missing artifacts** — Every zone's
  missing-artifact list now highlights the ones your assessment answers imply
  you need, with a hover reason like _"You reported current cryptography in the
  assessment"_ or _"Heavy vendor dependency"_. 26 rules cover 21 of 22 artifact
  types, including new rules for industry, country, and data sensitivity.

- **Artifact builders auto-fill from your assessment** — CBOM, Crypto
  Architecture, Risk Register, Migration Roadmap, and Compliance Timeline now
  open with relevant fields already populated based on your assessment answers
  (current crypto, country, data sensitivity, compliance frameworks, etc.) plus
  the NIST algorithm transitions catalog. A "Pre-filled from your assessment"
  banner appears at the top of the form with a "Clear all" button.

- **CBOM "From your assessment" mode** — A new fourth tab in the CBOM tool
  joins the algorithms you reported in the assessment with the NIST transitions
  catalog (deprecation dates, PQC replacements, FIPS standardization status).
  Auto-selected when assessment data is present.

- **Live CMVP / Common Criteria match badges on cert numbers** — When a
  cryptographic library or HSM in the CBOM tool matches a live record from the
  daily NIST CMVP scrape, a green _"live · NIST"_ badge appears next to the
  illustrative cert number. Click it to verify against the official validation
  page.

- **"Sample" badges + disclaimer banner on illustrative data** — Cert numbers
  and firmware revisions in the CBOM tool now carry a clear _"sample"_ badge
  plus a disclaimer banner so executives don't quote teaching data as live
  facts.

- **Approval workflow on artifacts** — Each saved artifact now has a status
  (draft → in-review → approved), an optional reviewer name, and an approval
  timestamp. Surface as a colored chip on artifact cards and as an interactive
  control in the artifact drawer footer. Foundation for compliance defensibility
  and team sign-off.

- **Artifact audit trail** — Each artifact now tracks an "updated" date and an
  append-only revision log. Edited artifacts show _"Updated …"_ and _"Revisions:
  N"_ chips on their cards.

- **§3 / §4 / §5 / §6 NIST CSWP.39 section nav** — A new collapsible accordion
  above the strategic plan groups Command Center zones under the four
  authoritative document sections (Crypto Agility for Protocols, System
  Implementations, Strategic Plan, Future Works incl. Maturity Assessment) so
  auditors can navigate by §-number.

- **§-reference hover popovers** — Hovering a §-ref chip on an artifact (e.g.
  _§5.4_) now opens a small popover with the parent section's title and
  one-paragraph summary. Educational layer over the citations.

- **"Learn this zone →" link in every Command Center zone header** — One click
  jumps to the matching step in the Crypto Management Modernization workshop on
  the Learn page.

- **Half-page / full-page toggle on every artifact builder** — A maximize/
  minimize button in the drawer header expands the builder to the full viewport
  and back. Each open starts at half-page; mobile is always full-width.

- **Glossary hover tooltips on jargon** — First occurrences of CRQC, CBOM,
  FIPS 140-3, and CMVP in the Command Center now expand on hover with the
  definition and a link to the broader glossary.

- **Action Items "why" chips** — Each top-5 next-step item now shows the
  reasons it ranked highly: _"Finance & Banking breach exposure"_, _"Heavy
  vendor dependency"_, _"Risk score 75 (high)"_, _"Executive persona —
  delegated execution"_. The reasoning was already computed; now it's
  visible.

- **"My X" selections from other pages now flow into Command Center** —
  Bookmarked frameworks (Compliance), products (Migrate), threats (Threats),
  Learn modules, timeline countries, and playground tools all surface in the
  appropriate Command Center zone. The Compact Learning Bar gains a
  "Quick resume" group; the Migration Roadmap auto-selects deadlines from your
  bookmarked countries.

- **Bidirectional "Add to My X" chips inside builders** — In the Compliance
  Timeline builder, each PQC-required framework gets a _"+ My Frameworks"_ chip
  that toggles your saved selection without leaving the builder. Same pattern
  for _"+ My Products"_ on Migration Roadmap gateway candidates.

- **Source provenance chips on tracked frameworks** — The Governance and Risk
  Management zones now show _"from /compliance"_ / _"from /assess"_ / _"both"_
  chips next to each tracked framework so you know where it came from.

- **Library cards show CSWP.39 zone link + maturity tier** — Library document
  tiles now expose a pillar-derived link to the relevant Command Center zone
  plus a maturity tier badge derived from the maturity governance dataset.

- **Quick assessment mode now covers all 5 CSWP.39 process steps** — The 6-step
  quick wizard expanded to 8 steps so it reaches "Identify Gaps" and
  "Prioritise" (previously unreachable in quick mode).

### Changed

- **CBOM and Vulnerability Watch artifacts re-classified to the Assets zone** —
  They were previously under Management Tools, but conceptually they're
  inventory of the crypto attack surface. Aligns with NIST CSWP.39 §5.2.

- **Mobile navigation order tweaked** — The "more" menu now uses an explicit
  order field so high-traffic items surface first on small screens.

- **About page** — Added Terms of Use and "Buy me a coffee" links alongside the
  existing GitHub and license references.

- **Changelog page** — Layout refresh and improved version navigation.

### Removed

- **Cyber Insurance Lens panel** — The expandable Cyber Insurance Lens at the
  bottom of `/business` was removed. The component itself remains in the
  codebase for use elsewhere; the panel just no longer surfaces in the
  Command Center.

### Internal

- New persisted store version (v14) with safe migrations for the audit trail
  and approval workflow fields. Existing artifacts keep their `createdAt` and
  default to `draft` approval status.
- Two new test files (`DocumentCard.test.tsx`, `cswp39ZoneData.test.ts`) and
  a new E2E spec (`library-cswp39.spec.ts`) covering the Library ↔ Command
  Center cross-walk.

## [3.5.26] - April 29, 2026

Fixed a production-only crash on the Command Center page.

### Fixed

- **Command Center page no longer crashes in production** — Chrome and Safari were failing to load the Command Center (`/business`) with a JavaScript error in production builds. Dev builds were unaffected. Resolved by reorganising how Business Center tools are loaded so they initialise in the correct order. All 21 tools still work; no behaviour changes for users.

## [3.5.25] - April 29, 2026

Added an FAQ tab to the right panel and turned on usage analytics for several pages.

### Added

- **FAQ tab in the right panel** — Joins Assistant, Journey, and Bookmarks. Click the help icon to browse frequently asked questions without leaving your current view.

- **Usage analytics for Explore, Report, and Business Tools** — Tile clicks, share-link opens, report views, and category filters now emit anonymous events so we can see which features get the most use and improve them.

### Changed

- **Analytics test coverage** — Tests now verify the nine new event helpers fire correctly and stay silent when analytics is disabled.

## [3.5.24] - April 29, 2026

The VPN Simulator is out of "work in progress" — ML-DSA-65 dual-auth IKEv2 with ML-KEM-768 key exchange now establishes successfully every time.

### Removed

- **VPN Simulator's "work in progress" banner** — Removed because the simulator now establishes ML-DSA-65 dual-auth handshakes reliably across all three modes (classical, hybrid, pure-PQC), validated by an end-to-end test matrix that passes in under 3 seconds.

## [3.5.23] - April 29, 2026

Added a "work in progress" banner to the Command Center.

### Added

- **Command Center work-in-progress notice** — A warning banner now appears below the Command Center header letting you know that zone panels, artifact tracking, and wire data are still under active development.

## [3.5.22] - April 29, 2026

CVE snapshots now record total counts so the UI can show "showing 20 of N" when results are capped.

### Changed

- **CVE snapshots now carry total counts** — Each per-product snapshot records the total number of CVEs reported by the source, even when only the top 20 are shown. Older snapshots without the field continue to load normally.

## [3.5.21] - April 29, 2026

Major Command Center expansion: the NIST CSWP.39 zones are now an interactive diagram with per-zone artifact tracking. Adds a daily CVE feed, shared PDF export, and a new architecture diagram.

### Added

- **CSWP.39 zone diagram in the Command Center** — The Command Center now renders the NIST CSWP.39 iterative loop (Governance → Assets / Management Tools / Risk Management → Mitigation / Migration) as an interactive diagram. Each zone shows how many of its artifacts you've created (e.g. "3 of 12 created"). Click a zone to scroll to its panel and see tools grouped by sub-element (Standards, Crypto Policies, Supply Chains, etc.).

- **Live data wires inside Command Center zones** — Each zone panel now surfaces live data — bookmarked products, milestone status, zone progress — without duplicating logic across components.

- **Daily CVE snapshot system** — A new daily snapshot of CVE data ships with the app and refreshes overnight via a scheduled workflow. Pages that need CVE counts share a cached fetch so the network call only happens once per session.

- **Shared markdown viewer** — A new shared component renders markdown consistently with safe links and uniform styling for components that display rich text content.

- **Shared PDF export utility** — Used by artifact exports across the Business Center and PKI Learning so PDF output stays consistent everywhere.

- **PKI Learning — crypto architecture diagram** — A new interactive visualisation of the crypto architecture layers aligned to CSWP.39, inside the Crypto Management Modernization module.

- **Updated product–CPE cross-references** — Refreshed the data linking software products to NVD CPE identifiers (snapshots dated April 28 and April 29).

### Changed

- **PKI Learning artifacts now sync to the Business Center** — Library CBOM Builder and Management Tools Audit exports save to the shared Business Center artifact store, alongside the other generators.

- **CSWP.39 zone definitions consolidated** — The PKI Learning Crypto Agility Process Diagram and the Command Center now share a single source of truth for the zone list, so they can never drift out of sync.

- **HSM Capacity Calculator — multi-location math corrected** — Previously, redundancy was applied once to the global count, which over-counted multi-location deployments. The calculator now sizes each location individually, applies redundancy per location, and totals up the fleet correctly.

### Fixed

- **VPN Simulator — diagnostic noise removed** — Internal debug logging that was forwarded into the simulator panel during development has been stripped from the WASM build (about 11 KB smaller).

- **VPN Simulator — dual-authentication tests rewritten** — The previous URL-driven test setup was incompatible with React 18 StrictMode and was replaced with an explicit-click flow that drives the UI directly. Three named tests now cover classical, hybrid, and pure-PQC modes with ML-DSA dual authentication.

## [3.5.20] - April 28, 2026

Major milestone: ML-DSA-65 dual-auth IKEv2 in the VPN Simulator now completes a full handshake end-to-end with real ML-KEM-768 key exchange, all running in the browser.

### Fixed

- **VPN Simulator — ML-DSA-65 dual-auth handshake completes successfully** — Both peers now sign and verify each other's IKE_AUTH payload using real PKCS#11 ML-DSA in the in-browser HSM, then derive the IKE shared secret with ML-KEM-768. Reaches the ESTABLISHED state in about 2.6 seconds in headless tests. Closes the work that was tracked as in-progress in 3.5.19. (A cosmetic post-establish issue causes the simulation to log a "DESTROYING" state after success — the IKE_SA itself reaches ESTABLISHED with full ML-DSA certificate authentication.)

## [3.5.19] - April 27, 2026

Major VPN Simulator milestone: full IKE_SA reaches ESTABLISHED with real ML-KEM-768 inside the browser. Also unifies the search service shared by ⌘K and the PQC Assistant, and adds a deep-link validator that ensures every link in the corpus actually works.

### Added

- **Unified search service shared by ⌘K and the PQC Assistant** — Both surfaces now share one search index, one entity index, and one cache, so they always return the same results and only load once per session. Direct queries like "deployment-playbook", "core invention patents", or "BIP-32" now resolve through the shared entity index everywhere.

- **Deep-link grammar validator** — A new build-time check ensures every deep link emitted by the search corpus actually points to a real destination. The build now fails if any chunk has a broken deep link (validated 8,184 chunks, zero violations).

- **Strict corpus invariants gate** — A new CI check ensures every data source listed in the corpus has matching labels, route handlers, and intent boosts. Replaces a hardcoded list that silently missed 8 sources.

- **⌘K parity for 8 missing sources** — Patents, vendors, governance maturity, CSWP.39, document enrichment, personas, tracks, and trusted sources now route to real destinations from the ⌘K palette. Previously they fell back to the home page.

- **Persona and intent boosts for 16 more sources** — The PQC Assistant now ranks results from module Q&A, governance maturity, vendors, patents, trusted sources, CSWP.39, and others, with persona-specific tuning for executives, architects, researchers, and ops.

- **FAQ button on every content page header** — A new FAQ icon joins Glossary in the page header action row and the mobile menu, surfacing the FAQ page from every content page.

### Changed

- **RAG corpus deep links — 0 missing (down from 722)** — Catalog enrichments (BTQ Bitcoin Quantum, Hitachi DoMobile, SEALSQ Quantum Shield, etc.) now navigate to their products on the Migrate page. Module content for two new modules (Crypto Management Modernization, SLH-DSA) now resolves correctly. Glossary terms without a related module (ECDH, IKE_SA_INIT, etc.) now fall back to the Learn page instead of having no link.

- **PQC Assistant deep-link grammar refreshed** — The assistant's system prompt documents the full deep-link grammar for every route, including the 17 business tool IDs, 13 assessment wizard steps, and all 14 patent filter parameters. The model now validates each `?param=` against the documented grammar before emitting a link.

- **Track and persona filters on the Learn page now work from URL** — Visiting `/learn?track=…` or `/learn?persona=…` preselects the track and persona dropdowns, so the assistant can deep-link mid-journey.

- **Workspace persistence — visited routes and advanced-views unlock** — Visited routes are now tracked across sessions, and the "advanced views unlocked" state persists to your cloud workspace so it survives across devices.

- **Persona voice refresh** — Executive, architect, and ops personas now reference the Command Center, HSM Workshop, and Deployment Playbook tools where relevant. The Curious Explorer voice gained a no-acronyms-without-expansion rule.

### Fixed

- **VPN Simulator — full IKE_SA reaches ESTABLISHED in the browser** — Both peer workers complete a real IKEv2 handshake with ML-KEM-768 key exchange and PSK authentication, all running inside WebAssembly. Required cross-worker packet routing fixes and addressing-byte-order corrections.

- **Service worker WASM cache staleness** — `openssl.wasm` (and other WASM files) were being served from a 30-day-stale cache that bypassed the precache, so production users got up-to-30-day-old binaries even after we deployed updates. Was the root cause of TLS simulation failing in production while dev worked fine. WASM requests now go through precache directly.

### Work in progress

- **VPN Simulator — ML-DSA cert-auth wiring (partial)** — Real ML-DSA-65 IKE_AUTH inside the browser is wired up: a PKCS#11 trace channel surfaces every operation in the simulator panel, certificate generation runs end-to-end via the in-worker HSM, and the strongSwan PKCS#11 plugin successfully finds and logs into the token. The remaining gap is that in dual+ML-DSA mode, the daemon still falls back to PSK because the cert-load path inside the plugin isn't yet triggered. Tracked for completion in 3.5.20.

## [3.5.18] - April 25, 2026

Updated GitHub organisation links throughout the app and swapped a brand icon that was removed in lucide-react v1.

### Fixed

- **GitHub organisation links updated** — All links throughout the app (source code, docs, discussions, consent flows) now point to the new `github.com/pqctoday-org/` organisation. Two renamed repos are also corrected. No user-visible content changed — only the destination URLs.

- **Icon compatibility** — Swapped the GitHub and LinkedIn brand icons (removed in lucide-react v1.0) for the standard external-link icon so the Leader consent, removal, transparency, disclaimer, and licence sections continue to render.

## [3.5.17] - April 25, 2026

Added 47 Common Evaluation Methodology requirements to the maturity governance corpus.

### Added

- **Common Evaluation Methodology requirements** — 47 new rows covering CC 2022 R1 governance, lifecycle, assurance, observability, and inventory requirements at maturity tiers 2 and 3.

### Changed

- **Search corpus and embed SDK refreshed** — Regenerated to incorporate the new CC-2022-CEM evidence rows. Search corpus output is now compact JSON (same data, smaller file).

## [3.5.16] - April 25, 2026

Resolved three soft-duplicate library entries with coordinated cite rewriting across library and compliance data.

### Changed

- **Library deduplication — Phase 2** — Three soft-duplicate libraries collapsed into their canonical entries, with all dependency and library-ref citations rewritten across both the library and compliance datasets. Library now stands at 528 rows. Reuses the immutable-fields guard introduced in v3.5.15 so identity columns are never modified during merge.

## [3.5.15] - April 25, 2026

Fixed a regression introduced in v3.5.14: the library dedup script was overwriting `reference_id` values, orphaning 20+ external citations.

### Fixed

- **Library dedup — `reference_id` corruption fix** — The previous dedup helper applied a generic "longer-wins" merge rule across all fields, including identity columns. For 5 of the 9 soft-drops in v3.5.14, the canonical row's `reference_id` was overwritten with the dropped one, orphaning 20+ external citations (most importantly the ANSSI PQC Position Paper, which has 20 cites in compliance and governance). Added an immutable-fields guard so identity columns are never modified during merge.

## [3.5.14] - April 25, 2026

Library catalog deduplicated: 543 → 531 rows.

### Changed

- **Library deduplicated — 543 → 531 rows** — Three hard reference-ID collisions collapsed into single rows; nine un-cited soft duplicates dropped. Each canonical row absorbed missing fields from its dropped twin; multi-value columns (dependencies, module IDs, applicable industries, region scope) were unioned. Verified zero remaining hard or title duplicates. Five medium-difficulty soft-dups requiring coordinated cross-CSV citation updates remain for a follow-up.

- **Library archive** — Older revisions moved to the archive directory; the loader auto-discovers the latest version.

## [3.5.13] - April 25, 2026

Added a freshness check on the CSWP.39 source data, expanded the maturity governance corpus with CC 2022 and NERC CIP rows, and raised the offline cache size limit so the full bundle precaches.

### Added

- **CSWP.39 source freshness check** — The CSWP.39 Explorer Overview now shows the source link, document version, last-verified date, and next-review date inline. A CI check fails if the next-review date passes, forcing manual re-verification of hub data against the upstream NIST publication. Re-verification cadence: 90 days.

- **Maturity governance corpus refresh** — Added 22 rows covering Common Criteria 2022 Parts 2 and 3 (key management, RBG, audit, lifecycle, configuration management at maturity tiers 2–3) and NERC Reliability Standards (CIP-002-8, CIP-003-11 governance and assurance requirements).

### Fixed

- **Offline cache size raised from 15 MB to 20 MB** — So the now-15.9 MB index bundle is fully precached on first install.

## [3.5.12] - April 25, 2026

Across-the-board mobile responsive fixes for PKI Learning, Patents, Playground, and embed views; iOS/Android safe-area insets; deep-link to specific changelog versions; and new data files for SLH-DSA Q&A and the governance corpus.

### Added

- **"Best on desktop" badge on Landing journey steps** — Compare Algorithms and Try the Playground steps now show a "Best on desktop" pill on mobile so users know to expect a richer experience on larger screens.

- **Changelog deep links** — Visiting `/changelog#v3.5.X` now smooth-scrolls to the matching release and briefly highlights it.

- **Search corpus enriched with cross-reference fields** — Each chunk now carries trusted source IDs, library dependencies and module IDs, threat-related modules, compliance library/timeline refs and countries, and migrate category, PQC support, learning modules, and vendor IDs.

- **35 new golden queries** — Round 7 covers Patents (assignee + landscape), CSWP.39 5-step process, governance maturity tiers, and the Curious Explorer persona.

- **New data files** — Library refreshes for April 24 and 25; combined and SLH-DSA Q&A; and the maturity governance corpus update.

- **iOS/Android native platform detection** — Embed mode now sets `data-platform="ios"` or `"android"` on the document root instead of a generic `"capacitor"` value, enabling platform-specific styling.

### Fixed

- **Mobile responsive layouts across the app** — Nine PKI Learning workshop views, Playground tools, Right Panel progress dashboard, share button, and trust score tooltip all switched from fixed two-column grids to responsive grids that collapse on narrow screens.

- **Patents page mobile layout** — On mobile, the patents list hides when a patent is selected so detail takes full width. Patent detail's metadata, cryptographic profile, and grid cards adapt to one column on the smallest screens.

- **iOS/Android safe-area insets** — Notch and Dynamic Island handling now applies to iOS specifically; Android also gets the safe-area padding rules. Overscroll bounce is disabled on both.

- **Narrow-viewport embed grids** — At widths below 480 px, embed grids collapse to a single column and constrained-width dropdowns expand to fit the viewport.

- **Compliance frameworks enrichment refreshed** — Updated maturity evidence entries for the compliance frameworks document.

## [3.5.11] - April 24, 2026

Removed unused Knowledge Graph module files left over from the v3.5.10 cleanup.

### Changed

- **Knowledge Graph orphan files removed** — All Knowledge Graph module and right-panel mindmap files have been deleted now that the feature has been retired. No remaining imports reference the removed code.

## [3.5.10] - April 24, 2026

Removed the Knowledge Graph tab from the right-side panel. Existing user state is migrated automatically.

### Changed

- **Knowledge Graph right-panel tab removed** — The graph tab no longer appears in the right-side slide-out drawer or in the More menu. Persisted state version was bumped with a migration so existing users with the graph tab selected are seamlessly redirected to the Assistant tab.

## [3.5.9] - April 24, 2026

New Patents landscape explorer with 202 PQC-relevant patents. New CSWP.39 Maturity Evidence Grid on the Compliance page. Refreshed library and compliance data, plus a new compliance and standards-bodies enrichment pipeline.

### Added

- **New Patents page — PQC patent landscape explorer** — Top-level `/patents` route with 202 PQC-relevant patents. Two tabs: Insights (donut charts for NIST round status, crypto-agility mode, region; assignee leaderboard; categorical breakdowns) and Explore (sortable table, search, multi-dimension filter chips, CSV export, side-by-side detail panel with claims, citation graph, and CPC code references). Click any chart segment or assignee to deep-link the Explore tab with a pre-applied filter.

- **CSWP.39 Maturity Evidence Grid on Compliance** — A new 4×5 (tier × pillar) evidence grid extends the CSWP.39 Explorer tab. Each cell shows a count of governance requirements; clicking it opens an evidence drawer with quotes, source URLs, and source-name filtering. Compliance framework cards now show a "N CSWP.39 reqs →" chip that deep-links into the grid pre-filtered to the relevant evidence reference. The Crypto Management Modernization workshop's current-tier indicator now links into the matching tier row in the grid.

- **3D infrastructure SVG generator** — A new script emits 93 SVG files covering nine infrastructure layers (Cloud, Network, Application Servers, Libraries & SDKs, Database, Hardware/Secure Elements, Operating System, Security Software, Security Stack), with an interactive overview HTML. Used to generate visual assets for the Migrate, Threats, and Library pages without external design tooling.

- **Compliance and standards-bodies enrichment pipeline** — A new shared helper factors HTML/PDF text extraction, Ollama prompting, and JSON normalization out of the per-source enrichment scripts. Output files for cert schemes, compliance frameworks, standards bodies, and tech standards (maturity entries plus skipped-source logs). The compiled CSWP.39 governance-requirements corpus lands in a new dataset.

- **Library and compliance data refresh (April 23–24)** — Versioned CSV revisions covering library and compliance datasets. Source-of-truth corrections plus new entries documented in audit notes; manual-download guide added for paywalled framework PDFs.

- **Search corpus and embed SDK refreshed** — Regenerated to include the new Patents page, the Maturity Evidence Grid governance requirements, and the data refresh.

### Fixed

- **Lint cleanup across new modules** — Replaced 23 raw button tags with the canonical Button component across the Patents page and Compliance maturity grid; lifted an inner table component to module scope to satisfy the static-components rule; refactored two cumulative-percentage loops to use immutable arrays. Net: 27 lint errors → 0.

## [3.5.8] - April 24, 2026

Command Center reorganised around the NIST CSWP.39 5-step process (Govern → Inventory → Identify Gaps → Prioritise → Implement) with maturity tier badges. Closes coverage of every CSWP.39 (December 2025) requirement bullet — 26 of 26 — through reuse of existing site resources and extensions to existing planning tools, with no new tools added.

### Added

- **CSWP.39 5-step Command Center** — Replaces the previous 7-pillar layout with a fixed 5-step stack (Govern, Inventory, Identify Gaps, Prioritise, Implement), three cross-cut strips (action items at top, cyber insurance side panel, learning bar at bottom), and a per-step maturity tier badge (Partial / Risk-Informed / Repeatable / Adaptive) computed deterministically from your existing artifacts. Each tier badge shows a tooltip listing the artifacts and section markers contributing to (or missing from) the current tier. Persona drives only which step expands by default and which artifacts surface first inside each card.

- **CSWP.39 educational coverage — 26 of 26 requirement bullets** — A Recommended Resources panel in every step card surfaces deep links into Migrate, Library, Threats, Compliance, Leaders, Algorithms, Assess, and Report; filtered authoritative external references; and a "Try it in the Playground" strip with relevant playground tools per step (entropy and DRBG demos on Inventory; TLS and VPN simulators on Identify Gaps; SLH-DSA, LMS/HSS, and firmware signing on Implement). Coverage shifted from 9 fully covered / 9 partial / 8 missing to 26 fully covered.

- **Existing builders extended with CSWP.39 sections** — Seven of the existing 17 business tools gained Markdown sections and small form fields so the educational extensions ride the same export pipeline: audit checklist (Exceptions and Evidence), supply chain matrix (auto-derived CycloneDX CBOM, pipeline sources, refresh cadence), roadmap builder (mitigation gateways with mandatory sunset dates), deployment playbook (decommission plan with 7 milestones), policy generator (KPI drift rules), vendor scorecard (observability tooling notes), and KPI dashboard (composite-scoring formula explainer and sensitivity multiplier).

- **Cross-surface CSWP.39 continuity** — Every Assess wizard step shows a CSWP.39 step badge that links back to the matching Command Center step. The Report page opens with a CSWP.39 nav legend that re-groups every report section under the corresponding step. The same 5-step narrative now spans Command Center, Assess, and Report without route changes.

### Changed

- **Tier 4 maturity gating** — Tier 4 now requires the corresponding CSWP.39 educational section to be present in the relevant tool's exported markdown. Each gating clause is reflected in the tier badge tooltip so users see exactly what's missing.

- **Compliance and Command Center share the same step card** — The CSWP.39 step card component now serves both the Compliance page (unchanged behaviour) and the Command Center (with tier badge, per-step artifact list, and resources panel).

## [3.5.7] - April 23, 2026

New CSWP.39 Framework tab on the Compliance page lets users explore the NIST CSWP.39 (December 2025) Crypto Agility Strategic Plan in-place — overview, interactive process diagram, 5-step process cards, 4-tier maturity model, and a framework cross-walk to compliance frameworks already catalogued elsewhere on the page.

### Added

- **CSWP.39 Framework tab on Compliance** — A sixth tab on the Compliance page covering the NIST CSWP.39 Crypto Agility Strategic Plan: an overview banner, an interactive process diagram with six clickable zones (Governance, Assets, Management Tools, Data-Centric Risk Management, Mitigation, Migration), 5-step process cards (Govern, Inventory, Identify Gaps, Prioritise, Implement) with plain-language explainers and aligned compliance frameworks, a 4-tier maturity model (Partial → Risk-Informed → Repeatable → Adaptive), and a cross-walk table mapping each step to the existing compliance framework records on the page. Each chip is clickable and jumps to the matching framework with a pre-filled search query.

## [3.5.6] - April 23, 2026

Realigned the Crypto Management Modernization module's maturity scale to NIST CSWP.39's 4-tier model and added a cross-walk between four industry frameworks.

### Added

- **PQC maturity model cross-walk** — A new section in the Crypto Management Modernization Introduction tab aligns four industry frameworks by readiness band: NIST CSWP.39 (4 tiers), Meta PQC Levels (5: PQ-Unaware → PQ-Enabled), CMMI (5 levels), and ENISA/NCCoE (5 stages). Workshop Step 1 also gains a compact cross-reference panel that maps the user's current average score to the equivalent Meta, CMMI, and ENISA stages.

- **Meta Engineering further reading** — A clickable card in the Introduction tab references the April 2026 paper "Post-Quantum Cryptography Migration at Meta: Framework, Lessons, and Takeaways", summarising the five-tier PQC maturity model, ML-KEM-768 / ML-DSA-65 algorithm rationale, hybrid deployment strategy, and hyperscale lessons.

- **Library enrichment for the Meta PQC migration paper** — Added 10 new dimensions covering implementation attack surface, cryptographic discovery, supply chain and vendor risk, deployment complexity, financial impact, and organizational readiness.

### Changed

- **Maturity scale realigned to NIST CSWP.39's 4 tiers** — Collapsed from 5 levels (Ad-hoc → Optimized) to 4 (Partial · Risk-Informed · Repeatable · Adaptive), mapping 1:1 to NIST CSWP.39 §6.5. Pillar indicators, workshop Step 1 (button row, radar chart, score display), and the Introduction maturity table all updated.

## [3.5.5] - April 23, 2026

Three CI fixes — type union completeness, exhaustive record coverage, and test expectations updated for revised HSM ops/sec defaults.

### Fixed

- **Quiz category type union completeness** — Persona learning paths referenced `crypto-mgmt-modernization` and `slh-dsa` quiz categories, but the type union didn't include them, causing build errors. Both now in the union.

- **Quiz category metadata exhaustiveness** — The category configuration record was missing entries for the two newly added categories. Label, description, and icon metadata now in place for both.

- **HSM Capacity Calculator test expectations** — Test expected values were out of sync with the revised ops/sec defaults from v3.5.4 (ML-DSA-65: 500 → 150 ops/s; ML-KEM-768: 3,000 → 500 ops/s). Updated all 11 tests with recalculated values.

## [3.5.4] - April 23, 2026

Fixed a Hybrid Signature workshop crash, corrected HSM ops/sec defaults to better match published vendor data, and routed ML-DSA hybrid signatures through the in-browser HSM where the standard mode applies.

### Fixed

- **Hybrid Signature workshop crash** — `ml_dsa65.sign(msg, secretKey)` was being called with arguments swapped, causing a length-mismatch error every time a user tried to sign with concatenation or nesting. Argument order corrected.

- **HSM ops/sec defaults corrected** — Reference profile numbers revised to match published vendor datasheets: RSA-2048 and ECDSA/ECDH P-256 corrected to 100,000 ops/s; ML-DSA-65 software fallback revised to 150 ops/s; ML-KEM-768 to 500 ops/s; AES-128/256 to 50,000 / 25,000 ops/s.

### Changed

- **Hybrid Signatures — ML-DSA backend split by construction** — Concatenation and nesting now route their ML-DSA-65 operations through the softhsmv3 in-browser HSM (using the standard PKCS#11 ML-DSA mechanism), while Silithium remains on the noble post-quantum library because its fused Fiat-Shamir protocol requires the external-μ mode of FIPS 204 §5.2, which has no PKCS#11 v3.2 equivalent. Each construction now displays a backend legend showing which primitive uses which library, with HSM status banner and PKCS#11 handle numbers visible.

## [3.5.3] - April 22, 2026

Three new workshop steps in the Crypto Management Modernization module that close the gap on CSWP.39 Identify Gaps → Prioritise → Implement, and a CSWP.39 process badge on every workshop step.

### Added

- **Three new workshop steps in Crypto Management Modernization** — Step 6 Management Tools Coverage Audit rates 6 CSWP.39 tool categories (Crypto Scanners, Vulnerability Management, Asset Management/SBOM, Log/SIEM, Zero-Trust Enforcement, Data Classification) on a 4-point scale and produces a gap heatmap. Step 7 Risk Analysis & Prioritisation Engine scores CBOM assets on FIPS, ESV, PQC readiness, posture, and end-of-life into a Critical/High/Medium/Low queue. Step 8 Implement — Mitigate or Migrate is a CSWP.39 §4.6 decision-tree wizard that produces either a MIGRATE recommendation (algorithm, timeline, CNSA 2.0 target) or a MITIGATE recommendation (crypto gateway spec with mandatory sunset date). Steps 7 and 8 consume the live CBOM from Step 3, falling back to sample data when not yet built.

- **CSWP.39 process badge on every workshop step** — Each step now shows which CSWP.39 process step it executes (e.g., "Govern · §5.1", "Inventory · §5.2", "Identify Gaps · §5.3").

## [3.5.2] - April 22, 2026

Realigned the Crypto Management Modernization module to NIST CSWP.39 (December 2025), framing it explicitly as the operational execution layer of the Crypto Agility Strategic Plan.

### Added

- **CSWP.39 process diagram on the Visual tab** — Interactive reproduction of CSWP.39 Figure 3 with six clickable zones (Governance, Assets, Management Tools, Data-Centric Risk Management, Mitigation, Migration). Each zone reveals what belongs there, which CPM pillar maps to it, and the CSWP.39 section reference.

- **Three new Learn tab sections** — "NIST CSWP.39 — The Crypto Agility Strategic Plan" describes the five-step Govern → Inventory → Identify Gaps → Prioritise → Implement loop. "The Management Tools Layer" maps six tool categories to CPM pillars and explains why this layer is needed to prevent stale data in the risk analysis engine. "CSWP.39 Crypto Agility Maturity Tiers" presents the 4-tier table with mapping to the existing 5-level CMM scale.

- **Maturity Self-Assessment CSWP.39 callout** — Workshop Step 1 now shows the corresponding CSWP.39 tier (Tier 1–4) below the recommended next milestone, derived from the average score.

- **Scenario 9 — "Crypto gateway or full migration"** — Exercises tab now has nine scenarios; Scenario 9 covers CSWP.39 §4.6 bump-in-the-wire decision framework (legacy PKI with unavailable source code, SHA-1 certs, mission-critical, team gone).

## [3.5.1] - April 22, 2026

New Threshold Signing step in the Stateful Signatures workshop — educational simulation of the Haystack/coalition threshold construction for hash-based signatures, with configurable t-of-n thresholds.

### Added

- **Threshold Signing — Step 5 in Stateful Signatures workshop** — Educational simulation of the Haystack/coalition threshold construction (Kelsey, Lang & Lucks) for hash-based signatures. User-configurable t-of-n threshold (n: 2–5, t: 1–n) over single-level LMS parameter sets. Four-phase interactive flow: Configure → Dealer Setup (simulated keypair, common reference value, trustee share distribution) → Threshold Signing (select ≥ t trustees to enable aggregation; "insufficient shares" error when below threshold) → Result (simulated signature with key reuse prevention comparison). Side panel shows common reference value size growth: LMS single-level (~2–500 MB depending on threshold), HSS 2-level (~1–20 GB), HSS 3+ levels (impractical), explaining why HSS hypertrees are excluded. Research attribution: Haystack paper, plus a note on lattice-based threshold alternatives (threshold Dilithium, FROST variants) for larger thresholds.

## [3.5.0] - April 22, 2026

Major release: a new Hybrid Signature Spectrums workshop demonstrating three hybrid signature constructions (concatenation, nesting, and Silithium fused Fiat-Shamir); SP 800-90B Entropy Source Validation status now tracked on libraries and HSMs; six new posture KPIs; and a complete cross-check remediation of the Crypto Management Modernization module to v1.1.0 with five corrected CMVP cert numbers and two new content sections.

### Added

- **Hybrid Signature Spectrums workshop** — Live side-by-side demonstration of the three hybrid signature constructions from the IETF hybrid signature spectrums draft. Concatenation simply pairs two independent signatures (most backwards-compatible). Nesting wraps the inner signature in the outer (Weak Non-Separability). Silithium uses a shared challenge so neither component verifies without the shared component, achieving Strong Non-Separability per ePrint 2025/2059 and resulting in smaller signatures than concatenation. All three constructions perform live key generation and signing in-browser. Accessible from the Playground (PT-027) and the Hybrid Crypto learn module.

- **Entropy Source Validation status on libraries and HSMs** — Crypto libraries and HSMs now carry an `esvStatus` field tracking SP 800-90B Entropy Source Validation status (active, historical, revoked, in-MIP, not validated) independently of the FIPS 140-3 certificate. Surfaces in the Library & Hardware CBOM Builder workshop.

- **Six new posture KPIs** — Governance: policy enforcement rate (% endpoints with auto-verified cipher-suite config), governance attestation coverage (% decision owners completing annual attestation). Observability: cipher-scan coverage, standards-watch lag (days from deprecation notice to CBOM rule update). Assurance: ESV coverage for libraries and ESV coverage for HSMs.

- **Crypto Management Modernization Q&A coverage** — A new Q&A CSV closes the gap where every peer module had quiz coverage but this one had none. Twenty Q&A pairs grounded in library entries, CBOM pillars, the 47-day TLS cadence, FIPS 140-3 IG September 2025 PQC update, CNSA 2.0 deadlines, OMB M-23-02, and SP 800-90B ESV.

### Changed

- **Crypto Management Modernization → v1.1.0 — cross-check remediation** — Five wrong CMVP cert numbers replaced with verified NIST CMVP values (Thales Luna G7 #4962, BoringCrypto #5244, Bouncy Castle FIPS Java #4943, plus corrections to Entrust nShield, YubiHSM 2, AWS CloudHSM, and GCP Cloud HSM entries). WolfCrypt FIPS posture downgraded to amber (PQC APIs available but not inside FIPS boundary per CMVP #4718). Two new content sections added: an entropy compliance section explaining the SP 800-90B ESV track as a common PQC migration gap, and a protocol deprecation section documenting the standards-watch subscription model. Library tags, RFC 8555 (ACME) entry, and unattributed-claim source citations all added.

- **HSM Capacity Calculator — multi-location support** — Per-location HA computation, fleet total now respects the number of locations, and ML-KEM-768 added as a distinct algorithm in the load distribution.

## [3.4.0] - April 22, 2026

Major release: SP 800-227 hybrid KEM coverage expanded from name-drop to spec-faithful teaching across the Hybrid Crypto module; new Cryptographic Management Modernization learn module (LM-052) — a 55-minute, 5-step executive-track module covering posture management; first WASM charon validation exports proving the ML-DSA + ML-KEM source patches are live; VPN Simulator gap-closure phase 1 (algorithm benchmark matrix, config-bundle export, IndexedDB session history, sandbox launch contract); and a major library refresh adding 26 authoritative references plus 13 newly tagged rows.

### Added

- **New learn module: Cryptographic Management Modernization** — A 55-minute, 5-step executive-track module covering modern cryptographic posture management across certificates, libraries, software, and keys. Six Learn sections frame posture management as a continuous dual-loop program (strategic annual loop wrapping an operational Discover → Classify → Score → Remediate → Attest → Reassess loop). Five workshop tools: a CPM Maturity Self-Assessment with radar chart, an Inventory Lifecycle Simulator with canonical scenarios (shadow-cert discovery, the 47-day TLS cadence, intermediate-CA rotation, OCSP drift), a Library & Hardware CBOM Builder, a No-Regret ROI Builder (IRR under quantum-happens / never-happens scenarios with 5 benefit streams), and a Posture KPI Dashboard Designer. Eight exercises, glossary-aware content, and bidirectional cross-links to the crypto-agility, PQC governance, PQC business case, and KMS modules.

- **WASM charon validation exports (Phase 3a)** — The strongSwan WASM binary now exports three real library-level validators that prove the ML-DSA and ML-KEM source patches are live, not just present in source: a proposal validator (parses an IKEv2 proposal string through charon's own parser and reports whether any ML-KEM transform was accepted), a certificate validator (loads a PEM cert and reports the recognized key type, including ML-DSA), and a key-exchange enumerator (lists the numeric transform IDs charon recognizes for ML-KEM and classical groups). Wired into the VPN Simulator as a new "Validate WASM charon" panel in the Raw Config tab.

- **VPN Simulator gap-closure (phase 1 of 6)** — Four new capabilities: a "Run algorithm matrix" button that runs keygen and self-sign for RSA-3072 and ML-DSA-{44,65,87} against the live HSM and renders a timings/cert-size/pubkey-size table; a "Download config bundle" button that packages strongswan.conf, ipsec.conf for both peers, plus PSK or generated PEM certs into a zip; a "Save session" + "History" flow backed by IndexedDB that persists the user's configuration (mode, auth, MTU, fragmentation, configs, PSK, cert PEMs and key handles) for the 20 most recent sessions; and a "Launch full-fidelity sandbox" button that calls the orchestrator API to spin up a real Docker scenario.

- **SP 800-227 coverage expanded — Hybrid Crypto module** — Spec-faithful teaching across four topic areas: a parameter-set selection table (ML-KEM-512 → Category 1 / IoT, ML-KEM-768 → Category 3 / default TLS, ML-KEM-1024 → Category 5 / CNSA 2.0); a combiner construction deep-dive (concatenation order, HKDF vs KMAC, dual-PRF assumption, mandatory domain separation per SP 800-227); a new "Implementation Requirements" section covering implicit rejection, constant-time decapsulation for FIPS validation, approved DRBG, and side-channel hardening on both halves; and transition framing surfacing the SP 800-227 §1 "interim measure" language.

- **Google Quantum AI whitepaper added to library** — "Securing Elliptic Curve Cryptocurrencies against Quantum Vulnerabilities" (Babbush, Gidney et al., March 30 2026) now in the library with module links to Quantum Threats, Blockchain PQC, and Standards Bodies.

- **secp256k1 added to Quantum Threats workshop** — Bitcoin/Ethereum's curve now appears in the Algorithm Vulnerability Matrix and Security Level Degradation tool with the verified estimate of ≤1,200 logical qubits and ≤90M Toffoli gates via Shor's algorithm.

- **ECC qubit estimates revised** — ECDSA P-256, X25519, and Ed25519 updated from ~2,330 to ~1,200 logical qubits, reflecting improved Shor's circuit efficiency for all 256-bit prime-order elliptic curves.

- **Fast-clock vs slow-clock CRQC distinction** — HNDL/HNFL calculators now explain that fast-clock CRQCs (superconducting, photonic) enable live mempool "on-spend" attacks while slow-clock types are the at-rest / harvest-now-decrypt-later threat.

- **Guided exercise — "ECC Blockchain Under Quantum Attack"** — On-spend attack scenario: Bitcoin transaction in the mempool, fast-clock CRQC at 1,200 qubits, and why blockchain infrastructure needs PQC migration now.

- **Calculator math disclosures** — All three Cert Capacity Calculator charts now have collapsible "How this is calculated" sections with formula, assumptions, and benchmark sources. Each TPS slider in the HSM Capacity Calculator has a "How we estimated this" toggle.

- **Library refresh — 26 new authoritative references plus 13 newly tagged rows** — Covers CA/B Forum Ballot SC-081v3 (47-day TLS cadence by March 2029), NIST CMVP Validated Modules and Modules-In-Process databases, NIST ACVP, FIPS 140-3 IG September 2025 PQC update, Microsoft "Building your cryptographic inventory", EJBCA and Keyfactor posture management primers, Gartner CryptoCOE framing, IBM Research CBOM, Deloitte Tech Trends 2025, McKinsey PQC preparation, IBM IBV 2025 quantum-safe readiness, Sectigo State of Crypto Agility, Ponemon/Entrust Global PKI Trends 2026, Forrester TEI of TLS/SSL certificate-lifecycle automation (DigiCert-commissioned, 312% ROI), AppViewX 47-day lifecycles, DigiCert PQC Maturity Model, Engineering at Meta PQC migration framework, IETF RFC 7030 (EST), RFC 4210 (CMP), Security Boulevard / Forrester (Sandy Carielli) on crypto agility, and the Venafi/Ponemon cert-outage cost study.

### Changed

- **Cert Capacity Calculator — bandwidth model corrected** — TLS payload now includes both `Certificate` and `CertificateVerify`; prior model used an incorrect RSA-2048 delta baseline.

- **Cert Capacity defaults — AVX2 cycle-accurate benchmarks** — RSA, ECDSA, and ML-DSA figures updated from rough estimates to cycle counts from CRYSTALS-Dilithium Round 3 and OpenSSL 3.x AVX2 measurements.

- **Certificate Lifecycle tools moved to PKI Workshop** — ACME PQC Walkthrough and Cert Capacity Calculator removed from the Migrate page; now in the learn module where they belong.

- **VPN Simulator marked work-in-progress** — WIP badge shown while strongSwan IKEv2 + ML-DSA AUTH method integration is pending.

- **VPN Simulator — ML-DSA private keys discoverable by PKCS#11 plugin** — `CKA_ID` is now set to SHA-1 of the public key on both public and private ML-DSA key objects immediately after generation, matching the RFC 5280 SubjectKeyIdentifier method expected by strongSwan's PKCS#11 plugin.

- **VPN Simulator — IPsec config hardened for tunnel mode** — Initiator and responder configs now include left/right subnets and explicit tunnel type so the SA is negotiated as a proper tunnel rather than a transport-mode connection.

- **VPN Simulator — cert auth uses `leftcert=` for all algorithm types** — Removed the ML-DSA-specific `leftsigkey=%smartcard` path; the PKCS#11 plugin now discovers the private key via `CKA_ID` matching regardless of algorithm.

- **Hybrid Crypto module — Composite Signatures section removed** — The section described an IETF draft whose OIDs are not yet finalized; removed to avoid teaching unstable identifiers. Will be reintroduced when the RFC is published.

- **Role guide — self-assessment checklist removed** — The interactive exposure-score checklist was removed from the Role Guide "Why It Matters" view to streamline the module and reduce scope overlap with the dedicated Assessment page.

- **Library CSV refresh** — Replaces the prior snapshot. Intentionally drops 9 reference rows that were audited out. Six older versions archived per the 2-version retention rule.

### Fixed

- **Quiz answer buttons no longer truncate long options** — Option buttons wrap text properly instead of clipping multi-line answers.

- **HSM key inspection was silently broken for VPN simulation keys** — Clicking the eye icon on any key generated by the VPN Simulator did nothing. Two issues: in Rust engine mode the cross-check module was null and the routing returned early; responder keys were also being queried against the initiator session handle. Both fixed.

- **Charon diagnostic lines no longer misclassified as errors** — strongSwan routes all charon output to stderr; lines matching thread prefix patterns like `00[IKE]` or `00[CFG]` are now correctly routed as informational.

- **Hybrid Cert Inspector panel no longer overflows on narrow screens** — The certificate selector and IETF reference buttons now truncate long OID strings instead of breaking the grid layout.

- **ML-KEM-512 corrected to NIST Level 1** — Per FIPS 203, ML-KEM-512 targets Category 1 (≈AES-128 strength), not Level 2. Corrected in the TLS panels and exercises table.

- **VPN sim RSA certs now carry SubjectKeyIdentifier extension** — The RSA path now embeds the SKID extension matching the `CKA_ID` set on the key objects, so strongSwan's PKCS#11 plugin can discover the private key. Without this, ML-DSA worked but RSA fell back to PSK auth.

- **VPN sim ML-DSA cert auth fully wired end-to-end** — ML-DSA key generation now accepts an optional key ID that's stamped as `CKA_ID` on both public and private key objects at keygen time. The simulator generates a random 20-byte key ID per key pair and uses the same bytes in both keygen and the X.509 SubjectKeyIdentifier extension. ML-DSA cert auth no longer falls back to PSK.

- **Mobile / iOS Safari polish** — Glass panels now render the blur effect on Safari (added the WebKit prefix); button icons no longer trigger iOS double-tap zoom; long code blocks no longer dominate small screens; mobile bottom nav respects the iPhone home-bar safe area; Timeline, Algorithms, Compliance, and Playground get shorter mobile-nav labels.

## [3.3.9] - April 20, 2026

Major release. Highlights: a critical Learn page crash fixed for all visitors; an experimental WASM strongSwan v2 build with in-browser ML-DSA + ML-KEM selftest and cross-Worker handshake; a new HSM Capacity Calculator covering the top 10 enterprise HSM workflows; a Command Center overhaul including in-drawer artifact creation and a redesigned ROI Calculator; a complete compliance ↔ timeline consistency pipeline; a 5G SUCI playground UX overhaul with plain-English mode; the Right Panel migrated from a bottom drawer to a right sidebar; comprehensive PKI / TPM / TLS workshop additions; updated NIST CMVP scraper covering all security levels; and Implementation Attacks + KAT Validation tabs in the Detailed Comparison view.

### Fixed

- **Learn page crash on first visit** — Navigating to `/learn` showed "Something went wrong" on Chrome and Safari. The glossary tooltip system was loading data asynchronously, which conflicted with WebAssembly module loading on learn-module pages. Glossary data is now loaded synchronously at startup; tooltips appear immediately with no loading delay.

- **Compliance facets (Org / Industry / Region) derived from full dataset** — Filter dropdowns previously rebuilt from the active body-type tab's slice, so populated facets disappeared when switching tabs (Africa would vanish from Standards while remaining present on All Frameworks). All three facets now derive from the full dataset, and the Industry list is unioned across all framework records so new industries appear automatically.

- **VPN Simulator — daemon-default cert algorithm switched to RSA** — The default client signing algorithm changed from ML-DSA to RSA so the strongSwan WASM daemon handshake works out of the box on first visit. Users can still switch to ML-DSA to generate real PQC cert artifacts; a mode-aware warning explains that the daemon itself doesn't yet run on ML-DSA certs (strongSwan core lacks the IKEv2 ML-DSA AUTH method draft).

- **VPN Simulator — visual SKF payload fragmentation slicing** — KE payloads now visually slice into IKE_INTERMEDIATE fragments per the configured fragment-size budget so learners can see fragmentation behaviour, rather than just an aggregate total.

- **VPN Simulator — ML-DSA raw pubkey configuration respected** — ML-DSA signature generation was ignoring the raw-pubkey setting; now honours the configured key format end-to-end.

- **VPN Simulator — WASM OOM and thread-pool exhaustion** — Long IKE runs were saturating the WASM thread pool and tripping out-of-memory errors when users re-ran scenarios. Lifecycle and pool reuse tightened so the simulator stays stable across repeated runs.

- **What's New modal — View Changelog deep link** — The link previously used the first unseen changelog section's version, which resolved to `Unreleased` and produced an invalid anchor. Now uses the current version so the link always targets a released section.

- **Bouncy Castle FIPS 140-3 cert #4943 security level corrected** — Was incorrectly inherited from the old NIST scraper filter; now correctly L1.

### Added

- **Experimental WASM strongSwan v2 — selftest + cross-Worker KEM handshake** — A new 11.7 MB build alongside the existing baseline, gated behind an environment flag. Two actions: a "Run ML-DSA + ML-KEM selftest" that round-trips through the in-browser HSM (ML-DSA-65 keygen → sign → verify, plus ML-KEM-768 encap/decap loopback per FIPS 203/204), and a "Cross-Worker KEM handshake" where the main thread plays Alice and a Web Worker plays Bob with independent WASM instances and independent HSM state. Both sides derive a 32-byte shared secret that must match byte-for-byte. Lays the groundwork for a future full IKE_SA_INIT + IKE_AUTH wire-format exchange.

- **HSM Capacity Calculator** — A new fleet-sizing tool covering the top 10 enterprise HSM workflows (TLS, code signing, payment HSM, TDE/database, KMS root keys, VPN/IPsec, SSH host, DNSSEC, etc.) with side-by-side classical (RSA-3072 / ECDSA P-256) vs PQC (ML-DSA-44/65/87) sizing. Outputs storage MB, TLS cert bandwidth, aggregate network MB/s, and CPU-core utilisation per workflow plus a totals row. Surfaced as Step 5 of the HSM-PQC learning module.

- **PKI Workshop — Certificate Capacity Calculator overhaul** — Bandwidth column converted from per-cert KB to aggregate MB/s; CPU column converted from "max sign ops/sec" to "% of single core consumed" so numbers map cleanly to capacity-planning conversations. CSV export now includes the new bandwidth and CPU columns.

- **Command Center — in-drawer artifact creation with builder adapters** — Empty placeholders now launch the matching builder directly inside the drawer, with no navigation away from the Command Center. New standalone adapters wrap the full-page learning-module builders (Risk Register, Risk Heatmap Generator, Compliance Timeline Builder) to handle form-state persistence and artifact save. The drawer auto-flips from create to view mode when a save happens. Risk register builder state lives in its own dedicated store, isolated from the module store.

- **Deployment Playbook → Command Center save** — The Ops Checklist gained a "Save to Command Center" button alongside the existing "Copy Markdown" action; checked items are captured for later edit-mode restoration.

- **Compliance Table — mandate deadline labels** — Framework tabs (FIPS 140-3, ACVP, Common Criteria) now display a resolved "Deadline: YYYY" sub-label, plus a tooltip on tab hover for screen-reader and pointer accessibility. Ongoing mandates suppress the year label.

- **FilterDropdown keyboard navigation** — ARIA-listbox keyboard support added to the shared dropdown: ArrowUp/Down to cycle, Home/End to jump, Escape to close. WCAG 2.1 AA keyboard-operable.

- **Manufacturing industry support in assessment** — Added Manufacturing entries to the industry threat model and composite weights (IEC 62443 OT/ICS exposure, ISO/SAE 21434, TISAX, long-lived embedded controllers). Closes a gap where manufacturing respondents had to choose "Other".

- **Compliance ↔ Timeline consistency pipeline** — Established a closed loop between the Compliance and Timeline views. The validator now requires every compliance row with a parseable deadline year to have at least one timeline event spanning that year in one of its referenced organisations; orphan timeline organisations are surfaced as informational. Added 10 timeline rows to cover previously dangling compliance refs (African Union/AUC, GSMA, China/ICCS, G7 CEG, 3GPP SA3, TCG TPM 2.0 v1.85 PQC draft, South Africa POPIA, Nigeria NDPC, Kenya ODPC, Egypt MCIT). The compliance UI's timeline chips now deep-link to the timeline filtered by country, with a dated summary on hover. Frameworks with no matching timeline events surface a visible warning. Validator now reports zero broken refs and zero coverage gaps across 112 compliance rows × 219 timeline events.

- **Compliance data — accuracy and completeness overhaul** — Added 5 African frameworks (South Africa POPIA, Nigeria NDPR/NDPA, Kenya DPA, Egypt PDPL, African Union Malabo Convention) closing the Africa regional gap. Populated `library_refs` on all 48 frameworks that previously had empty cross-references (PCI-DSS, HIPAA, SWIFT-CSP, GDPR, ISO-27001, SOC-2, HITECH, FDA 21 CFR 11, NATO STANAG 4774, UN ECE WP.29, NERC-CIP, IEC-62443, DO-326A, FERPA, COPPA, TISAX, MICA, TSA Pipeline, KpqC/KCMVP, NZISM, INCD, BOI, OSCCA NGCC, Swiss/Dutch NCSC, KISA, INDIA-DST, UAE, ACVP, Taiwan MODA, Malaysia NACSA, Saudi NCA, India CERT-In CBOM, Italy ACN, Spain CCN, Bahrain NCSC, Jordan CBJ, CSA, ITU-T SG17, ISO 19790, Brazil ANPD, Denmark CFCS, NY DFS 23 NYCRR 500, ETSI EN 303 645, PQC Coalition, QED-C). Flagged 33 authoritative sources as Compliance contributors. Loader added a missing industry-alliance body type so PQC Coalition, PQCA, and QED-C are no longer silently misclassified. UI added a global Region filter (with per-bloc counts) and Deadline filter (Active, Imminent, Near-term, Mid-term, Long-term, Ongoing) wired to URL params for deep-linking.

- **Command Center — ROI Calculator overhaul** — A new shared pure-math module backed by 43 unit tests, with NPV plus WACC discount rate (new KPI card), capex/opex split (benefit net of opex for payback/NPV), a decomposed quantum multiplier (HNDL / post-CRQC uplift / detection uplift) replacing the opaque 2.5× default, a tornado sensitivity chart ranking drivers at ±30%, a Cost of Inaction KPI for counterfactual exposure, PDF/DOCX exports alongside markdown, a board-ready executive framing banner, and an `asOf` plus penalty-type schema on the ROI baselines.

- **Command Center — KPI plan completion (E4 / D9 / E2 / E1)** — Closes remaining persona-fit gaps. E4 Board-Ready NIST CSF Composite produces a single 0–100 executive score derived from assessment category scores, mapped to CSF 2.0 Govern / Identify / Protect / Respond. D9 Per-Layer Vendor Readiness adds a meta-KPI that expands to one row per infrastructure layer for architects. E2 Regulatory Exposure Index uses a new framework-fines lookup (25+ frameworks, USD millions) with log-scaled auto-score. E1 Crown-Jewel Coverage is a manual-input KPI with CSF / ISO / SOC 2 mappings.

- **VPN Simulator — ML-DSA authentication via draft standards** — Restores ML-DSA-65 authentication in the IKEv2 handshake, guarded by an explicit warning that calls out the draft-ietf-ipsecme-ikev2-auth-ml-dsa status so users understand the mode is not yet standards-track.

- **5G SUCI Playground — UX overhaul** — Three new sub-components: a collapsible Configure card (first-visit vs returning-user settings), a Scenario Intro Strip (operator ↔ IMSI-catcher perspective toggle), and an Attacker Sidecar (per-step "what the eavesdropper captures" sidebar). Plain-English mode is on by default and persisted; scenario view is session-scoped.

- **Step Wizard — phase progress and plain-English rail** — A new Phase Progress component renders a phase-grouped progress bar (labelled segments with per-step ticks) when steps carry phase fields. A Plain English Rail renders plain-English explanations beside the terminal when the toggle is on.

- **PKCS#11 Log Panel — Beginner Mode** — Every PKCS#11 call now has a 4–8-word plain-English description (algorithm-aware: distinguishes ML-KEM, ML-DSA, X25519, RSA, etc.). A Beginner Mode toggle adds an extra grid column with the translation alongside the raw function name and arguments.

- **PKCS#11 log panel — "Crypto Only" filter** — A new toggle (on by default) hides housekeeping calls (session open/close, object searches), leaving only the 27 cryptographic operations. Toggle off to restore the full raw log.

- **Browser compatibility notice on VPN and SSH simulators** — Safari and Firefox users now see a clear warning explaining that the live cryptographic handshakes (strongSwan IKEv2, OpenSSH ML-KEM) require a Chromium-based browser. The Run / selftest buttons are automatically disabled; all educational content and panels still render normally.

- **Secure Boot PQC — TPM 2.0 sandbox deep-link** — A banner in the TPM Key Hierarchy Explorer tab links to the live PQC TPM migration scenario for real `TPM2_CreatePrimary` outputs covering EK / SRK / AIK / IDevID in ML-KEM-768 and ML-DSA-65.

- **Docker Playground — pqctoday-sandbox iframe embed** — The Docker Playground was rewritten from a scenario-tile UI to an iframe embedding the pqctoday-sandbox app. A postMessage handshake configures vendor ID, theme, and allowed routes; dynamic resize events drive auto-height (600–1600 px).

- **Glossary — TPM 2.0 / TCG V1.85 terms** — Five new entries: Endorsement Key (EK, ML-KEM-768 in TCG V1.85), Attestation Identity Key (AIK, ML-DSA-65), Storage Root Key (SRK, ML-KEM-768 wrapping), Initial Device Identifier (IDevID, IEEE 802.1AR factory ML-DSA-65), and Platform Configuration Register (PCR). All linked to the Secure Boot PQC learn module.

- **PKCS#11 glossary terms** — Token-level hover-chip definitions used for inline tooltips.

- **Library v04172026 entries** — KpqC Competition Results (HAETAE, AIMer, SMAUG-T, NTRU+ final selections), FIPS 140-3 IG PQC self-test requirements for FIPS 203/204/205, 3GPP TR 33.841 PQC Study 2025 (hybrid PQC for TLS / IPSec / IKEv2 in 5G), liboqs v0.15.0.

- **Implementation Attacks tab in Detailed Comparison** — 12 algorithm attack profiles covering ML-KEM, ML-DSA, FN-DSA/Falcon, HQC, Classic McEliece, FrodoKEM, NTRU+, SLH-DSA, LMS/XMSS, Hybrid KEM, Composite Signatures, and cross-cutting RNG/API risks. Each profile includes per-attack severity ratings (Critical/High/Medium/Low), countermeasures, and peer-reviewed references with local archive links.

- **KAT Validation tab in Detailed Comparison** — In-browser NIST Known Answer Tests via the in-browser HSM for ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205), with a collapsible PKCS#11 diagnostics panel.

- **FN-DSA / Falcon attack profile** — Documents the floating-point Gaussian sampler side-channel vulnerability (most SCA-vulnerable NIST PQC standard) with five countermeasures.

- **LMS / XMSS stateful signature attack profile** — Documents the catastrophic state-reuse vulnerability with crash-safe persistence and state management countermeasures.

- **BIKE-1/3/5 added to algorithm reference** — NIST Round 4 code-based KEM (QC-MDPC) with sizes from the BIKE specification. 80 algorithms now in the reference data.

- **Cryptographic hardness assumptions in Security Levels view** — Each algorithm card displays the underlying mathematical problem (Module-LWE, binary Goppa decoding, hash collision resistance, MQ problem, etc.).

- **"Why KATs Matter" explainer** — Collapsible educational content covering FIPS 140-3 requirements, implementation correctness, and in-browser verification value.

- **"Quick Reference" panel in About modal** — Practical analogies for security levels, key sizes, and signature sizes for non-expert users.

- **Curious persona — single-click experience shortcut** — Selecting the Curious persona now completes the personalisation wizard immediately (curious persona, Global region, all industries, marked completed) so first-touch visitors aren't forced through the multi-step wizard before exploring.

### Changed

- **Right Panel layout — bottom drawer → right sidebar** — Migrated from a 50%-height bottom drawer (slide-up) to a fixed right sidebar (40% viewport width, slide-in from right). Both layouts add transition padding when the panel is open so the main content reflows smoothly without overlap.

- **strongSwan WASM rebuilt** — Latest charon plus in-browser HSM plumbing from the companion repo. The WASM binary grew (additional plugins now linked in) but the loader/JS shrank ~55% as more bootstrap moved into the WASM module.

- **strongSwan WASM — 44% size reduction** — A subsequent rebuild trimmed the WASM down by 44% by building and patching out of the companion repo; the local build script and standalone patch are no longer needed and were deleted.

- **VPN Simulator — true MTU and fragmentation config logic** — Assessment-driven MTU and fragment-size smart defaults now flow through to the IKEv2 simulator so learners see realistic IKE_INTERMEDIATE fragmentation behaviour. Previously the UI accepted inputs but the simulator ignored them.

- **VPN Simulator — FlaskConical icon for ML-DSA draft warning** — Replaces the generic warning icon on the ML-DSA draft-standards banner with a flask icon to better signal experimental status.

- **Module store — persisted version 12 migration** — Filters out any stray `roadmap` document type (replaced by `migration-roadmap`) and preserves an optional `inputs` field on executive documents so builders can round-trip form state for edit mode.

- **NIST CMVP scraper — all security levels** — Now fetches all active FIPS 140-3 certificates (previously filtered to L3 only). Actual security level (L1/L2/L3) is extracted from each cert's detail page. Compliance data updated: 2,386 records (NIST 1,269, CC 913, ANSSI 179, ENISA 25).

- **Compliance data re-scraped** — 2,386 total records (was 2,391, with 5 expired certs removed); NIST records now include correct per-cert security levels instead of hardcoded L3.

- **Library v04152026** — 450 records (+21 new entries).

- **Product catalog v04162026** — 731 records (+2 new entries including Cosmian KMS and SOPS).

- **Vendors v04162026** — 302 records (+1 new vendor).

- **Catalog enrichments** — Two full enrichment runs covering 361 and 661 entries; 11 products skipped due to bad source documents.

- **Library and timeline enrichments refreshed** — Full re-runs for the latest snapshots.

- **SSH simulator — "Build in progress" notice removed** — Removed now that the OpenSSH client and server WASM builds are in place. The panel description clarifies that ML-KEM-768 × X25519 key exchange is natively built into OpenSSH 10.x.

- **Playground Workshop — work-in-progress tools hidden by default** — Initial state flipped from "show" to "hide" for every visitor (embed mode already hid them). The filter remains user-toggleable; this change just makes the first-visit surface match the stable, vendor-presentable subset.

- **Performance baseline description fixed** — Info modal now correctly states RSA-2048 is the universal baseline across all algorithm families (previously incorrectly split between RSA-2048 for KEMs and ECDSA-P256 for signatures).

- **Composite & Hybrid attack profile split into two tiles** — Hybrid KEM (X25519+ML-KEM) and Composite Signatures (ML-DSA+ECDSA) with distinct attack details and countermeasures.

- **NTRU+ attack reference clarified** — Notes that the research was on classic NTRU, transferable to NTRU+ via shared polynomial multiplication structure.

- **Draft / Candidate badges added to Performance and Size views** — Amber "Draft" badge shown for algorithms still in candidate or draft standardisation (HQC, BIKE, MAYO, HAWK, etc.).

- **Attack severity ratings replace uniform "Vulnerable" badges** — 4-tier system: Critical (remote, practical key recovery), High (physical access required), Medium (theoretical), Low (easily mitigated). Colour-coded legend.

- **Countermeasures section added to all attack profiles** — Actionable mitigations including masking, constant-time implementation, DRBG compliance, zeroization, and FIPS 140-3 guidance.

- **SLH-DSA side-channel status corrected** — From "Unknown" to "Not Found"; hash operations are inherently constant-time with no known SCA vulnerabilities.

- **Search corpus and embed manifest regenerated** — Picks up the compliance/timeline data refresh and the deletion of retired CSVs. RAG corpus shrinks significantly after dedup against the new authoritative files.

- **OpenSSH WASM connector path** — Comments and the build-in-progress banner now point at the folded-in connector in the HSM repo (per the April 18 repo consolidation) instead of the retired standalone repo.

## [3.3.8] - April 14, 2026

Six new reference library entries covering government guidance and emerging standards, plus
six new algorithm entries for the draft SLH-DSA limited-signature parameter sets from NIST
SP 800-230. FAQ copy updated to reflect current module count and corpus size.

### Added

- **NIST SP 800-230 (IPD) in the Reference Library** — "Additional SLH-DSA Parameter Sets for
  Limited-Signature Use Cases" (April 13, 2026); defines six new SLH-DSA variants optimised
  for firmware and certificate signing with a 2^24 signatures-per-key limit; local PDF
  downloadable.
- **ANSSI PG-083 v3.00 in the Reference Library** — France's authoritative cryptographic
  algorithm rules updated for the first time since 2020; first edition to explicitly address
  the quantum threat; covers symmetric, asymmetric (lattice/LWE), KEM, signature, and RNG
  guidance; local PDF downloadable.
- **Applied Quantum PQC Migration Framework v1.1 in the Reference Library** — Universal
  framework by Marin Ivezic/Applied Quantum (March 2026, CC BY 4.0) covering cryptographic
  inventory, risk classification, migration roadmaps, and GSMA alignment; local PDF
  downloadable.
- **Charter of Trust "Decrypting the Future" in the Reference Library** — PQC Working Group
  report (April 13, 2026) on global PQC transition timelines, threat scenarios, and a
  practitioner migration playbook authored by Charter of Trust member organisations including
  Siemens; local PDF downloadable.
- **Cambridge JBS / CCAF quantum blockchain article in the Reference Library** — Analysis by
  Philippa Coney on quantum computing threats to distributed ledgers, blockchain upgrade
  pathways, and the role of regulators in the PQC transition; local HTML archived.
- **Australian ACSC Quantum Technology Primer (Communications) in the Reference Library** —
  March 2026 guidance for the Australian communications sector; catalogued as no-timeout
  (cyber.gov.au server returns HTTP/2 INTERNAL_ERROR for direct downloads).
- **Six SLH-DSA limited-signature algorithm variants in the Algorithms reference** — Draft
  entries for SLH-DSA-{SHA2|SHAKE}-{128|192|256}-24 from NIST SP 800-230 IPD; each variant
  produces signatures roughly 50% smaller than the corresponding FIPS 205 's' parameter set
  at the cost of a strict 2^24 signatures-per-key limit; marked Draft pending finalisation.
- **Entropy & Randomness FAQ entry** — new question covering the module's TRNG/QRNG/DRBG
  content and its relevance for teams deploying HSMs and PQC key generation.

### Changed

- **FAQ copy refreshed** — module count updated to 50 across nine tracks; Reference Library
  description updated to reflect 440+ documents; RAG corpus size updated to 6,500+ chunks;
  SoftHSM description expanded to list the full supported algorithm suite.
- **RAG corpus grown to 6,507 chunks** — five new library entries enriched with
  qwen3.5:27b; Document Enrichments bucket now at 1,285 chunks.
- **Older library and algorithm CSVs archived** — thirteen library CSV versions and two
  algorithm CSV versions moved to src/data/archive/ to maintain the two-version active window.

## [3.3.7] - April 14, 2026

Picking a row from the Transition Guide now adds both the classical algorithm and its PQC
replacement to the comparison panel in one click — select three RSA rows to benchmark
RSA-2048/3072/4096 alongside ML-KEM-512/768/1024 all at once.

### Added

- **Compare classical and PQC together from the Transition Guide** — clicking the compare icon
  on any row (e.g. RSA 2048-bit → ML-KEM-512) adds both algorithms to the comparison at once.
  Select up to three rows to compare up to six algorithms simultaneously.

### Fixed

- **ECDH P-384 benchmark now produces results** — previously all 10 runs would fail silently,
  showing dashes for every metric.
- **Comparison panel shows only what you selected** — extra classical algorithms that appeared
  automatically without being chosen have been removed.

## [3.3.6] - April 14, 2026

The algorithm comparison table now labels each column so you can tell at a glance which
algorithms are classical, which are PQC, and which is the reference baseline. HSM engine
upgraded to softhsmv3 v0.4.23.

### Added

- **Classical / PQC / baseline labels in the comparison panel** — each column header now
  carries a small badge identifying the algorithm's role, making benchmark results immediately
  readable without prior knowledge of each algorithm's category.

### Changed

- **HSM engine updated to softhsmv3 v0.4.23** — internal maintenance release; no change to
  functionality.
- **HSM engine v0.4.22 improvements (included)** — adds ECDSA and ECDH support for P-521
  curves; EdDSA key validation hardened to return an error instead of crashing on malformed input.

### Fixed

- **Certificate and compliance detail pop-ups now open centered on screen** — on mobile devices
  these were appearing at the top of the viewport; they now open centered and resize correctly
  when the browser address bar is visible.
- **Timeline pop-ups no longer get cut off on mobile** — pop-up height now accounts for the
  dynamic browser address bar on iOS and Android.

## [3.3.5] - April 13, 2026

The algorithm benchmark now covers the full PQC and classical portfolio — SLH-DSA, RSA, ECDSA,
Ed25519, ECDH, X25519, X448, LMS, and XMSS all run through the in-browser HSM engine alongside
ML-KEM and ML-DSA. X448 was not benchmarkable at all before this release.

### Changed

- **Benchmark engine extended to the full algorithm portfolio** — the following now produce live
  timings measured by the in-browser HSM rather than reference figures: SLH-DSA (all 12
  parameter sets), RSA (2048/3072/4096-bit), ECDSA P-256/P-384, Ed25519, ECDH P-256/P-384,
  X25519, X448, LMS-SHA256, and XMSS-SHA2. ECDSA P-521 and ECDH P-521 continue to use the
  browser's built-in WebCrypto.

### Fixed

- **Timeline event pop-ups now have a proper backdrop** — clicking outside the pop-up closes it;
  focus is trapped inside while it is open.

### Data

- 19 additional migration catalog products enriched with AI analysis.
- New products added: IBM z16 Crypto Express 8S HSM, AWS Certificate Manager.
- 7 new threats added: Grover attacks on AES-128, quantum halving of SHA-256 collision
  resistance, PRNG quantum entropy risks, PQC timing/power side-channel attacks, lattice
  cryptanalysis advances, fault injection on PQC key generation, and resource-constrained
  PQC deployment.
- 2 new timeline entries: Brazil's ITI federal mandate for ML-DSA and ML-KEM, ITU-T X.1811.
- New library entry: Google/QuantumAI paper on securing elliptic curve cryptography against
  quantum attacks.

## [3.3.4] - April 13, 2026

AI-powered analysis now covers all 535 products in the Migration catalog. Each product entry
surfaces 19 dimensions of PQC readiness — algorithms in use, hybrid approaches, migration
timeline, compliance alignment, and more.

### Data

- **535 migration catalog products enriched** — AI analysis of published product documentation
  for every product in the catalog, covering PQC algorithms, hybrid approaches, security levels,
  migration timelines, and regulatory alignment.
- Library (315 entries), timeline (213 entries), and threat (80 entries) enrichments all
  refreshed to the current 19-dimension analysis schema.

### Changed

- **"Enriched" badge now reflects current AI analysis** — the badge previously appeared on
  ~45 products with legacy data; it now correctly marks all 535 products with current enrichments.

### Fixed

- **Migration Planner stack view** — inactive layers now collapse when one layer is expanded,
  keeping focus on the active content instead of showing everything at once.
- **Stack view dark-mode contrast** — inactive layers were appearing lighter than the active
  layer, making the depth hierarchy look inverted. Active layers are now clearly elevated.
- **Stack view active layer visibility in dark mode** — the active layer was blending into the
  page background; it now has a clearly visible tinted surface.
- **Stack minimap dots** — navigation dots were rendering as oversized empty boxes; they are
  now the correct compact size.
- **Stack minimap hidden in embedded widgets** — the minimap no longer overflows the iframe
  boundary in embed contexts.

## [3.3.3] - April 13, 2026

Mobile fixes and algorithm comparison improvements.

### Fixed

- **Persona avatar displayed correctly on mobile** — the avatar tile was overflowing its
  container on small screens and appearing detached from the page.
- **"What's New" panel centers correctly on iOS and Android** — previously it could drift
  partially off-screen when the browser address bar was visible.
- **Update notifications no longer clip on narrow screens** — notifications stay within viewport
  bounds on 320 px devices.
- **Composite and Hybrid algorithm types now show the compare button** — Composite Signature,
  Composite KEM, Hybrid KEM (HPKE), and Hybrid KEM with Access Control were missing the compare
  icon; all are now included.

## [3.3.2] - April 12, 2026

Every operation in the HSM Playground now shows the exact bytes sent to and received from the
HSM — see precisely what the PKCS#11 standard is doing at every step.

### Added

- **Full parameter inspection across all HSM panels** — click the eye icon in any call log to
  expand individual operations and see what was sent (mechanism name, key template, input data
  as hex) and what came back (handles, byte lengths, signature/ciphertext/digest, VALID/INVALID).
  New coverage: key import and object management, mechanism discovery, multi-part signing and
  digest, authenticated key wrapping, and random seed operations.

### Fixed

- **Sign and Verify operations now show the actual data** — previously only the call name and
  result were shown; message bytes and signature bytes are now visible in the log.
- **Key Unwrap operations now decode correctly** — previously showed nothing when clicked; now
  shows the mechanism, key blob, attribute template, and resulting handle.
- **Inspect toggle clearly shows when it is active** — the eye icon now appears highlighted
  when inspection is turned on.

### Changed

- **All HSM panels upgraded to the full inspectable log** — the condensed 10-entry summary in
  every operation panel (KEM, Sign/Verify, Symmetric, Hashing, Key Agreement, KDF, HMAC, AES,
  VPN Simulation) has been replaced with the same full decode view previously only available
  in the dedicated Logs tab.

## [3.3.1] - April 12, 2026

22 additional ACVP test vectors now pass.

### Changed

- **In-browser HSM engine updated to softhsmv3 v0.4.21** — resolves 22 previously skipped
  ACVP test vectors: 20 LMS SHAKE variants and 2 EdDSA/SLH-DSA cases.

## [3.3.0] - April 12, 2026

Role-specific exercise guides, an entropy workshop, and new dedicated panels in the HSM
Playground.

### Added

- **Role-specific exercise guides** — hands-on tasks tailored to each persona (Architect,
  Developer, Executive, Operations, Researcher) across five learning modules.
- **Entropy workshop** — five interactive in-browser demos: DRBG architecture, entropy testing,
  QRNG simulation, random number generation, and entropy source combining.
- **Dedicated ML-KEM panel in the HSM Playground** — encapsulation and decapsulation with
  dual-engine cross-check (Rust engine vs C++ engine running in parallel).
- **Stateful signature panel in the HSM Playground** — LMS/HSS and SLH-DSA operations with
  state management visualization.
- **Operation history** — review previous cryptographic operations during any playground session.

### Data

- Library and catalog data refreshed; knowledge base regenerated.

## [3.2.1] - April 12, 2026

OpenSSL engine upgraded to v3.6.2.

### Changed

- **In-browser OpenSSL engine updated to v3.6.2** — used by OpenSSL Studio, Digital Assets,
  and PQC algorithm demos. Full ML-KEM, ML-DSA, SLH-DSA, and LMS/HSS support preserved.
- **Embedded widget SDK** updated to a more compact bundle for faster load times in partner
  integrations.

### Data

- Knowledge base refreshed: 5,881 indexed chunks.

## [3.2.0] - April 12, 2026

Mobile app foundation — the codebase now supports a future native iOS/Android build with zero
impact on the web app. Changelog entries rewritten in plain language across all recent releases.

### Added

- **Native mobile app platform support** — an integration bridge for Capacitor is in place for
  native iOS/Android builds. All native capabilities are completely dormant when using the web
  app: device storage, native share sheet, system browser handoff for external links, Android
  back-button navigation, background state saving, and haptic feedback.
- **Unified platform detection** — one authoritative source determines whether the app is
  running as a native app, an embedded widget, or a standard web page.

### Changed

- **Changelog dates are now human-readable** — dates appear as "April 12, 2026" rather than
  ISO format.
- **Changelog descriptions rewritten for plain language** — v3.0.0–3.1.4 entries describe
  user-facing changes rather than implementation details.
- **App startup sequence** — three clearly named boot paths: native app, embedded widget, and
  standard web.

### Fixed

- **Embed error page** — the verification error screen now builds its content safely.
- **Auto-reload disabled in native WebView** — the service worker no longer triggers page
  reloads inside the native app container.

## [3.1.4] - 2026-04-11

Polish pass for embedded widgets and the learning module navigator — modals, tables, and step indicators now display correctly at all screen widths.

### Fixed

- **Pop-ups and overlays display correctly in embedded widgets**: All modal backdrops are now
  correctly scoped to the embedded frame. Previously, dialogs with non-standard class combinations
  would escape the iframe boundaries and appear at incorrect positions on the host page.
  Technical: added generic `[data-embed] .embed-backdrop` CSS rule covering all 56 affected components.

- **Tables and charts fit properly at narrow widths**: Reduced hard-coded minimum widths that
  forced horizontal scrollbars in embedded views (600–900 px) and on tablets.
  Affected: Compliance Gantt, Algorithm Vulnerability Matrix, Migration Risk Matrix, and 5 others.

- **More content visible on medium-size screens and in embedded views**: The Playground,
  category filter sidebar, and Algorithm Comparison panel now appear at tablet widths (768 px)
  instead of requiring a full desktop screen (1024 px).

- **Content fills the full width inside embedded portals**: Removed centering constraints so
  content spans the entire embed frame rather than leaving empty margins on both sides.

- **Learning module step indicators are more compact**: Step circles are smaller and no longer
  overflow their container on narrow screens or inside embedded views.

- **Improved text legibility when switching between light and dark themes**: Several components
  used hardcoded color values that looked incorrect in the opposite theme. All now use semantic
  color tokens that adapt automatically.

- **Detail pop-ups no longer appear above unrelated content**: Fixed stacking order for detail
  popovers, tooltips, and the accuracy feedback widget so they stay in their correct layer.

- **Feedback and tooltip overlays stay within embedded widget boundaries**: The page accuracy
  widget and trust score tooltip no longer escape the iframe viewport in embed contexts.

## [3.1.3] - 2026-04-11

Bug fix for embedded widget brand theming, plus vendor certificate infrastructure cleanup.

### Fixed

- **Custom brand colors in embedded widgets now load correctly**: Color values such as `#3B82F6`
  were incorrectly treated as URL fragment separators, causing the vendor token and signature to
  be silently dropped. The embed URL builder now percent-encodes color values before signing.

### Changed

- **Vendor certificate registry simplified**: All vendor certificates (including development ones)
  are now loaded from PEM files at build time. The separate dev-mode fixture merge step has been
  removed, making the embed boot path faster and more predictable.

- **Trust anchor certificates can be committed to version control**: Root CA and vendor
  certificate PEM files (public trust anchors only) are now tracked by git so they can be
  bundled by the build system.

### Security

- **No private key material is stored in the repository**: Root CA private keys, P12 bundles,
  and `.key` files are blocked by gitignore rules. Only public certificate PEM files (trust
  anchors) are ever committed.

## [3.1.2] - 2026-04-11

Embed SDK: partner portals can now display custom logos, brand names, and navigation colors.

### Added

- **Custom logos and brand names in embedded widgets**: Nine new vendor certificate fields give
  partners granular control over how the embed looks in their portals — custom logo image, brand
  name in the nav header, logo sizing, nav bar height, active nav highlight color, secondary
  brand color, an optional help button, and the ability to hide the "Powered by PQC Today" badge.
  Technical details: `theme.secondary`, `theme.secondaryForeground`, `theme.navActiveBackground`,
  `theme.brandName`, `theme.logoUrl`, `theme.logoHeight`, `theme.logoMaxWidth`,
  `theme.headerHeight`, `features.hidePoweredBy`, `features.showHelpButton`, `features.helpUrl`.

## [3.1.1] - 2026-04-11

Fixed Migration Planner interactivity and improved embedded widget behavior across 18 components.

### Fixed

- **Migration Planner layer categories are now fully interactive**: Layer row buttons (Cloud,
  Network, Application Servers, etc.) were completely unresponsive due to an invalid nested
  button structure. Clicking any part of a layer row now correctly selects it. Full keyboard
  support (`Enter`/`Space` to select, `Escape` to collapse) is also restored.

- **Migration Planner filter bar stays visible while scrolling through layers**: The sticky
  filter bar no longer gets covered by layer rows when scrolling through a long stack.

- **Drawers, alerts, and navigation panels stay within embedded widget boundaries**: 13 UI
  elements that use fixed positioning (including the Artifact Drawer, Glossary, achievement
  toasts, and the Algorithm Compare bar) now correctly stay within the embed frame instead of
  escaping to the host page.

- **Embedded widget height adjusts correctly for host pages**: The resize signal sent to the
  host page is now based on the actual content area, not the document body, giving accurate
  height measurements.

- **Vendor token is preserved when navigating within embedded widgets**: The embed authentication
  token is no longer dropped on internal navigation redirects.

## [3.1.0] - 2026-04-11

Visual consistency pass — gradient buttons and the shared Button component are now applied uniformly across every page.

### Changed

- **Consistent gradient button style across the entire app**: All primary action buttons now
  use a unified purple→teal gradient, replacing the inconsistent mix of solid-color variations
  that existed across every page and learning module.

- **Unified interactive button component throughout the codebase**: Every button in the app
  now uses the shared `<Button>` component, ensuring consistent hover states, focus rings,
  accessibility attributes, and keyboard handling everywhere.

## [3.0.0] - 2026-04-10

### Added

- **Embed SDK — left sidebar nav layout (`navLayout: 'sidebar'`)**: Vendors can now opt into a
  fixed left-panel navigation instead of the default horizontal top bar. Set `navLayout: 'sidebar'`
  in the cert's VendorTheme to activate a 200px fixed left sidebar with vertically stacked nav
  items and a logo/divider at the top. Main content automatically offsets right by the sidebar
  width. Zero impact on standard mode — the layout is gated behind the `[data-embed][data-nav-layout="sidebar"]`
  CSS selector and the `data-nav-layout` DOM attribute, which are only set in the embed bootstrap
  path.

- **Embed SDK — VendorTheme v2 status/link color overrides**: Five new VendorTheme fields are
  now supported: `colorMode` (default light/dark mode, user can still toggle), `linkColor`
  (overrides link/anchor color), `successColor`, `warningColor`, `destructiveColor` (override
  status badge and indicator colors). Status color overrides are scoped to `[data-embed]` via
  intermediate `--embed-success/warning/destructive` CSS vars and never pollute global tokens.

- **Embed SDK — cert color mode default (`colorMode`)**: The vendor cert can now specify a
  default color mode (`'light'` or `'dark'`). The URL param `?theme=` still takes priority; the
  cert value is the fallback when no param is present. The user can always toggle manually.

- **pqc-admin CertIssueWizard — Nav Layout control**: New Nav Layout select (Top / Sidebar) in
  the Embed Theme panel, alongside the existing Color Mode control. The CLM/DigiCert preset now
  applies `navLayout: 'sidebar'` automatically.

- **`test-vendor-custom-design` cert updated**: Now encodes the full VendorTheme v2 field set,
  including `navLayout: 'sidebar'`, `colorMode: 'light'`, `linkColor`, `successColor`,
  `warningColor`, and `destructiveColor`.

## [2.99.0] - 2026-04-10

### Added

- **Embed SDK — `VendorTheme` full component theming**: Vendors can now control 15 visual
  properties in their embedded certificate: colors (11 tokens), border radius, font family,
  table row density (`compact`/`normal`/`relaxed`), navigation bar background/text color
  (`sidebar`/`sidebarForeground`), and status badge fill style (`solid`/`tinted`). All overrides
  are scoped to `[data-embed]` and have zero impact on standard mode.

- **Embed SDK — nav bar color (`sidebar`/`sidebarForeground`)**: Vendors can set a custom
  navigation bar background (e.g. dark navy `#1A2332`) with matching text/icon color. Active and
  hover states are derived automatically via `color-mix()`.

- **Embed SDK — solid status badges (`badgeFill: 'solid'`)**: Vendors can switch status badges
  from the default subtle tinted style (`/10` opacity) to fully opaque filled pills, matching
  enterprise CLM UI conventions (DigiCert ONE / Sectigo Trust Lifecycle Manager style).

- **Embed SDK — `INDUSTRY_SLUG_TO_LABEL` mapping**: A single canonical map in `personaConfig.ts`
  translates cert industry slugs (`'finance'`) to display labels (`'Finance & Banking'`) at the
  embed boundary, ensuring all pages receive the format they expect.

- **`test-vendor-custom-design` cert preset**: Dev registry now includes a third test certificate
  (`kid: test-vendor-custom-design`) encoding a full Trust Lifecycle Manager brand theme: deep
  blue primary, light gray background, dark navy nav bar, compact density, solid badges.

### Fixed

- **Embed mode — Compliance tables empty**: The industry filter initialized to a cert slug
  (`'finance'`) that never matched compliance CSV display labels (`'Finance & Banking'`),
  producing 0 entries. Fixed by translating slugs to display labels in `EmbedLayout` before
  seeding `usePersonaStore`.

- **Embed mode — Assessment industry not pre-populated**: Same slug/label mismatch prevented the
  Assess wizard from pre-selecting the correct industry from the cert policy.

- **Embed mode — region validation**: `allowedRegions[0]` is now validated against a known
  `Region` set before being passed to `setRegion()`, preventing an unsafe type-cast with
  unexpected cert values.

- **Embed mode — URL param bypass**: `?ind=` and `?persona=` query parameters are now sanitized
  at mount against cert-allowed values, preventing manual URL manipulation from accessing
  restricted content.

- **Semantic token consistency**: Replaced raw palette classes (`bg-amber-500/10`,
  `text-amber-500`, `bg-slate-50`, `text-slate-800`, `bg-red-50`, `text-red-900`,
  `bg-blue-50/10`, `text-blue-300`) with semantic tokens across `WasmFallback`,
  `StatefulSignaturesDemo`, and `VpnSimulationPanel` for correct rendering in vendor-themed
  embed contexts.

## [2.98.0] - 2026-04-10

### Added

- **Embed SDK — granular route presets**: The `explore` bundle preset has been replaced with
  individual presets — `timeline`, `algorithms`, `library`, `threats`, `leaders`, `compliance` —
  giving vendors precise control over which pages appear in the embedded nav. Certificates using
  `"presets":["all"]` (full access) automatically show all pages.

- **Embed SDK — Algorithms and Threats nav items**: The Embed layout now shows Algorithms and
  Threats as first-class nav entries when the vendor certificate permits those routes, matching
  the full-site navigation.

- **Embed SDK — `assistant` URL param**: Vendors can suppress the PQC Assistant at embed URL
  level by appending `assistant=false` (e.g. for read-only kiosk deployments), without requiring
  a new certificate.

- **Embed SDK — About page always accessible**: `/about` is now exempt from route-guard
  enforcement so embedded users can always reach the About page regardless of cert presets.

- **Embed SDK — Right Panel scoped to iframe**: The assistant/bookmarks panel now opens as an
  in-frame overlay (not a full-screen takeover) when running in embed mode, and the Knowledge
  Graph tab is hidden in embed contexts where it would be disruptive.

- **Embed SDK — query-string passthrough on nav**: Embed nav links and internal redirects now
  preserve the `?token=…` query string so the vendor token is never lost on in-app navigation.

- **CuriousSummaryBanner layout**: Desktop view switched from a 2-column side-by-side layout to
  full-width stacked (infographic on top, "In Simple Terms" below) for better readability on
  medium-width screens.

### Fixed

- **Embed modal positioning**: All detail popovers (Compliance, Leader, Library, Migrate,
  Timeline, WhatsNew) now use a shared `useModalPosition` hook so they render correctly inside
  an iframe without clipping outside the embed container.

- **Bookmark links in embed mode**: Clicking a bookmarked item now navigates within the embed
  (`/embed/library?ref=…`) instead of escaping to the full-site URL.

- **Theme not applied in embed mode**: Dark/light theme preference is now applied on load inside
  the embed layout via a dedicated `ThemeApplier` component.

- **Embed vendor cert import path**: Dev registry now resolves the test certificate path relative
  to the correct directory depth (`pqc-tools/…` instead of `../../../../pqc-tools/…`).

- **Assistant button styling**: The "Assistant" button in page headers is now a compact
  pill-style button (icon + label) consistent with other action buttons in the row.

- **Back-to-modules button hidden in embed**: The "← Back to modules" button on individual
  learning module pages is hidden in embed mode to avoid confusing navigation out of context.

## [2.97.0] - 2026-04-09

### Added

- **Embed SDK — policy enforcement**: VendorPolicy is now fully enforced at runtime.
  `EmbedRouteGuard` enforces route, module, tool, and `maxDifficulty` restrictions from the cert.
  `EmbedLayout` seeds the persona/region/industry stores from cert policy on mount (single source of
  truth). `PersonalizationSection` filters persona/region/industry pickers to cert-allowed values in
  embed mode. `verifySignature` clamps the URL `persona` param to cert-allowed personas.

- **Embed SDK — VendorPolicy X.509 format**: `certParser.ts` now reads a single JSON-encoded
  `VendorPolicy` object from OID `.1`, with backward-compatible fallback to the legacy 8-OID CSV
  format. `vendorRegistry.ts` auto-discovers vendor certs from `pki/vendors/*.pem` at build time.

- **Embed SDK — module/tool path validation**: `verifySignature` validates `/learn/<moduleId>` and
  `/playground/<toolId>` paths against cert `policy.routes.modules` / `policy.routes.tools` at
  verification time (Step 6). `EmbedRouteGuard` enforces the same restrictions at navigation time.

- **GA4 analytics — embed mode coverage**: New events `Embed / Session Start`, `Embed /
Verification Error`, `Embed / Route Blocked` (with `reason` label), `Embed / Policy Applied`
  wired to `main.tsx`, `EmbedRouteGuard`, and `EmbedLayout`. Captures vendor ID, kid, presets,
  test mode flag, and policy restrictions.

- **GA4 analytics — assessment wizard**: `Assessment / Start`, `Assessment / Step` (step
  number + label), `Assessment / Complete` (persona result), `Assessment / Reset` wired to
  `AssessWizard.tsx`.

- **GA4 analytics — persona/personalization**: `Persona / Selected` (with `picker`/`assessment`/
  `embed` source), `Persona / Region`, `Persona / Industry` wired to `PersonalizationSection.tsx`
  handlers.

- **GA4 analytics — module tab switches**: `Learning / Tab Switch` fires via `useSyncDeepLink` on
  every learn↔workshop tab change across all 51 PKI learning modules. Skips the initial mount to
  avoid counting deep-link navigations as user tab switches.

### Fixed

- **`EmbedVerificationError` TypeScript compile error**: `public readonly` constructor parameter
  shorthand rejected by `erasableSyntaxOnly` strict mode. Fields now declared explicitly.

- **`crypto.subtle.verify()` type error**: `Uint8Array<ArrayBufferLike>` not assignable to
  `BufferSource`. Fixed by passing `.buffer as ArrayBuffer`.

- **Pre-existing analytics test failures**: Three tests asserted `console.log/warn` output that
  analytics helpers silently suppress on localhost. Tests updated to assert `ReactGA` method calls.

- **`consoleLogSpy` unused variable lint error** in `analytics.test.ts`: Removed the unused spy
  after test assertions were corrected to not depend on console output.

## [2.96.0] - 2026-04-09

### Added

- **Embed SDK — vendor iframe integration**: New `/embed/*` route tree renders any app view inside a
  slim `EmbedLayout` (compact nav, no full-page shell) for embedding in third-party vendor iframes.
  Embed URLs are cryptographically signed with ECDSA P-256 and verified via X.509 vendor certificates
  (`@peculiar/x509`). Vendor registry supports dev/prod separation (`vendorRegistry.dev.ts`).

- **Embed SDK — persistence and auth**: `useEmbedPersistence` syncs all Zustand stores via
  `api` (REST) or `postMessage` modes. `useEmbedAuth` handles token refresh on `pqc:authExpired`
  events. `EmbedPersistenceService` provides three backends: `ApiPersistence`,
  `PostMessagePersistence`, `NoPersistence`.

- **Embed SDK — `PQCEmbed` JS client**: `public/embed/sdk.js` (ESM bundle) — drop-in vendor wrapper
  for bridging auth, snapshot load/save, events, and resize messages across the iframe boundary.
  Built via `npm run build:sdk` (esbuild, ES2020 target).

- **Service worker — embed COOP header**: `withCOIHeaders()` now sets
  `Cross-Origin-Opener-Policy: unsafe-none` for `/embed/*` paths (required for postMessage with
  parent frames) and `same-origin` everywhere else.

### Fixed

- **Safari blank page**: Embed verification imports (`@peculiar/x509`, `certParser`, vendor registry)
  are now lazy-loaded via dynamic `import()` only on `/embed/` paths, so they are never evaluated on
  normal page loads. Fixes Safari's strict ES module binding resolution that caused a blank page.

- **Safari `EmbedState` binding error**: `EmbedState`, `EmbedConfig`, `PqcMessage`,
  `IEmbedPersistenceService`, and `PersonaId` were imported as values; corrected to `import type`
  throughout the embed module tree.

- **Nested `<button>` in MobileThreatsList**: The outer card element was a `<button>` containing
  `EndorseButton` and `FlagButton` (also buttons). Replaced with a `<div role="button">` with
  `tabIndex={0}` and keyboard handler for full accessibility compliance.

- **Leader avatars — CORP violation**: `ui-avatars.com` images were blocked by
  `Cross-Origin-Embedder-Policy: require-corp` (the service doesn't set CORP headers). External
  avatar URLs are now stripped at data load time; components fall back to the local User icon.

- **CSP — `flagcdn.com` and `frame-ancestors`**: Added `https://flagcdn.com` to `img-src` (country
  flags in Assess step 2). Added `frame-ancestors *` to permit embedding in vendor iframes.

- **Analytics noise**: Removed `console.log` from `analytics.ts` (localhost detection, GA init,
  page view, event logging). Only the missing-ID warning remains.

- **`sdk.ts` memory leak**: `PQCEmbed.destroy()` was calling `.bind(this)` again, creating a new
  function reference that didn't match the registered listener. Bound function is now stored as an
  instance property so `removeEventListener` correctly removes it.

## [2.95.0] - 2026-04-08

### Added

- **EUDI Wallet — pluggable CryptoProvider architecture**: All Digital ID components (PID Issuer,
  Attestation Issuer, QES Provider, Relying Party, Wallet) now use a unified `CryptoProvider`
  interface instead of inline HSM/OpenSSL branching. Three implementations: `OpenSSLCryptoProvider`,
  `HsmCryptoProvider` (PKCS#11), and `DualCryptoProvider` (parallel execution of both). Factory
  function `getCryptoProvider()` selects the active backend.

- **EUDI Wallet — X.509 certificate generation**: New `generateX509Certificate()` utility produces
  self-signed X.509 v3 certificates (ES256/ES384) via `@peculiar/asn1-schema`, used by the
  Attestation Issuer and QES Provider for qualified certificate issuance.

- **EUDI Wallet — native CBOR encoding**: mDoc structures now use `cborg` for ISO 18013-5 compliant
  CBOR/COSE binary encoding. Added `cborg` v5.1.0 as a production dependency.

- **Entropy — HMAC_DRBG Architecture Demo**: Interactive SP 800-90A HMAC_DRBG lifecycle visualization
  with three phases (Instantiate → Generate → Reseed), real-time (K, V, reseed counter) state
  tracking, configurable entropy/nonce/personalization inputs, and action history log. Available as
  `drbg-demo` in the Playground workshop registry.

- **Entropy — danger-zone gauge arc**: The entropy gauge visualization now includes a visual
  "danger zone" arc highlighting sub-threshold entropy regions.

- **Entropy — QRNG "Simulated" badge**: The QRNG demo card now shows a "Simulated" badge to
  distinguish it from hardware-backed quantum random sources.

- **Deep linking — `?flow=` URL parameter**: `useModuleDeepLink` now parses and syncs a `?flow=`
  parameter, enabling direct navigation to specific sub-flows within modules (e.g., selecting a
  blockchain chain in Digital Assets via `?flow=btc`).

- **Digital ID E2E test**: New Playwright spec (`e2e/digitalid.spec.ts`) validates the Digital ID
  module rendering and PID issuance workflow.

### Changed

- **Playground workshop registry**: Removed `wip` flags from 7 tools now considered production-ready
  (Envelope Encrypt, Token Migration, TEE Channel, Firmware Signing, QRNG Demo, Entropy Test,
  Source Combining). Removed `hybrid-signing` tool (consolidated into PKILearning modules). Added
  `drbg-demo` tool.

- **PKCS#11 Log Panel**: Refactored to exclude `C_GetAttributeValue` from default display,
  reducing log noise. Added sticky column headers (Time, Function, Arguments, Return Value,
  Duration), increased max height to 500px, and improved chronological grouping (newest sections
  first).

- **Workshop HSM key tracking**: HybridEncryptionDemo, EnvelopeEncryptionDemo, and
  HSMKeyDerivationDemo now register intermediate derived secrets (ML-KEM decap, ECDH shared secret,
  HKDF output) into the HSM key registry for inspection.

- **EdDSA PKCS#11 bindings**: Added `buildEdDSAParams()` helper constructing `CK_EDDSA_PARAMS`
  (phFlag, context data) and `CKA_EC_PARAMS` OID attribute in EdDSA key generation templates.

### Fixed

- **`useModuleDeepLink` test suite**: Updated all 11 test expectations to include the new
  `initialFlow` field; added a `?flow=` parsing test.

### Data Sources

- **RAG corpus regenerated**: Updated to reflect new EUDI crypto provider content and DRBG demo.

## [2.94.2] - 2026-04-08

### Fixed

- **Rust WASM binary updated to v0.4.17**: The deployed `softhsmrustv3_bg.wasm` was built from
  v0.4.15 source (v0.4.16 updated constants in Rust source but never rebuilt the binary).
  The new binary, built with `wasm-bindgen 0.2.117`, correctly exposes `CKM_HASH_ML_DSA`,
  `CKM_HASH_SLH_DSA`, and `CKM_EDDSA_PH` in `C_GetMechanismList`. This also fixes the
  "Length out of range of buffer" crash in the VPN simulation cert generation flow — the
  v0.4.15 RSA `CKA_MODULUS` / `CKA_PUBLIC_EXPONENT` fix is now active in the production
  WASM binary.

### Changed

- **PKCS#11 Walkthrough removed from Playground**: The `pkcs11-sim` workshop entry has been
  removed from the registry.

### Internal

- **SBOM: `@pqctoday/softhsm-wasm` updated to v0.4.17**: Vendor `package.json` bumped;
  `wasm-bindgen` entry in About SBOM updated to v0.2.117.

## [2.94.1] - 2026-04-08

### Fixed

- **About page SBOM — softhsmv3 link and version updated to v0.4.16**: The softhsmv3 entry
  in the About page SBOM previously linked to v0.4.13 and the Rust WASM Bindings / Rust Crypto
  Crates sections showed v0.4.15. All three references now point to v0.4.16.

### Internal

- **SBOM: `@pqctoday/softhsm-wasm` updated to v0.4.16**: Synced vendor constants with
  softhsmv3 v0.4.16 release. New mechanism constants now available in-app:
  `CKM_HASH_ML_DSA` (base), `CKM_HASH_SLH_DSA` (base), `CKM_EDDSA_PH` (Ed25519ph),
  `CKM_SHA3_256`, `CKM_SHA3_256_HMAC`, `CKM_KMAC_128`, `CKM_KMAC_256`, plus all 10
  specific `CKM_HASH_ML_DSA_SHA*/SHAKE*` and `CKM_HASH_SLH_DSA_SHA*/SHAKE*` variants.
  TypeScript declarations in `constants.d.ts` updated to match.

## [2.94.0] - 2026-04-07

### Added

- **New SLH-DSA learning module** (`/learn/slh-dsa`): A dedicated 4-step module covering FIPS 205
  SLH-DSA end-to-end — WOTS+, FORS, and hypertree architecture (§3–5); all 12 parameter sets with
  the FIPS 205 §6 internal parameter table (n, h, d, h/d, a, k, lg_w, m); context strings for
  domain separation (§9.2); deterministic signing mode (§10); and a side-by-side comparison of
  LMS, XMSS, and SLH-DSA.

- **SLH-DSA Playground — context string support (FIPS 205 §9.2)**: The Sign & Verify tab now
  includes an optional context string field. The string is encoded as UTF-8 bytes (max 255 B) and
  bound to the signature — supplying a mismatched context at verify time returns
  `CKR_SIGNATURE_INVALID`. Only available in Pure SLH-DSA mode (not HashSLH-DSA).

- **SLH-DSA Playground — deterministic mode toggle (FIPS 205 §10)**: A new checkbox switches
  between randomized signing (`opt_rand` from RNG, default) and deterministic signing
  (`opt_rand = PK.seed`). Toggle it to observe: off = a new signature each click; on = the same
  bytes every time for the same (SK, M, context) triple. Pure SLH-DSA only.

- **SLH-DSA Playground — FIPS 205 §6 internal parameter table**: Expand the collapsible
  "FIPS 205 §6 internal parameters" row to see the full n/h/d/h′/a/k/lg_w/m values for the active
  parameter set with explanations of the -s (small signature) vs -f (fast signing) trade-off.

- **SLH-DSA — FIPS 205 §11 compliance labels on pre-hash options**: Pre-hash variants that are
  not approved for HashSLH-DSA by FIPS 205 §11 (SHA-384, SHA3-\*, SHA-224) are now labelled
  "(Non-FIPS 205)" in the dropdown. Selecting one shows an amber warning pointing to the four
  approved hashes: SHA-256, SHA-512, SHAKE-128, SHAKE-256.

- **KMS Envelope Encryption — three new KAT specs**: The KAT panel now includes an ML-KEM-512
  encap/decap round-trip test, an ML-KEM-1024 encap/decap round-trip test, and an ML-KEM-768
  decapsulation test against a NIST ACVP vector (FIPS 203 §7.2).

- **KMS Envelope Encryption — envelope blob hex viewer**: After running the demo, a new
  "Stored Envelope Blobs" section renders the raw hex of every blob the recipient would need to
  store: KEM ciphertext, wrapped DEK, and GCM nonce. Includes a one-click "Copy hex" button for
  each blob.

- **PKCS#11 v3.2 hedge variant constants**: `CKH_HEDGE_PREFERRED` (0x00), `CKH_HEDGE_REQUIRED`
  (0x01), and `CKH_DETERMINISTIC_REQUIRED` (0x02) are now exported from the vendor constants
  module alongside `CK_SIGN_ADDITIONAL_CONTEXT_SIZE` (12 B) for correct WASM buffer allocation.

- **SLH-DSA Playground — SHA-2 vs SHA-3 hardware hint**: The parameter set info panel now shows
  a one-line note explaining when to prefer SHA-2 variants (no SHA-3 hardware) vs SHA-3/SHAKE
  variants (with acceleration).

### Fixed

- **KMS Envelope Encryption — HKDF salt now follows SP 800-56C Rev 2 §4.1**: The wrapping key
  derivation previously omitted the HKDF salt (`undefined`). It now uses a fixed 32-byte salt
  (`"kms-envelope-salt-v1"` right-padded to 32 B), meeting the SP 800-56C requirement that the
  salt length is ≥ the hash output length (SHA-256 → 32 B). Both the encapsulation and
  re-derivation paths use the same salt.

- **SLH-DSA Workshop — `C_GetAttributeValue` removed from live PKCS#11 log**: The logging proxy
  now bypasses `C_GetAttributeValue` so internal attribute reads no longer appear as operations in
  the step-by-step log, reducing noise.

- **SLH-DSA Stateful Signatures Workshop — prehash options unified with Playground**: The
  dropdown now reuses `PREHASH_OPTIONS` from `SoftHsmUI`, eliminating a duplicate list that could
  drift out of sync.

- **Playground — default engine in URL state changed from `cpp` to `rust`**: The URL param is now
  omitted when the engine is `rust` (the default) and written when it differs, preventing stale
  `?engine=cpp` links from appearing in shared URLs.

- **VPN Simulation and Token Setup panels migrated to Rust WASM module**: `VpnSimulationPanel`,
  `TokenSetupDemo`, and `algorithmEngineResolver` all now use `getSoftHSMRustModule()` instead of
  `getSoftHSMCppModule()`, consistent with the rest of the Playground.

- **HsmSetupPanel label corrected**: The subtitle now reads "SoftHSMv3 Rust WASM · OpenSSL 3.6 ·
  PKCS#11 v3.2" (was "SoftHSM3 WASM").

### Internal

- **softhsmv3 Rust WASM** — updated C++ WASM module (`softhsm.js`) and Rust glue
  (`softhsmrustv3_bg.js`). New PKCS#11 v3.2 functions: `_C_GetSessionValidationFlags`,
  `_C_AsyncJoin`, `_C_AsyncGetID`, `_C_AsyncComplete`, `_C_MessageEncryptInit/Final`,
  `_C_MessageDecryptInit/Final`, `_C_VerifySignatureInit/Update/Final/FinalWithSignature`, and
  `_set_kat_seed`. Parameter names in `C_InitToken`, `C_Login`, `C_OpenSession`, `C_GetSlotList`
  changed from `_`-prefixed stubs to real names, reflecting full Rust implementation.

- **`index.d.ts` trailing-comma cleanup**: All parameter lists now use trailing commas for
  consistent Prettier formatting. `_C_CreateObject` and `_C_FindObjects` reformatted to multi-line.

- **SLH-DSA workshop link updated in Playground registry**: The SLH-DSA Sign & Verify tool now
  links to the new `/learn/slh-dsa` module (was `/learn/stateful-signatures`) and the `wip: true`
  flag is removed — the tool is production-ready.

### Data Sources

- **RAG corpus regenerated** to include the new SLH-DSA module content.

## [2.93.0] - 2026-04-07

### Added

- **PKI Workshop now in the Playground**: You can now launch the full PKI certificate chain
  workshop (CSR → Root CA → Sign → Parse → CRL) directly from the Playground's "Certificates &
  Proofs" tab — no need to navigate to the Learn module.

- **Bitcoin Flow — quantum threat warning on public key export**: When you export your Bitcoin
  public key (Step 2), an amber warning now explains the "harvest now, decrypt later" (HNFL)
  risk: once your public key is visible on-chain, a future quantum computer could derive your
  private key and forge transactions. Spend addresses are most exposed.

- **Bitcoin Flow — clearer address and transaction explanations**: The address derivation steps
  now call out the mainnet vs testnet version bytes (`0x00` vs `0x6f`). The transaction step
  explains the Bitcoin UTXO model — why transactions consume full outputs and return change.

- **HD Wallet Flow — expanded to 5 steps with live derivation tree**: The HD Wallet module now
  walks through five steps: generate a mnemonic, derive the root seed, compare hardened vs
  non-hardened key derivation live, derive addresses for Bitcoin/Ethereum/Solana, and assess the
  quantum threat surface of the whole wallet stack. Step 4 shows an inline ASCII derivation tree
  displaying the BIP-44 path and truncated live addresses for all three chains.

- **HD Wallet Flow — hardened vs non-hardened live demo (Step 3)**: A side-by-side known-answer
  test shows exactly how hardened derivation (using the parent private key in HMAC-SHA512) differs
  from non-hardened derivation (using the parent public key). Includes an Ed25519 enforcement
  check — Solana wallets can only use hardened paths.

- **Solana Flow — explains how real wallet apps derive keys**: Step 1 now explains how Phantom,
  Solflare, and other Solana wallets actually work: BIP-39 mnemonic → PBKDF2 seed → SLIP-0010
  hardened derivation at `m/44'/501'/0'/0'`. The demo generates the same Ed25519 seed directly
  via the HSM; all signing steps from there are identical to a real wallet.

- **Solana Flow — Ed25519 public key format explained**: Step 2 now explains that the HSM returns
  the public key wrapped in a DER/SPKI envelope (not raw bytes), and why PKCS#11 v3.2 requires
  this format for portability across hardware vendors. The raw 32-byte key is extracted from the
  end of the structure.

- **CRL Generator — revocation reasons and human-readable output**: The CRL generator now lets
  you choose from all 8 RFC 5280 revocation reason codes (e.g. keyCompromise, superseded,
  cessationOfOperation) when revoking a certificate. The output panel shows both the PEM and a
  parsed human-readable view side-by-side.

- **PKI Workshop — NIST security level shown next to algorithm picker**: When selecting an
  algorithm in Root CA Generator, the selector now shows the corresponding NIST security level
  (e.g. "NIST Level 3 — ~AES-192 security") so you know what protection level you're choosing.

- **PKI Workshop — ML-DSA and SLH-DSA labels updated to final standard names**: Algorithm labels
  previously said "(Dilithium)" — they now say "(FIPS 204)" and "(FIPS 205)" to reflect the
  final published NIST standards.

- **Cert Parser — fingerprint, CSR verify, and CRL verify**: The certificate parser now computes
  a SHA-256 fingerprint for any loaded certificate. It also verifies CSR self-signatures and
  validates CRL signatures against a Root CA from your session — with auto-detection of whether
  the pasted input is a certificate, CSR, or CRL.

- **Hybrid Cert Formats — generated PEMs flow into Cert Parser and OpenSSL Studio**: After
  generating a hybrid certificate (SLH-DSA, ML-DSA, composite, or dual), the PEM file is
  automatically added to the OpenSSL Studio virtual filesystem. You can immediately paste it into
  Cert Parser or use it in OpenSSL Studio without any copy-paste.

- **New in-app glossary tooltips for Solana transaction concepts**: Added tooltips for Program-
  Derived Addresses (PDA), fee payers, the System Program, compact-u16 encoding, ECDSA nonce
  risks, and DER signature encoding — inline wherever these concepts appear in the flows.

- **Blockchain Playground tools marked production-ready**: The "WIP" badge has been removed from
  Bitcoin Transaction, Solana Transaction, and HD Wallet in the Playground. All three flows are
  fully functional.

### Fixed

- **PKCS#11 log panel — step header now appears above its commands**: Previously the log was
  strictly newest-first, which put the step label below the calls that belonged to it. Each step's
  header now correctly leads its group of commands, while newer steps still appear at the top.

- **Step results accumulate newest-first**: Results shown after completing each step were
  appending below older results (oldest at top). They now prepend above, matching the log panel
  and making the most recent output the first thing you see.

- **TLS comparison table — ML-DSA-65 signature size corrected**: The algorithm size table in TLS
  Basics was showing 3,293 B for ML-DSA-65 signatures. The correct FIPS 204 value is 3,309 B.

- **TLS Introduction — SLH-DSA-SHA2-128s signature size now shows exact byte count**: The
  description now reads "~7.9 KB (7,856 B)" rather than just the approximate figure.

- **TLS Handshake Diagram — removed misplaced encryption boundary marker**: The "Encrypted from
  here" label was positioned incorrectly relative to the actual TLS handshake message sequence
  and has been removed to avoid teaching the wrong concept.

- **Internal: PKCS#11 `CKA_PUBLIC_KEY_INFO` constant corrected**: The attribute code was set to
  `0x248` instead of the correct `0x129` per the PKCS#11 v3.2 specification. This affected public
  key retrieval for Ed25519 keys in the Bitcoin and Solana flows.

## [2.90.0] - 2026-04-07

### Added

- **MTC Workshop — shared tree state across Steps 1→2→3**: Steps 1, 2, and 3 now share a
  continuous Merkle tree. When a tree is built in Step 1, `MerkleWorkshopSteps` captures it via
  `onTreeBuilt` callback and passes `sharedLevels`/`sharedCerts` to both `InclusionProofGenerator`
  (Step 2) and `ProofVerifier` (Step 3). Each step shows a "Your tree from Step 1 is loaded"
  callout and adapts its button label (e.g. "Build Tree with 8 Certificates from Step 1"). Steps
  fall back to 8 sample certificates when no prior tree is present.
- **MTC Workshop — Landmark MTC column in Step 4 size comparison**: `SizeComparison` now shows a
  third column alongside Traditional X.509 and Standalone MTC — Landmark MTC (proof + metadata
  only, zero embedded signatures). Includes reduction badge for both standalone and landmark modes.
- **MTC Workshop — Step 4→5 bridge text**: `SizeComparison` description now ends with "In Step 5,
  you'll see the CA sign a real Merkle root with ML-DSA-44 — that single signature is what makes
  these size savings possible." `CTLogSimulator` adds a "Bringing it together" paragraph at the top
  of the Submission panel connecting Steps 1–4 to the live PKCS#11 signing demo.
- **MTC Workshop — production-use context in ProofVerifier**: Added explanatory sentence that in
  the MTC model the inclusion proof is embedded in the certificate and used by relying parties to
  verify batch inclusion without downloading the full tree.
- **MTC Workshop — padding divergence disclosure**: `MerkleTreeBuilder` now shows an amber callout
  when the leaf count is not a power of two, explaining the simplified duplicate-last-leaf padding
  vs. RFC 9162 §2.1.2's unbalanced binary tree and noting the root hashes will differ.
- **MTC — Landmark MTC functions in `mtcConstants.ts`**: Added `mtcLandmarkChainSize()`,
  `landmarkReductionPercent`, `mtcLandmark`, and `mtcLandmarkTotal` fields to `SizeBreakdown`
  and `getSizeBreakdown()`. `mtcChainSize()` now accepts an optional `proofBytes` parameter.

### Fixed

- **MTC Workshop — KAT signing spec corrected**: `MerkleTreeBuilder` KAT for tree-root signing
  was incorrectly referencing SLH-DSA (FIPS 205). Fixed to ML-DSA-44 (FIPS 204) with
  `kind: { type: 'mldsa-functional', variant: 44 }` — matching the actual CT Log simulator which
  signs with ML-DSA-44 via SoftHSMv3.
- **MTC Workshop — ECDSA standalone savings corrected**: Static text in `MTCExercises` and
  `rag-summary.md` now correctly states ~3% standalone savings for ECDSA P-256 (was incorrectly
  ~15% after a prior round of fixes). Arithmetic: traditional 1,225 B → standalone 1,193 B = 2.6%.
- **MTC Workshop — SCT count and traditional total corrected**: `MTCIntroduction` static table
  footnote corrected from "4 SCTs (476 B)" to "2 SCTs (238 B)". Traditional ML-DSA-44 total
  corrected from 12,272 B to 12,034 B throughout all static text.
- **MTC Workshop — ML-DSA-44 savings corrected to 60%**: All static text references ("61%",
  "62%") unified to 60% matching `getSizeBreakdown()` output.
- **MTC Workshop — `PROOF_VERIFIER_CERTS` stabilised with `useMemo`**: The derived cert list in
  `ProofVerifier` was recomputed as a new array reference on every render, causing `handleSetup`
  (which had it in its `useCallback` deps) to be recreated unnecessarily. Wrapped in `useMemo`.
- **MTC Workshop — "Step 1 — Generate CA Key" label conflict**: Label inside `CTLogSimulator`
  SubmissionPanel renamed to "Generate CA Key" to avoid collision with the workshop's global Step 1.
- **MTC Workshop — CA key label now includes size**: `CTLogSimulator` registers the CA public key
  with label "CT Log CA Public Key (ML-DSA-44, 1,312 B)" in the key inspector.
- **MTC Workshop — Step 1 stats bar clarified**: Bar label updated to "3× ML-DSA-44 Sigs (sig
  bytes only)" and footnote updated to direct users to Step 4 for the full chain breakdown.
- **MTC Workshop — draft status disclosed**: `MTCIntroduction` IETF section now includes an amber
  "Draft — not yet an RFC" badge and a timeline note: "Status: Active IETF draft — not yet
  standardized as an RFC. Not recommended for production deployment without vendor support."

## [2.89.5] - 2026-04-07

### Fixed

- **Playground — 5G SUCI Profile C hybrid mode URL sync**: Profile C now always sets
  `?pqcMode=hybrid` explicitly in the URL (previously omitted, causing the Hybrid button
  to appear unselected). All four states now have fully explicit URLs:
  - `/playground/suci-flow?profile=A` — Profile A
  - `/playground/suci-flow?profile=B` — Profile B
  - `/playground/suci-flow?profile=C&pqcMode=hybrid` — Profile C hybrid
  - `/playground/suci-flow?profile=C&pqcMode=pure` — Profile C pure PQC
- **Playground — fixed race condition on Profile C switch**: `changeProfile('C')` was
  calling both `onProfileChange` and `onPqcModeChange`, triggering two concurrent
  `setSearchParams` calls that could race and revert the profile update. Suppressed
  the second call — `handleProfileChange` in `SuciFlowRoute` atomically sets both
  `profile=C` and `pqcMode=hybrid` in a single update.
- **Playground — SuciFlow pqcMode state sync**: Added `useEffect` in `SuciFlow` to
  keep internal `pqcMode` in sync with the `initialPqcMode` prop when the same component
  instance is reused across profile switches (React key reuse).
- **Playground — SuciFlowRoute extracted to dedicated file**: Moved inline `SuciFlowRoute`
  out of `workshopRegistry.tsx` lazy callback into `src/components/Playground/SuciFlowRoute.tsx`,
  fixing hook instability under React StrictMode.

## [2.89.4] - 2026-04-07

### Fixed

- **Playground — 5G SUCI URL stays in sync when switching profiles/modes**: `SuciFlowRoute`
  now uses `useSearchParams` to both read initial values and write back changes via
  `onProfileChange` / `onPqcModeChange` callbacks. Switching Profile A→B→C updates
  `?profile=` in the URL in real time. Profile A (default) keeps a clean URL with no
  param. `pqcMode=pure` is written only when Profile C pure is active; hybrid (default)
  removes the param. All changes use `replace: true` to avoid polluting browser history.

## [2.89.3] - 2026-04-07

### Fixed

- **Playground — suci-flow deep-link actually works now**: `suci-flow` was registered
  in `ONBACK_COMPONENTS` via `makeLazyWithOnBack`, whose `WorkshopWrapper` only forwards
  `onBack` — dropping `initialProfile` and `initialPqcMode`. Moved `suci-flow` to
  `TOOL_COMPONENTS` as a self-contained `SuciFlowRoute` wrapper that reads `?profile=`
  and `?pqcMode=` from the URL directly and passes them to `SuciFlow`.

## [2.89.2] - 2026-04-07

### Added

- **Playground — 5G SUCI deep-link profile/pqcMode support**: `PlaygroundToolRoute`
  now reads `?profile=` and `?pqcMode=` from the URL and passes them to `SuciFlow`
  as `initialProfile` / `initialPqcMode`. Direct URLs now work from Playground:
  - `/playground/suci-flow` → Profile A (default)
  - `/playground/suci-flow?profile=B` → Profile B
  - `/playground/suci-flow?profile=C` → Profile C hybrid
  - `/playground/suci-flow?profile=C&pqcMode=pure` → Profile C pure PQC

## [2.89.1] - 2026-04-07

### Fixed

- **5G SUCI — deep-link URL now actually updates in the browser**: `getModuleDeepLink`
  was called without `validTabs`, so the default list contained `'workshop'` instead
  of `'simulate'`. A direct load with `?tab=simulate&profile=C` fell back to `'learn'`,
  leaving `activeTab !== 'simulate'` and suppressing the URL sync effect. Fixed by
  passing the correct `validTabs` array explicitly.

## [2.89.0] - 2026-04-07

### Fixed

- **5G SUCI — Profile C pure PQC no longer shows hybrid code snippets**: Step 1
  (Home Network Key Generation) and Step 5 (Compute Shared Secret) now display
  pure-PQC-specific code when `pqcMode === 'pure'`. Step titles are also patched
  to reflect the pure mode context. The static `SUCI_STEPS_C` array defaults to
  hybrid; overrides are applied in `SuciFlow` at the step-mapping layer.

### Added

- **5G SUCI — deep-link URL encodes profile and pqcMode**: The URL now reflects
  the active profile and PQC mode when on the SUCI Workshop tab:
  - Profile A: no `?profile=` param (default)
  - Profile B: `?tab=simulate&profile=B`
  - Profile C hybrid: `?tab=simulate&profile=C`
  - Profile C pure PQC: `?tab=simulate&profile=C&pqcMode=pure`
    Navigating to any of these URLs restores the correct profile and mode
    immediately. The Share button picks up the live URL, so shared links land
    directly on the right profile/mode combination.

## [2.88.0] - 2026-04-07

### Fixed

- **VPN Simulation — C_CloseSession and C_Verify now emit RPC log entries**: The IKEv2 responder
  thread previously dispatched no log for `C_CloseSession` (cmd 13) or `C_Verify` (cmd 49); both
  now call `strongSwanEngine.dispatchLog` so the RPC trace is complete. `C_Verify` log level is
  `error` when `rv !== 0` for immediate visibility of failed signature checks.

- **VPN Simulation — PKCS#11 log panel no longer shows bookkeeping operations**: `C_GetAttributeValue`,
  `C_Finalize`, `C_Logout`, and `C_FindObjectsFinal` are now filtered from the HSM log panel via a
  `VPN_LOG_SKIP` set. These are internal plumbing calls with no educational value; key-extraction
  detail is already captured in the crypto-op log entries above.

### Data

- **Compliance — ANSSI catalog re-scraped**: `compliance-data.json` refreshed (2,386 records); ANSSI
  catalog hash updated to reflect the latest product catalog state.

- **RAG corpus updated**: 5,818 chunks (was 5,817).

## [2.87.0] - 2026-04-07

### Added

- **5G SUCI — Profile B (P-256) dedicated step content**: Profile B now has its own `SUCI_STEPS_B`
  constant with step titles, descriptions, and code snippets tailored to P-256 (secp256r1) —
  previously it displayed Profile A (X25519) labels throughout.

- **5G SUCI — Profile B compressed key encoding**: The scheme output for Profile B now uses the
  33-byte COMPRESSED P-256 ephemeral public key (02/03 prefix + x-coordinate) per TS 33.501
  Annex C.4, down from 65 bytes. ECDH inside the HSM still uses the full uncompressed form.

- **5G SUCI — educational content: compressed vs uncompressed EC point encoding**: Steps 9, 10
  and terminal output for Profile B now show both encoding forms side by side, explaining when each
  is used and why. Includes the application-layer compression formula (no `C_CompressECPoint` in
  PKCS#11) and how the SIDF recovers y via the P-256 curve equation y²=x³−3x+b (mod p).

- **5G SUCI — PKCS#11 mechanism accuracy**: Code snippets for all X25519 operations now correctly
  cite `C_DeriveKey(CKM_EC_MONTGOMERY_KEY_DERIVE)` per PKCS#11 v3.2, distinguishing it from
  `CKM_ECDH1_DERIVE` which applies to Weierstrass curves (P-256/P-384). Affected: Profile A
  step 5, Profile A step 11, Profile C hybrid steps 5 and 11.

### Fixed

- **5G SUCI — profile transitions always reset to step 1**: Switching between Profile A → B → C
  (hybrid) → C (pure) now lands on step 1 each time. The `useStepWizard` hook gained a `reset()`
  method called at all transition sites (onClick handlers and `onComplete`).

- **5G SUCI — profile state set before every step executes**: `fiveGService.state.profile` is now
  assigned at the top of every `executeStep` call, preventing `computeMAC` and
  `visualizeStructure` from seeing a stale or undefined profile on early steps.

- **5G SUCI — B→C transition no longer double-cleans**: `changeProfile('C')` now internally sets
  `pqcMode` to `'hybrid'`, so `onComplete` can call it once without a redundant `changePqcMode`.

## [2.85.0] - 2026-04-07

### Added

- **5G SUCI — Profile C visualization corrected**: The SUCI structure panel now correctly shows
  the hybrid Profile C output format — the scheme output starts with the ML-KEM ciphertext, not
  an ephemeral key. The abbreviated SUCI string and description both reflect the actual
  `kemCiphertext ‖ msinCiphertext ‖ macTag` layout per 3GPP TS 23.003.

- **Library — 3 new records with proper titles and download links**:
  - _Study of Post Quantum Status of Widely Used Protocols_ (Cisco Research, arXiv 2603.28728, Mar 2026) — PQC migration survey across TLS, IPsec, BGP, DNSSEC, SSH, QUIC, OpenID Connect, OpenVPN, and Signal.
  - _Securing Elliptic Curve Cryptocurrencies against Quantum Vulnerabilities_ (Google Quantum AI + Ethereum Foundation, Mar 2026) — new resource estimates for breaking secp256k1 with a quantum computer; on-spend attack analysis.
  - _Protecting Subscriber Identifiers with SUCI_ (NIST CSWP 36A ipd, Aug 2024) — NIST guidance on enabling 5G subscriber identity concealment to prevent IMSI-catching.

- **5G SUCI — removed WIP badge**: The 5G SUCI Construction tool is now complete and no longer
  marked as Work in Progress in the Playground.

### Fixed

- **5G SUCI — HSM and OpenSSL cross-check now agree on key derivation**: The dual-engine
  comparison was previously using different ephemeral key bytes for the KDF — the HSM used its
  internal EC point while OpenSSL used an SPKI-wrapped version. The HSM key bytes are now synced
  into the shared state before derivation runs, so both engines produce matching output.

- **HSM — AES-GCM per-message encrypt/decrypt enabled on Rust engine**: The per-message AEAD
  functions (`C_MessageEncryptInit`, `C_EncryptMessage`, etc.) are now fully wired to the Rust
  WASM engine, which implements them in softhsmv3 v0.4.10. Previously they returned an error.

## [2.84.0] - 2026-04-07

### Added

- **VPN Simulation — SKEYSEED key derivation step**: After the ML-KEM shared secret is verified,
  a new panel shows exactly how IKEv2 derives the session master key (SKEYSEED) — using
  `prf(Ni ‖ Nr, shared_secret)` with the actual KEM secret bytes displayed. Pure-PQC and hybrid
  modes each show their respective PRF inputs. References RFC 9370 and the ML-DSA IKEv2 draft.

- **VPN Simulation — IKE exchange phase labels on logs**: Each line in the charon.log panel is now
  tagged with its IKE exchange phase (SETUP / IKE_SA_INIT / IKE_INTERMEDIATE / IKE_AUTH). This
  makes it easy to see where ML-KEM fits into the handshake — encapsulation happens during
  IKE_INTERMEDIATE in hybrid mode, IKE_SA_INIT in pure-PQC mode.

- **VPN Simulation — payload size note**: A callout explains that PQC key exchange payloads are
  10–16× larger than classical ECDH (ML-KEM-768 public key: 1,184 bytes vs P-256: 64 bytes),
  and why IKEv2 uses the IKE_INTERMEDIATE exchange to handle the extra fragmentation load.

- **VPN Simulation — QKD toggle clarified**: The QKD PSK option now shows
  "(informational — not simulated)" so it is clear this is a display label, not an active feature.

### Fixed

- **5G SUCI — dual-engine comparison uses real HSM output**: The encrypted MSIN and MAC tag
  shown in the comparison panel now come directly from the HSM rather than the parallel
  OpenSSL computation, giving an accurate side-by-side result. The MAC tag is correctly
  truncated to 8 bytes per 3GPP TS 33.501.

- **5G SUCI Profile C — KEM ciphertext carried forward correctly**: The HSM-produced ML-KEM
  ciphertext is now stored in the shared state after the key encapsulation step, so downstream
  SUCI assembly and visualization use the real ciphertext.

- **Stateful Signatures — default message aligned across panels**: Both the XMSS key generation
  demo and the Stateful Signatures workshop now default to `"Hello, world!"`, making cross-engine
  verification work without any manual input change.

## [2.83.0] - 2026-04-07

### Added

- **VPN Simulation — full IKEv2 + ML-KEM-768 handshake working end-to-end**: The VPN simulator
  now completes a real PKCS#11-based ML-KEM-768 key encapsulation through the HSM, including
  key generation, encapsulation, shared secret extraction, and SKEYSEED derivation. This is the
  first full IKEv2 post-quantum handshake running entirely inside the browser HSM.

### Fixed

- **VPN Simulation — engine stability**: Switched back to the C++ HSM engine for VPN simulation
  after finding that the Rust WASM engine has compatibility issues in the browser's secure context
  that prevent it from running correctly in this scenario.

- **HSM — encapsulation bug fixed in softhsmv3**: A bug in the C++ HSM engine caused key
  encapsulation to return an error when reading standard key attributes. The WASM binary has been
  updated with the fix.

- **HSM — 8 additional Rust engine functions now active**: Pre-bound signature verification
  (`C_VerifySignatureInit/Final/Update`) and PKCS#11 v3.2 session functions that were previously
  disabled are now fully wired to the Rust engine.

## [2.82.0] - 2026-04-06

### Added

- **5G SUCI — 3GPP TS 33.501 reference vectors modal**: A "Reference Vectors" button on the SUCI
  flow panel opens an expandable modal with the official 3GPP TS 33.501 Annex C.4 test vectors
  for Profile A (X25519) and Profile B (P-256) — including home network keys, ephemeral keys,
  scheme output breakdown (EphPub ‖ Ciphertext ‖ MAC), and copyable hex fields.
- **Profile C hybrid mode — full TR 33.841 §5.2.5.2 implementation**: Hybrid Profile C now
  generates two separate HN keypairs (ML-KEM-768 + X25519), derives Z_ecdh via ECDH and Z_kem
  via ML-KEM encapsulation, then combines them as `Z = SHA256(Z_ecdh ‖ Z_kem)` inside the HSM
  using `C_Digest`. Key derivation uses ANSI X9.63-KDF with SHA3-256 producing AES-256 + HMAC-SHA3-256 keys.
- **Stateful Signatures — cross-engine sign and verify**: The Stateful Signatures workshop can now
  sign on the Rust engine and verify on the C++ engine. Public key bytes are cached at generation
  time, imported into the C++ session via `C_CreateObject`, and verified with `C_VerifyInit` /
  `C_Verify`. Includes tamper-detection toggles (flip message / flip signature) and a live
  verification result indicator.
- **VPN Simulation — RSA-3072 certificate generation and inspection**: The VPN panel now generates
  a real RSA-3072 key pair via the HSM, constructs a TBS certificate using `@peculiar/asn1-x509`,
  signs it with `C_Sign` (SHA256withRSA), and shows a certificate inspector modal with full field
  breakdown. A warning badge notes that RSA-3072 is classical (not quantum-safe) per
  draft-ietf-ipsecme-ikev2-mldsa.

### Changed

- **5G SUCI — spec-correct ANSI X9.63-KDF replaces HKDF**: Key derivation now follows 3GPP TS
  33.501 §C.3.3 exactly — `block1 = SHA-256(Z ‖ 0x00000001 ‖ sharedInfo)`,
  `K_enc = block1[0:16]`, `K_mac = block1[16:] ‖ block2[0:16]`. HKDF was never in the 3GPP spec.
- **5G SUCI — AES-128-CTR with zero IV (was AES-GCM)**: MSIN encryption now uses AES-128-CTR per
  TS 33.501 §C.3.3 with a zero 16-byte IV. BCD encoding (nibble-swap per TS 23.003) applied to
  MSIN digits before encryption.
- **5G SUCI — authenticate-then-decrypt at SIDF**: The SIDF decryption step now verifies the
  MAC before decrypting — SUCI is rejected if the tag does not match. MSIN BCD decoding and
  full SUPI reconstruction are shown in the result panel.
- **HSM slot initialization — reuses existing slot on conflict**: The HSM context no longer
  crashes with "no free slot" when all slots are already initialized (e.g. Playground page
  reopened without reload). It now falls back to the first initialized slot automatically.
- **softhsmv3 WASM updated**: C++ engine (v0.4.8+) and Rust engine rebuilt with latest
  softhsmv3 changes.

## [2.81.1] - 2026-04-06

### Fixed

- **VPN Simulation works on the live site**: The VPN simulation panel was showing "SharedArrayBuffer disabled" and blocking the simulation on the production deployment. Fixed by injecting the required Cross-Origin Isolation headers through the PWA service worker — the simulation now works in Chrome and Edge with no action required from users. (Safari is not affected; this was a Chrome/Edge-only production issue.)

## [2.81.0] - 2026-04-06

### Added

- **Download hybrid certificates**: Each certificate card in the Hybrid Cryptography workshop now has a download button alongside the copy button. Save the certificate as a `.pem` file or as a `.txt` file depending on the active view.

### Changed

- **5G SUCI flow matches the real spec**: The SUCI encryption and MAC steps now correctly reuse key material derived in the HKDF step, matching 3GPP TS 33.501. The key family label was corrected from "ML-KEM (Kyber)" to "ML-KEM (FIPS 203)".
- **Envelope Encryption — accurate sizes and wrap overhead**: The PQC column always shows correct ML-KEM reference sizes regardless of which key-encryption algorithm is selected. AES-KWP wrap overhead corrected to 48 bytes (per RFC 5649 §4.2).
- **Bitcoin Playground — pure HSM path**: The Bitcoin key derivation flow no longer relies on OpenSSL — all operations now run entirely through the in-browser PKCS#11 HSM.
- **Firmware Signing wizard**: The Firmware Signing step wizard now uses the same step-wizard UI pattern as other workshops for a consistent experience.
- **Key Derivation panel labels**: KBKDF entries now include the spec revision date ("SP 800-108 Rev1 (Aug 2022)"); PBKDF2 use-case description updated to "low-entropy key stretching".

### Data

- **RAG corpus regenerated**.

## [2.80.0] - 2026-04-05

### Added

- **Algorithm region and status filters**: Filter PQC algorithms by geopolitical region (NIST/US, IETF/Global, BSI/ANSSI/Europe, ETSI, KpqC/Korea, CACR/China) or certification status (Certified, Candidate, To Be Checked). Region and Status columns added to the algorithm comparison table. Multivariate and Isogeny families added to the crypto-family filter.
- **Algorithm implementations**: A code icon on each algorithm card opens a list of open-source reference implementations and libraries, with direct links to Migrate catalog entries and Library references.
- **Work-in-progress badges on Playground tools**: Tools currently under development show an orange Wrench badge. WIP tools are hidden by default — use the new WIP filter to show or exclusively view them.
- **Migrate WIP filter**: Products currently under review are hidden by default in the Migrate catalog. A new WIP filter lets you include or exclusively show them.
- **XMSS deterministic keygen test**: A known-answer test (KAT) for XMSS-SHA2_10_256 verifies that key generation is fully reproducible — the same seed always produces the same key pair.

### Changed

- **VPN Simulation — isolated HSM slot management**: VPN slot initialization is now independent of other HSM panels, preventing conflicts when multiple Playground tools are open simultaneously.
- **Hybrid Encryption Demo**: Redesigned from a tab-based UI to a guided 5-step wizard for a clearer, more linear walkthrough.
- **SLH-DSA sign panel**: Streamlined interface — pre-hash mechanism labels, PKCS#11 log, and key inspector are now shown inline without extra navigation.

### Removed

- **Standalone SLH-DSA demo**: Removed a duplicate SLH-DSA demo that was redundant with the unified HSM Sign & Verify panel.

### Data

- New algorithm reference data with Region and Status fields.
- New algorithm implementations cross-reference.
- RAG corpus regenerated.

## [2.79.0] - 2026-04-05

### Fixed

- **Stateful Signatures workshop — key generation no longer crashes**: LMS and XMSS key generation was hitting an internal error. Both now use the Rust WASM engine, which handles these algorithms correctly.

## [2.78.0] - 2026-04-05

### Added

- **VPN simulation — all crypto through the in-browser HSM**: ECDH key exchange and random number generation during the IKEv2 handshake now run entirely through the in-browser SoftHSMv3 PKCS#11 module. OpenSSL is no longer used for IKE crypto — every cryptographic operation is visible in the PKCS#11 log.
- **Complete LMS/LMOTS parameter support**: Expanded from 9 to the full IANA registry — 20 LMS parameter sets and 16 LMOTS parameter sets, covering all SHA-256, SHA-256/24, SHAKE, and SHAKE/24 variants with correct signature size tables.

### Fixed

- **LMOTS W4 signature size lookups corrected**: The wrong constant value for the W4 Winternitz parameter was causing incorrect signature size calculations. Fixed to match the IANA registry.

### Data

- RAG corpus regenerated.

## [2.77.0] - 2026-04-05

### Added

- **VPN Simulation with ML-KEM-768**: A complete IKEv2 handshake now runs entirely in your browser — no server required. Two Web Worker instances of strongSwan 6.0.5 (initiator and responder) negotiate a post-quantum secure tunnel using ML-KEM-768 key exchange, completing IKE_SA_INIT and IKE_AUTH across 4 packets. Watch every PKCS#11 call, packet exchange, and key agreement step in real time.
- **Configurable VPN pre-shared key**: Set your own PSK for both the client and server sides. A mismatch warning appears when the keys differ, mirroring what happens in a real IKEv2 deployment when authentication fails.
- **Stateful Hash-Based Signatures Workshop**: LMS, HSS, and XMSS key generation and signing now run through the in-browser PKCS#11 HSM. Remaining signature capacity is tracked live — H5 trees are limited to 32 signatures, matching the real-world constraint on stateful schemes.

### Fixed

- **VPN simulation no longer crashes on start**: Fixed a threading incompatibility in the strongSwan WASM build that caused an "Unreachable" crash in single-threaded Emscripten mode.

### Data

- **strongSwan product entry updated**: ML-DSA experimental support added with 5 verified source URLs. Validation status: VALIDATED.
- **RAG corpus regenerated**.

## [2.76.0] - 2026-04-02

### Added

- **Collapsible Analysis section in the Gantt chart modal**: Clicking a Gantt bar now shows an "expand ▾ / collapse ▴" toggle when enrichment data is available. The collapsed state shows the main topic with mandate/urgency/sector badges; expanding reveals the full `TimelineAnalysisPanel` with all 8 enrichment dimensions. The panel resets to collapsed whenever a new bar is opened.

### Changed

- **Unified bookmark icon across all pages**: All "My" toggle buttons (Library, Compliance, Threats, Playground, Timeline, Migrate) now use `BookmarkCheck` (active) and `Bookmark` (inactive) from lucide-react, replacing the former `CheckSquare`/`Square` pattern for a consistent metaphor throughout the app.
- **Migrate catalog table cleanup**: Removed the redundant "My" and "Hide" columns from the table view. The Bookmark column now drives the "My" filter (same `useMigrateSelectionStore`), so bookmarking a product in the table immediately adds it to the My selection. The Compare column was updated to use the `Scale` icon.
- **My filter connected to bookmark store (Migrate)**: The bookmark action in both the card grid and the table now writes to `useMigrateSelectionStore` (`myProducts`). The "My (N)" filter button is now positioned on the right side of the toolbar, grouped with the view toggle.
- **Stack view collapses empty layers when My filter is active**: In Infrastructure Stack and CISA Stack views, layers with zero matching products are automatically hidden when the My filter (or a vendor filter) is active, reducing visual noise. Layers reappear when the filter is cleared.
- **BookmarksPanel uses unified product store**: The Migrate section in the Bookmarks right panel now reads from `useMigrateSelectionStore.myProducts` instead of the deprecated `migrateBookmarks` field. Clear All wipes selections across all sections including Migrate. JSON and CSV export include the product name extracted from the `name::categoryId` key format.
- **Export CSV button icon-only**: The "Export CSV" text label was removed from the Gantt chart toolbar; only the download icon remains.

## [2.75.0] - 2026-04-02

### Added

- **ACVP tests 23 & 24 — X25519/X448 ECDH round-trip**: The HSM ACVP compliance suite now covers Montgomery-curve Diffie-Hellman. Test 23 generates two X25519 keypairs, derives shared secrets from each side, and asserts they match. Test 24 does the same for X448. Both tests run on both the C++ and Rust engines in dual-mode (40 total assertions). A `extractMontgomeryPubKey` helper abstracts the engine difference: Rust stores raw bytes in `CKA_VALUE`; C++ stores a DER-wrapped point (`04 len raw`) in `CKA_EC_POINT`.
- **ACVP test 25 — X9.63 KDF with SHA3-256 / SHA3-512 (PKCS#11 v3.2 §5.2.12)**: Verifies `C_DeriveKey(CKM_ECDH1_DERIVE, CKD_SHA3_256_KDF)` and `C_DeriveKey(CKM_ECDH1_DERIVE, CKD_SHA3_512_KDF)` produce matching derived keys on both engines. Constants `CKD_SHA3_256_KDF = 0x0B` and `CKD_SHA3_512_KDF = 0x0D` are now exported from `softhsm/constants.ts`.
- **`hsm_pqcEncap` / `hsm_pqcDecap` wrappers (PKCS#11 v3.2 §6.3)**: String-variant API (`'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024'`) over the existing `hsm_encapsulate` / `hsm_decapsulate` functions, for compatibility with the 5G SUCI Profile C UI layer.
- **`hsm_generateX25519KeyPair`**: PKCS#11 v3.2 compliant X25519 keypair generation via `CKM_EC_MONTGOMERY_KEY_PAIR_GEN` with `CKA_DERIVE=true` on the private key. Exported from `src/wasm/softhsm/classical.ts`.
- **`hsm_importECPrivateKey`**: Injects an EC private key scalar into the HSM via `C_CreateObject` for use in GSMA SUCI known-answer test injection. Supports P-256, P-384, P-521. Includes an inline warning documenting the `C_UnwrapKey` path that real hardware HSMs require.
- **`DerivedKeyProfile` interface + `buildDerivedKeyTemplate`**: Flexible PKCS#11 v3.2 attribute builder for `C_DeriveKey` templates. Replaces hardcoded `CKK_GENERIC_SECRET` templates in `hsm_ecdhDerive` and `hsm_ecdhCofactorDerive` — callers now pass a profile (`{ keyLen, derive, encrypt, decrypt, … }`) that maps 1-to-1 to `CKA_*` entries. Unspecified optional attributes are omitted from the template per §4.1.
- **ML-KEM keygen and import: optional `CKA_LABEL` support**: `hsm_generateMLKEMKeyPair` and `hsm_importMLKEMPublicKey` accept an optional `label` string that is stored in `CKA_LABEL` when provided. Template attribute counts are now dynamic (not hardcoded) so labels do not cause `CKR_TEMPLATE_INCONSISTENT`.
- **GSMA TS 33.501 Annex C.4 Profile B KAT**: Known-answer test vectors for 5G SUCI Profile B (P-256 ECDH + AES-128-CTR + HMAC-SHA-256 deconcealment) sourced directly from 3GPP TS 33.501. Stored in `src/data/kat/gsma_suci_ts33501_annex_c.json`. KAT runner extended with `suci-profile-b` test type covering 7 discrete steps (key import, ECDH, KDF, encrypt, MAC, end-to-end).
- **5G SUCI dual-engine output viewer**: The SUCI flow workshop panel now shows a tabbed output view — **SoftHSM3 (KAT)**, **OpenSSL Engine**, and **GSMA Vector Validation** — whenever a step produces dual-engine output. The GSMA tab renders the TS 33.501 Annex C reference value alongside the SoftHSM3 result and marks a pass/fail indicator.
- **Threats dashboard multi-view mode**: The Threats page now supports three view modes — **Table** (existing), **Cards** (new compact card grid), and **Industry Stack** (layered stack grouped by industry sector with inline table expansion). A view-mode toggle appears in the desktop header; the active mode is synced to the URL (`?mode=`). New components: `ThreatsCardGrid`, `ThreatsTable`, `ThreatsViewToggle`, `IndustryStack`, `ThreatCard`, `threatsHelper`.
- **Leaders sector stack view**: The Leaders page gains a **Sector Stack** view mode alongside the existing card grid. The stack groups leaders by organisation type (Government, Industry, Academia) with per-layer card expansion. A `LeadersViewToggle` and `SectorStack` component are introduced; the active mode is URL-synced.

### Fixed

- **`CKK_EC_MONTGOMERY` value corrected to `0x41`** (was `0x45`): The wrong constant caused `CKR_TEMPLATE_INCONSISTENT (0xD1)` on every X25519 and X448 keygen call to the C++ engine. Fixed in `src/wasm/softhsm/constants.ts` per PKCS#11 v3.2 pkcs11t.h (`CKK_EC_EDWARDS=0x40`, `CKK_EC_MONTGOMERY=0x41`).

### Changed

- **softhsm-wasm C++ engine rebuilt (0.4.3)**: `public/wasm/softhsm.{js,wasm}` rebuilt from source. Fixes `CKR_MECHANISM_PARAM_INVALID` on `C_DeriveKey` when `CKD_SHA3_256_KDF` or `CKD_SHA3_512_KDF` is requested — the KDF validation block in `SoftHSM_keygen.cpp::deriveEDDSA` / `deriveEC` now explicitly accepts both SHA3 KDF variants (PKCS#11 v3.2 §5.2.12).
- **softhsm-wasm Rust engine rebuilt (0.4.3)**: `public/wasm/rust/softhsmrustv3.{js,d.ts,_bg.wasm}` rebuilt with `CKD_SHA3_256_KDF` / `CKD_SHA3_512_KDF` constants in `constants.rs` and SHA3 dispatch arm in the X9.63 KDF block in `ffi.rs`.
- **`HsmKeyInspector` display names updated**: `CKK_EC_MONTGOMERY (0x41)` and `CKM_EC_MONTGOMERY_KEY_PAIR_GEN (0x1056)` now render their symbolic names in the key attribute inspector panel instead of showing raw hex.

### Data Sources

- **Product catalog updated** (`pqc_product_catalog_04022026_r1.csv`): April 2026 r1 revision.
- **Library updated** (`library_04022026.csv`): April 2026 snapshot.

## [2.74.0] - 2026-04-01

### Changed

- **Compliance Module Refactoring**: The compliance view has been fully unified across mobile and desktop. The nested tab hierarchy was removed in favor of a single `ComplianceTable` component that dynamically utilizes CSS grid arrays to render cards on mobile viewports and a horizontal data-table on desktop viewports.
- **Global Filter Consolidation**: Filter menus have been refactored out of table headers and consolidated into a persistent Active Filters bar (desktop) and a `MobileFilterDrawer` (mobile) to significantly enhance usability and discoverability on smaller screens.
- **Resilient UI Testing**: E2E validation scripts for the compliance module have been updated to support the new flat responsive hierarchy.

## [2.73.0] - 2026-04-01

### Added

- **CISA Stack view for the Migrate catalog**: A new "CISA Stack" view mode organises the product catalog into the 15 CISA-designated critical infrastructure categories (Cloud Services, Networking Hardware/Software, Endpoint Security, ICAM, Telecom, Storage, and more). Switch between the enterprise layer stack and the CISA taxonomy using the view toggle at the top of the Migrate page.
- **PQC readiness progress bars in Infrastructure Stack**: Every layer card now shows a compact colour-coded progress bar breaking down products into Established (green), In Progress (amber), and No Capability (grey) based on their PQC support status. An overall readiness summary bar appears above the stack when no layer is selected.
- **License type filter in Migrate catalog**: A new "All Licenses" dropdown in the filter bar lets you narrow the product list to Open Source or Commercial entries. The selection is preserved in the URL so filtered views can be shared.
- **Quantum technology badges**: Products that incorporate quantum hardware (QKD, QRNG, or both) now display a colour-coded badge in both the card grid and the expanded table row. The `quantum_tech` field is sourced directly from the product catalog.

### Changed

- **CISA category field added to all products**: Every product in the migration catalog now carries a `cisa_category` field mapping it to one of the 15 CISA categories. Products without a specific mapping default to "Other / Unclassified".
- **Enrichment merge improved**: Timeline enrichments now aggregate all historical enrichment files (not just the latest) so older entries are never silently dropped on subsequent runs. The shared `mergeEnrichmentFiles` utility is now used by both library and timeline enrichment loaders.

### Data Sources

- **Timeline data updated to April 2026** (`timeline_04012026.csv`): Latest government and industry PQC milestones incorporated; March 2026 snapshot retired.
- **Product catalog updated** (`pqc_product_catalog_04012026_r4.csv`): April 2026 catalog revision with enriched CISA category and quantum-tech annotations across the full 622-product dataset.

## [2.72.0] - 2026-04-01

### Added

- **Share links for library documents**: A share button in the library document detail modal copies a direct link — `/library?ref=<ID>` — to your clipboard. The browser URL also updates to include `?ref=` when the modal opens and clears when it closes, so the address bar is always shareable. Deep links open the modal automatically.
- **Share links for migrate products**: A share button appears in each expanded product row in the migration catalog table. Clicking it copies `/migrate?product=<name>::<category>&mode=table` to your clipboard. The URL updates to reflect the open row while browsing, and sharing the link re-opens the same row with the table view active and scrolled into view.
- **Share country timeline links**: A copy-link icon appears next to the country dropdown (desktop Gantt chart and mobile list) whenever a specific country is selected. Clicking it copies `/timeline?country=<Country>` to your clipboard — send it to a colleague to open the timeline pre-filtered to that country's roadmap.
- **Share buttons in all HSM Playground panels**: Every operational HSM panel (Hashing, Key Derivation, Key Agreement, Symmetric Crypto, Sign & Verify, Key Wrap) now has a share button in its header. Because the Playground already syncs `?tab=` and `?algo=` to the URL on every selection, sharing copies a fully-resolved deep link — e.g. `/playground?tab=hashing&algo=SHA3-256` — that lands a recipient directly on the right panel and algorithm.

## [2.71.0] - 2026-04-01

### Added

- **SLH-DSA context string support (FIPS 205 §9.2)**: The SLH-DSA sign and verify operations in the HSM Playground now accept an optional context string — a short byte sequence that is cryptographically bound to the signature. A signature produced with context "A" will not verify with context "B", giving you a built-in domain-separation primitive for multi-protocol deployments.
- **SLH-DSA deterministic signing (FIPS 205 §10)**: A new "Deterministic" option in the SLH-DSA panel forces the HSM to derive its randomness from the key itself (using PK.seed as opt_rand). Signing the same message twice with the same key produces identical signature bytes, making it easier to build reproducible test vectors and auditable log entries.
- **ACVP tests 21 & 22 — SLH-DSA context binding and deterministic mode**: The ACVP compliance test suite now covers the two new FIPS 205 capabilities. Test 21 verifies that context-bound signatures reject cross-context and no-context verification. Test 22 verifies that deterministic signing produces bit-identical signatures across two calls and that the result still verifies correctly. Both tests run on both the C++ and Rust engines in dual mode (44 total assertions).
- **Copy button on ACVP execution log**: A clipboard button in the ACVP log header lets you copy the full test output with one click — useful for attaching results to issue reports or compliance evidence packages.

### Fixed

- **SLH-DSA multi-message signing correctness**: The C++ HSM engine's message-API path (`C_MessageSignInit` / `C_SignMessage`) incorrectly lost session parameters (context string, deterministic flag) between the mandatory PKCS#11 size-query call and the actual signing call. Context binding and deterministic mode had no effect when using the message API. Parameters are now preserved across both steps.

## [2.70.1] - 2026-04-01

### Data Sources

- **Product catalog expanded to 622 entries**: 101 new products added in the latest audit pass. Validation coverage increased — 338 of 622 products are now independently confirmed as valid.

## [2.70.0] - 2026-04-01

### Added

- **Proof details popup**: Clicking "View Proof" on any product now opens a focused dialog showing the validation outcome, a written summary of findings, the publication date, and a link to the original source document. Works on both mobile and desktop.
- **Expanded validation status badges**: Products now show one of 8 color-coded status badges — Validated (green), FIPS Verified (green), Validated — No PQC (gray), Corrected (amber), Partially Validated (amber), Needs Review (amber), Not Validated (red), FIPS Issue (red).

### Data Sources

- **All 521 catalog entries now have validation results**: The full product catalog completed a validation pass. Results: 237 Validated, 171 Validated without PQC support, 81 Corrected, 9 Needs Review, 8 Not Validated, 7 Partially Validated, 5 FIPS Issues, 3 FIPS Verified.

## [2.69.2] - 2026-04-01

### Added

- **Visual infographics for all 49 learning modules**: Every module now has a dedicated NLLM-format infographic available in the Visual tab.
- **"Next Stack" navigation in Curious mode**: When you reach the last module in a track while browsing in Curious Explorer mode, a "Next Stack" button appears — clicking it automatically moves you to the next track so you can continue exploring without backtracking.

## [2.69.1] - 2026-04-01

### Fixed

- **Chatbot blank screen after API key error**: If you had previously connected the chatbot with a Gemini API key that was later rejected, sending a new message would silently clear your typed text and show a blank chat. Now shows a clear error message and restores your typed text so you can reconnect without losing your query.

## [2.69.0] - 2026-04-01

### Added

- **Source verification data in product catalog**: Each product now shows whether it has been independently verified, along with a link to the source document and a summary of what was confirmed.
- **Validation badges in product expanded view**: A color-coded badge (green/amber/red) appears next to the "Last Verified" date so you can assess product credibility at a glance.
- **AI assistant aware of validation results**: The chatbot can now reference a product's validation status and source proof when answering questions about specific tools.

## [2.68.0] - 2026-03-31

### Changed

- **Improved AI assistant navigation links**: Links returned by the chatbot now navigate more precisely — classical algorithm links open the Transition tab directly, compliance links open the Standards tab, and product links apply the correct infrastructure layer filter automatically.

## [2.67.1] - 2026-03-31

### Data Sources

- **New document enrichments**: 67 new library analysis entries (covering blockchain/DeFi protocols, NSA CNSA 2.0, Signal PQXDH, Apple PQ3, and more) and 10 new timeline entries (Bitcoin quantum testnet, Algorand PQC, OpenSSL 3.6.1, DoD PQC memorandum, and others). Library document coverage: 92% (386 of 419). Timeline coverage: 100% (213 of 213).
- **Data quality improvements across multiple datasets**: Fixed broken source organization references in the library, product catalog, and timeline datasets. Added 12 new trusted organizations (200 total). Fixed 3 data integrity issues in the priority matrix.
- **Data integrity**: Resolved all 8 outstanding data errors — all cross-references between datasets are now consistent.

## [2.67.0] - 2026-03-31

### Added

- **Certificate Transparency Log Simulator**: New interactive step in the Merkle Tree Certificates workshop — simulate a real CT log with ML-DSA-44 signing, append and look up certificates, generate consistency proofs, and detect certificate misissuance.
- **TLS 1.3 Simulator**: New Playground workshop tool — simulate a full TLS 1.3 handshake with configurable cipher suites and key exchange groups, including X25519, ML-KEM hybrid, and mutual TLS (mTLS). Supports PQC and hybrid certificates.
- **Algorithm comparison sub-tab deep links**: The Performance, Security, Key Sizes, and Use Cases sub-tabs in the Algorithms comparison view now remember your position in the URL, so sharing or navigating back restores the exact sub-tab you were viewing.
- **Compliance migrate-category filter**: A new filter in the Compliance view lets you jump directly to products in a specific category (e.g., Databases, Operating Systems) and see which migration catalog entries correspond.
- **Library taxonomy refresh**: The library sidebar now uses 6 more precise categories — Government & Policy, NIST Standards, International Frameworks, Migration Guidance, Algorithm Specifications, and Industry & Research — replacing the generic "General Recommendations" bucket.
- **Migration catalog "Work in Progress" notice**: An animated banner at the top of the Migrate view lets you know the catalog is actively being reviewed and updated.
- **HSM key inspection improvements**: Keys in the HSM Playground now show semantic purpose labels (Attestation, TLS, Key Encryption, Application, General) with per-purpose color coding.

### Changed

- **Firmware Signing Migrator rewritten**: The Secure Boot PQC workshop now supports RSA-2048/3072, ECDSA P-256/P-384, ML-DSA-44/65/87, and SLH-DSA-SHA2-128S with a 4-step guided wizard (algorithm selection → key generation → signing → verification).
- **Envelope Encryption Demo expanded**: The KMS-PQC workshop now includes RSA-2048 and RSA-4096 key encryption in addition to ML-KEM variants. The wrapping mechanism is now selectable.
- **PKCS#11 call log — expandable entries**: Log entries with inspect data now show an expandable row — click to decode mechanism IDs, attribute types, and return codes inline.

### Fixed

- **HSM attribute read errors resolved**: The key attribute inspector no longer tries to read attributes that don't apply to a given key type, eliminating spurious error messages in the PKCS#11 log.
- **Duplicate "Code Signing" tool removed from Playground**: The standalone tool was a duplicate of the Secure Boot PQC workshop — it has been removed from the registry; the workshop itself remains fully accessible.

## [2.66.0] - 2026-03-30

### Added

- **Evidence warnings on products**: Expanded product rows now display warning notices when a product's PQC claims have data quality issues — for example, a release date before the FIPS standards were finalized, or a FIPS certificate that only covers classical algorithms.
- **Verification status filter**: New filter in the Migrate view to show only Verified, Partially Verified, or Needs Verification products.
- **Evidence flags affect trust score**: Products with data quality warnings receive a lower composite trust score — reflected in the trust badge shown on each product card.

### Data Sources

- **415 products in catalog** (was 394): 21 new products added, including Cisco Catalyst Center, DigiCert ONE, and Fortinet FortiManager.
- **72 products independently verified**: Products were web-searched and cross-referenced against vendor sources, FIPS, and ACVP certifications.

### Fixed

- **21 products corrected to Unknown**: Products claiming PQC support without any verifiable proof or certification are now honestly marked Unknown.
- **4 products upgraded**: Fortinet FortiGate-Rugged, Zscaler ZTE, AppViewX CERT+, and Broadcom Avi all ship PQC — updated from Planned to Yes with supporting evidence.
- **Node.js corrected**: Was listed as awaiting PQC — actually has ML-KEM + ML-DSA since v24.7 via OpenSSL 3.5.
- **Cisco IOS XE corrected**: Was listed as "Yes (ML-KEM)" — native ML-KEM not yet shipped; corrected to Partial.
- **Algorithm names standardized**: CRYSTALS-Kyber updated to ML-KEM and CRYSTALS-Dilithium to ML-DSA throughout all product descriptions.
- **FIPS scope clarifications**: 14 products with classical-only FIPS certificates now note that PQC is not in scope.

## [2.65.3] - 2026-03-29

### Added

- **Envelope encryption via HKDF**: The KMS-PQC workshop now derives the wrapping key from the ML-KEM shared secret using a real HKDF step, rather than generating a fresh AES key.
- **SLH-DSA pre-hash mismatch warning**: The Playground now shows a warning when the pre-hash algorithm selected in the UI differs from the one used to sign.
- **PKCS#11 mechanism flag reference**: Step 8 of the PKCS#11 Walkthrough now explains all mechanism flags (SIGN, ENCAPSULATE, WRAP, etc.) with references to the PKCS#11 v3.2 specification.
- **KDF tool scenarios expanded**: The Key Derivation Function tool now illustrates KEM, pre-shared key, and password-based derivation scenarios side by side.
- **Trust score badges**: Trust score indicators added across the Library, Compliance, Threats, Timeline, Algorithms, Leaders, and Migrate views.
- **9 new achievements**: New milestones for completing 5, 10, and 25 modules; completing 3 tracks; scoring 100% on a quiz; exploring 3 or 10 Playground tools; and finishing the Business Center.
- **Curious learning path expanded**: 8 new modules and a new checkpoint added to the Curious Explorer path (estimated time increased from 280 to 680 minutes).

### Fixed

- **Hybrid KEM + ECDH key derivation error**: Fixed an issue where the ECDH-derived key was missing a required attribute, causing the HKDF combine step to fail in the Hybrid KEM workshop.
- **Google sign-in flow corrected**: Fixed an OAuth configuration issue that prevented the Google consent screen from loading correctly.

## [2.65.2] - 2026-03-29

### Fixed

- **FrodoKEM benchmark crash**: FrodoKEM-640 algorithm name resolved correctly — benchmark now runs without errors.
- **secp256k1 benchmark crash**: secp256k1 now runs using the Noble curves library (Web Crypto does not support it).
- **Ed448 and X448 benchmarks removed**: No portable browser engine supports these — removed from the benchmarkable set to avoid misleading errors.
- **Diffie-Hellman benchmark crash**: No browser handler exists for DH benchmarking — removed from the benchmarkable set.

## [2.65.1] - 2026-03-29

### Added

- **Google Drive CSRF protection**: The OAuth sign-in flow now includes a nonce parameter to prevent session impersonation attacks.

### Fixed

- **SoftHSM WASM import errors**: Fixed invalid TypeScript syntax across 8 internal WASM modules that caused build failures in strict mode.

## [2.65.0] - 2026-03-29

### Added

- **Business Center export improvements**: CRQC Scenario Planner, Supply Chain Risk Matrix, and Deployment Playbook now export full markdown reports with algorithm impact tables, compliance deadlines, and assessment context.
- **Audit Checklist expanded**: New Risk Assessment section (6 items) covering HNDL exposure, data classification, crypto risk registers, and threat modeling. All 30 checklist items now include descriptions and references to NIST, FIPS, ISO, and CISA standards. Export includes per-section maturity scoring (5 levels: Not Started → Optimized).
- **Deployment Playbook new sections**: Added Hybrid Mode Deployment (5 items: hybrid TLS config, backward compatibility, cert chain validation, performance benchmarking, interop testing) and Post-Deployment Validation (5 items).
- **RACI Builder multi-accountable warning**: A red warning now appears when more than one role is assigned as "Accountable" for the same activity.
- **Business Center keyboard navigation**: Full arrow-key navigation across Business Center tabs (ArrowLeft/Right to cycle, Home/End to jump to first/last).
- **Persona-aware Business Center**: All 14 Business Center tools now adapt content to your selected industry, geography, and regulatory context.

### Fixed

- **ROI Calculator unrealistic defaults**: The "Products to Migrate" slider was defaulting to the full catalog (~375 products) — now capped at 50, with the slider minimum lowered to 1.
- **CNSA 2.0 deadline labels corrected**: Fixed 2025 and 2027 milestone descriptions; added the missing 2035 full-enforcement milestone.
- **Roadmap Builder export**: Export now respects your selected deadline checkboxes rather than including all deadlines.

## [2.64.0] - 2026-03-29

### Added

- **Real X.509 certificates in Hybrid Cryptography module**: All 6 hybrid certificate formats (Composite, Alt-Sig/Catalyst, Related Certificates, Chameleon, Pure ML-DSA-65, Pure SLH-DSA-128s) now generate structurally correct, standards-compliant DER-encoded X.509 certificates — not simulations. Certificates are signed via the in-browser HSM using real PKCS#11 operations.

### Fixed

- **RFC 9763 Related Certificates OID corrected**: Fixed an OID typo (`.35` → `.36`) that was inconsistent with the actual RFC specification.

## [2.63.0] - 2026-03-29

### Added

- **Alt-Sig / Catalyst as a distinct certificate format**: The Hybrid Cryptography module now covers all 6 hybrid certificate approaches, with Alt-Sig (a classical certificate carrying a PQC key and signature in extensions) correctly distinguished from Related Certificates (two separately paired certs). Previously these were conflated.
- **SLH-DSA learn card**: The learn section now shows all 6 certificate formats across two groups — PQC-only (ML-DSA, SLH-DSA, Composite) and hybrid-with-classical-fallback (Alt-Sig, Related Certs, Chameleon).
- **SLH-DSA IETF reference certificate**: A real 8,241-byte SLH-DSA-SHA2-128s certificate from RFC 9909 is now included as a test vector in the Certificate Inspector.

### Fixed

- **Alt-Sig factual error corrected**: The IETF test vector for Alt-Sig was incorrectly labeled as Related Certificates in the inspector. The NSA Catalyst approach is Alt-Sig, not RFC 9763 — the glossary and test vectors now reflect this correctly.
- **Certificate format count inconsistency**: Removed all hardcoded counts ("Three", "Four", "Five") that were inconsistent across the module — there are 6 distinct formats. Headings no longer include numbers to prevent future drift.

## [2.59.0] - 2026-03-28

### Added

- **Bookmarks**: Save Library documents and Migrate products for quick access. Bookmarks are accessible from a new Bookmarks tab in the right panel and can be exported as JSON or CSV.
- **Product comparison panel**: Compare up to 3 products side-by-side in the Migrate catalog. Click the scale icon on any product to add it to the comparison queue; a sticky bar at the bottom shows your queue and opens an inline comparison table.
- **Breadcrumb navigation**: A breadcrumb trail now appears above page content for nested routes (e.g., inside a learning module), making it easy to navigate back.
- **Mobile Playground**: The Playground is now fully interactive on mobile — ML-KEM encapsulation/decapsulation and ML-DSA signing/verification are available on small screens with real WASM-powered operations.
- **Automated content integrity checks in CI**: Every deployment now runs a content quality gate that checks for accuracy issues and graph consistency errors before going live.

### Changed

- **Page descriptions visible on more screen sizes**: Page subtitles now appear at the medium breakpoint instead of only on large screens.

## [2.58.0] - 2026-03-28

### Fixed

- **Compliance framework website links corrected**: Fixed broken or unstable URLs for DORA, ENISA, and Bank of Israel records.

## [2.57.0] - 2026-03-27

### Added

- **Migrate view URL sync**: All active filters in the Migrate view — search, industry, migration step, and infrastructure layer — are now reflected in the URL. You can share a filtered view or bookmark it and return to the same state.

### Changed

- **Comprehensive mobile layout improvements (70+ components)**: Fixed multi-column grid layouts that were too cramped on small screens across the Learning workshops, About page, Algorithm Comparison, Assessment wizard, and OpenSSL Studio.

## [2.56.0] - 2026-03-27

### Added

- **Google Drive cloud backup**: Optionally back up and restore your learning progress, bookmarks, and settings to your personal Google Drive. Data is stored privately in a hidden app folder — not visible in your Drive file list. Access tokens are stored in browser memory only and never sent to any server. You can revoke access at any time.
- **Cloud sync privacy details on About page**: A dedicated panel explains exactly what data is synced, what is excluded (API keys), and how to disconnect.

### Changed

- **Navigation scrollbar restored**: A CSS regression introduced in v2.55.0 was hiding the navigation scrollbar, making right-side nav icons inaccessible on smaller screens. Fixed.

## [2.55.0] - 2026-03-24

### Added

- **Algorithm comparison — security level and key size badges**: The PQC column in the comparison table now shows the security level (e.g., L3) and public key size (e.g., 1184 bytes) for each algorithm, replacing the generic "Find tools" link.
- **Mobile algorithm cards — function type and key size chips**: Algorithm cards on mobile now show the function type and key size as compact chips below the algorithm name.
- **OpenSSL Studio collapsible workbench**: The command builder panel in OpenSSL Studio can now be collapsed on mobile to free up screen space.

### Changed

- **Navigation header — text-only branding**: The logo image has been removed from the nav header; the "PQC Today" text gradient is now the sole identifier.

## [2.54.0] - 2026-03-24

### Added

- **Curious Explorer persona content**: Every learning module now has a dedicated "Curious" summary written in plain language (~8th grade reading level) with real-world analogies, plus a matching infographic in the Curious Explorer style. All 50 modules covered.
- **Curious context banners**: The Compliance and Leaders pages now include a brief plain-language explanation of what you're looking at when Curious Explorer mode is active.
- **Key size display in Playground**: The Key Store and HSM Key Registry now show a Size column. The header shows total key count and combined byte size.
- **Mobile compliance improvements**: Certificate type filter pills and "Load more" pagination now work on mobile.
- **Mobile migration phase selector**: A dropdown for selecting migration phases is now available on mobile, replacing the desktop step rail that was hidden on small screens.
- **Page header actions menu on mobile**: A three-dot menu on mobile consolidates the Sources, Share, Glossary, Export, and AI Assistant buttons into a single tap.

### Changed

- **Curious Explorer auto-completes onboarding**: Selecting Curious Explorer in the persona picker now skips the Region and Industry steps automatically.
- **Playground simplified for Curious and Executive personas**: The PKCS#11 mode selector and ACVP tab are hidden for non-technical personas. Auto-resets if you switch to a simplified persona while in advanced mode.

## [2.53.0] - 2026-03-24

### Changed

- **Faster app updates**: The app now checks for new deployments every 15 minutes (was 60 minutes). You will see fresh content sooner when a new version is released.

## [2.52.0] - 2026-03-24

### Fixed

- **App stayed on old version after deployment**: Especially on iOS Safari, the app could remain on a cached version for hours after a new release. Now the app reloads automatically when a new version is detected — within ~1 hour on desktop, or on next foreground return on mobile.

## [2.51.0] - 2026-03-24

### Fixed

- **HSM product PQC algorithm details corrected**: Standardized algorithm names across all HSM product entries (Thales Luna HSM, Utimaco SecurityServer, Marvell LiquidSecurity 2, Futurex CryptoHub, AWS CloudHSM, Google Cloud HSM, Crypto4A QxHSM). Removed embedded FIPS numbers from algorithm name strings for consistency. Clarified that AWS CloudHSM hardware does not support ML-KEM (only ML-DSA in preview).

## [2.50.0] - 2026-03-24

### Fixed

- **Entrust nShield PQC support details corrected**: Updated the product entry to list specific algorithm support (ML-KEM 512/768/1024, ML-DSA 44/65/87, SLH-DSA all 12 parameter sets, LMS/XMSS) rather than the generic "Hybrid PQC" description.

## [2.49.0] - 2026-03-23

### Changed

- **Trail of Bits ml-dsa added to catalog**: New side-channel resistant ML-DSA library in Go added under Cryptographic Libraries. Supports all three ML-DSA parameter sets, designed for constant-time execution, and has passed 51 conformance tests.

## [2.48.0] - 2026-03-23

### Added

- **ACVP Testing expanded**: The HSM ACVP Testing tab now includes an Ed25519 signature verification test and full-coverage functional tests for all 12 SLH-DSA parameter sets.
- **Standard reference links in ACVP results**: Each test result now links to the canonical NIST or IETF standard for the tested algorithm.
- **Crucible conformance harness added to PQC Testing module**: The PQC Testing & Validation learning module now covers Crucible — a language-agnostic test harness with 78 ML-KEM and 51 ML-DSA targeted conformance tests.

### Changed

- **HSM vendor accuracy update**: Verified and updated production data for all 6 HSM vendors — Thales Luna 7, Entrust nShield 5, Utimaco Quantum Protect, AWS CloudHSM, Azure Dedicated HSM, and Crypto4A QxHSM. Key updates: Azure Dedicated HSM now in production (no new customers after Aug 2025); Utimaco CAVP certificates added; AWS CloudHSM ML-KEM clarification.

## [2.47.0] - 2026-03-23

### Fixed

- **HKDF mechanism constants corrected**: Fixed incorrect constant values for HKDF derive operations that could cause failures when running against a compliant PKCS#11 token.

## [2.46.0] - 2026-03-22

### Added

- **Key Check Values (KCV) for all key types**: The HSM Key Store now shows a 3-byte hex fingerprint for every key (ML-KEM, ML-DSA, SLH-DSA, RSA, ECDSA, EdDSA) — useful for verifying key identity without exposing the key material.
- **ACVP multi-algorithm test suite**: The HSM ACVP Testing tab now validates AES-GCM-256, HMAC-SHA-256, RSA-PSS-2048, ECDSA P-256, and ML-KEM-768 alongside ML-DSA — all running in parallel against both C++ and Rust engines in Dual Mode.
- **Visual tab for all 48 learning modules**: Every module now has a Visual tab showing its infographic and "In Simple Terms" summary, accessible at all experience levels without switching to Curious mode.
- **WIP badge with community feedback**: Modules currently under peer review show a pulsing "WIP" chip. Clicking it opens a review-status panel with automated cross-check results, editorial progress, and peer-review status — with Endorse/Flag buttons and a link to GitHub Discussions.
- **Enrichment previews in Timeline**: Gantt phase popovers now show a compact analysis preview (mandate level, migration urgency, sector tags). Timeline document popovers show a full 8-dimension analysis and a cross-link to the Library when the source matches a library record.
- **PQC Testing & Validation learning module**: New advanced module (120 min) covering passive crypto discovery, active endpoint scanning, performance benchmarking, interoperability testing, side-channel assessment, and NIST ACVP validation.
- **"What's New" modal**: A persona-aware modal auto-opens on your first visit after a new release, highlighting the updates and data changes most relevant to your role and industry.
- **Terms of Service page** (`/terms`): 11-section legal page covering licensing, educational crypto disclaimers, export compliance, acceptable use, privacy, and warranty.
- **Curious Explorer glossary**: 24 plain-language definitions with interactive inline tooltips for the Curious Explorer persona.

### Changed

- **"In Simple Terms" summaries rewritten across all 48 modules**: All plain-language summaries were rewritten at an ~8th-grade reading level with a consistent structure (what it is, why it matters, what you'll learn) and real-world analogies. Previous summaries contained inaccuracies and inconsistent depth.
- **Module infographics standardized to 640×640**: All module infographics replaced with new single-panel square designs.
- **Tools & Products tab sources from live catalog**: The Tools tab in each learning module now pulls directly from the current product catalog, filtered by module relevance, with PQC support badge, FIPS badge, and a deep-link to the full catalog entry.

### Fixed

- **Library "Relevant Features" links broken**: Fixed two bugs that caused enrichment feature links to be broken or missing — case-sensitivity in lookups and incorrect list separator handling are now both corrected.
- **Snapshot backup/restore data loss**: 14 settings fields were silently dropped when exporting and re-importing a snapshot. Assessment wizard flags, persona settings, migrate preferences, and chat settings now all round-trip correctly.

## [2.45.2] - 2026-03-13

### Changed

- **Library document popover — mobile sheet layout**: On small screens the document detail popover now slides up as a bottom sheet with a drag handle and scrollable content, replacing the cramped centered dialog.
- **Endorse and Flag buttons visible on mobile**: The Endorse and Flag buttons on Library, Threats, Leaders, and Timeline pages were only visible on large screens. Now also shown on mobile, directly below the page description.
- **Airplane Mode in mobile nav**: The Airplane Mode toggle is now accessible from the mobile More menu, showing current On/Off state.

## [2.45.1] - 2026-03-14

### Added

- **Stateful Endorse/Flag with discussion links**: Endorsing or flagging a resource now saves your action locally and opens a pre-filled GitHub Discussion form. Re-clicking an activated button opens a search for the discussion you created previously, so you can follow up.

### Fixed

- **Flag button missing from several views**: The Flag button was absent from Timeline document cards, the Gantt country row, the page header for Threats/Leaders/Timeline pages, and the learning module navigation bar. Added consistently across all affected locations.

## [2.45.0] - 2026-03-13

### Added

- **Flag issue button**: A new Flag button (red flag icon) appears across Library, Threats, Leaders, and Learning views. Clicking it opens a pre-filled GitHub Discussion to report inaccuracies, broken links, or outdated content.
