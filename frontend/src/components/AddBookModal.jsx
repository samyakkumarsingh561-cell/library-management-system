import { useState } from 'react'
import { BookPlus, X } from 'lucide-react'

const initial = { title: '', author: '', isbn: '', category: 'Fiction', totalCopies: 1 }
export default function AddBookModal({ onClose, onSave }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { await onSave(form); onClose() } finally { setSaving(false) } }
  return <div className="scanner-overlay"><form className="form-modal" onSubmit={submit}><div className="modal-head"><div><span className="eyebrow"><BookPlus size={14} /> Catalog entry</span><h2>Add a new book</h2></div><button type="button" className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="form-grid"><label>Book title<input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. The Night Circus" /></label><label>Author<input required value={form.author} onChange={(e) => update('author', e.target.value)} placeholder="e.g. Erin Morgenstern" /></label><label>ISBN / Book ID<input required value={form.isbn} onChange={(e) => update('isbn', e.target.value)} placeholder="978-..." /></label><label>Category<select value={form.category} onChange={(e) => update('category', e.target.value)}><option>Fiction</option><option>Non-fiction</option><option>Science</option><option>History</option><option>Technology</option><option>Arts</option></select></label><label>Total copies<input required min="1" type="number" value={form.totalCopies} onChange={(e) => update('totalCopies', e.target.value)} /></label></div><button className="primary-button full" disabled={saving}>{saving ? 'Saving...' : 'Add to catalog'}</button></form></div>
}
