# Campus Connect System

A MERN stack web application for campus communities, featuring four main sections: **Clubs & Sports**, **Resource Sharing**, **Consulting**, and **Events & Chill Sessions**.

## Project Structure

```
campus-connect-system/
├── frontend/          # React + Vite
├── backend/           # Node.js + Express + MongoDB
├── README.md
└── .gitignore
```

## User Roles

| Role                  | Section                   | Access                          |
|-----------------------|---------------------------|---------------------------------|
| **Student**           | All sections              | User-side (browse, participate) |
| **Coach**             | Clubs & Sports            | Admin dashboard                 |
| **Resource Coordinator** | Resource Sharing       | Admin dashboard                 |
| **Consultant**        | Consulting                | Admin dashboard                 |
| **Event Coordinator** | Events & Chill Sessions   | Admin dashboard                 |
| **Super Admin**       | All sections              | Approve sign-ups, full access   |

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup

### Backend

1. Navigate to the backend folder:
   ```bash
   cd campus-connect-system/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` with:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://user:12345@cluster0.dhjrlsc.mongodb.net/campus-connect?retryWrites=true&w=majority
   JWT_SECRET=your-secret-key
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend

1. Navigate to the frontend folder:
   ```bash
   cd campus-connect-system/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` with:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

The app will run at `http://localhost:5173`.

## API Endpoints

- `POST /api/auth/signup` – Register new user
- `POST /api/auth/login` – Login
- `GET /api/auth/me` – Get current user (protected)
- `GET /api/approvals/pending` – List pending users (super admin only)
- `PATCH /api/approvals/:id/approve` – Approve user
- `DELETE /api/approvals/:id/reject` – Reject user
- `GET/POST /api/clubs-sports` – Clubs & sports
- `GET/POST /api/resources` – Resources
- `GET/POST /api/consulting` – Consulting sessions
- `GET/POST /api/events` – Events

## License

MIT
