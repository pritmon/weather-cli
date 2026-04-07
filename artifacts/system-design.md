# System Design — Weather CLI & Web Dashboard

A detailed system design document covering architecture, data flow, scalability, and design decisions.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│                                                          │
│   ┌──────────────────┐      ┌──────────────────────┐    │
│   │   CLI (Node.js)  │      │  Web UI (Browser)    │    │
│   │  weather <city>  │      │  index.html (Static) │    │
│   └────────┬─────────┘      └──────────┬───────────┘    │
└────────────┼──────────────────────────┼────────────────┘
             │                          │
             ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│                   EXTERNAL API LAYER                     │
│                                                          │
│   ┌──────────────────────────────────────────────────┐  │
│   │         Open-Meteo Geocoding API                 │  │
│   │   GET /v1/search?name=london&count=1             │  │
│   │   Response: { lat, lng, name, country }          │  │
│   └──────────────────────┬───────────────────────────┘  │
│                          │ lat/lng                       │
│   ┌──────────────────────▼───────────────────────────┐  │
│   │         Open-Meteo Forecast API                  │  │
│   │   GET /v1/forecast?latitude=x&longitude=y        │  │
│   │   Response: { temperature, humidity, wind... }   │  │
│   └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow

### CLI Flow
```
User types: weather london --json
     │
     ▼
parseArgs()          → extract city="london", json=true
     │
     ▼
geocodeCity("london") → GET geocoding API → returns { lat: 51.5, lng: -0.1, name: "London" }
     │
     ▼
fetchWeather(51.5, -0.1) → GET forecast API → returns WeatherData object
     │
     ▼
if (--json) → JSON.stringify() → stdout
else        → formatWeather()  → chalk colored terminal output
```

### Web UI Flow
```
User types "lon" in search box
     │
     ▼ (250ms debounce)
fetchSuggestions("lon") → GET geocoding API (count=6) → dropdown list
     │
     ▼ (user clicks "London, England")
loadWeatherFromGeo(loc) → GET forecast API → render weather card
     │
     ▼
applyTheme(category)    → change body class → CSS animation + canvas particles
```

---

## 3. Module Design

### CLI Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| `cli.ts` | Argument parsing | `process.argv` | `CliArgs { city, json }` |
| `geocode.ts` | City → coordinates | city string | `GeoResult { lat, lng, name, country }` |
| `weather.ts` | Coordinates → weather | lat, lng | `WeatherData { temp, humidity, wind... }` |
| `format.ts` | Render terminal output | GeoResult + WeatherData | stdout (chalk colored) |
| `index.ts` | Orchestration | — | Calls all modules in sequence |

### Dependency Graph
```
index.ts
  ├── cli.ts        (no dependencies)
  ├── geocode.ts    (no dependencies)
  ├── weather.ts    (no dependencies)
  └── format.ts
        └── chalk   (npm package)
```

Zero circular dependencies. Each module is independently importable.

---

## 4. API Design

### Geocoding Request
```
GET https://geocoding-api.open-meteo.com/v1/search
  ?name=london
  &count=1
  &language=en
  &format=json
```

### Forecast Request
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=51.50853
  &longitude=-0.12574
  &current=temperature_2m,apparent_temperature,
           relative_humidity_2m,wind_speed_10m,
           uv_index,weather_code,is_day
  &temperature_unit=celsius
  &wind_speed_unit=kmh
