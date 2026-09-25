/* SPDX-License-Identifier: GPL-3.0-only
 *
 * Public long double entry points for the WebAssembly build of the NIST
 * SP 800-90B tool.
 *
 * Why: emscripten's musl implements expl, logl, log2l, log1pl and powl for
 * IEEE binary128 long double as "TODO: broken implementation to make things
 * compile" — they just call the DOUBLE-precision function. The NIST tool
 * computes several estimators in long double (lrs_test.h, utils.h
 * prediction_estimate_function, compression_test.h, permutation_tests.h), so
 * the WASM build silently ran them at double precision and did not
 * reproduce the native tool. Linking glibc 2.41's own ldbl-128
 * implementations — the code the native linux/arm64 build uses — restores
 * binary128 accuracy. These definitions take precedence over libc.a's.
 */
#include "math_private.h"

long double logl(long double x) { return __ieee754_logl(x); }
long double log2l(long double x) { return __ieee754_log2l(x); }
long double expl(long double x) { return __ieee754_expl(x); }
long double powl(long double x, long double y) { return __ieee754_powl(x, y); }
long double log1pl(long double x) { return __log1pl(x); }
