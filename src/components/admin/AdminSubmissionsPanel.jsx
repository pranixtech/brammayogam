import { useEffect, useState } from 'react'
import { getCountryName } from '../../data/countries'
import { getAdminRegistrations, verifyRegistrationPayment } from '../../services/submissionsApi'

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
  const [verifyingId, setVerifyingId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    getAdminRegistrations({ page, search, paymentStatus }, controller.signal)
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
  }, [page, paymentStatus, refreshKey, search])

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
        {(search || paymentStatus) && <button className="admin-registration-filters__clear" type="button" onClick={clearFilters}>Clear filters</button>}
      </div>

      {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
      {message && <p className="admin-message admin-message--success" role="status">{message}</p>}
      <p className="admin-submissions__count">{total} submission{total === 1 ? '' : 's'}</p>

      {isLoading ? (
        <p className="admin-empty-state" role="status">Loading submissions…</p>
      ) : items.length > 0 ? (
        <div className="admin-registration-table-wrap">
          <table className="admin-registration-table">
            <thead><tr><th>ID</th><th>Registrant</th><th>Contact</th><th>Class</th><th>Location</th><th>Payment</th><th>Proof</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead>
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
                    {item.paymentVerifiedAt && <small>{formatDate(item.paymentVerifiedAt)} · {item.paymentVerifiedBy}</small>}
                  </td>
                  <td><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></td>
                  <td>
                    {item.paymentStatus === 'PENDING' && item.hasPaymentScreenshot ? (
                      <button className="admin-registration-table__verify" type="button" disabled={verifyingId === item.id} onClick={() => verifyPayment(item)}>
                        {verifyingId === item.id ? 'Verifying…' : 'Verify'}
                      </button>
                    ) : item.paymentStatus === 'VERIFIED' ? <span className="admin-registration-table__complete">✓ Verified</span> : '—'}
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
    </section>
  )
}
