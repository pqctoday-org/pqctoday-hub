/* SPDX-License-Identifier: GPL-3.0-only
 * glibc's ldbl-128/ieee754.h includes <features.h> + <bits/endian.h> and
 * expects glibc's __BEGIN_DECLS/__END_DECLS (musl has none). */
#include <endian.h>
#ifndef __BEGIN_DECLS
#define __BEGIN_DECLS
#define __END_DECLS
#endif
