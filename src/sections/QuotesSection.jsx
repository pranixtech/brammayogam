import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/useLanguage'
import { getQuoteImage, subscribeToQuoteImage } from '../services/guruContentApi'

export function QuotesSection() {
  const [quoteImage, setQuoteImage] = useState(null)
  const { t } = useLanguage()

  useEffect(() => {
    let controller
    const loadImage = () => {
      controller?.abort()
      controller = new AbortController()
      getQuoteImage(controller.signal)
        .then((payload) => setQuoteImage(payload.quoteImage))
        .catch((error) => {
          if (error.name !== 'AbortError') setQuoteImage(null)
        })
    }
    loadImage()
    const unsubscribe = subscribeToQuoteImage(loadImage)
    return () => {
      controller?.abort()
      unsubscribe()
    }
  }, [])

  if (!quoteImage) return null
  return (
    <section className="quotes-section section-padding" aria-labelledby="quotes-title">
      <header className="quotes-section__header">
        <p className="section-kicker">{t('guruContent.quotesKicker')}</p>
        <h2 id="quotes-title">{t('guruContent.quotesTitle')}</h2>
      </header>
      <figure className="quotes-section__image"><img src={quoteImage.image} alt={t('guruContent.quotesAlt')} /></figure>
    </section>
  )
}
