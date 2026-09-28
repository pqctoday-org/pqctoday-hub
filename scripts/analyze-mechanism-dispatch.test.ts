// Synthetic-source KATs for the G-7 dispatch extractor: each fixture pins one
// classification the report depends on, including the ones that must NOT
// count as dispatch (parameter switches, rejections, advertise-side functions,
// cfg(test) code). Without these, "advertised − dispatched = ∅" could just
// mean the extractor calls everything dispatched.
import { describe, it, expect } from 'vitest'
import { parseConstants, scanFile, stripCommentsAndStrings } from './analyze-mechanism-dispatch'

const CPP = `
#define CASE_OF(M, X) \\
  case M: \\
    algo = X; break;
static const Entry kTable[] = {
  { CKM_TABLED, 1 },
};
CK_RV SoftHSM::SignInit(CK_MECHANISM_PTR pMechanism)
{
  // case CKM_IN_COMMENT:
  const char* s = "case CKM_IN_STRING:";
  switch (pMechanism->mechanism) {
    case CKM_A:
    case CKM_B:
      doIt();
      break;
    CASE_OF(CKM_MACRO, 3)
#ifdef WITH_X
    case CKM_GUARDED:
      break;
#endif
    case CKM_REJECTED:
      return CKR_MECHANISM_INVALID;
  }
  switch (params->hashAlg) {
    case CKM_SHA256:
      break;
  }
  if (pMechanism->mechanism == CKM_CMP) return CKR_OK;
  useConstant(CKM_REF_ONLY);
  return CKR_OK;
}
`

const RUST = `
pub fn mechanism_info(mech_type: u32) -> Option<u32> {
    match mech_type {
        CKM_ADVERTISE_ONLY => Some(1),
        _ => None,
    }
}
fn C_SignInit_impl(mech_type: u32, hash_alg: u32) -> u32 {
    match mech_type {
        CKM_A | CKM_B => { go(); }
        CKM_C if ok() => go(),
        (CKM_REJECTED) => return CKR_MECHANISM_INVALID,
        _ => {}
    }
    match hash_alg {
        CKM_SHA256 => 1,
        _ => 0,
    };
    if matches!(mech_type, CKM_M1 | CKM_M2) {}
    let s = "CKM_IN_STRING";
    0
}
#[cfg(test)]
mod tests {
    fn t(mech: u32) { match mech { CKM_TEST_ONLY => {}, _ => {} } }
}
`

const summarize = (sites: ReturnType<typeof scanFile>) =>
  Object.fromEntries(
    sites.map((x) => [
      x.token,
      `${x.kind}/${x.scrutineeClass}${x.rejects ? '/rejects' : ''}${x.conditions.length ? `/${x.conditions.join('&&')}` : ''}`,
    ])
  )

describe('stripCommentsAndStrings', () => {
  it('blanks comments and literals but keeps line structure', () => {
    const src = 'a // CKM_X\n"CKM_Y" /* CKM_Z\n */ b'
    const out = stripCommentsAndStrings(src, 'cpp')
    expect(out).not.toMatch(/CKM_/)
    expect(out.split('\n')).toHaveLength(3)
    expect(out.length).toBe(src.length)
  })
})

describe('scanFile — C++', () => {
  const sites = scanFile('x.cpp', CPP, { lang: 'cpp', excludeFunctions: [] })
  const s = summarize(sites)
  it('classifies mechanism switch labels, macro-generated labels, tables and comparisons', () => {
    expect(s.CKM_A).toBe('switch-case/mechanism')
    expect(s.CKM_B).toBe('switch-case/mechanism')
    expect(s.CKM_MACRO).toBe('switch-case/mechanism')
    expect(s.CKM_TABLED).toBe('static-table/mechanism')
    expect(s.CKM_CMP).toBe('comparison/mechanism')
  })
  it('keeps non-dispatch apart: parameter switches, rejections, bare references', () => {
    expect(s.CKM_SHA256).toBe('switch-case/parameter')
    expect(s.CKM_REJECTED).toBe('switch-case/mechanism/rejects')
    expect(s.CKM_REF_ONLY).toBe('reference/null')
  })
  it('records the preprocessor condition and ignores comments/strings/#define bodies', () => {
    expect(s.CKM_GUARDED).toBe('switch-case/mechanism/defined(WITH_X)')
    expect(s.CKM_IN_COMMENT).toBeUndefined()
    expect(s.CKM_IN_STRING).toBeUndefined()
    expect(sites.find((x) => x.token === 'CKM_A')?.fn).toBe('SoftHSM::SignInit')
  })
})

describe('scanFile — Rust', () => {
  const sites = scanFile('x.rs', RUST, { lang: 'rust', excludeFunctions: ['mechanism_info'] })
  const s = summarize(sites)
  it('classifies match arms (incl. or-patterns and guards) and matches!', () => {
    expect(s.CKM_A).toBe('match-arm/mechanism')
    expect(s.CKM_B).toBe('match-arm/mechanism')
    expect(s.CKM_C).toBe('match-arm/mechanism')
    expect(s.CKM_M1).toBe('matches-macro/mechanism')
    expect(s.CKM_M2).toBe('matches-macro/mechanism')
  })
  it('parameter matches and rejecting arms are not dispatch', () => {
    expect(s.CKM_SHA256).toBe('match-arm/parameter')
    expect(s.CKM_REJECTED).toBe('match-arm/mechanism/rejects')
  })
  it('skips the advertise-side function and cfg(test) code entirely', () => {
    expect(s.CKM_ADVERTISE_ONLY).toBeUndefined()
    expect(s.CKM_TEST_ONLY).toBeUndefined()
    expect(s.CKM_IN_STRING).toBeUndefined()
  })
})

describe('parseConstants', () => {
  it('resolves literals, aliases and OR expressions (vendor-defined values)', () => {
    const cpp = parseConstants([
      {
        lang: 'cpp',
        src: [
          '#define CKM_VENDOR_DEFINED 0x80000000UL',
          '#define CKM_KMAC_128 (CKM_VENDOR_DEFINED | 0x00000100UL)',
          '#define CKM_ALIAS CKM_KMAC_128',
          '#define CKM_SHA256 0x00000250UL',
        ].join('\n'),
      },
    ])
    expect(cpp.get('CKM_KMAC_128')).toBe(0x80000100)
    expect(cpp.get('CKM_ALIAS')).toBe(0x80000100)
    expect(cpp.get('CKM_SHA256')).toBe(0x250)
    const rust = parseConstants([
      {
        lang: 'rust',
        src: 'pub const CKM_HSS: u32 = 0x0000_4033;\npub const CKM_X: u32 = CKM_HSS;',
      },
    ])
    expect(rust.get('CKM_HSS')).toBe(0x4033)
    expect(rust.get('CKM_X')).toBe(0x4033)
  })
})
