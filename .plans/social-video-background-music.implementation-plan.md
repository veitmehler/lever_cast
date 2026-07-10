# Background music for social video posts — implementation plan

> **Status: IMPLEMENTED** (audited 2026-07-09) — `MusicTrack` library + admin management + reel audio muxing live.

> Admin-managed music library; every generated social video gets a randomly
> picked track, cut to length with an end fade-out; narrated types duck the
> music −18 dB when speech starts. Decisions confirmed 2026-06-12: loop short
> tracks seamlessly · independent random track per video · loudness-normalize
> on upload · narrated types without a title slide run ducked from t=0.

## 1. Data model (`packages/db/prisma/schema.prisma`)

```prisma
model MusicTrack {
  id        String   @id @default(cuid())
  title     String
  s3Key     String   // system/music/<id>.m4a (normalized AAC)
  url       String   // CDN URL
  duration  Float    // seconds, probed after normalization
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("music_tracks")
}
```

New post-baseline migration in `packages/db` (B2 baseline stays untouched).
System-wide table — no `userId`; the library is global, managed in `/admin`.

## 2. Admin API (`apps/api/src/routes/admin-music.ts`, registered with the existing admin guard)

| Route | Behavior |
|---|---|
| `POST /admin/music` | Multipart upload (mp3/m4a/wav, ≤ 25 MB). Magic-number sniff (L4 convention), then a one-time ffmpeg pass: **two-step in one command** — `loudnorm=I=-16:TP=-1.5:LRA=11` → AAC 192k `.m4a`. Probe duration, upload to S3 `system/music/<id>.m4a`, insert row. |
| `GET /admin/music` | List all tracks (id, title, duration, isActive, url). |
| `PATCH /admin/music/:id` | Rename / toggle `isActive`. |
| `DELETE /admin/music/:id` | Delete S3 object + row. |

Normalizing at ingest means mix-time levels are predictable for every track:
voice (ElevenLabs) sits ≈ −16 LUFS, music base = −16 LUFS, ducked = −34 LUFS.

## 3. Admin UI (`apps/web/src/app/admin/music/page.tsx`)

- Upload button (file input → multipart POST via the api-proxy).
- Table: title (editable), duration, active toggle, `<audio controls>` preview,
  delete with confirm. Mirror the existing admin prompts page conventions.
- Nav entry in the admin layout.

## 4. Worker-side music engine (`apps/api/src/social/video/music.ts`)

```ts
pickRandomMusicTrack(): Promise<{ url: string; duration: number } | null>
// random isActive row; null → video generates WITHOUT music (never fail a post)

mixMusicIntoVideo(videoPath, outputPath, opts: {
  musicPath: string
  videoDuration: number     // from existing probe
  duckAtSec?: number        // narration onset; undefined = never duck
  duckDb?: number           // default 18
  duckRampSec?: number      // default 0.5
  fadeOutSec?: number       // default 2
})
```

`mixMusicIntoVideo` is ONE ffmpeg pass with **`-c:v copy`** — the video stream
is never re-encoded, so this adds only a cheap audio encode + remux to every
post type (keeps F6's single-pass video encode intact and gives all builders
one uniform implementation):

```
inputs: [0] video (may or may not have audio), [1] music
music chain: aloop=loop=-1:size=2e9, atrim=0:DUR,
             volume='1-0.874*clip((t-DUCK)/0.5,0,1)':eval=frame,   # −18 dB ≈ ×0.126
             afade=t=out:st=DUR-2:d=2, aformat=44100/stereo  [bgm]
mix:  video has audio → [0:a][bgm]amix=inputs=2:duration=first:normalize=0[a]
      video silent    → [bgm] is the only audio
map:  0:v + [a], -c:v copy, -c:a aac -b:a 192k, -shortest
```

Ducking is **deterministic by offset** (we always know when narration starts),
not sidechain compression — exact, cheap, and testable.

## 5. Per-type integration (each `generate*Asset` calls `mixMusicIntoVideo` right before `uploadVideoFile`)

| Type | Music behavior | `duckAtSec` |
|---|---|---|
| F6 hook video (narrated) | full during title intro → duck at first slide | `introDuration` (already probed) |
| F6 hook video (silent) | full throughout | — |
| S3 quote video (narrated) | ducked from the start | `0` |
| S3 quote video (silent) | full throughout | — |
| F2 video reel, S2 stories reel | full throughout (these gain an audio track they currently lack) | — |
| S4 pitch carousel video, S6 pitch hook | full throughout (silent types) | — |
| Looped reel (legacy `generateLoopedReelAsset`) | full throughout | — |

Graceful degradation everywhere: empty library, S3 download failure, or ffmpeg
error → `logger.warn` and ship the video unmixed.

## 6. Tests & validation

- Unit: filter-string builder (duck expression, fade timings, loop+trim) — pure function, vitest.
- Staging (the validation pattern used for PR #24): upload 2 short test tracks,
  regenerate every video type, then on the downloaded artifacts:
  - `volumedetect` windows: F6 0→intro (music full), intro→+10s (voice over ducked music),
    last 2s (fade tail ≈ silence);
  - S2: 18s loop **with** audio track present;
  - duration unchanged on every type (`-shortest`, `duration=first`);
  - empty-library run still generates all posts.
- Worker connection profile + caps unchanged (no new DB load beyond one row read per video).

## 7. Rollout

Separate feature branch/PR (not mixed into PR #24): schema migration →
admin API + UI → music engine + per-type wiring → staging validation → prod.
Estimated diff: ~150 lines API, ~200 lines admin UI, ~120 lines music engine,
~10 lines per builder call-site (×7).

## Deferred (explicitly out of scope now)

- Per-user music preferences (enable/disable, genre) — global library only.
- Genre/mood tagging and smart selection.
- Waveform preview in admin.
