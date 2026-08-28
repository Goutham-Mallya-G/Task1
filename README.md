# Student Assignment Management System

This is a role-based course, student assignment, and group management application developed as an internship task for Joineazy. Students can browse courses, enroll individually or enroll a group, create groups, manage members, view relevant assignments, open assignment files through OneDrive, and confirm submissions. Administrators can create and manage courses, inspect course enrollment and analytics, manage assignments, inspect groups and members, create assignments for all students or selected groups, and review progress and submissions.

## Implementation Overview

The application is split into two independently runnable packages:

- `frontend`: React, Vite, React Router, Tailwind CSS, Axios, and Zod.
- `backend`: Node.js, Express, PostgreSQL, JWT authentication, and bcrypt password hashing.
- PostgreSQL stores users, courses, groups, group membership, individual and group course enrollment, assignments, assignment targets, and submission confirmations.

Implemented frontend workflows include:

- Student and admin login and registration flows.
- JWT persistence in `localStorage` and session restoration through `/api/auth/me`.
- Protected routes and role-based route redirects.
- Responsive student and admin navigation layouts.
- Student dashboard, course browsing and enrollment, groups, member management, assignments, status filters, OneDrive access, and two-step submission confirmation.
- Admin dashboard, course creation, course details, enrolled-student analytics, assignment analytics, assignment list, assignment creation, group targeting, group/member viewing, progress, submissions, and admin creation.
- Course assignments support both individual enrollment and group enrollment. Group-enrolled course assignments use one shared submission and can be confirmed only by the group leader.
- Zod validation for authentication, group creation, member addition, and assignment/admin forms.
- Loading, empty, retry, success, and user-friendly error states.

## Setup and Run

### Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL
- A PostgreSQL database configured for the backend

### Database Setup

1. Create a PostgreSQL database.
2. Copy the backend environment template:

```bash
cd backend
cp .env.example .env
```

3. Fill in the database values and a strong JWT secret in `backend/.env`.
4. Apply the schema:

```bash
psql -U <db-user> -d <db-name> -f src/config/schema.sql
```

The backend reads the following environment variables:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=joineazy
DB_USER=postgres
DB_PASSWORD=<password>
JWT_SECRET=<strong-secret>
```

### Start the Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on the port configured by `PORT`, normally:

```text
http://localhost:5000
```

A database health check is available at `GET /api/health`.

### Start the Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite normally starts at:

```text
http://localhost:5173
```

If that port is already in use, Vite selects the next available port. The current Axios client is configured for the backend API at `http://localhost:5000/api`.

### Production Build

```bash
cd frontend
npm run lint
npm run build
```

For the backend, use:

```bash
cd backend
npm start
```

## API Endpoint Details

The backend currently mounts course, group, and assignment routes with singular path names: `/api/course`, `/api/group`, and `/api/assignment`.

### Authentication

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a student using `name`, `email`, and `password`. |
| POST | `/api/auth/login` | Public | Authenticate and return a JWT plus user summary. |
| GET | `/api/auth/me` | Authenticated | Restore the authenticated user from the bearer token. |
| POST | `/api/auth/register/admin` | Admin | Create another admin using `name`, `email`, and `password`. |

### Groups

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/group` | Student | Create a group with `{ name }`. The creator is added automatically. |
| GET | `/api/group` | Student/Admin | Students receive their groups; admins receive all groups and member objects. |
| POST | `/api/group/:id/add` | Student group creator | Add a student using `{ email }`. |
| GET | `/api/group/:id/members` | Student member/Admin | Return group details and member objects. |

### Courses

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/course` | Authenticated | List courses and indicate individual enrollment for the current student. |
| POST | `/api/course` | Admin | Create a course using `{ name }`. |
| GET | `/api/course/:id` | Admin | Return course details, enrolled students, per-student submission counts, and per-assignment analytics. |
| POST | `/api/course/:id/enroll` | Student | Enroll the current student individually in a course. |
| POST | `/api/course/:id/enroll-group` | Student group leader | Enroll one of the leader's groups in a course using `{ groupId }`. |

