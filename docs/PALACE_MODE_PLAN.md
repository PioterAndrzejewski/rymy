# Tryb 3: Pałac mentalny (metoda loci)

## Czego uczy
Klasyczna metoda loci: przypinasz słowa do stałych, znajomych miejsc i odzyskujesz
je *w kolejności*, idąc pamięcią przez to samo mieszkanie. Dla rapera to warsztat
pod zapamiętywanie zwrotki bez kartki — kolejność punktów tekstu = kolejność pokoi.

Trzy rzeczy, które robimy inaczej niż zwykła „gra w zapamiętywanie":
1. **Pałac jest stały.** Pokój 1 wygląda tak samo na każdym poziomie i w każdej sesji —
   wyższe poziomy tylko *dokładają* pokoje. Dzięki temu pałac zostaje w głowie na stałe.
2. **Rym przy odtwarzaniu**, nie przy zapamiętywaniu — do słowa, które właśnie
   wyjąłeś z pokoju. Sam obchód niczego od ciebie nie chce: stoisz, patrzysz,
   idziesz dalej. Cała robota jest na wyjściu, bo pytanie nie brzmi „czy
   pamiętam listę", tylko „czy mam to słowo na tyle, żeby od razu coś z nim
   zrobić". Przed odtwarzaniem stoi krótka przerwa (15 s, do pominięcia), żeby
   ostatni pokój też wracał z mieszkania, a nie z ucha.
3. **Zero informacji zwrotnej w trakcie odtwarzania.** Błędy pokazujemy dopiero
   w podsumowaniu — inaczej człowiek uczy się poprawiania, a nie przypominania.

## Poziomy
| poziom | słowa | rymy przy odtwarzaniu |
|---|---|---|
| 1 | 2 | 2 |
| 2 | 4 | 4 |
| 3 | 6 | 6 |
| 4 | 9 | 9 |
| 5 | 12 | 12 |
| 6 | 16 | 16 |

Rym powstaje **przy odtwarzaniu, do słowa, które sam podałeś** — i to jest
w tym miejscu istotne: sprawdzamy go względem twojej odpowiedzi, nigdy względem
słowa, które naprawdę było w pokoju. Inaczej samo „to się nie rymuje" zdradzałoby,
że pomyliłeś słowo, a w odtwarzaniu nie ma prawa paść żaden sygnał o poprawności.
Rym sprawdza `rhymeQuality` z `wordbank/pl/phonetics.ts` (asonans wystarczy,
jakość ląduje w podsumowaniu). „Nie mam rymu — dalej" przepuszcza pokój.

## Kreator (3 kroki, na wzór pozostałych trybów)
1. **Poziom** — sześć kafelków: numer poziomu i liczba słów, nic więcej.
   Szczegóły (rekord, celność, tempo) to jedna linijka pod wyborem.
   Tam też wybierasz kategorię słów.
2. **Obchód** — ile stoisz w pokoju (2 / 3 / 5 s), przełącznik **„Pokaż 3D
   podczas zapamiętywania"**, mikrofon i podgląd planu mieszkania. Obchód idzie
   sam, więc kreator podaje też, ile w sumie zajmie (z chodzeniem włącznie).
3. **Start** — ReadyPanel z podsumowaniem + rekord dla tego poziomu.

## Przebieg rundy
1. `memorize` — obchód idzie sam: dojście do drzwi, słowo pojawia się dopiero
   po wejściu do pokoju, stoisz ustawione 2–5 s i drzwi dalej. Nic nie wpisujesz;
   „Mam to — dalej" skraca postój.
2. `gap` — 15 s przerwy z prostym zadaniem w głowie (odliczanie), do pominięcia.
3. `recall` — pokój po pokoju, **w kolejności**, stoper leci, zero sygnału
   o poprawności. W każdym pokoju dwa kroki: słowo, a potem rym do tego słowa.
   Jedno i drugie można pominąć („nie pamiętam" / „nie mam rymu").
4. `summary` — pozycja po pozycji: trafione / nie na swoim miejscu / pudło,
   twój rym i jego jakość, czas, ms na słowo, porównanie z historią i rekordem.

## Spacer 3D (bez nowych zależności — CSS 3D)
Mieszkanie, nie sznur pokoi: korytarz (przedpokój) biegnie w głąb, pokoje
wychodzą z niego raz w prawo, raz w lewo. Kamera ma pozycję **i obrót**:
wycofujesz się z pokoju na korytarz (520 ms) → idziesz pod właściwe drzwi
(900 ms) → skręcasz i wchodzisz (700 ms) → stoisz przy słowie tyle, ile
ustawisz. Wejście z progu pod pierwsze drzwi trwa dłużej (1600 ms) — stąd
zaczyna się cała trasa. Te czasy są celowo niespieszne: droga między pokojami
jest tym, co zostaje w głowie jako *trasa*; przy ćwierćsekundowych przeskokach
mieszkanie zamieniało się w pokaz slajdów. Rzut liczy `layout.ts` i korzystają z niego oba widoki.

