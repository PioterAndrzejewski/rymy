# Wejście głosowe w trybie „Wypluj się z rymów"

Plan wdrożenia mikrofonu jako alternatywy dla klawiatury w `RhymeRun`.
Tekstowy `TextInput` **zostaje** — mikrofon jest dodatkiem, nie zamiennikiem.

## 0. Ograniczenia, z których wynika reszta planu

Aplikacja to statyczny build na GitHub Pages — **nie ma backendu**, więc Whisper
i podobne odpadają. Zostaje `SpeechRecognition` / `webkitSpeechRecognition`
(Web Speech API), która działa tylko po HTTPS (Pages ✓).

| Platforma | Stan | Uwagi |
|---|---|---|
| Chrome Android | ✅ | `lang='pl-PL'`, rozpoznawanie po stronie Google → **wymaga sieci** |
| Safari iOS 14.5+ | ✅ | dyktowanie on-device; polski, jeśli użytkownik ma go w dyktowaniu |
| Chrome / Edge desktop | ✅ | |
| Firefox (mobile i desktop) | ❌ | brak API → przycisk mikrofonu się nie renderuje |

Cztery rzeczy, które trzeba obsłużyć jawnie:

1. **`continuous` nie działa na mobile.** Obie platformy kończą sesję po ciszy
   niezależnie od flagi. Rozwiązanie: restart w `onend`, dopóki runda trwa
   (`running && !done`). iOS jest bardziej kapryśny — dźwięk przy każdym starcie,
   czasem limit długości sesji.
