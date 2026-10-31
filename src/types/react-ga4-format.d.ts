// SPDX-License-Identifier: AGPL-3.0-only
// react-ga4 ships no types for its string-formatting helper. analytics.ts uses it so events that
// carry extra parameters are named exactly like the ones sent through ReactGA.event().
declare module 'react-ga4/dist/format' {
  export default function format(s?: string, titleCase?: boolean, redactingEmail?: boolean): string
}
