# FORMA UI/UX audit and redesign

## Scope and data safety

Reviewed every route under `src/app`, including the five tabs, onboarding, template/session editors, exercise library/detail, nutrition, hydration, meal planner, recovery, calendar, settings and nested layouts. This redesign keeps the existing local repositories, database schema, migrations, reference catalogs, backup format and calculations. No user database was opened, reset or migrated during this work. Tests use a separate database under `.test-build`.

## Findings and changes

| Area | Audit finding | Implemented change |
| --- | --- | --- |
| Shared screens | Back controls above the title; repeated marketing headings/footer; inconsistent spacing | Fixed shared header with 46-point chevron control, aligned title, direct-link fallback, safe areas and centered maximum-width content |
| Tabs | Every icon looked active; labels were small | Focus-aware icon background/text, 12-point labels, accessible selected state, bottom safe-area padding |
| Home | Too many equally prominent statistics and six actions | Today-first workout/protein/water/recovery, four quick actions, actual weekly workout/distance/activity totals, record-based next-session guidance, expandable secondary information and weight sheet |
| Profile | Initial only, ungrouped information and destinations | Large avatar; grouped Personal, Fitness, Nutrition and App rows; direct editing of matching onboarding steps; photo preview/save/replace/remove |
| Onboarding | Back at bottom, duplicate navigation conventions | Step-aware header back and profile editing entry points; existing validation and draft fields retained |
| Training | Templates, personal records and history on one long page | Workouts/Records/History segmented sections; consistent template cards and actions |
| Template editor | Large exercise chooser; immediate exercise removal | Searchable selection, collapsible add section, confirmation before removal, preserved reordering and set targets |
| Active/completed workout | Repeated notes dominate set entry | Collapsible set/session details; existing timer, pause/resume, rest controls and completed-set logic retained; immersive route remains outside tabs |
| Exercise library/detail | Long filter chips and custom form; missing search empty state | Searchable long selection list, custom-exercise sheet, explicit no-results state; shared detail header and controls |
| Running | Full manual entry form before history | Primary Log run action, entry/edit sheet, two-column summary; manual-only GPS status remains accurate |
| Progress | Ten metric chips; narrow chart touch targets; empty filtered weight view | Expandable metric filter, horizontally scrolling 44-point bars with value labels, correct empty state for selected range |
| Nutrition | Full meal/custom-food forms crowded summary and diary | Meal and custom-food sheets, searchable food selection, compact macro cards, retained portion/sodium corrections and unknown-value behavior |
| Hydration | Custom/edit form always visible | Compact quick amounts, custom/edit sheet, history visible earlier |
| Calendar | Week mode still showed unrelated month; crowded scheduling form; color-only event markers | Week-specific heading, activity descriptions in accessible date labels, scheduling/edit sheet, preserved status/rescheduling actions |
| Recovery | Rating cards nested inside form card | Flat rating rows in check-in sheet, summary/history before entry, preserved subjective summary rules |
| Meal planner | Setup above saved plans, expanded recipe/grocery/price forms; success rendered as error | Saved plans first, expandable setup/preferences, recipe instructions and shopping editors on demand, separate success message |
| Settings | Long backup/status sections | Expandable backup, notification, integration and About sections; photos excluded explicitly from JSON backup; explicit reset also removes profile photo |

## Shared design system

`src/components/design.tsx` supplies AppHeader, Screen, Label, Card, buttons, accessible icon controls, Field/FormInput, SelectionCard/Choices, SectionHeader, responsive grids, StatCard, ProgressCard/Meter, ProgressRing/Ring, ProfileAvatar, SettingsRow, EmptyState, LoadingState, ErrorText, SuccessText, ExpandableSection, BottomSheet and ConfirmationModal. Existing `ui` imports re-export this system.

Controls use minimum 44–50-point touch targets, visible input focus, theme-derived colors, selected/expanded accessibility states, keyboard dismissal and keyboard avoidance. Progress transitions and modal transitions respect reduced motion. Native back gestures remain managed by Expo Router. Sheet-contained long selectors expand inline to avoid stacking native selection modals. Delete confirmation uses one root overlay; profile closes its sheet before requesting removal confirmation.

## Profile-photo storage

- Browser: JPEG/PNG/WebP picker, 8 MB input limit, centered square preview converted to a 512-pixel JPEG; persisted image data in AsyncStorage/browser storage. No object URL is saved. Camera uses the browser's capture hint; availability depends on browser/device.
- Native: Expo ImagePicker native bridge, camera permission handling and cancellation; selected image copied into `Paths.document/profile-photos`. The saved metadata points to this owned file, never the picker cache. File size is checked after copying.
- Save failures retain the previous metadata/photo and remove the uncommitted copy. Replacement/removal clean up only files in the app-owned directory. Cleanup failure does not invalidate committed metadata. The Home and Profile avatars subscribe to the same store. Broken image display falls back to initials.
- Profile photo metadata is separate from fitness records and the existing schema-version-1 backup. It is intentionally excluded from JSON exports; restoring a backup does not replace the local photo. Explicit user-data reset removes it.

### Native installation limitation

