# weather-cli

[![CI](https://github.com/your-username/weather-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/weather-cli/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)

Beautiful terminal weather for any city — powered by [Open-Meteo](https://open-meteo.com), **no API key required**.

---

## Demo

> ![demo coming soon](https://via.placeholder.com/720x400?text=demo+coming+soon)
> *demo coming soon*

---

## What it does

`weather-cli` is a zero-config command-line tool that fetches real-time weather data for any city in the world and renders it in a colourful, icon-rich terminal output. It also ships a self-contained dark-theme web UI with animated weather backgrounds.

---

## Features

- **Zero config** — no API key, no account, just install and run
- **Colorful terminal output** with ASCII weather icons via [chalk](https://github.com/chalk/chalk)
- **8 weather categories** — sunny, cloudy, rainy, drizzle, snowy, stormy, foggy
- **Full weather data** — temperature, feels like, humidity, wind speed, UV index
- **`--json` flag** for piping into other tools or scripts
- **Graceful error handling** — clear messages for unknown cities and network errors
- **Web UI** (`public/index.html`) — single-file, dark glassmorphism design with:
  - Animated backgrounds that react to weather conditions
  - Falling rain / snow particle systems
  - Pulsing sun rays and lightning flash effects
  - 120 px hero temperature display
  - Loading skeleton animation
  - Fully mobile responsive

---

## Requirements

- **Node.js** >= 18.0.0
- npm >= 9

---

## Installation

### From source

```bash
git clone https://github.com/your-username/weather-cli.git
cd weather-cli
npm install
npm run build
```

### Link globally (optional)

```bash
npm link
# now use: weather <city>
```

---

## Configuration

No configuration is required. The tool calls the free [Open-Meteo](https://open-meteo.com) and [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) APIs directly.

See `.env.example` if you want to extend the project with an API key-based provider.

---

## Usage

```bash
weather <city> [--json]
```

### Examples

```bash
# Basic usage
weather london
weather tokyo
weather "new york"
weather paris
weather sydney

# JSON output (pipe-friendly)
weather berlin --json
weather mumbai --json | jq '.temperature_c'

# Help
weather --help
```

### Run without installing globally

```bash
node dist/index.js london
node dist/index.js tokyo --json
```

---

## Output

### Default (terminal)

```
  ──────────────────────────────────────────────────
  WEATHER — London, England, United Kingdom
  ──────────────────────────────────────────────────

   .-~~~-.        14.2°C
 .(       ).    Overcast
(___._____)

  Feels like      13.1° C
  Humidity        78     %
  Wind speed      22.4   km/h
  UV index        1.2 (Low)

  ──────────────────────────────────────────────────
```

### JSON (`--json`)

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

## Project structure

```
weather-cli/
├── src/
│   ├── index.ts        # Entry point & CLI wiring
│   ├── cli.ts          # Argument parsing & help text
│   ├── geocode.ts      # City name → lat/lng (Open-Meteo Geocoding API)
│   ├── weather.ts      # Weather data (Open-Meteo Forecast API)
│   └── format.ts       # Terminal formatting with chalk
├── public/
│   └── index.html      # Self-contained web UI
├── .github/
│   └── workflows/
│       └── ci.yml      # GitHub Actions CI (Node 18/20/22)
├── dist/               # Compiled JS (generated, git-ignored)
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
└── LICENSE
```

---

## API credits

- **Weather data**: [Open-Meteo](https://open-meteo.com) — free, open-source, no API key needed
- **Geocoding**: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and ensure `npm run build` passes with zero errors
4. Commit: `git commit -m "feat: describe your change"`
5. Open a pull request

Please keep PRs focused and include relevant context in the description.

---

## License

[MIT](LICENSE) — feel free to use, modify, and distribute.
