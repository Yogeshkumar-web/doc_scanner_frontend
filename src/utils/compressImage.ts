const MAX_WIDTH_OR_HEIGHT = 2000;
const MAX_SIZE_BYTES = 4 * 1024 * 1024;
const JPEG_QUALITY = 0.92;

function getTargetSize(width: number, height: number) {
  const maxSide = Math.max(width, height);
  if (maxSide <= MAX_WIDTH_OR_HEIGHT) {
    return { width, height };
  }

  const scale = MAX_WIDTH_OR_HEIGHT / maxSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode resized image.'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function compressImage(file: File): Promise<File> {
  let bitmap: ImageBitmap | null = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    });
    const target = getTargetSize(bitmap.width, bitmap.height);
    const shouldResize = target.width !== bitmap.width || target.height !== bitmap.height;
    const shouldReencode = file.size > MAX_SIZE_BYTES || file.type !== 'image/jpeg';

    if (!shouldResize && !shouldReencode) {
      return file;
    }

    canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext('2d', {
      alpha: false,
    });
    if (!context) {
      throw new Error('Canvas rendering is not available.');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, target.width, target.height);

    const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
    return new File(
      [blob],
      file.name.replace(/\.(png|webp|heic|heif)$/i, '.jpg') || 'scan.jpg',
      {
        type: 'image/jpeg',
        lastModified: Date.now(),
      },
    );
  } catch (error) {
    console.error('Image compression failed, using original file:', error);
    return file;
  } finally {
    bitmap?.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
