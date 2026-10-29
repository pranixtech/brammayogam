import { useEffect, useState } from 'react'
import { getAdminRegistrations } from '../../services/submissionsApi'

const PANELS = {
  registrations: {
    title: 'Online class registrations',
    description: 'Details submitted by people interested in online classes.',
    empty: 'No online class registrations yet.',
    key: 'registrations',
    load: getAdminRegistrations,
  },
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function AdminSubmissionsPanel({ kind }) {
  const panel = PANELS[kind]
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    panel.load(page, controller.signal)
      .then((payload) => {
        setItems(payload[panel.key])
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
  }, [page, panel, refreshKey])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const refresh = () => {
    setIsLoading(true)
    setRefreshKey((current) => current + 1)
  }
  const changePage = (nextPage) => {
    setIsLoading(true)
    setPage(nextPage)
  }

  return (
    <section className="admin-submissions" aria-labelledby={`admin-${kind}-title`}>
      <div className="admin-submissions__heading">
        <div>
          <p className="section-kicker">Inbox</p>
          <h2 id={`admin-${kind}-title`}>{panel.title}</h2>
          <p>{panel.description}</p>
        </div>
        <button className="admin-button admin-button--quiet" type="button" onClick={refresh} disabled={isLoading}>Refresh</button>
      </div>

      {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
      <p className="admin-submissions__count">{total} submission{total === 1 ? '' : 's'}</p>

      {isLoading ? (
        <p className="admin-empty-state" role="status">Loading submissions…</p>
      ) : items.length > 0 ? (
        <div className="admin-submissions__list">
          {items.map((item) => (
            <article className="admin-submission-card" key={item.id}>
              <header>
                <h3>{item.fullName}</h3>
                <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
              </header>
              <dl>
                <div><dt>Email</dt><dd><a href={`mailto:${item.email}`}>{item.email}</a></dd></div>
                <div><dt>Phone / WhatsApp</dt><dd><a href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}>{item.phone}</a></dd></div>
                <div><dt>Country</dt><dd>{item.country}</dd></div>
              </dl>
              {item.message && <p className="admin-submission-card__message">{item.message}</p>}
            </article>
          ))}
        </div>
      ) : !error ? (
        <p className="admin-empty-state">{panel.empty}</p>
      ) : null}

      {totalPages > 1 && (
        <nav className="admin-submissions__pagination" aria-label={`${panel.title} pages`}>
          <button type="button" onClick={() => changePage(page - 1)} disabled={isLoading || page === 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" onClick={() => changePage(page + 1)} disabled={isLoading || page >= totalPages}>Next</button>
        </nav>
      )}
    </section>
  )
}
