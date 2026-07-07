import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxWidthOrHeight: 2200,
      maxSizeMB: 3,
      useWebWorker: true,
    });
  } catch (error) {
    console.error('Image compression failed, using original file:', error);
    return file;
  }
}
