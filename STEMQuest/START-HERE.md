# Welcome to STEMQuest

Extract the entire ZIP first. Open the extracted **STEMQuest** folder in VS Code.

## Quick demo — no account or API keys

1. Install **Node.js 24 LTS** from https://nodejs.org (Node 22.18+ also works).
2. On Windows, double-click **START-DEMO.cmd**. Keep its terminal window open.
3. Open **http://localhost:3000** in your browser.

On macOS/Linux, open a terminal in the extracted folder and run:

```sh
node scripts/serve.mjs
```

The ZIP includes a ready-built `out/` demo. This preview needs Node, but no dependency installation. Do not open `out/index.html` directly: use the local server above. Press Ctrl+C to stop it. If port 3000 is busy, close the other server or follow the alternate-port instructions below.

## Edit and run the source

In VS Code: Terminal → New Terminal, then:

```sh
npm ci
npm run dev
```

On Windows PowerShell, use `npm.cmd ci` and `npm.cmd run dev` if PowerShell blocks the npm script. No environment file is needed for the demo. Internet access is needed to install dependencies. Source edits show in the development server; rebuild with `npm run build` to update the quick preview.

## What to try

- Explore subjects → choose any of the 16 lessons; check answers and earn XP.
- Play Robot rescue, Spaceship fuel station, and Cosmic fraction pairs.
- Science simulations → gravity experiment and circuit lab.
- Coding playground → the supported Python range-loop exercise.
- Settings → switch among Explorer, Nova, and Byte. Each has separate local progress. Rankings come from activities you complete.
- Teacher dashboard → create a local class and assignment; inspect current learner progress.
- Admin dashboard → write a multiple-choice lesson, save a draft, publish, and play it.

The demo stores data only in this browser. It is not a secure multi-user school system. Guardian sample summaries are labelled as examples. Connected roles, accounts, cloud progress, email and optional AI need the setup documented in `docs/`.

## Your next steps

- **Windows and GitHub:** [docs/SETUP-WINDOWS.md](docs/SETUP-WINDOWS.md)
- **Cloud accounts:** [docs/SUPABASE.md](docs/SUPABASE.md)
- **Email and optional AI:** [docs/SERVICES.md](docs/SERVICES.md)
- **Deploy:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Feature scope and limits:** [docs/FEATURES.md](docs/FEATURES.md)
- **Checks actually performed:** [docs/VALIDATION.md](docs/VALIDATION.md)
