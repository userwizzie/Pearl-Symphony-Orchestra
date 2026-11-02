import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, AudioLines, CalendarDays,
  Check, ChevronDown, CircleUserRound, Eye, FileImage, LayoutDashboard, LogOut,
  Menu, Music2, Plus, Search, Settings2, ShieldCheck, Trash2, Users, X,
} from 'lucide-react'
import './admin.css'

const moduleDefinitions = {
  musicians: {
    title: 'Musicians & Leadership', singular: 'musician', icon: Users,
    description: 'Manage orchestra members, leadership profiles and section assignments.',
    roles: ['Super Admin', 'Content Editor'],
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'role', label: 'Instrument / role', required: true },
      { key: 'section', label: 'Section', type: 'select', options: ['Strings', 'Woodwinds', 'Brass', 'Percussion', 'Traditional Fusion', 'Leadership'], required: true },
      { key: 'bio', label: 'Biography', type: 'textarea', wide: true },
      { key: 'headshotUrl', label: 'Headshot URL', type: 'image' },
      { key: 'socialLinks', label: 'Social links (one URL per line)', type: 'textarea' },
    ],
  },
  music: {
    title: 'Music & Releases', singular: 'release', icon: Music2,
    description: 'Update the catalogue, single releases and streaming destinations.',
    roles: ['Super Admin', 'Content Editor'],
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'releaseDate', label: 'Release date', type: 'date' },
      { key: 'category', label: 'Category', type: 'select', options: ['Signature Renditions', 'Anthems', 'Gospel', 'African Folk Arrangements'], required: true },
      { key: 'artworkUrl', label: 'Cover artwork URL', type: 'image' },
      { key: 'spotifyUrl', label: 'Spotify embed / link', type: 'url' },
      { key: 'appleMusicUrl', label: 'Apple Music link', type: 'url' },
      { key: 'youtubeUrl', label: 'YouTube link', type: 'url' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true },
    ],
  },
  events: {
    title: 'Events & Schedule', singular: 'event', icon: CalendarDays,
    description: 'Publish performances, collaborations, venues and ticket details.',
    roles: ['Super Admin', 'Event Manager'],
    fields: [
      { key: 'eventName', label: 'Event name', required: true },
      { key: 'venue', label: 'Venue', required: true },
      { key: 'dateTime', label: 'Date & time', type: 'datetime-local' },
      { key: 'ticketUrl', label: 'Ticket / RSVP link', type: 'url' },
      { key: 'bannerImage', label: 'Banner image URL', type: 'image' },
      { key: 'status', label: 'Event status', type: 'select', options: ['Upcoming', 'Sold Out', 'Past'], required: true },
      { key: 'description', label: 'Description', type: 'textarea', wide: true },
    ],
  },
  packages: {
    title: 'Packages & Pricing', singular: 'package', icon: AudioLines,
    description: 'Shape ensemble packages and quotation guidance for clients.',
    roles: ['Super Admin', 'Content Editor', 'Event Manager'],
    fields: [
      { key: 'packageName', label: 'Package name', required: true },
      { key: 'ensembleBreakdown', label: 'Ensemble breakdown', type: 'textarea', wide: true },
      { key: 'videoMediaEmbeds', label: 'Video / media embed URL', type: 'url' },
      { key: 'idealVenues', label: 'Ideal venues', type: 'textarea' },
      { key: 'pricingNotes', label: 'Pricing / quotation notes', type: 'textarea', wide: true },
    ],
  },
  media: {
    title: 'Media & Gallery', singular: 'media item', icon: FileImage,
    description: 'Organize performance video, gallery photos, press links and EPK assets.',
    roles: ['Super Admin', 'Content Editor'],
    fields: [
      { key: 'title', label: 'Title', required: true },
      { key: 'type', label: 'Media type', type: 'select', options: ['Photo', 'Video', 'Press coverage', 'EPK asset'], required: true },
      { key: 'mediaUrl', label: 'Media / asset URL', type: 'url', required: true },
      { key: 'thumbnailUrl', label: 'Thumbnail URL', type: 'image' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true },
    ],
  },
  inquiries: {
    title: 'Booking Inquiries', singular: 'inquiry', icon: MailIcon,
    description: 'Review booking requests and contact messages sent to the orchestra.',
    roles: ['Super Admin', 'Event Manager'],
    readOnly: true,
    fields: [
      { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' }, { key: 'topic', label: 'Inquiry type' },
      { key: 'organisation', label: 'Organisation' }, { key: 'eventType', label: 'Event type' },
      { key: 'date', label: 'Event date' }, { key: 'startTime', label: 'Start time' },
      { key: 'endTime', label: 'End time' }, { key: 'venue', label: 'Venue' },
      { key: 'location', label: 'Location' }, { key: 'audienceSize', label: 'Audience size' },
      { key: 'orchestraSize', label: 'Requested orchestra size' },
      { key: 'technicalRequirements', label: 'Technical requirements' }, { key: 'budgetRange', label: 'Budget range' },
      { key: 'message', label: 'Message', type: 'textarea', wide: true },
      { key: 'status', label: 'Status', type: 'select', options: ['New', 'In Progress', 'Confirmed'] },
    ],
  },
  staff: {
    title: 'Staff & Access', singular: 'staff account', icon: ShieldCheck,
    description: 'Manage authorized staff accounts and their CMS access roles.',
    roles: ['Super Admin'],
    fields: [],
  },
}

