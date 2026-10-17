# Module Q&A snapshots

The dated CSV files in this directory are immutable historical generations. They are useful for
provenance and regression review, but older generations are not current instructional content.

Runtime cross-reference loading selects only the lexicographically latest
`module_qa_combined_*.csv`. Consumers and indexing pipelines must apply the same rule rather than
ingesting every snapshot.

For Entropy & Randomness, generations before 24 September 2026 contain obsolete claims about an
already-specified XOF_DRBG, universal 32-byte/full-entropy or 256-bit requirements, unconditional XOR
source-combining guarantees, and an “ESV Program.” Use the latest combined generation for current
answers.
