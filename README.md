# RunTheFade

A Tinder-style matchmaking web app for organized fights. Fighters build a
profile (weight class, height class, fighting style, strengths, availability),
browse and swipe on nearby fighters who are "looking," and on a mutual match
can schedule a fight — the nearest overseer is paged automatically. The
overseer approves the fight and later confirms the result (with an optional
proof photo), which updates an Elo-style rating that feeds the rankings
leaderboard.

## Structure

```
backend/    Express + SQLite (Node's built-in node:sqlite) REST API
frontend/   React (Vite) single-page app
```

Any account can also become an overseer — creating a location automatically
flags that user as an overseer for it. There's no separate account type;
overseers are fighters too, per the app's design.

## Requirements

- **Node.js >= 22.5** for both `backend` and `frontend`. The backend uses
  Node's built-in SQLite module (`node:sqlite`), which needs no native
  compilation — no Visual Studio / build tools required on any OS.

## Running locally

### Backend

```
cd backend
cp .env.example .env   # edit JWT_SECRET before deploying anywhere real
npm install
npm start
```

Runs on `http://localhost:4000`. Uses a local SQLite file (`db/runthefade.db`,
created automatically) — no external database needed.

**Optional — seed 10 demo accounts:**

```
npm run seed
```

Creates 10 fighters across different Ugandan cities, weight classes, and
fighting styles, 3 of them owning locations (overseers), plus 8 completed
fights so Rankings shows a real spread instead of everyone at 1200. Safe to
run only once — it detects existing seed data and skips. Credentials for all
10 accounts are in `backend/db/seed-credentials.txt` (also delivered
separately as `runthefade-credentials.txt`).

### Frontend

```
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and talks to `http://localhost:4000/api` by
default. To point it at a different backend, set `VITE_API_URL` (see
`.env.example`).

## Deploying

**Frontend → Netlify:** point Netlify at the `frontend/` folder. It already
has a `netlify.toml` with the build command and SPA redirect rule set up.
Add an environment variable `VITE_API_URL` pointing at wherever the backend
ends up (Netlify itself doesn't host a persistent Node/SQLite backend, so the
API needs a separate host — Railway, Render, Fly.io, a VPS, etc. all work).

**Backend:** deploy the `backend/` folder to any Node >=22.5 host. Set
`JWT_SECRET` and `PORT` there. Photos are stored as base64 directly in the
SQLite database (not on local disk), so they survive redeploys and work on
hosts with ephemeral/read-only filesystems — no S3 or similar needed for the
MVP. If traffic grows, swap SQLite for a hosted Postgres; the query layer
stays almost identical since it's all plain SQL in the `routes/` files.

**Future native app:** since the frontend only talks to the backend over
plain JSON HTTP endpoints (`/api/...`), a React Native or Swift/Kotlin app
can hit the exact same API later — no backend changes needed, same pattern
Instagram used moving from a web-first product to native clients.

## Feature summary

- Auth (signup/login, JWT)
- Fighter profiles: weight class, height class, fighting style, strengths,
  bio, availability, geolocation, looking/not-looking toggle, profile photo
- Nearby fighter browsing with distance + weight class/style filters
- Swipe (like/pass), mutual-match detection
- Locations, owned by overseers (who are also regular fighters)
- Fight scheduling: the nearest overseer to the two fighters is
  auto-assigned and notified — no manual venue picking
- Overseer approval/decline, and result confirmation with an optional proof
  photo
- Elo-style rating system, updated on confirmed win/loss/draw results
- Rankings leaderboard, filterable by weight class and style
- In-app chat between matched fighters (polling-based)
- Notifications for new matches, chat messages, fight status changes
  (including being called to oversee), and nearby fighters going "looking"
  (bell icon, unread badge)
- Map view (Leaflet + OpenStreetMap/CARTO dark tiles) showing nearby looking
  fighters, fade locations, and your own position — no API key required
- Original animated fighter mark (SVG/CSS) used in the nav and auth screens
- Photos (profile + fight-result proof) stored as base64 in SQLite —
  portable across any host, no separate file storage needed
- 10 seeded demo accounts (`npm run seed`) with varied classes, styles,
  cities, and fight history
- Visual identity: black/yellow/cyan, angular cut-corner UI, monospace
  technical labels — styled after a supplied reference image

## Not yet built (ideas for v2)

- Waiver/consent flow before a fight is confirmed
- Report/block a fighter
- Push notifications (current notifications are in-app/polling only)
- Real-time chat (currently polls every few seconds rather than websockets)
- If photo volume grows a lot, base64-in-SQLite will bloat the database —
  worth moving to S3/Cloudinary at that point, though it's fine for an MVP


This is usefull

[run-the-fade.onrender.com/api/health](https://run-the-fade.onrender.com/api/health)
