### What This Is About

EMV is the global chip payment standard protecting roughly 14.7 billion cards in circulation. When a card is inserted into a terminal offline, authentication relies entirely on verifying a chain of RSA certificates.

### Why It Matters

A quantum computer capable of breaking RSA-2048 could forge the EMV root certificates, enabling criminals to create counterfeit offline cards that bypass terminal security. Additionally, the Points-of-Sale (POS) terminals themselves face massive quantum vulnerabilities during Key Injection Facilities (KIF), where compromising a central RSA-wrapped Base Derivation Key could expose millions of transactions.

### The Key Takeaway

Because PQC algorithms like ML-DSA are too large for constrained smart cards, the payment industry is heavily focused on FN-DSA (Falcon) given its compact signature sizes. Organizations must plan now to align with 3-5 year card replacement cycles to meet late 2020s regulatory migration targets.

### What's Happening

Payment networks are evaluating FN-DSA (Falcon) for constrained smart cards and planning PQC migration roadmaps aligned with 3-5 year card replacement cycles, targeting late 2020s regulatory deadlines for offline EMV authentication upgrades across 14.7 billion cards in circulation.
