import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxWidthOrHeight: 3000,
      maxSizeMB: 5,
      useWebWorker: true,
    });
  } catch (error) {
    console.error('Image compression failed, using original file:', error);
    return file;
  }
}
