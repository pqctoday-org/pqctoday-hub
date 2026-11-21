# Custody Key Lifecycle Operations — In Simple Terms

## What This Is About

Keeping a digital-asset key safe on day one is only the beginning. This module explains how custody keys are created in ceremonies, refreshed or rotated when people leave, watched for misuse, recovered after a lost device or outage, and retired safely without burning incoming funds.

## Why It Matters

Unlike a website TLS certificate, an ordinary Bitcoin or Ethereum key cannot be "revoked" by publishing a list — as long as coins sit at that address, anyone with the key can spend them, and pausing withdrawals off-chain does not cancel existing on-chain token allowances or EIP-7702 delegations. Meanwhile, rushed disaster-recovery restores can bring back an attacker's foothold, and destroying a retired key too early can permanently trap late customer deposits.

## The Key Takeaway

Every lifecycle stage — generation, refresh, recovery, monitoring, access control, backup, and destruction — carries the same authority assumptions as live signing. Safe custody depends on pre-planned sweeps, separated signing and admin paths, rehearsed canary restores, and verified retirement before destruction.

## What's Happening

In the seven interactive workshops, you classify twelve custody items between revoke, rotate, reshare, and sweep; stress-test recovery and inheritance plans against five real disruptions; audit a key-ceremony script for eight planted defects; triage twelve custody alerts across pre-signing, mempool, and confirmed stages; spot eight effective-permission conflicts in a custody access matrix; run three disaster-recovery drills; and sequence safe key decommissioning.
