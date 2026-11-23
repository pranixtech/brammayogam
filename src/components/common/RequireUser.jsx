import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getUserSession } from '../../services/userAuthApi'

export function RequireUser({ children }) {
  const location = useLocation()
  const [state, setState] = useState('loading')

  useEffect(() => {
    let active = true
    getUserSession()
      .then(() => { if (active) setState('signed-in') })
      .catch(() => { if (active) setState('signed-out') })
    return () => { active = false }
  }, [location.pathname])

  if (state === 'loading') return <section className="user-auth-page"><p role="status">Checking your account…</p></section>
  if (state === 'signed-out') {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }
  return children
}
