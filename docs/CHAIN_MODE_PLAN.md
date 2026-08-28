# Tryb 2: Łańcuch skojarzeń

Kolejność w menu: **Wypluj się z rymów → Łańcuch skojarzeń → Pałac mentalny → Historia.**

## Czego uczy

Freestyle nie wysypuje się na rymach — wysypuje się na **temacie**. Rymy masz
w banku (tryb 1), pamięć porządkujesz w pałacu (tryb 3), ale między jednym
a drugim brakuje silnika, który *ciągnie zwrotkę dalej*: skojarzenie.

Pętla jest dokładnie taka, jak w głowie podczas freestyle'u:

```
kot → (skojarzenie) sierść → (rym) wierszyk
                                  ↓ nowe ogniwo startuje z rymu
     wierszyk → (skojarzenie) zeszyt → (rym) nie wieszaj
```

Jedno **ogniwo** = skojarzenie + rym do niego, powiedziane jednym ciągiem.
Rym kolejnego ogniwa staje się słowem wyjściowym następnego — dzięki temu
łańcuch *idzie gdzieś*, zamiast krążyć wokół pierwszego słowa. To jest różnica
między „mam rymy do -ość" a „umiem gadać dwie minuty bez zatrzymania".

Trzy rzeczy, które robimy inaczej niż zwykła gra słowna:
1. **Skojarzenie i rym w jednym oddechu.** Nie ma osobnego kroku „teraz się
   zastanów" — timer leci na całe ogniwo, nie na każdą połowę osobno.
