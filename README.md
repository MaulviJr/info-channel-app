# Info Channel Institute — Learning Management System

A full-stack Learning Management System (LMS) for a training institute, supporting student enrollment, course/module/lecture management, progress tracking, and role-based dashboards for Students, Teachers, and Admins.

---

## 1. Overview

**Info Channel Institute LMS** is a monorepo-style project (separate `backend/` and `frontend/` folders) that digitizes the operations of a physical training institute ("Info Channel Institute", Karachi, established 2000). It solves the problem of manually tracking student registrations, course curricula, enrollments, payments, and lecture-by-lecture progress.

**Intended users:**
- **Students** — browse public courses, register, complete their profile, enroll in courses, watch lectures, and track completion progress.
- **Teachers** — create and manage their own courses, modules, and lectures; view enrolled students and class analytics.
- **Admins** — manage all courses, approve/reject enrollments, manage staff accounts, and view institute-wide analytics (revenue, enrollments, course popularity, profile completion rates).

**Architecture:**
- A **React (Vite) SPA** frontend communicating over REST/JSON with...
- An **Express.js REST API** backend, which persists data in...
- A **PostgreSQL** database (schema managed via `node-pg-migrate` migrations).
- Media (profile pictures) is uploaded to **Cloudinary**.
- Auth is JWT-based (access + refresh tokens) delivered via **HttpOnly cookies**.


---

## 2. Features

### ✅ Implemented

**Public / Marketing site**
- Animated (GSAP-driven) home page: Hero, About, Courses, Testimonials, and CTA sections.
- Public course catalog (`/courses`) and course detail pages with curriculum preview.
- Public navbar & footer, login/signup pages.

**Authentication**
- Registration (student self-signup) and login with JWT access/refresh tokens in HttpOnly cookies.
- Silent token refresh via Axios response interceptor.
- Role-based route protection (`student`, `teacher`, `admin`) via `ProtectedRoute` / `GuestRoute`.

