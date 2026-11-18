# Event Registration & Check-in System

A secure, full-stack web application designed for managing events, streamlining guest registrations, handling secure barcode/ID check-ins, and generating automated administrative reports. Built as a developer portfolio project.

---

## 🛠️ Tech Stack

### Frontend
* **React** (Single-Page Application)
* **React Router** (Client-side routing)
* **Axios** (HTTP client with JWT request interceptors)

### Backend
* **Node.js & Express.js** (REST API Server)
* **SQLite3** (Lightweight relational database)
* **JSON Web Tokens (JWT)** & **Bcrypt.js** (Authentication & password hashing)
* **Winston** (Structured security and audit logging)
* **Fast-CSV & PDFKit** (Automated report generation)
* **Swagger UI / swagger-jsdoc** (Interactive API documentation)

---

## 🚀 Key Features

* **Role-Based Access Control (RBAC):** Secure separation of privileges for Administrators and Check-in Staff.
* **Automated Audit Logging:** System actions and authentication events are logged securely via Winston.
* **Guest Registration & Verification:** Generates unique cryptographic guest IDs (`GUEST-XXXXXX`) for secure entry verification.
* **Reporting Engine:** One-click download of daily attendance CSV spreadsheets and monthly PDF executive summaries.
* **Interactive API Docs:** Fully documented REST endpoints via Swagger UI (`/api-docs`).

---

## 📂 Project Structure

```text
event-management-system/
│
├── backend/
│   ├── logs/               # Winston audit log files
│   ├── database.sqlite     # SQLite relational database
│   └── server.js           # Express server, routes, and Swagger setup
│
└── frontend/
    ├── src/
    │   ├── api.js          # Axios configuration & interceptors
    │   ├── pages/          # Admin & Check-in dashboards
    │   └── App.jsx         # Main router setup
    └── package.json