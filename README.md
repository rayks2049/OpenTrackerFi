# OpenTrackerFi

> **Plan. Manage. Track.**  
> Your plan. Your pace. Every peso on track.

OpenTrackerFi is a private, offline-first personal finance tracker designed around day-to-day budgeting in Philippine pesos. It currently runs as a single-page web application (SPA), storing finance data locally on the user's device without requiring an account or external database.

An Android release is planned for the future. Native Android project foundations are being prepared, but the supported release for now remains the SPA.

## Features

- Dynamic monthly salary and payday settings
- Monthly allocation planning with customizable subcategories
- Daily expense, income, savings, and investment activity tracking
- Customizable and archivable financial accounts
- Dashboard projections based on salary minus current-month logged expenses
- Activity summaries for 7 days, 30 days, 6 months, and 1 year
- Expense, savings, and investment comparisons with spike detection
- CSV activity export and printable analytics reports
- Local backup and restore, including encrypted backup support
- Dark mode and responsive bottom navigation
- Offline-first local storage
- Guided setup progress, daily tracking streaks, and responsible milestones

## Financial calculations

The projected salary-based balance uses:

```text
Monthly salary - expense entries logged during the current month
```

Monthly allocations are planning labels and do not reduce the projected balance. Savings and investment entries are included in analytics but are kept separate from the expense projection.

The projection is visible immediately with a limited-data notice and estimation disclaimer. Seven distinct expense logging days are recommended before treating trend behavior as data-backed.

Daily logging follows a short amount → category → account flow. Savings and Investments are classified automatically from the selected category; allocation breakdowns remain planning-only.

## Technology

- React 19
- TypeScript
- Vinext and Vite
- Tailwind CSS
- Recharts
- Capacitor foundations for the planned Android release
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

The QA suite covers projection calculations, allocation behavior, account consistency, deletion reversal, local data round-tripping, data reset behavior, and interface wiring.

## Data and privacy

OpenTrackerFi is local-first. Finance records are saved in the browser storage of the device where the app is used.

- No account registration is required.
- No finance data is uploaded by the app's current offline version.
- Clearing browser or application storage may remove local records.
- Export a backup before clearing data, changing devices, or testing an update.
- Never enter passwords, OTPs, private keys, wallet seed phrases, or exchange credentials.

## Android roadmap

OpenTrackerFi is heading toward an Android release. The future package will preserve the offline-first experience while providing an installable Android application.

Before a public Android release, the project still needs release signing, device testing, versioning, update delivery, and final privacy and security review. Until then, OpenTrackerFi should be treated as an SPA.

## Investment disclaimer

Manually recorded investment values reflect the value entered by the user. Actual balances may differ from the investment or cryptocurrency platform because OpenTrackerFi does not currently synchronize market prices or fluctuations. OpenTrackerFi is a tracking and planning tool, not financial advice, a trading platform, or a guarantee of returns.

## License

No open-source license has been declared yet. All rights are reserved unless a license is added by the repository owner.
