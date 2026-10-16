# Copyright and licence

Copyright PQC Today, LLC.

The code and content written for this project are licensed under the
GNU Affero General Public License, version 3 only (AGPL-3.0-only); see
[LICENSE](LICENSE). If you run a changed version of this software for other
people over a network, the AGPL requires you to offer them its source code.
The live site links to the exact source it runs from its footer.

Versions published before 16 October 2026 were released under the GNU General
Public License, version 3 only (GPL-3.0-only), and stay under it for whoever has
them.

## Third-party parts

Parts written by others keep their own licences and notices and are not covered
by the AGPL grant or by any commercial licence from PQC Today, LLC:

- the WebAssembly engines in `public/wasm/` and `src/wasm/`, built in the
  pqctoday-hsm repository and other projects, with their notices in
  `public/licenses/engines/` and at `/licenses/` on the site;
- the npm packages and other files served as they are (for example Pyodide,
  MPL-2.0, and the flag set in `public/flags/`, MIT), listed at `/licenses/`;
- the OASIS KMIP test cases in `public/kmip-corpus/` (OASIS notice);
- the Wycheproof and ACVP test vectors in `src/data/acvp/`;
- the glibc code in `scripts/entropy-90b/ldbl128/glibc-compat/math_private.h`
  (LGPL-2.1-or-later);
- passages adapted from the Applied Quantum framework (CC BY 4.0), marked in
  the files that use them (`AGPL-3.0-only AND CC-BY-4.0`) and credited on the
  pages that show them;
- quotations of standards, papers and vendor documents in the data files,
  which stay under their publishers' terms.

The embed SDK in `src/embed/`, which is being retired, stays under
GPL-3.0-only.

## Commercial licence

The AGPL lets anyone use, change, host and sell this software, as long as they
follow its terms, including sharing their changes with the people who use it.
If those terms do not fit your use, PQC Today, LLC can offer a commercial
licence for the parts it owns. Write to pqctoday@proton.me with
"Commercial licence" in the subject.

A commercial licence can only cover code PQC Today, LLC owns. It never covers
the third-party parts listed above, and in particular not strongSwan
(GPL-2.0-or-later), the glibc files (LGPL-2.1-or-later), Pyodide (MPL-2.0),
openpgp-pkcs11 (LGPL-2.0-or-later), TFHE-rs (its licence and Zama's patents) or
AMD/Xilinx generated output. No patent licence is given for third-party
technology.
