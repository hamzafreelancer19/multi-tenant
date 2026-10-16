# Classora mobile (Expo)

React Native app for the Classora school SaaS. It talks to the **same Django REST API** as `frontend/` — JWT login, `X-Tenant-Domain`, and the real school/teacher/parent endpoints. This is not a mock-only demo.

## Folder

`D:\multi-tenant-main\mobile`

## Run

1. Start the Django backend (`D:\multi-tenant-main\backend`) so `http://127.0.0.1:8000/api` is up.
2. From this folder:

```bash
npm start
```

or `npx expo start`. Then open Expo Go on a device, or press `a` for Android emulator / `i` for iOS simulator.

`npm start` is `expo start`.

### Node PATH (Windows)

If `npm` is not found:

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
```

## API base URL

The client reads `expo.extra.apiUrl` in `app.json`, then `EXPO_PUBLIC_API_URL`, then defaults:

| Client | Default API |
| --- | --- |
| Android emulator | `http://10.0.2.2:8000/api` |
| iOS simulator | `http://127.0.0.1:8000/api` |
| Physical device | **Use your PC LAN IP**, e.g. `http://192.168.1.12:8000/api` |

Set it in `app.json`:

```json
"extra": {
  "apiUrl": "http://192.168.1.12:8000/api",
  "tenantDomain": "localhost"
}
```

Android also needs cleartext HTTP allowed (already set in `app.json`).

## Tenant header

Every request sends `X-Tenant-Domain` (same as the website). You do **not** enter a tenant on the login screen.

1. Sign-in uses the platform host (`extra.tenantDomain` / `localhost`).
2. The token response includes `school_domain` + `school_name` for that user.
3. The app stores them in AsyncStorage and sends the school domain on all later API calls.

Superadmins can still switch schools from the Schools screen (`Use tenant …`).

## Auth

- `POST /api/token/` with `{ username, password }`
- Profile: `GET /api/me/`
- Refresh: `POST /api/token/refresh/` on HTTP 401
- Session in AsyncStorage: `token`, `refreshToken`, `user`, `schoolDomain`

### Test accounts (seeded local backend)

| Username | Password | Role |
| --- | --- | --- |
| `hamza` | `hamza123` | superadmin |
| `teacher` | `teacherpassword` | teacher |
| `accountant` | `accountantpassword` | accountant |

School **admin** / **parent** / **student** users are created per school. Role values match `users.role`: `superadmin`, `admin`, `teacher`, `accountant`, `parent`, `student`.

## Screens by role

### School admin (`admin`)

Tabs: Home, Students, Attendance (teacher register), Fees, More.

More: Teachers (incl. portal login), Classes, Admissions, Exams, Homework, Timetable, Notices, Library, Staff, Inventory (+ stock logs), Transport, Chat, Subscription, School settings, Profile.

### Teacher

Tabs: Home (classes + cover board assign/clear), Attendance, Homework, More.

More: Students, Exams/marks, Timetable, Notices, Class admissions, Chat, Profile.

### Parent

Tabs: Home, Attendance, Fees, Homework, More — via `/api/students/my-child/`.

### Student

Tabs: Home, Fees, Homework, Exams, More (Notices, Timetable, Library, Chat). Read-only where APIs allow; no admin CRUD.

### Accountant

Tabs: Home, Fees (CRUD), More (notices, chat, profile).

### Superadmin

Tabs: Home, Schools, Plans, More (School admins, Platform settings, Profile).

## Gaps vs the full website

- No public school landing, signup, Google login, or domain handoff.
- No AI assistant, certificate/ID PDF generator, or landing-page CMS.
- Chat is text-only (no file upload / emoji picker).
- Database explorer / deep security tools stay on the web admin.
- Plan-locked nav (Basic/Business/Pro) is not enforced in the app; the API still enforces permissions.

## Project layout

```
mobile/
  App.js
  src/api/          # axios client + endpoints (mirrors frontend/src/api)
  src/auth/         # session + login
  src/screens/      # role portals
  src/navigation/   # role tabs + stack
```
