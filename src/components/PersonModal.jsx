import { useEffect, useMemo, useState } from 'react'

const EMPTY = {
  id: null,
  nameAr: '',
  nameEn: '',
  gender: 'male',
  fatherId: null,
  motherId: null,
  birthYear: '',
  deathYear: '',
  city: '',
  notes: '',
}

export default function PersonModal({ person, allPeople, onSave, onDelete, onClose }) {
  const isNew = !person?.id
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(person || {}) }))
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setForm({ ...EMPTY, ...(person || {}) })
    setConfirming(false)
  }, [person])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.nameAr?.trim() && !form.nameEn?.trim()) return
    onSave({
      ...form,
      birthYear: form.birthYear ? Number(form.birthYear) : null,
      deathYear: form.deathYear ? Number(form.deathYear) : null,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <form onSubmit={submit}>
          <header className="modal-header">
            <h2>{isNew ? 'إضافة شخص' : 'تعديل'}</h2>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="إغلاق"
            >
              ×
            </button>
          </header>

          <div className="modal-body">
            <label>
              الاسم بالعربية
              <input
                type="text"
                value={form.nameAr || ''}
                onChange={set('nameAr')}
                autoFocus
                required
              />
            </label>

            <label>
              الاسم بالإنجليزية
              <input type="text" value={form.nameEn || ''} onChange={set('nameEn')} dir="ltr" />
            </label>

            <label>
              الجنس
              <select value={form.gender || 'male'} onChange={set('gender')}>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </label>

            <ParentPicker
              label="الأب"
              allPeople={allPeople}
              value={form.fatherId}
              onChange={(id) => setForm((f) => ({ ...f, fatherId: id }))}
              gender="male"
              excludeId={form.id}
            />

            <ParentPicker
              label="الأم"
              allPeople={allPeople}
              value={form.motherId}
              onChange={(id) => setForm((f) => ({ ...f, motherId: id }))}
              gender="female"
              excludeId={form.id}
            />

            <div className="form-row">
              <label>
                سنة الميلاد
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.birthYear || ''}
                  onChange={set('birthYear')}
                />
              </label>
              <label>
                سنة الوفاة
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.deathYear || ''}
                  onChange={set('deathYear')}
                />
              </label>
            </div>

            <label>
              المدينة
              <input type="text" value={form.city || ''} onChange={set('city')} />
            </label>

            <label>
              ملاحظات
              <textarea value={form.notes || ''} onChange={set('notes')} rows={3} />
            </label>
          </div>

          <footer className="modal-footer">
            <button type="submit" className="btn btn-primary">
              حفظ
            </button>
            {!isNew &&
              (confirming ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onDelete(form.id)}
                >
                  تأكيد الحذف
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger-outline"
                  onClick={() => setConfirming(true)}
                >
                  حذف
                </button>
              ))}
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              إلغاء
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

function ParentPicker({ label, allPeople, value, onChange, gender, excludeId }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const selected = allPeople.find((p) => p.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allPeople
      .filter((p) => p.id !== excludeId && p.gender === gender)
      .filter((p) => {
        if (!q) return true
        const name = ((p.nameAr || '') + ' ' + (p.nameEn || '')).toLowerCase()
        return name.includes(q)
      })
      .slice(0, 20)
  }, [allPeople, query, gender, excludeId])

  return (
    <label className="parent-picker">
      {label}
      {selected ? (
        <div className="picker-selected">
          <span>{selected.nameAr || selected.nameEn}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onChange(null)}
            aria-label="إزالة"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="picker-wrap">
          <input
            type="text"
            value={query}
            placeholder="ابحث بالاسم..."
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
          />
          {open && filtered.length > 0 && (
            <div className="picker-dropdown">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="picker-option"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChange(p.id)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  <span>{p.nameAr || p.nameEn}</span>
                  {p.birthYear && <small>({p.birthYear})</small>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </label>
  )
}
