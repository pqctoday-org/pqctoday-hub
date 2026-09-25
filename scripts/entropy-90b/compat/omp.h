/* SPDX-License-Identifier: GPL-3.0-only
 *
 * Single-threaded OpenMP stand-in for the WebAssembly build of the NIST
 * SP 800-90B EntropyAssessment tool.
 *
 * Emscripten has no OpenMP runtime. The NIST sources include <omp.h> and call
 * exactly two runtime functions: omp_get_thread_num() (to jump each worker's
 * xoshiro256** stream) and omp_get_num_threads() (for a progress message).
 * Compiled WITHOUT -fopenmp, every `#pragma omp` is ignored and the annotated
 * loops run serially on one thread — the same semantics as OMP_NUM_THREADS=1
 * natively. With one thread, thread 0 performs zero xoshiro jumps, which is
 * what these stubs return.
 *
 * This header replaces the need to patch the NIST sources for OpenMP; it is
 * placed on the include path only for the WASM build.
 */
#ifndef PQCTODAY_OMP_SHIM_H
#define PQCTODAY_OMP_SHIM_H

#ifdef _OPENMP
#error "compat/omp.h is the single-threaded shim; do not combine it with -fopenmp"
#endif

#ifdef __cplusplus
extern "C" {
#endif

static inline int omp_get_thread_num(void) { return 0; }
static inline int omp_get_num_threads(void) { return 1; }
static inline int omp_get_max_threads(void) { return 1; }

#ifdef __cplusplus
}
#endif

#endif /* PQCTODAY_OMP_SHIM_H */