### Assignments

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/assignment` | Admin | Create an assignment. |
| GET | `/api/assignment` | Student | Return assignments relevant to the authenticated student. |
| GET | `/api/assignment/admin` | Admin | Return assignments created by the authenticated admin. |
| GET | `/api/assignment/:id/status` | Student | Return `PENDING`, `SUBMITTED`, or `OVERDUE`, plus whether the student can submit and whether the submission is shared. |
| POST | `/api/assignment/:id/submit` | Student | Confirm a submission once. For group-enrolled course assignments, only the group leader can confirm and the submission applies to every group member. |
| GET | `/api/assignment/:id/progress` | Admin | Return aggregate total, submitted, pending, and percentage values. |
| GET | `/api/assignment/:id/submissions` | Admin | Return confirmed student submissions. |

Assignment creation uses the backend request shape:

```json
{
  "title": "React assignment",
  "description": "Build a small application",
  "dueDate": "2026-08-30T12:00:00.000Z",
  "onedriveUrl": "https://onedrive.live.com/...",
  "targetType": "ALL",
  "groupIds": []
}
```

For selected groups, use `targetType: "GROUP"` and send the selected numeric IDs in `groupIds`. For a course assignment, use `targetType: "COURSE"` and send the numeric `courseId`.

Authenticated requests use:

```http
Authorization: Bearer <jwt>
```

## Database Schema and Relationships

- `users` stores account identity, email, hashed password, role, and timestamps.
- `courses` stores course names, creators, and timestamps.
- `course_students` stores individual course enrollment.
- `course_groups` stores group course enrollment. Only a group's `leader_id` can enroll that group.
- `groups` stores a group name and its creator through `created_by`.
- `group_members` is a many-to-many join table between `groups` and `users` with a composite primary key.
- `assignments` stores title, description, due date, OneDrive URL, target type, and creator.
- `assignment_groups` connects assignments to multiple groups through a composite primary key.
- `submissions` connects a student to an assignment, records confirmation time, and enforces one submission per student per assignment with a unique constraint.

Relationship summary: admins create courses and assignments; students create groups and join them through `group_members`; students enroll individually through `course_students` or enroll their groups through `course_groups`; assignments target courses or groups; and students confirm assignment submissions through `submissions`.

Assignment status is calculated from the submission record and `due_date`:

- `SUBMITTED`: a submission confirmation exists.
- `OVERDUE`: no confirmation exists and the due date has passed.
- `PENDING`: no confirmation exists and the due date has not passed.

For assignments attached to a course, students enrolled directly can submit individually. Students participating through a course-enrolled group share one submission, and only that group's leader can confirm it. The assignment status endpoint exposes `canSubmit` and `shared` so the frontend can hide the confirmation action for other group members.

## Architecture and Data Flow

### Frontend Flow

1. React renders the application through `App.jsx` and React Router.
2. `AuthProvider` restores the user with `/api/auth/me` when a JWT exists.
3. `ProtectedRoute` requires authentication before rendering protected routes.
4. `RoleRoute` restricts student and admin route trees.
5. Layout components provide navigation and logout behavior.
6. Pages keep normal UI state locally and call small API functions from `src/api`.
7. Axios adds the JWT bearer header from `localStorage` to authenticated requests.
8. Tailwind CSS provides responsive styling and state presentation.

### Backend and Database Flow

1. The frontend sends JSON requests to the Express API.
2. CORS and JSON middleware process the request.
3. Authentication middleware verifies the JWT and sets `req.user`.
4. Role middleware enforces student/admin authorization.
5. Route handlers validate input and execute parameterized PostgreSQL queries.
6. PostgreSQL returns domain data to the route handler.
7. Express returns JSON responses to the frontend.

## Key Design and Deployment Decisions

- **JWT authentication:** JWTs are stored only in `localStorage`; passwords are never persisted by the frontend. Backend JWT verification remains the security boundary.
- **Role-based routing:** Frontend route guards improve user experience, but backend authorization is still required for every protected operation.
- **Simple state management:** Context is used only for authentication. Pages use local React state for forms, loading state, filters, and fetched data.
- **API separation:** Components call functions in `src/api` instead of using Axios directly throughout the UI.
- **Course enrollment:** Courses support individual student enrollment and group enrollment. The backend keeps these relationships separate so course analytics can count unique enrolled students.
- **OneDrive integration:** Assignment files remain external. The application stores and opens the supplied OneDrive URL and does not proxy or download files.
- **Assignment confirmation:** Submission is deliberately a two-step UI action to reduce accidental confirmations. The database unique constraint prevents duplicate submissions. Group-enrolled course assignments are shared and restricted to group leaders at the backend authorization boundary.
- **Course analytics:** Admin course details aggregate enrolled students, assignment counts, submitted counts, pending counts, and overall completion percentage.
- **Deadline validation:** Admin-created assignments must have a due date at least one hour in the future. The frontend provides immediate feedback and the backend validates the rule independently.
- **Responsive delivery:** Vite provides a lightweight frontend build, while Tailwind keeps the student and admin layouts responsive without adding a large UI framework.
- **Deployment shape:** Deploy the frontend as static assets behind a web server or CDN and deploy the Express backend as a separate Node.js service. Provide PostgreSQL through a managed database service, configure environment variables through the deployment platform, and enable HTTPS in production.
- **CORS and API URL:** Configure production CORS to allow only the deployed frontend origin and replace the development API URL with a deployment-specific environment variable before production release.