```

### JSON Output Schema
```json
{
  "city": "London",
  "region": "England",
  "country": "United Kingdom",
  "latitude": 51.50853,
  "longitude": -0.12574,
  "temperature_c": 14.2,
  "feels_like_c": 13.1,
  "humidity_pct": 78,
  "wind_speed_kmh": 22.4,
  "uv_index": 1.2,
  "weather_code": 3,
  "condition": "Overcast",
  "is_day": true
}
```

---

## 5. Weather Category Mapping

```
WMO Code → Category → Theme
─────────────────────────────
0–1       → sunny    → golden gradient + sun rays + orb particles
2–3       → cloudy   → grey gradient + drifting animation
45–48     → foggy    → light grey flat gradient
51–55     → drizzle  → dark blue gradient + rain particles (80)
61–65     → rainy    → dark teal gradient + rain particles (80)
71–77     → snowy    → cold blue gradient + snow particles (120)
80–82     → rainy    → dark teal gradient + rain particles (80)
85–86     → snowy    → cold blue gradient + snow particles (120)
95–99     → stormy   → dark purple gradient + orb particles + lightning
```

---

## 6. Error Handling Strategy

```
Layer 1 — Input Validation (cli.ts)
  └── No city arg → print help, exit 1

Layer 2 — Network Errors (geocode.ts, weather.ts)
  └── fetch() throws → "Network error: check your connection"

Layer 3 — HTTP Errors (geocode.ts, weather.ts)
  └── res.ok === false → "API returned HTTP {status}"

Layer 4 — Empty Results (geocode.ts)
  └── results.length === 0 → "City not found: try different spelling"

Layer 5 — Process Exit
  └── All errors → exit code 1 (Unix convention)
```

---

## 7. Performance Characteristics

| Operation | Typical Latency | Notes |
|-----------|----------------|-------|
| Geocoding API call | 80–150ms | ~2KB response |
| Forecast API call | 100–200ms | ~1KB response |
| Total CLI execution | 300–600ms | Sequential (step 2 needs step 1) |
| Web UI autocomplete | 80–150ms | Debounced 250ms |
| Canvas particle render | 16ms/frame | 60fps on modern hardware |

---

## 8. Scalability Considerations

### Current Architecture (Zero Infrastructure)
- Static HTML hosted on GitHub Pages — CDN-backed, global
- CLI runs locally — no server load
- All API calls go directly to Open-Meteo — unlimited scale

### Phase 2 — If Scale Becomes a Concern
```
Current:   Browser → Open-Meteo API (direct)
Phase 2:   Browser → HCL Proxy Server → Open-Meteo API
                          │
                          └── Redis cache (TTL: 15 min)
                              Rate limiter (per IP)
                              Response logging
```

Cache key: `weather:{city_name}:{date_hour}`
Cache TTL: 15 minutes (Open-Meteo updates every 15 min)

---

## 9. Security Model

| Threat | Mitigation |
|--------|-----------|
| Command injection via city input | Input only passed to `URL.searchParams` — never to shell |
| XSS in web UI | All API data written via `.textContent`, never `.innerHTML` |
| Sensitive data exposure | No API keys, no user data, no auth — nothing to expose |
| Dependency vulnerabilities | `npm audit` on every CI run; minimal deps (1 prod dep) |
| CORS attacks | No server — no CORS attack surface |

---

## 10. Deployment Architecture

```
GitHub Repository (pritmon/weather-cli)
     │
     ├── Push to main
     │        │
     │        ▼
     │   GitHub Actions CI
     │   ├── npm ci
     │   ├── tsc (build)
     │   └── smoke test
     │
     └── docs/index.html
              │
              ▼
         GitHub Pages CDN
         pritmon.github.io/weather-cli
         (Auto-deploys on every push to main)
```

---

## 11. Future Phases

| Phase | Feature | Complexity |
|-------|---------|-----------|
| 2 | 7-day forecast view | Low |
| 2 | Fahrenheit toggle | Low |
| 2 | Share weather card as image | Medium |
| 3 | Redis cache proxy | Medium |
| 3 | Weather alerts / thresholds | Medium |
| 3 | Multi-city comparison | Medium |
| 4 | Mobile app (React Native) | High |
| 4 | Slack / Teams integration | Medium |
| 4 | Historical weather data | High |

---

*System Design Document v1.0 — weather-cli — Adani Digital Engineering Practice*
