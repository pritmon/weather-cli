# LinkedIn Post — weather-cli

---

🌧️ **Built a real-time Weather CLI tool from scratch — live demo inside**

Most developers check weather on a browser tab.
I built a tool that does it in the terminal.

**weather-cli** — a TypeScript/Node.js CLI + Web UI powered by Open-Meteo (zero API key, zero cost).

What it does:
```
weather kohima
weather "los angeles" --json | jq '.temperature_c'
```

**Tech decisions that mattered:**
→ ESM-only (chalk v5 forced it — good constraint)
→ Native `fetch` — Node 18+ ships it, no axios needed
→ Single-file web UI — no React, no build step, just works
→ `--json` flag makes it pipe-friendly for automation

**Web UI features:**
✦ Animated backgrounds that react to weather (rain particles, sun rays, lightning flashes)
✦ Live city autocomplete — no more spelling errors
✦ Glassmorphism dark theme
✦ 120px hero temperature display

**What I documented:**
📄 Full BRD (as if it were a real enterprise engagement)
📄 12-section technical Q&A deep dive
📄 Tricky interview questions with honest answers

🔗 Live demo: pritmon.github.io/weather-cli
💻 GitHub: github.com/pritmon/weather-cli

Built this over a weekend. The hardest part wasn't the code — it was making the error messages actually helpful.

What CLI tools have you built that you actually use daily? 👇

---

#TypeScript #NodeJS #OpenSource #CLI #WebDevelopment #BuildInPublic #JavaScript #SideProject
