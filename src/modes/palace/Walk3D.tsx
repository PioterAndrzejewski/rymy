import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text } from '@mantine/core';
import { WALK_MS } from './config';
import { inkOn, shade, wallBackground, type Room } from './rooms';
import { RoomFurniture } from './furniture';
import { useIsMobile } from './useIsMobile';

/**
 * Spacer po pałacu — czyste CSS 3D, bez żadnej biblioteki.
 *
 * Pokoje stoją jeden za drugim wzdłuż osi Z. „Kamerą" jest jeden `translateZ`
 * na kontenerze świata: przejście między pokojami jest krótkie (WALK_MS),
 * a stanie w pokoju trwa tyle, ile trzeba na zapamiętanie — o to chodziło,
 * żeby ruch nie nudził, a postój dawał czas.
 *
 * Ten sam komponent obsługuje odtwarzanie: wtedy `word` jest puste i na ścianie
 * widać znak zapytania — pokój zostaje wskazówką, słowo musi przyjść z głowy.
 *
 * Telefon: scena dopasowuje się do szerokości ekranu (kamera cofa się tyle,
 * ile trzeba, żeby czołowa ściana zmieściła się w kadrze), rysujemy tylko
 * pokoje wokół bieżącego, a wzory i cienie z bocznych ścian znikają —
 * na telefonie liczy się płynny spacer, nie render.
 */

const PERSPECTIVE = 800;
/**
 * Ile pokoi wokół kamery trafia do drzewa DOM. Poprzedni pokój zostaje tylko
 * na czas przejścia (inaczej spacer to lot przez czerń), ale bez swojej
 * czołowej ściany — ta wylądowałaby za obiektywem jako wielka plama.
 */
const CULL_BEHIND = 1;
const CULL_AHEAD = 1;

type Props = {
  rooms: Room[];
  /** indeks pokoju, w którym stoimy */
  index: number;
  /** napis na ścianie; puste = pokój bez słowa (faza odtwarzania) */
  word?: string;
  /** wysokość sceny */
  height?: number;
};

export function Walk3D({ rooms, index, word, height = 340 }: Props) {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const [viewport, setViewport] = useState(360);
  const boxRef = useRef<HTMLDivElement>(null);

  // Kadr liczymy z faktycznej szerokości kontenera, a nie ze sztywnych px —
  // dzięki temu ta sama scena siedzi tak samo na 360 px i na desktopie.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      setViewport(entry.contentRect.width || 360);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Gdzie kończy się każdy pokój, licząc od wejścia.
  const ends = useMemo(() => {
    let z = 0;
    return rooms.map((r) => (z += r.depth));
  }, [rooms]);

  const clamped = Math.max(0, Math.min(index, rooms.length - 1));
  const room = rooms[clamped];

  /**
   * Odległość kamery dobrana tak, żeby czołowa ściana zmieściła się w kadrze
   * i wszerz, i wzwyż: scale = P / (P + standoff). Bez tego wysokie pokoje
   * (wieża, schody) obcinałyby napis górą i dołem na telefonie.
   */
  const fit = Math.min(
    (viewport * (mobile ? 0.86 : 0.78)) / room.width,
    (height * 0.8) / room.height,
  );
  const standoff = Math.max(180, Math.min(1100, PERSPECTIVE * (1 / fit - 1)));
  const camZ = (ends[clamped] ?? standoff) - standoff;

  return (
    <Box
      ref={boxRef}
      style={{
        height,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--mantine-color-dark-5)',
        background: '#07080a',
        perspective: PERSPECTIVE,
        perspectiveOrigin: '50% 52%',
        // Bez tego iOS przy każdym kroku przemalowuje całą scenę od zera.
        contain: 'strict',
      }}
    >
      <Box
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `translateZ(${camZ}px)`,
          willChange: 'transform',
          transition: reduced ? 'none' : `transform ${WALK_MS}ms cubic-bezier(.45,.05,.25,1)`,
        }}
      >
        {rooms.map((r, i) => {
          // 16 pokoi na raz to 96 warstw 3D — telefon tego nie udźwignie,
          // a i tak widać tylko najbliższe.
          if (i < clamped - CULL_BEHIND || i > clamped + CULL_AHEAD) return null;
          return (
            <RoomBox
              key={i}
              room={r}
              start={(ends[i] ?? 0) - r.depth}
              end={ends[i] ?? 0}
              // Napis wisi tylko w pokoju, w którym stoimy — sąsiednie ściany
              // zostają puste, żeby nic nie podpowiadało przez drzwi.
              word={i === clamped ? word : undefined}
              active={i === clamped}
              index={i}
              lite={mobile}
              showFront={i >= clamped}
            />
          );
        })}
      </Box>
    </Box>
  );
}

