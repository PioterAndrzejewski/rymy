import { useEffect, useMemo, useRef } from 'react';
import { Box } from '@mantine/core';
import type { Room } from './rooms';
import { layout } from './layout';

/**
 * Rzut mieszkania z góry.
 *
 * To jest druga połowa nauki: spacer pokazuje pokój od środka, a plan — jak
 * pokoje leżą względem siebie. Dopiero z obu razem robi się mapa, po której
 * da się przejść w głowie w dowolnym momencie.
 *
 * Plan jest schematem, nie rysunkiem w skali: korytarz leży poziomo (wejście
 * po lewej), a każdy pokój dostaje tyle samo miejsca wzdłuż korytarza. Rzut
 * w skali 1:1 przy szesnastu pokojach robi się paskiem, na którym nic nie
 * widać. Zgadza się to, co ma się zgadzać: kolejność, strona korytarza,
 * kolor pokoju i jego proporcje.
 */

export type RoomStatus = 'ok' | 'bad' | 'none';

/** Ile miejsca zajmuje jeden pokój wzdłuż korytarza. */
const SLOT = 104;
const HALL_H = 46;
const PAD = 16;
const ENTRY_W = 54;

type Props = {
  rooms: Room[];
  /** pokój, w którym właśnie jesteś (-1 = żaden) */
  current?: number;
  /** krótki napis w pokoju — słowo w fazie zapamiętywania, wynik w podsumowaniu */
  labels?: (index: number) => string | undefined;
  /** kolor obwódki w podsumowaniu */
  status?: (index: number) => RoomStatus;
  height?: number;
};

export function FloorPlan({ rooms, current = -1, labels, status, height = 190 }: Props) {
  const placed = useMemo(() => layout(rooms), [rooms]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const maxDepth = Math.max(...placed.map((p) => p.depth), 1);
  // Głębokość pokoju skalujemy do pasa nad i pod korytarzem.
  const band = (height - HALL_H - PAD * 2) / 2;
  const depthOf = (d: number) => Math.max(34, (d / maxDepth) * band);

  const width = PAD * 2 + ENTRY_W + placed.length * SLOT;
  const midY = height / 2;
  const xOf = (i: number) => PAD + ENTRY_W + i * SLOT + SLOT / 2;

  // Plan jedzie za tobą — przy szesnastu pokojach bieżący i tak jest poza kadrem.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || current < 0) return;
    const target = xOf(current) - el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, placed.length]);

  return (
    <Box
      ref={scrollRef}
      className="rymy-hscroll"
      style={{
        borderRadius: 12,
        border: '1px solid var(--mantine-color-dark-5)',
        background: '#0b0d11',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* korytarz */}
        <rect
          x={PAD} y={midY - HALL_H / 2}
          width={width - PAD * 2} height={HALL_H}
          fill="#181b21" stroke="#2c313a" strokeWidth={2} rx={4}
        />
        {/* wejście */}
        <rect x={PAD} y={midY - HALL_H / 2} width={8} height={HALL_H} fill="#f3b81d" />
        <text x={PAD + 14} y={midY + 4} fontSize={11} fill="#8b8f98">wejście</text>

        {placed.map((p) => {
          const isCurrent = p.index === current;
          const st = status?.(p.index) ?? 'none';
          const stroke = st === 'ok' ? '#4ac97e' : st === 'bad' ? '#e0574b' : p.room.accent;
          const d = depthOf(p.depth);
          const w = Math.min(SLOT - 16, Math.max(48, (p.span / 460) * (SLOT - 12)));
          const x = xOf(p.index) - w / 2;
          // side +1 rysujemy pod korytarzem, -1 nad — lustrzanie do spaceru,
          // gdzie prawa strona (side +1) odpowiada południu na rzucie z góry.
          const y = p.side === 1 ? midY + HALL_H / 2 : midY - HALL_H / 2 - d;
          const label = labels?.(p.index);
          return (
            <g key={p.index} opacity={current < 0 || isCurrent ? 1 : 0.72}>
              <rect
                x={x} y={y} width={w} height={d} rx={4}
                fill={p.room.wall}
                fillOpacity={isCurrent ? 0.95 : 0.55}
                stroke={stroke}
                strokeWidth={isCurrent ? 3.5 : 2}
              />
              {/* drzwi na korytarz */}
              <rect
                x={x + w / 2 - 9}
                y={p.side === 1 ? midY + HALL_H / 2 - 2 : midY - HALL_H / 2 - 2}
                width={18} height={4} fill="#0b0d11"
              />
              <text
                x={x + w / 2} y={y + 16}
                textAnchor="middle" fontSize={13} fontWeight={800}
                fill="#12161c" opacity={0.8}
              >
                {p.index + 1}
              </text>
              {label && (
                <text
                  x={x + w / 2} y={y + d - 8}
                  textAnchor="middle" fontSize={11} fontWeight={700} fill="#12161c"
                >
                  {label.length > 10 ? `${label.slice(0, 9)}…` : label}
                </text>
              )}
            </g>
          );
        })}

        {/* gdzie stoisz */}
        {current >= 0 && placed[current] && (
          <circle
            cx={xOf(current)}
            cy={midY + (placed[current].side === 1 ? HALL_H / 2 + 8 : -HALL_H / 2 - 8)}
            r={6} fill="#f3b81d" stroke="#0b0d11" strokeWidth={2}
          />
        )}
      </svg>
    </Box>
  );
}
