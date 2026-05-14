import PersonCard from './PersonCard.jsx'

export default function FamilyNode({ node, onCardClick, searchTerm, matches }) {
  const { person, spouse, otherSpouseLabel, children } = node
  const dim = matches && matches.size > 0 && !matches.has(person.id)

  return (
    <div className="family-node">
      <div className="couple">
        <PersonCard
          person={person}
          onClick={() => onCardClick(person)}
          searchTerm={searchTerm}
          spouseLabel={otherSpouseLabel}
          dim={dim}
        />
        {spouse && (
          <>
            <div className="heart" aria-hidden="true">♥</div>
            <PersonCard
              person={spouse}
              onClick={() => onCardClick(spouse)}
              searchTerm={searchTerm}
              dim={dim}
            />
          </>
        )}
      </div>
      {children.length > 0 && (
        <>
          <div className="connector-down" aria-hidden="true" />
          <div className="children">
            <div className="children-label" aria-hidden="true">
              أبناء
            </div>
            {children.map((child) => (
              <div className="child-branch" key={child.person.id}>
                <div className="connector-up" aria-hidden="true" />
                <FamilyNode
                  node={child}
                  onCardClick={onCardClick}
                  searchTerm={searchTerm}
                  matches={matches}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
