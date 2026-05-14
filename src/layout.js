// Pure tree-building. Input: people[]. Output: forest of nodes ready to render.
//
// Each node: { person, spouse, otherSpouseLabel, children: node[] }
//   - spouse: an "outsider" co-parent (no parents in dataset) shown inline.
//     If null, the partner is shown elsewhere in the tree, so we surface a label instead.
//   - otherSpouseLabel: the in-system partner's name, when spouse is null but a partner exists.

const byBirth = (a, b) => (a.birthYear || 9999) - (b.birthYear || 9999)

function hasParentInDataset(person, byId) {
  return (
    (person.fatherId && byId.has(person.fatherId)) ||
    (person.motherId && byId.has(person.motherId))
  )
}

// Returns the set of co-parent IDs (other parent of any shared child) for a person.
function coParentIds(person, people) {
  const ids = new Set()
  for (const c of people) {
    if (c.fatherId === person.id && c.motherId) ids.add(c.motherId)
    if (c.motherId === person.id && c.fatherId) ids.add(c.fatherId)
  }
  return ids
}

export function buildTree(people) {
  const byId = new Map(people.map((p) => [p.id, p]))

  // Pass 1: pick an "inline spouse" for each person where possible.
  // Inline spouse = co-parent with no parents in the dataset, so they have nowhere else to render.
  // Each person can be inlined at most once to avoid double-rendering.
  const inlineSpouseOf = new Map()
  const isInlinedSpouse = new Set()
  for (const p of people) {
    if (isInlinedSpouse.has(p.id)) continue
    for (const coId of coParentIds(p, people)) {
      const co = byId.get(coId)
      if (!co) continue
      if (isInlinedSpouse.has(co.id)) continue
      if (hasParentInDataset(co, byId)) continue
      inlineSpouseOf.set(p.id, co)
      isInlinedSpouse.add(co.id)
      break
    }
  }

  // For "Married to: X" label when the partner is rendered in their own parents' branch.
  function inSystemPartnerLabel(person) {
    for (const coId of coParentIds(person, people)) {
      const co = byId.get(coId)
      if (!co) continue
      if (hasParentInDataset(co, byId)) return co.nameAr || co.nameEn || ''
    }
    return null
  }

  function buildNode(person) {
    const spouse = inlineSpouseOf.get(person.id) || null

    const childIds = new Set()
    for (const c of people) {
      if (c.fatherId === person.id || c.motherId === person.id) childIds.add(c.id)
      if (spouse && (c.fatherId === spouse.id || c.motherId === spouse.id)) childIds.add(c.id)
    }
    const children = [...childIds]
      .map((id) => byId.get(id))
      .filter((c) => c && !isInlinedSpouse.has(c.id))
      .sort(byBirth)

    return {
      person,
      spouse,
      otherSpouseLabel: spouse ? null : inSystemPartnerLabel(person),
      children: children.map(buildNode),
    }
  }

  const roots = people
    .filter((p) => !hasParentInDataset(p, byId) && !isInlinedSpouse.has(p.id))
    .sort(byBirth)

  return roots.map(buildNode)
}

// Walk the tree and return ids of nodes whose subtree contains a name match.
// Used to auto-expand branches around search hits (and dim non-matches if we want).
export function findMatches(forest, term) {
  if (!term) return new Set()
  const needle = term.trim().toLowerCase()
  if (!needle) return new Set()
  const hits = new Set()
  function visit(node) {
    let childMatch = false
    for (const c of node.children) {
      if (visit(c)) childMatch = true
    }
    const name = (node.person.nameAr || '') + ' ' + (node.person.nameEn || '')
    const spouseName = node.spouse
      ? (node.spouse.nameAr || '') + ' ' + (node.spouse.nameEn || '')
      : ''
    const self = name.toLowerCase().includes(needle) || spouseName.toLowerCase().includes(needle)
    if (self || childMatch) {
      hits.add(node.person.id)
      return true
    }
    return false
  }
  forest.forEach(visit)
  return hits
}
