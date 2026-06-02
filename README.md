# CCS Archive

A lightweight project-archive portal for **Gordon College – College of Computer Studies (CCS)**.
Students upload their software-engineering projects; admins review them in a gradebook and approve/reject submissions.

The app is **100% front-end** (HTML, CSS, vanilla JavaScript) — no server, build step, or external services required.

## Features

- **Student flow** — log in, upload projects, browse/search your archive, download/rename/delete submissions, see review status.
- **Admin flow** — overview dashboard with submission stats and a gradebook to approve/reject each project.
- **Local persistence** — project metadata in `localStorage`, file contents in **IndexedDB** (so large files don't blow the `localStorage` quota).
- **Local auth + sessions** — domain-restricted login (`@gordoncollege.edu.ph`) with role-based access (student vs. admin) stored in `sessionStorage`. Protected pages redirect to login when no session exists.
- Toast notifications, status badges, file validation (type-aware icons, 25 MB limit), and one-click demo data for testing.

> **Note:** This is a local/offline demo. Authentication accepts any password for a valid college email — it is **not** secure and is intended for coursework/prototyping only.

## Project structure

```
.
├── login.html          # Student login
├── admin-login.html    # Admin login
├── dashboard.html      # Student dashboard (my projects + search)
├── archive.html        # Student archive (download / rename / delete)
├── upload.html         # Student upload form
├── admin.html          # Admin overview (stats + recent submissions)
├── gradebook.html      # Admin gradebook (approve / reject)
├── SE.js               # All application logic
├── style.css           # Styles
└── LOGO.png            # App logo (header + browser tab favicon)
```

## Running locally

Because the app uses ES features and IndexedDB, serve it over HTTP rather than opening files directly.

```bash
# Python 3
python -m http.server 8080

# or Node
npx serve .
```

Then open <http://localhost:8080/login.html>.

## Usage

1. **Student** — at `login.html`: 9-digit ID (e.g. `202211535` or `202211535@gordoncollege.edu.ph`), password = last 5 digits (e.g. `11535`).
2. **Admin** — at `admin-login.html`: username `lastname.firstname` (e.g. `armada.arnie` or `armada.arnie@gordoncollege.edu.ph`), password = same name (e.g. `armada.arnie`).
3. **Upload** a project from the Upload page, or click **Load demo data** on an empty list to populate samples.
4. As an **admin**, open the **Gradebook** to set each project's decision (Pending / Approved / Rejected). Students see the updated status on their dashboard.

## Data & reset

All data lives in your browser. To clear it, open DevTools → Application → clear **Local Storage** (`ccs_archive_projects`), **Session Storage** (`ccs_session`), and **IndexedDB** (`ccs_archive_db`).
