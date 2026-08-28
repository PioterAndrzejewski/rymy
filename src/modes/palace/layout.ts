/**
 * Rzut mieszkania.
 *
 * Pokoje nie stoją jeden za drugim jak wagony — wychodzą z korytarza, raz
 * w prawo, raz w lewo. Dzięki temu trasa ma kształt, który da się narysować
 * w głowie: wchodzisz, idziesz przedpokojem, skręcasz do pokoju, wracasz na
 * korytarz, idziesz dalej. To ten sam rzut w 3D i na planie 2D — jedno źródło
 * prawdy dla obu widoków.
 */

import type { Room } from './rooms';

/** Szerokość korytarza (oś X). */
export const CORRIDOR_W = 230;
/** Wysokość korytarza. */
export const CORRIDOR_H = 250;
/** Odstęp między drzwiami kolejnych pokoi wzdłuż korytarza. */
export const SPACING = 360;
/** Kawałek korytarza przed pierwszymi drzwiami — tam stoisz na starcie. */
export const ENTRY_Z = 260;

export type Placed = {
  room: Room;
  index: number;
  /** +1 = pokój po prawej, -1 = po lewej */
  side: 1 | -1;
  /** środek drzwi na osi korytarza (ujemny — idziemy w głąb) */
  z: number;
  /** rozciągłość pokoju wzdłuż korytarza (szerokość drzwi i ściany ze słowem) */
  span: number;
  /** jak głęboko pokój wchodzi w bok */
  depth: number;
  /** x wewnętrznej krawędzi (przy korytarzu) i zewnętrznej (ściana ze słowem) */
  near: number;
  far: number;
};

export function layout(rooms: Room[]): Placed[] {
  return rooms.map((room, index) => {
    const side: 1 | -1 = index % 2 === 0 ? 1 : -1;
    // `width` pokoju to jego rozciągłość wzdłuż korytarza, `depth` — w bok.
    const span = room.width;
    const depth = room.depth * 0.62;
    const near = (side * CORRIDOR_W) / 2;
    return {
      room,
      index,
      side,
      z: -(index * SPACING),
      span,
      depth,
      near,
      far: side * (CORRIDOR_W / 2 + depth),
    };
  });
}

/** Gdzie kończy się korytarz — za ostatnimi drzwiami zostaje jeszcze kawałek. */
export function corridorEnd(placed: Placed[]): number {
  const last = placed.at(-1);
  return (last ? last.z : 0) - SPACING * 0.7;
}

/**
 * Ściany korytarza to odcinki między drzwiami: dla każdej strony przechodzimy
 * po pokojach z tej strony i wycinamy w ścianie ich otwory.
 */
export function wallSegments(placed: Placed[], side: 1 | -1, end: number) {
  const doors = placed
    .filter((p) => p.side === side)
    .sort((a, b) => b.z - a.z); // od wejścia w głąb
  const segments: { from: number; to: number }[] = [];
  let cursor = ENTRY_Z;
  for (const d of doors) {
    const top = d.z + d.span / 2;
    if (cursor > top) segments.push({ from: cursor, to: top });
    cursor = d.z - d.span / 2;
  }
  if (cursor > end) segments.push({ from: cursor, to: end });
  return segments;
}
