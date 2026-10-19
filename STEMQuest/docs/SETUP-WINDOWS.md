# Windows, VS Code, and GitHub

## Extract and preview

1. Right-click the ZIP → Extract All. Open the extracted `STEMQuest` folder, not the compressed folder.
2. Install Node.js 24 LTS from https://nodejs.org and VS Code from https://code.visualstudio.com.
3. Double-click `START-DEMO.cmd`, then visit http://localhost:3000. Keep its terminal open. No API keys are required.

## Run editable source in PowerShell

In VS Code, choose File → Open Folder → STEMQuest, then Terminal → New Terminal. Confirm the terminal contains `package.json` using `Get-ChildItem`.

```powershell
node --version
npm.cmd ci
npm.cmd run dev
```

Visit http://localhost:3000. `npm.cmd` avoids PowerShell execution-policy errors without changing your computer's policy. Stop the server with Ctrl+C before running another on the same port. For another preview port:

```powershell
$env:PORT = "3001"
node scripts/serve.mjs
```

Visit http://localhost:3001. For a development server on another port: `npm.cmd run dev -- --port 3001`.

## Check and build

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start
```

Browser tests automatically start a development server if none is running:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

The browser tests use fresh isolated demo storage. They do not need Supabase.

## Optional cloud setup

```powershell
Copy-Item .env.example .env.local
```

Edit the two public Supabase values in `.env.local`, follow `SUPABASE.md`, then restart development or rebuild. Leave them empty to use demo mode. Never place secret service keys in variables starting with `NEXT_PUBLIC_`.

## Push to your own GitHub repository

Install Git from https://git-scm.com and restart VS Code. Create a new empty repository in your GitHub account, without adding a README or `.gitignore` there. Replace `YOUR_NAME` and `YOUR_REPO` below with your values.

```powershell
git init
git branch -M main
git add .
git status --short
```

Inspect that list: `.env.local`, `node_modules`, `.next`, `out`, and test reports should not appear. `.env.example` should appear because it contains only empty placeholders. Then:

```powershell
git commit -m "Add STEMQuest application"
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

Sign in through Git's browser prompt. If Git requests your author identity, run `git config user.name "Your Name"` and `git config user.email "your GitHub email"`, then retry the commit. Do not paste passwords or tokens into source files.

Alternatively, GitHub Desktop can add this extracted folder as a new repository and publish it. The included `.gitignore` applies there too.

Follow `DEPLOYMENT.md` to import your repository into Vercel. The delivered archive is independent of the original demo's hosting account.
