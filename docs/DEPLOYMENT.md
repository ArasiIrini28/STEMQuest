# Deployment

## Published demo

The initial build is deployed with Sites, the hosting provider available in this workspace. The brief explicitly requested a public shareable URL. Only the anonymous demo is public; no actual student data or service secrets are included.

The existing demo is https://stemquest-learning-adventure.gooddaisy256.chatgpt.site. The portable ZIP intentionally excludes that hosting account identity.

## Vercel alternative

No GitHub repository or Vercel project was created during this task. To use your preferred provider:

1. Create a private GitHub repository in your own account.
2. Push this source directory after checking `.gitignore`. Do not commit `.env.local`, credentials, generated test output, or `node_modules`.
3. Import the repository into Vercel. Select framework preset **Other**, Node 24, install command `npm ci`, build command `npm run build`, output directory `out`. This serves the Next static export directly.
4. Set the two Supabase public build variables. Keep Resend/OpenAI/service-role secrets in Supabase Edge Functions, not the client hosting environment.
5. Deploy. Configure the deployed origin and redirect allowlist in Supabase.
6. Enable optional functions/scheduler only after synthetic-account testing and consent setup.

This static client plus Supabase backend does not require a Next.js server at runtime. All views use fragment routes and work on static hosting.

## Reproducible source and artifacts

The source ZIP contains application files, tests, original curriculum, migrations, Edge Functions and documentation. `package-lock.json` pins the installed packages. Generated `out/`, `.next/`, installed dependencies, Git metadata, deployment credentials and private environment files are excluded. Build `out/` locally using the commands below.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

For a new deployment, regenerate the build whenever public environment variables or curriculum change. Do not edit generated `out/` files directly.
