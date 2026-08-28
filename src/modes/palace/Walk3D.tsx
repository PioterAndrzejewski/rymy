import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text } from '@mantine/core';
import { inkOn, shade, wallBackground, wallBackgroundWithImage, type Room } from './rooms';
import { RoomFurniture } from './furniture';
import { useIsMobile } from './useIsMobile';
import {
  CORRIDOR_H, CORRIDOR_W, ENTRY_Z, corridorEnd, layout, wallSegments, type Placed,
} from './layout';

/**
 * Spacer po mieszkaniu — czyste CSS 3D, bez żadnej biblioteki.
 *
 * Kamera ma pozycję i obrót, a nie tylko `translateZ`: idziesz korytarzem,
 * stajesz w drzwiach, skręcasz do pokoju, a wychodząc cofasz się na korytarz
 * i ruszasz dalej. O to chodziło — pałac ma być mieszkaniem z rzutem, który
 * da się narysować w głowie, a nie sznurem pokoi.
 *
 * Ten sam komponent obsługuje odtwarzanie: wtedy `word` jest puste i na ścianie
 * widać znak zapytania — pokój zostaje wskazówką, słowo musi przyjść z głowy.
 *
 * Telefon: kadr dopasowuje się do zmierzonej szerokości, rysujemy tylko pokoje
 * i odcinki ścian wokół kamery, a wzory i cienie z bocznych ścian znikają.
 */

const PERSPECTIVE = 820;
/** Ile pokoi wokół bieżącego trafia do drzewa DOM. */
const CULL = 1;

/**
 * Etapy przejścia — razem dają WALK_MS z config.ts.
 *
 * Idą wolno celowo. Trasa między pokojami jest tym, co ma zostać w głowie
 * jako *droga*; przy ćwierćsekundowych przeskokach mieszkanie zamieniało się
 * w pokaz slajdów i zostawały same obrazki, bez kolejności.
 */
const STEP_OUT = 520;   // wycofanie się z pokoju na korytarz
const STEP_ALONG = 900; // przejście korytarzem pod właściwe drzwi
const STEP_IN = 700;    // skręt i wejście do pokoju

/**
 * Wejście z progu pod pierwsze drzwi — dłuższe niż zwykły marsz korytarzem.
 * Stąd zaczyna się cała trasa, więc jest chwila na rozejrzenie się.
 */
const STEP_ENTER = 1600;

type Pose = { x: number; z: number; rot: number };

type Props = {
  rooms: Room[];
  /** indeks pokoju, w którym stoimy */
  index: number;
  /** napis na ścianie; puste = pokój bez słowa (faza odtwarzania) */
  word?: string;
  /** wysokość sceny */
  height?: number;
  /** zdjęcia pokoi indeksowane tak jak rooms; undefined = brak zdjęcia */
  roomImages?: (string | undefined | null)[];
};

