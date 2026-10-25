# Site wide lint cleanup

Resolve the eight existing errors and three warnings without disabling rules or changing user-visible behavior unnecessarily.

## Implementation plan

1. Reproduce the full lint report and inspect every flagged component.
2. Replace effect-driven derived state with render-time derivation or keyed component state. Keep effects for subscriptions, browser APIs and asynchronous callbacks, with cleanup.
3. Correct JSX escaping and unused lint directives. Name exported configuration objects where required.
4. Run the complete lint command, TypeScript, all tests, SEO verification and a production build. Record any environment limits on browser verification.

## Acceptance checks

- `npm run lint -- --max-warnings 0` exits successfully.
- No rule suppressions are introduced to hide findings.
- Deferred loading, motion preferences, carousel behavior, checkout cancellation notices and student forms retain their intended behavior.

## Implementation completed — 25 October 2026

- Replaced the cancellation-notice mount effect with a location subscription.
- Kept card setup asynchronous with cleanup that ignores responses after unmount, and preserved its retry control.
- Removed effect-driven carousel index correction; subscribed to reduced-motion preferences with a hydration-safe snapshot.
- Preserved deferred-form loading and its no-IntersectionObserver fallback. In-view effects now synchronize DOM styles directly and clean up observers and motion-preference listeners.
- Fixed JSX escaping, named configuration exports and removed an obsolete lint directive. No new lint suppression was introduced.

### Verification

- Full ESLint run with `--max-warnings 0`: passed.
- TypeScript: passed.
- Full Vitest suite: 73 tests passed across 7 files.
- Production Next.js build: passed.
- Interview SEO check against the production output: passed.
- Full dependency audit: 0 vulnerabilities.
- Browser interaction verification was unavailable; no production deployment was performed.
