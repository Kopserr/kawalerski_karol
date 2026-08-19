import type { Tile } from "@/lib/types";

/**
 * The 16 real-world challenges — the whole 4×4 board.
 * Content per BRIEF §6. Editable from /admin/tile/[id] once wired to the DB;
 * this seed is the fallback / initial state for a fresh game.
 *
 * `position` is FIXED on purpose (BRIEF §6: "nie losuj jej w runtime") and
 * was hand-placed to satisfy the two layout rules:
 *   - no more than two 🔥🔥🔥 tiles adjacent to each other
 *   - at least one 🔥 tile in the first row, so the opening move is easy
 */
export const TASKS: Tile[] = [
  {
    id: 1,
    position: 0,
    category: "SPORT",
    title: "Piach i honor",
    description:
      "Zapasy na plaży, jak z TikToka. Stoczysz trzy walki — najlepiej z trzema nieznajomymi, ale jeśli nie namówisz tylu, minimum jedna musi być z obcym. Ekipa nagrywa, sędziuje i głośno kibicuje. Zasada bezpieczeństwa: to zabawa, nie MMA — bez dźwigni na stawy, bez zapasów tuż nad wodą, koniec walki na słowo, jak ktoś klepie o poddaniu.",
    difficulty: 3,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 6,
    position: 1,
    category: "WSTYD",
    title: "Karaoke bez karaoke",
    description:
      "Odśpiewaj refren piosenki wybranej przez ekipę w miejscu, gdzie nie ma karaoke. Minimum 25 sekund, minimum 5 obcych świadków. Bez podkładu, bez mikrofonu, bez litości.",
    difficulty: 3,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 11,
    position: 2,
    category: "LUDZIE",
    title: "Nie ty wybierasz",
    description:
      "Podejdź do baru i pozwól, żeby ktoś obcy — barman albo przypadkowy gość — wybrał ci drinka. Zamawiasz dokładnie to, co powiedział. Zero negocjacji, zero wymiany, wypijasz do dna.",
    difficulty: 1,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 9,
    position: 3,
    category: "WSTYD",
    title: "Ostatni wolny taniec",
    description:
      "Zorganizuj minimum 6-osobowy pociąg taneczny z ludźmi, których nie znasz — musi przejść przez cały lokal. Alternatywa dla twardzieli: rozkręć pogo, minimum 6 osób, minimum jedna zwrotka.",
    difficulty: 3,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 2,
    position: 4,
    category: "SPORT",
    title: "Pięć koszulek",
    description:
      "Cała Malta chodzi w koszulkach piłkarskich. Zrób zdjęcie z pięcioma różnymi osobami w piłkarskich koszulkach — pięć różnych nazwisk na plecach. Dwa razy ten sam Ronaldo się nie liczy.",
    difficulty: 2,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 3,
    position: 5,
    category: "SPORT",
    title: "Mecz o wszystko",
    description:
      "Zagraj mecz w piłkę. Nie musi być 11 na 11 — plażówka, orlik, dwie bramki z klapek. Możesz podłączyć się do cudzej gry albo zorganizować własną. Ważne, żeby padł przynajmniej jeden gol i było zdjęcie z boiska. Zasada bezpieczeństwa: gracie z dala od jezdni i szkła na piasku, boso tylko tam, gdzie na pewno bezpiecznie.",
    difficulty: 2,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 4,
    position: 6,
    category: "EKIPA",
    title: "Trója razy dwa",
    description:
      "Wypij trójkę — trzy kieliszki pod rząd — z dwiema różnymi osobami. Dwie trójki, dwóch różnych partnerów, żadnych ulg. Ekipa liczy na głos.",
    difficulty: 2,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 5,
    position: 7,
    category: "WSTYD",
    title: "Coutinho challenge",
    description:
      "Nagraj TikToka do trendu z Coutinho. Ekipa pokazuje ci referencyjny filmik, ty odtwarzasz go jeden do jednego — ta sama choreografia, ta sama mina, to samo zaangażowanie. Bez taryfy ulgowej.",
    difficulty: 2,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 7,
    position: 8,
    category: "EKIPA",
    title: "Zamiana tożsamości",
    description:
      "Przez 30 minut nazywasz się tak, jak zdecyduje ekipa. Odpowiadasz na to imię i przedstawiasz się nim minimum 5 nowo poznanym osobom. Ani razu nie wychodzisz z roli.",
    difficulty: 2,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 8,
    position: 9,
    category: "LUDZIE",
    title: "Kolekcjoner autografów",
    description:
      "Zbierz 10 autografów od nieznajomych — na koszulce, kartce albo ręce. Każdy podpisuje się jak gwiazda i dopisuje jedno słowo, które kojarzy mu się z małżeństwem. Ten papier trafia potem do WRAPPED.",
    difficulty: 2,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 13,
    position: 10,
    category: "MALTA",
    title: "Maltański NPC",
    description:
      "Przez 15 minut jesteś postacią z gry. Powtarzasz w kółko jedną absurdalną kwestię i wykonujesz ten sam zestaw ruchów. Reagujesz tylko wtedy, gdy ktoś do ciebie podejdzie — i zawsze tak samo.",
    difficulty: 3,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 15,
    position: 11,
    category: "WSTYD",
    title: "Ostatni flirt",
    description:
      "Podejdź do nieznajomej osoby, zagadaj i doprowadź rozmowę do tego, żeby zgodziła się na wspólne zdjęcie. Kultura i luz — jedno „nie” kończy podejście, szukasz kogoś innego.",
    difficulty: 3,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 10,
    position: 12,
    category: "LUDZIE",
    title: "Międzynarodowe błogosławieństwo",
    description:
      "Znajdź obcokrajowca i poproś, żeby pobłogosławił twoje małżeństwo w swoim ojczystym języku. Nagraj to. Bonus punkty, jeśli do końca nie wiesz, w jakim to było języku ani co dokładnie ci życzył.",
    difficulty: 2,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 12,
    position: 13,
    category: "EKIPA",
    title: "Tatuaż na godzinę",
    description:
      "Ekipa robi ci zmywalnym markerem tatuaż — absurdalny napis albo symbol, w widocznym miejscu. Chodzisz z nim godzinę i nie zasłaniasz. Marker musi być przeznaczony na skórę.",
    difficulty: 1,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 14,
    position: 14,
    category: "LUDZIE",
    title: "Naucz mnie czegoś",
    description:
      "Przekonaj przypadkową osobę, żeby nauczyła cię charakterystycznego ruchu albo kroku tanecznego ze swojego kraju. Potem wykonujecie go razem, na nagraniu, do końca.",
    difficulty: 2,
    requiresProof: true,
    requiresApproval: true,
  },
  {
    id: 16,
    position: 15,
    category: "MALTA",
    title: "Kąpiel o północy",
    description:
      "Nocna kąpiel w Morzu Śródziemnym. Wchodzisz, zanurzasz się cały, wychodzisz. Warunki obowiązkowe: cała ekipa na brzegu, płytko i blisko brzegu, żadnego skakania z klifów ani pomostów — i jeśli jesteś zbyt pijany, żeby iść prosto, to zadanie czeka do rana. Morze w nocy wybacza mniej niż narzeczona.",
    difficulty: 2,
    location: "Płytka woda, blisko brzegu",
    requiresProof: true,
    requiresApproval: true,
  },
];

export const TASKS_BY_POSITION = [...TASKS].sort(
  (a, b) => a.position - b.position,
);

export function getTaskById(id: number): Tile | undefined {
  return TASKS.find((t) => t.id === id);
}
