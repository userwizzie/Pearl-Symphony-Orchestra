# PSO API

Requires Node.js 22.13 or newer. Copy `.env.example` to `.env`, then run `npm run api` and `npm run dev` in separate terminals. Vite proxies `/api` and `/uploads` to the API on port 3001. In production, build with `npm run build`, set `NODE_ENV=production`, then run `npm run api`; the API process serves `dist/` and uploaded files. Expose production traffic through HTTPS (the session cookie is Secure in production); set `HOST=0.0.0.0` only when the deployment needs external network access.

Provision the first administrator only once, with `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters set in the environment, then run `npm run admin:provision`. `ADMIN_NAME` optionally sets the initial account's display name (otherwise the email's local part is used). There is no public registration or default account. The SQLite database is stored at `DATABASE_PATH`; uploads are in `UPLOAD_DIR`.

### API

- `POST /api/auth/login` with `{ "email", "password" }`; returns `{ "user", "csrf" }` and sets an opaque HttpOnly, SameSite=Strict cookie.
- `GET /api/auth/session` returns `{ "user": { "id", "email", "name", "role" }, "csrf" }` or 401. Login returns the same user shape. Send the returned token as `X-CSRF-Token` on authenticated mutations, including logout.
- `POST /api/auth/logout`; requires `X-CSRF-Token`.
- `GET /api/admin/content/:module` returns `{ "records": [{ "id", "data", "updatedAt", "sortOrder", "archived" }] }` (active records by default; `?archived=true` lists archived records). `POST /api/admin/content/:module` and `PUT /api/admin/content/:module/:id` accept the record data object and return `{ "record": { "id", "data", "updatedAt", "sortOrder", "archived" } }`. `DELETE` archives the record and returns its updated record wrapper.
- `GET|POST /api/admin/inquiries` (and `PUT|DELETE /api/admin/inquiries/:id`) is the inquiries-module shortcut.
- Super-admin-only user administration: `GET /api/admin/users` returns `{ "users": [{ "id", "name", "email", "role", "createdAt" }] }`; `POST /api/admin/users` accepts `{ "name", "email", "password", "role" }` and returns `{ "user": ... }`; `PUT /api/admin/users/:id` returns `{ "user": ... }`; `DELETE /api/admin/users/:id` removes the account and returns `{ "user": ... }`. Roles are `super-admin`, `content-editor`, and `event-manager`. Passwords use scrypt and are never returned. A transaction ensures at least one super-admin remains; deleting your own account is blocked.
- `POST /api/public/inquiries` is public and accepts contact fields and additional booking fields.
- `POST /api/admin/uploads` accepts a raw JPEG, PNG, WebP, or PDF body with its matching `Content-Type`, `X-File-Name`, and a 10 MiB limit. It returns `{ "url": "/uploads/:random-name" }`.
- `GET /api/public/content/:module` returns active published records using the same record shape.

`super-admin` can manage all modules; `content-editor` can manage musicians, music, packages, and media; `event-manager` can manage events, packages, and inquiries. Login and public inquiry submissions are rate limited. Sessions and content are stored in SQLite.
