# 🌳 شجرة العائلة · Family Tree

A mobile-first Arabic family tree web app. Built to be **boringly reliable** on the cheapest Android phone your aunt owns, not impressively clever on a 4K monitor.

> *"Make it boringly reliable, not cleverly broken."*

---

## Why this exists

The previous version of this app was a beautiful, broken thing — an SVG canvas with transform-based pan/zoom, pointer events, and a layout engine that auto-positioned cards in space. On desktop it looked great. On phones it showed a blank screen, demanded refreshes, only ever rendered the father's side of the family, and silently swallowed mothers and spouses. Real family members aged 25 to 70 were giving up and texting screenshots of how the app was broken.

So it got thrown out and rebuilt from scratch on a different principle: **no viewport math, no transforms, no canvas, no clever positioning.** Just native scroll, flexbox, CSS borders, and a recursive React component. The result is uglier in a vacuum and far more reliable on the device that matters.

---

## ✨ Features

- 👨‍👩‍👧‍👦 **Both parents tracked** — every person has `father_id` *and* `mother_id`; the tree walks both
- 💞 **Spouses inferred from shared children** — no schema change needed; outsider spouses render inline with `♥`, in-system spouses get a "Married to" label
- 📱 **Mobile-first vertical tree** — vertical stack with an indentation rail and per-generation "أبناء" labels below 600px; side-by-side couples above 600px
- 🔄 **Real-time multi-user sync** — Supabase Realtime channel; edits propagate to other open tabs within ~1 second
- 🔍 **Live search with subtree highlighting** — type a name, matches stay sharp, non-matches dim
- 🌐 **Arabic-first RTL UI** — Cairo font, right-to-left layout, all UI text in Arabic
- 🚀 **Optimistic CRUD** — instant local updates with automatic rollback if the server rejects
- ☠️ **Deceased states** — `†` symbol, reduced opacity, year ranges
- 🔓 **No login required** — public editing (anonymous Supabase access with RLS as the security boundary)

---

## 🏗️ Tech Stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 18 + Vite 8 | Fast dev loop, tiny prod bundle (~100 KB gzipped) |
| Styling | Hand-written CSS with logical properties | Mobile-first, RTL-safe (`inset-inline-*`, `border-inline-start`), no Tailwind |
| Backend | Supabase (PostgreSQL + Realtime) | Hosted, free tier, postgres realtime is excellent |
| Hosting | Vercel | Auto-deploy on `git push`, free tier, sane defaults for Vite |
| Fonts | Google Fonts — Cairo 400/600/700/800 | Best free Arabic webfont |

No state library, no routing library, no UI kit, no Tailwind. ~750 lines of source code total.

---

## 🧠 Architecture Highlights

### The layout engine is a pure function

[`src/layout.js`](src/layout.js) takes a flat `people[]` array and returns a forest of tree nodes:

```js
{ person, spouse, otherSpouseLabel, children: [...] }
```

No mutation, no React, no DOM. Easy to test, easy to reason about, easy to swap.

The interesting rule is "render each person exactly once":

1. For every person, find their co-parents (other parent of any shared child).
2. If a co-parent has no parents in the dataset, they're an *outsider spouse* — render them **inline** next to their partner. Mark them as "inlined" so they don't get rendered elsewhere.
3. If a co-parent has parents in the dataset, they'll render in their *own* parents' branch — show "Married to X" in the card instead.

This handles the common cases (a son brings a wife from outside the family) without exploding the layout when both partners come from inside the tree.

### The mobile layout is unambiguous by construction

The original app's mobile bug — children appearing under the wrong parent — happened because `flex-wrap: wrap` caused siblings to wrap onto separate rows. When a wrapped child has their *own* children below them, the grandchildren end up visually adjacent to the wrong uncle. The eye groups by proximity, and proximity was lying.

The fix lives in a single CSS block, [`@media (max-width: 599px)`](src/App.css). Below 600px:

- `.couple` switches to `flex-direction: column` (father card, ♥, mother card)
- `.children` switches to `flex-direction: column; flex-wrap: nowrap`
- `.children` gets `border-inline-start: 3px solid` and `padding-inline-start: 14px` — every generation deeper inherits another rail, RTL-correct on the right side of the screen
- An "أبناء" pill sits on the rail as a section header

