const key = (i: number) => `palace-room-img-${i}`;

export function loadRoomImage(index: number): string | null {
  try { return localStorage.getItem(key(index)); } catch { return null; }
}

export function saveRoomImage(index: number, dataUrl: string): void {
  try { localStorage.setItem(key(index), dataUrl); } catch {}
}

export function clearRoomImage(index: number): void {
  try { localStorage.removeItem(key(index)); } catch {}
}

export function loadAllRoomImages(): (string | null)[] {
  return Array.from({ length: 16 }, (_, i) => loadRoomImage(i));
}

/**
 * Resizes a File to at most 900×600 and encodes it as a WebP data URL.
 * Keeps the aspect ratio; never upscales.
 */
export function fileToDataUrl(
  file: File,
  maxW = 900,
  maxH = 600,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxW / img.width, maxH / img.height);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no canvas context')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')); };
    img.src = url;
  });
}
