import { useRef, useState } from 'react';
import { ActionIcon, Box, Group, HoverCard, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconCamera, IconX } from '@tabler/icons-react';
import { wallBackground, type Room } from './rooms';
import { fileToDataUrl } from '@/storage/roomImages';

type Props = {
  rooms: Room[];
  /** Custom data-URL images from localStorage; same length as ROOMS (16). */
  customImages: (string | null)[];
  /** Resolved image URL per room (custom > public fallback); same length as ROOMS. */
  roomImages: (string | undefined | null)[];
  onSetImage: (index: number, dataUrl: string) => void;
  onClearImage: (index: number) => void;
};

export function RoomImagePicker({ rooms, customImages, roomImages, onSetImage, onClearImage }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);

  function triggerUpload(idx: number) {
    setPendingIdx(idx);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || pendingIdx === null) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      onSetImage(pendingIdx, dataUrl);
    } catch {}
    e.target.value = '';
    setPendingIdx(null);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <SimpleGrid cols={{ base: 4, sm: 8 }} spacing="xs">
        {rooms.map((room, i) => (
          <RoomThumbnail
            key={i}
            index={i}
            room={room}
            imageSrc={roomImages[i] ?? undefined}
            hasCustom={!!customImages[i]}
            onUpload={() => triggerUpload(i)}
            onClear={() => onClearImage(i)}
          />
        ))}
      </SimpleGrid>
    </>
  );
}

function RoomThumbnail({
  index, room, imageSrc, hasCustom, onUpload, onClear,
}: {
  index: number;
  room: Room;
  imageSrc?: string;
  hasCustom: boolean;
  onUpload: () => void;
  onClear: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hasImg = !!imageSrc && !imgFailed;

  return (
    <HoverCard width={230} shadow="md" openDelay={180} closeDelay={80} position="top" withinPortal>
      <HoverCard.Target>
        <Box style={{ position: 'relative' }}>
          {/* Thumbnail */}
          <Box
            onClick={onUpload}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              height: 68,
              borderRadius: 8,
              overflow: 'hidden',
              background: wallBackground(room),
              border: `2px solid ${room.accent}`,
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {hasImg && (
              <img
                src={imageSrc}
                alt={room.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={() => setImgFailed(true)}
              />
            )}
            {/* Camera icon overlay on hover */}
            <Box style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 140ms',
            }}>
              <IconCamera size={22} color="white" />
            </Box>
          </Box>

          <Text size="xs" ta="center" mt={3} lineClamp={1} c="dimmed">
            {room.name}
          </Text>

          {/* Remove custom image */}
          {hasCustom && (
            <ActionIcon
              size={16}
              radius="xl"
              color="red"
              variant="filled"
              style={{ position: 'absolute', top: 2, right: 2 }}
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              aria-label="Usuń zdjęcie"
            >
              <IconX size={10} />
            </ActionIcon>
          )}
        </Box>
      </HoverCard.Target>

      <HoverCard.Dropdown p={10}>
        <Stack gap={8}>
          {/* Preview */}
          <Box
            style={{
              borderRadius: 8,
              overflow: 'hidden',
              height: 140,
              background: wallBackground(room),
              border: `2px solid ${room.accent}`,
            }}
          >
            {hasImg && (
              <img
                src={imageSrc}
                alt={room.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={() => setImgFailed(true)}
              />
            )}
          </Box>

          <Group justify="space-between" align="center" gap={4}>
            <Text size="xs" fw={700}>{room.name}</Text>
            <Text size="xs" c="dimmed">pokój {index + 1}</Text>
          </Group>

          <Text size="xs" c="dimmed">
            {hasCustom
              ? 'Twoje zdjęcie · kliknij miniaturę, żeby zmienić'
              : hasImg
                ? 'Domyślne zdjęcie · kliknij, żeby zastąpić swoim'
                : 'Brak zdjęcia · kliknij, żeby dodać swoje'}
          </Text>
        </Stack>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}
