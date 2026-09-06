import type { FinanceData } from '@/src/types/finance';

export async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export const encode64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

export const decode64 = (text: string) =>
  Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

export async function encryptBackup(data: FinanceData, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12)),
    key = await deriveKey(password, salt),
    encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(data)),
    );
  return {
    format: 'sahod-encrypted-v1',
    salt: encode64(salt),
    iv: encode64(iv),
    ciphertext: encode64(new Uint8Array(encrypted)),
  };
}

export async function decryptBackup(
  payload: { salt: string; iv: string; ciphertext: string },
  password: string,
) {
  const salt = decode64(payload.salt),
    iv = decode64(payload.iv),
    key = await deriveKey(password, salt),
    decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      decode64(payload.ciphertext),
    );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
