# Playwright + TypeScript Test Automation Framework

UI tests for [SauceDemo](https://www.saucedemo.com/) and API tests for the
[Simple Books API](https://github.com/vdespa/introduction-to-postman-course/blob/main/simple-books-api.md),
built on **Playwright Test**, with **Page Object Model**, **cross-browser** (Chromium/Chrome + Firefox),
**parallel execution** and **Allure** reporting.

## Features

| Requirement | How it is done |
|---|---|
| Cross-browser | Playwright projects `ui-chromium` and `ui-firefox` run the same UI specs |
| Parallel execution | `fullyParallel: true`; worker count via `WORKERS` env (default: 50% of cores, 4 on CI) |
| Page Object Model | `src/pages/*` - one class per page, locators private, tests only call intent-level methods |
| Fixtures | `src/fixtures/*` inject page objects, logged-in state, API clients and per-test data with cleanup |
| Reporting | Allure (`allure-playwright`) + Playwright HTML report; traces, screenshots and videos kept on failure |
| API testing | `APIRequestContext` through a typed `BooksApiClient` wrapper |
| CI | GitHub Actions workflow in `.github/workflows/tests.yml` |

## Project structure

```
.
├── playwright.config.ts        # projects, parallelism, reporters
├── src
│   ├── api/                    # BooksApiClient + response types
│   ├── config/env.ts           # base URLs (overridable via .env)
│   ├── data/                   # users, products, checkout data
│   ├── fixtures/               # ui.fixture.ts, api.fixture.ts
│   └── pages/                  # Page Objects (Login, Inventory, Cart, Checkout*)
└── tests
    ├── ui/                     # login.spec.ts, order.spec.ts
    └── api/                    # books.spec.ts, orders.spec.ts
```

## Getting started

Requirements: Node.js 18+ (20 recommended).

```bash
npm install
npm run install:browsers     # downloads Chromium + Firefox
cp .env.example .env         # optional - override URLs
```

## Running tests

```bash
npm test                     # everything: UI (Chromium + Firefox) + API, in parallel
npm run test:chrome          # UI on Chromium only
npm run test:firefox         # UI on Firefox only
npm run test:api             # API tests only
npm run test:smoke           # tests tagged @smoke
npm run test:headed          # watch the browser
WORKERS=2 npm test           # control parallelism (Windows PowerShell: $env:WORKERS=2; npm test)
npx playwright test tests/ui/login.spec.ts --project=ui-firefox   # a single file
```

To use the locally installed Google Chrome instead of bundled Chromium, add
`channel: 'chrome'` to the `ui-chromium` project's `use` block.

## Reports

```bash
npm run report               # generate Allure report and open it
npm run allure:serve         # or serve results directly
npx playwright show-report   # built-in HTML report
```

Allure results land in `allure-results/` (git-ignored). `npm run clean` removes all report artefacts.

## What is covered

**UI - login** (`tests/ui/login.spec.ts`): standard / problem / performance_glitch / error / visual users can log in;
locked-out user is rejected; wrong password, unknown user, case sensitivity, whitespace, SQL-style input,
empty username, empty password, both empty; error banner can be dismissed; direct access to `/inventory.html`
without login; logout.

**UI - order** (`tests/ui/order.spec.ts`): log in -> add one product (Sauce Labs Backpack) -> cart -> checkout
information -> overview (item + total) -> finish -> confirmation -> back home with an empty cart.
Plus: missing first name validation and removing an item.

**API** (`tests/api`): 
`GET /status`, `GET /books` (type filter, limit, invalid limit/type), `GET /books/:id` (404),
`POST /api-clients` (201, 409 duplicate, 400 missing field), token checks (missing and invalid token -> 401),
`POST /orders` (201, validation 400s, out-of-stock), `GET`, `PATCH` (204 + read-back, 404), `DELETE` (204,
second delete 404), ownership isolation between two API clients, and a serial create -> read -> update -> delete lifecycle.

## Design notes

- **Isolation for parallel runs**: each worker registers its own API client (unique email) and every API test
  creates and deletes its own order. UI tests get a fresh browser context each and share no state.
- **Locators**: `testIdAttribute` is set to `data-test` (SauceDemo's convention); `getByRole` is used where possible.
- **Assertions live in page objects** (`expectX`) so specs read like scenarios; API specs assert directly on
  responses because status codes and payloads are the thing under test.
- **Configuration**: `UI_BASE_URL`, `BOOKS_API_URL`, `WORKERS` via environment or `.env`.

## Notes / assumptions

- The Simple Books API base URL defaults to `https://simple-books-api.click`. If the service moves, set `BOOKS_API_URL`.
- Access tokens are valid for 7 days; the API may rate-limit registrations, so lower `WORKERS` if you see 429s.
- A few API assertions (for example that another client's token gets 404 on someone else's order) reflect the
  API's observed behaviour; adjust them in `tests/api/orders.spec.ts` if the service changes.