function MailIcon(props) {
  return <CircleUserRound {...props} />
}

const roleLabels = {
  'super-admin': 'Super Admin',
  'content-editor': 'Content Editor',
  'event-manager': 'Event Manager',
}

async function apiRequest(path, { csrf, ...options } = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (csrf) headers.set('X-CSRF-Token', csrf)
  const response = await fetch(path, { ...options, headers, credentials: 'include' })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || payload.message || `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return payload
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const session = await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      onLogin(session)
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in. Check your details and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-login">
      <div className="admin-login-glow" />
      <Link to="/" className="admin-login-back"><ArrowLeft size={15} /> Return to the website</Link>
      <section className="admin-login-card">
        <div className="admin-login-mark"><ShieldCheck size={23} /></div>
        <span className="admin-eyebrow">PEARL SYMPHONY ORCHESTRA</span>
        <h1>Staff sign in</h1>
        <p>Access the secure orchestra content management portal.</p>
        <form onSubmit={submit}>
          <label>Email address<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <div className="admin-alert" role="alert">{error}</div>}
          <button type="submit" className="admin-primary-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'} <ArrowRight size={16} /></button>
        </form>
        <small className="admin-login-security"><ShieldCheck size={13} /> Protected staff access · secure session</small>
      </section>
    </main>
  )
}

function AdminField({ field, value, onChange, onUpload, uploading }) {
  const commonProps = { id: `field-${field.key}`, name: field.key, value: value ?? '', required: Boolean(field.required), onChange: (event) => onChange(field.key, event.target.value) }
  return (
    <label className={`admin-field${field.wide ? ' admin-field--wide' : ''}`} htmlFor={commonProps.id}>
      <span>{field.label}{field.required && <i> *</i>}</span>
      {field.type === 'textarea' ? <textarea {...commonProps} rows={4} /> : field.type === 'select' ? <select {...commonProps}><option value="">Select…</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input {...commonProps} type={field.type === 'image' ? 'url' : field.type || 'text'} placeholder={field.type === 'image' ? 'https://…' : undefined} />}
      {field.type === 'image' && <span className="admin-upload-row"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" aria-label={`Upload ${field.label}`} disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(field.key, file); event.target.value = '' }} /><small>{uploading ? 'Uploading…' : 'Or upload JPEG, PNG, WebP or PDF · max 10 MB'}</small></span>}
      {field.type === 'image' && value && <span className="admin-image-preview">{value.toLowerCase().endsWith('.pdf') ? <span className="admin-pdf-preview">PDF ASSET</span> : <img src={value} alt={`${field.label} preview`} onError={(event) => { event.currentTarget.style.display = 'none' }} />}</span>}
    </label>
  )
}

function AdminEditor({ module, initial, csrf, onClose, onSaved, notify }) {
  const config = moduleDefinitions[module]
  const [formData, setFormData] = useState(initial ? { ...initial } : {})
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const update = (key, value) => setFormData((current) => ({ ...current, [key]: value }))

  const upload = async (key, file) => {
    setError('')
    setUploading(true)
    try {
      const response = await apiRequest('/api/admin/uploads', {
        method: 'POST',
        csrf,
        headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
        body: file,
      })
      if (!response.url) throw new Error('Upload did not return an asset URL.')
      update(key, response.url)
      notify('Asset uploaded')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUploading(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const editing = Boolean(initial?.id)
      const path = `/api/admin/content/${module}${editing ? `/${encodeURIComponent(initial.id)}` : ''}`
      const response = await apiRequest(path, {
        method: editing ? 'PUT' : 'POST',
        csrf,
        body: JSON.stringify(formData),
      })
      onSaved(response.record || response.item || response.data || formData)
      notify(`${config.singular} ${editing ? 'updated' : 'created'}`)
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="admin-editor" role="dialog" aria-modal="true" aria-labelledby="admin-editor-title">
        <header><div><span className="admin-eyebrow">{initial?.id ? 'EDIT RECORD' : 'NEW RECORD'}</span><h2 id="admin-editor-title">{initial?.id ? 'Update' : 'Add'} {config.singular}</h2></div><button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close editor"><X size={18} /></button></header>
        <form onSubmit={submit}>
          <div className="admin-editor-fields">{config.fields.map((field) => <AdminField key={field.key} field={field} value={formData[field.key]} onChange={update} onUpload={upload} uploading={uploading} />)}</div>
          {error && <div className="admin-alert" role="alert">{error}</div>}
          <div className="admin-editor-actions"><button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="admin-primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save changes'} <Check size={16} /></button></div>
        </form>
      </section>
    </div>
  )
}

function AdminSidebar({ active, user, onLogout, open, onToggle, modules }) {
  return (
    <>
      {open && <button className="admin-sidebar-scrim" onClick={onToggle} aria-label="Close sidebar" />}
      <aside className={`admin-sidebar${open ? ' admin-sidebar--open' : ''}`}>
        <Link to="/" className="admin-sidebar-brand"><span className="admin-sidebar-emblem"><AudioLines size={21} /></span><span><strong>PEARL CMS</strong><small>ORCHESTRA PORTAL</small></span></Link>
        <div className="admin-sidebar-label">WORKSPACE</div>
        <Link className={`admin-side-link${active === 'dashboard' ? ' is-active' : ''}`} to="/admin/dashboard" onClick={onToggle}><LayoutDashboard size={17} /> Overview</Link>
        <div className="admin-sidebar-label">CONTENT</div>
        {modules.map(({ key, title, icon: Icon }) => <Link key={key} className={`admin-side-link${active === key ? ' is-active' : ''}`} to={`/admin/${key}`} onClick={onToggle}><Icon size={17} /> {title}</Link>)}
        <div className="admin-sidebar-bottom"><div className="admin-user-card"><span className="admin-user-avatar">{(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}</span><span><strong>{user?.name || user?.email}</strong><small>{roleLabels[user?.role] || user?.role}</small></span><ChevronDown size={14} /></div><button className="admin-side-link admin-logout" onClick={onLogout}><LogOut size={17} /> Sign out</button><Link className="admin-back-site" to="/"><ArrowLeft size={14} /> Back to website</Link></div>
      </aside>
    </>
  )
}

function AdminDashboard({ modules, itemsByModule }) {
  const total = Object.values(itemsByModule).reduce((count, items) => count + items.length, 0)
  const inquiries = itemsByModule.inquiries || []
  const newInquiries = inquiries.filter((item) => String(item.data?.status || item.status || 'New').toLowerCase() === 'new').length
  return (
    <div className="admin-page-content">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">YOUR ORCHESTRA, AT A GLANCE</span><h1>Welcome to Pearl CMS</h1><p>Manage the people, performances and stories shaping the Pearl sound.</p></div></div>
      <div className="admin-stat-grid"><article><span>Content records</span><strong>{total}</strong><small>Across the workspace</small></article><article><span>New inquiries</span><strong>{newInquiries}</strong><small>Waiting for a response</small></article><article><span>Managed sections</span><strong>{modules.length}</strong><small>Available to your role</small></article></div>
      <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Workspace modules</h2><p>Choose an area to review or update.</p></div><Settings2 size={18} /></div><div className="admin-module-grid">{modules.map(({ key, title, description, icon: Icon }) => <Link to={`/admin/${key}`} key={key} className="admin-module-card"><span><Icon size={20} /></span><h3>{title}</h3><p>{description}</p><small>{(itemsByModule[key] || []).length} records <ArrowRight size={14} /></small></Link>)}</div></section>
    </div>
  )
}

function AdminModule({ module, records, onRefresh, csrf, notify }) {
  const config = moduleDefinitions[module]
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [editing, setEditing] = useState(undefined)
  const [expandedId, setExpandedId] = useState('')
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const searchableRecords = records.filter((record) => {
    const data = record.data || record
    const text = Object.values(data).filter((value) => typeof value === 'string').join(' ').toLowerCase()
    const matchesQuery = text.includes(query.toLowerCase())
    const status = String(data.status || 'New').toLowerCase()
    return matchesQuery && (statusFilter === 'All statuses' || status === statusFilter.toLowerCase())
  })

  const saveStatus = async (record, status) => {
    setBusyId(record.id)
    setError('')
    try {
      await apiRequest(`/api/admin/content/${module}/${encodeURIComponent(record.id)}`, { method: 'PUT', csrf, body: JSON.stringify({ ...(record.data || record), status }) })
      notify('Inquiry status updated')
      await onRefresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId('')
    }
  }

  const removeRecord = async (record) => {
    if (!window.confirm(`Archive this ${config.singular}?`)) return
    setBusyId(record.id)
    setError('')
    try {
      await apiRequest(`/api/admin/content/${module}/${encodeURIComponent(record.id)}`, { method: 'DELETE', csrf })
      notify(`${config.singular} archived`)
      await onRefresh()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId('')
    }
  }

  const reorder = async (record, direction) => {
    const index = records.findIndex((item) => item.id === record.id)
    const target = records[index + direction]
    if (!target) return
    setBusyId(record.id)
    try {
      await apiRequest(`/api/admin/content/${module}/${encodeURIComponent(record.id)}`, { method: 'PUT', csrf, body: JSON.stringify({ ...(record.data || record), sortOrder: index + direction }) })
      await apiRequest(`/api/admin/content/${module}/${encodeURIComponent(target.id)}`, { method: 'PUT', csrf, body: JSON.stringify({ ...(target.data || target), sortOrder: index }) })
      await onRefresh()
      notify('Display order updated')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="admin-page-content">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">CONTENT MANAGEMENT</span><h1>{config.title}</h1><p>{config.description}</p></div>{!config.readOnly && <button className="admin-primary-button" onClick={() => setEditing(null)}><Plus size={16} /> Add {config.singular}</button>}</div>
      <section className="admin-panel admin-record-panel">
        <div className="admin-table-toolbar"><label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} /></label>{module === 'events' || module === 'inquiries' ? <select className="admin-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{(module === 'events' ? ['Upcoming', 'Sold Out', 'Past'] : ['New', 'In Progress', 'Confirmed']).map((status) => <option key={status}>{status}</option>)}</select> : null}<span className="admin-record-count">{searchableRecords.length} RECORDS</span></div>
        {error && <div className="admin-alert" role="alert">{error}</div>}
        <div className="admin-table-scroll"><table className="admin-table"><thead><tr>{config.fields.filter((field) => ['name', 'title', 'eventName', 'packageName', 'section', 'role', 'releaseDate', 'venue', 'dateTime', 'type', 'status', 'email', 'topic'].includes(field.key)).slice(0, 5).map((field) => <th key={field.key}>{field.label}</th>)}<th>Updated</th><th className="admin-actions-heading">Actions</th></tr></thead><tbody>
          {searchableRecords.map((record, index) => {
            const data = record.data || record
            const summaryFields = config.fields.filter((field) => ['name', 'title', 'eventName', 'packageName', 'section', 'role', 'releaseDate', 'venue', 'dateTime', 'type', 'status', 'email', 'topic'].includes(field.key)).slice(0, 5)
            return <Fragment key={record.id}><tr>{summaryFields.map((field) => <td key={field.key}>{field.key === 'status' && module === 'inquiries' ? <select className="admin-status-select" value={data.status || 'New'} aria-label={`Inquiry status: ${data.name || data.email || 'inquiry'}`} disabled={busyId === record.id} onChange={(event) => saveStatus(record, event.target.value)}>{config.fields.find((item) => item.key === 'status').options.map((status) => <option key={status}>{status}</option>)}</select> : field.key === 'status' ? <span className={`admin-status admin-status--${String(data[field.key] || 'New').toLowerCase().replaceAll(' ', '-')}`}>{data[field.key] || 'New'}</span> : <span className={field.key === (module === 'events' ? 'eventName' : 'title') ? 'admin-record-title' : ''}>{data[field.key] || '—'}</span>}</td>)}<td>{record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : '—'}</td><td><div className="admin-row-actions">{module === 'inquiries' && <button title="View inquiry details" aria-label="View inquiry details" aria-expanded={expandedId === record.id} onClick={() => setExpandedId(expandedId === record.id ? '' : record.id)}><Eye size={15} /></button>}{!config.readOnly && <><button title="Move up" aria-label="Move up" disabled={!index || busyId === record.id} onClick={() => reorder(record, -1)}><ArrowUp size={15} /></button><button title="Move down" aria-label="Move down" disabled={index === searchableRecords.length - 1 || busyId === record.id} onClick={() => reorder(record, 1)}><ArrowDown size={15} /></button><button title="Edit" aria-label="Edit" onClick={() => setEditing(record)}><Settings2 size={15} /></button></>}<button title="Archive" aria-label="Archive" disabled={busyId === record.id} onClick={() => removeRecord(record)}><Trash2 size={15} /></button></div></td></tr>{module === 'inquiries' && expandedId === record.id && <tr className="admin-inquiry-details"><td colSpan={8}><dl>{Object.entries(data).filter(([key, value]) => key !== 'status' && value !== '' && value !== null && value !== undefined).map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}</dt><dd>{typeof value === 'string' ? value : JSON.stringify(value)}</dd></div>)}</dl></td></tr>}</Fragment>
          })}
          {!searchableRecords.length && <tr><td className="admin-empty" colSpan={8}><span><Search size={20} /></span><strong>{records.length ? 'No matching records' : 'Nothing here yet'}</strong><small>{records.length ? 'Try another search or status filter.' : 'Add your first item to get started.'}</small></td></tr>}
        </tbody></table></div>
      </section>
      {editing !== undefined && <AdminEditor module={module} initial={editing} csrf={csrf} onClose={() => setEditing(undefined)} onSaved={onRefresh} notify={notify} />}
    </div>
  )
}

function AdminStaff({ csrf, notify }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiRequest('/api/admin/users')
      setUsers(response.users || [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const save = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const values = Object.fromEntries(new FormData(form).entries())
    setBusy(true)
    setError('')
    try {
      const update = Boolean(editing?.id)
      const response = await apiRequest(`/api/admin/users${update ? `/${encodeURIComponent(editing.id)}` : ''}`, {
        method: update ? 'PUT' : 'POST',
        csrf,
        body: JSON.stringify(values),
      })
      if (!update && response.user) setUsers((current) => [...current, response.user])
      else await refresh()
      notify(update ? 'Staff account updated' : 'Staff account created')
      setEditing(undefined)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (user) => {
    if (!window.confirm(`Remove CMS access for ${user.email}?`)) return
    setError('')
    try {
      await apiRequest(`/api/admin/users/${encodeURIComponent(user.id)}`, { method: 'DELETE', csrf })
      setUsers((current) => current.filter((item) => item.id !== user.id))
      notify('Staff access removed')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="admin-page-content">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">SECURITY & PERMISSIONS</span><h1>Staff & Access</h1><p>Create staff accounts and assign least-privilege CMS roles.</p></div><button className="admin-primary-button" onClick={() => setEditing({})}><Plus size={16} /> Add staff member</button></div>
      {error && <div className="admin-alert" role="alert">{error}</div>}
      <section className="admin-panel">
        <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Staff member</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
          {users.map((user) => <tr key={user.id}><td className="admin-record-title">{user.name || '—'}</td><td>{user.email}</td><td><span className="admin-status">{roleLabels[user.role] || user.role}</span></td><td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td><td><div className="admin-row-actions"><button title="Edit account" aria-label="Edit account" onClick={() => setEditing(user)}><Settings2 size={15} /></button><button title="Remove access" aria-label="Remove access" onClick={() => remove(user)}><Trash2 size={15} /></button></div></td></tr>)}
          {!loading && !users.length && <tr><td className="admin-empty" colSpan={5}><strong>No staff accounts yet</strong><small>Add trusted team members with role-specific access.</small></td></tr>}
          {loading && <tr><td className="admin-empty" colSpan={5}>Loading staff accounts…</td></tr>}
        </tbody></table></div>
      </section>
      {editing !== undefined && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(undefined) }}><section className="admin-editor admin-staff-editor" role="dialog" aria-modal="true" aria-labelledby="staff-editor-title"><header><div><span className="admin-eyebrow">STAFF PERMISSIONS</span><h2 id="staff-editor-title">{editing.id ? 'Edit staff access' : 'Add staff member'}</h2></div><button type="button" className="admin-icon-button" onClick={() => setEditing(undefined)} aria-label="Close dialog"><X size={18} /></button></header><form onSubmit={save}><div className="admin-editor-fields"><label className="admin-field">Full name<input name="name" defaultValue={editing.name || ''} required autoComplete="name" /></label><label className="admin-field">Email address<input name="email" type="email" defaultValue={editing.email || ''} required autoComplete="email" /></label><label className="admin-field admin-field--wide">Temporary password<input name="password" type="password" required={!editing.id} minLength={12} autoComplete="new-password" placeholder={editing.id ? 'Leave blank to keep current password' : 'At least 12 characters'} /></label><label className="admin-field admin-field--wide">Access role<select name="role" defaultValue={editing.role || 'content-editor'} required><option value="super-admin">Super Admin — full access</option><option value="content-editor">Content Editor — people, music, packages & media</option><option value="event-manager">Event Manager — events & inquiries</option></select></label></div>{error && <div className="admin-alert" role="alert">{error}</div>}<div className="admin-editor-actions"><button type="button" className="admin-secondary-button" onClick={() => setEditing(undefined)}>Cancel</button><button type="submit" className="admin-primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save staff access'} <Check size={16} /></button></div></form></section></div>}
    </div>
  )
}

export default function AdminPortal() {
  const location = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [authState, setAuthState] = useState('loading')
  const [itemsByModule, setItemsByModule] = useState({})
  const [toast, setToast] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const module = location.pathname.split('/')[2]

  const notify = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }, [])

  const loadSession = useCallback(async () => {
    try {
      const data = await apiRequest('/api/auth/session')
      setSession(data)
      setAuthState('authenticated')
    } catch (error) {
      setSession(null)
      setAuthState(error.status === 401 ? 'unauthenticated' : 'error')
    }
  }, [])

  useEffect(() => { loadSession() }, [loadSession])
  useEffect(() => {
    if (authState === 'unauthenticated' && location.pathname !== '/admin/login') navigate('/admin/login', { replace: true })
    if (authState === 'authenticated' && location.pathname === '/admin/login') navigate('/admin/dashboard', { replace: true })
  }, [authState, location.pathname, navigate])

  const accessibleModules = useMemo(() => {
    const role = roleLabels[session?.user?.role] || session?.user?.role
    const modules = Object.entries(moduleDefinitions).filter(([key, config]) => key !== 'staff' && config.roles.includes(role)).map(([key, config]) => ({ key, ...config }))
    if (session?.user?.role === 'super-admin') modules.push({ key: 'staff', ...moduleDefinitions.staff })
    return modules
  }, [session])

  const loadModule = useCallback(async (key, silent = false) => {
    try {
      const response = await apiRequest(`/api/admin/content/${key}`)
      const records = response.records || response.items || response.data || []
      setItemsByModule((current) => ({ ...current, [key]: Array.isArray(records) ? records : [] }))
      return true
    } catch (error) {
      if (!silent) notify(error.message)
      if (error.status === 401) {
        setSession(null)
        setAuthState('unauthenticated')
      }
      return false
    }
  }, [notify])

  useEffect(() => {
    if (authState !== 'authenticated') return
    const available = accessibleModules.map(({ key }) => key)
    if (module && moduleDefinitions[module] && !available.includes(module)) {
      navigate('/admin/dashboard', { replace: true })
      return
    }
    const requested = module && module !== 'staff' && available.includes(module) ? [module] : module === 'staff' ? [] : available.filter((key) => key !== 'staff')
    requested.forEach((key) => loadModule(key, true))
  }, [authState, accessibleModules, module, navigate, loadModule])

  const csrf = session?.csrf
  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST', csrf })
    } finally {
      setSession(null)
      setAuthState('unauthenticated')
      navigate('/admin/login', { replace: true })
    }
  }

  useEffect(() => {
    document.title = location.pathname.endsWith('/login') ? 'Staff Sign In | Pearl Symphony Orchestra' : 'Admin CMS | Pearl Symphony Orchestra'
  }, [location.pathname])

  if (authState === 'loading') return <main className="admin-loading"><AudioLines size={28} /><span>Opening secure workspace…</span></main>
  if (location.pathname === '/admin/login') {
    return <AdminLogin onLogin={(data) => { setSession(data); setAuthState('authenticated'); navigate('/admin/dashboard', { replace: true }) }} />
  }
  if (authState === 'unauthenticated') return <main className="admin-loading"><AudioLines size={28} /><span>Redirecting to secure sign in…</span></main>
  if (authState === 'error') return <main className="admin-loading"><div className="admin-alert">The admin service could not be reached. Start the CMS server and try again.</div><button className="admin-secondary-button" onClick={loadSession}>Retry connection</button></main>

  const currentModule = moduleDefinitions[module]
  return (
    <main className="admin-app">
      <AdminSidebar active={module || 'dashboard'} user={session.user} onLogout={logout} open={sidebarOpen} onToggle={() => setSidebarOpen((open) => !open)} modules={accessibleModules} />
      <section className="admin-main">
        <header className="admin-topbar"><button className="admin-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open admin menu"><Menu size={19} /></button><div className="admin-breadcrumb"><span>Workspace</span><ArrowRight size={13} /><strong>{currentModule?.title || 'Overview'}</strong></div><a href="/" className="admin-view-site" target="_blank" rel="noopener noreferrer">View website <ArrowUpRight size={14} /></a></header>
        {module === 'staff' ? <AdminStaff csrf={csrf} notify={notify} /> : module && currentModule ? <AdminModule module={module} records={itemsByModule[module] || []} onRefresh={() => loadModule(module)} csrf={csrf} notify={notify} /> : <AdminDashboard modules={accessibleModules} itemsByModule={itemsByModule} />}
      </section>
      {toast && <div className="admin-toast" role="status"><Check size={16} /> {toast}</div>}
    </main>
  )
}
