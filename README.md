# Personal Finance Tracker

DevCamp 2.0 final project: a full-stack MERN application (MongoDB, Express, React, Node.js, JavaScript only) for tracking personal income and expenses, setting monthly budgets and viewing reports.

**Live link:** _add your deployed URL here_
**GitHub:** _add your repository URL here_

---

## Table of contents

1. [Features](#1-features)
2. [Tech stack](#2-tech-stack)
3. [Project structure](#3-project-structure)
4. [Running locally](#4-running-locally)
5. [Environment variables](#5-environment-variables)
6. [Using the app](#6-using-the-app)
7. [API reference](#7-api-reference)
8. [Data model](#8-data-model)
9. [Security](#9-security)
10. [Design decisions and behaviour notes](#10-design-decisions-and-behaviour-notes)
11. [Deployment guide](#11-deployment-guide)
12. [Troubleshooting](#12-troubleshooting)
13. [Submission checklist](#13-submission-checklist)

---

## 1. Features

### Required

| Page | Route | What it does |
| --- | --- | --- |
| Authentication | `/login` | Sign up (name, email, password, confirm password) and log in. Required-field, email-format and password-length validation. Passwords hashed with bcrypt. JWT-based session. |
| Dashboard | `/dashboard` | Total balance, total income, total expenses (all time). Monthly summary with a month picker. Income-vs-expenses progress bar. Budget status. Recent transactions. Charts. |
| Transactions | `/transactions` | Table of all transactions (collapses to cards on phones). Add, edit, delete. Filter by type and category. Also search by title and filter by date range. |
| Budget & Categories | `/budget` | Set a monthly budget, see spent and remaining, colour-coded progress bar with a warning at 80% and an exceeded state. Add, rename and delete categories. |

### Bonus (all included)

| Bonus | Where |
| --- | --- |
| Interactive charts (Recharts) | Dashboard (6-month bar chart, spending-by-category donut) and Reports (daily spending, month-by-month) |
| Date-range filtering | Transactions page, "From" and "To" |
| Monthly and yearly financial reports | `/reports` |
| Export transactions as CSV | Transactions page, "Export CSV" (respects the active filters) |
| Dark mode | Toggle in the navbar. Remembers your choice; follows your system setting the first time. |
| Recurring transactions | "Repeat this transaction automatically" in the transaction form (daily, weekly, monthly, yearly) |
| Downloadable monthly expense report | Reports page: CSV download, and Print / Save as PDF |

### Also included

- Fully responsive layout (desktop, tablet, phone) with a mobile menu
- Loading spinners, error messages with a retry button, and empty states on every page
- Toast notifications for success and failure
- Confirmation dialogs before deleting anything
- Accessible forms (labels, keyboard support, focus styles, `aria` attributes)

---

## 2. Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 (functional components and hooks), React Router 6, Fetch API, Recharts, plain CSS, built with Vite |
| Backend | Node.js, Express 4, JSON Web Tokens (`jsonwebtoken`), bcrypt (`bcryptjs`), Mongoose 8 |
| Database | MongoDB |
| Language | JavaScript (ES modules) throughout |

---

## 3. Project structure

```
finance-tracker/
├── package.json               # root helper scripts (build / start for deployment)
├── README.md
├── server/
│   ├── server.js              # app entry: middleware, routes, optional static hosting of the client
│   ├── .env.example
│   ├── config/db.js           # MongoDB connection
│   ├── models/                # User, Transaction, Category, Budget
│   ├── routes/                # one router per resource
│   ├── controllers/           # request handlers and validation
│   ├── middleware/
│   │   ├── auth.js            # authentication: verifies the JWT
│   │   ├── ownership.js       # authorization: record must belong to the logged-in user
│   │   ├── recurring.js       # generates due recurring transactions before reads
│   │   └── error.js           # 404 + central error handler
│   └── utils/                 # dates, csv, stats (aggregations), validation, recurring engine
└── client/
    ├── index.html
    ├── vite.config.js         # dev proxy: /api -> http://localhost:5000
    ├── .env.example
    ├── vercel.json            # SPA fallback for Vercel
    ├── public/_redirects      # SPA fallback for Netlify
    └── src/
        ├── main.jsx, App.jsx  # providers and routes
        ├── pages/             # AuthPage, Dashboard, Transactions, Budget, Reports
        ├── components/        # Layout, Modal, forms, tables, progress bar, month picker...
        ├── context/           # AuthContext, ThemeContext, ToastContext
        ├── api/client.js      # fetch wrapper (adds the token, handles errors and downloads)
        ├── hooks/useFetch.js
        └── utils/             # money/date formatting, chart colours
```

---

## 4. Running locally

### Prerequisites

- **Node.js 18 or newer** (`node --version`)
- **MongoDB**, either:
  - a free MongoDB Atlas cluster (see [section 11, part A](#part-a--create-the-database-mongodb-atlas)), or
  - MongoDB Community Server installed locally (connection string `mongodb://127.0.0.1:27017/finance-tracker`)

### Steps

**1. Start the backend**

```bash
cd server
cp .env.example .env        # Windows (Command Prompt): copy .env.example .env
```

Open `server/.env` and set:

```
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<a long random string>
```

To generate a random secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

```bash
npm install
npm run dev                 # API on http://localhost:5000
```

You should see `MongoDB connected` and `API listening on port 5000`. Check `http://localhost:5000/api/health`, which returns `{"success":true,"status":"ok"}`.

**2. Start the frontend** (in a second terminal)

```bash
cd client
cp .env.example .env        # optional
npm install
npm run dev                 # app on http://localhost:5173
```

Open `http://localhost:5173`, create an account and start adding transactions. In development Vite forwards `/api` requests to the backend, so no extra configuration is needed.

### Scripts

| Where | Command | Purpose |
| --- | --- | --- |
| `server/` | `npm run dev` | Start API with auto-restart on file changes |
| `server/` | `npm start` | Start API (production) |
| `client/` | `npm run dev` | Start the Vite dev server |
| `client/` | `npm run build` | Build the frontend into `client/dist` |
| root | `npm run build` | Install everything and build the frontend (used for deployment) |
| root | `npm start` | Start the API, which also serves `client/dist` if it exists |

---

## 5. Environment variables

### `server/.env`

| Name | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Long random string used to sign tokens. Never commit it. |
| `PORT` | no | API port. Default `5000`. Hosting platforms set this automatically. |
| `JWT_EXPIRES_IN` | no | Token lifetime. Default `7d`. |
| `CLIENT_URL` | no | Allowed frontend origin(s), comma separated. Only needed when the frontend is hosted separately. If empty, all origins are allowed. |
| `NODE_ENV` | no | Set to `production` when deployed. Hides internal error details from API responses. |

### `client/.env`

| Name | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | no | API base URL, e.g. `https://my-api.onrender.com/api`. Leave empty in development and when the server hosts the frontend. |
| `VITE_CURRENCY` | no | ISO 4217 currency code used to display amounts. Default `INR` (use `USD`, `EUR`, etc.). |

> Vite reads `VITE_` variables when the app is **built**, not at runtime. After changing them on a hosting platform, redeploy.

---

## 6. Using the app

1. **Sign up.** Name, email, password (min. 8 characters) and confirmation. Default income and expense categories are created for you.
2. **Add transactions.** Transactions page, "+ Add transaction". Pick Expense or Income, then a category of that type. Tick "Repeat this transaction automatically" for recurring items such as rent or salary.
3. **Set a budget.** Budget & Categories page. Choose the month, enter a spending limit and press "Set budget". The bar turns amber at 80% and red once spending exceeds the budget.
4. **Manage categories.** Same page, lower section. Switch between expense and income tabs to add, rename or delete.
5. **Check the dashboard.** Use the month arrows or the month label to change the month.
6. **Reports.** Monthly or yearly view. Download the monthly expense report as CSV, or use "Print / Save as PDF" (choose "Save as PDF" as the destination in the print dialog).
7. **Export.** On the Transactions page, "Export CSV" downloads exactly what the current filters show.

---

## 7. API reference

Base path: `/api`. All routes except register and login require the header `Authorization: Bearer <token>`.

Responses are JSON. Errors look like `{ "success": false, "message": "...", "errors": { "field": "..." } }`.

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Body: `name`, `email`, `password`. Returns `token` and `user`. |
| POST | `/api/auth/login` | Body: `email`, `password`. Returns `token` and `user`. |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard?month=YYYY-MM` | Totals, monthly summary, budget status, chart data, recent transactions |
| GET | `/api/transactions` | Query (all optional): `type`, `category`, `startDate`, `endDate`, `search` |
| POST | `/api/transactions` | Body: `title`, `amount`, `type`, `category`, `date`, optional `isRecurring` and `frequency` |
| PUT | `/api/transactions/:id` | Same body as create |
| DELETE | `/api/transactions/:id` | Delete |
| GET | `/api/transactions/export` | CSV download (same filters as the list) |
| GET | `/api/categories` | Optional `type`. Includes a transaction count per category. |
| POST | `/api/categories` | Body: `name`, `type` |
| PUT | `/api/categories/:id` | Body: `name` |
| DELETE | `/api/categories/:id` | Refused (409) while transactions use the category |
| GET | `/api/budgets?month=YYYY-MM` | Budget, amount spent, remaining, status, spending per category |
| PUT | `/api/budgets` | Body: `month`, `amount` (creates or updates) |
| DELETE | `/api/budgets?month=YYYY-MM` | Remove a month's budget |
| GET | `/api/reports/monthly?month=YYYY-MM` | Monthly report data |
| GET | `/api/reports/yearly?year=YYYY` | Yearly report data |
| GET | `/api/reports/monthly/download?month=YYYY-MM` | Monthly expense report (CSV) |

Status codes used: `200`, `201`, `400` (validation), `401` (not logged in), `404`, `409` (duplicate or in use), `500`.

---

## 8. Data model

| Collection | Fields |
| --- | --- |
| `users` | `name`, `email` (unique), `password` (bcrypt hash, never returned), timestamps |
| `categories` | `user`, `name`, `type` (`income` or `expense`). Unique per user + type + name, case-insensitive. |
| `transactions` | `user`, `title`, `amount`, `type`, `category` (ref), `date`, `isRecurring`, `frequency`, `nextRunDate`, `recurringSource` (ref to the recurring original), timestamps |
| `budgets` | `user`, `month` (`YYYY-MM`), `amount`. Unique per user + month. |

Every record other than users belongs to a user, and every query filters on the logged-in user.

---

## 9. Security

- **Passwords** are hashed with bcrypt (12 rounds) and are never returned by the API.
- **JWT** authentication on every data route. Invalid, expired or missing tokens get `401`, and the frontend logs the user out.
- **Authorization:** a user can only read or change their own data. Requests for another user's record return `404`, so it does not reveal that the record exists.
- **Server-side validation** of every input (the frontend validates too, but is never trusted).
- **Login errors** are identical for an unknown email and a wrong password, so accounts cannot be probed.
- **CSV exports** neutralise spreadsheet formula injection (cells beginning with `=`, `+`, `-`, `@`).
- Search text is escaped before it is used in a regular expression.
- `.env` files are git-ignored. Only `.env.example` files are committed.

---

## 10. Design decisions and behaviour notes

- **Balance is calculated, never stored.** It is summed from all transactions on every request, so adding, editing or deleting a transaction is reflected immediately.
- **Budgets are per month.** A month without a budget shows "not set". Budgets do not carry over automatically.
- **Budget status:** under 80% is "within budget", 80% up to the limit is "approaching", above the limit is "exceeded".
- **Dates are calendar dates**, stored at UTC midnight, so a transaction never shifts a day because of timezones.
- **Categories have a type.** A transaction can only use a category of its own type. A category's type cannot be changed after creation.
- **Recurring transactions.** The first occurrence is the "original" and carries the schedule. When any data page is loaded, the server creates every occurrence that has come due (including any missed since the start date) and moves the schedule forward. These are marked "Auto". To change the rule, edit the original. To stop it, edit the original and untick "Repeat". Monthly schedules starting on the 29th to 31st use the last day of shorter months.
- **No background job.** Recurring entries are created on demand, so no cron service or paid worker is needed.
- **Currency** is display-only (`VITE_CURRENCY`). Amounts are stored as plain numbers.
- **One service or two.** If `client/dist` exists, the Express server serves the built frontend, so the whole app can run as a single deployment.

---

## 11. Deployment guide

Recommended path (free): **MongoDB Atlas** for the database and **Render** for the app, as one service. About 20 minutes. Menu names on these sites change occasionally, so look for the closest match if something is labelled differently.

### Part A: Create the database (MongoDB Atlas)

1. Go to <https://www.mongodb.com/cloud/atlas/register> and create a free account.
2. Create a cluster: choose the free **M0** tier, any cloud provider and a region near you.
3. **Create a database user.** Go to *Database Access* > *Add New Database User* > choose password authentication. Pick a username and a password (use letters and numbers only to avoid encoding problems) and give it "Read and write to any database". Save the username and password.
4. **Allow network access.** Go to *Network Access* > *Add IP Address* > *Allow access from anywhere* (`0.0.0.0/0`) > Confirm. This is needed because Render's outgoing IP addresses change.
5. **Get the connection string.** Go to *Database* > *Connect* on your cluster > *Drivers*. Copy the string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with the real values, and add the database name before the `?`:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/finance-tracker?retryWrites=true&w=majority
   ```
   Keep this. It is your `MONGO_URI`. If your password contains special characters such as `@` or `#`, URL-encode them (for example `@` becomes `%40`).

### Part B: Put the code on GitHub

1. Create a new empty repository on <https://github.com/new>. Do not add a README or .gitignore (the project has them).
2. From the project folder (the one containing `server/` and `client/`):
   ```bash
   git init
   git add .
   git commit -m "Personal Finance Tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. Check on GitHub that **no `.env` file** was uploaded. The `.gitignore` already excludes it.

### Part C: Deploy on Render (one service: API + frontend)

1. Go to <https://render.com>, sign up (the "Sign in with GitHub" option is easiest) and allow access to your repository.
2. Click **New** > **Web Service** and select your repository.
3. Fill in the settings:

   | Setting | Value |
   | --- | --- |
   | Name | anything, e.g. `finance-tracker` |
   | Language / Runtime | Node |
   | Branch | `main` |
   | Root Directory | leave empty |
   | Build Command | `npm run build` |
   | Start Command | `npm start` |
   | Instance type | Free |

4. Under **Environment Variables** add:

   | Key | Value |
   | --- | --- |
   | `MONGO_URI` | the connection string from Part A |
   | `JWT_SECRET` | a long random string (see section 4 for a one-line generator) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NODE_ENV` | `production` |
   | `VITE_CURRENCY` | `INR` (or your currency code) |

   Leave `VITE_API_URL` and `CLIENT_URL` **unset**. The frontend and API share one address.

5. Click **Create Web Service**. Render installs dependencies, builds the frontend and starts the server. Watch the logs. A successful start ends with `MongoDB connected` and `API listening on port ...`.
6. When the status is **Live**, open the URL shown at the top (like `https://finance-tracker.onrender.com`). That is your **live link**.

### Part D: Verify the deployment

1. Open `https://<your-url>/api/health`. You should see `{"success":true,"status":"ok"}`.
2. Open the main URL, sign up, add an income and an expense, and check that the dashboard totals update.
3. Refresh the page while on `/transactions`. It should stay on the page (not show "Not Found") and keep you logged in.
4. Try the CSV export, the budget bar and dark mode.

> **Free tier note:** Render's free web services go to sleep after about 15 minutes without traffic. The first visit afterwards can take up to a minute to load. Open the link once before showing it to anyone.

### Alternative: separate frontend and backend

Use this if you want the frontend on Vercel or Netlify.

**Backend on Render**

1. New > Web Service > same repository.
2. Root Directory: `server`. Build Command: `npm install`. Start Command: `npm start`.
3. Environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `NODE_ENV=production`, and `CLIENT_URL` (add this after the frontend is deployed, set to the frontend URL, for example `https://my-finance.vercel.app`, with no trailing slash).
4. Note the API URL, for example `https://finance-api.onrender.com`.

**Frontend on Vercel**

1. Import the repository at <https://vercel.com/new>.
2. Set **Root Directory** to `client`. Framework preset: Vite (build command `npm run build`, output directory `dist`).
3. Add environment variables:
   - `VITE_API_URL` = `https://finance-api.onrender.com/api` (include `/api`)
   - `VITE_CURRENCY` = `INR`
4. Deploy. Then go back to Render and set `CLIENT_URL` to the Vercel URL, and redeploy the backend.

**Frontend on Netlify (instead of Vercel):** base directory `client`, build command `npm run build`, publish directory `client/dist`, and the same two environment variables. The file `client/public/_redirects` handles page refreshes.

### Updating a deployed app

Commit and push to `main`. Render (and Vercel/Netlify) redeploy automatically. If you change a `VITE_` variable, trigger a redeploy so the frontend is rebuilt.

---

## 12. Troubleshooting

| Problem | Likely cause and fix |
| --- | --- |
| Server exits with `MONGO_URI is not set` or `JWT_SECRET is not set` | `server/.env` is missing or incomplete. Copy `.env.example` to `.env` and fill it in. |
| `MongooseServerSelectionError` / cannot connect | Wrong connection string, wrong password (URL-encode special characters), or Atlas Network Access does not allow your IP. Add `0.0.0.0/0` for deployment. |
| `Authentication failed` from MongoDB | Atlas database username or password is wrong. They are separate from your Atlas account login. |
| Login works but every page shows "Not authorized" | `JWT_SECRET` changed after tokens were issued. Log out and in again. |
| Frontend shows "Cannot reach the server" | In development, the backend is not running on port 5000. When deployed separately, `VITE_API_URL` is missing or lacks `/api`. |
| Browser console shows a CORS error | Separate deployment only. Set `CLIENT_URL` on the backend to the exact frontend URL (no trailing slash) and redeploy. |
| Refreshing a page gives "Not Found" or a blank page | Single-service: make sure the build ran (`client/dist` exists). Vercel/Netlify: ensure `vercel.json` / `public/_redirects` are in the `client` folder. |
| Render build fails with `vite: not found` | Use the root build command `npm run build`, which installs dev dependencies for the client. |
| Currency or API URL change has no effect after deploy | `VITE_` variables are read at build time. Redeploy. |
| First load after a while is very slow on Render | Free instances sleep when idle. Wait about a minute. |
| Port already in use locally | Change `PORT` in `server/.env`, and the proxy target in `client/vite.config.js`. |

---

## 13. Submission checklist

- [ ] Code pushed to a GitHub repository (no `.env` files committed)
- [ ] Live deployed link works (sign up, add transaction, refresh a page)
- [ ] Links added at the top of this README
- [ ] Both links submitted as required by DevCamp 2.0
