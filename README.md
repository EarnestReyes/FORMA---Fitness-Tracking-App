# FORMA

Train Smarter. Eat Better. Become Stronger.

A frontend-only React Native / Expo Router app for iOS and Android. This is a working implementation milestone, **not the completed 26-phase specification**. No backend, account server, cloud database, AI recognition, email delivery or external photo upload is connected.

## Run

Requires Node 22.13+ and npm. Node 24 was used for checks. The existing Expo SDK 57 / React Native 0.86 configuration is retained.

```sh
cd Forma
npm ci --legacy-peer-deps
npm start
# Or:
npm run android
npm run ios
npm run web
```

Use a compatible Expo Go installation or an SDK 57 development build. Windows cannot run the iOS simulator: test on an iPhone or macOS. Native modules require a matching native binary. Build locally with `npx expo run:android` / `npx expo run:ios` when the platform toolchain is available, or configure EAS development builds. No native directories have been generated and no build has been submitted. See [SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/).

### Dependency limitation

The environment blocks package-registry access. SQLite 57.0.2, AsyncStorage 2.2.0 and icons 15.1.1 were installed from genuine cached package tarballs in `vendor/`. ESLint and its TypeScript parser also use cached packages. Keep the tarballs: package.json and the lockfile reference them. `.npm-cache/` is ignored workspace scratch data. Installation used legacy peer resolution because cached metadata did not resolve the already installed Expo versions correctly.

**Expo's compatibility check fails: SQLite 57.0.2 is installed, but this SDK expects ~57.0.4.** This warning is not hidden. Native compatibility remains unverified. With registry access, align the patch before device acceptance:

```sh
npx expo install expo-sqlite
npx expo install --check
npx expo-doctor
```

Use `npx expo install <package>` for additions. Zustand, LinearGradient, ImagePicker, FileSystem, Notifications, Location and third-party chart/calendar libraries have not been installed. The current store uses React useSyncExternalStore; charts and calendars use React Native primitives. This milestone does not fully match the requested stack.

## Implemented

| Area | Behavior |
| --- | --- |
| Foundation | Strict TypeScript, Expo Router, five tabs, protected main routes, safe areas, keyboard avoidance, shared light/dark/system themes persisted locally, loading/storage-error states |
| Onboarding | Nine steps; personal measurements; goals; strength/running experience; equipment; nutrition, allergies and budget; cooking constraints; preferred days; reminder interest; editable summary; validation and saving |
| Home | Greeting/date, initials avatar, notification-status link, scheduled workout details, real weekly sessions/distance, weight, protein, known sodium, hydration, recovery and recent activities |
| Strength | Eight editable reference templates; create/rename/delete; add/remove/reorder exercises; sets/reps/load/notes; durable active session and pause/resume timer; rest countdown; add/edit/remove/complete sets; finish; editable/deletable history and calculated records |
| Exercises | 43 movements; search/muscle/equipment/favorite filters; instructions/cues/mistakes; custom exercises; details; create a workout containing a selected exercise |
| Running | Manual date/distance/duration/effort/notes; edit/delete; calculated pace; weekly/monthly distance, weighted average pace, longest run and fastest recorded average pace |
| Nutrition | 23 estimated local foods, including requested Filipino foods; custom packaged foods; search; decimal serving quantities; meal categories; edit/delete; calories/protein/carbs/fat/sodium; optional total-sodium correction; unknown sodium retained |
| Hydration | Personal target/ring; +150/+250/+350/+500 mL; custom entry; date-filtered history; edit/delete |
| Meal planning | 12 Filipino recipes; 7/30 days; total PHP budget; protein target; diet/allergy/preparation/equipment filtering; saved plans; edit/regenerate, duplicate/delete; recipe details; swaps; log selected planned meals into today's diary |
| Groceries | Consolidated ingredients; editable estimated package prices/serving yields; package rounding/leftovers; pantry quantities; shopping quantity overrides; purchased checkboxes; recalculation; explicit budget/protein shortfalls |
| Calendar | Weekly/monthly views; category colors; create/edit/reschedule/delete; completed/skipped/planned status; dashboard updates |
| Recovery | Sleep, quality, soreness, energy, fatigue, readiness, rest day; edit/delete; explained subjective labels |
| Progress | Recorded-day interactive charts; 7/30/90/365/all-time filters; weight, workouts, distance, pace, strength/load/volume, protein, known sodium, water, readiness; basic calculated milestone badges |
| Settings | Profile/targets/budget editing; themes; integration-status transparency; versioned JSON export/import with validation and transactional replacement; confirmed local-data deletion; about |

