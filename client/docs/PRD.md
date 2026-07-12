# EcoSphere: ESG Management Platform
## Frontend Product Requirements Document (PRD)

This document outlines the frontend requirements, user interface design, routing, state management, and API integration guidelines for the **EcoSphere ESG Management Platform** client. The frontend is built using **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS v4**.

---

## 1. Background & Product Goals
Environmental, Social, and Governance (ESG) compliance has transitioned from a public-relations metric to a core operational requirement. EcoSphere integrates ESG monitoring into day-to-day operations by tracking sustainability metrics, encouraging employee participation via gamification, and generating unified dashboards for management.

### Key Objectives for the Hackathon Demo
*   **Real-time Visualization**: Provide a stunning, interactive, and transparent look at the organization's ESG performance.
*   **Gamified Employee Engagement**: Encourage employees to participate in sustainability challenges, earn XP/points, unlock badges, and redeem rewards.
*   **Compliance and Governance Tracking**: Log audits, track compliance issues, and facilitate corporate policy acknowledgments.
*   **Admin & Configuration Control**: Empower administrators to adjust ESG weights, configure emission factors, manage rewards, and approve CSR/Challenge participation.

---

## 2. Target User Personas & Permissions
The frontend must adapt dynamically to three distinct user roles (managed via JWT claims returned on login):

1.  **Employee**
    *   View personal dashboard, XP, points, and badges locker.
    *   Browse and join sustainability Challenges.
    *   Browse and participate in CSR Activities (with dummy file/toggle proof upload).
    *   Acknowledge active corporate policies.
    *   Browse the Reward Catalog and redeem rewards using points.
    *   View the global leaderboard.
2.  **Manager**
    *   All Employee capabilities.
    *   Review and approve/reject employee participation submissions for CSR Activities and Challenges.
    *   Create and manage Carbon Transactions for their department.
    *   Log compliance issues and assign owners.
3.  **Admin**
    *   All Manager/Employee capabilities.
    *   Manage overall platform settings (toggle requirements, adjust ESG weights, configure emission factors).
    *   Add new Challenges, CSR Activities, Policies, and Rewards.
    *   Delete or override records (e.g., carbon transactions, employee accounts).

---

