import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CITY_OPTIONS, findCityOption } from '../data/cities'
import { getCountryName, getCountryOptions } from '../data/countries'
import { useLanguage } from '../i18n/useLanguage'
import { getUserSession, loginUser, requestUserOtp, verifyUserOtp } from '../services/userAuthApi'

function getSafeReturnTo(value) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard'
}

export function UserAuthPage({ mode }) {
  const isRegistering = mode === 'register'
  const isResetting = mode === 'reset'
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useLanguage()
  const returnTo = useMemo(() => getSafeReturnTo(new URLSearchParams(location.search).get('returnTo')), [location.search])
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [verificationMethod, setVerificationMethod] = useState('WHATSAPP')
  const [otp, setOtp] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [deliveryDestination, setDeliveryDestination] = useState('')
  const [deliveryChannel, setDeliveryChannel] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const countryOptions = useMemo(() => getCountryOptions(language), [language])

  useEffect(() => {
    let active = true
    getUserSession()
      .then(({ user }) => {
        if (active && user) navigate(returnTo, { replace: true })
      })
      .catch(() => {})
    return () => { active = false }
  }, [navigate, returnTo])

  const requestCode = async (event) => {
    event.preventDefault()
    setError('')
    setDevOtp('')
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Your password confirmation does not match.')
      return
    }
    setIsSubmitting(true)
    try {
      const payload = await requestUserOtp({ phone, purpose: isResetting ? 'LOGIN' : 'REGISTER', fullName, email, city, country, password, verificationMethod })
      setChallengeId(payload.challengeId)
      setDeliveryDestination(payload.destination ?? payload.phone)
      setDeliveryChannel(payload.deliveryChannel)
      setDevOtp(payload.devOtp ?? '')
      setOtp('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await verifyUserOtp({ challengeId, otp })
      navigate(returnTo, { replace: true })
    } catch (verificationError) {
      setError(verificationError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const login = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await loginUser({ identifier: email, password })
      navigate(returnTo, { replace: true })
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateCity = (event) => {
    const nextCity = event.target.value
    const selectedCity = findCityOption(nextCity)
    setCity(selectedCity?.name ?? nextCity)
    if (selectedCity) setCountry(selectedCity.countryCode)
  }

  const switchPath = isRegistering || isResetting ? '/login' : '/register'
  const switchLabel = isRegistering || isResetting ? 'Back to login' : 'New here? Create an account'
  const switchHref = `${switchPath}${returnTo !== '/dashboard' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`
  const useEmailVerification = verificationMethod === 'EMAIL'

  return (
    <section className="user-auth-page">
      <div className="user-auth-page__glow" aria-hidden="true" />
      <div className="user-auth-card">
        <p className="section-kicker">Brahmam Foundation</p>
        <h1>{isRegistering ? 'Create your account' : isResetting ? 'Set your password' : 'Welcome back'}</h1>
        <p className="user-auth-card__intro">
          {isRegistering
            ? 'Create a password, then verify your account by WhatsApp in India or email anywhere in the world.'
            : isResetting ? 'Verify the WhatsApp number or email address on your account to set a new password.'
              : 'Sign in using the mobile number or email address linked to your account, together with your password.'}
        </p>

        {!isRegistering && !isResetting ? (
          <form className="user-auth-form" onSubmit={login}>
            <label>
              Mobile number or email address
              <input autoComplete="username" inputMode="email" placeholder="+91 98765 43210 or you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Password
              <span className="user-auth-form__password-row">
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" minLength="8" maxLength="128" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Hide' : 'Show'}</button>
              </span>
            </label>
            {error && <p className="user-auth-message user-auth-message--error" role="alert">{error}</p>}
            <button className="user-auth-form__submit" disabled={isSubmitting} type="submit">{isSubmitting ? 'Signing in…' : 'Log in'}</button>
            <Link className="user-auth-form__secondary" to={`/reset-password${returnTo !== '/dashboard' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}>Forgot or need to set a password?</Link>
          </form>
        ) : isResetting && !challengeId ? (
          <form className="user-auth-form" onSubmit={requestCode}>
            <label>
              {verificationMethod === 'EMAIL' ? 'Account email address' : 'Indian WhatsApp mobile number'}
              <span className="user-auth-form__otp-row">
                <input type={verificationMethod === 'EMAIL' ? 'email' : 'tel'} autoComplete="username" placeholder={verificationMethod === 'EMAIL' ? 'you@example.com' : '+91 98765 43210'} value={verificationMethod === 'EMAIL' ? email : phone} onChange={(event) => verificationMethod === 'EMAIL' ? setEmail(event.target.value) : setPhone(event.target.value)} required />
                <button className="user-auth-form__send" disabled={isSubmitting} type="submit">{isSubmitting ? 'Sending…' : 'Send OTP'}</button>
              </span>
            </label>
            <label>
              New password
              <span className="user-auth-form__password-row">
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" maxLength="128" required />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Hide' : 'Show'}</button>
              </span>
            </label>
            <label>
              Confirm new password
              <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength="8" maxLength="128" required />
            </label>
            <button className="user-auth-form__method-switch" type="button" onClick={() => setVerificationMethod((current) => current === 'EMAIL' ? 'WHATSAPP' : 'EMAIL')}>
              {verificationMethod === 'EMAIL' ? 'Use WhatsApp instead' : 'Use email instead'}
            </button>
            {error && <p className="user-auth-message user-auth-message--error" role="alert">{error}</p>}
          </form>
        ) : !challengeId ? (
          <form className="user-auth-form" onSubmit={requestCode}>
            <label>
              Full name
              <input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength="2" maxLength="120" required />
            </label>
            <label>
              Email address
              {useEmailVerification ? (
                <span className="user-auth-form__otp-row">
                  <input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} maxLength="254" required />
                  <button className="user-auth-form__send" disabled={isSubmitting} type="submit">{isSubmitting ? 'Sending…' : 'Send OTP'}</button>
                </span>
              ) : (
                <input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} maxLength="254" required />
              )}
              <small>{useEmailVerification ? 'Your verification code will be delivered by email.' : 'You can use this email address to log in later.'}</small>
            </label>
            <label>
              Password
              <span className="user-auth-form__password-row">
                <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" maxLength="128" required />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Hide' : 'Show'}</button>
              </span>
              <small>Use at least 8 characters.</small>
            </label>
            <label>
              Confirm password
              <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength="8" maxLength="128" required />
            </label>
            <div className="user-auth-form__location">
              <label>
                City
                <input autoComplete="address-level2" list="user-auth-city-options" maxLength="100" placeholder="Select or enter your city" value={city} onChange={updateCity} required />
                <datalist id="user-auth-city-options">
                  {CITY_OPTIONS.map(({ name, countryCode }) => <option value={name} label={getCountryName(countryCode, language)} key={`${countryCode}-${name}`} />)}
                </datalist>
              </label>
              <label>
                Country
                <select value={country} autoComplete="country" onChange={(event) => setCountry(event.target.value)} required>
                  <option value="">Select country</option>
                  {countryOptions.map(({ code, label }) => <option value={code} key={code}>{label}</option>)}
                </select>
              </label>
            </div>
            {!useEmailVerification ? (
              <label>
                Indian WhatsApp mobile number
                <span className="user-auth-form__otp-row">
                  <input type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" value={phone} onChange={(event) => setPhone(event.target.value)} required />
                  <button className="user-auth-form__send" disabled={isSubmitting} type="submit">{isSubmitting ? 'Sending…' : 'Send OTP'}</button>
                </span>
                <small>WhatsApp verification is available for Indian numbers.</small>
              </label>
            ) : (
              <label>
                International WhatsApp number
                <input type="tel" inputMode="tel" autoComplete="tel" placeholder="+1 555 123 4567" value={phone} onChange={(event) => setPhone(event.target.value)} required />
                <small>Include your country code. This is saved for contacting you; the OTP is sent by email.</small>
              </label>
            )}
            <button className="user-auth-form__method-switch" type="button" onClick={() => { setVerificationMethod(useEmailVerification ? 'WHATSAPP' : 'EMAIL'); setError('') }}>
              {useEmailVerification ? 'Use an Indian WhatsApp number instead' : 'Outside India? Verify by email instead'}
            </button>
            {error && <p className="user-auth-message user-auth-message--error" role="alert">{error}</p>}
          </form>
        ) : (
          <form className="user-auth-form" onSubmit={verifyCode}>
            <div className="user-auth-card__otp-notice" role="status">
              <span className="user-auth-card__otp-notice-icon" aria-hidden="true">✓</span>
              <div>
                <strong>{deliveryChannel === 'EMAIL' ? 'Check your email' : 'Check your WhatsApp'}</strong>
                <p>We sent a six-digit verification code to {deliveryDestination}.</p>
              </div>
            </div>
            <label>
              Verification code
              <input className="user-auth-form__otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus />
            </label>
            {devOtp && <p className="user-auth-message user-auth-message--development">Local development code: <strong>{devOtp}</strong></p>}
            {error && <p className="user-auth-message user-auth-message--error" role="alert">{error}</p>}
            <button className="user-auth-form__submit" disabled={isSubmitting || otp.length !== 6} type="submit">{isSubmitting ? 'Verifying…' : 'Verify and continue'}</button>
            <button className="user-auth-form__secondary" type="button" onClick={() => { setChallengeId(''); setOtp(''); setError('') }}>Use a different contact method</button>
          </form>
        )}

        <Link className="user-auth-card__switch" to={switchHref}>{switchLabel}</Link>
      </div>
    </section>
  )
}
