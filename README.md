# OpenTrackerFi

> **Plan. Manage. Track.**  
> Your plan. Your pace. Every peso on track.

OpenTrackerFi is a private, offline-first personal finance tracker designed around day-to-day budgeting in Philippine pesos. It currently runs as a single-page web application (SPA), storing finance data locally on the user's device without requiring an account or external database.

An Android debug APK is available for device testing. It uses the same offline app, with safe-area spacing, a branded launch splash, and a double-back exit prompt on Home.

## Features

- Dynamic monthly salary and payday settings
- Monthly allocation planning with customizable subcategories
- Daily expense, income, savings, and investment activity tracking
- Customizable accounts with permanent deletion that preserves activity history
- Consistent current account totals on Accounts, Dashboard, and Plan
- Separate monthly salary remaining/shortfall and expense-budget warnings
- Emergency-fund account selection and an editable target
- Activity summaries for 7 days, 30 days, 6 months, and 1 year
- Expense, savings, and investment comparisons with spike detection
- CSV activity export and printable analytics reports
- Local backup and restore, including encrypted backup support
- Dark mode and responsive bottom navigation
- Offline-first local storage
- Guided setup progress, daily tracking streaks, and responsible milestones

## Financial calculations

The app keeps balances and activity totals separate:

- Overall account balance is the sum of current remaining account balances.
- Monthly salary remaining/shortfall is salary minus recorded expenses this calendar month. It is a comparison, not a forecast or an additional balance. Setting salary does not deposit money.
- Expenses already debit the selected account. A salary shortfall is never deducted a second time.
- Savings and investment entries debit the selected account and record contributions. They do not credit another account, represent current holdings, or get added to overall balance.
- The emergency reserve uses the full positive balances of user-selected accounts. It is included in overall balance and excluded from available balance. Overdrafts still reduce overall balance; the emergency target does not move money.
- The monthly expense budget sums active allocations except Savings and Investments. Warnings start at 80%; expenses above 100% show the excess. No configured budget displays a setup message. Exceeding salary is a separate warning.
- The activity chart uses the current expense plan, prorated across its displayed buckets. Historical plans are not stored. The period selector affects activity analytics, not current balances or this month's salary/budget comparison.

Account deletion removes the account and its emergency selection, but retains all transactions and balance corrections. Deleting a historical activity from a deleted account does not recreate the account or change another account's balance.

### Existing data

The local storage key and version 4 format remain compatible, with an optional `emergencyAccountIds` field. Existing accounts previously marked removed are finalized as deleted when loading; activity and correction records remain. No accounts are automatically designated as emergency funds. Select the accounts holding that money on Plan; the existing emergency target is retained. Backup export/restore preserves these selections, and Zero everything clears them.

## Source structure

```text
app/page.tsx                    Web route; forwards to the shared app
app/globals.css                 Shared theme and styles
mobile/main.tsx                 Static SPA / Android entry
src/
  app/finance-tracker.tsx       Shared state, navigation, and page composition
  types/finance.ts             Account, transaction, allocation, and plan types
  lib/finance.ts               Empty defaults, categories, and common helpers
  components/finance-ui.tsx    Shared tooltips, metrics, and activity rows
  features/
    dashboard/                 Overview and setup progress
    accounts/                  Account list, editing, and balance corrections
    activity/                  Activity history, filters, and entry form
    allocations/               Monthly allocation breakdown editor
    plans/                     Plan settings and analytics presentation
    analytics/                 Pure chart, ratio, and streak calculations
    settings/                  Salary settings, reset, and export workflows
  services/
    local-storage.ts           Loading and existing-data migration
    backup.ts                  Backup encryption and decryption
components/ui/                 Existing reusable interface primitives
tests/                         Finance workflow and module regression checks
```

The web route and static SPA share one state owner. Feature components receive
the same records and update callback, keeping account balances and analytics
consistent across pages. Local storage keys and the existing record schema are
preserved. This scaffold does not activate cloud sync or market integrations.

## Technology

- React 19
- TypeScript
- Vinext and Vite
- Tailwind CSS
- Recharts
- Capacitor Android packaging
- Browser local storage for offline persistence

## Local development

Requirements:

- Node.js 22.13 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Create a production web build:

```bash
npm run build
```

## Quality checks

Run the automated finance workflow tests:

```bash
npm run test:qa
```

Additional checks:

```bash
npm run lint
npm run build
```

The QA suite covers salary comparisons, single expense deductions, deletion with retained history, emergency reserves, budget warning thresholds, migration, encryption, and interface wiring.

## Data and privacy

OpenTrackerFi is local-first. Finance records are saved in the browser storage of the device where the app is used.

- No account registration is required.
- No finance data is uploaded by the app's current offline version.
- Clearing browser or application storage may remove local records.
- Export a backup before clearing data, changing devices, or testing an update.
- Never enter passwords, OTPs, private keys, wallet seed phrases, or exchange credentials.

## Android debug build (Windows)

Install JDK 21 and Android SDK platform 36/build tools 35.0.0, set `JAVA_HOME` and `ANDROID_HOME`, then run:

```powershell
npm run android:debug
```

The helper also detects the optional local tools under `work/android-tools`. Each successful build replaces `outputs/debug.apk` and moves the Gradle-generated APK there, rather than keeping duplicate APK versions. A failed compilation leaves the previous APK intact. Tools, caches, APKs, and signing keys are not committed.

The APK supports Android 7+. Back closes a dialog first, returns another page to Home next, and requires a second Back press within two seconds to exit from Home. The launch splash uses the header's currency-circle mark on green, with a bounded wait for WebView loading.

Install updates over the existing debug app signed with the same key to preserve local data. Export a backup before device testing. Public distribution still requires release signing and device validation.

## Investment disclaimer

Manually recorded investment values reflect the value entered by the user. Actual balances may differ from the investment or cryptocurrency platform because OpenTrackerFi does not currently synchronize market prices or fluctuations. OpenTrackerFi is a tracking and planning tool, not financial advice, a trading platform, or a guarantee of returns.

## License

No open-source license has been declared yet. All rights are reserved unless a license is added by the repository owner.
