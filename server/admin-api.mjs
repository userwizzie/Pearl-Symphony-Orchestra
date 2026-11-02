import { createServer } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from 'node:crypto'
import { promisify } from 'node:util'
import { createReadStream, mkdirSync } from 'node:fs'
import { stat, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scrypt = promisify(scryptCallback)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '127.0.0.1'
const production = process.env.NODE_ENV === 'production'
const databasePath = path.resolve(root, process.env.DATABASE_PATH || 'data/pearl-symphony.sqlite')
const uploadDir = path.resolve(root, process.env.UPLOAD_DIR || 'storage/uploads')
const distDir = path.resolve(root, 'dist')
const sessionTtlMs = Math.max(1, Number(process.env.SESSION_TTL_HOURS || 8)) * 60 * 60 * 1000
const jsonLimit = 1024 * 1024
const uploadLimit = 10 * 1024 * 1024
const modules = new Set(['musicians', 'music', 'events', 'packages', 'media', 'inquiries'])
const roles = new Set(['super-admin', 'content-editor', 'event-manager'])
const permissions = {
  'super-admin': new Set([...modules]),
  'content-editor': new Set(['musicians', 'music', 'packages', 'media']),
  'event-manager': new Set(['events', 'packages', 'inquiries']),
}
const uploadTypes = new Map([
  ['image/jpeg', { ext: '.jpg', signature: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff }],
  ['image/png', { ext: '.png', signature: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }],
  ['image/webp', { ext: '.webp', signature: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' }],
  ['application/pdf', { ext: '.pdf', signature: (b) => b.length > 5 && b.toString('ascii', 0, 5) === '%PDF-' }],
])

mkdirSync(path.dirname(databasePath), { recursive: true })
mkdirSync(uploadDir, { recursive: true })
const db = new DatabaseSync(databasePath)
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super-admin', 'content-editor', 'event-manager')),
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    csrf_hash TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY,
    module TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1))
  );
  CREATE INDEX IF NOT EXISTS content_module_idx ON content(module, created_at);
  CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
