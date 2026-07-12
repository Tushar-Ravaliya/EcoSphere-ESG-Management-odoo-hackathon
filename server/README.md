# EcoSphere Server (hackathon scaffold)

## Setup
```bash
npm install
cp .env.example .env
# fill in MONGO_URI (Atlas free tier) and JWT_SECRET in .env
npm run seed   # wipes DB and loads demo data
npm run dev    # starts on http://localhost:5000
```

Seeded login: `admin@ecosphere.test` / `password123`
Other seeded users: `alice@ecosphere.test`, `bob@ecosphere.test` (same password)

## What's wired up
- 15 Mongoose models matching the brief's data model, minus a few dropped to fit 8 hours
  (Product ESG Profile, Environmental Goal, Audit-as-separate-model, Department Score as a
  stored collection — computed live instead in `/api/dashboard/scores`)
- Full CRUD for Departments, Employees, Categories, Emission Factors, Carbon Transactions,
  CSR Activities, Challenges, Policies, Compliance Issues
- Approval flows that auto-award points/XP and auto-check badge unlock rules
  (`employeeParticipation.routes.js`, `challengeParticipation.routes.js`)
- Reward redemption with stock + points deduction (`reward.routes.js`)
- Live ESG score aggregation with configurable weights (`dashboard.routes.js`)
- Minimal JWT auth (`auth.routes.js`, `middleware/auth.js`) — not wired onto every route yet,
  since for a demo you likely don't need to lock down every endpoint. Add `protect` /
  `requireRole` middleware to routes if judges will test with multiple roles.

## Not built (call this out as "future scope" in your pitch)
- Real file uploads for proof — `proof` is just a boolean toggle
- Email/in-app notifications — front-end can use react-hot-toast as a stand-in
- Scheduled/auto emission calculation from ERP records — carbon transactions are entered
  manually via the API (calculation itself IS automatic: server derives `calculatedCO2`
  from quantity × emission factor)
- Custom Report Builder + PDF/Excel export
- Diversity metrics, training completion, Product ESG Profile

## Suggested next steps for your teammate on frontend
1. `POST /api/auth/login` → store token + user in zustand
2. `GET /api/dashboard/scores` → feed the Env/Social/Gov radar chart + overall score
3. `GET /api/employees/leaderboard` → leaderboard table
4. Wire approve buttons to `PATCH /api/employee-participations/:id/approve` and
   `PATCH /api/challenge-participations/:id/approve` — both return `{ participation, newBadges }`,
   so trigger a toast/confetti when `newBadges.length > 0`
