/**
 * How many new people each challenge involves, read directly off its own
 * description text in BRIEF §6 (e.g. task 8 literally asks for "10
 * autografów od nieznajomych" → 10). Not a tracked DB field — WRAPPED's
 * "ile osób zaczepionych" stat sums this over completed tiles as an
 * honest, traceable estimate rather than inventing a number from nothing.
 */
export const PEOPLE_ESTIMATE: Record<number, number> = {
  1: 3, // PIACH I HONOR — trzy walki
  2: 5, // PIĘĆ KOSZULEK
  3: 4, // MECZ O WSZYSTKO — nieformalny mecz
  4: 2, // TRÓJA RAZY DWA
  5: 0, // COUTINHO CHALLENGE — z ekipą
  6: 5, // KARAOKE BEZ KARAOKE — min. 5 świadków
  7: 5, // ZAMIANA TOŻSAMOŚCI — min. 5 nowo poznanych
  8: 10, // KOLEKCJONER AUTOGRAFÓW
  9: 6, // OSTATNI WOLNY TANIEC — min. 6-osobowy pociąg
  10: 1, // MIĘDZYNARODOWE BŁOGOSŁAWIEŃSTWO
  11: 1, // NIE TY WYBIERASZ
  12: 0, // TATUAŻ NA GODZINĘ — z ekipą
  13: 3, // MALTAŃSKI NPC — przechodnie
  14: 1, // NAUCZ MNIE CZEGOŚ
  15: 1, // OSTATNI FLIRT
  16: 0, // KĄPIEL O PÓŁNOCY — z ekipą
};

export function estimatePeopleEngaged(doneTileIds: number[]): number {
  return doneTileIds.reduce((sum, id) => sum + (PEOPLE_ESTIMATE[id] ?? 0), 0);
}
