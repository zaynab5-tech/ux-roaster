export interface CompressedImageResult {
  dataUrl: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
}

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.85;

/**
 * Resizes an image data URL or Blob/File on an HTML <canvas> so its maximum
 * width or height is 1280px, exporting as JPEG (0.85 quality).
 */
export function compressImageToJpeg(
  source: File | string
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const loadFromUrl = (url: string, revokeAfter: boolean) => {
      const img = new Image();
      img.onload = () => {
        try {
          let targetW = img.naturalWidth || img.width;
          let targetH = img.naturalHeight || img.height;

          if (targetW > MAX_DIMENSION || targetH > MAX_DIMENSION) {
            if (targetW >= targetH) {
              targetH = Math.round((targetH * MAX_DIMENSION) / targetW);
              targetW = MAX_DIMENSION;
            } else {
              targetW = Math.round((targetW * MAX_DIMENSION) / targetH);
              targetH = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, targetW);
          canvas.height = Math.max(1, targetH);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            if (revokeAfter) URL.revokeObjectURL(url);
            reject(new Error('Canvas 2D context is unavailable for image compression.'));
            return;
          }

          // Fill white background so transparent PNGs convert cleanly to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          if (revokeAfter) URL.revokeObjectURL(url);

          resolve({
            dataUrl,
            mimeType: 'image/jpeg',
            width: canvas.width,
            height: canvas.height,
          });
        } catch (err) {
          if (revokeAfter) URL.revokeObjectURL(url);
          reject(err);
        }
      };

      img.onerror = () => {
        if (revokeAfter) URL.revokeObjectURL(url);
        reject(new Error('Failed to decode the uploaded image for compression.'));
      };

      img.src = url;
    };

    if (typeof source === 'string') {
      loadFromUrl(source, false);
    } else {
      const objectUrl = URL.createObjectURL(source);
      loadFromUrl(objectUrl, true);
    }
  });
}
