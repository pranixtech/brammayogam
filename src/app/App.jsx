import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { WhatsAppButton } from '../components/common/WhatsAppButton'
import { ComingSoonPage } from '../pages/ComingSoonPage'
import { AdminPage } from '../pages/AdminPage'
import { BioPage } from '../pages/BioPage'
import { FeedbackPage } from '../pages/FeedbackPage'
import { HomePage } from '../pages/HomePage'
import { PhotosPage } from '../pages/PhotosPage'
import { RegistrationPage } from '../pages/RegistrationPage'
import { VideosPage } from '../pages/VideosPage'
import { YogamPage } from '../pages/YogamPage'
import { useLanguage } from '../i18n/useLanguage'

const PAGE_TITLE_KEYS = {
  '/class': 'class', '/registration': 'registration', '/feedback': 'feedback', '/deeksha': 'deeksha',
  '/book': 'book', '/photos': 'photos', '/videos': 'videos', '/yogam': 'yogam', '/bio': 'bio',
}

export default function App() {
  const { hash, pathname } = useLocation()
  const { language, t } = useLanguage()
  const isAdminPage = pathname === '/admin'

  useEffect(() => {
    if (isAdminPage) document.title = 'Admin | Brahmam Foundation'
    else if (pathname === '/') document.title = language === 'ta' ? 'பிரம்மம் அறக்கட்டளை | அகப்பயணப் பாதை' : 'Brahmam Foundation | The Inward Path'
    else document.title = `${t(`navigation.${PAGE_TITLE_KEYS[pathname]}`)} | ${language === 'ta' ? 'பிரம்மம் அறக்கட்டளை' : 'Brahmam Foundation'}`

    if (hash) {
      window.requestAnimationFrame(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView()
      })
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [hash, isAdminPage, language, pathname, t])

  return (
    <div className="site-shell">
      {!isAdminPage && <Header forceSolid={pathname !== '/'} />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bio" element={<BioPage />} />
          <Route path="/class" element={<ComingSoonPage titleKey="class" action={{ href: '/registration', labelKey: 'comingSoon.register' }} />} />
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/deeksha" element={<ComingSoonPage titleKey="deeksha" />} />
          <Route path="/book" element={<ComingSoonPage titleKey="book" />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/yogam" element={<YogamPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminPage && <Footer />}
      {!isAdminPage && <WhatsAppButton />}
    </div>
  )
}
