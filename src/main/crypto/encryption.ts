// ═══════════════════════════════════════════════════════════
// StealthNode — AES-256-GCM Encryption Engine
// ═══════════════════════════════════════════════════════════

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns: { ciphertext (base64), iv (hex), authTag (hex) }
 */
export function encrypt(plaintext: string, key: Buffer): { ciphertext: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 */
export function decrypt(ciphertext: string, key: Buffer, ivHex: string, authTagHex: string): string {
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generate a random salt
 */
export function generateSalt(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Derive an encryption key from the Argon2id password hash + vault salt
 * This is called AFTER Argon2id hashing — the passwordHash is already derived
 */
export function deriveKey(passwordHash: Buffer, salt: string): Buffer {
  return crypto.pbkdf2Sync(passwordHash, Buffer.from(salt, 'hex'), 100000, 32, 'sha512')
}

/**
 * Zero out a buffer for memory hygiene
 */
export function zeroBuffer(buf: Buffer): void {
  buf.fill(0)
}

/**
 * Encrypt a file and return the encrypted buffer
 */
export function encryptFile(data: Buffer, key: Buffer): { encrypted: Buffer; iv: string; authTag: string } {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypt a file buffer
 */
export function decryptFile(encrypted: Buffer, key: Buffer, ivHex: string, authTagHex: string): Buffer {
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}
