# Running the AI stream example

This repository includes a small example that streams text from an AI model and prints it to stdout.

Files added:
- `index.mjs` — example script using the `ai` package's streamText helper.

Requirements:
- Node 18+
- Install dependencies: `npm install`
- Create a `.env.local` file with one of the following credentials:
  - `OPENAI_API_KEY=sk-...` (recommended)
  - or `VERCEL_OIDC_TOKEN=...` (if you're using Vercel OIDC flow)

How to run:
1. Install dependencies:

   npm install

2. Pull Vercel env (optional, if using Vercel-stored secrets):

   vc env pull .env.local --environment production

3. Run the example:

   node -r dotenv/config index.mjs

Notes:
- Do NOT commit `.env.local` or any secrets to the repository.
- The example will look for `OPENAI_API_KEY` first, then `VERCEL_OIDC_TOKEN`.