`)

const userColumns = new Set(db.prepare('PRAGMA table_info(users)').all().map((column) => column.name))
if (!userColumns.has('name')) db.exec("ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT ''")
const contentColumns = new Set(db.prepare('PRAGMA table_info(content)').all().map((column) => column.name))
if (!contentColumns.has('sort_order')) db.exec('ALTER TABLE content ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0')
if (!contentColumns.has('archived')) db.exec('ALTER TABLE content ADD COLUMN archived INTEGER NOT NULL DEFAULT 0')

const statements = {
  getUser: db.prepare('SELECT id, email, name, password_hash, role FROM users WHERE email = ?'),
  getUserById: db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?'),
  addUser: db.prepare('INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
  countAdmins: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'super-admin'"),
  listUsers: db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at'),
  updateUser: db.prepare('UPDATE users SET email = ?, name = ?, password_hash = COALESCE(?, password_hash), role = ? WHERE id = ?'),
  deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
  addSession: db.prepare('INSERT INTO sessions (token_hash, csrf_hash, user_id, expires_at) VALUES (?, ?, ?, ?)'),
  getSession: db.prepare('SELECT s.csrf_hash, s.expires_at, u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  deleteExpired: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
  listContent: db.prepare('SELECT id, data, created_at, updated_at, sort_order, archived FROM content WHERE module = ? AND archived = ? ORDER BY sort_order, created_at DESC'),
  getContent: db.prepare('SELECT id, data, created_at, updated_at, sort_order, archived FROM content WHERE module = ? AND id = ?'),
  insertContent: db.prepare('INSERT INTO content (id, module, data, created_at, updated_at, sort_order, archived) VALUES (?, ?, ?, ?, ?, ?, 0)'),
  updateContent: db.prepare('UPDATE content SET data = ?, updated_at = ?, sort_order = ?, archived = ? WHERE module = ? AND id = ?'),
  archiveContent: db.prepare('UPDATE content SET archived = 1, updated_at = ? WHERE module = ? AND id = ? AND archived = 0'),
  listPublicContent: db.prepare('SELECT id, data, created_at, updated_at, sort_order, archived FROM content WHERE module = ? AND archived = 0 ORDER BY sort_order, created_at DESC'),
}

const limiters = new Map()
const nowIso = () => new Date().toISOString()
const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const safeEqual = (left, right) => {
  const a = Buffer.from(left || '')
  const b = Buffer.from(right || '')
  return a.length === b.length && timingSafeEqual(a, b)
}
const userJson = ({ id, email, name, role }) => ({ id, email, name: name || '', role })
const adminUserJson = ({ id, name, email, role, created_at }) => ({ id, name, email, role, createdAt: created_at })
const json = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    ...headers,
  })
  res.end(JSON.stringify(body))
}
const fail = (res, status, error, message) => json(res, status, { error, message })
const limited = (key, max, windowMs) => {
  const now = Date.now()
  let state = limiters.get(key)
  if (!state || now >= state.until) state = { count: 0, until: now + windowMs }
  state.count += 1
  limiters.set(key, state)
  if (limiters.size > 5000) {
    for (const [k, item] of limiters) if (now >= item.until) limiters.delete(k)
  }
  return state.count <= max
}
const parseCookies = (header = '') => Object.fromEntries(header.split(';').map((part) => {
  const i = part.indexOf('=')
  return i < 0 ? ['', ''] : [part.slice(0, i).trim(), part.slice(i + 1).trim()]
}))
const cookieHeaders = (value, maxAge) => ({
  'Set-Cookie': `pso_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${production ? '; Secure' : ''}`,
})
const clearCookieHeaders = () => ({
  'Set-Cookie': `pso_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${production ? '; Secure' : ''}`,
})

async function readBody(req, max = jsonLimit) {
  const declared = Number(req.headers['content-length'] || 0)
  if (declared > max) throw Object.assign(new Error('Request body is too large'), { status: 413 })
  const chunks = []
  let length = 0
  for await (const chunk of req) {
    length += chunk.length
    if (length > max) throw Object.assign(new Error('Request body is too large'), { status: 413 })
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function readJson(req) {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    throw Object.assign(new Error('Content-Type must be application/json'), { status: 415 })
  }
  const raw = await readBody(req)
  try {
    const body = JSON.parse(raw.toString('utf8'))
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
    return body
  } catch {
    throw Object.assign(new Error('A JSON object is required'), { status: 400 })
  }
}

function cleanObject(value, depth = 0) {
  if (depth > 4) throw Object.assign(new Error('Record is nested too deeply'), { status: 400 })
  if (Array.isArray(value)) {
    if (value.length > 100) throw Object.assign(new Error('Array is too large'), { status: 400 })
    return value.map((item) => cleanValue(item, depth + 1))
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length > 50) throw Object.assign(new Error('Record has too many fields'), { status: 400 })
    const result = {}
    for (const [key, item] of entries) {
      if (!/^[\w.-]{1,80}$/.test(key)) throw Object.assign(new Error('Invalid field name'), { status: 400 })
      result[key] = cleanValue(item, depth + 1)
    }
    return result
  }
  throw Object.assign(new Error('Record must be a JSON object'), { status: 400 })
}

function cleanValue(value, depth) {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    if (typeof value === 'number' && !Number.isFinite(value)) throw Object.assign(new Error('Invalid number'), { status: 400 })
    return value
  }
  if (typeof value === 'string') {
    if (value.length > 5000) throw Object.assign(new Error('Field is too long'), { status: 400 })
    return value
  }
  if (Array.isArray(value)) return cleanObject(value, depth)
  if (value && typeof value === 'object') return cleanObject(value, depth)
  throw Object.assign(new Error('Unsupported field value'), { status: 400 })
}

function emailValid(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function passwordHash(password) {
  const salt = randomBytes(16)
  const derived = await scrypt(password, salt, 64)
  return `scrypt$${salt.toString('hex')}$${Buffer.from(derived).toString('hex')}`
}

async function passwordMatches(password, stored) {
  const [scheme, saltHex, hashHex] = stored.split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const derived = Buffer.from(await scrypt(password, Buffer.from(saltHex, 'hex'), 64))
  return safeEqual(derived.toString('hex'), hashHex)
}

async function provisionAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const name = String(process.env.ADMIN_NAME || email.split('@')[0]).trim().slice(0, 160)
  const password = process.env.ADMIN_PASSWORD || ''
  if (!emailValid(email)) throw new Error('Set ADMIN_EMAIL to a valid email address.')
  if (!name) throw new Error('Set ADMIN_NAME or use an email with a non-empty local part.')
  if (password.length < 12 || password.length > 256) throw new Error('Set ADMIN_PASSWORD to 12–256 characters.')
  const hash = await passwordHash(password)
  db.exec('BEGIN IMMEDIATE')
  try {
    if (Number(statements.countAdmins.get().count) > 0) throw new Error('A super-admin already exists; provisioning is first-admin only.')
    statements.addUser.run(randomUUID(), email, name, hash, 'super-admin', nowIso())
    db.exec('COMMIT')
    console.log(`Created initial super-admin: ${email}`)
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function validateInquiry(input) {
  const data = cleanObject(input)
  const name = typeof data.name === 'string' ? data.name.trim() : ''
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  const topic = typeof data.topic === 'string' ? data.topic.trim() : ''
  const message = typeof data.message === 'string' ? data.message.trim() : ''
  if (name.length < 1 || name.length > 160 || !emailValid(email) || topic.length > 160 || message.length > 5000) {
    throw Object.assign(new Error('Provide a valid name, email, topic and message.'), { status: 400 })
  }
  const hasBookingDetails = Object.keys(data).some((key) =>
    !['name', 'email', 'topic', 'message', 'status'].includes(key) && data[key] !== null && data[key] !== '')
  if (!topic && !message && !hasBookingDetails) {
    throw Object.assign(new Error('A topic, message, or booking detail is required.'), { status: 400 })
  }
  const statusLabels = {
    new: 'New',
    'in progress': 'In Progress',
    'in-progress': 'In Progress',
    confirmed: 'Confirmed',
    responded: 'Confirmed',
    closed: 'Confirmed',
  }
  const status = statusLabels[String(data.status || 'new').trim().toLowerCase()]
  if (!status) {
    throw Object.assign(new Error('Invalid inquiry status.'), { status: 400 })
  }
  return { ...data, name, email, topic, message, status }
}

function getSession(req) {
  const token = parseCookies(req.headers.cookie).pso_session
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
  const session = statements.getSession.get(sha256(token))
  if (!session) return null
  if (session.expires_at <= Date.now()) {
    statements.deleteSession.run(sha256(token))
    return null
  }
  return { tokenHash: sha256(token), csrfHash: session.csrf_hash, user: { id: session.id, email: session.email, name: session.name || '', role: session.role } }
}

function requireCsrf(req, session) {
  const token = req.headers['x-csrf-token']
  return typeof token === 'string' && safeEqual(sha256(token), session.csrfHash)
}

function checkPermission(res, session, moduleName, write) {
  if (!session) {
    fail(res, 401, 'unauthorized', 'Authentication required.')
    return false
  }
  if (!modules.has(moduleName) || !permissions[session.user.role]?.has(moduleName)) {
    fail(res, 403, 'forbidden', 'You do not have permission to access this module.')
    return false
  }
  if (!roles.has(session.user.role) || (write && !permissions[session.user.role].has(moduleName))) {
    fail(res, 403, 'forbidden', 'You do not have permission to modify this module.')
    return false
  }
  return true
}

async function serveFile(res, filePath, contentType) {
  try {
    const info = await stat(filePath)
    if (!info.isFile()) return false
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': info.size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600',
    })
    createReadStream(filePath).pipe(res)
    return true
  } catch {
    return false
  }
}

async function staticResponse(req, res, pathname) {
  if (pathname.startsWith('/uploads/')) {
    const filename = path.basename(decodeURIComponent(pathname.slice('/uploads/'.length)))
    if (filename !== pathname.slice('/uploads/'.length) || !/^[a-f0-9-]+\.(jpg|png|webp|pdf)$/.test(filename)) return false
    const ext = path.extname(filename)
    const type = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
    return serveFile(res, path.join(uploadDir, filename), type)
  }
  if (!production || req.method !== 'GET' || pathname.startsWith('/api/')) return false
  const decoded = decodeURIComponent(pathname)
  const candidate = path.resolve(distDir, `.${decoded === '/' ? '/index.html' : decoded}`)
  if (!candidate.startsWith(`${distDir}${path.sep}`)) return false
  const types = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
    '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.woff': 'font/woff',
    '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8',
  }
  if (await serveFile(res, candidate, types[path.extname(candidate)] || 'application/octet-stream')) return true
  return serveFile(res, path.join(distDir, 'index.html'), 'text/html; charset=utf-8')
}

async function saveUpload(req, res) {
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
  const spec = uploadTypes.get(type)
  if (!spec) return fail(res, 415, 'unsupported_media_type', 'Only JPEG, PNG, WebP images and PDF files are accepted.')
  const originalName = req.headers['x-file-name']
  if (typeof originalName !== 'string' || originalName.length < 1 || originalName.length > 255) {
    return fail(res, 400, 'invalid_file_name', 'X-File-Name must contain the original filename.')
  }
  try {
    decodeURIComponent(originalName)
  } catch {
    return fail(res, 400, 'invalid_file_name', 'X-File-Name must be URL-encoded when it contains special characters.')
  }
  const data = await readBody(req, uploadLimit)
  if (!spec.signature(data)) return fail(res, 400, 'invalid_file', 'File content does not match the declared media type.')
  const filename = `${randomUUID()}${spec.ext}`
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), data, { flag: 'wx', mode: 0o600 })
  return json(res, 201, { url: `/uploads/${filename}` })
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = url.pathname
  if (req.method === 'OPTIONS') return json(res, 204, {})
  const session = getSession(req)

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const ip = req.socket.remoteAddress || 'unknown'
    if (!limited(`login:${ip}`, 15, 15 * 60 * 1000)) return fail(res, 429, 'rate_limited', 'Too many login attempts. Try again later.')
    const body = await readJson(req)
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const user = emailValid(email) ? statements.getUser.get(email) : null
    const matches = user && password.length <= 256 ? await passwordMatches(password, user.password_hash) : false
    if (!matches) return fail(res, 401, 'invalid_credentials', 'Email or password is incorrect.')
    const token = randomBytes(32).toString('hex')
    const csrf = randomBytes(32).toString('hex')
    statements.deleteExpired.run(Date.now())
    statements.addSession.run(sha256(token), sha256(csrf), user.id, Date.now() + sessionTtlMs)
    return json(res, 200, { user: userJson(user), csrf }, cookieHeaders(token, Math.floor(sessionTtlMs / 1000)))
  }

  if (req.method === 'GET' && pathname === '/api/auth/session') {
    if (!session) return fail(res, 401, 'unauthorized', 'Authentication required.')
    const csrf = randomBytes(32).toString('hex')
    db.prepare('UPDATE sessions SET csrf_hash = ? WHERE token_hash = ?').run(sha256(csrf), session.tokenHash)
    return json(res, 200, { user: userJson(session.user), csrf })
  }

  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    if (!session) return json(res, 200, { ok: true }, clearCookieHeaders())
    if (!requireCsrf(req, session)) return fail(res, 403, 'csrf_invalid', 'CSRF token is missing or invalid.')
    statements.deleteSession.run(session.tokenHash)
    return json(res, 200, { ok: true }, clearCookieHeaders())
  }

  if (req.method === 'POST' && pathname === '/api/public/inquiries') {
    if (!limited(`inquiry:${req.socket.remoteAddress || 'unknown'}`, 10, 60 * 60 * 1000)) return fail(res, 429, 'rate_limited', 'Too many inquiries. Try again later.')
    const data = { ...validateInquiry(await readJson(req)), status: 'New' }
    const id = randomUUID()
    const createdAt = nowIso()
    statements.insertContent.run(id, 'inquiries', JSON.stringify(data), createdAt, createdAt, 0)
    return json(res, 201, { id, created_at: createdAt })
  }

  const publicContent = pathname.match(/^\/api\/public\/content\/([^/]+)$/)
  if (req.method === 'GET' && publicContent) {
    const moduleName = decodeURIComponent(publicContent[1])
    if (!modules.has(moduleName) || moduleName === 'inquiries') return fail(res, 404, 'not_found', 'Content module not found.')
    return json(res, 200, { records: statements.listPublicContent.all(moduleName).map(serializeRecord) })
  }

  if (pathname === '/api/admin/uploads' && req.method === 'POST') {
    if (!session) return fail(res, 401, 'unauthorized', 'Authentication required.')
    if (!requireCsrf(req, session)) return fail(res, 403, 'csrf_invalid', 'CSRF token is missing or invalid.')
    if (!permissions[session.user.role]?.has('media')) return fail(res, 403, 'forbidden', 'You do not have permission to upload media.')
    return saveUpload(req, res)
  }

  const usersMatch = pathname.match(/^\/api\/admin\/users(?:\/([^/]+))?$/)
  if (usersMatch) {
    if (!session) return fail(res, 401, 'unauthorized', 'Authentication required.')
    if (session.user.role !== 'super-admin') return fail(res, 403, 'forbidden', 'Only super-admins can manage users.')
    const userId = usersMatch[1] ? decodeURIComponent(usersMatch[1]) : null
    if (req.method === 'GET' && !userId) {
      return json(res, 200, { users: statements.listUsers.all().map(adminUserJson) })
    }
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return fail(res, 405, 'method_not_allowed', 'Method not allowed.')
    if (!requireCsrf(req, session)) return fail(res, 403, 'csrf_invalid', 'CSRF token is missing or invalid.')
    if (req.method === 'POST' && !userId) {
      const body = await readJson(req)
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const password = typeof body.password === 'string' ? body.password : ''
      const role = body.role
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!emailValid(email) || password.length < 12 || password.length > 256 || !roles.has(role)) {
        return fail(res, 400, 'invalid_user', 'Provide a valid email, a 12–256 character password, and a supported role.')
      }
      if (!name || name.length > 160) return fail(res, 400, 'invalid_user', 'Provide a full name of at most 160 characters.')
      try {
        statements.addUser.run(randomUUID(), email, name, await passwordHash(password), role, nowIso())
      } catch {
        return fail(res, 409, 'email_in_use', 'An account with that email already exists.')
      }
      const created = statements.listUsers.all().find((user) => user.email === email)
      return json(res, 201, { user: adminUserJson(created) })
    }
    if (!userId) return fail(res, 404, 'not_found', 'User not found.')
    const current = statements.getUserById.get(userId)
    if (!current) return fail(res, 404, 'not_found', 'User not found.')
    if (req.method === 'PUT') {
      const body = await readJson(req)
      const email = body.email === undefined ? current.email : String(body.email).trim().toLowerCase()
      const name = body.name === undefined ? current.name : String(body.name).trim()
      const role = body.role === undefined ? current.role : body.role
      const password = body.password
      if (!emailValid(email) || !name || name.length > 160 || !roles.has(role) || (password !== undefined && (typeof password !== 'string' || password.length < 12 || password.length > 256))) {
        return fail(res, 400, 'invalid_user', 'Provide a valid email, password, and supported role.')
      }
      const passwordHashValue = password ? await passwordHash(password) : null
      db.exec('BEGIN IMMEDIATE')
      try {
        const latest = statements.getUserById.get(userId)
        if (!latest) {
          db.exec('ROLLBACK')
          return fail(res, 404, 'not_found', 'User not found.')
        }
        if (latest.role === 'super-admin' && role !== 'super-admin' && Number(statements.countAdmins.get().count) <= 1) {
          db.exec('ROLLBACK')
          return fail(res, 409, 'last_super_admin', 'At least one super-admin account must remain.')
        }
        statements.updateUser.run(email, name, passwordHashValue, role, userId)
        db.exec('COMMIT')
      } catch {
        db.exec('ROLLBACK')
        return fail(res, 409, 'email_in_use', 'An account with that email already exists.')
      }
      return json(res, 200, { user: adminUserJson(statements.getUserById.get(userId)) })
    }
    if (req.method !== 'DELETE') return fail(res, 405, 'method_not_allowed', 'Method not allowed.')
    if (userId === session.user.id) return fail(res, 409, 'cannot_delete_self', 'You cannot delete your own account.')
    db.exec('BEGIN IMMEDIATE')
    try {
      const latest = statements.getUserById.get(userId)
      if (!latest) {
        db.exec('ROLLBACK')
        return fail(res, 404, 'not_found', 'User not found.')
      }
      if (latest.role === 'super-admin' && Number(statements.countAdmins.get().count) <= 1) {
        db.exec('ROLLBACK')
        return fail(res, 409, 'last_super_admin', 'At least one super-admin account must remain.')
      }
      statements.deleteUser.run(userId)
      db.exec('COMMIT')
    } catch {
      db.exec('ROLLBACK')
      return fail(res, 500, 'internal_error', 'Unable to remove the user.')
    }
    return json(res, 200, { user: adminUserJson(current) })
  }

  const inquiriesAlias = pathname.match(/^\/api\/admin\/inquiries(?:\/([^/]+))?$/)
  if (inquiriesAlias) {
    const id = inquiriesAlias[1]
    const method = req.method
    if (!checkPermission(res, session, 'inquiries', method !== 'GET')) return
    if (method === 'GET' && !id) return json(res, 200, { records: statements.listContent.all('inquiries', url.searchParams.get('archived') === 'true' ? 1 : 0).map(serializeRecord) })
    if (method === 'POST' && !id) {
      if (!requireCsrf(req, session)) return fail(res, 403, 'csrf_invalid', 'CSRF token is missing or invalid.')
      const data = validateInquiry(await readJson(req))
      const newId = randomUUID()
      const createdAt = nowIso()
      statements.insertContent.run(newId, 'inquiries', JSON.stringify(data), createdAt, createdAt, 0)
      return json(res, 201, { record: serializeRecord(statements.getContent.get('inquiries', newId)) })
    }
    if (id && method === 'PUT') return updateRecord(req, res, session, 'inquiries', id)
    if (id && method === 'DELETE') return deleteRecord(req, res, session, 'inquiries', id)
    return fail(res, 405, 'method_not_allowed', 'Method not allowed.')
  }

  const contentMatch = pathname.match(/^\/api\/admin\/content\/([^/]+)(?:\/([^/]+))?$/)
  if (contentMatch) {
    const moduleName = decodeURIComponent(contentMatch[1])
    const id = contentMatch[2] ? decodeURIComponent(contentMatch[2]) : null
    const write = req.method !== 'GET'
    if (!checkPermission(res, session, moduleName, write)) return
    if (req.method === 'GET' && !id) return json(res, 200, { records: statements.listContent.all(moduleName, url.searchParams.get('archived') === 'true' ? 1 : 0).map(serializeRecord) })
    if (req.method === 'POST' && !id) {
      if (!requireCsrf(req, session)) return fail(res, 403, 'csrf_invalid', 'CSRF token is missing or invalid.')
      const data = cleanObject(await readJson(req))
      const newId = randomUUID()
      const createdAt = nowIso()
      const sortOrder = validSortOrder(data.sortOrder)
      delete data.sortOrder
      delete data.archived
      statements.insertContent.run(newId, moduleName, JSON.stringify(data), createdAt, createdAt, sortOrder)
      return json(res, 201, { record: serializeRecord(statements.getContent.get(moduleName, newId)) })
    }
    if (id && req.method === 'PUT') return updateRecord(req, res, session, moduleName, id)
    if (id && req.method === 'DELETE') return deleteRecord(req, res, session, moduleName, id)
    return fail(res, 405, 'method_not_allowed', 'Method not allowed.')
  }

  if (await staticResponse(req, res, pathname)) return
  if (pathname.startsWith('/api/')) return fail(res, 404, 'not_found', 'API route not found.')
  return fail(res, 404, 'not_found', 'Not found.')
}

function serializeRecord(row) {
  if (!row) return null
  return {
    id: row.id,
    data: JSON.parse(row.data),
    updatedAt: row.updated_at,
    sortOrder: row.sort_order,
    archived: Boolean(row.archived),
  }
}

function validSortOrder(value, fallback = 0) {
  if (value === undefined) return fallback
  if (!Number.isSafeInteger(value) || Math.abs(value) > 1_000_000_000) {
    throw Object.assign(new Error('sortOrder must be a whole number.'), { status: 400 })
  }
  return value
}

async function updateRecord(req, res, session, moduleName, id) {
  if (!requireCsrf(req, session)) return fail(res, 403, 'csrf_invalid', 'CSRF token is missing or invalid.')
  const existing = statements.getContent.get(moduleName, id)
  if (!existing) return fail(res, 404, 'not_found', 'Record not found.')
  const body = cleanObject(await readJson(req))
  const sortOrder = validSortOrder(body.sortOrder, existing.sort_order)
  const archived = body.archived === undefined ? existing.archived : body.archived === true ? 1 : body.archived === false ? 0 : null
  if (archived === null) return fail(res, 400, 'invalid_record', 'archived must be a boolean.')
  delete body.sortOrder
  delete body.archived
  const data = moduleName === 'inquiries' ? validateInquiry(body) : body
  const result = statements.updateContent.run(JSON.stringify(data), nowIso(), sortOrder, archived, moduleName, id)
  if (!result.changes) return fail(res, 404, 'not_found', 'Record not found.')
  return json(res, 200, { record: serializeRecord(statements.getContent.get(moduleName, id)) })
}

function deleteRecord(req, res, session, moduleName, id) {
  if (!requireCsrf(req, session)) return fail(res, 403, 'csrf_invalid', 'CSRF token is missing or invalid.')
  const result = statements.archiveContent.run(nowIso(), moduleName, id)
  if (!result.changes) return fail(res, 404, 'not_found', 'Record not found.')
  return json(res, 200, { record: serializeRecord(statements.getContent.get(moduleName, id)) })
}

const server = createServer(async (req, res) => {
  try {
    await handle(req, res)
  } catch (error) {
    if (res.headersSent) {
      res.destroy()
      return
    }
    fail(res, error.status || 500, error.status ? 'bad_request' : 'internal_error', error.status ? error.message : 'An unexpected error occurred.')
  }
})

if (process.argv.includes('--provision-admin')) {
  provisionAdmin()
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
    .finally(() => db.close())
} else {
  server.listen(port, host, () => {
    console.log(`PSO API listening on http://${host}:${port}${production ? ' (production)' : ''}`)
  })
  const close = () => {
    server.close(() => db.close())
  }
  process.on('SIGINT', close)
  process.on('SIGTERM', close)
}
