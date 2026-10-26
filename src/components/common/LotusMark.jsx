export function LotusMark({ size = 'default' }) {
  const className = `lotus-mark${size === 'small' ? ' lotus-mark--small' : ''}`

  return (
    <svg className={className} viewBox="0 0 92 76" aria-hidden="true">
      <path d="M46 58C32 46 30 30 46 10c16 20 14 36 0 48Z" />
      <path d="M42 62C24 58 14 46 15 26c20 5 30 18 27 36Z" />
      <path d="M50 62c18-4 28-16 27-36-20 5-30 18-27 36Z" />
      <path d="M37 65C19 68 7 60 3 45c17-2 29 5 34 20Z" />
      <path d="M55 65c18 3 30-5 34-20-17-2-29 5-34 20Z" />
      <path className="lotus-mark__line" d="M19 68c16 5 38 5 54 0" />
    </svg>
  )
}
