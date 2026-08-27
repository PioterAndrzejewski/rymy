# Rymy — Implementation Plan

Personal browser app for practicing rhymes (Polish first) against a backing track.
Local-only in v1 (no hosting, no accounts, no logging).

## 1. Stack & structure

- **Vite + React + TypeScript**, `pnpm dev` locally.
- **Audio**: `HTMLAudioElement` → WebAudio graph. **SoundTouchJS** (WASM) node for
  pitch-preserving time-stretch. Raw `playbackRate` available as fallback.
- **State**: Zustand.
- **Persistence**: `localStorage` for settings; `IndexedDB` (via `idb`) for
  ad-hoc uploaded audio blobs + their metadata. **No session logging, no streak.**
- **Styling**: Tailwind.
- **i18n-ready**: `LanguageProvider` context with `pl` as default. Word banks keyed
  by language code — swapping languages later = adding a folder.

```
/src
  /audio          # AudioEngine, TimeStretcher, ClickTrack, Transport
  /session        # session state machine, cue scheduler, seeded RNG
  /wordbank       # loaders (static JSON, IndexedDB user lists, future LLM)
    /providers    # StaticProvider, UserListProvider, LlmProvider (stub)
    /pl/level-1.json … level-5.json
  /modes          # CueMode, BackwardsDrill, RhymeFamily, ChainMode, TopicCluster
  /components     # Transport, BarGrid, WordCue, TrackLibrary, SettingsPanel
  /storage        # localStorage + IndexedDB adapters
  /types
/public/tracks    # user-dropped audio + tracks.json manifest
/docs             # this plan and any future notes
```

## 2. Core types

```ts
type Track = {
  id: string; name: string; path: string;    // "/tracks/foo.mp3"
  bpm: number; timeSignature: [number, number];
  downbeatOffsetMs: number;                   // where bar 1 starts
  style?: string;                             // "boom bap", "trap", etc.
  source: 'manifest' | 'user';                // repo vs IndexedDB
};

type Word = {
  text: string;
  rhymeEnding: string;                        // strict last-syllable in v1
  pos?: 'noun' | 'verb' | 'adj' | 'other';
  syllables?: number;                         // optional, fill later
  stress?: number;                            // optional (Polish = penultimate)
  topics?: string[];                          // optional
};

type Subdivision = { wordsPerBar: number; barsPerWord: number };
// {1,1}=default; {1,2}=1 word / 2 bars; {1,4}=1 word / 4 bars;
// {2,1}=2 per bar; {4,1}=4 per bar

type WordProvider = {
  id: string;
  getWords(opts: { count: number; seed: number; filter?: Filter }): Promise<Word[]>;
};
```

`WordProvider` is the seam that lets us drop in an `LlmProvider` later without
touching modes.

## 3. Audio engine

- Decode via WebAudio → SoundTouchNode (tempo ratio) → destination.
- Transport exposes `currentBar`, `currentBeat`, `nextBarStartAt(n)`, computed as
  `bar = floor((audioTime*1000 - downbeatOffsetMs) * (bpm*rate/60) / beatsPerBar)`.
- Optional click overlay (WebAudio oscillator: accented downbeat + softer beats),
  toggle + gain in Settings.
- Per-track UI to refine `downbeatOffsetMs`: tap-tempo and ±10 ms nudge buttons.
  Overrides saved to `localStorage` keyed by track id.

## 4. Bar grid & cue scheduling

- `SessionPlanner(WordProvider, Subdivision, totalBars|duration, seed)` produces a
  deterministic `BarPlan[]` up front.
- `BarGrid`: horizontal strip of the next N bars (default 6), each slot rendering
  its target word(s). Current bar highlighted; sweep bar animates in sync with
  audio time.
- Subdivisions: `barsPerWord ∈ {1,2,4}`, `wordsPerBar ∈ {1,2,4}`. Changeable mid-
  session — regenerates from the current bar forward using the same seed.

## 5. Modes

All modes share `<TransportProvider>` + `<CueRenderer>`; they differ in planner +
UI overlay. Non-core modes have a **duration timer** (default 3 min, chime at end).
**No streak, no history.**

| Mode | Track? | Planner | UI accent |
|---|---|---|---|
| **CueMode** (core) | yes | provider + subdivision | bar grid + current word |
| **BackwardsDrill** | yes | shows end-word of bar N; you improvise the line leading into it | grid with only end-of-bar slots active |
| **RhymeFamily** | no (opt. metronome) | one ending (e.g. `-ość`) + timer | large ending, manual tap counter |
| **ChainMode** | yes | seeded first word; next word must share rhyme family | single big word, next slot shows ending only |
| **TopicCluster** | yes | provider filtered by `topics: [X]` | cue mode + topic badge |

## 6. Word bank (Polish, levels 1–5)

- Static JSON per level. Files hold **additions only**; loader unions cumulatively:
  L2 = L1 ∪ new30, L3 = L2 ∪ new40, L4 = L3 ∪ new100, L5 = L4 ∪ new300.
- Each word tagged with strict `rhymeEnding` (last syllable) + `pos`. `syllables`,
  `stress`, `topics` optional, filled later.
- **User custom lists** live in IndexedDB, exposed as `UserListProvider`.
- **LlmProvider** — interface stub + settings slot for an API key. Not wired in v1.

## 7. Track library

- `TrackLibrary` merges `public/tracks/tracks.json` (manifest) with IndexedDB
  uploads. Manifest wins on id collision.
- Add-track dialog: drop audio → form (name, bpm, time sig, offset, style) → save
  to IndexedDB.
- Per-track "export manifest entry" button — copies JSON snippet to clipboard so
  you can paste it into `tracks.json` to promote to repo.

## 8. Settings

- Master volume, click volume, click on/off.
- Tempo mode: pitch-preserving (default) / raw `playbackRate`.
- Grid preview length (N bars).
- Language (only `pl` in v1).
- LLM API key slot (disabled placeholder for future).

## 9. Build order

1. Scaffold Vite+TS+Tailwind+Zustand; routes: `/`, `/practice/:mode`,
   `/settings`, `/tracks`.
2. Types + storage adapters + `tracks.json` loader + IndexedDB adapter.
3. AudioEngine v1 (playback only) + Transport with metadata-driven bar clock +
   tap-tempo/nudge.
4. Add SoundTouch time-stretch + click overlay.
5. `WordProvider` interface + `StaticProvider` + level-1 seed list.
6. `SessionPlanner` + `BarGrid` + `CueMode` end-to-end.
7. Subdivision controls + seeded RNG UI (show/replay seed).
8. Level 2–5 lists, topic/rhyme-ending filtering, `UserListProvider` (paste/upload
   list).
9. BackwardsDrill, RhymeFamily, ChainMode, TopicCluster + shared timer.
10. Settings polish, TrackLibrary add/upload UI, manifest-export snippet.

## 10. Notes / conventions

- `rhymeEnding` is the strict last syllable, written phonetically enough to match
  literally (e.g. `ość`, `anie`, `ek`). Refined grouping (assonance, stressed
  vowel families) is a v2 concern.
- Word JSON files hold additions only; loader dedupes on `text`.
- No accuracy scoring — mic not required; this is a self-driven cue tool.