The registry is unavailable and SDK-compatible `expo-image-picker ~57.0.20` is not cached. Its installation failed, so no unresolved package import or nonexistent config plugin was added. The adapter currently accesses `ExponentImagePicker` through Expo's optional native-module API (available in Expo Go); when absent it reports a clear installation error. A custom native build still requires `npx expo install expo-image-picker`, its config plugin with camera/photo permission descriptions and a rebuild. This bridge has not been exercised on a device. `expo-file-system 57.0.7` was already installed transitively; it is now declared directly with matching lockfile metadata. The offline install attempt could not resolve unrelated uncached registry metadata.

## Verification

- TypeScript and project ESLint: passed during implementation; final checks recorded below.
- Automated suite: 21 passed. Existing calculations, meal planning, SQLite migration/save/rollback/reopen and backup checks remain green. Added photo reload/replacement/removal, metadata failure/cleanup, temporary-URL rejection and size-boundary tests through injected storage/file adapters.
- Automated photo tests do not exercise a real camera, file picker, browser storage or native file system.
- Web static export and Android/iOS JavaScript exports: results recorded after final runs.
- No iPhone/Android simulator or device session was available. Browser interaction testing is not claimed; the earlier local Chrome attempt failed with Windows IPC/Crashpad access errors.
- Layouts at 320/390/430-point widths, desktop resizing, both themes, screen readers, keyboard navigation/focus restoration, safe-area rendering, camera/library permission denial/cancellation, actual restart/refresh photo persistence and native modal presentation still require interactive acceptance testing.
- GPS/maps, local notifications, food recognition/photos, progress photos, persistent custom goals/achievement archive and cloud services remain the original implementation's explicitly pending features. The redesign does not present them as completed.
## Final verification results (2026-10-10)

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed with the project's basic TypeScript ESLint configuration |
| `npm test` | 21 passed; adapter-based photo storage and Node SQLite, not browser/device interactions |
| `npx expo export --platform web` | Passed; 23 static routes, web bundle and SQLite worker |
| `npx expo export --platform android --platform ios --no-bytecode --output-dir dist-native` | Passed; Android 1,816 modules, iOS 1,733 modules; JavaScript exports, not signed native builds |
| Browser/device visual and interaction checks | Not performed in this environment |
| Custom-build ImagePicker installation | Blocked by unavailable registry/cache; optional Expo Go bridge implemented but untested on device |
## Floating bottom navigation follow-up

The tab layout now renders a reusable `src/components/FloatingTabBar.tsx` through Expo Router's `TabList asChild`. All five route definitions stay visible to Router's trigger discovery. There is one bar, scoped to `(tabs)`; onboarding, nested editors and active workouts remain outside it.

The pill has a 32-point radius, themed solid surface/border/shadow, 16-point side margins plus horizontal safe-area insets, a 520-point maximum width and a bottom offset of `safeArea.bottom + 12`. Tabs retain accessible selected states and touch targets of at least 44 points. The Home icon is a house, Train a barbell, Run an activity pulse, Progress a chart and Profile the existing persisted photo with a user-icon fallback. The avatar subscribes to the existing photo store and resets its image-error fallback when the URI changes. Active highlights fade over 160 ms, with reduced motion disabling the transition.

A context supplies the actual measured bar height plus its bottom offset and 20 points of clearance to shared tab-screen scroll padding and scroll-indicator insets. Nested screens receive the default zero floating inset. Measuring the bar also accounts for font scaling. Native keyboard events hide the bar during editing; web input/textarea/select/contenteditable focus handles browser keyboards. Route definitions stay mounted while the bar is hidden.

Follow-up verification: TypeScript, project lint, all 21 existing persistence/calculation checks and web export (23 routes) passed. Android/iOS JavaScript export results are recorded on completion. Interactive tab switching, photo rendering, keyboard behavior, theme contrast and safe-area appearance on physical devices/browser viewports remain acceptance checks; compilation is not a claim that those interactions were manually tested. No database, migrations, photo persistence implementation or fitness features were changed by this follow-up.
Native follow-up export also passed: Android 1,818 modules and iOS 1,735 modules with `--no-bytecode`. These are JavaScript bundling checks, not native device/build validation.
## Train and Progress card refinement

Train now uses compact workout cards with muscle labels, exercise/time metadata, accessible play actions, search and a session-preview sheet with exercise/set details. Collection cards adapt from one mobile column to two tablet/desktop columns. Workouts/Records/History use a shared segmented control. Actual weekly session/minute summaries and personal-record tiles replace oversized text-heavy panels, and history uses tappable compact rows. Existing template/session routes and workout-start validation are retained; starting from a preview dismisses it before navigation.

Progress now presents one prominent chart card with a selected/latest-day readout, subtle gridlines, selected bars and date labels. Metric and extended-range selection use a sheet; quick ranges remain immediately available. Average and first-to-latest changes come from actual filtered records. Milestones use compact status rows with a View all toggle; weight history expands into a compact list with existing confirmed deletion. Existing metrics, ranges, calculations and data writes are retained.

Shared visual controls live in `src/components/fitness-ui.tsx`. No database or persistence changes were made. TypeScript, lint and all 21 existing automated checks passed. Interactive visual/device testing was not performed in this environment.
