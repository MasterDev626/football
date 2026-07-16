# Football PRG

Prague football friendlies — browse games, join the main list or waiting list, and discover pitches. No WhatsApp group required.

## Stack

- Next.js (App Router) + Tailwind CSS
- Prisma + PostgreSQL (Neon recommended)
- Deployed on Vercel

## Local setup

```bash
cp .env.example .env
# set DATABASE_URL to your Neon (or other Postgres) connection string

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo organizer manage code after seed: `demo1234`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push Prisma schema |
| `npm run db:seed` | Seed venues + demo games |
| `npm run icons` | Regenerate favicons from SVG |

## Product notes

- Players join with a **name** (WhatsApp-style). A leave token is stored in `localStorage`.
- Organizers get a **manage code** when posting a game (used to remove players).
- Scope is **Prague friendlies** for v1.
