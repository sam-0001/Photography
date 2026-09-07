import crypto from 'node:crypto';
import path from 'node:path';

/**
 * Sanitizes an incoming upload filename to strictly prevent directory traversal,
 * null-byte injection, and invalid filesystem characters.
 */
export function sanitizeUploadFilename(rawFilename: string): string {
  if (!rawFilename || typeof rawFilename !== 'string') {
    return `media_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.jpg`;
  }

  // 1. Strip null bytes
  let clean = rawFilename.replace(/\0/g, '');

  // 2. Extract base name handling both POSIX (/) and Windows (\) path separators
  clean = clean.split(/[/\\]/).pop() || 'media_asset';

  // 3. Remove characters outside alphanumeric, dot, hyphen, underscore
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');

  // 4. Collapse consecutive dots to a single dot (prevents '..' path traversal)
  clean = clean.replace(/\.{2,}/g, '.');

  // 5. Strip leading dots (prevents hidden unix dotfiles like .env, .htaccess)
  clean = clean.replace(/^\.+/, '');

  // 6. Ensure non-empty fallback
  if (!clean || clean === '.') {
    clean = `media_${Date.now()}`;
  }

  // 7. Limit length to 100 characters to prevent filesystem buffer issues
  if (clean.length > 100) {
    const ext = path.extname(clean);
    clean = clean.substring(0, 90) + ext;
  }

  return clean;
}

/**
 * Generates a collision-safe filename with timestamp and crypto random bytes.
 */
export function generateStoredFilename(sanitizedFilename: string, index = 0): string {
  const timestamp = Date.now();
  const rand = crypto.randomBytes(4).toString('hex');
  return `${timestamp}_${index}_${rand}-${sanitizedFilename}`;
}

/**
 * Verifies that the resolved path stays strictly confined within the target directory.
 * Throws an Error if a directory escape is detected.
 */
export function verifyPathIntegrity(targetDir: string, storedFilename: string): string {
  const resolvedBase = path.resolve(targetDir);
  const resolvedTarget = path.resolve(targetDir, storedFilename);

  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    throw new Error(`Security Violation: Path traversal escape detected for ${storedFilename}`);
  }

  return resolvedTarget;
}
