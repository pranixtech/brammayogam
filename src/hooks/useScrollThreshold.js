import { useEffect, useState } from 'react'

export function useScrollThreshold(threshold = 24) {
  const [hasCrossedThreshold, setHasCrossedThreshold] = useState(false)

  useEffect(() => {
    const updateScrollState = () => {
      setHasCrossedThreshold(window.scrollY > threshold)
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })

    return () => window.removeEventListener('scroll', updateScrollState)
  }, [threshold])

  return hasCrossedThreshold
}
