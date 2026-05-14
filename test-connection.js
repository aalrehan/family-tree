// Standalone Supabase connection test.
// Run with: node --env-file=.env test-connection.js
//
// Prints a clear diagnosis of what's working and what isn't, without
// touching the React app. Useful when "Invalid API key" appears in
// the browser and you need to isolate where in the chain it's breaking.

import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

console.log('--- environment ---')
console.log('URL:', url || '[MISSING]')
console.log(
  'key:',
  key
    ? `${key.slice(0, 12)}…${key.slice(-4)} (${key.length} chars)`
    : '[MISSING]',
)

if (!url || !key) {
  console.error(
    '\n[FAIL] Env vars not loaded. Either .env is missing values, or you forgot --env-file=.env',
  )
  process.exit(1)
}

const supabase = createClient(url, key)

console.log('\n--- query: select count(*) from people ---')
const { data, error, count } = await supabase
  .from('people')
  .select('*', { count: 'exact', head: true })

if (error) {
  console.error('[FAIL] Supabase rejected the request:')
  console.error('  message:', error.message)
  console.error('  code:   ', error.code)
  console.error('  hint:   ', error.hint || '(none)')
  console.error('  details:', error.details || '(none)')
  console.error('\nCommon causes:')
  console.error("  - 'Invalid API key' → key was rotated. Get a fresh one from Supabase dashboard → Settings → API.")
  console.error("  - 'JWT expired'     → same fix; rotate or grab the current key.")
  console.error("  - 'relation \"people\" does not exist' → wrong project, or table not created.")
  console.error("  - network error     → project may be paused (check Supabase dashboard).")
  process.exit(1)
}

console.log(`[OK] Connected. people table has ${count} row(s).`)
process.exit(0)
