"use client";

import { openDb, STORE_NAME } from "./db";

export interface PendingUpload {
  id: string;
  tileId: number;
  file: File;
  mediaType: "image" | "video";
  queuedAt: string;
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Proof uploads that couldn't reach the server (BRIEF §11: "kolejkuje
 * uploady do wysyłki po powrocie sieci" — roaming on Malta *will* drop).
 * The file itself lives in IndexedDB (localStorage can't hold blobs).
 */
export async function enqueueUpload(tileId: number, file: File): Promise<PendingUpload | null> {
  const db = await openDb();
  if (!db) return null;

  const entry: PendingUpload = {
    id: makeId(),
    tileId,
    file,
    mediaType: file.type.startsWith("video") ? "video" : "image",
    queuedAt: new Date().toISOString(),
  };

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve(entry);
    tx.onerror = () => resolve(null);
  });
}

export async function listPendingUploads(): Promise<PendingUpload[]> {
  const db = await openDb();
  if (!db) return [];

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result as PendingUpload[]);
    req.onerror = () => resolve([]);
  });
}

export async function removePendingUpload(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/** Called on reconnect — hands every queued file back to `submit`
 * (the store's real submitProof), one at a time, removing each as it
 * succeeds. Leaves failures queued for the next reconnect. */
export async function flushUploadQueue(
  submit: (tileId: number, file: File) => Promise<{ ok: boolean }>,
): Promise<number> {
  const pending = await listPendingUploads();
  let flushed = 0;
  for (const item of pending) {
    const result = await submit(item.tileId, item.file);
    if (result.ok) {
      await removePendingUpload(item.id);
      flushed++;
    }
  }
  return flushed;
}
