import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCountryName } from '../data/countries'
import { logoutUser } from '../services/userAuthApi'
import { getUserDashboard } from '../services/userDashboardApi'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function MeetingLink({ url, label }) {
  if (!url) return null
  return <a className="user-dashboard__meeting-link" href={url} target="_blank" rel="noreferrer">Open {label} ↗</a>
}

export function UserDashboardPage() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getUserDashboard(controller.signal)
      .then(setDashboard)
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        if (/authentication|required|session|account not found/i.test(requestError.message)) {
          navigate('/login?returnTo=%2Fdashboard', { replace: true })
          return
        }
        setError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [navigate])

  const signOut = async () => {
    setIsLoggingOut(true)
    try {
      await logoutUser()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  if (isLoading) {
    return <section className="user-dashboard user-dashboard--state"><p>Loading your account…</p></section>
  }

  if (error || !dashboard) {
    return (
      <section className="user-dashboard user-dashboard--state">
        <p>{error || 'Your dashboard could not be loaded.'}</p>
        <Link to="/login">Return to login</Link>
      </section>
    )
  }

  const { user, classRegistrations, deekshaSubmissions } = dashboard
  return (
    <section className="user-dashboard">
      <header className="user-dashboard__hero">
        <div>
          <p className="section-kicker">Your account</p>
          <h1>Welcome, {user.fullName}</h1>
          <p>Keep track of your online class registrations, Deeksha selections, and meeting access in one place.</p>
        </div>
        <button type="button" onClick={signOut} disabled={isLoggingOut}>{isLoggingOut ? 'Signing out…' : 'Log out'}</button>
      </header>

      <section className="user-dashboard__profile" aria-label="Account details">
        <div><span>Email</span><strong>{user.email || '—'}</strong></div>
        <div><span>WhatsApp</span><strong>{user.phone || '—'}</strong></div>
        <div><span>Location</span><strong>{[user.city, getCountryName(user.country)].filter(Boolean).join(', ') || '—'}</strong></div>
      </section>

      <section className="user-dashboard__section">
        <div className="user-dashboard__section-heading">
          <div><p className="section-kicker">Classes</p><h2>Your class registrations</h2></div>
          <Link to="/registration">Register for a class</Link>
        </div>
        {classRegistrations.length ? (
          <div className="user-dashboard__grid">
            {classRegistrations.map((registration) => (
              <article className="user-dashboard__card" key={registration.id}>
                <div className="user-dashboard__card-top">
                  <span>Registration #{registration.id}</span>
                  <b className={registration.paymentStatus === 'VERIFIED' ? 'is-verified' : 'is-pending'}>{registration.paymentStatus === 'VERIFIED' ? 'Payment verified' : 'Payment pending'}</b>
                </div>
                <h3>{registration.classTitle || 'Online class registration'}</h3>
                <p>Submitted {formatDate(registration.createdAt)} · {registration.paymentMethod === 'BANK_TRANSFER' ? 'Bank transfer' : 'UPI'}</p>
                {registration.paymentStatus === 'VERIFIED' ? (
                  registration.meetingUrl
                    ? <MeetingLink url={registration.meetingUrl} label="class meeting" />
                    : <small>Your registration is verified. The meeting link will be shared by the team shortly.</small>
                ) : <small>Meeting access will appear here after the payment is verified by our team.</small>}
              </article>
            ))}
          </div>
        ) : <p className="user-dashboard__empty">You have no class registrations in this account yet.</p>}
      </section>

      <section className="user-dashboard__section">
        <div className="user-dashboard__section-heading">
          <div><p className="section-kicker">Deeksha</p><h2>Your Deeksha selections</h2></div>
          <Link to="/deeksha">Explore Deeksha</Link>
        </div>
        {deekshaSubmissions.length ? (
          <div className="user-dashboard__grid">
            {deekshaSubmissions.map((submission) => (
              <article className="user-dashboard__card" key={submission.id}>
                <div className="user-dashboard__card-top"><span>Selection #{submission.id}</span><b className="is-selected">Submitted</b></div>
                <p>Submitted {formatDate(submission.createdAt)}</p>
                <ul className="user-dashboard__programs">
                  {(submission.selectedPrograms || []).map((program) => <li key={`${submission.id}-${program.id}`}>{program.title}</li>)}
                </ul>
                {submission.meetingLinks?.length ? (
                  <div className="user-dashboard__meeting-list">
                    {submission.meetingLinks.map((program) => <MeetingLink key={program.id} url={program.meetingUrl} label={program.title} />)}
                  </div>
                ) : <small>Your Deeksha meeting details will be shared by the team when they are available.</small>}
              </article>
            ))}
          </div>
        ) : <p className="user-dashboard__empty">You have no Deeksha selections in this account yet.</p>}
      </section>
    </section>
  )
}
