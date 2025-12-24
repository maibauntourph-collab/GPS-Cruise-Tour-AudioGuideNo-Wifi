// Offline Data Encryption/Decryption utilities using Web Crypto API

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

// Generate a key from a password
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data
export async function encryptData(data: any, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const jsonData = JSON.stringify(data);
  const dataBuffer = encoder.encode(jsonData);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Derive key from password
  const key = await deriveKey(password, salt);

  // Encrypt data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv
    },
    key,
    dataBuffer
  );

  // Combine salt + iv + encrypted data
  const resultBuffer = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
  resultBuffer.set(salt, 0);
  resultBuffer.set(iv, salt.length);
  resultBuffer.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

  // Convert to base64 (chunked to avoid stack overflow)
  let binary = '';
  const bytes = new Uint8Array(resultBuffer);
  const chunkSize = 0x8000; // 32KB chunks
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Decrypt data
export async function decryptData(encryptedBase64: string, password: string): Promise<any> {
  // Convert from base64 (chunked to avoid stack overflow)
  const binaryString = atob(encryptedBase64);
  const encryptedData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    encryptedData[i] = binaryString.charCodeAt(i);
  }

  // Extract salt, iv, and encrypted data
  const salt = encryptedData.slice(0, 16);
  const iv = encryptedData.slice(16, 16 + IV_LENGTH);
  const encryptedBuffer = encryptedData.slice(16 + IV_LENGTH);

  // Derive key from password
  const key = await deriveKey(password, salt);

  // Decrypt data
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv
      },
      key,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    const jsonData = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonData);
  } catch (error) {
    throw new Error('Decryption failed. Wrong password or corrupted data.');
  }
}

// Download encrypted data as a file
export function downloadEncryptedData(encryptedData: string, filename: string): void {
  const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Read encrypted data from a file
export function readEncryptedFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsText(file);
  });
}
