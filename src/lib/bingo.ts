/** BINGO line detection on the 4×4 board (positions 0..15, row-major). */

const LINES: { id: string; positions: number[] }[] = [
  { id: "row-0", positions: [0, 1, 2, 3] },
  { id: "row-1", positions: [4, 5, 6, 7] },
  { id: "row-2", positions: [8, 9, 10, 11] },
  { id: "row-3", positions: [12, 13, 14, 15] },
  { id: "col-0", positions: [0, 4, 8, 12] },
  { id: "col-1", positions: [1, 5, 9, 13] },
  { id: "col-2", positions: [2, 6, 10, 14] },
  { id: "col-3", positions: [3, 7, 11, 15] },
  { id: "diag-0", positions: [0, 5, 10, 15] },
  { id: "diag-1", positions: [3, 6, 9, 12] },
];

export function getCompletedLines(donePositions: Set<number>): string[] {
  return LINES.filter((line) =>
    line.positions.every((p) => donePositions.has(p)),
  ).map((line) => line.id);
}
