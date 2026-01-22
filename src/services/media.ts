// Use the legacy API to avoid deprecation warnings
import * as FileSystem from 'expo-file-system/legacy';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

export async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function persistPhoto(uri: string, prefix: string): Promise<string> {
  await ensurePhotosDir();
  const extMatch = uri.match(/\.(jpg|jpeg|png)$/i);
  const ext = extMatch ? extMatch[1] : 'jpg';
  const filename = `${prefix}_${Date.now()}.${ext}`;
  const dest = PHOTOS_DIR + filename;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}
