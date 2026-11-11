### What This Is About

Post-quantum migration changes the cryptographic library calls, token formats, TLS configurations and signing paths that developers maintain. This role guide helps you identify which parts of your work need investigation and what evidence to obtain from your own development tools.

### What You Can Do Here

The four workshop steps contain six expandable impact/scenario cards, skill self-ratings with learning links, a phased action checklist with Markdown export, and a nine-item exposure checklist. The ratings and checked items reflect your answers; they do not inspect a codebase or prove migration readiness.

### Try the Separate Tools

Use the [Token Size Analyzer](/learn/api-security-jwt?tab=workshop&step=4) to edit a sample payload and compare compact JWT and Authorization header-line bytes against a line budget. Try the [TLS Simulator](/playground/tls-simulator) to inspect sample client/server configurations, [Hybrid KEM + ECDH](/playground/hybrid-encrypt) to follow the shared-secret derivation, and [VectorSet Anatomy (on a computer)](/learn/acvp-lab-workflow?tab=workshop&step=1) to inspect required test inputs without running an engine. Use the [API Migration Decision Lab](/learn/crypto-dev-apis?tab=workshop&step=7) for before/after library examples and the [code-signing sample](/learn/code-signing?tab=workshop&step=0) to distinguish live signing checks from illustrative mode. These tools are separate from the role cards.

### The Decision to Take Back

Choose the token limits, protocol combinations, library calls and test cases to check in your own stack. A header-line calculation does not measure every request header, a sample handshake does not predict production latency, and an input-support prediction is not an executed test or CAVP validation. Use the examples to plan checks and retain the results from your own tools.
