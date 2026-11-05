import { useEffect, useState } from 'react'
import { getCountryName } from '../../data/countries'
import { getAdminRegistrations, undoRegistrationPaymentVerification, verifyRegistrationPayment } from '../../services/submissionsApi'

const PANEL = {
  title: 'Online class registrations',
  description: 'Search registrations, review payment proof and maintain verification status.',
  empty: 'No online class registrations match these filters.',
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminSubmissionsPanel({ kind }) {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [verifyingId, setVerifyingId] = useState(null)
  const [undoItem, setUndoItem] = useState(null)
  const [undoPassword, setUndoPassword] = useState('')
  const [isUndoing, setIsUndoing] = useState(false)
  const [undoError, setUndoError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getAdminRegistrations({ page, search, paymentStatus, dateFrom, dateTo, sortBy, sortDirection }, controller.signal)
      .then((payload) => {
        setItems(payload.registrations)
        setTotal(payload.total)
        setPageSize(payload.pageSize)
        setError('')
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setItems([])
          setTotal(0)
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [dateFrom, dateTo, page, paymentStatus, refreshKey, search, sortBy, sortDirection])

  useEffect(() => {
    if (!undoItem) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !isUndoing) {
        setUndoItem(null)
        setUndoPassword('')
        setUndoError('')
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isUndoing, undoItem])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const refresh = () => {
    setIsLoading(true)
    setRefreshKey((current) => current + 1)
  }
  const changePage = (nextPage) => {
    setIsLoading(true)
    setPage(nextPage)
  }
  const applySearch = (event) => {
    event.preventDefault()
    setPage(1)
    setIsLoading(true)
    setSearch(searchInput.trim())
  }
  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setPaymentStatus('')
    setDateFrom('')
    setDateTo('')
    setSortBy('createdAt')
    setSortDirection('desc')
    setPage(1)
    setIsLoading(true)
  }
  const changeSort = (column) => {
    setSortDirection((current) => (sortBy === column && current === 'asc' ? 'desc' : 'asc'))
    setSortBy(column)
    setPage(1)
    setIsLoading(true)
  }
  const verifyPayment = async (item) => {
    if (!window.confirm(`Verify the payment submitted by ${item.fullName}? Check the bank transaction before continuing.`)) return
    setVerifyingId(item.id)
    setError('')
    setMessage('')
    try {
      const { registration } = await verifyRegistrationPayment(item.id)
      setItems((current) => current.map((entry) => (
        entry.id === item.id ? { ...entry, ...registration } : entry
      )))
      setMessage(`${item.fullName}'s payment has been marked as verified.`)
      if (paymentStatus === 'PENDING') {
        setIsLoading(true)
        setRefreshKey((current) => current + 1)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setVerifyingId(null)
    }
  }
  const openUndo = (item) => {
    setUndoItem(item)
    setUndoPassword('')
    setUndoError('')
  }
  const closeUndo = () => {
    if (isUndoing) return
    setUndoItem(null)
    setUndoPassword('')
    setUndoError('')
  }
  const undoVerification = async (event) => {
    event.preventDefault()
    if (!undoItem || !undoPassword) return
    setIsUndoing(true)
    setUndoError('')
    setError('')
    setMessage('')
    try {
      const { registration } = await undoRegistrationPaymentVerification(undoItem.id, undoPassword)
      setItems((current) => current.map((entry) => (
        entry.id === undoItem.id ? { ...entry, ...registration } : entry
      )))
      setMessage(`${undoItem.fullName}'s payment verification has been returned to pending.`)
      setUndoItem(null)
      setUndoPassword('')
      if (paymentStatus === 'VERIFIED') {
        setIsLoading(true)
        setRefreshKey((current) => current + 1)
      }
    } catch (requestError) {
      setUndoError(requestError.message)
    } finally {
      setIsUndoing(false)
    }
  }
  const sortIndicator = (column) => (sortBy === column ? (sortDirection === 'asc' ? '↑' : '↓') : '↕')

  return (
    <section className="admin-submissions" aria-labelledby={`admin-${kind}-title`}>
      <div className="admin-submissions__heading">
        <div>
          <p className="section-kicker">Inbox</p>
          <h2 id={`admin-${kind}-title`}>{PANEL.title}</h2>
          <p>{PANEL.description}</p>
        </div>
        <button className="admin-button admin-button--quiet" type="button" onClick={refresh} disabled={isLoading}>Refresh</button>
      </div>

      <div className="admin-registration-filters">
        <form className="admin-registration-filters__search" role="search" onSubmit={applySearch}>
          <label htmlFor="registration-search">Search by name or payment</label>
          <div>
            <input id="registration-search" type="search" value={searchInput} maxLength="120" placeholder="Name, email, phone, class or payment" onChange={(event) => setSearchInput(event.target.value)} />
            <button type="submit">Search</button>
          </div>
        </form>
        <label className="admin-registration-filters__status">
          <span>Payment status</span>
          <select
            value={paymentStatus}
            onChange={(event) => {
              setPaymentStatus(event.target.value)
              setPage(1)
              setIsLoading(true)
            }}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
          </select>
        </label>
        <label>
          <span>From date</span>
          <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => { setDateFrom(event.target.value); setPage(1); setIsLoading(true) }} />
        </label>
        <label>
          <span>To date</span>
          <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); setPage(1); setIsLoading(true) }} />
        </label>
        {(search || paymentStatus || dateFrom || dateTo || sortBy !== 'createdAt' || sortDirection !== 'desc') && <button className="admin-registration-filters__clear" type="button" onClick={clearFilters}>Clear filters</button>}
      </div>

      {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
      {message && <p className="admin-message admin-message--success" role="status">{message}</p>}
      <p className="admin-submissions__count">{total} submission{total === 1 ? '' : 's'}</p>

      {isLoading ? (
        <p className="admin-empty-state" role="status">Loading submissions…</p>
      ) : items.length > 0 ? (
        <div className="admin-registration-table-wrap">
          <table className="admin-registration-table">
            <thead>
              <tr>
                <th>ID</th>
                <th><button type="button" onClick={() => changeSort('fullName')}>Registrant <span>{sortIndicator('fullName')}</span></button></th>
                <th>Contact</th>
                <th><button type="button" onClick={() => changeSort('classTitle')}>Class <span>{sortIndicator('classTitle')}</span></button></th>
                <th>Location</th>
                <th>Payment</th>
                <th>Proof</th>
                <th><button type="button" onClick={() => changeSort('paymentStatus')}>Status <span>{sortIndicator('paymentStatus')}</span></button></th>
                <th><button type="button" onClick={() => changeSort('createdAt')}>Submitted <span>{sortIndicator('createdAt')}</span></button></th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td><strong>{item.fullName}</strong>{item.message && <small title={item.message}>{item.message}</small>}</td>
                  <td><a href={`mailto:${item.email}`}>{item.email}</a><a href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}>{item.phone}</a></td>
                  <td>{item.classTitle || 'General enquiry'}</td>
                  <td>{item.city || '—'}<small>{getCountryName(item.country)}</small></td>
                  <td>{item.paymentMethod || '—'}</td>
                  <td>{item.hasPaymentScreenshot ? <a href={`/api/admin/registrations/${encodeURIComponent(item.id)}/payment-screenshot`} target="_blank" rel="noreferrer">View proof</a> : '—'}</td>
                  <td>
                    <span className={`admin-payment-status admin-payment-status--${(item.paymentStatus || 'none').toLowerCase()}`}>{item.paymentStatus || 'Not submitted'}</span>
                    {item.paymentStatusUpdatedAt && <small>{formatDate(item.paymentStatusUpdatedAt)} · {item.paymentStatusUpdatedBy}</small>}
                  </td>
                  <td><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></td>
                  <td>
                    {item.paymentStatus === 'PENDING' && item.hasPaymentScreenshot ? (
                      <button className="admin-registration-table__verify" type="button" disabled={verifyingId === item.id} onClick={() => verifyPayment(item)}>
                        {verifyingId === item.id ? 'Verifying…' : 'Verify'}
                      </button>
                    ) : item.paymentStatus === 'VERIFIED' ? (
                      <button className="admin-registration-table__undo" type="button" onClick={() => openUndo(item)}>Undo verify</button>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !error ? <p className="admin-empty-state">{PANEL.empty}</p> : null}

      {totalPages > 1 && (
        <nav className="admin-submissions__pagination" aria-label={`${PANEL.title} pages`}>
          <button type="button" onClick={() => changePage(page - 1)} disabled={isLoading || page === 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" onClick={() => changePage(page + 1)} disabled={isLoading || page >= totalPages}>Next</button>
        </nav>
      )}

      {undoItem && (
        <div className="admin-verification-dialog" role="dialog" aria-modal="true" aria-labelledby="undo-verification-title" onMouseDown={(event) => { if (event.target === event.currentTarget) closeUndo() }}>
          <form className="admin-verification-dialog__card" onSubmit={undoVerification}>
            <p className="section-kicker">Protected action</p>
            <h2 id="undo-verification-title">Undo payment verification?</h2>
            <p>This will return <strong>{undoItem.fullName}</strong>&apos;s payment to Pending. Enter your current admin password to continue.</p>
            <label>
              <span>Admin password</span>
              <input type="password" value={undoPassword} maxLength="256" autoComplete="current-password" autoFocus required onChange={(event) => setUndoPassword(event.target.value)} />
            </label>
            {undoError && <p className="admin-verification-dialog__error" role="alert">{undoError}</p>}
            <div className="admin-verification-dialog__actions">
              <button type="button" onClick={closeUndo} disabled={isUndoing}>Cancel</button>
              <button type="submit" disabled={isUndoing || !undoPassword}>{isUndoing ? 'Checking…' : 'Undo verification'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
