# LAST FREE DAY — Bingo Kawalerskie 3D (Malta)

Zbudowane wg `BRIEF_1.md`, fazami (patrz §13). **Wszystkie 8 faz ukończone.**

## Uruchomienie lokalnie

```bash
npm install
npm run dev
```

Aplikacja **działa od razu bez Supabase** — bez zmiennych środowiskowych
`NEXT_PUBLIC_SUPABASE_*` cały stan gry trzyma się w pamięci przeglądarki
(`localStorage`, tryb `local` w `useGameStore`). To pełny tryb demo: kod
dostępu z gry (`gate/page.tsx`) to `MALTA26`, wszystkie 16 zadań, obie areny
i WRAPPED działają, tylko `/live` nie synchronizuje się między urządzeniami
(czyta ten sam local store, więc działa tylko w obrębie jednej przeglądarki)
i kolejka offline (§11) nie ma z czym się synchronizować (nie ma backendu,
do którego wysyłać).

## Podłączenie prawdziwego Supabase

1. Załóż projekt na [supabase.com](https://supabase.com), region **EU
   (Frankfurt)** (BRIEF §1 — najniższe opóźnienia z Malty).
2. Wykonaj SQL z `supabase/migrations/0001_init.sql` w SQL Editorze (albo
   `supabase db push`, jeśli masz zainstalowane Supabase CLI).
3. Wykonaj `supabase/seed.sql` — wgrywa 16 zadań i 2 areny.
4. Skopiuj `.env.example` do `.env.local` i uzupełnij:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ADMIN_RESET_CODE=123456   # 6 cyfr, do /admin/danger
   ```
5. Załóż **jedno** konto admina: Supabase Dashboard → Authentication →
   Users → Add user (email + hasło). Samodzielna rejestracja jest wyłączona
   (`enable_signup = false` w `supabase/config.toml`) — to nie jest system
   wielu kont.
6. Restart `npm run dev` — od tej pory `useGameStore` wchodzi w tryb
   `"supabase"`: `/board`, `/live`, `/tile/[id]`, `/wrapped` czytają dane
   serwerowo (`lib/data/board.ts`, `lib/data/wrapped.ts`), mutacje idą przez
   Server Actions z `service_role` (`lib/actions/*`), `/board` i `/live`
   dostają zmiany w czasie rzeczywistym przez Supabase Realtime
   (`useRealtimeGame`), a `/admin/*` jest chroniony middleware'em
   sprawdzającym sesję Supabase Auth (`src/middleware.ts`).
7. Opcjonalnie: `ELEVENLABS_API_KEY=... npx tsx scripts/generate-voiceovers.ts`
   pre-generuje lektora dla wszystkich 16 zadań (BRIEF §9). Bez tego karta
   zadania czyta treść przez Web Speech API (`pl-PL`) — zawsze działa, za
   darmo, tylko głosem systemowym.

W widoku zadania nadal jest tymczasowy `<details>` "dev: symuluj admina" —
woła te same Server Actions co `/admin/dashboard`, przydatny do testowania
bez telefonu admina pod ręką.

**Nie testowałem środowiska Supabase na żywo** — brak tu Dockera do
lokalnego `supabase start` i nie mam Twojego projektu ani konta admina. Kod
jest kompletny i przechodzi `tsc`/`build`/`lint`, ale realny test na Twoim
projekcie (logowanie, uploady, realtime na dwóch urządzeniach naraz) to
pierwsza rzecz do zrobienia po wpięciu kluczy. Podobnie nie testowałem na
fizycznym telefonie (BRIEF §15) — tylko w headless Chromium z emulowanym
viewportem 390×844 i throttlingiem sieci przez Playwright.

## Czego świadomie nie zbudowano

- **Podkład muzyczny w WRAPPED** (BRIEF §5.5, "jeśli dodasz plik") — nie mam
  pliku audio do dodania; przełącznik wyciszenia (`useAudioStore`) już
  istnieje i obejmie muzykę, gdy plik się pojawi w `public/audio/`.
- **Web Push** dla powiadomień admina o nowym dowodzie (BRIEF §8.1) — dźwięk
  + odznaka działają od razu (`useAdminRealtime`), ale prawdziwe push
  notifications przy zamkniętej karcie wymagają service workera z obsługą
  `push`/VAPID keys, co jest nieproporcjonalnym nakładem na jednodniowe
  wydarzenie z jednym adminem, który i tak będzie miał dashboard otwarty.
- **Twarze gości w Pokusie** — brief dopuszcza upload zdjęć znajomych, ale
  nie definiuje do tego żadnego ekranu w panelu admina (tylko upload twarzy
  pana młodego/narzeczonej). Pokusa używa proceduralnych awatarów dla
  wszystkich pokus zawsze — zgodnie z wymogiem "gra musi być grywalna
  zanim ktokolwiek cokolwiek wgra".

## Struktura

Patrz `BRIEF_1.md` §12 dla docelowej struktury katalogów — obecny stan jej
odpowiada. Kluczowe miejsca:

- `lib/progress.ts` — jedyne źródło prawdy o postępie 18 kroków.
- `lib/store/useGameStore.ts` — cache klienta, tryb `local`/`supabase`.
- `lib/actions/*` — Server Actions (`service_role`, nigdy z klienta);
  `admin-*.ts` to odpowiedniki dla `/admin`.
- `lib/data/board.ts`, `lib/data/wrapped.ts` — zapytania RSC (`anon`) dla
  /board, /live, /tile, /wrapped.
- `lib/data/admin.ts` — zapytanie RSC (`service_role`, za middleware) dla
  `/admin/dashboard`.
- `lib/offline/uploadQueue.ts` — kolejka dowodów w IndexedDB, auto-flush po
  powrocie sieci (`useOfflineQueueFlush`).
- `lib/wrapped/computeStats.ts` — statystyki WRAPPED z realnych danych gry.
- `components/three/` — sceny R3F (`SplashScene`, `ParticleBurst`,
  `ClosingRing`), zawsze ładowane przez `next/dynamic({ssr:false})`.
- `components/games/drink-runner/`, `components/games/pokusa/` — silniki
  minigier jako czysty TS (`Engine.ts`, `deckBuilder.ts`) + wrappery React.
- `src/middleware.ts` — chroni całe `/admin/*` sesją Supabase Auth.
- `public/sw.js` — ręczny service worker (cache shellu, offline fallback).
- `supabase/migrations/0001_init.sql` — schema + RLS + realtime + storage.

## Skrypty

```bash
npm run dev      # dev server
npm run build    # build produkcyjny
npm run lint     # eslint (flat config, next/core-web-vitals + next/typescript)
node scripts/generate-icons.mjs               # regeneruje ikony PWA w public/icons
npx tsx scripts/generate-voiceovers.ts        # pre-generuje lektora (wymaga ELEVENLABS_API_KEY)
```
