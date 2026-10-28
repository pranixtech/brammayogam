import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import './styles/index.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/sections.css'
import './styles/activities.css'
import './styles/forms.css'
import './styles/responsive.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
