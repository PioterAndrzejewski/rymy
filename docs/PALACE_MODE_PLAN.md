# Tryb 3: Pałac mentalny (metoda loci)

## Czego uczy
Klasyczna metoda loci: przypinasz słowa do stałych, znajomych miejsc i odzyskujesz
je *w kolejności*, idąc pamięcią przez to samo mieszkanie. Dla rapera to warsztat
pod zapamiętywanie zwrotki bez kartki — kolejność punktów tekstu = kolejność pokoi.

Trzy rzeczy, które robimy inaczej niż zwykła „gra w zapamiętywanie":
1. **Pałac jest stały.** Pokój 1 wygląda tak samo na każdym poziomie i w każdej sesji —
   wyższe poziomy tylko *dokładają* pokoje. Dzięki temu pałac zostaje w głowie na stałe.
2. **Rozproszenie między zapamiętywaniem a odtwarzaniem** — kilka szybkich zadań
   „podaj rym do…" (tyle, ile wynosi poziom). Bez tego test mierzy pamięć roboczą,
   a nie pałac.
3. **Zero informacji zwrotnej w trakcie odtwarzania.** Błędy pokazujemy dopiero
   w podsumowaniu — inaczej człowiek uczy się poprawiania, a nie przypominania.

## Poziomy
| poziom | słowa | zadania-rozpraszacze (rymy) |
|---|---|---|
| 1 | 2 | 1 |
| 2 | 4 | 2 |
| 3 | 6 | 3 |
| 4 | 9 | 4 |
| 5 | 12 | 5 |
| 6 | 16 | 6 |

## Kreator (3 kroki, na wzór pozostałych trybów)
1. **Poziom** — karty poziomów + info ile słów / ile rozpraszaczy; podpowiedź
   „program" = pierwszy poziom, którego jeszcze nie zdałeś na ≥80%.
2. **Zapamiętywanie** — czas na słowo (szybko/normalnie/spokojnie),
   przełącznik **„Pokaż 3D podczas zapamiętywania"**, źródło słów (losowe / z kategorii).
3. **Start** — ReadyPanel z podsumowaniem + rekord dla tego poziomu.

## Przebieg rundy
1. `memorize` — słowo po słowie, każde w swoim pokoju (2D karta albo spacer 3D).
2. `distract` — N mini-zadań: „rym do X" (walidacja przez `matchesEnding`), krótki timer.
3. `recall` — pole tekstowe / mikrofon, słowa **w kolejności**, stoper leci.
   Zero sygnału o poprawności; można pominąć pozycję („nie pamiętam").
4. `summary` — pozycja po pozycji: trafione / nie na swoim miejscu / pudło,
   czas, ms na słowo, porównanie z poprzednimi wynikami i z rekordem.

## Spacer 3D (bez nowych zależności — CSS 3D)
> Zrealizowane: pokój bez żadnych podpisów — rozpoznajesz go po kształcie,
> kolorze i meblach (sylwetki SVG, `furniture.tsx`). Jedyny tekst w scenie to
> słowo do zapamiętania.
- Korytarz pokoi w `transform-style: preserve-3d`; kamera to jeden `translateZ`.
- Pokój = podłoga + sufit + 2 ściany boczne + ściana czołowa z wielkim słowem.
- Charakterystyka pokoju liczona deterministycznie z jego **indeksu** (`ROOMS[i]`):
  kolor, wysokość, szerokość, wzór (paski / kropki / kratka / gładka), nazwa
  („mały biały pokój"). Indeks 0 zawsze taki sam → pałac jest stały.
- Tempo: przejście między pokojami szybkie (~650 ms), postój w pokoju długi
  (czas na słowo z kreatora, domyślnie 3 s).
- `prefers-reduced-motion` → fallback do widoku 2D (kartka po kartce).

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
