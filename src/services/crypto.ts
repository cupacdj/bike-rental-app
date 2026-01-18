import * as Crypto from 'expo-crypto';

export function randomSalt(): string {
  // 16 bytes hex-ish
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function sha256(text: string): Promise<string> {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256(`${salt}:${password}`);
}
