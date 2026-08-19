import { toBlob } from "html-to-image";

/** Renders a DOM node (the 1080×1920 ShareCard) to a PNG blob for
 * "POBIERZ PODSUMOWANIE" / "UDOSTĘPNIJ" (BRIEF §5.5). */
export async function renderSummaryImage(node: HTMLElement): Promise<Blob | null> {
  return toBlob(node, {
    width: 1080,
    height: 1920,
    pixelRatio: 1,
    cacheBust: true,
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareSummaryImage(blob: Blob, title: string): Promise<"shared" | "downloaded" | "unsupported"> {
  const file = new File([blob], "last-free-day.png", { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch {
      // user cancelled — not an error
      return "shared";
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title });
      return "shared";
    } catch {
      return "shared";
    }
  }

  downloadBlob(blob, "last-free-day.png");
  return "downloaded";
}
