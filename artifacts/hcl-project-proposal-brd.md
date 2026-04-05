# Project Proposal & Business Requirements Document (BRD)
## Weather Intelligence CLI & Web Dashboard

---

| Field | Details |
|-------|---------|
| **Document Type** | Business Requirements Document (BRD) |
| **Project Name** | Weather Intelligence CLI & Web Dashboard |
| **Client** | Internal — Adani Logistics Operations Division |
| **Prepared By** | Adani Technologies — Digital Engineering Practice |
| **Version** | 1.0 |
| **Date** | April 2026 |
| **Status** | Approved |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context & Problem Statement](#2-business-context--problem-statement)
3. [Stakeholders](#3-stakeholders)
4. [Project Scope](#4-project-scope)
5. [Business Requirements](#5-business-requirements)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Technical Architecture Decision](#8-technical-architecture-decision)
9. [API & Third-Party Dependencies](#9-api--third-party-dependencies)
10. [Feasibility Study](#10-feasibility-study)
11. [Risk Register](#11-risk-register)
12. [Project Plan & Timeline](#12-project-plan--timeline)
13. [Cost Estimation](#13-cost-estimation)
14. [Acceptance Criteria](#14-acceptance-criteria)
15. [Sign-Off](#15-sign-off)

---

## 1. Executive Summary

Adani's Logistics Operations Division manages a fleet of 1,200+ delivery drivers across 14 cities in India and Southeast Asia. Operations supervisors currently spend an average of **23 minutes per shift** manually checking weather conditions across multiple browser tabs before dispatching vehicles and rerouting drivers during adverse conditions.

This document proposes the development of a **Weather Intelligence CLI Tool and Web Dashboard** that provides real-time, structured weather data for any city. The tool will integrate directly into the operations team's existing terminal-based workflow and provide a web interface for supervisors who prefer a visual interface.

**Expected Outcome:** Reduce manual weather-checking time by 90%, from 23 minutes to under 3 minutes per shift, across all operational hubs.

---

## 2. Business Context & Problem Statement

### 2.1 Current State

| Pain Point | Impact |
|-----------|--------|
| Supervisors manually check weather on consumer sites (weather.com, AccuWeather) | Time-consuming, inconsistent data sources |
| No structured data format — cannot feed into dispatch software | Manual re-entry of data, human error risk |
| Different team members check different cities with no standard | Inconsistent decision-making |
| No UV index or wind speed threshold alerts | Safety incidents during high-wind dispatches |
| Consumer weather sites have ads, slow load times | Friction slows down shift start |

### 2.2 Trigger for This Project

During a Q3 Operations Review, the Head of Logistics flagged a near-miss incident where a delivery batch was dispatched during a forecasted thunderstorm in Chennai. The data was available publicly but was not checked due to time pressure. This escalated to the CTO office and resulted in a mandate:

> *"All dispatch decisions involving weather must be backed by structured, timestamped weather data pulled from a reliable source."*

### 2.3 Opportunity

The Open-Meteo API provides free, high-quality weather data with no rate limits for standard usage. Building a thin integration layer on top of it gives Adani:
- A controlled, standardised data source
- The ability to pipe data into existing dispatch systems via JSON
- A reusable internal tool that can be extended across practices

---

## 3. Stakeholders

| Stakeholder | Role | Interest |
|-------------|------|----------|
| Head of Logistics Operations | **Executive Sponsor** | Reduce risk, improve efficiency |
| Operations Supervisors (×14 hubs) | **Primary Users** | Fast, accurate weather data |
| Dispatch Software Team | **Integration Consumer** | JSON-structured output for automation |
| Adani Internal DevOps | **Deployment Owner** | CI/CD, maintenance |
| Adani Digital Engineering Lead | **Delivery Manager** | On-time delivery, quality |
| Legal & Compliance | **Reviewer** | Data privacy, third-party API ToS |

---

## 4. Project Scope

### 4.1 In Scope

- Command-line tool: `weather <city>` with colored terminal output
- `--json` flag for structured output consumable by dispatch software
- Web UI (single-file, no framework) for supervisors who prefer a browser
- City autocomplete to reduce human error in city name entry
- Animated weather backgrounds reflecting current conditions
- Deployment to GitHub Pages (web UI) and npm-style internal distribution (CLI)
- GitHub Actions CI/CD pipeline
- Technical documentation (README, Q&A deep dive, this BRD)

### 4.2 Out of Scope

- Mobile app
- Push notifications / alerting system (Phase 2)
- Historical weather data
- Weather forecasting beyond current conditions
- Integration with dispatch software (Phase 2 — JSON output enables this)
- Multi-language support

---

## 5. Business Requirements

| ID | Requirement | Priority | Source |
|----|------------|----------|--------|
| BR-01 | Supervisors must be able to get weather for any city in under 5 seconds | High | Operations Team |
| BR-02 | Data must include temperature, feels like, humidity, wind speed, UV index | High | Safety Policy |
| BR-03 | Output must be available in machine-readable format (JSON) for future automation | High | Dispatch Software Team |
| BR-04 | Tool must work without any API key or paid subscription | High | Finance / Procurement |
| BR-05 | City name entry must be forgiving of spelling errors | Medium | Operations Team |
| BR-06 | Web interface must be accessible to non-technical supervisors | Medium | Operations Team |
| BR-07 | Tool must handle network failures gracefully with clear error messages | High | Operations Team |
| BR-08 | Solution must be maintainable by a junior developer | Medium | Adani DevOps |

---

## 6. Functional Requirements

### 6.1 CLI Tool

| ID | Requirement |
|----|------------|
| FR-01 | `weather <city>` command returns current weather in formatted terminal output |
| FR-02 | Output displays: city name, temperature (°C), condition, humidity, wind speed, UV index, feels like |
| FR-03 | ASCII weather icon rendered based on condition (sunny/cloudy/rainy/snowy/stormy/foggy) |
| FR-04 | Color-coded output using ANSI terminal colors (chalk) |
| FR-05 | `--json` flag outputs structured JSON to stdout |
| FR-06 | `--help` flag displays usage instructions |
| FR-07 | Exit code `1` on error, `0` on success |
| FR-08 | Clear error message when city is not found |
| FR-09 | Clear error message on network failure |

### 6.2 Web UI

| ID | Requirement |
|----|------------|
| FR-10 | Search bar at top allows city name entry |
| FR-11 | Autocomplete dropdown shows up to 6 city suggestions as user types |
| FR-12 | Arrow key navigation and Enter/click selection in autocomplete |
| FR-13 | Weather card displays all data fields (temp, condition, feels like, humidity, wind, UV) |
| FR-14 | Background animation reflects weather condition (sunny/rainy/cloudy/snowy/stormy) |
| FR-15 | Loading skeleton shown while data is fetching |
| FR-16 | Error state shown when city is not found |
| FR-17 | Fully responsive on mobile and tablet |
| FR-18 | No backend required — all API calls made client-side |

---

## 7. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|------------|
| NFR-01 | **Performance** | CLI response time < 2 seconds on standard broadband |
| NFR-02 | **Performance** | Web UI first contentful paint < 1.5 seconds |
| NFR-03 | **Reliability** | Tool must handle Open-Meteo API downtime gracefully |
| NFR-04 | **Security** | No user credentials or PII stored or transmitted |
| NFR-05 | **Security** | No command injection vulnerability in city name input |
| NFR-06 | **Security** | No XSS vulnerability in web UI DOM rendering |
| NFR-07 | **Maintainability** | TypeScript strict mode enforced |
| NFR-08 | **Maintainability** | CI pipeline runs on Node 18, 20, 22 |
| NFR-09 | **Compatibility** | Node.js >= 18.0.0 required |
| NFR-10 | **Scalability** | No server-side infrastructure — scales infinitely via static hosting |

---

## 8. Technical Architecture Decision

### 8.1 Options Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Node.js + TypeScript CLI** | Familiar to Adani devs, fast, rich ecosystem | Requires Node on user machine | **Selected** |
| Python CLI | Simple syntax | Not standard in Adani's frontend practice | Rejected |
| Go CLI | Single binary, fast | Less familiar, longer build time | Rejected |
| Shell script | No dependencies | Not portable, hard to maintain | Rejected |

### 8.2 Web UI Framework Options

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Vanilla HTML/CSS/JS** | No build step, single file, zero dependencies | Manual DOM manipulation | **Selected** |
| React | Component model, ecosystem | 100KB+ bundle, build step needed | Rejected for this scope |
| Vue | Lighter than React | Still requires build tooling | Rejected for this scope |

### 8.3 Final Architecture

```
┌─────────────────────────────────────────────┐
│               User Interface Layer           │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │   CLI (Node.js) │  │  Web UI (Static) │  │
│  │  weather <city> │  │  index.html      │  │
│  └────────┬────────┘  └────────┬─────────┘  │
└───────────┼─────────────────── ┼────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────┐
│           Open-Meteo Free API Layer          │
│  ┌──────────────────────────────────────┐   │
│  │  Geocoding API (city → lat/lng)      │   │
│  │  Forecast API  (lat/lng → weather)   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 9. API & Third-Party Dependencies

### 9.1 Open-Meteo

| Property | Detail |
|----------|--------|
| Provider | Open-Meteo (open-meteo.com) |
| Cost | Free, no API key |
| Rate limit | None for standard usage |
| Data freshness | Updated every 15 minutes |
| License | CC BY 4.0 |
| Uptime SLA | 99.9% (based on public status page) |
| Legal review | ✅ Approved — no ToS restrictions for internal use |

### 9.2 npm Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| chalk | ^5.3.0 | Terminal colors | MIT |
| typescript | ^5.3.3 | Type safety | Apache-2.0 |
| @types/node | ^20.11.0 | Node type definitions | MIT |

> **Total production dependencies: 1** (chalk only). All others are dev-time tools.

---

## 10. Feasibility Study

### 10.1 Technical Feasibility
**Rating: HIGH**
- Open-Meteo API is free, stable, and well-documented
- Node.js/TypeScript is a mature, well-supported stack
- No server infrastructure needed — eliminates DevOps complexity
- The entire project fits in a single GitHub repository

### 10.2 Operational Feasibility
**Rating: HIGH**
- CLI tool runs on any machine with Node 18+
- Web UI requires only a browser — no installation needed for supervisors
- JSON output enables future integration with dispatch software without rebuilding the tool

### 10.3 Financial Feasibility
**Rating: HIGH**

| Cost Item | Amount |
|-----------|--------|
| API costs | ₹0 (Open-Meteo is free) |
| Hosting (GitHub Pages) | ₹0 |
| Development effort | ~3 developer-days |
| Maintenance (monthly) | ~2 hours/month |

### 10.4 Timeline Feasibility
**Rating: HIGH**
- Estimated development time: **3 working days**
- No procurement, no vendor onboarding, no infrastructure setup required

---

## 11. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|-----------|
| R-01 | Open-Meteo API goes down | Low | High | Error handled gracefully; fallback message shown |
| R-02 | City name not in geocoding database | Medium | Low | Autocomplete + clear error message |
| R-03 | Node.js version incompatibility on supervisor machines | Medium | Medium | CI tests on Node 18/20/22; minimum version documented |
| R-04 | Open-Meteo introduces rate limiting | Low | High | Cache layer can be added in Phase 2 |
| R-05 | Browser blocks CORS on web UI | Low | High | Open-Meteo explicitly supports CORS |
| R-06 | Scope creep (alerts, forecast, mobile) | High | Medium | Strictly documented as Phase 2 in this BRD |

---

## 12. Project Plan & Timeline

```
Week 1
├── Day 1: Project setup, TypeScript config, geocoding module
├── Day 2: Weather API integration, CLI formatting, error handling
└── Day 3: Web UI, CI/CD pipeline, documentation, deployment

Week 2
├── Day 1: UAT with Operations team
├── Day 2: Bug fixes from UAT feedback
└── Day 3: Final sign-off, knowledge transfer
```

### 12.1 Milestones

| Milestone | Target Date | Owner |
|-----------|------------|-------|
| BRD Approved | Week 0 | Delivery Manager |
| CLI v1.0 complete | Week 1, Day 2 | Developer |
| Web UI complete | Week 1, Day 3 | Developer |
| GitHub Pages live | Week 1, Day 3 | Developer |
| UAT complete | Week 2, Day 1 | Operations Team |
| Project sign-off | Week 2, Day 3 | Executive Sponsor |

---

## 13. Cost Estimation

### 13.1 Development Effort

| Role | Days | Day Rate (₹) | Total (₹) |
|------|------|-------------|----------|
| Senior Developer | 3 | ₹8,000 | ₹24,000 |
| Business Analyst | 0.5 | ₹6,000 | ₹3,000 |
| QA Engineer | 0.5 | ₹5,000 | ₹2,500 |
| Project Manager | 0.5 | ₹7,000 | ₹3,500 |
| **Total** | | | **₹33,000** |

### 13.2 Infrastructure Costs

| Item | Monthly Cost |
|------|-------------|
| GitHub Pages hosting | ₹0 |
| Open-Meteo API | ₹0 |
| GitHub repository | ₹0 |
| **Total** | **₹0/month** |

### 13.3 ROI Calculation

| Metric | Value |
|--------|-------|
| Time saved per supervisor per shift | 20 minutes |
| Supervisors across all hubs | 14 |
| Shifts per month | 26 |
| Total hours saved per month | ~121 hours |
| Hourly cost of supervisor time | ₹500/hour |
| **Monthly savings** | **₹60,500** |
| **Break-even point** | **< 1 month** |

---

## 14. Acceptance Criteria

The project will be considered complete when all of the following are verified:

| ID | Criteria | Verified By |
|----|---------|------------|
| AC-01 | `weather london` returns correct current data within 3 seconds | QA Engineer |
| AC-02 | `weather london --json` returns valid JSON parseable by `jq` | QA Engineer |
| AC-03 | `weather invalidcitynamexyz` returns friendly error, exit code 1 | QA Engineer |
| AC-04 | Web UI autocomplete shows suggestions for partial city names | Operations Supervisor |
| AC-05 | Web UI displays correct weather for 5 test cities | Operations Supervisor |
| AC-06 | Web UI is usable on mobile (iPhone/Android) | Operations Supervisor |
| AC-07 | CI pipeline passes on Node 18, 20, 22 | DevOps Engineer |
| AC-08 | GitHub Pages URL is publicly accessible | Delivery Manager |
| AC-09 | README documents installation, usage, and all flags | QA Engineer |
| AC-10 | No API key required at any step | Executive Sponsor |

---

## 15. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Executive Sponsor | Head of Logistics Operations | _______________ | ________ |
| Delivery Manager | Adani Digital Engineering Lead | _______________ | ________ |
| Business Analyst | BA — Operations Practice | _______________ | ________ |
| Technical Lead | Senior Developer | _______________ | ________ |
| Client Representative | Operations IT Manager | _______________ | ________ |

---

*Document Version 1.0 — Adani Technologies, Digital Engineering Practice*
*For internal use only. Not for distribution outside Adani and client stakeholders.*
