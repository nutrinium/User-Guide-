# Dynamic User Guide Management System

Enterprise platform for creating, publishing, and serving user guides. Admin portal + public viewer + read-only View API for external apps (MRR, Store, HR, etc.).

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router
- **Backend:** Node.js, Express, MySQL
- **Database:** MySQL (`USER_GUIDE`)

---

## Why "Database connection failed" after git pull?

This happens for **one or more** of these reasons:

| Cause | Fix |
|-------|-----|
| **`.env` is not in git** (secrets are gitignored) | Copy `.env.example` → `.env` and set real DB credentials |
| **Placeholder password in `.env.example`** | Replace `your_password_here` with the actual MySQL password |
| **API server not running** | Run `npm run dev:server` (frontend alone is not enough) |
| **Server dependencies not installed** | Run `npm install` inside the `server/` folder |
| **MySQL blocks their IP** | Allow the developer's IP on the DB server firewall / security group (port 3306) |

---

## First-time setup (for every developer)

### 1. Clone and install

```bash
git clone <repo-url>
cd user-guide-management-system

npm install
cd server && npm install && cd ..
```

### 2. Create `.env` (required — this file is NOT in git)

```bash
cp .env.example .env
```

Edit `.env` with the correct values:

```env
DB_HOST=15.206.221.200
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<ask team lead for password>
DB_NAME=USER_GUIDE
PORT=3001
```

> **Important:** Never commit `.env` to git. Share DB credentials securely (password manager, internal chat), not via GitHub.

### 3. Run both servers

**Option A — one command (recommended):**
```bash
npm run dev:all
```

**Option B — two terminals:**

**Terminal 1 — API (MySQL):**
```bash
npm run dev:server
```
You should see: `API running on http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

> **Common mistake:** Running only `npm run dev` starts the frontend but **not** the API. You will see `502 Bad Gateway` / `ECONNREFUSED` in the Vite console.

### 4. If connection still fails

1. **Test API health:** open `http://localhost:3001/api/health` — should return `{"ok":true,...}`
2. **Check server terminal** for the exact MySQL error (access denied, timeout, etc.)
3. **Firewall:** MySQL on `15.206.221.200` must allow inbound **3306** from the developer's public IP
4. **Credentials:** confirm `DB_USER`, `DB_PASSWORD`, and `DB_NAME` with your team lead

---

## Admin login

- Default viewer mode (no login required for `/viewer`)
- Admin: use profile menu → Admin login (`admin` / `admin123`)

---

## API Keys (for external apps)

Admin portal → **API Keys** → Generate key → share with app developers.

View API base: `http://localhost:3001/api/v1/view` (dev) or your production URL.

Sample integration: `examples/mrr-integration/`

---

## Build

```bash
npm run build
npm run preview
```

## Production

Set `PUBLIC_API_BASE_URL` and `VITE_PUBLIC_VIEW_API_URL` to your deployed API URL so image links and the API Keys page show the correct handoff URL.
