import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Catch the most common cause of "Invalid API key" errors at startup —
// env vars missing or empty. The server-side rejection (wrong/stale key,
// project paused) surfaces on the first request and is shown via App.jsx's
// error state and Toast.
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(', ')
  throw new Error(
    `Supabase env vars missing: ${missing}. ` +
      `Create a .env file in the project root with both values, then restart "npm run dev".`,
  )
}

// In dev only, log a redacted view so you can confirm Vite loaded the values
// you expect (without dumping the whole key into the console).
if (import.meta.env.DEV) {
  const redactedKey =
    supabaseAnonKey.length > 16
      ? `${supabaseAnonKey.slice(0, 12)}…${supabaseAnonKey.slice(-4)} (${supabaseAnonKey.length} chars)`
      : '[too short — looks malformed]'
  // eslint-disable-next-line no-console
  console.log('[supabase] URL:', supabaseUrl)
  // eslint-disable-next-line no-console
  console.log('[supabase] key:', redactedKey)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const fromDb = (row) => ({
  id: row.id,
  nameAr: row.name_ar,
  nameEn: row.name_en,
  fatherId: row.father_id,
  motherId: row.mother_id,
  spouseId: row.spouse_id,
  gender: row.gender,
  birthYear: row.birth_year,
  deathYear: row.death_year,
  city: row.city,
  notes: row.notes,
  createdAt: row.created_at,
})

// death_year is intentionally omitted: the UI no longer collects it,
// and leaving it out of the payload means UPDATE won't overwrite values
// that already exist in the database from before the redesign.
export const toDb = (person) => ({
  id: person.id,
  name_ar: person.nameAr,
  name_en: person.nameEn,
  father_id: person.fatherId || null,
  mother_id: person.motherId || null,
  spouse_id: person.spouseId || null,
  gender: person.gender,
  birth_year: person.birthYear || null,
  city: person.city || null,
  notes: person.notes || null,
})
