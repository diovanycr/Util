# CLAUDE.md — Respostas Automáticas

## Project Overview

**Respostas Automáticas** is a client-side web application for managing automatic message responses. It provides role-based access (admin/user), message CRUD with drag-and-drop reordering, import/export, and a soft-delete trash system. The UI is in **Portuguese (pt-BR)**.

## Tech Stack

- **Language:** Vanilla JavaScript (ES6 modules)
- **Markup/Styling:** HTML5, CSS3 with CSS custom properties
- **Backend:** None — fully client-side, Firebase handles data and auth
- **Database:** Cloud Firestore (NoSQL)
- **Authentication:** Firebase Authentication (email/password)
- **CDN Dependencies:**
  - Firebase SDK v10.12.2
  - Font Awesome 6.5.1
  - Google Fonts (Inter)

There is **no build step**, no bundler, no package.json, no Node.js. Files are served as static assets directly.

## File Structure

```
resposta2/
├── index.html        # Single-page HTML shell (login, admin, user, modals)
├── style.css         # All styles, CSS variables, responsive breakpoints
└── js/
    ├── app.js        # Entry point — initializes modules on DOMContentLoaded
    ├── firebase.js   # Firebase config, exports app/auth/db/secondaryAuth/el()
    ├── auth.js       # Login flow, session monitor (onAuthStateChanged), logout
    ├── admin.js      # Admin: create user, list users, block/unblock, reset password, delete
    ├── messages.js   # User: message CRUD, drag-and-drop, import/export, trash
    ├── modal.js      # Alert modal + confirmation modal with callbacks
    └── user.js       # Helper: isAdmin(user) check
```

## Architecture

### Module Dependency Graph

```
app.js
 ├── auth.js      → firebase.js, modal.js, admin.js, messages.js
 ├── admin.js     → firebase.js, modal.js
 └── modal.js     → firebase.js
```

- `app.js` is the entry point, loaded as `<script type="module">`.
- All modules import from Firebase CDN URLs directly (no npm/local packages).
- `firebase.js` exports shared instances: `app`, `auth`, `db`, `secondaryAuth`, and the `el()` DOM helper.
- A secondary Firebase app instance (`secondaryAuth`) is used for admin user creation to avoid signing out the current admin.

### Firestore Data Model

**`users` collection:**
```
{uid}/
  username: string (lowercase)
  email: string (lowercase)
  role: "admin" | "user"
  blocked: boolean
  createdAt: ISO string
```

**`users/{uid}/messages` subcollection:**
```
{messageId}/
  text: string
  order: number
  deleted: boolean       # soft-delete flag
  createdAt: number      # Date.now() timestamp
  updatedAt: number      # optional, set on import restore
```

### Authentication Flow

1. User enters username (not email) on the login screen.
2. `auth.js` looks up the email from Firestore `users` collection by matching `username`.
3. Firebase `signInWithEmailAndPassword` authenticates with the resolved email.
4. `onAuthStateChanged` checks `blocked` flag — blocked users are immediately signed out.
5. Based on `role`, either the admin panel or user panel is shown.

## Code Conventions

### Naming

| Context | Convention | Examples |
|---------|-----------|----------|
| Variables/Functions | camelCase | `currentUserId`, `loadMessages()` |
| HTML element IDs | camelCase with prefix | `btnLogin`, `msgList`, `newMsgBox` |
| CSS classes | kebab-case | `user-row`, `btn-primary`, `modal-overlay` |
| CSS variables | kebab-case | `--primary`, `--bg`, `--danger` |
| Button IDs | `btn[Name]` | `btnLogin`, `btnExport`, `btnTrashToggle` |
| Input IDs (create forms) | `new[Field]` | `newUser`, `newEmail`, `newPass` |
| List containers | `[entity]List` | `userList`, `msgList`, `trashList` |

### DOM Access

All `getElementById` calls use the shared helper:
```js
import { el } from './firebase.js';
el('btnLogin')  // equivalent to document.getElementById('btnLogin')
```

### Visibility Toggling

Elements are shown/hidden using the `.hidden` CSS class (`display: none !important`) and sometimes direct `style.display` assignment for reliability.

### Error Handling Pattern

```js
try {
    // Firebase operation
} catch (error) {
    console.error("Descriptive context:", error);
    showModal("User-friendly message in Portuguese");
}
```

### User Feedback

- **Modals** (`showModal`): For errors and informational alerts.
- **Confirm modals** (`openConfirmModal`): For destructive actions; accepts both confirm and cancel callbacks.
- **Toasts** (`showToast`): For transient success feedback (auto-dismiss after 2s).

### Soft Delete

Messages use `deleted: boolean` rather than being removed from Firestore. The trash view shows `deleted: true` items. "Empty trash" performs the actual `deleteDoc` calls.

## Development

### Running Locally

Serve the project root with any static HTTP server. ES modules require a server (not `file://`):

```bash
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .
```

Then open `http://localhost:8000`.

### No Build / No Tests / No Linting

This project has no build step, test suite, or linter configured. Changes take effect immediately on page reload.

### Firebase Configuration

Firebase credentials are hardcoded in `js/firebase.js`. This is standard for client-side Firebase apps — security is enforced via Firestore Security Rules in the Firebase Console, not by hiding the config.

## Key Behaviors to Preserve

- **Username-based login:** Users log in with usernames, not emails. The email lookup is done in Firestore.
- **Secondary auth for admin user creation:** `secondaryAuth` prevents the admin from being logged out when creating new users.
- **Drag-and-drop ordering:** Messages have an `order` field that gets persisted to Firestore after each reorder.
- **Import deduplication:** When importing a `.txt` file, existing messages are detected and the user is prompted about duplicates.
- **Responsive layout:** The grid switches to single-column at 768px. The trash toggle button is fixed at the bottom of the viewport.

## Common Modification Patterns

- **Adding a new page section:** Add HTML in `index.html` (hidden by default), toggle visibility in `auth.js` based on role.
- **Adding a new Firestore operation:** Import Firestore functions from the CDN URL in the relevant module, use `db` from `firebase.js`.
- **Adding a new UI action:** Attach event listener in the module's `init*` function, use `el()` for DOM access.
- **Adding a new modal flow:** Use `showModal()` for alerts or `openConfirmModal(onConfirm, onCancel)` for confirmations.
