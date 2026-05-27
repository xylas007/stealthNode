// ═══════════════════════════════════════════════════════════
// StealthNode — Authentication Module (hash-wasm / Argon2id)
// ═══════════════════════════════════════════════════════════

import crypto from 'crypto'

// hash-wasm is ESM — we'll use dynamic import
let hashWasm: any = null

async function getHashWasm() {
  if (!hashWasm) {
    hashWasm = await import('hash-wasm')
  }
  return hashWasm
}

/**
 * Hash a master password using Argon2id via hash-wasm (pure WASM)
 */
export async function hashPassword(password: string): Promise<string> {
  const hw = await getHashWasm()
  const salt = crypto.randomBytes(16)
  const hash = await hw.argon2id({
    password,
    salt,
    parallelism: 4,
    iterations: 3,
    memorySize: 65536, // 64MB
    hashLength: 32,
    outputType: 'encoded' // returns PHC string format
  })
  return hash
}

/**
 * Verify a master password against its Argon2id hash
 */
export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const hw = await getHashWasm()
  try {
    return await hw.argon2Verify({ password, hash: encodedHash })
  } catch {
    return false
  }
}

/**
 * Derive a raw 32-byte key from password + salt for encryption
 */
export async function deriveRawKey(password: string, salt: string): Promise<Buffer> {
  const hw = await getHashWasm()
  const saltBuffer = Buffer.from(salt, 'hex')
  const hash = await hw.argon2id({
    password,
    salt: saltBuffer,
    parallelism: 4,
    iterations: 3,
    memorySize: 65536,
    hashLength: 32,
    outputType: 'binary' // returns Uint8Array
  })
  return Buffer.from(hash)
}

/**
 * Hash a security question answer (case-insensitive, lighter params)
 */
export async function hashAnswer(answer: string): Promise<string> {
  const hw = await getHashWasm()
  const normalized = answer.trim().toLowerCase()
  const salt = crypto.randomBytes(16)
  return await hw.argon2id({
    password: normalized,
    salt,
    parallelism: 2,
    iterations: 2,
    memorySize: 16384,
    hashLength: 32,
    outputType: 'encoded'
  })
}

/**
 * Verify a security question answer
 */
export async function verifyAnswer(answer: string, encodedHash: string): Promise<boolean> {
  const hw = await getHashWasm()
  const normalized = answer.trim().toLowerCase()
  try {
    return await hw.argon2Verify({ password: normalized, hash: encodedHash })
  } catch {
    return false
  }
}

/**
 * Generate a random hex salt
 */
export function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex')
}
