import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Interface representing the global cached Mongoose and MemoryServer instances.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  mongoServer: MongoMemoryServer | null;
  uri: string | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache || {
  conn: null,
  promise: null,
  mongoServer: null,
  uri: null,
};

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

let listenersAttached = false;

function ensureConnectionListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('disconnected', () => {
    cached.conn = null;
    cached.promise = null;
  });

  mongoose.connection.on('close', () => {
    cached.conn = null;
    cached.promise = null;
  });
}

/**
 * Connects to MongoDB with global connection caching across Next.js serverless route invocations.
 *
 * Behavior:
 * 1. If process.env.MONGODB_URI is provided:
 *    - Attempts connection with a 5000ms server selection timeout.
 *    - In production, connection errors are thrown.
 *    - In development/test, connection failures fall back to embedded mongodb-memory-server.
 * 2. If process.env.MONGODB_URI is NOT provided:
 *    - In production, throws an informative configuration error.
 *    - In development/test, automatically spins up mongodb-memory-server with zero manual setup.
 */
export async function connectDB(): Promise<typeof mongoose> {
  ensureConnectionListeners();

  // 1. Return existing active connection immediately if ready
  if (cached.conn) {
    const readyState =
      cached.conn.connection?.readyState ??
      (cached.conn as unknown as { readyState?: number }).readyState;
    if (readyState === 1) {
      return cached.conn;
    }
    // If cached.conn exists but readyState !== 1, reset cached state and reconnect
    cached.conn = null;
    cached.promise = null;
  }

  // 2. Return pending connection promise if one is already in flight (prevents race conditions)
  if (cached.promise) {
    return cached.promise;
  }

  const connectOptions: mongoose.ConnectOptions = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  };

  cached.promise = (async () => {
    const configuredUri = process.env.MONGODB_URI?.trim();

    // --- STRATEGY 1: Connect to configured MONGODB_URI if provided ---
    if (configuredUri) {
      try {
        console.log('[lib/mongodb] Connecting to configured MONGODB_URI...');
        const conn = await mongoose.connect(configuredUri, connectOptions);
        cached.conn = conn;
        cached.uri = configuredUri;
        console.log('[lib/mongodb] Successfully connected to configured MongoDB.');
        return conn;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[lib/mongodb] Connection to MONGODB_URI failed: ${errorMsg}`);

        if (process.env.NODE_ENV === 'production') {
          console.error('[lib/mongodb] Fatal: External MongoDB connection failed in production.');
          throw err;
        }

        console.warn('[lib/mongodb] Falling back to embedded in-memory MongoDB for development/test...');
      }
    } else {
      // No MONGODB_URI provided
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'Fatal: MONGODB_URI environment variable is not defined. Set MONGODB_URI in production.'
        );
      }
      console.log(
        '[lib/mongodb] MONGODB_URI not provided. Initializing embedded mongodb-memory-server for zero-config dev/test...'
      );
    }

    // --- STRATEGY 2: In-Memory MongoDB Fallback (Dev / Test) ---
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');

      if (!cached.mongoServer) {
        cached.mongoServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'brothers_photography',
          },
        });
      }

      const memoryUri = cached.mongoServer.getUri();
      const conn = await mongoose.connect(memoryUri, {
        bufferCommands: false,
      });

      cached.conn = conn;
      cached.uri = memoryUri;
      console.log(`[lib/mongodb] Connected to embedded in-memory MongoDB at: ${memoryUri}`);
      return conn;
    } catch (memErr) {
      console.error('[lib/mongodb] Failed to start in-memory MongoDB fallback:', memErr);
      throw memErr;
    }
  })()
    .then((conn) => {
      if (!('readyState' in conn)) {
        Object.defineProperty(conn, 'readyState', {
          get() {
            return this.connection?.readyState;
          },
          configurable: true,
        });
      }
      cached.conn = conn;
      cached.promise = null;
      return conn;
    })
    .catch((err) => {
      // Reset cached state so subsequent invocations can retry
      cached.conn = null;
      cached.promise = null;
      throw err;
    });

  return cached.promise;
}

/**
 * Disconnects Mongoose and cleanly stops any embedded mongodb-memory-server.
 * Essential for test suite teardown and graceful shutdown.
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
  } else if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (cached.mongoServer) {
    await cached.mongoServer.stop();
    cached.mongoServer = null;
  }
  cached.promise = null;
  cached.uri = null;
  console.log('[lib/mongodb] Disconnected and stopped memory server.');
}

/**
 * Returns the currently connected MongoDB URI, or null if disconnected.
 */
export function getActiveMongoUri(): string | null {
  return cached.uri;
}

export default connectDB;