There is **no horizontal positioning at all** on mobile. So there is no ambiguity to misread.

### The card component does one thing

[`src/components/PersonCard.jsx`](src/components/PersonCard.jsx) is a clickable button — not a div with click handlers — for free keyboard and screen-reader accessibility. It does only display logic: highlights the search term inline with `<mark>`, applies `dim` when search is active, applies `deceased` for the `†` symbol and reduced opacity, switches color tokens based on gender. No business logic in here.

### Realtime sync with optimistic updates

[`src/App.jsx`](src/App.jsx) subscribes to `postgres_changes` on the `people` table:

```js
supabase
  .channel('public:people')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, handler)
  .subscribe()
```

On save/delete, the app updates local state *first* (optimistic), then sends the request to Supabase. If the server rejects, the local change is rolled back and a toast shows the error. Incoming realtime events are deduped against the optimistic state so you never see your own change twice.

### Mobile-first CSS, desktop additions on top

The base stylesheet is the mobile experience. Desktop is added via `@media (min-width: ...)` overrides:

- Base styles → optimized for 375px portrait
- `@media (min-width: 640px)` → larger header padding, centered modal instead of bottom sheet
- `@media (min-width: 1024px)` → slightly narrower cards (260px) to fit more on screen

This means a phone never downloads or executes CSS it doesn't need.

---

## 📂 Project Structure

```
familytree/
├─ index.html              RTL <html dir="rtl">, Cairo font preloaded
├─ vite.config.js
├─ package.json
├─ .env.example            Template — copy to .env locally
├─ test-connection.js      Standalone Node script: node --env-file=.env test-connection.js
└─ src/
   ├─ main.jsx             ReactDOM root
   ├─ App.jsx              Top-level state, realtime channel, search, CRUD
   ├─ App.css              All styles, mobile-first + RTL-safe
   ├─ supabase.js          Client, env validation, dev-only redacted logs
   ├─ layout.js            Pure tree-builder (people[] → forest)
   └─ components/
      ├─ PersonCard.jsx
      ├─ FamilyNode.jsx    Recursive couple + children renderer
      ├─ PersonModal.jsx   Add/edit form with parent autocomplete
      └─ Toast.jsx
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.6+ (for `node --env-file=...`)
- A Supabase project with a `people` table

### Local setup

```bash
git clone https://github.com/aalrehan/family-tree.git
cd family-tree
npm install
cp .env.example .env
# Fill in your Supabase URL and publishable key in .env
npm run dev
```

Open http://localhost:5173. The dev server prints a network URL too — open that on your phone over the same Wi-Fi to test mobile.

### Sanity-check the Supabase connection

```bash
node --env-file=.env test-connection.js
```

Prints a clean diagnosis of what's wired up and what isn't. Useful when "Invalid API key" appears in the browser and you need to isolate where in the chain it's breaking.

### Database schema

The `people` table:

| column | type | notes |
|---|---|---|
| id | uuid (PK) | client generates via `crypto.randomUUID()` |
| name_ar | text | required |
| name_en | text | optional |
| father_id | uuid (FK → people.id) | nullable |
| mother_id | uuid (FK → people.id) | nullable |
| gender | text (`male` / `female`) | |
| birth_year | int | nullable |
| death_year | int | nullable; triggers `†` |
| city | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | default `now()` |

Realtime must be enabled on the `people` table in the Supabase dashboard for the live-sync feature to work.

---

## 🌍 Deployment

Auto-deployed via Vercel. Every `git push` to `main` triggers a fresh build.

To deploy your own copy:

1. Fork or clone this repo
2. https://vercel.com/new → Import the repo (auto-detects Vite)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click Deploy

---

## 🔐 A note on security

The `VITE_SUPABASE_ANON_KEY` is designed to be public — it ships in every browser bundle. **It is not a secret.** What stops anyone with the key from wiping your `people` table is your Supabase **Row Level Security** policies. Configure them before going live with real data. The `sb_secret_*` key, on the other hand, must never appear in any `VITE_`-prefixed env var.

---

## 📜 License

MIT.
