import { useEffect, useState } from 'react'
import {
  getAdminDonations,
  updateDonationStatus,
} from '../../services/donationsApi'

const formatMoney = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
}).format(amount)

const formatDate = (value) => value ? new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value)) : '—'

export function AdminDonationsManager() {
  const [donations, setDonations] = useState([])
  const [filters, setFilters] = useState({ status: '', paymentMethod: '', search: '' })
  const [appliedSearch, setAppliedSearch] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const statusFilter = filters.status
  const paymentMethodFilter = filters.paymentMethod

  useEffect(() => {
    const controller = new AbortController()
    getAdminDonations({ status: statusFilter, paymentMethod: paymentMethodFilter, search: appliedSearch }, controller.signal)
      .then(({ donations: items }) => setDonations(items))
      .catch((error) => {
        if (error.name !== 'AbortError') setMessage({ type: 'error', text: error.message })
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [statusFilter, paymentMethodFilter, appliedSearch])

  const changeStatus = async (donation, status) => {
    const action = status === 'VERIFIED' ? 'verify' : 'reject'
    if (!window.confirm(`Are you sure you want to ${action} donation #${donation.id}?`)) return
    setUpdatingId(donation.id)
    setMessage({ type: '', text: '' })
    try {
      const payload = await updateDonationStatus(donation.id, status)
      setDonations((current) => current.map((item) => item.id === donation.id ? payload.donation : item))
      setMessage({ type: 'success', text: `Donation #${donation.id} marked ${status.toLowerCase()}.` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <div className="admin-donations">
      {message.text && <p className={`admin-message admin-message--${message.type}`} role="status">{message.text}</p>}

      <section className="admin-donation-history" aria-labelledby="donation-history-title">
        <div className="admin-photo-list__heading"><h2 id="donation-history-title">Donation history</h2><span>{donations.length} records</span></div>
        <form className="admin-donation-filters" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(filters.search.trim()) }}>
          <input value={filters.search} placeholder="Search ID, donor, email, phone or UTR" aria-label="Search donations" onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          <select value={filters.status} aria-label="Filter by status" onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="REJECTED">Rejected</option>
          </select>
          <select value={filters.paymentMethod} aria-label="Filter by payment method" onChange={(event) => setFilters((current) => ({ ...current, paymentMethod: event.target.value }))}>
            <option value="">All methods</option><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
          <button className="admin-button admin-button--primary" type="submit">Search</button>
          <button className="admin-button admin-button--quiet" type="button" onClick={() => { setFilters({ status: '', paymentMethod: '', search: '' }); setAppliedSearch('') }}>Clear</button>
        </form>

        {isLoading ? <p className="admin-empty-state">Loading donation history…</p> : donations.length ? (
          <div className="admin-donation-table-wrap">
            <table className="admin-donation-table">
              <thead><tr><th>ID / Date</th><th>Donor</th><th>Payment</th><th>UTR</th><th>Status / Audit</th><th>Actions</th></tr></thead>
              <tbody>{donations.map((donation) => (
                <tr key={donation.id}>
                  <td><strong>#{donation.id}</strong><small>{formatDate(donation.createdAt)}</small></td>
                  <td><strong>{donation.donorName}</strong><small>{donation.email}</small><small>{donation.phone}</small>{donation.message && <small className="is-message">{donation.message}</small>}</td>
                  <td><strong>{formatMoney(donation.amount)}</strong><small>{donation.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'UPI'}</small></td>
                  <td><code>{donation.utrNumber}</code></td>
                  <td><span className={`donation-status is-${donation.status.toLowerCase()}`}>{donation.status}</span><small>By: {donation.verifiedBy || '—'}</small><small>At: {formatDate(donation.verifiedAt)}</small></td>
                  <td>{donation.status === 'PENDING' ? <div className="admin-donation-actions"><button type="button" disabled={updatingId === donation.id} onClick={() => changeStatus(donation, 'VERIFIED')}>Verify Donation</button><button className="is-reject" type="button" disabled={updatingId === donation.id} onClick={() => changeStatus(donation, 'REJECTED')}>Reject Donation</button></div> : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="admin-empty-state">No donations match the selected filters.</p>}
      </section>
    </div>
  )
}
