# Architecture Decision Log

> One line per decision. Date, decision, rationale.
> When a future session asks "should I...?" — check here first.

---

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-07-24 | Primary target: iOS, secondary Android | Developer daily-drives iPhone. Expo shares 99% of code; Android verified once per stage. |
| 2025-07-24 | Currency is configurable at runtime | Support EGP, USD, and any ISO 4217 currency. Currency definition (symbol, code, decimals, minorDivisor) passed as parameter, never hardcoded. |
| 2025-07-24 | Basis-point rounding: largest-remainder method | Ensures integer basis points sum to exactly 10,000. Deterministic, no float drift. |
| 2025-07-24 | Dark-mode first, light mode deferred | Reduces design surface for v1. Can add light theme later via NativeWind config. |
| 2025-07-24 | Local builds only (no EAS) | $0 budget constraint. `npx expo run:ios/android` compiles locally. Free provisioning for iOS (7-day re-sign). |
