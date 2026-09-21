// SPDX-License-Identifier: GPL-3.0-only
//
// Types for @testing-library/jest-dom's matchers on Vitest 5's `expect`.
//
// Vitest 4 typed `expect(x)` as `Assertion<T>` and inherited the global
// `jest.Matchers` interface, which is what `import '@testing-library/jest-dom'`
// (src/test/setup.ts, and most component tests) augments. Vitest 5 changed
// `Assertion` to `Assertion<R, T>`, stopped inheriting `jest.Matchers`, and
// instead exposes its own `Matchers<R, T>` interface in module 'vitest' for
// exactly this kind of augmentation. jest-dom 7.0.1 predates that: its
// `./vitest` entry still augments `Assertion<T>` (a type-parameter mismatch
// on Vitest 5) and its default entry augments `jest.Matchers` (no longer
// read). Runtime is unaffected — `expect.extend` still registers the
// matchers — but `tsc -b` lost `toBeInTheDocument` & co. on ~2,600 call
// sites. This file supplies the augmentation Vitest 5 expects, in the shape
// jest-dom's own `vitest.d.ts` will presumably adopt; delete it once a
// jest-dom release ships Vitest 5 types.
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Matchers<R, T> extends TestingLibraryMatchers<any, R> {}
}
