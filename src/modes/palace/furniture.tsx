import { Fragment } from 'react';
import { shade, type Room } from './rooms';

/**
 * Meble pokoju — proste sylwetki SVG, żadnych podpisów.
 *
 * Pokój ma być rozpoznawalny tak, jak rozpoznaje się własne mieszkanie:
 * po kształcie i po tym, co w nim stoi. Napis z nazwą zdradzałby to, co
 * użytkownik ma sobie sam zbudować w głowie — jedyny tekst w scenie to słowo
 * do zapamiętania.
 *
 * Każdy mebel rysujemy w kwadracie 0–100 i ustawiamy transformem, dzięki czemu
 * cała biblioteka to kilka prostokątów, a nie osobne grafiki.
 */

export type FurnitureId =
  | 'door' | 'mirror' | 'hooks' | 'shoes' | 'fridge' | 'stove' | 'table' | 'sofa'
  | 'tv' | 'lamp' | 'bathtub' | 'sink' | 'bed' | 'wardrobe' | 'plant' | 'chair'
  | 'railing' | 'picture' | 'shelf' | 'armchair' | 'desk' | 'speakers' | 'jars'
  | 'boxes' | 'stairs' | 'window' | 'barrel' | 'car' | 'workbench' | 'bench'
  | 'telescope';

type Placement = { id: FurnitureId; x: number; scale?: number };

