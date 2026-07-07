import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxWidthOrHeight: 2000,
      maxSizeMB: 4,
      useWebWorker: true,
    });
  } catch (error) {
    console.error('Image compression failed, using original file:', error);
    return file;
  }
}
