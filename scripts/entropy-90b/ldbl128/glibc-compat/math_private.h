/* SPDX-License-Identifier: GPL-3.0-only
 * Minimal stand-in for glibc's internal <math_private.h>, just enough to
 * compile glibc 2.41's sysdeps/ieee754/ldbl-128 {e_logl,e_log2l,e_expl,
 * e_powl,s_log1pl}.c with emscripten; see ../ldbl128_wrappers.c for why. */
#ifndef PQCTODAY_GLIBC_MATH_PRIVATE_H
#define PQCTODAY_GLIBC_MATH_PRIVATE_H
#include <stdint.h>
#include <endian.h>
#include <float.h>
#include <math.h>
#if LDBL_MANT_DIG != 113
#error "ldbl-128 sources need IEEE binary128 long double"
#endif
#ifndef __FLOAT_WORD_ORDER
#define __FLOAT_WORD_ORDER __BYTE_ORDER
#endif
#define _Float128 long double
#define L(x) x##L
#include "math_ldbl.h" /* glibc sysdeps/ieee754/ldbl-128/math_ldbl.h */
#define __frexpl frexpl
#define __scalbnl scalbnl
#define math_narrow_eval(x) (x)
#define math_opt_barrier(x) (x)
#define math_force_eval(x) do { volatile __typeof__(x) __pqct_v = (x); (void)__pqct_v; } while (0)
/* These only raise the underflow flag in glibc; values are unaffected. */
#define math_check_force_underflow(x) ((void)0)
#define math_check_force_underflow_nonneg(x) ((void)0)
/* Body taken from glibc 2.41 sysdeps/ieee754/ldbl-128/s_issignalingl.c
   (LGPL-2.1-or-later, Free Software Foundation), long double only. */
static inline int issignaling(long double x) {
  uint64_t hxi, lxi;
  GET_LDOUBLE_WORDS64(hxi, lxi, x);
  hxi ^= 0x0000800000000000ULL;
  hxi |= (lxi | -lxi) >> 63;
  return (hxi & 0x7fffffffffffffffULL) > 0x7fff800000000000ULL;
}
_Float128 __ieee754_logl(_Float128);
_Float128 __ieee754_log2l(_Float128);
_Float128 __ieee754_expl(_Float128);
_Float128 __ieee754_powl(_Float128, _Float128);
_Float128 __log1pl(_Float128);
#endif