## 3. Tech Stack & Dependencies
The client application uses the following libraries:
*   **Framework**: [React 19](file:///d:/odoo/client/package.json#L14) + [Vite](file:///d:/odoo/client/package.json#L30) + [TypeScript](file:///d:/odoo/client/package.json#L28)
*   **Styling**: [Tailwind CSS v4](file:///d:/odoo/client/package.json#L16) (with `@tailwindcss/vite` plugin for build integration)
*   **State Management**: `zustand` (lightweight, reactive, hooks-based)
*   **Routing**: `react-router-dom` (single-page routing with layout guards)
*   **Charts & Visualizations**: `recharts` (custom SVG-based interactive charts)
*   **Icons**: `lucide-react` (clean, consistent line icons)
*   **Toast Notifications**: `react-hot-toast` (for success, errors, badge unlock celebration, and reminders)

---

## 4. Premium Design System & Theme
To deliver a "WOW" factor for the hackathon judges, the UI will implement a custom **Sleek Dark Mode** with **Glassmorphism** styling.

### Styling Variables (Tailwind CSS v4 Configuration)
*   **Background**: Deep Space Obsidian (`#0B0F19`)
*   **Card/Surface**: Translucent Navy Glass (`rgba(17, 24, 39, 0.6)`) with a subtle border (`rgba(255, 255, 255, 0.08)`) and backdrop blur (`backdrop-filter: blur(12px)`).
*   **Primary/Environmental**: Vibrant Emerald HSL (`#10B981` to `#059669`)
*   **Secondary/Social**: Bright Cyan HSL (`#06B6D4` to `#0891B2`)
*   **Tertiary/Governance**: Deep Indigo/Purple HSL (`#8B5CF6` to `#7C3AED`)
*   **Accent/Gamification**: Golden Yellow (`#F59E0B` to `#D97706`) for badges, XP, and leaderboards.

### Typography
*   **Font Family**: `Inter` or `Outfit` (imported from Google Fonts).
*   **Headings**: Bold, high-contrast, with gradients (e.g., `bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent`).

---

## 5. Screen & Feature Specifications

### 5.1 Authentication (Login Screen)
*   **UI Components**: Minimalist card centered on obsidian background. Subtle gradient animated borders.
*   **Functionality**:
    *   Email & Password inputs.
    *   On Success: Store JWT token, user details (`_id`, `name`, `role`, `department`, `xp`, `points`) in the Zustand auth store and redirect to dashboard.
    *   Display helpful quick-login buttons for judges (e.g., "Login as Admin: `admin@ecosphere.test`", "Login as Employee: `alice@ecosphere.test`").

### 5.2 Main Dashboard (Unified View)
*   **Overall ESG Score Card**:
    *   Displays a large, radial/circular gauge showing the weighted overall ESG score (e.g., `85/100`).
    *   Weighted calculation: Env 40%, Social 30%, Gov 30% (fetched from `/api/dashboard/scores`).
*   **ESG Metrics Breakdown**:
    *   A radar chart or three side-by-side gauge cards for the three pillars:
        *   **Environmental Score**: Derived from department carbon emissions relative to target caps.
        *   **Social Score**: Percentage of CSR & Challenge participation approved.
        *   **Governance Score**: Deductions based on open/overdue compliance issues.
*   **Department Leaderboard Ranking**:
    *   A clean horizontal bar chart showing the ESG scores of different departments to foster internal competition.
*   **Gamification Quick Stats Sidebar**:
    *   Shows the logged-in user's profile card: Name, Department, Current XP, Redeemable Points, and recent Badges unlocked.

### 5.3 Environmental Module
*   **Dashboard Charts**:
    *   Monthly trend line chart showing `totalCO2` emissions.
    *   Emissions by Source Type (Pie chart: Purchase, Manufacturing, Expenses, Fleet).
*   **Carbon Transaction Log**:
    *   A data table showing all historical emissions entries, date, department, emission factor (name & category), quantity, and calculated CO2.
    *   *Admin/Manager only*: An "Add Transaction" modal form:
        *   Fields: Department (dropdown), Emission Factor (dropdown), Quantity (number), Date, Notes.
        *   Note: The server automatically derives `calculatedCO2` based on selected factor.
*   **Environmental Goals Tracker**:
    *   Visual progress bars showing active targets (e.g., "Reduce Fleet Emissions by 15%").
    *   Status indicator: `On Track` (green) or `Exceeded` (red/orange).
*   **Emission Factors Settings**:
    *   List of factors (e.g., Grid Electricity, Diesel Fuel, Air Travel). Shows unit and CO2 multiplier.

### 5.4 Social Module
*   **CSR Activities Catalog**:
    *   Grid of cards showing upcoming or active initiatives (e.g., Tree Planting Drive, E-waste Recycling Campaign).
    *   "Participate" action button:
        *   Modal form allowing employees to submit evidence. Since the backend lacks file upload, the UI uses a simple "Proof Attached" checkbox/toggle and a text input for description.
*   **Sustainability Challenges Catalog**:
    *   Active challenges with details (XP reward, difficulty level: Easy/Medium/Hard, deadline, status).
    *   "Join/Start Challenge" button which updates the user's challenge participation progress.
*   **Manager Review Inbox**:
    *   *Admin/Manager only* screen displaying pending CSR/Challenge submissions.
    *   Approve / Reject buttons.
    *   *UX Polish*: Approving a submission returns the new badges unlocked by the employee. If `newBadges.length > 0`, trigger a full-screen confetti effect and an in-app celebratory modal listing the badges.

### 5.5 Governance Module
*   **ESG Policies Catalog**:
    *   List of corporate policies (e.g., Code of Conduct, Anti-Bribery Policy, Waste Management Protocol).
    *   Displays acknowledgment status: "Acknowledged" (green check) vs "Awaiting Acknowledgment" (button to trigger `POST /api/policies/:id/acknowledge`).
*   **Audits & Compliance Issue Tracker**:
    *   Logs compliance violations.
    *   Each issue displays: Audit Title, Severity (Low/Medium/High/Critical), Description, Owner, Due Date, Status (Open/In Progress/Resolved).
    *   Overdue issues (status !== Resolved && dueDate < now) are marked with an urgent red badge.
*   **Alerts Feed**:
    *   Lists urgent compliance notifications (e.g., issues passing their due date).

### 5.6 Gamification & Rewards
*   **Leaderboard**:
    *   A ranked listing of employees based on cumulative XP.
    *   Framer Motion animations for list reordering.
*   **Badges Locker**:
    *   Visual grid of employee badges.
    *   Locked badges are grayed out with a lock icon and hover tooltips explaining the unlock rules (e.g., "Complete 5 Challenges").
    *   Unlocked badges are fully colored, glowing, and show the unlock date.
*   **Reward Catalog**:
    *   Redeemable items (e.g., Eco-friendly Coffee Mug, Extra Day Off, Sustainability Champion Hoodie).
    *   Displays points required and stock availability.
    *   "Redeem" button: Deducts points and updates stock locally on success. Shows alert if points are insufficient.

### 5.7 System Administration (Admin/Manager Settings)
*   **ESG Configuration Toggles**:
    *   **Evidence Requirement**: Toggle block on CSR approvals if proof is missing.
    *   **Badge Auto-Award**: Toggle automatic badge assignment on XP milestone hits.
    *   **Auto Emission Calculation**: Toggle calculation logic.
*   **Departments Management**: CRUD interface for managing company organizational units.
*   **Categories Management**: Configure CSR & Challenge categories.

---

## 6. Frontend API Integration Specifications
The client makes requests to the Express server running at `http://localhost:5000`. All requests, except login, must include the JWT token in the headers:
`Authorization: Bearer <JWT_TOKEN>`

### Endpoint Map

| Component | UI Action | HTTP Method | API Path | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | User Login | `POST` | `/api/auth/login` | `{ email, password }` |
| **Dashboard** | Fetch aggregated scores & weights | `GET` | `/api/dashboard/scores` | *None* |
| **Employees** | Fetch leaderboard list | `GET` | `/api/employees/leaderboard` | *None* |
| **Carbon Transactions** | List transactions | `GET` | `/api/carbon-transactions` | Queries: `?department=&from=&to=&sourceType=` |
| | Add carbon transaction | `POST` | `/api/carbon-transactions` | `{ department, emissionFactor, quantity, date?, notes? }` |
| | Edit carbon transaction | `PUT` | `/api/carbon-transactions/:id` | `{ quantity, emissionFactor?, notes? }` |
| | Delete carbon transaction | `DELETE` | `/api/carbon-transactions/:id` | *None* |
| **CSR Activities** | List CSR activities | `GET` | `/api/csr-activities` | *None* |
| | Participate in activity | `POST` | `/api/employee-participations` | `{ employee, activity, proof: boolean }` |
| | View CSR participations | `GET` | `/api/employee-participations` | Queries: `?employee=&activity=` |
| | Approve CSR participation | `PATCH` | `/api/employee-participations/:id/approve`| *None* |
| | Reject CSR participation | `PATCH` | `/api/employee-participations/:id/reject` | *None* |
| **Challenges** | List challenges | `GET` | `/api/challenges` | *None* |
| | Join/Start challenge | `POST` | `/api/challenge-participations` | `{ employee, challenge }` |
| | Approve challenge participation| `PATCH` | `/api/challenge-participations/:id/approve`| *None* |
| **Policies** | List active policies | `GET` | `/api/policies` | *None* |
| | Acknowledge policy | `POST` | `/api/policies/:id/acknowledge` | `{ employeeId }` |
| | View employees pending ack | `GET` | `/api/policies/:id/pending` | *None* |
| **Compliance** | List compliance issues | `GET` | `/api/compliance-issues` | *None* |
| | Log compliance issue | `POST` | `/api/compliance-issues` | `{ auditTitle, severity, description, owner, dueDate }` |
| | Update issue status/fields | `PATCH` | `/api/compliance-issues/:id` | `{ status, owner?, dueDate? }` |
| | View overdue alerts | `GET` | `/api/compliance-issues/alerts/overdue` | *None* |
| **Rewards** | List active rewards | `GET` | `/api/rewards` | *None* |
| | Redeem reward | `POST` | `/api/rewards/:id/redeem` | `{ employeeId }` |

---

## 7. Mockup Wireframes & Layout Grid

### General Layout Layout Grid (Dashboard View)
```
+-----------------------------------------------------------------------------------+
|  [Logo] EcoSphere       [Dashboard]  [Environmental]  [Social]  [Gov]  [Rewards] |  [User Profile Card: XP / Pts]
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +-----------------------------+   +-------------------------------------------+  |
|  |     Overall ESG Score       |   |             ESG Radar Chart               |  |
|  |           [  85  ]          |   |                 (Recharts)                |  |
|  |        Weighted Total       |   |                                           |  |
|  +-----------------------------+   +-------------------------------------------+  |
|                                                                                   |
|  +-----------------------------+   +-------------------+   +-------------------+  |
|  |   Environmental Pillar      |   |   Social Pillar   |   | Governance Pillar |  |
|  |   CO2: 240kg / 1000kg Cap   |   |   CSR Appr: 80%   |   | Open Issues: 2    |  |
|  |   [||||||||.......] 24%     |   |   [|||||||||||..] |   | [!! Overdue !!]   |  |
|  +-----------------------------+   +-------------------+   +-------------------+  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 8. Development Phases & Roadmap

### Phase 1: Core Setup & Client Routing
*   Create Zustand stores for `auth`, `theme`, and `notifications`.
*   Establish React Router structure:
    *   `/login` (Public)
    *   `/dashboard` (Protected)
    *   `/environmental` (Protected)
    *   `/social` (Protected)
    *   `/governance` (Protected)
    *   `/rewards` (Protected)
    *   `/settings` (Admin/Manager Guarded)

### Phase 2: Beautiful Visuals & Aggregated Dashboards
*   Build a glassmorphic dashboard layout using Tailwind CSS.
*   Integrate `recharts` to render the radar charts and carbon emission line graphs.
*   Feed statistics from the `/api/dashboard/scores` and `/api/employees/leaderboard` endpoints.

### Phase 3: Operational Modules & Approvals
*   Build the Environmental logs, goal trackers, and log carbon transaction form.
*   Build the Social challenges list, CSR activities list, and approval inbox (interactive approve/reject buttons).
*   Add canvas-confetti on successful badge acquisitions.

### Phase 4: Compliance & Rewards Redemption
*   Build policy list, acknowledgment click handlers.
*   Create the compliance log table, overdue warnings, and log issue forms.
*   Implement reward catalog redemption, deducting points from state and showing immediate stock adjustments.

### Phase 5: Polishing & Edge Cases
*   Ensure full responsiveness (Mobile sidebar collapses, flex wrappers wrap).
*   Handle API error boundaries (failed login, forbidden request errors, expired session resets).
