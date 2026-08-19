-- Initial content seed — mirrors src/lib/seed/tasks.ts and
-- src/lib/seed/minigames.ts. Keep both in sync by hand; the TS seed is
-- also the fallback used by Server Actions if this hasn't been run yet.
-- Safe to re-run: every insert is idempotent (on conflict do nothing/update).

insert into game_state (id, status, skips_left, access_code)
values (1, 'running', 2, 'MALTA26')
on conflict (id) do nothing;

insert into tiles (id, position, category, title, description, difficulty, location, requires_proof, requires_approval)
values
  (1, 0, 'SPORT', 'Piach i honor',
   'Zapasy na plaży, jak z TikToka. Stoczysz trzy walki — najlepiej z trzema nieznajomymi, ale jeśli nie namówisz tylu, minimum jedna musi być z obcym. Ekipa nagrywa, sędziuje i głośno kibicuje. Zasada bezpieczeństwa: to zabawa, nie MMA — bez dźwigni na stawy, bez zapasów tuż nad wodą, koniec walki na słowo, jak ktoś klepie o poddaniu.',
   3, null, true, true),
  (6, 1, 'WSTYD', 'Karaoke bez karaoke',
   'Odśpiewaj refren piosenki wybranej przez ekipę w miejscu, gdzie nie ma karaoke. Minimum 25 sekund, minimum 5 obcych świadków. Bez podkładu, bez mikrofonu, bez litości.',
   3, null, true, true),
  (11, 2, 'LUDZIE', 'Nie ty wybierasz',
   'Podejdź do baru i pozwól, żeby ktoś obcy — barman albo przypadkowy gość — wybrał ci drinka. Zamawiasz dokładnie to, co powiedział. Zero negocjacji, zero wymiany, wypijasz do dna.',
   1, null, true, true),
  (9, 3, 'WSTYD', 'Ostatni wolny taniec',
   'Zorganizuj minimum 6-osobowy pociąg taneczny z ludźmi, których nie znasz — musi przejść przez cały lokal. Alternatywa dla twardzieli: rozkręć pogo, minimum 6 osób, minimum jedna zwrotka.',
   3, null, true, true),
  (2, 4, 'SPORT', 'Pięć koszulek',
   'Cała Malta chodzi w koszulkach piłkarskich. Zrób zdjęcie z pięcioma różnymi osobami w piłkarskich koszulkach — pięć różnych nazwisk na plecach. Dwa razy ten sam Ronaldo się nie liczy.',
   2, null, true, true),
  (3, 5, 'SPORT', 'Mecz o wszystko',
   'Zagraj mecz w piłkę. Nie musi być 11 na 11 — plażówka, orlik, dwie bramki z klapek. Możesz podłączyć się do cudzej gry albo zorganizować własną. Ważne, żeby padł przynajmniej jeden gol i było zdjęcie z boiska. Zasada bezpieczeństwa: gracie z dala od jezdni i szkła na piasku, boso tylko tam, gdzie na pewno bezpiecznie.',
   2, null, true, true),
  (4, 6, 'EKIPA', 'Trója razy dwa',
   'Wypij trójkę — trzy kieliszki pod rząd — z dwiema różnymi osobami. Dwie trójki, dwóch różnych partnerów, żadnych ulg. Ekipa liczy na głos.',
   2, null, true, true),
  (5, 7, 'WSTYD', 'Coutinho challenge',
   'Nagraj TikToka do trendu z Coutinho. Ekipa pokazuje ci referencyjny filmik, ty odtwarzasz go jeden do jednego — ta sama choreografia, ta sama mina, to samo zaangażowanie. Bez taryfy ulgowej.',
   2, null, true, true),
  (7, 8, 'EKIPA', 'Zamiana tożsamości',
   'Przez 30 minut nazywasz się tak, jak zdecyduje ekipa. Odpowiadasz na to imię i przedstawiasz się nim minimum 5 nowo poznanym osobom. Ani razu nie wychodzisz z roli.',
   2, null, true, true),
  (8, 9, 'LUDZIE', 'Kolekcjoner autografów',
   'Zbierz 10 autografów od nieznajomych — na koszulce, kartce albo ręce. Każdy podpisuje się jak gwiazda i dopisuje jedno słowo, które kojarzy mu się z małżeństwem. Ten papier trafia potem do WRAPPED.',
   2, null, true, true),
  (13, 10, 'MALTA', 'Maltański NPC',
   'Przez 15 minut jesteś postacią z gry. Powtarzasz w kółko jedną absurdalną kwestię i wykonujesz ten sam zestaw ruchów. Reagujesz tylko wtedy, gdy ktoś do ciebie podejdzie — i zawsze tak samo.',
   3, null, true, true),
  (15, 11, 'WSTYD', 'Ostatni flirt',
   'Podejdź do nieznajomej osoby, zagadaj i doprowadź rozmowę do tego, żeby zgodziła się na wspólne zdjęcie. Kultura i luz — jedno „nie” kończy podejście, szukasz kogoś innego.',
   3, null, true, true),
  (10, 12, 'LUDZIE', 'Międzynarodowe błogosławieństwo',
   'Znajdź obcokrajowca i poproś, żeby pobłogosławił twoje małżeństwo w swoim ojczystym języku. Nagraj to. Bonus punkty, jeśli do końca nie wiesz, w jakim to było języku ani co dokładnie ci życzył.',
   2, null, true, true),
  (12, 13, 'EKIPA', 'Tatuaż na godzinę',
   'Ekipa robi ci zmywalnym markerem tatuaż — absurdalny napis albo symbol, w widocznym miejscu. Chodzisz z nim godzinę i nie zasłaniasz. Marker musi być przeznaczony na skórę.',
   1, null, true, true),
  (14, 14, 'LUDZIE', 'Naucz mnie czegoś',
   'Przekonaj przypadkową osobę, żeby nauczyła cię charakterystycznego ruchu albo kroku tanecznego ze swojego kraju. Potem wykonujecie go razem, na nagraniu, do końca.',
   2, null, true, true),
  (16, 15, 'MALTA', 'Kąpiel o północy',
   'Nocna kąpiel w Morzu Śródziemnym. Wchodzisz, zanurzasz się cały, wychodzisz. Warunki obowiązkowe: cała ekipa na brzegu, płytko i blisko brzegu, żadnego skakania z klifów ani pomostów — i jeśli jesteś zbyt pijany, żeby iść prosto, to zadanie czeka do rana. Morze w nocy wybacza mniej niż narzeczona.',
   2, 'Płytka woda, blisko brzegu', true, true)
on conflict (id) do update set
  position = excluded.position,
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  location = excluded.location,
  requires_proof = excluded.requires_proof,
  requires_approval = excluded.requires_approval,
  updated_at = now();

insert into tile_states (tile_id, state)
  select id, 'locked' from tiles
on conflict (tile_id) do nothing;

insert into minigames (key, slot, title, unlock_at)
values
  ('drink-runner', 1, 'Drink Runner', 6),
  ('pokusa', 2, 'Pokusa', 12)
on conflict (key) do update set
  slot = excluded.slot,
  title = excluded.title,
  unlock_at = excluded.unlock_at;