No fake activity histories are seeded. Reference exercises, foods, recipes, templates and estimated prices are the only initial data. Onboarding's weight record comes from the user's confirmed input.

## Behavior and limits

- Calendar completion does not create a workout/run record. Log actual activity separately.
- Volume is completed repetitions x entered kg. Bodyweight sets at 0 kg have 0 external-load volume.
- Active timer timestamps persist. Rest countdowns are in memory. Use the set/session save controls to commit edits.
- Charts omit unlogged dates and show at most the latest 30 recorded dates in the selected range, explicitly labeled. Readiness is subjective, not a medical score.
- Nutrition and prices are estimates, not authoritative labels or live market data. Confirm product labels and cross-contact risks. Unknown allergy terms stop plan generation instead of being silently ignored.
- Meal planning is a heuristic, not an optimal budget solver or nutrition prescription. It balances cost/protein/variety, then checks simpler repeated-meal alternatives if shopping exceeds budget. It can fail budget or protein targets; failures are displayed. Low budgets can produce low variety or inadequate nutrition, requiring review.
- Grocery quantities use the displayed food servings, sometimes cooked equivalents. Confirm raw purchase weights and cooking yields. Package costs are editable. Pantry entries assume stock is available; quantity overrides can intentionally under-purchase. Purchased checkboxes do not reduce total costs.
- Planned meals currently log to today's Lunch category. Categories can be edited in Nutrition. The log button does not mark calendar activities completed.
- Reminder interest is only a saved preference. No notification is scheduled and no delivery is claimed.
- Units are metric; profile avatars are initials. There are no photo files to back up.

## Persistence

`src/app` holds routes. `components`, `features`, `database`, `repositories`, `stores`, `hooks`, `services`, `types`, `constants` and `utils` separate presentation, logic, storage and integrations.

`forma.db` is the primary source of truth. Two versioned migrations seed reference records only. SQLite enables foreign keys/WAL, binds user values, preserves stable IDs and created/updated timestamps, and commits related records transactionally. Templates/exercises and sessions/sets are related tables; other implemented entities use JSON payloads in dedicated tables, validated by application forms/import. The complete requested normalized schema remains a later migration milestone.

Mutations are serialized, committed and reread before subscribers refresh. Current writes replace small collections transactionally; larger histories need incremental entity-specific writes. Theme lives in AsyncStorage.

Versioned JSON backups include profile, references and implemented records, including meal plans/prices. Import checks numeric ranges, dates, relationships, duplicate child IDs and daily meal counts before replacement. Theme and photos are excluded. Export/import uses copy/paste JSON; native file picking/sharing is pending. Uninstalling can remove app data; keep backups.

[Expo SQLite web support](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/) needs wasm and cross-origin isolation. metro.config.js configures wasm and development headers. Static hosts must send `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin`. Web export passed, but browser interactions were not exercised here.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npx expo export --platform web
npx expo export --platform android --platform ios --no-bytecode
```

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for actual results. Lint uses the TypeScript parser with basic correctness rules, not the unavailable SDK 57 Expo preset. Tests use real Node SQLite through an Expo API adapter; they do not verify native device behavior. Disabling bytecode is a bundling diagnostic, not a production-build recommendation.

## Remaining work

1. Align SQLite's expected SDK patch, then test iPhone/Android launches, persistence, navigation and both themes.
2. Foreground GPS, accuracy filtering, permission/error states, route persistence and maps. Background tracking remains a separate native milestone.
3. Return-to-running progression, custom goals, persistent achievements, and explained adaptive recommendations with accept/dismiss/save.
4. Install the SDK-compatible ImagePicker package/config plugin for custom native builds and device-test the new profile-photo flow. Food/progress photos and comparisons remain pending. Keep food recognition manual until connected.
5. Expo local notifications: permissions, quiet hours, duplicate prevention, cancellation/rescheduling and tap routing; no guaranteed delivery claims.
6. Saved email-preference/preview UI without delivery; food favorites; richer sodium/hydration trends; imperial conversion; native backup picking/sharing.
7. Remaining normalized tables/incremental repositories, remaining interaction/device validation, improved planner categories/analytics and remaining stack packages.
8. Only in a separately authorized backend phase: AI food recognition, email service, cloud synchronization, live prices and accounts. `services/integrations.ts` has interfaces only; no secrets.

Profile photo camera selection requests permission through the optional Expo Go ImagePicker bridge. Custom native builds need the ImagePicker package/config plugin and permission descriptions; location and notification features remain pending. See [UX_AUDIT.md](UX_AUDIT.md) for the redesign, photo persistence and actual testing limits.
