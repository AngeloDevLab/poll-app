# PollApp

An Angular application for creating and answering surveys with live results, powered by Supabase (Postgres + Realtime).

**Live demo:** [poll.angelodevelopment.de](https://poll.angelodevelopment.de)

## Features

- **Ending soon** — the surveys closest to their deadline, shown above the main list, soonest first.
- **Active / past surveys** — tabs for running and closed surveys, each with its own category filter (including "All surveys").
- **Create a survey** — a "New survey" dialog (modal, not a separate route) with required fields (name, category, questions, answers) and optional ones (description, end date), validated as you go.
- **Detail view** — questions, answer options, category, end date, description and the current results.
- **Voting with live results** — pick your answers and submit; the results panel (right of the form on desktop) updates in real time for every visitor via Supabase Realtime, no reload needed.
- **Past surveys** — can still be opened to see the final results, but no longer accept votes.

### Extras

- **Multiple questions per survey**, each either single-choice or multiple-choice ("Allow multiple answers").
- **Re-submit lock** — after completing a survey, the browser remembers it (and your picks) in `localStorage`, so a returning visitor sees their answers instead of filling it in again.
- **Optimistic voting** — results update instantly and roll back with a toast message if saving fails.
- **Accessibility** — whole poll cards are clickable and keyboard-focusable, form fields have proper labels, the results panel is collapsible on mobile.
- **Input limits** — maximum lengths for survey name, description, questions and answers.

## Stack

- [Angular](https://angular.dev/) 22 (standalone components, signals, no SSR/SSG)
- [Supabase](https://supabase.com/) (Postgres + Realtime) via `@supabase/supabase-js`

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor. This creates the tables, the `poll_results` view, Row Level Security policies and enables Realtime on `votes`.

3. Copy `src/environments/environment.example.ts` to `src/environments/environment.ts` (git-ignored) and fill in your project URL and anon key from *Settings > API*.

4. Start the dev server and open `http://localhost:4200/`:

   ```bash
   npm start
   ```

To create a production build in `dist/poll-app`, run `npm run build`.

## Deployment

Every push to `main` that changes more than Markdown files or `supabase/` runs the [deploy workflow](.github/workflows/deploy.yml). It can also be started by hand under **Actions**.

1. The workflow creates `environment.ts` from repository secrets and builds the app.
2. It copies the build to the server with `rsync` over SSH.
3. [Caddy](https://caddyserver.com/) serves the files with HTTPS and answers unknown paths with `index.html`, so deep links like `/polls/:id` work on reload.

Repository secrets (**Settings > Secrets and variables > Actions**):

| Secret | Value |
|---|---|
| `SUPABASE_URL` | URL of the Supabase project |
| `SUPABASE_ANON_KEY` | public anon key of the Supabase project |
| `DEPLOY_KEY` | private SSH key of the deploy user |
| `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan <server-ip>` |
| `DEPLOY_USER` | user that receives the build |
| `DEPLOY_HOST` | IPv4 address of the server |

## Design decisions

- **No authentication and no database-level vote-locking.** Anyone can create surveys and vote; the re-submit lock above is a convenience in the UI only, not a security measure (clearing storage or switching browsers resets it).
- **Read and insert only.** RLS allows everyone to read and insert, but never to update or delete from the client.
- **Survey status is derived from the deadline** — there is no separate "closed" column.