export function Walk3D({ rooms, index, word, height = 340, roomImages }: Props) {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const [viewport, setViewport] = useState(360);
  const boxRef = useRef<HTMLDivElement>(null);

  // Kadr liczymy z faktycznej szerokości kontenera, a nie ze sztywnych px —
  // dzięki temu ta sama scena siedzi tak samo na 360 px i na desktopie.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setViewport(entry.contentRect.width || 360));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const placed = useMemo(() => layout(rooms), [rooms]);
  const end = useMemo(() => corridorEnd(placed), [placed]);
  const clamped = Math.max(0, Math.min(index, placed.length - 1));
  const here = placed[clamped];

  /**
   * Jak daleko od ściany ze słowem staje kamera: tak, żeby ściana zmieściła
   * się w kadrze i wszerz, i wzwyż. Wysokie pokoje inaczej obcinałyby napis.
   */
  const fit = Math.min(
    (viewport * (mobile ? 0.86 : 0.78)) / here.span,
    (height * 0.8) / here.room.height,
  );
  const standoff = Math.max(170, Math.min(1000, PERSPECTIVE * (1 / fit - 1)));

  const corridorPose = (p: Placed): Pose => ({ x: 0, z: p.z, rot: 0 });
  const insidePose = (p: Placed): Pose => ({
    // stoimy tyłem do drzwi, twarzą w ścianę ze słowem
    x: p.side * Math.max(0, CORRIDOR_W / 2 + p.depth - standoff),
    z: p.z,
    rot: 90 * p.side,
  });

  const [pose, setPose] = useState<Pose>(() => ({ x: 0, z: ENTRY_Z, rot: 0 }));
  const [dur, setDur] = useState(STEP_IN);
  const prevIndex = useRef<number | null>(null);

  // Trasa między pokojami rozbita na etapy: wyjście na korytarz → marsz →
  // skręt do drzwi. Jeden `transform` przez wszystkie trzy, tylko z innym
  // celem i czasem, więc przeglądarka animuje to jak jedno płynne przejście.
  useEffect(() => {
    if (reduced) {
      setDur(0);
      setPose(insidePose(here));
      prevIndex.current = clamped;
      return;
    }
    const from = prevIndex.current;
    prevIndex.current = clamped;
    const timers: number[] = [];

    if (from === null) {
      // wejście do mieszkania: z progu prosto pod pierwsze drzwi i do środka
      setDur(STEP_ENTER);
      setPose(corridorPose(here));
      timers.push(window.setTimeout(() => { setDur(STEP_IN); setPose(insidePose(here)); }, STEP_ENTER));
    } else if (from !== clamped) {
      const before = placed[Math.max(0, Math.min(from, placed.length - 1))];
      setDur(STEP_OUT);
      setPose(corridorPose(before));
      timers.push(window.setTimeout(() => { setDur(STEP_ALONG); setPose(corridorPose(here)); }, STEP_OUT));
      timers.push(window.setTimeout(() => { setDur(STEP_IN); setPose(insidePose(here)); }, STEP_OUT + STEP_ALONG));
    } else {
      // ten sam pokój, zmienił się tylko kadr (obrót ekranu, zmiana słowa)
      setPose(insidePose(here));
    }
    return () => timers.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped, standoff, reduced]);

  const visible = placed.filter((p) => Math.abs(p.index - clamped) <= CULL);
  const nearZ = here.z;
  const inView = (z: number) => Math.abs(z - nearZ) < 1400;

  const activeImageUrl = roomImages?.[clamped] ?? undefined;

  // Fade the overlay in after the walk animation lands so the corridor
  // is still visible while walking, then the photo fills in on arrival.
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const overlayTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(overlayTimer.current);
    setOverlayOpacity(0);
    if (!activeImageUrl) { return; }
    const delay = prevIndex.current === null
      ? STEP_ENTER + STEP_IN - 200
      : STEP_OUT + STEP_ALONG + STEP_IN - 200;
    overlayTimer.current = window.setTimeout(
      () => setOverlayOpacity(1),
      reduced ? 0 : delay,
    );
    return () => window.clearTimeout(overlayTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped, activeImageUrl, reduced]);

  return (
    <Box
      ref={boxRef}
      style={{
        height,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--mantine-color-dark-5)',
        background: '#06070a',
        perspective: PERSPECTIVE,
        perspectiveOrigin: '50% 52%',
        contain: 'strict',
      }}
    >
      <Box
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${pose.rot}deg) translate3d(${-pose.x}px, 0px, ${-pose.z}px)`,
          willChange: 'transform',
          transition: reduced ? 'none' : `transform ${dur}ms cubic-bezier(.4,.02,.2,1)`,
        }}
      >
        <Corridor placed={placed} end={end} lite={mobile} inView={inView} />
        {visible.map((p) => (
          <RoomBox
            key={p.index}
            placed={p}
            word={p.index === clamped ? word : undefined}
            active={p.index === clamped}
            lite={mobile}
            imageUrl={roomImages?.[p.index] ?? undefined}
          />
        ))}
      </Box>

      {/* Full-bleed photo overlay — replaces the small 3D back-wall plane */}
      {activeImageUrl && (
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.38),rgba(0,0,0,0.38)), url("${activeImageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'grid',
            placeItems: 'center',
            opacity: overlayOpacity,
            transition: reduced ? 'none' : 'opacity 320ms ease',
            zIndex: 2,
          }}
        >
          <Text
            ta="center"
            style={{
              fontSize: `clamp(28px, ${Math.round(here.span / 6.5)}px, 56px)`,
              fontWeight: 800,
              lineHeight: 1.05,
              color: '#ffffff',
              wordBreak: 'break-word',
              padding: '0 32px',
              textShadow: '0 2px 18px rgba(0,0,0,0.9), 0 0 48px rgba(0,0,0,0.7)',
            }}
          >
            {word ?? '?'}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/** Wspólny styl płaszczyzny: wszystko jest liczone od środka kadru. */
function plane(style: React.CSSProperties): React.CSSProperties {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transformStyle: 'preserve-3d',
    backfaceVisibility: 'hidden',
    ...style,
  };
}

function Corridor({
  placed, end, lite, inView,
}: { placed: Placed[]; end: number; lite: boolean; inView: (z: number) => boolean }) {
  const length = ENTRY_Z - end;
  const mid = (ENTRY_Z + end) / 2;
  const floor = '#191b20';
  const wall = '#23262d';

  const segments = useMemo(
    () => ([1, -1] as const).flatMap((side) =>
      wallSegments(placed, side, end).map((s) => ({ side, ...s }))),
    [placed, end],
  );

  return (
    <>
      {/* podłoga korytarza */}
      <Box style={plane({
        width: CORRIDOR_W, height: length, background: floor,
        transform: `translate(-50%, -50%) translate3d(0px, ${CORRIDOR_H / 2}px, ${mid}px) rotateX(90deg)`,
      })} />
      {/* sufit korytarza */}
      <Box style={plane({
        width: CORRIDOR_W, height: length, background: '#101216',
        transform: `translate(-50%, -50%) translate3d(0px, ${-CORRIDOR_H / 2}px, ${mid}px) rotateX(-90deg)`,
      })} />
      {/* ściana na końcu korytarza — żeby nie kończył się pustką */}
      <Box style={plane({
        width: CORRIDOR_W, height: CORRIDOR_H, background: wall,
        transform: `translate(-50%, -50%) translate3d(0px, 0px, ${end}px)`,
      })} />
      {segments.map((s, i) => {
        const segMid = (s.from + s.to) / 2;
        if (!inView(segMid)) return null;
        return (
          <Box
            key={i}
            style={plane({
              width: s.from - s.to,
              height: CORRIDOR_H,
              background: s.side === 1 ? shade(wall, -4) : wall,
              transform: `translate(-50%, -50%) translate3d(${(s.side * CORRIDOR_W) / 2}px, 0px, ${segMid}px) rotateY(${-90 * s.side}deg)`,
            })}
          />
        );
      })}
      {/* framugi: z korytarza widać, gdzie są drzwi i jakiego są koloru */}
      {placed.map((p) => {
        if (!inView(p.z)) return null;
        const h = Math.min(CORRIDOR_H - 8, p.room.height);
        return (
          <Box
            key={`door-${p.index}`}
            style={plane({
              width: p.span, height: h,
              border: `${lite ? 4 : 6}px solid ${p.room.accent}`,
              transform: `translate(-50%, -50%) translate3d(${(p.side * CORRIDOR_W) / 2}px, ${(CORRIDOR_H - h) / 2}px, ${p.z}px) rotateY(${-90 * p.side}deg)`,
            })}
          />
        );
      })}
    </>
  );
}

function RoomBox({ placed, word, active, lite, imageUrl }: { placed: Placed; word?: string; active: boolean; lite: boolean; imageUrl?: string }) {
  const { room, side, z, span, depth, far } = placed;
  const h = room.height;
  const ink = inkOn(room.wall);
  const midX = (side * (CORRIDOR_W / 2) + far) / 2;
  const opacity = active ? 1 : 0.55;
  const hasPhoto = !!imageUrl;

  const side1 = lite ? shade(room.wall, -14) : wallBackground(room);
  const side2 = lite ? shade(room.wall, -22) : wallBackground(room);

  return (
    <>
      {/* Structural geometry — hidden when a photo fills the back wall */}
      {!hasPhoto && (
        <>
          {/* podłoga */}
          <Box style={plane({
            width: depth, height: span, opacity,
            background: lite ? room.floor : `linear-gradient(180deg, ${shade(room.floor, 6)}, ${room.floor})`,
            transform: `translate(-50%, -50%) translate3d(${midX}px, ${h / 2}px, ${z}px) rotateX(90deg)`,
          })} />
          {/* sufit */}
          <Box style={plane({
            width: depth, height: span, opacity,
            background: shade(room.wall, -35),
            transform: `translate(-50%, -50%) translate3d(${midX}px, ${-h / 2}px, ${z}px) rotateX(-90deg)`,
          })} />
          {/* ściany boczne pokoju — prostopadłe do korytarza */}
          <Box style={plane({
            width: depth, height: h, opacity, background: side1,
            transform: `translate(-50%, -50%) translate3d(${midX}px, 0px, ${z - span / 2}px)`,
          })} />
          <Box style={plane({
            width: depth, height: h, opacity, background: side2,
            transform: `translate(-50%, -50%) translate3d(${midX}px, 0px, ${z + span / 2}px) rotateY(180deg)`,
          })} />
        </>
      )}
      {/* ściana ze słowem — naprzeciwko drzwi */}
      <Box style={plane({
        width: span, height: h, opacity,
        background: hasPhoto ? wallBackgroundWithImage(room, imageUrl!) : wallBackground(room),
        transform: `translate(-50%, -50%) translate3d(${far}px, 0px, ${z}px) rotateY(${-90 * side}deg)`,
        display: 'grid',
        placeItems: 'center',
        borderBottom: hasPhoto ? undefined : `${lite ? 5 : 8}px solid ${shade(room.floor, 10)}`,
        padding: 12,
      })}>
        {/* Furniture only when no photo — it would float over the image otherwise */}
        {!hasPhoto && <RoomFurniture room={room} index={placed.index} />}
        <Box
          ta="center"
          style={{ position: 'relative', zIndex: 1, maxWidth: span - 32 }}
        >
          <Text
            style={{
              fontSize: Math.round(Math.min(52, Math.max(24, span / 6.5))),
              fontWeight: 800,
              lineHeight: 1.05,
              color: hasPhoto ? '#ffffff' : (word ? ink : room.accent),
              wordBreak: 'break-word',
              textShadow: hasPhoto
                ? '0 2px 18px rgba(0,0,0,0.9), 0 0 48px rgba(0,0,0,0.7)'
                : `0 2px 10px ${shade(room.wall, 30)}`,
            }}
          >
            {word ?? '?'}
          </Text>
        </Box>
      </Box>
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
