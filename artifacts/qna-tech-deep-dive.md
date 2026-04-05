# Weather CLI — Technical Q&A Deep Dive

A comprehensive question-and-answer breakdown of every technical decision made in this project. Useful for interviews, code reviews, and onboarding.

---

## Table of Contents

1. [Architecture & Design](#1-architecture--design)
2. [TypeScript & Build](#2-typescript--build)
3. [API Integration](#3-api-integration)
4. [CLI Design](#4-cli-design)
5. [Terminal Output & Formatting](#5-terminal-output--formatting)
6. [Web UI](#6-web-ui)
7. [Error Handling](#7-error-handling)
8. [CI/CD & GitHub Actions](#8-cicd--github-actions)
9. [Security](#9-security)
10. [Performance](#10-performance)
11. [Extensibility](#11-extensibility)

---

## 1. Architecture & Design

**Q: Why is the project split into separate files (geocode, weather, format, cli, index)?**

A: Single Responsibility Principle. Each file owns one concern:
- `geocode.ts` — city name resolution
- `weather.ts` — forecast data fetching and WMO code mapping
- `format.ts` — terminal rendering
- `cli.ts` — argument parsing and help text
- `index.ts` — orchestration only (wires everything together)

This makes each unit independently testable and replaceable without touching the rest.

---

**Q: Why is `index.ts` only an orchestrator with no business logic?**

A: The entry point should be a thin shell. Business logic in `index.ts` would make it impossible to import individual functions (geocode, fetch, format) in other contexts such as a REST API wrapper, a test, or a different CLI interface.

---

**Q: Why use ESM (`"type": "module"`) instead of CommonJS?**

A: `chalk` v5+ is ESM-only and does not support `require()`. Since we depend on it, the entire project must be ESM. ESM is also the direction Node.js is moving and enables top-level `await` if needed.

---

**Q: Could you run both a CLI and a web server from the same codebase?**

A: Yes. The `geocode.ts` and `weather.ts` modules are pure async functions with no CLI coupling. You could import them into an Express/Fastify server and expose a `/weather?city=london` endpoint with zero changes to those files.

---

## 2. TypeScript & Build

**Q: Why `"moduleResolution": "bundler"` in tsconfig?**

A: With ESM and Node 18+, the `bundler` resolution strategy correctly handles `.js` extensions in import paths (required for ESM output) without needing `node16` or `nodenext` which are stricter and require explicit `.js` suffixes everywhere. It matches how modern bundlers and tools like Vite resolve modules.

---

**Q: Why are imports written as `./geocode.js` even though the source files are `.ts`?**

A: TypeScript compiles `.ts` → `.js` but does not rewrite import paths. The runtime will look for `.js` files, so imports must already point to `.js`. This is a quirk of ESM + TypeScript — you write the final output extension in the source.

---

**Q: What does `strict: true` enforce in tsconfig?**

A: It enables a bundle of checks:
- `strictNullChecks` — `null`/`undefined` must be handled explicitly
- `noImplicitAny` — every variable must have an inferable type
- `strictFunctionTypes` — function parameter types are checked covariantly
- `strictPropertyInitialization` — class fields must be initialized

Together they catch entire classes of runtime bugs at compile time.

---

**Q: Why is `chalk.ChalkFunction` not used and `ChalkInstance` used instead?**

A: In chalk v5, the exported type for a chalk instance (or a chained chalk call like `chalk.bold`) is `ChalkInstance`, not `ChalkFunction`. The latter does not exist as a named export in the type definitions. Using the correct type avoids TS2503 namespace errors.

---

**Q: Why not use `ts-node` in production?**

A: `ts-node` adds runtime overhead by transpiling on-the-fly and is a dev dependency. Distributing compiled `.js` files in `dist/` is faster to start, has no dev dependency requirement, and is what real CLI tools ship.

---

## 3. API Integration

**Q: Why Open-Meteo instead of OpenWeatherMap or WeatherAPI?**

A: Open-Meteo is:
- **Free with no API key** — zero friction for users
- **Open-source** — the model code is public
- **High quality** — uses ECMWF, GFS, and other NWP models
- **Privacy-respecting** — no account or tracking required

It removes the #1 barrier for weather CLI tools: "go get an API key first."

---

**Q: What is the WMO weather code system?**

A: The World Meteorological Organization defines a standard set of integer codes for weather conditions. Code `0` = clear sky, `3` = overcast, `61` = light rain, `95` = thunderstorm, etc. Open-Meteo returns these codes in the `weather_code` field. Mapping them to human labels and icons is done in `weather.ts` via a plain record lookup — O(1), no library needed.

---

**Q: Why two API calls (geocode + forecast) instead of one?**

A: Open-Meteo's forecast API only accepts latitude/longitude, not city names. The geocoding step converts the human-readable city name to coordinates. This separation is intentional by the API provider and mirrors how production weather systems work (coordinates are the universal truth, city names are locale-dependent strings).

---

**Q: How does the geocoding URL get constructed safely?**

A: Using the `URL` class and `searchParams.set()`:
```ts
const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
url.searchParams.set("name", city);
```
This automatically percent-encodes special characters (spaces → `%20`, etc.), preventing broken URLs for city names like "New York" or "São Paulo".

---

**Q: Why `fetch` instead of `axios` or `node-fetch` (as a heavy dependency)?**

A: Node 18+ ships `fetch` natively as a stable global. Using it means:
- Zero extra dependencies for HTTP
- Smaller `node_modules`
- Faster install
- No version mismatch issues

`node-fetch` is still listed as a dependency for compatibility, but native `fetch` is preferred when Node >= 18.

---

**Q: What weather fields are fetched and why?**

| Field | Why |
|-------|-----|
| `temperature_2m` | Air temp at 2m height — standard meteorological measurement |
| `apparent_temperature` | Feels-like (accounts for wind chill and humidity) |
| `relative_humidity_2m` | Humidity percentage |
| `wind_speed_10m` | Wind at 10m — standard anemometer height |
| `uv_index` | UV radiation level |
| `weather_code` | WMO code for condition category |
| `is_day` | Whether it's currently daytime at location |

All requested in a single API call by passing a comma-separated `current` parameter — no extra round trips.

---

## 4. CLI Design

**Q: Why not use a CLI framework like `commander` or `yargs`?**

A: The interface is simple: one positional argument (city) and one flag (`--json`). A full framework adds ~500KB of dependencies for parsing two things. The custom `parseArgs` function in `cli.ts` is 30 lines and covers all cases. YAGNI — you ain't gonna need it.

---

**Q: How does the `--json` flag work with multi-word cities like "new york"?**

A: `parseArgs` filters out anything starting with `--` to get city parts, then joins them with a space:
```ts
const cityParts = args.filter((a) => !a.startsWith("--"));
return { city: cityParts.join(" "), json: jsonFlag };
```
So `weather new york --json` → city = `"new york"`, json = `true`.

---

**Q: Why does the CLI exit with code `1` on errors?**

A: Exit code `1` is the Unix convention for "something went wrong." This allows the CLI to be composed in shell scripts:
```bash
weather london --json | jq '.temperature_c' || echo "Failed"
```
If the process exits `0` on error, the `||` branch never fires.

---

**Q: What does `process.argv.slice(2)` do?**

A: `process.argv` is an array where index 0 is the `node` binary path and index 1 is the script path. User arguments start at index 2. Slicing removes the runtime boilerplate so only the actual CLI arguments remain.

---

## 5. Terminal Output & Formatting

**Q: How are weather categories mapped to ASCII icons?**

A: A `categorize(code)` function maps WMO code ranges to one of 7 categories: `sunny`, `cloudy`, `rainy`, `drizzle`, `snowy`, `stormy`, `foggy`. Each category has a 5-line ASCII art array in `ASCII_ICONS`. The icon and the temperature/condition are printed side-by-side using index-based conditional insertion.

---

**Q: How does chalk colorize terminal output?**

A: Chalk wraps strings in ANSI escape codes. For example `chalk.red("hello")` outputs `\x1b[31mhello\x1b[39m`. Terminals that support ANSI sequences render this as red text. Chalk auto-detects terminal color support and falls back gracefully in environments that don't support color (e.g., CI log files).

---

**Q: Why use `chalk.hex("#FF8C00")` instead of a named color for UV index?**

A: Chalk v5 removed `.keyword()` (which relied on the `color-name` package). `hex()` is the direct replacement and has no third-party dependency. It also gives precise color control — orange is not in the basic 16-color ANSI set.

---

**Q: Why round temperature to 1 decimal place in `weather.ts` rather than in `format.ts`?**

A: The data model should own numeric precision decisions. If formatting is done in two places (CLI + JSON output), both would need to independently round. Rounding once in the model layer ensures consistency: the JSON output and the terminal display always show the same number.

---

## 6. Web UI

**Q: Why a single `index.html` file with no framework?**

A: The requirements called for it explicitly, and it's the right choice here:
- No build step needed
- Deployable by dropping a single file anywhere (GitHub Pages, S3, CDN)
- No React/Vue bundle overhead (~100KB+ saved)
- The interactivity (search + API calls) is simple enough that vanilla JS handles it in ~150 lines

---

**Q: How do the animated weather backgrounds work?**

A: A CSS class (e.g., `body.sunny`, `body.rainy`) is toggled on `<body>` based on the weather category. Each class applies a different `background` gradient with optional CSS `animation`. JavaScript reads the weather code, derives the category, and calls `document.body.classList.add(category)`.

---

**Q: How does the particle system work (rain, snow, floating orbs)?**

A: A `<canvas>` element is overlaid fixed on the page. A `Particle` class holds position, speed, opacity, and type. Each frame:
1. `ctx.clearRect()` wipes the canvas
2. Each particle's `update()` moves it (downward for rain/snow, upward for orbs with wobble)
3. Each particle's `draw()` renders it (line for rain, arc for snow/orbs)
4. `requestAnimationFrame` loops

When category changes, `cancelAnimationFrame` stops the old loop and `spawnParticles()` starts a new one with the correct type and count.

---

**Q: How does the lightning flash work for stormy weather?**

A: `setInterval` fires every 3 seconds. With 40% probability, a full-viewport `div` with a semi-transparent purple background is injected into the DOM, then faded out and removed after 80ms. This creates an irregular, realistic flash without any image assets.

---

**Q: How does the loading skeleton work?**

A: Three elements exist simultaneously: `#skeleton`, `#weather-card`, `#error-box`. Only one is shown at a time via CSS `display: none` / `.active` toggling. The skeleton uses a `background: linear-gradient` with `background-size: 200%` animated via `background-position` — this is the standard "shimmer" technique, pure CSS, no JS.

---

**Q: Why does the web UI make its own API calls instead of going through the CLI?**

A: The CLI is a Node.js process — it can't serve a browser. The web UI runs client-side in the browser and calls Open-Meteo directly. Since Open-Meteo supports CORS (cross-origin requests from browsers), no backend proxy is needed. This keeps the web UI fully static and hostable on GitHub Pages.

---

**Q: How is the UI mobile responsive?**

A: Key techniques:
- `clamp(min, preferred, max)` for font sizes — scales with viewport
- `max-width` on cards with `width: 100%` — never overflows
- CSS Grid with `grid-template-columns: repeat(2, 1fr)` for stats — 2-column on all sizes
- `padding: 40px 16px` on the app container — safe margins on small screens
- `overflow-x: hidden` on `body` — prevents horizontal scroll from canvas

---

## 7. Error Handling

**Q: What errors can occur and how is each handled?**

| Error | Where caught | User message |
|-------|-------------|--------------|
| City not found (empty geocode result) | `geocode.ts` | "City not found: try different spelling" |
| Network failure (fetch throws) | `geocode.ts`, `weather.ts` | "Network error: check your connection" |
| Non-200 HTTP response | Both API files | "API returned HTTP {status}" |
| No city argument | `cli.ts` | Usage hint printed, exit 1 |

---

**Q: Why use `try/catch` on `fetch()` separately from the response check?**

A: `fetch()` only throws on network-level errors (DNS failure, timeout, no internet). A non-200 HTTP response (404, 500) does NOT throw — it resolves with `res.ok === false`. Both must be handled:
```ts
try {
  res = await fetch(url);          // throws on network error
} catch { throw new Error("Network error..."); }
if (!res.ok) throw new Error(`HTTP ${res.status}`);  // handles 4xx/5xx
```

---

**Q: Why cast API responses with `as { results?: GeoResult[] }` instead of validating at runtime?**

A: This is a deliberate tradeoff. Open-Meteo is a stable, well-documented public API with a consistent schema. Full runtime validation (with Zod or similar) would add ~50KB of dependency and complexity for minimal benefit. The `?.` optional chaining on `data.results` already guards the only field that can be absent (when city is not found). For production systems handling untrusted data, runtime validation would be appropriate.

---

## 8. CI/CD & GitHub Actions

**Q: Why test on Node 18, 20, and 22 in the matrix?**

A: Node releases follow an LTS (Long Term Support) cycle:
- **18** — oldest supported LTS (still in maintenance)
- **20** — current active LTS
- **22** — latest LTS

Testing all three catches version-specific regressions. For example, native `fetch` behavior or ESM resolution differences between versions.

---

**Q: What does `npm ci` do differently from `npm install`?**

A: `npm ci`:
- Installs exactly what's in `package-lock.json` — no version resolution
- Fails if `package-lock.json` is missing or out of sync with `package.json`
- Deletes `node_modules` before installing (clean slate)
- Faster in CI because it skips the resolution step

This ensures CI builds are deterministic and reproducible.

---

**Q: What is the smoke test step in CI doing?**

A: `node dist/index.js --help` verifies:
1. The TypeScript compiled without errors
2. The compiled JS is syntactically valid (Node can execute it)
3. The `--help` code path runs without throwing

It's not a unit test but confirms the artifact is functional end-to-end.

---

**Q: Why is `cache: npm` set in the setup-node action?**

A: It caches the `~/.npm` directory between workflow runs. On subsequent runs, `npm ci` downloads only changed packages instead of all of them. This typically cuts install time from 30s to under 5s on warm caches.

---

## 9. Security

**Q: Is there any risk of command injection in this CLI?**

A: No. User input (the city name) is only ever:
1. Passed to `URL.searchParams.set()` — which percent-encodes it safely
2. Printed to the terminal via `console.log` — no shell execution involved

There is no `exec()`, `spawn()`, `eval()`, or template string interpolation into shell commands.

---

**Q: Does the web UI have any XSS risk?**

A: Minimal. Data from the API is written to the DOM via `.textContent`, not `.innerHTML`:
```js
document.getElementById("city-name").textContent = loc.name;
```
`textContent` treats the value as plain text and never parses HTML. The only `innerHTML` equivalent used is for the static skeleton markup which contains no user data.

---

**Q: Why is there no API key to protect?**

A: Open-Meteo requires no authentication. There are no secrets in this codebase. The `.env.example` file exists only as a placeholder for forks that might add a paid provider.

---

**Q: Should `node_modules` ever be committed?**

A: No. It's in `.gitignore`. Committing `node_modules` bloats the repo (typically 50–500MB), creates merge conflicts, and is OS/architecture-specific. `package-lock.json` is committed instead — it pins exact versions so anyone can reproduce the install with `npm ci`.

---

## 10. Performance

**Q: How many network round trips does a single `weather <city>` command make?**

A: Exactly 2:
1. `GET` geocoding API (city → lat/lng)
2. `GET` forecast API (lat/lng → weather data)

They are sequential (step 2 depends on step 1's output) but both are lightweight JSON responses typically under 2KB. Total latency is usually 200–600ms on a normal connection.

---

**Q: Could the two API calls be parallelized?**

A: No — the forecast request requires the coordinates that the geocoding request returns. They are inherently sequential. Parallelism would only apply if you were fetching weather for multiple cities simultaneously (e.g., `Promise.all([fetchWeather(lat1, lon1), fetchWeather(lat2, lon2)])`).

---

**Q: Is there caching?**

A: Not currently. Weather data changes every 15 minutes, and the CLI is a short-lived process. Adding a file-based cache (e.g., `~/.cache/weather-cli/`) with a TTL would reduce API calls for repeat queries of the same city. That's a natural next feature.

---

## 11. Extensibility

**Q: How would you add support for Fahrenheit?**

A: Two changes:
1. Add a `--units imperial` flag in `cli.ts`
2. Pass `temperature_unit=fahrenheit` to the Open-Meteo URL in `weather.ts`

The API handles the conversion server-side — no math needed in the code.

---

**Q: How would you add a 7-day forecast?**

A: Open-Meteo supports a `daily` parameter alongside `current`. Add it to the forecast URL, extend the `WeatherData` type to include a `forecast` array, and add a rendering section in `format.ts`. The web UI would need a horizontal scroll row of daily cards.

---

**Q: How would you add unit tests?**

A: The pure functions are immediately testable:
- `conditionFromCode(0)` → `"Clear sky"` (no mocking needed)
- `categorize(61)` → `"rainy"` (no mocking needed)
- `parseArgs(["node", "script", "london", "--json"])` → `{ city: "london", json: true }`

For `geocodeCity` and `fetchWeather`, mock `fetch` using `vi.stubGlobal("fetch", ...)` with Vitest or `jest.spyOn(global, "fetch")` with Jest.

---

**Q: How would you turn this into a REST API?**

A: Create `src/server.ts`:
```ts
import Fastify from "fastify";
import { geocodeCity } from "./geocode.js";
import { fetchWeather } from "./weather.js";

const app = Fastify();
app.get("/weather", async (req, reply) => {
  const { city } = req.query as { city: string };
  const geo = await geocodeCity(city);
  const wx  = await fetchWeather(geo.latitude, geo.longitude);
  return { ...geo, ...wx };
});
app.listen({ port: 3000 });
```
The core logic modules require zero changes.

---

---

## 12. Tricky Interview Questions

These are the unexpected, deeper questions an interviewer might throw at you. Straight answers below.

---

**Q: You used `fetch` natively but also listed `node-fetch` as a dependency. Isn't that contradictory?**

A: Valid catch. Native `fetch` was added in Node 18 and became stable in Node 21. `node-fetch` was added early as a safety net for Node 18 edge cases. In hindsight, since the engine field already requires `>=18.0.0` and the CI tests against 18/20/22 where native `fetch` works, `node-fetch` can be removed. It's a leftover from early caution — not a design flaw, but unnecessary weight.

---

**Q: What happens if Open-Meteo changes their API schema and adds a breaking change?**

A: The TypeScript cast `as { current: { temperature_2m: number; ... } }` would silently accept the new shape but the field access would return `undefined` at runtime, producing `NaN` or blank output without crashing. The fix is runtime validation with Zod or a simple field presence check before rendering. This is a known tradeoff — we chose speed of development over defensive validation for a trusted, stable API.

---

**Q: The web UI calls the API directly from the browser. What if Open-Meteo adds CORS restrictions tomorrow?**

A: The web UI would break immediately — all fetch calls would be blocked by the browser. The fix would be to add a thin proxy server (e.g., a Cloudflare Worker or a simple Express endpoint) that relays requests server-side. Currently there's no CORS issue because Open-Meteo explicitly allows cross-origin requests. We accepted this dependency consciously to avoid needing any backend infrastructure.

---

**Q: How would you handle two cities with the same name — e.g., there are multiple "Springfield" cities in the US?**

A: The geocoding API returns results sorted by population by default, so it would return the most prominent Springfield. For the CLI, we take the first result (`results[0]`). A better UX would be to detect multiple results with the same name and prompt the user to disambiguate — e.g., showing "Springfield, Illinois" vs "Springfield, Missouri". The web UI autocomplete already shows the region/country in the dropdown for this reason.

---

**Q: Why does `tsconfig.json` use `"moduleResolution": "bundler"` instead of `"node16"` or `"nodenext"`?**

A: `node16` and `nodenext` enforce that every relative import must explicitly include the `.js` extension in source files and also validate that `package.json` exports maps are correct. They are stricter but cause friction when working with tools that don't yet fully support those modes. `bundler` gives the same ESM-compatible resolution without the strict extension requirement, making it more ergonomic for a CLI project that isn't a published npm package with complex exports.

---

**Q: Your ASCII icons are hardcoded strings. What if a terminal doesn't support Unicode?**

A: The icons use basic ASCII characters — dashes, dots, parentheses — which are safe in any terminal. The lightning bolt `⚡` in the stormy icon is the only Unicode character. If it renders as `?` in an old terminal, the icon still reads as a cloud shape with a line through it. A more robust solution would detect `process.env.TERM` or check for Unicode support via `process.stdout.hasColors()` and fall back to a pure ASCII version.

---

**Q: The `--json` flag outputs to stdout. What if the user redirects stdout to a file and also wants to see errors?**

A: Errors are printed to `stderr` via `console.error()`, not `stdout`. This is intentional Unix design — data goes to stdout, diagnostics go to stderr. So `weather london --json > output.json` captures only the JSON in the file while error messages still appear in the terminal. The two streams are independent.

---

**Q: Why not use `process.env` for configuration like base URLs?**

A: The API URLs are stable, public, and free — there's nothing to configure. Using `process.env` would add complexity (dotenv, `.env` files, documentation) for no real benefit. Configuration via environment variables is appropriate for secrets (API keys, database URLs) or environment-specific values (staging vs prod). Neither applies here. The `.env.example` file exists only as a placeholder for future contributors who might add a paid provider.

---

**Q: You have no rate limiting on the autocomplete. Couldn't a user spam the Open-Meteo API?**

A: Yes — a user who types very fast could trigger many requests. We mitigated this with a **250ms debounce** — the API is only called 250ms after the user stops typing, not on every keystroke. For a tool with a small number of internal users (Adani operations supervisors), this is acceptable. At scale, you'd add server-side rate limiting or a caching layer. Open-Meteo itself has no strict rate limits for normal usage, so the practical risk is low.

---

**Q: The project has no tests. How would you defend that in a code review?**

A: Fair challenge. The honest answer is: this was a rapid-prototype delivery with a 3-day timeline and a simple, narrow scope. The pure functions (`conditionFromCode`, `categorize`, `parseArgs`) have no side effects and are trivially testable. The API integration functions (`geocodeCity`, `fetchWeather`) require mocking `fetch`. The CI smoke test (`node dist/index.js --help`) at least verifies the build artifact is functional. For a production system, I would add Vitest unit tests on day one. The architecture was deliberately kept modular so tests can be added without refactoring.

---

**Q: What's the difference between `chalk.bold.white("text")` and `chalk.white.bold("text")`? Does order matter?**

A: No, the order does not matter for the final output. Chalk chains are commutative for independent modifiers — `bold` and `white` do not conflict, so both produce the same ANSI escape sequence. Order would only matter if two modifiers conflict (e.g., `chalk.red.blue` — in that case the last color wins). This is a chalk implementation detail: each chained property returns a new `ChalkInstance` with the modifier accumulated, and the final string is built by wrapping in all accumulated ANSI codes.

---

**Q: Could this project be turned into an npm package and published publicly?**

A: Almost — three things need to happen first:
1. The `bin` field in `package.json` already points to `dist/index.js` ✅
2. Add a `prepublishOnly` script: `"prepublishOnly": "npm run build"` so it compiles before publishing
3. Add a shebang `#!/usr/bin/env node` at the top of the compiled `dist/index.js` (already in `src/index.ts`) so it runs as an executable

Then `npm publish` would make `npx weather-cli london` work globally. The only blocker is the package name — `weather-cli` may already be taken on the npm registry.

---

*Document generated for the `weather-cli` project — Open-Meteo powered, TypeScript, Node.js 18+*