2. **Mikrofon kontra metronom.** `playClick` w trakcie nasłuchu = mikrofon słyszy
   kliki, a na iOS start rozpoznawania potrafi wyciszyć/przerwać Web Audio.
   Decyzja: przy włączonym mikrofonie **metronom jest wyłączany** (i komunikat
   „załóż słuchawki").
3. **Wynik to fraza, nie słowo.** Trzeba dzielić po białych znakach, obcinać
   interpunkcję, `toLowerCase()`, i **ignorować wyniki nie-`isFinal`** — inaczej
   do banku wpadają połówki słów.
4. **Rozpoznawanie „przyciąga" do częstych słów.** „wodospadem" wraca jako
   „wodo spadem". Tu ratuje nas istniejący bank rymów — patrz krok 2.

## 1. `src/lib/useSpeechInput.ts` (nowy plik)

Hook trzymający cały stan rozpoznawania. Komponent nie dotyka API bezpośrednio.

```ts
type SpeechState = 'unsupported' | 'idle' | 'listening' | 'denied' | 'error';

export function useSpeechInput(opts: {
  lang?: string;                     // 'pl-PL'
  enabled: boolean;                  // steruje startem/stopem z zewnątrz
  onWords: (tokens: string[]) => void; // tylko finalne wyniki, już rozbite na słowa
}): { state: SpeechState; interim: string; supported: boolean };
```

Wewnątrz:

- `const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition` —
  jeśli brak, `state = 'unsupported'` i hook nic nie robi.
- `recognition.continuous = true`, `interimResults = true`, `lang = 'pl-PL'`.
- `onresult`: zbierz `results` od `event.resultIndex`; nie-finalne → `setInterim`
  (do podglądu w UI), finalne → tokenizuj i wywołaj `onWords`.
- `onend`: jeśli `enabled` wciąż `true` → `recognition.start()` po ~100 ms
  (guard na podwójny start, bo iOS potrafi rzucić `InvalidStateError`).
- `onerror`: `'not-allowed' | 'service-not-allowed'` → `state='denied'` i koniec
  (żadnych restartów). `'no-speech'` → zignoruj, restart zrobi `onend`.
- Cleanup w `useEffect`: `enabled=false` → `recognition.abort()`.

Tokenizacja: `text.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean)`.

**Typowanie**: `lib.dom` w TS 5.7 nadal nie ma `SpeechRecognition`. Dopisać
minimalne deklaracje w `src/vite-env.d.ts` (interfejs + `declare global` na
`Window`) zamiast dokładać `@types/dom-speech-recognition`.

## 2. `matchHeard()` w `src/wordbank/pl/rhymes.ts`

Sedno jakości. Trzy poziomy, po kolei:

```ts
export type HeardMatch =
  | { kind: 'bank'; word: string }    // trafienie w bank (może po korekcie)
  | { kind: 'own'; word: string }     // spoza banku, ale końcówka się zgadza
  | { kind: 'reject'; word: string }; // nie rym / szum

export function matchHeard(token: string, ending: string): HeardMatch;
```

1. **Trafienie dokładne** — `rhymeWords(ending)` zawiera token → `bank`.
2. **Bliski błąd** — najbliższe słowo z `rhymeWords(ending)` w odległości
   Levenshteina ≤ 2 (i tylko dla tokenów dłuższych niż ~5 znaków, żeby krótkie
   słowa nie „przyklejały się" byle gdzie) → `bank` z **poprawionym** słowem.
   To naprawia większość przekręceń rozpoznawania.
3. **Własne słowo** — `token.endsWith(ending)` → `own`. Użytkownik ma prawo
   wpisać rym spoza banku i to już jest liczone w `rhymeProgress` (`p.own`).
4. Inaczej → `reject`.

Levenshtein: zwykła implementacja z dwoma wierszami, prywatna w tym pliku.
Bank dla jednej końcówki ma ~150–250 słów, liczone raz na usłyszany token —
koszt bez znaczenia.

## 3. Zmiany w `src/modes/family/RhymeRun.tsx`

- Nowy stan: `const [mic, setMic] = useState(false)` + `rejected: string[]`
  (ostatnie odrzucone tokeny, do pokazania).
- `useSpeechInput({ enabled: mic && running && !done, onWords: handleHeard })`.
- `handleHeard(tokens)`: dla każdego tokenu `matchHeard(token, ending)`;
  `bank`/`own` → **ta sama ścieżka co `submit()`** (wydzielić z `submit()`
  funkcję `accept(word: string)`), żeby tryb `quota`, tryb `timed`, deduplikacja
  i zapis postępu działały bez zmian. `reject` → dopisz do `rejected`
  (auto-czyszczenie po kilku sekundach).
- **Duplikat z głosu nie może odpalać `rymy-shake`** — to byłoby mylące przy
  ciągłym nasłuchu. Cichy szary chip zamiast trzęsienia.
- UI:
  - `ActionIcon` z `IconMicrophone` / `IconMicrophoneOff` obok pola tekstowego;
    nie renderować, gdy `!supported`.
  - Pod polem: `interim` szarym tekstem (pokazuje, że mikrofon żyje).
  - Odrzucone tokeny jako szare chipy z podpisem „nie rym" — misrecognition ma
    być **widoczny**, nie po cichu zjadany.
  - `state === 'denied'` → krótki komunikat „brak dostępu do mikrofonu".
- Metronom: gdy `mic === true`, `useEffect` z `playClick` nie startuje
  (dopisać `&& !mic` do warunku). Obok przełącznika informacja dlaczego.

## 4. Konfiguracja (`src/modes/family/config.ts`)

Opcjonalnie, jeśli mikrofon ma być domyślny per użytkownik: dołożyć
`voice: boolean` do `FamilyConfig` (`defaultFamilyConfig.voice = false`) i
przełącznik w kreatorze (`RhymeFamily.tsx`). Bez tego mikrofon jest tylko
przełącznikiem w trakcie rundy i nie jest pamiętany.

## 5. Kolejność pracy

1. Deklaracje typów w `vite-env.d.ts` + `useSpeechInput.ts`, sprawdzone na
   desktopowym Chrome z `console.log`.
2. `matchHeard()` + Levenshtein w `rhymes.ts`.
3. Wpięcie w `RhymeRun.tsx`: wydzielenie `accept()`, mikrofon, chipy odrzuceń.
4. Wyłączanie metronomu + komunikaty.
5. Test na realnym telefonie (Android Chrome **i** Safari iOS) — emulator
   przeglądarki tego nie sprawdzi.
6. `npm run typecheck`.

## 6. Ryzyka

- **Głos ułatwia oszukiwanie ćwiczenia** — można mruczeć byle co i trafiać w bank
  przez poziom 2 dopasowania. Ogranicznik: próg Levenshteina ≤ 2 tylko dla
  dłuższych słów; jeśli w praktyce okaże się za luźny, zejść do ≤ 1.
- **Chrome Android wysyła audio do Google** — warto o tym wspomnieć w UI, skoro
  reszta aplikacji jest lokalna.
- **iOS bywa niestabilny** przy długim nasłuchu; przy powtarzających się błędach
  wyłączyć mikrofon i wrócić do klawiatury zamiast restartować w kółko.
