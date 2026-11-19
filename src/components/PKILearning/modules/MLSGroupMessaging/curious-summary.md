# MLS — Group Messaging (Curious Explorer)

Signal made one thing famous: end-to-end encrypted chat. But Signal's
ratcheting math only works well for two people. Make it a group of 100,
and every message has to be encrypted 100 times. A group of 1000? Forget
it.

Messaging Layer Security (MLS) is a newer IETF standard (July 2023) that
solves this. Instead of a chain of pairwise locks, MLS arranges members
as leaves of a binary tree. Each branch holds a secret known only to the members below it. When you add a friend, or rotate a key, only the nodes on your path up the tree change, so the work grows with the logarithm of the group size — O(log N) — instead of with the group size.

The next chapter is post-quantum: ML-KEM and ML-DSA suites are in IETF
at draft -07 (November 2026), and the IESG has been asked to publish them.

This module covers:

- How TreeKEM gives forward secrecy + post-compromise security at scale
- How HPKE encrypts path updates between members
- How our OpenMLS provider keeps signature keys as PKCS#11 v3.2 token objects
  (softhsmv3 here, a software token in the same process; production deployments require hardware HSM isolation and assurance evidence) — returning opaque handles rather than raw key bytes to OpenMLS

Play with the TreeKEM visualizer in the Workshop tab and see how each
Add / Remove / Update operation lights up only the affected path.
