import { useEffect, useState } from 'react'
import { getCountryName } from '../../data/countries'
import {
  createDeekshaProgram,
  deleteDeekshaProgram,
  getAdminDeekshaPrograms,
  getAdminDeekshaSubmissions,
  updateDeekshaProgram,
} from '../../services/deekshaApi'

const EMPTY_FORM = {
  title: '', subtitle: '', description: '', meetingUrl: '', benefitsText: '', sortOrder: '0', isPublished: true,
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminDeekshaManager() {
  const [programs, setPrograms] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getAdminDeekshaPrograms(controller.signal),
      getAdminDeekshaSubmissions(search, controller.signal),
    ])
      .then(([programPayload, submissionPayload]) => {
        setPrograms(programPayload.programs)
        setSubmissions(submissionPayload.submissions)
        setStatus({ type: '', text: '' })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setStatus({ type: 'error', text: error.message })
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [search])

  const updateField = (event) => {
    const { name, type, value, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const saveProgram = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setStatus({ type: '', text: '' })
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      description: form.description,
      benefits: form.benefitsText.split('\n').map((item) => item.trim()).filter(Boolean),
      meetingUrl: form.meetingUrl,
      sortOrder: Number(form.sortOrder),
      isPublished: form.isPublished,
    }
    try {
      const result = editingId
        ? await updateDeekshaProgram(editingId, payload)
        : await createDeekshaProgram(payload)
      setPrograms((current) => {
        const next = editingId
          ? current.map((item) => item.id === editingId ? result.program : item)
          : [...current, result.program]
        return next.sort((first, second) => first.sortOrder - second.sortOrder || Number(first.id) - Number(second.id))
      })
      setStatus({ type: 'success', text: editingId ? 'Deeksha program updated.' : 'Deeksha program published.' })
      resetForm()
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const editProgram = (program) => {
    setEditingId(program.id)
    setForm({
      title: program.title,
      subtitle: program.subtitle,
      description: program.description,
      meetingUrl: program.meetingUrl || '',
      benefitsText: (program.benefits || []).join('\n'),
      sortOrder: String(program.sortOrder),
      isPublished: program.isPublished,
    })
    setStatus({ type: '', text: '' })
    document.getElementById('admin-deeksha-editor')?.scrollIntoView({ block: 'start' })
  }

  const removeProgram = async (program) => {
    if (!window.confirm(`Delete “${program.title}” permanently?`)) return
    try {
      await deleteDeekshaProgram(program.id)
      setPrograms((current) => current.filter((item) => item.id !== program.id))
      if (editingId === program.id) resetForm()
      setStatus({ type: 'success', text: 'Deeksha program deleted.' })
    } catch (error) {
      setStatus({ type: 'error', text: error.message })
    }
  }

  return (
    <div className="admin-deeksha">
      <form id="admin-deeksha-editor" className="admin-upload admin-deeksha__editor" onSubmit={saveProgram}>
        <div className="admin-upload__heading">
          <div><p className="section-kicker">Public Deeksha page</p><h2>{editingId ? 'Edit Deeksha Program' : 'Add Deeksha Program'}</h2></div>
          {editingId && <button className="admin-button admin-button--quiet" type="button" onClick={resetForm}>Cancel edit</button>}
        </div>
        <div className="admin-deeksha__fields">
          <label><span>Program title *</span><input name="title" value={form.title} maxLength="160" required onChange={updateField} /></label>
          <label><span>Subtitle</span><input name="subtitle" value={form.subtitle} maxLength="240" onChange={updateField} /></label>
          <label><span>Zoom / Google Meet link <small>optional, shown only in the signed-in user dashboard</small></span><input name="meetingUrl" type="url" value={form.meetingUrl} placeholder="https://meet.google.com/..." onChange={updateField} /></label>
          <label className="is-wide"><span>Description</span><textarea name="description" value={form.description} maxLength="2000" rows="4" onChange={updateField} /></label>
          <label className="is-wide"><span>Benefits <small>one benefit per line</small></span><textarea name="benefitsText" value={form.benefitsText} rows="10" onChange={updateField} /></label>
          <label><span>Display order</span><input type="number" name="sortOrder" value={form.sortOrder} min="0" max="10000" required onChange={updateField} /></label>
          <label className="admin-deeksha__published"><input type="checkbox" name="isPublished" checked={form.isPublished} onChange={updateField} /><span>Published on user page</span></label>
        </div>
        <button className="admin-button admin-button--primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Add program'}</button>
      </form>

      {status.text && <p className={`admin-message admin-message--${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.text}</p>}

      <section className="admin-deeksha__programs">
        <div className="admin-photo-list__heading"><h2>Deeksha Programs</h2><span>{programs.length} total</span></div>
        {isLoading ? <p className="admin-empty-state">Loading Deeksha programs…</p> : (
          <div className="admin-deeksha__program-grid">
            {programs.map((program) => (
              <article className="admin-deeksha__program" key={program.id}>
                <div><span>{program.isPublished ? 'Published' : 'Hidden'} · Order {program.sortOrder}</span><h3>{program.title}</h3><p>{program.subtitle}</p>{program.meetingUrl && <small>Meeting link configured</small>}</div>
                <div className="admin-deeksha__program-actions">
                  <button type="button" onClick={() => editProgram(program)}>Edit</button>
                  {!program.isBuiltIn && <button type="button" onClick={() => removeProgram(program)}>Delete</button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-deeksha__submissions">
        <div className="admin-photo-list__heading"><h2>Deeksha Submissions</h2><span>{submissions.length} records</span></div>
        <form className="admin-deeksha__search" onSubmit={(event) => { event.preventDefault(); setIsLoading(true); setSearch(searchInput.trim()) }}>
          <input type="search" value={searchInput} maxLength="120" placeholder="Search ID, name, phone, email or Deeksha" onChange={(event) => setSearchInput(event.target.value)} />
          <button type="submit">Search</button>
          {search && <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setIsLoading(true) }}>Clear</button>}
        </form>
        {isLoading ? <p className="admin-empty-state">Loading submissions…</p> : submissions.length ? (
          <div className="admin-deeksha-table-wrap">
            <table className="admin-deeksha-table">
              <thead><tr><th>ID / Date</th><th>Name</th><th>Contact</th><th>Location</th><th>Selected Deeksha</th><th>Message</th></tr></thead>
              <tbody>{submissions.map((submission) => (
                <tr key={submission.id}>
                  <td data-label="ID / Date"><div><strong>#{submission.id}</strong><small>{formatDate(submission.createdAt)}</small></div></td>
                  <td data-label="Name"><div><strong>{submission.fullName}</strong>{submission.userId && <small>Account #{submission.userId}</small>}</div></td>
                  <td data-label="Contact"><div>{submission.email && <a href={`mailto:${submission.email}`}>{submission.email}</a>}<a href={`tel:${submission.phone.replace(/[^\d+]/g, '')}`}>{submission.phone}</a></div></td>
                  <td data-label="Location"><div>{submission.city || '—'}<small>{getCountryName(submission.country)}</small></div></td>
                  <td data-label="Selected Deeksha"><div><ul>{submission.selectedPrograms.map((program) => <li key={`${submission.id}-${program.id}`}>{program.title}</li>)}</ul></div></td>
                  <td data-label="Message"><div>{submission.message || '—'}</div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="admin-empty-state">No Deeksha submissions found.</p>}
      </section>
    </div>
  )
}
