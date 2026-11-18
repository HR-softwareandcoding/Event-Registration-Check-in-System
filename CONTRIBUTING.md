# Git Commit Standards & Contribution Guide

This project adheres to the **Conventional Commits** specification to maintain a clear, readable, and standardized version control history across the Event Registration & Check-in System repository.

---

## 📋 Commit Message Format

Every commit message must follow this structure:

```text
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Rules
* Use the **imperative, present tense** (e.g., `"add"` instead of `"added"` or `"adds"`).
* Do not capitalize the first letter of the description.
* Do not end the short description with a period (`.`).
* Keep the subject line under **72 characters**.

---

## 🏷️ Allowed Commit Types

| Type | Purpose | Example |
| :--- | :--- | :--- |
| **`feat`** | A new feature or functional module | `feat(reports): add monthly PDF export endpoint` |
| **`fix`** | A bug fix or route correction | `fix(auth): update login route to /api/auth/login` |
| **`docs`** | Documentation updates (README, Swagger, guides) | `docs(swagger): add JSDoc annotations for event routes` |
| **`style`** | Formatting, missing semicolons, or UI CSS tweaks (no logic change) | `style(dashboard): align report download buttons` |
| **`refactor`** | Code restructuring without changing external behavior | `refactor(server): extract JWT verification into middleware` |
| **`test`** | Adding or updating QA / end-to-end test scripts | `test(checkin): verify duplicate guest ID rejection` |
| **`chore`** | Maintenance tasks, dependency updates, or `.gitignore` changes | `chore(deps): install swagger-ui-express and fast-csv` |

---

## 🎯 Project Scopes

Using a scope helps identify which part of the full-stack application was modified:

* **`auth`** — Login, JWT generation, password hashing, RBAC middleware
* **`events`** — Event creation, listing, and management
* **`checkin`** — Guest registration, unique `GUEST-XXXXXX` ID generation, verification
* **`reports`** — Daily CSV exports and monthly PDF report generation
* **`swagger`** — OpenAPI specifications and `/api-docs` UI configuration
* **`frontend`** — React components, forms, client-side validation, Axios interceptors
* **`deps`** — `package.json` and dependency installations

---

## 🌿 Branch Naming Conventions

When working on new features or bug fixes, create descriptive branches from `main`:

* **Features:** `feat/<short-description>` (e.g., `feat/pdf-reporting`)
* **Bug Fixes:** `fix/<short-description>` (e.g., `fix/login-route-404`)
* **Documentation:** `docs/<short-description>` (e.g., `docs/api-swagger-setup`)

---

## ✅ Pre-Commit Checklist

Before pushing commits to the repository, verify the following:

1. **No Sensitive Data:** Ensure `.env`, `database.sqlite`, and `logs/` are excluded via `.gitignore`.
2. **Clean Code:** Remove temporary `console.log()` debugging statements.
3. **Client-Side Validation:** Verify form inputs handle empty or invalid entries gracefully.
4. **Atomic Commits:** Group related changes into single, logical commits rather than one massive commit.