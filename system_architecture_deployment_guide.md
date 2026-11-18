# System Architecture, Security, & Deployment Guide

This document provides a technical breakdown of the system architecture, security workflows, and deployment procedures for the Event Registration & Check-in System.

---

## 🏗️ System Architecture & Data Flow

### Architecture Overview
The application follows a classic **Three-Tier Architecture**:
1. **Presentation Layer (Frontend):** React SPA utilizing client-side routing, state management, and asynchronous HTTP calls via Axios.
2. **Application Layer (Backend):** Node.js / Express.js REST API providing business logic, authentication middleware, audit logging, and document generation (CSV/PDF).
3. **Data Layer (Database):** SQLite embedded database handling user accounts, event creation, and guest registration records.

```
[ React Frontend ] 
       │
       ▼ (HTTP / JSON / Bearer JWT)
[ Express API Server ] ──▶ [ Winston Logger ] ──▶ `logs/security.log`
       │
       ├──▶ [ SQLite Database ] ──▶ `database.sqlite`
       ├──▶ [ Fast-CSV Engine ] ──▶ CSV Downloads
       └──▶ [ PDFKit Engine ]   ──▶ PDF Downloads
```

---

## 🔒 Security Specifications

* **Authentication:** JWT (JSON Web Tokens) with 2-hour expiration. Passed via standard `Authorization: Bearer <token>` HTTP headers.
* **Password Security:** Salted and hashed using `bcryptjs` with 10 salt rounds prior to storage.
* **Role-Based Access Control (RBAC):** Express middleware validates token permissions (`user` vs `admin`) on protected endpoints.
* **Audit Logging:** System security events (login attempts, guest check-ins, user creations, report downloads) are logged via Winston to `logs/security.log`.

---

## 🚀 Deployment Instructions

### Option 1: Render / Railway Deployment (Cloud Platform)

#### Backend Deployment:
1. Create a new **Web Service** on Render or Railway connected to your GitHub repository.
2. Set the Root Directory to `backend`.
3. Set the Build Command: `npm install`
4. Set the Start Command: `node server.js`
5. Configure Environment Variables:
   * `PORT`: `5000`
   * `SECRET_KEY`: `[Your-Production-Super-Secret-Key]`

#### Frontend Deployment (Vercel or Netlify):
1. Connect your repository to Vercel/Netlify and point to the `frontend` directory.
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Configure environment variable `VITE_API_BASE_URL` pointing to your deployed backend URL (e.g., `https://your-backend.onrender.com/api`).

---

## 🧪 QA & Pre-Presentation Testing Protocol

Perform this sequence prior to presenting the portfolio project:

1. **Auth Verification:** Attempt login with incorrect credentials -> Verify 401 response and Winston log entry.
2. **Admin Operations:** Create a new event and a new user account as `admin` -> Verify database entry.
3. **Guest Workflow:** Register a guest email -> Confirm generation of unique ID (`GUEST-XXXXXX`).
4. **Check-In Verification:** Execute check-in using guest email and ID -> Verify status update to `checked_in = 1`. Block duplicate check-in attempts.
5. **Report Exports:** Download CSV and PDF reports -> Inspect file contents and verify system totals match database state.
6. **Swagger Documentation:** Access `/api-docs` -> Execute test request via "Try it out".