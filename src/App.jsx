import { useEffect, useMemo, useState } from 'react'
import { supabase, fromDb, toDb } from './supabase.js'
import { buildTree, findMatches } from './layout.js'
import FamilyNode from './components/FamilyNode.jsx'
import PersonModal from './components/PersonModal.jsx'
import Toast from './components/Toast.jsx'

const NEW_PERSON = {
  id: null,
  nameAr: '',
  nameEn: '',
  gender: 'male',
  fatherId: null,
  motherId: null,
  spouseId: null,
  birthYear: '',
  city: '',
  notes: '',
}

export default function App() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // person object or null
  const [toast, setToast] = useState('')

  // Initial load
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('people').select('*')
      if (cancelled) return
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setPeople((data || []).map(fromDb))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel('public:people')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'people' },
        (payload) => {
          setPeople((prev) => {
            if (payload.eventType === 'INSERT') {
              const incoming = fromDb(payload.new)
              if (prev.some((p) => p.id === incoming.id)) return prev
              return [...prev, incoming]
            }
            if (payload.eventType === 'UPDATE') {
              const updated = fromDb(payload.new)
              return prev.map((p) => (p.id === updated.id ? updated : p))
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((p) => p.id !== payload.old.id)
            }
            return prev
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const forest = useMemo(() => buildTree(people), [people])
  const matches = useMemo(() => findMatches(forest, search), [forest, search])

  const onCardClick = (person) => setEditing(person)
  const onAddClick = () => setEditing({ ...NEW_PERSON })

  // Bidirectional spouse_id: when A.spouseId changes, also clear the old
  // partner's link and set the new partner's link to A. Fire-and-forget after
  // the main save lands — realtime will sync the partner's row to other tabs.
  const syncSpouseLink = async (personId, previousSpouseId, newSpouseId) => {
    if (previousSpouseId === newSpouseId) return
    if (previousSpouseId) {
      await supabase
        .from('people')
        .update({ spouse_id: null })
        .eq('id', previousSpouseId)
        .eq('spouse_id', personId)
    }
    if (newSpouseId) {
      await supabase.from('people').update({ spouse_id: personId }).eq('id', newSpouseId)
    }
  }

  const onSave = async (form) => {
    const isNew = !form.id
    const id = form.id || crypto.randomUUID()
    const payload = toDb({ ...form, id })
    const previousSpouseId = isNew ? null : people.find((p) => p.id === id)?.spouseId ?? null

    if (isNew) {
      const optimistic = fromDb(payload)
      setPeople((p) => [...p, optimistic])
      setEditing(null)
      const { error } = await supabase.from('people').insert(payload)
      if (error) {
        setPeople((p) => p.filter((x) => x.id !== optimistic.id))
        setToast('فشل الحفظ: ' + error.message)
        return
      }
      await syncSpouseLink(id, null, form.spouseId || null)
      setToast('تمت الإضافة')
    } else {
      const prev = people.find((p) => p.id === id)
      const optimistic = fromDb(payload)
      setPeople((p) => p.map((x) => (x.id === optimistic.id ? optimistic : x)))
      setEditing(null)
      const { error } = await supabase.from('people').update(payload).eq('id', id)
      if (error) {
        if (prev) setPeople((p) => p.map((x) => (x.id === prev.id ? prev : x)))
        setToast('فشل الحفظ: ' + error.message)
        return
      }
      await syncSpouseLink(id, previousSpouseId, form.spouseId || null)
      setToast('تم الحفظ')
    }
  }

  const onDelete = async (id) => {
    const prev = people.find((p) => p.id === id)
    setPeople((p) => p.filter((x) => x.id !== id))
    setEditing(null)
    const { error } = await supabase.from('people').delete().eq('id', id)
    if (error) {
      if (prev) setPeople((p) => [...p, prev])
      setToast('فشل الحذف: ' + error.message)
    } else {
      setToast('تم الحذف')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>🌳 شجرة العائلة</h1>
          <button className="btn btn-primary" onClick={onAddClick}>
            + إضافة
          </button>
        </div>
        <input
          type="search"
          className="search-input"
          placeholder="ابحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <main className="app-main">
        {loading && <div className="status">جاري التحميل...</div>}
        {error && <div className="status error">خطأ: {error}</div>}
        {!loading && !error && people.length === 0 && (
          <div className="status">
            لا يوجد أشخاص بعد.
            <br />
            اضغط على <strong>+ إضافة</strong> للبدء.
          </div>
        )}
        {!loading && !error && forest.length > 0 && (
          <div className="forest">
            {forest.map((root) => (
              <FamilyNode
                key={root.person.id}
                node={root}
                onCardClick={onCardClick}
                searchTerm={search}
                matches={matches}
              />
            ))}
          </div>
        )}
      </main>

      {editing && (
        <PersonModal
          person={editing}
          allPeople={people}
          onSave={onSave}
          onDelete={onDelete}
          onClose={() => setEditing(null)}
        />
      )}

      <Toast message={toast} onDismiss={() => setToast('')} />
    </div>
  )
}
