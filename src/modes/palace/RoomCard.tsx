import { Box, Text } from '@mantine/core';
import { inkOn, wallBackground, wallBackgroundWithImage, type Room } from './rooms';
import { RoomFurniture } from './furniture';

/**
 * Ten sam pokój bez 3D: kolor, wzór i rekwizyt zostają, znika tylko spacer.
 * Używane, gdy spacer jest wyłączony w kreatorze, przy `prefers-reduced-motion`
 * i w podsumowaniu, gdzie pokoje trzeba pokazać obok siebie.
 */
export function RoomCard({
  room, index, word, height = 200, muted = false, imageUrl,
}: { room: Room; index: number; word?: string; height?: number; muted?: boolean; imageUrl?: string }) {
  const ink = inkOn(room.wall);
  return (
    <Box
      style={{
        height,
        borderRadius: 12,
        overflow: 'hidden',
        background: imageUrl ? wallBackgroundWithImage(room, imageUrl) : wallBackground(room),
        border: `3px solid ${room.accent}`,
        display: 'grid',
        placeItems: 'center',
        padding: 12,
        opacity: muted ? 0.55 : 1,
        position: 'relative',
      }}
    >
      <Box
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '22%',
          background: room.floor, opacity: 0.9,
        }}
      />
      <RoomFurniture room={room} index={index} />
      <Box ta="center" style={{ position: 'relative', zIndex: 1, marginBottom: word ? '18%' : 0 }}>
        <Text
          style={{
            fontSize: 'clamp(20px, 6vw, 40px)', fontWeight: 800, lineHeight: 1.1,
            color: word ? ink : room.accent, wordBreak: 'break-word',
          }}
        >
          {word ?? '?'}
        </Text>
      </Box>
    </Box>
  );
}
