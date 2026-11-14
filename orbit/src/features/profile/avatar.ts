import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

import { AVATAR } from '@/data/constants';
import { supabase } from '@/lib/supabase';

import { setAvatarUrl } from './use-profile';

const SIZE = AVATAR.size;

/** Centre-crops to a square and shrinks it (web). Pictures stay small and consistent. */
async function toSquareJpeg(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process that image.'))), 'image/jpeg', 0.85),
  );
}

function friendly(message: string) {
  return /bucket not found|not found/i.test(message)
    ? 'Profile pictures are not set up yet. Run supabase/migrations/20261114040000_avatars.sql in the Supabase SQL editor.'
    : message;
}

/** Lets the student pick a picture, uploads it to their own folder and saves the URL. Returns false if cancelled. */
export async function chooseAndUploadAvatar(userId: string): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return false;
  const asset = result.assets[0];
  let blob: Blob = asset.file ?? (await fetch(asset.uri).then((r) => r.blob()));
  if (Platform.OS === 'web') {
    try {
      blob = await toSquareJpeg(blob);
    } catch {
      throw new Error('Could not read that image. Try a JPG or PNG.');
    }
  }
  if (blob.size > AVATAR.maxBytes) throw new Error('That picture is over 2 MB. Choose a smaller one.');

  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage.from(AVATAR.bucket).upload(path, blob, { upsert: true, contentType: Platform.OS === 'web' ? 'image/jpeg' : blob.type || 'image/jpeg' });
  if (error) throw new Error(friendly(error.message));
  // The version suffix busts caches: the file name never changes.
  await setAvatarUrl(`${supabase.storage.from(AVATAR.bucket).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`);
  return true;
}

export async function removeAvatar(userId: string) {
  await supabase.storage.from(AVATAR.bucket).remove([`${userId}/avatar.jpg`]);
  await setAvatarUrl(null);
}
