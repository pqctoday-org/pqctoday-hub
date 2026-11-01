Upgrading the world's computers to use entirely new Post-Quantum math isn't like flipping a simple light switch; it takes years of meticulous testing and auditing.

To stay safe during this long transition, security architects are using "Hybrid Cryptography". This means they lock their sensitive data using both the tried-and-true old math AND the brand new Post-Quantum math simultaneously. For encryption, if either method turns out to have a hidden, fatal flaw, the data stays protected by the other lock, as long as the two locks are joined in a well-designed way (as the TLS hybrid design and X-Wing do). For signatures, a forger must break both methods, as long as the checker insists that both signatures are valid.

Hybrid has costs too: two algorithms to build and test, bigger messages, and a second switch-over later when the old math is retired. That is why some agencies (France, Germany) ask for hybrid while others (the US NSA, the UK NCSC) accept the new math on its own.
