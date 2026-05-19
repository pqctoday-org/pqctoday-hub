# MLS — Group Messaging (Curious Explorer)

Signal made one thing famous: end-to-end encrypted chat. But Signal's
ratcheting math only works well for two people. Make it a group of 100,
and every message has to be encrypted 100 times. A group of 1000? Forget
it.

Messaging Layer Security (MLS) is a newer IETF standard (July 2023) that
solves this. Instead of a chain of pairwise locks, MLS arranges members
as leaves of a binary tree. Each branch holds a shared secret derived
from its children. When you add a friend, or rotate a key, only the
nodes on your tree path change — that's an O(log N) update, not O(N).

It's already shipping: WhatsApp, Cisco Webex, AWS Wickr, Google Messages.
The next chapter is post-quantum: ML-KEM and ML-DSA suites are in IETF
Last Call as of March 2026.

This module covers:

- How TreeKEM gives forward secrecy + post-compromise security at scale
- How HPKE encrypts path updates between members
- How our OpenMLS provider keeps signature keys inside a real HSM
  (PKCS#11 v3.2, ML-DSA-ready) — not floating in browser memory

Play with the TreeKEM visualizer in the Workshop tab and see how each
Add / Remove / Update operation lights up only the affected path.