- Pokój = podłoga, sufit, dwie ściany boczne i ściana ze słowem naprzeciw drzwi.
- Korytarz = podłoga, sufit, odcinki ścian z wyciętymi otworami drzwi
  i kolorowe framugi (z korytarza widać, gdzie i jakie są drzwi).
- Pokój bez podpisów — rozpoznajesz go po kształcie, wysokości, kolorze,
  wzorze ścian i **meblach** (sylwetki SVG, `furniture.tsx`). Jedyny tekst
  w scenie to słowo do zapamiętania (w odtwarzaniu: `?`).
- Kamera dopasowuje dystans do zmierzonego kadru, rysujemy tylko pokoje
  i odcinki ścian wokół siebie, `prefers-reduced-motion` wyłącza animację.

## Plan 2D (`FloorPlan.tsx`)
Schemat z góry, korytarz poziomo, wejście po lewej, pokoje nad i pod nim —
ta sama topologia co w 3D (kolejność, strona, kolor, proporcje), ale w stałej
podziałce, żeby przy szesnastu pokojach dało się cokolwiek odczytać. Jedzie
za tobą (auto-scroll do bieżącego pokoju). Pokazujemy go:
- w kreatorze — cały układ mieszkania,
- przy zapamiętywaniu — z wpisanymi już słowami w minionych pokojach,
- przy odtwarzaniu — sam układ i twoja pozycja,
- w podsumowaniu — obwódki na zielono/czerwono, widać, gdzie trasa się sypie.

## Model zapisu (`localStorage`, klucz `rymy.palace.v1`)
```ts
type PalaceRun = {
  ts: number; level: number; words: string[]; answers: string[];
  exact: number;        // trafione na właściwej pozycji
  present: number;      // pamiętane, ale nie na swoim miejscu
  recallMs: number;     // czas samego odtwarzania
  msPerWord: number;
  used3d: boolean; voice: boolean;
};
type PalaceProgress = {
  runs: PalaceRun[];                       // ostatnie 50
  best: Record<number, { exact: number; accuracy: number; msPerWord: number; ts: number }>;
  rooms: Record<number, { visits: number; exact: number }>;  // które pokoje gubisz
};
```
Funkcje: `loadPalace`, `recordPalaceRun`, `bestFor(level)`, `levelReport(level)`,
`suggestLevel()`, `clearPalace()`.

## Pliki
- `src/modes/MemoryPalace.tsx` — kreator + router trybu
- `src/modes/palace/config.ts` — poziomy, tempo, etykiety
- `src/modes/palace/rooms.ts` — stała definicja pokoi (deterministyczna)
- `src/modes/palace/PalaceRun.tsx` — fazy: memorize → distract → recall → summary
- `src/modes/palace/Walk3D.tsx` — spacer CSS 3D
- `src/modes/palace/Summary.tsx` — podsumowanie + porównanie z historią
- `src/modes/palace/words.ts` — dobór słów do zapamiętania
- `src/storage/palaceProgress.ts` — model wyników
- `src/pages/Home.tsx`, `src/pages/Practice.tsx` — wpięcie trybu

## Kroki wdrożenia
- [x] 1. Plan (ten plik)
- [x] 2. `storage/palaceProgress.ts` — model i zapis
- [x] 3. `palace/config.ts` + `palace/rooms.ts` + `palace/words.ts`
- [x] 4. `palace/Walk3D.tsx` — spacer 3D
- [x] 5. `palace/PalaceRun.tsx` — cztery fazy rundy
- [x] 6. `palace/Summary.tsx` — podsumowanie i porównania
- [x] 7. `modes/MemoryPalace.tsx` — kreator
- [x] 8. Wpięcie w Home + Practice, typecheck, build

## Mobile (zweryfikowane zrzutami 390×844)
- Scena dopasowuje kamerę do zmierzonej szerokości i wysokości kadru
  (`ResizeObserver`), więc czołowa ściana mieści się i na 360 px, i na desktopie.
- Rysujemy tylko pokój bieżący, poprzedni (bez czołowej ściany, na czas przejścia)
  i jeden do przodu — zamiast 16 pokoi × 5 warstw.
- Na telefonie: płaskie kolory zamiast gradientów i wzorów na bocznych ścianach,
  zero `filter: brightness` (osobna warstwa kompozytora na każdą klatkę),
  cieńsza ramka, niższa scena (260 px), `contain: strict` na kadrze.
- `prefers-reduced-motion` wyłącza animację kamery.
- Faza odtwarzania: pole tekstowe nad przyciskami na wąskim ekranie.