function RoomBox({
  room, start, end, word, active, index, lite, showFront,
}: {
  room: Room; start: number; end: number; word?: string;
  active: boolean; index: number; lite: boolean; showFront: boolean;
}) {
  const mid = (start + end) / 2;
  const w = room.width;
  const h = room.height;
  const d = room.depth;
  const ink = inkOn(room.wall);

  const plane = (style: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    transformStyle: 'preserve-3d',
    backfaceVisibility: 'hidden',
    opacity: active ? 1 : 0.5,
    ...style,
  });

  // Boczne ściany na telefonie dostają płaski kolor zamiast wzoru: to trzy
  // warstwy gradientu mniej na każdą klatkę, a i tak mija się je w biegu.
  const sideWall = lite ? shade(room.wall, -14) : wallBackground(room);

  return (
    <>
      {/* podłoga — ściany boczne i sufit obracamy tak, żeby ich licem był
          środek pokoju; przy odwrotnym obrocie widać tył i plane znika */}
      {/* podłoga */}
      <Box style={plane({
        width: w, height: d,
        background: lite ? room.floor : `linear-gradient(180deg, ${shade(room.floor, 6)}, ${room.floor})`,
        transform: `translate(-50%, -50%) translate3d(0px, ${h / 2}px, ${-mid}px) rotateX(90deg)`,
      })} />
      {/* sufit */}
      <Box style={plane({
        width: w, height: d,
        background: shade(room.wall, -35),
        transform: `translate(-50%, -50%) translate3d(0px, ${-h / 2}px, ${-mid}px) rotateX(-90deg)`,
      })} />
      {/* ściana lewa — ciemniejsza wersja koloru zamiast filtra brightness:
          filtr wymusza osobną warstwę kompozytora na każdą klatkę spaceru */}
      <Box style={plane({
        width: d, height: h,
        background: lite ? shade(room.wall, -22) : sideWall,
        transform: `translate(-50%, -50%) translate3d(${-w / 2}px, 0px, ${-mid}px) rotateY(90deg)`,
      })} />
      {/* ściana prawa */}
      <Box style={plane({
        width: d, height: h,
        background: sideWall,
        transform: `translate(-50%, -50%) translate3d(${w / 2}px, 0px, ${-mid}px) rotateY(-90deg)`,
      })} />
      {/* ściana czołowa — na niej wisi słowo, więc wzór zostaje zawsze */}
      {showFront && (
      <Box style={plane({
        width: w, height: h,
        background: wallBackground(room),
        transform: `translate(-50%, -50%) translate3d(0px, 0px, ${-end}px)`,
        display: 'grid',
        placeItems: 'center',
        border: `${lite ? 4 : 6}px solid ${room.accent}`,
        padding: 12,
      })}>
        {/* Meble są jedyną „etykietą" pokoju — nazwy nie piszemy nigdzie
            w scenie, bo to użytkownik ma sobie to miejsce nazwać sam. */}
        <RoomFurniture room={room} index={index} />
        <Box
          ta="center"
          style={{ position: 'relative', zIndex: 1, maxWidth: w - 32, marginBottom: word ? h * 0.18 : 0 }}
        >
          <Text
            style={{
              fontSize: Math.round(Math.min(52, Math.max(24, w / 6.5))),
              fontWeight: 800,
              lineHeight: 1.05,
              color: word ? ink : room.accent,
              wordBreak: 'break-word',
              textShadow: `0 2px 10px ${shade(room.wall, 30)}`,
            }}
          >
            {word ?? '?'}
          </Text>
        </Box>
      </Box>
      )}
    </>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return reduced;
}
