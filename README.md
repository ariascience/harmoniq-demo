# HarmonIQ — Decision Intelligence Platform Demo

A fully interactive demo of the HarmonIQ platform with simulated data, agentic AI workflows, and real-time Agent Brain visualization.

---

## Quick Start (Mac)

### Prerequisites

You need **Node.js** (v18+). If you don't have it:

```bash
# Using Homebrew (recommended)
brew install node

# Or download from https://nodejs.org (LTS version)
```

Verify installation:
```bash
node -v   # should show v18+ or higher
npm -v    # should show 9+ or higher
```

### Setup & Run

```bash
# 1. Unzip the project (if downloaded as zip)
unzip harmoniq-app.zip
cd harmoniq-app

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The app will open automatically at **http://localhost:3000**

### Login

Use **any email and password** — the login is simulated. You can also click the Microsoft or Google SSO buttons.

---

## Project Structure

```
harmoniq-app/
├── index.html              # HTML entry point
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite dev server config
├── README.md               # This file
└── src/
    ├── main.jsx            # React entry point
    └── App.jsx             # Complete HarmonIQ application (~1550 lines)
```

Everything is in a single `App.jsx` file for simplicity — no external dependencies beyond React and ReactDOM.

---

## Features

| Section         | What it does |
|----------------|-------------|
| **Home**        | Create workflows by describing your goal in natural language. Mother Agent orchestrates Super Agents with HITL editing. |
| **Templates**   | Browse, configure, and launch pre-built workflow templates. Edit agent instructions and save your own copies. |
| **Triggers**    | Schedule templates to run on recurring schedules (daily/weekly/monthly). Pause, resume, or delete triggers. |
| **Relics**      | View, download, and share output artifacts from completed workflow runs. |
| **Collaboration** | Manage team members, roles, and shared resources. |
| **Documentation** | In-app docs explaining HarmonIQ, its architecture, and all six Super Agents. |

---

## Building for Production

```bash
npm run build
```

This creates a `dist/` folder with static files you can deploy anywhere (Netlify, Vercel, S3, etc.)

To preview the production build locally:
```bash
npm run preview
```

---

## Tech Stack

- **React 18** — UI framework
- **Vite 6** — Build tool & dev server
- **Pure CSS** — No CSS framework dependencies
- **DM Sans + JetBrains Mono** — Typography (loaded from Google Fonts)

---

© 2026 Aria Intelligent Solutions
