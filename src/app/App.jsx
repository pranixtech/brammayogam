import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { ComingSoonPage } from '../pages/ComingSoonPage'
import { AdminPage } from '../pages/AdminPage'
import { FeedbackPage } from '../pages/FeedbackPage'
import { HomePage } from '../pages/HomePage'
import { PhotosPage } from '../pages/PhotosPage'
import { RegistrationPage } from '../pages/RegistrationPage'
import { VideosPage } from '../pages/VideosPage'
import { YogamPage } from '../pages/YogamPage'

const PAGE_TITLES = {
  '/': 'Brahmam Foundation | The Inward Path',
  '/class': 'Class | Brahmam Foundation',
  '/registration': 'Online Class Registration | Brahmam Foundation',
  '/feedback': 'Feedback | Brahmam Foundation',
  '/deeksha': 'Deeksha | Brahmam Foundation',
  '/book': 'Book | Brahmam Foundation',
  '/photos': 'Photos | Brahmam Foundation',
  '/videos': 'Videos | Brahmam Foundation',
  '/yogam': 'யோகம் | Brahmam Foundation',
  '/admin': 'Admin | Brahmam Foundation',
}

export default function App() {
  const { hash, pathname } = useLocation()
  const isAdminPage = pathname === '/admin'

  useEffect(() => {
    document.title = PAGE_TITLES[pathname] ?? PAGE_TITLES['/']

    if (hash) {
      window.requestAnimationFrame(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView()
      })
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [hash, pathname])

  return (
    <div className="site-shell">
      {!isAdminPage && <Header forceSolid={pathname !== '/'} />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/class" element={<ComingSoonPage title="Class" action={{ href: '/registration', label: 'Register for online classes' }} />} />
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/deeksha" element={<ComingSoonPage title="Deeksha" />} />
          <Route path="/book" element={<ComingSoonPage title="Book" />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/yogam" element={<YogamPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminPage && <Footer />}
    </div>
  )
}
