function highlight(text, term) {
  if (!term) return text
  const i = text.toLowerCase().indexOf(term.toLowerCase())
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  )
}

export default function PersonCard({
  person,
  onClick,
  searchTerm = '',
  spouseLabel = null,
  dim = false,
}) {
  const name = person.nameAr || person.nameEn || '—'
  const initial = (name.trim()[0] || '?').toUpperCase()
  const isFemale = person.gender === 'female'
  const isDeceased = !!person.deathYear

  const years = person.birthYear
    ? person.deathYear
      ? `${person.birthYear} – ${person.deathYear}`
      : `${person.birthYear}`
    : person.deathYear
    ? `† ${person.deathYear}`
    : ''

  const cls = [
    'person-card',
    isFemale ? 'female' : 'male',
    isDeceased && 'deceased',
    dim && 'dim',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={cls} onClick={onClick}>
      <div className="avatar" aria-hidden="true">
        {initial}
      </div>
      <div className="card-body">
        <div className="card-name">
          {isDeceased && <span className="dagger">† </span>}
          {highlight(name, searchTerm)}
        </div>
        <div className="card-meta">
          <span className="gender-icon">{isFemale ? '♀' : '♂'}</span>
          {years && <span>{years}</span>}
          {person.city && <span>{person.city}</span>}
        </div>
        {spouseLabel && (
          <div className="card-spouse-label">
            <span>زوج/زوجة:</span> {spouseLabel}
          </div>
        )}
        {person.notes && <div className="card-notes">{person.notes}</div>}
      </div>
    </button>
  )
}
