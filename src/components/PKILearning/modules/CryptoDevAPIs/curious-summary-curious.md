Most software developers don't write complex security math from scratch. Instead, they write code that calls on pre-built security libraries (APIs) to handle the heavy lifting of locking and unlocking data.

This separation is incredibly useful. Because the complicated math is hidden behind a clean, simple API interface, developers don't have to be cryptography experts to build secure applications.

When it comes time to upgrade to Post-Quantum security, this design pays off. Instead of rewriting the entire app, teams mostly change which algorithm the library is asked to use. Some work is still needed around the edges: the new keys and signatures are much bigger, so storage and messages have to make room for them, and both sides of a connection have to agree on the new algorithm.
