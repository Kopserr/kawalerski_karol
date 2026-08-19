/**
 * Pre-generates one MP3 voiceover per task (BRIEF §9 — the better of the
 * two TTS tiers; Web Speech API in VoicePlayer.tsx is the always-available
 * fallback when a task has no `voiceover_url`).
 *
 * Usage:
 *   ELEVENLABS_API_KEY=... npx tsx scripts/generate-voiceovers.ts
 *
 * Writes MP3s to public/audio/{tileId}.mp3. If Supabase is configured
 * (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY), also updates
 * each tile's `voiceover_url` to that public path so the live app picks
 * it up immediately — otherwise it just leaves the files for a manual
 * `voiceover_url` edit in /admin/tile/[id].
 *
 * Requires an ElevenLabs account + API key. Not run as part of the build —
 * this is an offline content step, done once before the event (or again
 * after editing task text).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { TASKS } from "../src/lib/seed/tasks";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM"; // "Rachel" — swap for a Polish-friendly voice
const OUT_DIR = path.join(process.cwd(), "public", "audio");

async function synthesize(text: string): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.8 },
    }),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function updateSupabase(tileId: number, publicPath: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const res = await fetch(`${url}/rest/v1/tiles?id=eq.${tileId}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ voiceover_url: publicPath }),
  });
  if (!res.ok) {
    console.warn(`  ⚠ could not update tiles.voiceover_url for #${tileId}: ${res.status}`);
  }
}

async function main() {
  if (!ELEVENLABS_API_KEY) {
    console.error("Missing ELEVENLABS_API_KEY. Set it in the environment and re-run.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  for (const tile of TASKS) {
    const text = `${tile.title}. ${tile.description}`;
    const outFile = path.join(OUT_DIR, `${tile.id}.mp3`);
    const publicPath = `/audio/${tile.id}.mp3`;

    process.stdout.write(`#${String(tile.id).padStart(2, "0")} ${tile.title}… `);
    try {
      const audio = await synthesize(text);
      await writeFile(outFile, audio);
      await updateSupabase(tile.id, publicPath);
      console.log(`ok (${(audio.byteLength / 1024).toFixed(0)} kB)`);
    } catch (err) {
      console.log("FAILED");
      console.error(err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nDone. Files in ${OUT_DIR}`);
}

void main();
