/**
 * Pałac jest jeden i jest stały.
 *
 * Cała metoda loci stoi na tym, że miejsca się nie zmieniają: pokój 1 to zawsze
 * ten sam mały biały przedpokój — na poziomie 1 i na poziomie 6, dziś i za pół
 * roku. Wyższe poziomy tylko dokładają kolejne pokoje na końcu trasy.
 *
 * Dlatego to jest zwykła stała tablica, a nie coś losowanego przy starcie.
 */

export type RoomPattern = 'plain' | 'stripes' | 'dots' | 'checker' | 'panels';

export type Room = {
  /** nazwa, którą użytkownik zapamiętuje razem z miejscem */
  name: string;
  /** kolor ścian */
  wall: string;
  /** kolor podłogi */
  floor: string;
  /** akcent — listwa, rama, napis */
  accent: string;
  /** wysokość pokoju w px (przestrzeń 3D) */
  height: number;
  /** szerokość pokoju w px */
  width: number;
  /** głębokość pokoju w px — ile „idziesz" przez ten pokój */
  depth: number;
  pattern: RoomPattern;
  /** jednowyrazowy rekwizyt: druga kotwica pamięciowa obok samego pokoju */
  prop: string;
};

/**
 * Szesnaście pokoi — tyle, ile ma najwyższy poziom. Kolejność jest trasą:
 * wchodzisz drzwiami i idziesz przed siebie.
 */
export const ROOMS: Room[] = [
  { name: 'Przedpokój',           wall: '#f2f0ea', floor: '#3c3733', accent: '#c9a227', height: 210, width: 260, depth: 300, pattern: 'plain',   prop: '🔑' },
  { name: 'Kuchnia',              wall: '#dfe9e3', floor: '#2f3a35', accent: '#4aa06a', height: 250, width: 340, depth: 380, pattern: 'checker', prop: '🍳' },
  { name: 'Salon',                wall: '#3b2f2a', floor: '#241d1a', accent: '#e0a458', height: 300, width: 420, depth: 460, pattern: 'panels',  prop: '🛋️' },
  { name: 'Łazienka',             wall: '#cfe3f2', floor: '#38424a', accent: '#3f8fd0', height: 220, width: 240, depth: 280, pattern: 'checker', prop: '🚿' },
  { name: 'Sypialnia',            wall: '#4a3350', floor: '#241a28', accent: '#c98bd8', height: 260, width: 360, depth: 400, pattern: 'plain',   prop: '🛏️' },
  { name: 'Biuro',                wall: '#2b3a45', floor: '#1d262c', accent: '#6fd3e0', height: 330, width: 300, depth: 320, pattern: 'stripes', prop: '🖥️' },
  { name: 'Wyjście na taras',     wall: '#25211d', floor: '#171412', accent: '#f3b81d', height: 230, width: 200, depth: 520, pattern: 'stripes', prop: '🚪' },
  { name: 'Czytelnia',            wall: '#3a2b1f', floor: '#221913', accent: '#d9b26a', height: 320, width: 400, depth: 420, pattern: 'panels',  prop: '📖' },
  { name: 'Pokój gier',           wall: '#1f2b3a', floor: '#141b24', accent: '#6aa9f0', height: 250, width: 320, depth: 360, pattern: 'dots',    prop: '🎮' },
  { name: 'Regały',               wall: '#3d3520', floor: '#231e12', accent: '#e6c65c', height: 200, width: 220, depth: 260, pattern: 'dots',    prop: '📚' },
  { name: 'Schody',               wall: '#2a2a33', floor: '#191921', accent: '#a9a5ff', height: 380, width: 260, depth: 480, pattern: 'stripes', prop: '🪜' },
  { name: 'Spiżarnia',            wall: '#3a3129', floor: '#221d18', accent: '#e08a4b', height: 200, width: 380, depth: 420, pattern: 'panels',  prop: '🫙' },
  { name: 'Sypialnia dziecka',    wall: '#1b2320', floor: '#0f1513', accent: '#5fb08a', height: 210, width: 300, depth: 380, pattern: 'plain',   prop: '🧸' },
  { name: 'Garaż z samochodem',   wall: '#2c2f33', floor: '#1a1c1f', accent: '#d3d7dc', height: 280, width: 460, depth: 440, pattern: 'checker', prop: '🚗' },
  { name: 'Taras',                wall: '#24382c', floor: '#152018', accent: '#8fe08a', height: 350, width: 420, depth: 460, pattern: 'dots',    prop: '☀️' },
  { name: 'Warsztat',             wall: '#2d2438', floor: '#1a1522', accent: '#f3b81d', height: 430, width: 240, depth: 340, pattern: 'stripes', prop: '🔧' },
];

export function roomsFor(count: number): Room[] {
  return ROOMS.slice(0, Math.min(count, ROOMS.length));
}

/** Krótki opis pod nazwą: „mały, białe ściany, w kratkę". */
export function roomTraits(r: Room): string {
  const size = r.width <= 240 ? 'ciasny' : r.width >= 400 ? 'szeroki' : 'średni';
  const tall = r.height >= 330 ? ', wysoki' : r.height <= 210 ? ', niski' : '';
  const pattern =
    r.pattern === 'stripes' ? 'w pasy'
      : r.pattern === 'dots' ? 'w kropki'
      : r.pattern === 'checker' ? 'w kratkę'
      : r.pattern === 'panels' ? 'w panele'
      : 'gładkie ściany';
  return `${size}${tall} · ${pattern}`;
}

/**
 * Layered background when a room has an image: dark scrim → photo → pattern.
 * Uses CSS multi-background so the pattern shows through if the image fails.
 */
export function wallBackgroundWithImage(room: Room, imageUrl: string): string {
  return [
    'linear-gradient(rgba(0,0,0,0.38),rgba(0,0,0,0.38))',
    `url("${imageUrl}") center/cover no-repeat`,
    wallBackground(room),
  ].join(',');
}

/** Tło ściany: kolor bazowy + wzór, ten sam w 3D i na kartce. */
export function wallBackground(r: Room): string {
  switch (r.pattern) {
    case 'stripes':
      return `repeating-linear-gradient(90deg, ${r.wall} 0 22px, ${shade(r.wall, -10)} 22px 44px)`;
    case 'dots':
      return `radial-gradient(${shade(r.wall, -18)} 3px, transparent 3.5px) 0 0/28px 28px, ${r.wall}`;
    case 'checker':
      return `repeating-conic-gradient(${r.wall} 0% 25%, ${shade(r.wall, -8)} 0% 50%) 0 0/48px 48px`;
    case 'panels':
      return `repeating-linear-gradient(0deg, ${r.wall} 0 46px, ${shade(r.wall, -12)} 46px 50px)`;
    default:
      return r.wall;
  }
}

/** Przyciemnia/rozjaśnia #rrggbb o podany procent — do wzorów i cieni ścian. */
export function shade(hex: string, percent: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => {
    const next = Math.round(v + (percent / 100) * 255);
    return Math.max(0, Math.min(255, next));
  };
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Czy napis na ścianie ma być ciemny, czy jasny. */
export function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.55 ? '#17130d' : '#fdf8ec';
}