/** Sylwetka: ciemna bryła + akcent na detalu. */
function Piece({ id, dark, accent }: { id: FurnitureId; dark: string; accent: string }) {
  const b = { fill: dark };
  const a = { fill: accent };
  switch (id) {
    case 'door':
      return (<>
        <rect x={18} y={8} width={64} height={92} rx={3} {...b} />
        <rect x={24} y={16} width={52} height={76} rx={2} fill={shade(dark, 12)} />
        <circle cx={70} cy={56} r={4} {...a} />
      </>);
    case 'mirror':
      return (<>
        <ellipse cx={50} cy={40} rx={26} ry={34} {...a} opacity={0.35} />
        <ellipse cx={50} cy={40} rx={22} ry={30} fill={shade(dark, 30)} />
      </>);
    case 'hooks':
      return (<>
        <rect x={10} y={26} width={80} height={7} {...b} />
        <rect x={24} y={33} width={5} height={12} {...b} />
        <rect x={70} y={33} width={5} height={12} {...b} />
        <path d="M20 45 l18 34 h-22 z" {...a} opacity={0.8} />
        <path d="M66 45 l16 30 h-20 z" {...b} />
      </>);
    case 'shoes':
      return (<>
        <path d="M8 100 v-12 h20 l14 12 z" {...b} />
        <path d="M52 100 v-12 h20 l14 12 z" {...b} />
      </>);
    case 'fridge':
      return (<>
        <rect x={22} y={2} width={56} height={98} rx={4} {...b} />
        <rect x={22} y={40} width={56} height={3} fill={shade(dark, 25)} />
        <rect x={68} y={24} width={4} height={14} rx={2} {...a} />
      </>);
    case 'stove':
      return (<>
        <rect x={10} y={44} width={80} height={56} rx={3} {...b} />
        <rect x={10} y={44} width={80} height={7} {...a} opacity={0.7} />
        <circle cx={32} cy={70} r={9} fill={shade(dark, 22)} />
        <circle cx={64} cy={70} r={9} fill={shade(dark, 22)} />
      </>);
    case 'table':
      return (<>
        <rect x={4} y={52} width={92} height={8} rx={3} {...b} />
        <rect x={12} y={60} width={7} height={40} {...b} />
        <rect x={81} y={60} width={7} height={40} {...b} />
        <ellipse cx={50} cy={48} rx={10} ry={5} {...a} />
      </>);
    case 'sofa':
      return (<>
        <rect x={4} y={44} width={92} height={30} rx={8} {...b} />
        <rect x={4} y={62} width={92} height={26} rx={6} fill={shade(dark, 14)} />
        <rect x={0} y={50} width={14} height={38} rx={6} {...b} />
        <rect x={86} y={50} width={14} height={38} rx={6} {...b} />
        <rect x={30} y={52} width={26} height={14} rx={4} {...a} opacity={0.75} />
        <rect x={12} y={88} width={8} height={12} {...b} />
        <rect x={80} y={88} width={8} height={12} {...b} />
      </>);
    case 'tv':
      return (<>
        <rect x={6} y={16} width={88} height={54} rx={4} {...b} />
        <rect x={12} y={22} width={76} height={42} {...a} opacity={0.35} />
        <rect x={44} y={70} width={12} height={18} {...b} />
        <rect x={28} y={88} width={44} height={7} rx={3} {...b} />
      </>);
    case 'lamp':
      return (<>
        <path d="M32 34 h36 l10 22 h-56 z" {...a} opacity={0.85} />
        <rect x={47} y={56} width={6} height={38} {...b} />
        <rect x={34} y={94} width={32} height={6} rx={3} {...b} />
      </>);
    case 'bathtub':
      return (<>
        <path d="M4 56 h92 v22 a14 14 0 0 1 -14 14 h-64 a14 14 0 0 1 -14 -14 z" {...b} />
        <rect x={4} y={52} width={92} height={6} rx={3} {...a} opacity={0.6} />
      </>);
    case 'sink':
      return (<>
        <rect x={22} y={46} width={56} height={16} rx={5} {...b} />
        <rect x={46} y={62} width={8} height={38} {...b} />
        <rect x={48} y={28} width={4} height={18} {...a} />
      </>);
    case 'bed':
      return (<>
        <rect x={2} y={30} width={16} height={62} rx={4} {...b} />
        <rect x={2} y={62} width={96} height={26} rx={5} fill={shade(dark, 16)} />
        <rect x={20} y={54} width={30} height={12} rx={5} {...a} opacity={0.8} />
        <rect x={6} y={88} width={8} height={12} {...b} />
        <rect x={86} y={88} width={8} height={12} {...b} />
      </>);
    case 'wardrobe':
      return (<>
        <rect x={14} y={0} width={72} height={100} rx={3} {...b} />
        <rect x={49} y={0} width={3} height={100} fill={shade(dark, 25)} />
        <circle cx={44} cy={52} r={3} {...a} />
        <circle cx={57} cy={52} r={3} {...a} />
      </>);
    case 'plant':
      return (<>
        <path d="M50 60 C20 50 18 20 44 12 C46 32 50 44 50 60 Z" {...a} opacity={0.85} />
        <path d="M50 62 C82 50 84 22 58 14 C54 34 52 46 50 62 Z" fill={shade(accent, -18)} />
        <path d="M34 66 h32 l-6 34 h-20 z" {...b} />
      </>);
    case 'chair':
      return (<>
        <rect x={28} y={12} width={10} height={54} {...b} />
        <rect x={28} y={60} width={48} height={8} rx={3} {...b} />
        <rect x={30} y={68} width={6} height={32} {...b} />
        <rect x={68} y={68} width={6} height={32} {...b} />
        <rect x={30} y={22} width={8} height={26} {...a} opacity={0.6} />
      </>);
    case 'railing':
      return (<>
        <rect x={0} y={40} width={100} height={6} rx={3} {...a} opacity={0.8} />
        {[6, 26, 46, 66, 86].map((x) => <rect key={x} x={x} y={46} width={5} height={54} {...b} />)}
      </>);
    case 'picture':
      return (<>
        <rect x={20} y={10} width={60} height={44} rx={2} {...a} opacity={0.5} />
        <rect x={26} y={16} width={48} height={32} fill={shade(dark, 20)} />
      </>);
    case 'shelf':
      return (<>
        <rect x={8} y={0} width={84} height={100} rx={2} {...b} />
        {[24, 50, 76].map((y) => <rect key={y} x={8} y={y} width={84} height={5} fill={shade(dark, 22)} />)}
        {[14, 40, 66].map((y) => (
          <Fragment key={y}>
            <rect x={16} y={y - 4} width={7} height={26} {...a} opacity={0.75} />
            <rect x={26} y={y - 1} width={6} height={23} fill={shade(accent, -25)} />
            <rect x={35} y={y - 6} width={8} height={28} {...a} opacity={0.5} />
          </Fragment>
        ))}
      </>);
    case 'armchair':
      return (<>
        <rect x={16} y={40} width={68} height={30} rx={8} {...b} />
        <rect x={16} y={60} width={68} height={26} rx={6} fill={shade(dark, 14)} />
        <rect x={8} y={48} width={14} height={38} rx={6} {...b} />
        <rect x={78} y={48} width={14} height={38} rx={6} {...b} />
        <rect x={20} y={86} width={8} height={14} {...b} />
        <rect x={72} y={86} width={8} height={14} {...b} />
      </>);
    case 'desk':
      return (<>
        <rect x={2} y={48} width={96} height={8} rx={2} {...b} />
        <rect x={6} y={56} width={26} height={44} {...b} />
        <rect x={88} y={56} width={7} height={44} {...b} />
        <rect x={44} y={22} width={34} height={24} rx={2} {...a} opacity={0.5} />
        <rect x={58} y={46} width={6} height={4} {...b} />
      </>);
    case 'speakers':
      return (<>
        <rect x={8} y={30} width={26} height={70} rx={3} {...b} />
        <rect x={66} y={30} width={26} height={70} rx={3} {...b} />
        <circle cx={21} cy={52} r={8} {...a} opacity={0.7} />
        <circle cx={79} cy={52} r={8} {...a} opacity={0.7} />
        <circle cx={21} cy={78} r={5} fill={shade(dark, 25)} />
        <circle cx={79} cy={78} r={5} fill={shade(dark, 25)} />
      </>);
    case 'jars':
      return (<>
        {[10, 40, 70].map((x, i) => (
          <Fragment key={x}>
            <rect x={x} y={60 - i * 4} width={20} height={40 + i * 4} rx={4} {...b} />
            <rect x={x + 2} y={66 - i * 4} width={16} height={12} {...a} opacity={0.6} />
          </Fragment>
        ))}
      </>);
    case 'boxes':
      return (<>
        <rect x={4} y={54} width={44} height={46} rx={2} {...b} />
        <rect x={52} y={68} width={40} height={32} rx={2} fill={shade(dark, 14)} />
        <rect x={14} y={54} width={24} height={4} {...a} opacity={0.7} />
        <rect x={60} y={68} width={22} height={4} {...a} opacity={0.5} />
      </>);
    case 'stairs':
      return (<>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={i * 20} y={100 - (i + 1) * 20} width={20} height={(i + 1) * 20} {...b} />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={`a${i}`} x={i * 20} y={100 - (i + 1) * 20} width={20} height={4} {...a} opacity={0.6} />
        ))}
      </>);
    case 'window':
      return (<>
        <rect x={10} y={4} width={80} height={70} rx={2} {...a} opacity={0.35} />
        <rect x={10} y={4} width={80} height={70} rx={2} fill="none" stroke={dark} strokeWidth={7} />
        <rect x={46} y={4} width={7} height={70} {...b} />
        <rect x={10} y={35} width={80} height={7} {...b} />
      </>);
    case 'barrel':
      return (<>
        <rect x={22} y={26} width={56} height={74} rx={12} {...b} />
        <rect x={22} y={44} width={56} height={6} {...a} opacity={0.6} />
        <rect x={22} y={74} width={56} height={6} {...a} opacity={0.6} />
      </>);
    case 'car':
      return (<>
        <path d="M2 82 v-18 l18 -22 h44 l20 22 h14 v18 z" {...b} />
        <path d="M24 62 l10 -14 h26 l12 14 z" {...a} opacity={0.45} />
        <circle cx={26} cy={84} r={13} fill={shade(dark, -10)} />
        <circle cx={76} cy={84} r={13} fill={shade(dark, -10)} />
      </>);
    case 'workbench':
      return (<>
        <rect x={2} y={50} width={96} height={9} rx={2} {...b} />
        <rect x={8} y={59} width={8} height={41} {...b} />
        <rect x={84} y={59} width={8} height={41} {...b} />
        <rect x={20} y={16} width={60} height={32} rx={2} fill={shade(dark, 12)} />
        <rect x={28} y={22} width={10} height={20} {...a} opacity={0.7} />
        <rect x={46} y={22} width={6} height={20} {...a} opacity={0.5} />
      </>);
    case 'bench':
      return (<>
        <rect x={4} y={54} width={92} height={9} rx={3} {...b} />
        <rect x={4} y={30} width={92} height={7} rx={3} {...b} />
        <rect x={12} y={63} width={8} height={37} {...b} />
        <rect x={80} y={63} width={8} height={37} {...b} />
      </>);
    case 'telescope':
      return (<>
        <path d="M22 74 L74 20 l14 12 L36 84 z" {...b} />
        <path d="M70 16 l18 16 -8 8 -18 -16 z" {...a} opacity={0.8} />
        <rect x={44} y={70} width={8} height={30} {...b} />
        <path d="M30 100 l18 -30 18 30 z" {...b} />
      </>);
    default:
      return null;
  }
}