2. **Nie oceniamy skojarzeń automatycznie.** Nie mamy modelu semantyki i nie
   będziemy udawać, że mamy. Maszyna ocenia twardo *rym*; skojarzenia oceniasz
   sam w podsumowaniu (patrz: „szczery przegląd"). Kategorie z banku dają
   tylko sygnał *blisko / skok*, nie werdykt.
3. **Łańcuch nigdy nie umiera.** Nie zdążyłeś — ogniwo dostaje słowo od nas,
   oznaczone jako nasze, i idziesz dalej. Przerwanie ćwiczenia w połowie uczy
   zatrzymywania się, a to jest dokładnie ten nawyk, który zabija freestyle.

## Bez podkładu — świadomie

Podkład wymusza odpowiedź długości taktu. Tu jednostką jest ogniwo, nie takt,
a mierzymy **czas myślenia**, więc bit tylko by go zamazał. Zostaje opcjonalny
metronom (`playClick`, jak w trybie 1) jako puls i „snap" przy zamknięciu
ogniwa. Podkład wraca w trybie Historia.

## Co ma trzymać przy ekranie (zamiast bitu)

- **Łańcuch rośnie na ekranie.** Każde zamknięte ogniwo wskakuje na taśmę
  (`rymy-pop`), taśma przewija się poziomo. Widać drogę, nie licznik.
- **Kreska rekordu na taśmie.** „Twój rekord: 14 ogniw" stoi jako znacznik na
  torze — gonisz swój własny ślad, nie abstrakcyjny wynik.
- **Combo.** Ogniwa z rymem ≥ wymaganego lecą pod rząd → licznik serii i cieplejszy
  kolor taśmy. Pęknięcie zeruje serię, nie łańcuch.
- **Puenta na koniec.** Podsumowanie otwiera się jedną linijką całej drogi:
  „z **kota** doszedłeś do **wolności** w 12 krokach" + pełna ścieżka.
  To jest moment, dla którego się wraca — i jedyny ekran wart zrzutu.
- **Zero fałszywego konfetti.** Werdykt jest zdaniem, nie fanfarą:
  „Łańcuch trzymał się do 9. ogniwa."

## Poziomy

| poziom | ogniwa | s / ogniwo | wymagany rym | dodatkowo |
|---|---|---|---|---|
| 1 | 4  | 20 | asonans (q ≥ 1) | — |
| 2 | 6  | 15 | czysty (q ≥ 2) | — |
| 3 | 8  | 12 | czysty | tanie rymy gramatyczne liczone jako q = 1 |
| 4 | 10 | 10 | czysty | skojarzenie musi **zmienić kategorię** |
| 5 | 12 | 8  | dwusylabowy (q = 3) | zmiana kategorii |
| 6 | 16 | 6  | dwusylabowy | świeżość punktowana ostro (patrz: Rozrzut) |

Plus **wolny łańcuch** (poziom 0): bez timera, bez limitu, idziesz aż zamkniesz.
To jest wejście dla kogoś, kto pierwszy raz otwiera tryb — poziomy dobierasz
potem. „Program" = pierwszy poziom, którego nie zaliczyłeś na ≥ 70.

## Jak liczymy rym (nowy plik `wordbank/pl/phonetics.ts`)

Tryb 1 sprawdza rym względem **końcówki z banku**. Tutaj rymujesz do słowa,
które sam przed chwilą wymyśliłeś — bank nie pomoże, potrzebna jest fonetyka.

```ts
export type RhymeQuality = 0 | 1 | 2 | 3;
// 0 — nie rym / to samo słowo
// 1 — asonans: zgadza się ostatnia samogłoska (+ zbliżona spółgłoska)
// 2 — czysty: cała ostatnia sylaba od samogłoski akcentowanej
// 3 — dwie sylaby i więcej (rym głęboki / składany)

phonemes(word): string      // rz→ż, ch→h, ó→u, dz/dź, ubezdźwięcznienie w wygłosie
vowelSkeleton(word): string // "kartonowe" → "aooe"
rhymeQuality(a, b): { q: RhymeQuality; cheap: boolean }
```

`cheap` = **rym gramatyczny**: obie formy kończą się tym samym produktywnym
sufiksem (`-ość`, `-anie`, `-enie`, `-ować`, `-ami`, `-ego`…) i poza nim nic się
nie zgadza. To jest najtańszy rym w polszczyźnie i od poziomu 3 obcinamy go do
q = 1 z etykietą „tani rym" — bez tego cała gra kończy się na „-owanie".

Ten sam plik podnosi potem jakość trybu 1 (ocena „jak dobry to rym", nie tylko
„czy pasuje") — dlatego stoi w `wordbank`, nie w `modes/chain`.

## Skojarzenie — sygnał zamiast oceny

`linkSignal(prev, assoc)` w `chain/words.ts`, oparty o istniejące
`CATEGORY_WORDS` / `topicWords` / `stem` ze `story-topics.ts`:

- `blisko` — oba słowa trafiają w tę samą kategorię banku,
- `skok` — trafiają w różne kategorie (albo skojarzenia nie ma w banku),
- `powtórka` — słowo już jest w tym łańcuchu → jedyne twarde odrzucenie.

Na poziomach 4+ `blisko` nie zamyka ogniwa: „zostałeś w tej samej rodzinie,
skocz dalej". Nigdzie nie mówimy „to nie jest skojarzenie" — tego nie wiemy.

## Ocena po ćwiczeniu

Jedna liczba niczego nie uczy, więc pokazujemy **cztery paski** (0–100) i dopiero
z nich wynik:

| pasek | co mierzy | jak |
|---|---|---|
| **Długość** | ile ogniw domknąłeś sam | `zaliczone / cel poziomu` |
| **Tempo** | szybkość myślenia | mediana ms na ogniwo vs. `s/ogniwo` poziomu |
| **Jakość** | jakie to były rymy | średnie `q / 3` (tanie rymy z sufitem) |
| **Rozrzut** | czy łańcuch szedł, czy krążył | odwiedzone kategorie + % słów, których nie użyłeś w poprzednich sesjach |

`wynik = średnia czterech`. **Poziom zaliczony**, gdy wynik ≥ 70 i żaden pasek
< 50 — cztery przeciętne paski nie mają udawać dobrej rundy.

Pod paskami tabela ogniwo po ogniwie: słowo wyjściowe → skojarzenie → rym,
`q` jako kropki, czas, i znacznik przy tych, które dopisaliśmy za ciebie.

**Szczery przegląd** (to zastępuje ocenę semantyki): przy każdym ogniwie jeden
klik „to było naciągane". Skreślone ogniwa lecą z paska Rozrzut i zapisują się
jako `weak` — sam jesteś sędzią od skojarzeń, a my liczymy, ile razy sam sobie
postawiłeś minus. To też jest wynik, i uczciwszy niż zgadywanie modelem.

## Model zapisu (`localStorage`, klucz `rymy.chain.v1`)

```ts
type ChainLink = {
  from: string; assoc: string; rhyme: string;
  q: 0 | 1 | 2 | 3; cheap: boolean;
  signal: 'blisko' | 'skok';
  ms: number;
  auto: boolean;   // słowo dopisane przez nas po upływie czasu
  weak: boolean;   // skreślone przez ciebie w przeglądzie
};
type ChainRun = {
  ts: number; level: number; seed: string; links: ChainLink[];
  scores: { length: number; tempo: number; quality: number; spread: number; total: number };
  passed: boolean; msPerLink: number; combo: number; voice: boolean;
};
type ChainProgress = {
  runs: ChainRun[];                    // ostatnie 50
  best: Record<number, { total: number; links: number; msPerLink: number; ts: number }>;
  words: Record<string, number>;       // ile razy użyłeś słowa — stąd świeżość
  pairs: Record<string, string[]>;      // twoje skojarzenia: słowo → to, co ci przyszło
  categories: Record<string, number>;   // gdzie łańcuchy chodzą najczęściej
};
```

Funkcje: `loadChain`, `recordChainRun`, `bestFor(level)`, `suggestLevel()`,
`freshness(word)`, `clearChain()`.

`pairs` to nie statystyka — to **twój słownik skojarzeń**, i w kolejnej iteracji
karmi podpowiedzi („ostatnio z *nocy* szedłeś w *taksówkę*"). `words` domyka
pasek Rozrzut: te same dwadzieścia słów co sesja przestają się opłacać.

## Przebieg rundy

1. `intro` — słowo startowe wjeżdża `rymy-pop`, opcjonalny count-in metronomu.
2. `play` — pętla ogniw:
   - pierścień czasu na ogniwo (jeden `requestAnimationFrame`, jak w `RhymeRun`),
   - **dwa sloty**: skojarzenie → rym; klawiatura: Enter przełącza slot,
     mikrofon: pierwsze usłyszane słowo idzie w slot 1, drugie w slot 2,
   - zamknięcie ogniwa: `playClick({ accent: true })`, ogniwo wskakuje na taśmę,
     rym staje się nowym `from`,
   - czas minął → dopisujemy słowo z banku (`auto: true`), seria się zeruje,
     idziemy dalej.
3. `review` — szczery przegląd (opcjonalny, jeden ekran, można pominąć).
4. `summary` — droga jednym zdaniem, cztery paski, tabela ogniw, porównanie
   z rekordem poziomu, „jeszcze raz" / „ten sam poziom" / „wyżej".

## Wejście głosem

`useSpeechInput` + ta sama ścieżka echa co w `RhymeRun`: usłyszane słowo najpierw
ląduje w polu z zielonym/czerwonym błyskiem, dopiero potem na taśmie. Tu jest
naturalny tryb pracy — skojarzenie i rym mówi się szybciej, niż pisze, a o to
w całym trybie chodzi. `matchHeard` nie ma zastosowania (nie ma banku końcówki),
więc korekta z mikrofonu ogranicza się do przycięcia interpunkcji i wielkości liter.

## Kreator (3 kroki, na wzór pozostałych trybów)

1. **Poziom** — karty poziomów (ogniwa / czas / wymagany rym) + „wolny łańcuch"
   + podpowiedź „program"; obok rekord dla poziomu.
2. **Start** — słowo startowe (losowe / z kategorii / własne), metronom (BPM jak
   w trybie 1), mikrofon on/off, przełącznik „szczery przegląd po rundzie".
3. **Gotowe** — `ReadyPanel`: poziom, ogniwa, czas na ogniwo, rekord.

Wejście „Moje skojarzenia" obok kreatora (analogicznie do „Mój bank rymów"):
`pairs`, najczęstsze kategorie, najdłuższy łańcuch.

## Pliki

- `src/wordbank/pl/phonetics.ts` — fonetyka, `rhymeQuality`, tani rym
- `src/storage/chainProgress.ts` — model wyników
- `src/modes/chain/config.ts` — poziomy, progi, etykiety
- `src/modes/chain/words.ts` — słowa startowe, `linkSignal`, auto-uzupełnienie
- `src/modes/chain/score.ts` — cztery paski, zaliczenie, `suggestLevel`
- `src/modes/chain/ChainStrip.tsx` — taśma łańcucha + znacznik rekordu
- `src/modes/chain/LinkInput.tsx` — dwa sloty, timer, mikrofon
- `src/modes/chain/ChainRun.tsx` — fazy: intro → play → review → summary
- `src/modes/chain/Review.tsx` — szczery przegląd (osobny ekran fazy `review`)
- `src/modes/chain/Summary.tsx` — droga, paski, tabela ogniw
- `src/modes/chain/PairsPanel.tsx` — „Moje skojarzenia"
- `src/modes/ChainMode.tsx` — kreator + router trybu
- `src/pages/Home.tsx`, `src/pages/Practice.tsx` — wpięcie (`/practice/chain`)

## Kroki wdrożenia

- [x] 1. Plan (ten plik)
- [x] 2. `wordbank/pl/phonetics.ts` + testowe przypadki na tanich rymach
- [x] 3. `storage/chainProgress.ts` — model i zapis
- [x] 4. `chain/config.ts` + `chain/words.ts` + `chain/score.ts`
- [x] 5. `chain/LinkInput.tsx` + `chain/ChainStrip.tsx`
- [x] 6. `chain/ChainRun.tsx` — cztery fazy rundy
- [x] 7. `chain/Summary.tsx` + `chain/PairsPanel.tsx`
- [x] 8. `modes/ChainMode.tsx` — kreator
- [x] 9. Wpięcie w Home (druga kafelka) + Practice, typecheck, build

Poza planem, przy okazji: `stem` i etykiety kategorii wyszły ze `story-topics.ts`
na zewnątrz (`CATEGORY_LABELS`, `categoryLabel`), bo potrzebują ich teraz trzy
tryby, a nie jeden.

## Później (nie w v1)

- Rymy własne z łańcucha dopisywane do `rhymeProgress.own` — jeden bank na aplikację.
- `pairs` jako podpowiedzi w trybie Historia (słowa klucze z twoich skojarzeń).
- Tryb „łańcuch wsteczny": od ostatniego słowa wróć tą samą drogą do pierwszego
  — to samo ćwiczenie, ale sprawdza pamięć, więc bliżej mu do pałacu.