**Student**
- Dashboard with enrollment stats, progress chart, and recent activity placeholder.
- Profile management with completion tracking (required fields: cell number, DOB, CNIC, father's name/cell, address, education, lead source) and profile picture upload.
- Course browsing, enrollment requests (pending → active/completed/cancelled/pending_payment lifecycle).
- "Learn" page: sequential lecture unlocking, video playback (`react-player`), 80%-watched auto-completion, manual "Mark as Complete".
- Progress analytics page with bar chart (Chart.js) and per-course completion breakdown.
- Enrollment status tracking page with polling for pending approvals.

**Teacher**
- Dashboard with course/student stats and charts (enrollment trend, course popularity).
- Course CRUD (create/edit), module & lecture management with **drag-and-drop reordering** (`@dnd-kit`).
- Add/Edit/Delete modules and lectures (video URL based, not file upload).
- View students per course, with progress percentages.
- Teacher profile editing.

**Admin**
- Dashboard with institute-wide stats (students, courses, pending enrollments, staff) and charts (enrollments/revenue over time, course popularity, profile completion rate).
- Full course management (create/edit/delete/publish-toggle).
- Enrollment approval/rejection workflow.
- Student list with profile-completion status and detail view.
- Create Teacher/Admin staff accounts.

**Backend infrastructure**
- Zod-based request validation across controllers/services.
- Layered architecture: routes → controllers → services → repositories.
- PostgreSQL migrations for schema evolution (courses, enrollments, modules, lectures, progress, refresh tokens, etc.).
- Multer + Cloudinary integration for image/video uploads.

### 🚧 Planned / TODO (per `backend/future.md` and in-code TODOs)

- Monthly payment tracking table & auto-generated payment schedules.
- Admin "mark-as-paid" workflow and overdue payment dashboard.
- Course `duration_months` field and quiz/assessment system.
- Email notifications for students.
- **Completion certificate generation** (PDF) — `certificates` table and `issueCertificate` service exist but are **not wired up** (commented out in `progress.service.js`; `certificate.controller.js` and `certificate.repository.js` are empty stubs).
- Bulk student management tools for admins.
- `updateUserStatus` (activate/suspend user) — route exists but handler is unimplemented.
- `changeUserRole` — stubbed, not implemented.
- Payment status change endpoint (`/enrollments/:id/payment-status`) — commented out in both routes and controller.


## 3. Tech Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | React 19 (Vite 8) |
| **Frontend Routing** | React Router DOM v7 |
| **Frontend State/Data** | TanStack React Query v5, React Context (Auth) |
| **Forms** | React Hook Form + `@hookform/resolvers` |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`), custom OKLCH design tokens in `index.css` |
| **Animation** | GSAP (`gsap`, `@gsap/react`) with ScrollTrigger |
| **3D** | Three.js (SVG-to-3D logo renderer on the hero section) |
| **Charts** | Chart.js + `react-chartjs-2`, Recharts (installed, partially used) |
| **Drag & Drop** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **HTTP Client** | Axios (with refresh-token interceptor) |
| **Video Playback** | `react-player` |
| **Icons** | Lucide React |
| **Validation (client)** | Zod (via `@hookform/resolvers`, `zod` v4) |
| **Backend Runtime** | Node.js (ESM, `"type": "module"`) |
| **Backend Framework** | Express 5 |
| **Database** | PostgreSQL (via `pg`) |
| **Migrations** | `node-pg-migrate` |
| **Auth** | JWT (`jsonwebtoken`) — access + refresh tokens in HttpOnly cookies, `bcryptjs` for password hashing |
| **Validation (server)** | Zod v3 |
| **File Uploads** | Multer (disk storage) → Cloudinary (`cloudinary` SDK) |
| **Dev Tooling** | Nodemon (backend), ESLint (frontend) |
| **Local Infra** | Docker Compose (Postgres 17-alpine + Adminer) |
| **AI/LLM Services** | None found in the codebase |

---

## 4. Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app setup, middleware, route mounting
│   │   ├── index.js                # Entry point — connects DB, starts server
│   │   ├── constants.js            # (referenced, not shown in repo excerpt)
│   │   ├── controllers/            # Request/response handlers per resource
│   │   ├── services/                # Business logic layer
│   │   ├── repositories/            # Raw SQL query layer (pg)
│   │   ├── routes/                  # Express routers per resource
│   │   ├── middlewares/             # auth.middleware.js, multer.middleware.js
│   │   ├── utils/                    # ApiError, ApiResponse, asyncHandler, tokens, cloudinary
│   │   └── db/
│   │       ├── pool.js               # pg Pool + dotenv config
│   │       ├── migrations/           # node-pg-migrate migration files (timestamped)
│   │       └── seeds/createAdmin.js  # Script to seed an admin user
│   ├── docker-compose.yml          # Postgres + Adminer for local dev
│   ├── node-pg-migrate.json / migration-config.json
│   ├── *.http                        # REST Client test files (users, course, enrollment)
│   ├── future.md                     # Roadmap / planned features
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/                     # Axios wrapper functions per resource (axios.js, user.api.js, ...)
    │   ├── components/
    │   │   ├── common/               # Button, FormInput, ErrorAlert, AuthCard/Layout, LoadingButton
    │   │   ├── layout/                # Sidebars/Topbars/Layouts for Admin, Teacher, Student
    │   │   ├── courses/                # Course cards, forms, module/lecture management (DnD)
    │   │   ├── dashboard/              # StatCard, charts (Admin/Teacher), CourseProgressCard
    │   │   ├── home/                    # Marketing sections (Hero, About, Courses, Testimonials, CTA)
    │   │   ├── profile/                 # ProfileCompletionBanner
    │   │   └── 3D/Logo3DHero.jsx        # Three.js SVG-to-3D hero logo
    │   ├── context/AuthContext.jsx   # Global auth state (reducer-based)
    │   ├── hooks/                     # useAuth, useProfile
    │   ├── pages/
    │   │   ├── public/                 # HomePage, Courses, Login, SignUp, CourseDetail, Navbar, Footer
    │   │   ├── student/                # Dashboard, Courses, Learn, Profile, Progress, Enrollments
    │   │   ├── teacher/                # Dashboard, Courses, Course Modules, Students, Profile
    │   │   └── admin/                   # Dashboard, Courses, Enrollments, Students, Create Staff
    │   ├── routes/                     # ProtectedRoute, GuestRoute
    │   ├── utils/getDashboardByRole.js
    │   ├── App.css / index.css        # Tailwind v4 tokens (OKLCH color system)
    │   └── main.jsx                    # Router config, React Query client, providers
    ├── public/                          # favicon.svg, icons.svg
    ├── vite.config.js
    └── package.json
```

---

## 5. How It Works

1. **Public visitors** land on the marketing homepage (`HomeLayout` → `Navbar`/`Footer` wrapping `HomePage`), browse published courses (`GET /courses`), and view course details (`GET /courses/:id/details`, includes modules & lectures).
2. **Sign up** creates a `student` user + an empty `student_profiles` row with an auto-generated `GR-YYYY-XXXXXX` GR number. **Login** issues an access token (15 min) and refresh token (7 days) as HttpOnly cookies and returns user info to populate `AuthContext`.
3. On every API 401, the Axios interceptor (`frontend/src/api/axios.js`) automatically calls `/users/refresh-token` once, queues concurrent failed requests, and retries them — avoiding redundant refresh calls.
4. **Route access** is gated client-side by `ProtectedRoute`/`GuestRoute` (checking `AuthContext.isAuthenticated` + `role`) and server-side by `verifyJWT` + `requireRole(...)` Express middleware.
5. **Students** must complete their profile (`getProfileCompletion` in `studentProfile.service.js`) before enrolling in a course (enforced server-side in `enrollment.service.js`). New enrollments start as `pending_payment` and are approved (`active`) or rejected (`cancelled`) by an **Admin**.
6. **Learning flow**: `StudentLearn.jsx` fetches the full course tree with per-lecture completion status (`getCourseForLearning` repository query, LEFT JOIN on `progress`). Lectures unlock **sequentially** — a lecture is locked until the previous lecture in the module is completed. Watching ≥80% of a video auto-marks it complete via `POST /progress/lecture/:lectureId/complete` (also exposed via `/learning/progress`).
7. When all lectures in a course are completed, the enrollment status is automatically updated to `completed` (see `progress.service.js` / `learning.controller.js`).
8. **Teachers/Admins** manage curriculum through `ViewModules.jsx`, using `@dnd-kit` for drag-and-drop reordering of modules and lectures — reorder operations use a "shift into negative-offset space, then restore" SQL strategy to avoid `UNIQUE (course_id, position)` constraint collisions mid-transaction.
9. **Dashboards** (`AdminDashboard`, `TeacherDashboard`, `StudentDashboard`) fetch aggregate stats/charts from dedicated endpoints (`/users/admin/stats`, `/users/admin/charts`, `/users/teacher/stats`, `/users/teacher/charts`) rendered with Chart.js.

---

## 6. Getting Started

### Prerequisites

- **Node.js** ≥ 18 (backend requires Node ≥ 20 per some transitive tooling; frontend Vite 8 requires modern Node)
- **npm** (or yarn/pnpm)
- **PostgreSQL** (or Docker, via the provided `docker-compose.yml`)
- **Cloudinary account** (for profile picture uploads) — *Optional for core LMS functionality but required for the upload feature to work.*

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Start PostgreSQL (via Docker Compose)

```bash
cd backend
docker compose up -d
```
This starts:
- `postgres` (Postgres 17-alpine) on port `${DB_PORT}` (mapped from container's `5432`)
- `adminer` (DB GUI) on `http://localhost:8080`

> Alternatively, point `DATABASE_URL` at any existing PostgreSQL instance.

### 3. Configure environment variables

Create `backend/.env` (see [Environment Variables](#7-environment-variables) below).

### 4. Install backend dependencies & run migrations

```bash
cd backend
npm install
npm run migrate:up
```

### 5. (Optional) Seed an admin user

```bash
node src/db/seeds/createAdmin.js
```
Requires `ADMIN_PASSWORD` (and optionally `ADMIN_NAME`, `ADMIN_EMAIL`) set in the environment.

### 6. Run the backend

```bash
npm run dev      # nodemon, hot-reload
# or
npm start        # plain node
```
Backend listens on `process.env.PORT` (defaults to `5000`). API base path: `http://localhost:5000/api/v1`.

### 7. Install & run the frontend

```bash
cd ../frontend
npm install
npm run dev
```
Vite dev server runs (default `http://localhost:5173`). **Note:** the frontend's Axios base URL is currently **hardcoded** to `http://localhost:5000/api/v1` (`frontend/src/api/axios.js`) — there is no `VITE_API_URL` env var wired up despite an (empty) `frontend/.env` file existing. Update this constant if your backend runs elsewhere.

### 8. Build for production

```bash
# Frontend
cd frontend
npm run build     # outputs to frontend/dist
npm run preview   # preview the production build locally

# Backend (no build step — plain Node/ESM)
cd backend
npm start
```

---

## 7. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | **Required** | PostgreSQL connection string used by `pg.Pool` | `postgresql://user:pass@localhost:5432/infochannel` |
| `PORT` | Optional | Port the Express server listens on (defaults to `5000`) | `5000` |
| `CORS_ORIGIN` | Optional | Allowed CORS origin (defaults to `*`) | `http://localhost:5173` |
| `ACCESS_TOKEN_SECRET` | **Required** | Secret for signing 15-minute JWT access tokens | `your-strong-secret` |
| `REFRESH_TOKEN_SECRET` | **Required** | Secret for signing 7-day JWT refresh tokens | `another-strong-secret` |
| `CLOUDINARY_CLOUD_NAME` | **Required** (for uploads) | Cloudinary account cloud name | `my-cloud` |
| `CLOUDINARY_API_KEY` | **Required** (for uploads) | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | **Required** (for uploads) | Cloudinary API secret | `abcDEF123...` |
| `DB_NAME` | Required (Docker only) | Postgres database name for `docker-compose.yml` | `infochannel` |
| `DB_USER` | Required (Docker only) | Postgres user for `docker-compose.yml` | `postgres` |
| `DB_PASSWORD` | Required (Docker only) | Postgres password for `docker-compose.yml` | `postgres` |
| `DB_PORT` | Required (Docker only) | Host port mapped to Postgres container's `5432` | `5432` |
| `ADMIN_NAME` | Optional | Name used by `createAdmin.js` seed script | `Super Admin` |
| `ADMIN_EMAIL` | Optional | Email used by `createAdmin.js` seed script | `admin@infochannel.com` |
| `ADMIN_PASSWORD` | **Required** (for seed script) | Password for the seeded admin account | `ChangeMe123!` |

### Frontend (`frontend/.env`)

The repository's `frontend/.env` file is **empty** — no environment variables are currently consumed by the frontend build (Vite would expose any `VITE_`-prefixed vars, but none are referenced in the code). *Needs manual input if you wish to externalize the API base URL (`frontend/src/api/axios.js`).*

---

## 8. Available Scripts

### Backend (`backend/package.json`)

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `nodemon -r dotenv/config --experimental-json-modules src/index.js` | Start the API server with hot-reload and env loading |
| `npm start` | `node src/index.js` | Start the API server in production mode |
| `npm run db:init` | `node src/db/initDb.js` | Initialize the database (*script not included in the provided excerpt — verify it exists*) |
| `npm run migrate:up` | `node-pg-migrate up -m src/db/migrations` | Apply all pending migrations |
| `npm run migrate:down` | `node-pg-migrate down -m src/db/migrations` | Roll back the most recent migration |
| `npm run migrate:create` | `node-pg-migrate create -m src/db/migrations` | Scaffold a new timestamped migration file |

### Frontend (`frontend/package.json`)

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `vite` | Start the Vite development server |
| `npm run build` | `vite build` | Produce an optimized production build in `dist/` |
| `npm run lint` | `eslint .` | Lint the codebase using the flat ESLint config |
| `npm run preview` | `vite preview` | Serve the production build locally for verification |

---

## 9. API Documentation

Base URL: `http://localhost:5000/api/v1`

All success responses follow the shape (`ApiResponse`):
```json
{ "statusCode": 200, "data": { ... }, "message": "Success", "success": true }
```
All error responses follow the shape (`ApiError`, thrown and caught by Express's default/global error handling via `asyncHandler`):
```json
{ "statusCode": 400, "data": null, "message": "Validation failed", "success": false, "error": [ ... ] }
```

Authentication is via **HttpOnly cookies** (`AccessToken`, `RefreshToken`) set on login, or a `Bearer <token>` `Authorization` header. Roles: `student`, `teacher`, `admin`.

### Auth & Users (`/users`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/users/register` | Public | Register a new student (multipart, optional `profilePicture`) |
| POST | `/users/login` | Public | Login, sets `AccessToken`/`RefreshToken` cookies |
| POST | `/users/refresh-token` | Public (refresh cookie/header) | Rotate access/refresh tokens |
| POST | `/users/logout` | Any authenticated | Invalidate refresh token, clear cookies |
| GET | `/users/me` | Any authenticated | Current user + profile + completion status |
| GET | `/users/profile/status` | `student` | Student profile completion status |
| PUT | `/users/profile` | `student` | Update student profile (multipart, optional `profilePicture`) |
| POST | `/users/admin/create-teacher` | `admin` | Create a teacher account |
| POST | `/users/admin/create-admin` | `admin` | Create an admin account |
| GET | `/users/admin/stats` | `admin` | Institute-wide stats (students, courses, pending enrollments, staff) |
| GET | `/users/admin/charts` | `admin` | Enrollments/revenue over time, course popularity, profile completion |
| GET | `/users/admin/users` | `admin` | List all users (optional `?role=`) |
| GET | `/users/admin/users/:id` | `admin` | Get a single user |
| DELETE | `/users/admin/users/:id` | `admin` | Delete a user |
| PATCH | `/users/admin/users/:id/status` | `admin` | ⚠️ Route wired but handler unimplemented |
| GET | `/users/admin/students` | `admin` | Students with profile-completion status |
| GET | `/users/admin/students/:id` | `admin` | Full student profile detail |
| GET | `/users/teacher/profile` | `teacher` | Teacher's own profile |
| PUT | `/users/teacher/profile` | `teacher` | Update teacher's own name/email |
| GET | `/users/teacher/my-courses` | `teacher` | Courses taught by this teacher |
| GET | `/users/teacher/my-courses/:id/students` | `teacher` | Students enrolled in a specific course + progress |
| GET | `/users/teacher/my-students` | `teacher` | All students across the teacher's courses |
| GET | `/users/teacher/stats` | `teacher` | Teacher dashboard stats |
| GET | `/users/teacher/charts` | `teacher` | Teacher dashboard charts |

### Courses (`/courses`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/courses` | Public | List published courses (`?page=&limit=`) |
| GET | `/courses/:id` | Public | Get a single course |
| GET | `/courses/:id/details` | Public | Course + modules + lectures |
| GET | `/courses/all` | `teacher`, `admin` | All courses (own courses for teachers) |
| POST | `/courses/create-course` | `teacher`, `admin` | Create course (`title`, `description`, `board_registration`, `admission_fee`, `monthly_fee`, `thumbnail_url`) |
| PUT | `/courses/:id` | `teacher` (owner) | Update course |
| DELETE | `/courses/:id` | `admin` | Delete course |
| PATCH | `/courses/:id/publish` | `admin` | Toggle `is_published` |

### Modules (`/modules`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/modules/course/:courseId` | Public | List modules for a course |
| POST | `/modules/course/:courseId/create` | `teacher`, `admin` | Create a module (`{ title }`) |
| PUT | `/modules/:moduleId` | `teacher` | Update module title/position |
| DELETE | `/modules/:moduleId` | `teacher`, `admin` | Delete module (shifts remaining positions) |
| PUT | `/modules/:courseId/reorder` | `teacher`, `admin` | Reorder module (`{ moduleId, newPosition }`) |

### Lectures (`/lectures`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PUT | `/lectures/reorder` | `teacher`, `admin` | Reorder lecture (`{ lectureId, newPosition }`) |
| GET | `/lectures/module/:moduleId` | Public | List lectures for a module |
| POST | `/lectures/module/:moduleId/create` | `teacher`, `admin` | Create lecture (`{ courseId, title, videoUrl, ... }`) |
| GET | `/lectures/:lectureId` | Public | Get a single lecture |
| PUT | `/lectures/:lectureId` | `teacher` | Update lecture details |
| DELETE | `/lectures/:lectureId` | `teacher`, `admin` | Delete lecture (shifts positions) |

### Enrollments (`/enrollments`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/enrollments` | `student` | Enroll in a course (`{ courseId }`) — requires complete profile, max 2 active enrollments |
| GET | `/enrollments` | `teacher`, `admin` | List all enrollments (teacher sees only their courses) |
| GET | `/enrollments/my` | `student` | Student's own enrollments + progress |
| GET | `/enrollments/:id` | student/teacher/admin (owner-checked) | Get a single enrollment |
| PATCH | `/enrollments/:id/status` | Any authenticated (⚠️ no role check in route) | Update status (`active`, `completed`, `cancelled`, `pending_payment`) |
| DELETE | `/enrollments/:id` | `admin` | Delete an enrollment |

### Progress (`/progress`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/progress/lecture/:lectureId/complete` | Any authenticated | Mark a lecture complete for the current user |
| GET | `/progress/course/:courseId` | Any authenticated | Get completion counts/percent for a course |

### Learning (`/learning`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/learning/courses/:courseId` | Any authenticated (must be enrolled) | Full course tree with lecture-level completion for the current user |
| POST | `/learning/progress` | Any authenticated (must be enrolled) | Update lecture progress (`{ courseId, lectureId, isCompleted }`); auto-updates enrollment status to `completed`/`active` |

**Common error responses:** `400` (Zod validation failure), `401` (missing/invalid/expired token), `403` (role/ownership forbidden), `404` (resource not found), `409` (conflict — e.g. duplicate email/CNIC, already enrolled).

---

## 10. Database

**Technology:** PostgreSQL, managed via **`node-pg-migrate`** (raw SQL migrations under `backend/src/db/migrations/`, no ORM). Queries are hand-written SQL in the `repositories/` layer using the `pg` driver.

### Core tables (as evolved through migrations)

| Table | Purpose |
|---|---|
| `users` | Core account record: `name`, `email`, `password_hash`, `role` (`student`/`teacher`/`admin`), `refresh_token(_expires_at)` |
| `student_profiles` | 1:1 with `users` (student role) — contact info, CNIC, father's info, education, `lead_source`, `gr_number` |
| `courses` | Title, description, `admission_fee`, `monthly_fee`, `board_registration` (`SDC`/`SBTE`/`None`), `thumbnail_url`, `instructor_id` (FK → `users`), `is_published` (`price` column dropped in a later migration) |
| `modules` | Belongs to a `course`; `title`, `position` (unique per course) |
| `lectures` | Belongs to a `module` and `course`; `title`, `video_url`, `position` (unique per module), `duration_sec`, `is_preview` |
| `enrollments` | Links `student` ↔ `course`; `status` (`active`/`completed`/`cancelled`/`pending_payment`); unique per (student, course) |
| `progress` | Links `user`, `course`, `lecture`; `is_completed`, `completed_at`; unique per (user, lecture) |
| `payments` | Payment records (`amount`, `gateway`, `status`) — defined in the initial schema, not actively used by current controllers |
| `certificates` | `certificate_url`, `serial_number` — schema exists, issuance flow **not implemented** |
| ~~`section_lectures`~~ | Legacy table from the initial schema, later **dropped** in favor of `modules`/`lectures` |

### Notable relationships
- `courses.instructor_id → users.id`
- `modules.course_id → courses.id` (CASCADE)
- `lectures.module_id → modules.id`, `lectures.course_id → courses.id` (CASCADE)
- `enrollments.student_id → users.id`, `enrollments.course_id → courses.id`
- `progress.user_id → users.id`, `progress.lecture_id → lectures.id`, `progress.course_id → courses.id`

**ORM:** None — raw parameterized SQL via `pg.Pool`/`Client`, wrapped in explicit `BEGIN`/`COMMIT`/`ROLLBACK` transactions for multi-step operations (enrollment creation, reordering, module/lecture deletion with position-shifting).

---

## 11. Authentication

- **Registration**: `POST /users/register` hashes the password with `bcryptjs` (10 salt rounds), creates a `users` row (`role = "student"`) and a linked, mostly-empty `student_profiles` row with a generated GR number (`GR-<year>-<6 random digits>`, retried up to 5 times for uniqueness).
- **Login**: `POST /users/login` verifies credentials, issues:
  - **Access token** (15 min, signed with `ACCESS_TOKEN_SECRET`, payload `{ id, email, role }`)
  - **Refresh token** (7 days, signed with `REFRESH_TOKEN_SECRET`, payload `{ id }`), also persisted in `users.refresh_token` / `refresh_token_expires_at`
  - Both set as `httpOnly`, `secure` cookies (`AccessToken`, `RefreshToken`) and also returned in the JSON body.
- **Route protection**: `verifyJWT` middleware reads the token from the cookie or `Authorization: Bearer` header, verifies it, re-fetches the user from the DB (ensures the account still exists), and attaches `req.user`. `requireRole(...roles)` middleware enforces RBAC.
- **Token refresh**: `POST /users/refresh-token` verifies the refresh token, issues a fresh access+refresh token pair, and rotates the stored value in `users`.
- **Client-side**: `AuthContext` (React reducer) holds `{ user, profile, completion, accessToken, isAuthenticated, isLoading }`. On app load, `GET /users/me` rehydrates the session. The Axios instance auto-retries any `401` (except the refresh endpoint itself) by calling refresh once, queuing concurrent requests to avoid a refresh storm.
- **Logout**: `POST /users/logout` nulls the stored refresh token and clears both cookies.

---

## 12. Deployment

No CI/CD pipeline, Dockerfile for the app itself, or hosting configuration (e.g. Vercel/Netlify/Render config) is present in the repository — **deployment strategy is not explicitly defined and requires manual setup.** Based on the stack, a typical deployment would look like:

- **Database**: Provision a managed PostgreSQL instance (or reuse the `docker-compose.yml` Postgres service on a VM) and run `npm run migrate:up` against it.
- **Backend**: Deploy the Express app (`backend/`) to any Node host (e.g. Railway, Render, a VM with PM2/systemd). Set all required environment variables (see table above). Ensure `CORS_ORIGIN` matches the deployed frontend's origin, and cookies are configured for cross-site use in production (the code currently sets `secure: true` but does not set `sameSite`, which may need adjustment depending on hosting domains).
- **Frontend**: Run `npm run build` in `frontend/` and serve the static `dist/` output via any static host (Vercel, Netlify, S3+CloudFront, Nginx). **Update the hardcoded API base URL** in `frontend/src/api/axios.js` to point at the deployed backend before building.
- **Media**: Cloudinary is already cloud-hosted — no additional infrastructure needed for uploads.

---

## 13. Configuration

| File | Purpose |
|---|---|
| `backend/package.json` | Backend deps/scripts; `"type": "module"` (ESM throughout) |
| `backend/node-pg-migrate.json` | Migration tool config — `{ "timestamp": true }` (timestamps migration filenames) |
| `backend/src/db/migration-config.json` | `{ "migrationsTable": "pgmigrations" }` — tracks applied migrations |
| `backend/docker-compose.yml` | Local Postgres 17-alpine + Adminer for development |
| `backend/.gitignore` | Ignores `node_modules`, `.env*`, build output, logs |
| `backend/*.http` | REST Client (VS Code) request collections for manual API testing (`users.http`, `course.http`, `enrollment.http`) |
| `frontend/package.json` | Frontend deps/scripts; `"type": "module"` |
| `frontend/vite.config.js` | Vite + `@vitejs/plugin-react` + `@tailwindcss/vite`; aliases `./runtimeConfig` for AWS-SDK-style browser compatibility; pre-bundles `recharts` |
| `frontend/eslint.config.js` | Flat ESLint config: `@eslint/js` recommended + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` (Vite mode), targets `**/*.{js,jsx}`, ignores `dist` |
| `frontend/index.html` | Vite entry HTML, mounts `#root`, loads `/src/main.jsx` |
| `frontend/src/index.css` | Tailwind v4 `@theme inline` block defining the full OKLCH design-token palette (light/dark), fonts (Poppins), shadows, radii |
| `frontend/.gitignore` | Ignores `node_modules`, `dist`, editor files, logs |

*Note:* There is no `tsconfig.json` (project is plain JS/JSX, not TypeScript), no `next.config`, no `tailwind.config.js` (Tailwind v4 is configured inline via `@theme` in CSS + the Vite plugin, not a JS config file), and no Prettier config found in the repository.

---

## 14. Screenshots

> **To be Added...

- **Home Page** — `![Home Page](docs/screenshots/home.png)`
- **Student Dashboard** — `![Student Dashboard](docs/screenshots/student-dashboard.png)`
- **Teacher Course Modules (Drag & Drop)** — `![Teacher Modules](docs/screenshots/teacher-modules.png)`
- **Admin Charts** — `![Admin Dashboard](docs/screenshots/admin-dashboard.png)`
- **Login / Signup** — `![Auth](docs/screenshots/auth.png)`
- **Mobile View** — `![Mobile](docs/screenshots/mobile.png)` *(Note: current frontend is explicitly built "Desktop only — no mobile responsiveness needed" per `frontend/src/prompt.md`)*

---

## 15. Future Improvements

Based on the current architecture and the roadmap in `backend/future.md`, along with gaps observed in the code:

- Implement the **payments/monthly billing** subsystem (schedule generation, overdue tracking, admin mark-as-paid).
- Wire up **certificate issuance** (the `certificates` table and `certificate.service.js` exist but are dormant — `issueCertificate` is commented out in `progress.service.js`).
- Build a **quiz/assessment engine** and `duration_months` support for courses.
- Implement the stubbed **admin endpoints**: `updateUserStatus` (activate/suspend) and `changeUserRole`.
- Add **email notifications** (enrollment approval, course completion, payment reminders).
- Introduce **automated tests** (none currently present — no test runner configured in either `package.json`).
- Add **mobile-responsive layouts** for the dashboard views (currently desktop-only by design).
- Move the frontend's hardcoded API base URL into a `VITE_API_URL` environment variable.
- Add a **CI/CD pipeline** and containerize the backend/frontend for consistent deployments.
- Support **direct video file uploads** for lectures (currently only external `videoUrl` is accepted, despite `uploadVideo`/multer plumbing existing in `cloudinary.js`/`multer.middleware.js`).

---

## 16. License

**No `LICENSE` file was found in this repository.** The project's license status is currently **unspecified** — please add a `LICENSE` file (e.g. MIT, Apache-2.0) before treating this as open-source, or clarify proprietary status.

---

## 17. Acknowledgements

- [Express](https://expressjs.com/) — backend web framework
- [React](https://react.dev/) & [Vite](https://vitejs.dev/) — frontend framework/tooling
- [PostgreSQL](https://www.postgresql.org/) & [node-pg-migrate](https://github.com/salsita/node-pg-migrate) — database & migrations
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling
- [TanStack Query](https://tanstack.com/query) — server-state management
- [GSAP](https://gsap.com/) — scroll-driven marketing-page animations
- [Three.js](https://threejs.org/) — 3D hero logo rendering
- [Chart.js](https://www.chartjs.org/) / [react-chartjs-2](https://react-chartjs-2.js.org/) / [Recharts](https://recharts.org/) — data visualization
- [dnd-kit](https://dndkit.com/) — accessible drag-and-drop for module/lecture reordering
- [react-hook-form](https://react-hook-form.com/) & [Zod](https://zod.dev/) — form state and schema validation
- [Cloudinary](https://cloudinary.com/) — media storage/delivery
- [Lucide](https://lucide.dev/) — icon set

---