/** Rozkład mebli w każdym pokoju — indeks pokoju jest kluczem, jak wszystko tutaj. */
export const ROOM_FURNITURE: Placement[][] = [
  [{ id: 'door', x: 34, scale: 1 }, { id: 'hooks', x: 8, scale: 0.6 }, { id: 'shoes', x: 74, scale: 0.5 }],
  [{ id: 'fridge', x: 4, scale: 0.9 }, { id: 'stove', x: 38, scale: 0.7 }, { id: 'table', x: 68, scale: 0.6 }],
  [{ id: 'sofa', x: 6, scale: 0.85 }, { id: 'tv', x: 68, scale: 0.6 }, { id: 'lamp', x: 56, scale: 0.5 }],
  [{ id: 'bathtub', x: 4, scale: 0.8 }, { id: 'sink', x: 64, scale: 0.6 }, { id: 'mirror', x: 68, scale: 0.4 }],
  [{ id: 'bed', x: 4, scale: 0.9 }, { id: 'lamp', x: 76, scale: 0.45 }, { id: 'wardrobe', x: 88, scale: 0.5 }],
  [{ id: 'railing', x: 0, scale: 1 }, { id: 'plant', x: 8, scale: 0.6 }, { id: 'chair', x: 62, scale: 0.6 }],
  [{ id: 'door', x: 6, scale: 0.8 }, { id: 'picture', x: 46, scale: 0.6 }, { id: 'lamp', x: 76, scale: 0.5 }],
  [{ id: 'shelf', x: 2, scale: 0.95 }, { id: 'armchair', x: 60, scale: 0.7 }, { id: 'lamp', x: 88, scale: 0.4 }],
  [{ id: 'desk', x: 4, scale: 0.8 }, { id: 'chair', x: 46, scale: 0.6 }, { id: 'speakers', x: 70, scale: 0.6 }],
  [{ id: 'shelf', x: 4, scale: 0.8 }, { id: 'jars', x: 56, scale: 0.6 }, { id: 'boxes', x: 78, scale: 0.5 }],
  [{ id: 'stairs', x: 8, scale: 0.95 }, { id: 'railing', x: 40, scale: 0.7 }],
  [{ id: 'boxes', x: 4, scale: 0.85 }, { id: 'window', x: 56, scale: 0.6 }, { id: 'lamp', x: 84, scale: 0.4 }],
  [{ id: 'barrel', x: 6, scale: 0.7 }, { id: 'boxes', x: 44, scale: 0.7 }, { id: 'lamp', x: 84, scale: 0.4 }],
  [{ id: 'car', x: 2, scale: 1 }, { id: 'workbench', x: 62, scale: 0.7 }],
  [{ id: 'plant', x: 2, scale: 0.9 }, { id: 'bench', x: 40, scale: 0.7 }, { id: 'window', x: 74, scale: 0.6 }],
  [{ id: 'telescope', x: 10, scale: 0.9 }, { id: 'window', x: 62, scale: 0.6 }],
];

/**
 * Meble jednego pokoju jako jedna warstwa SVG — stawiamy ją tuż przed czołową
 * ścianą, więc w 3D wygląda jak wnętrze widziane od progu.
 */
export function RoomFurniture({ room, index }: { room: Room; index: number }) {
  const items = ROOM_FURNITURE[index] ?? [];
  const dark = shade(room.floor, 18);
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMidYMax meet"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden
    >
      {items.map((it, i) => {
        const s = (it.scale ?? 0.7) * 0.6;
        return (
          <g key={`${it.id}-${i}`} transform={`translate(${it.x} ${60 - 100 * s}) scale(${s})`}>
            <Piece id={it.id} dark={dark} accent={room.accent} />
          </g>
        );
      })}
    </svg>
  );
}
