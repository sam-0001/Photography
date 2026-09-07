import mongoose from 'mongoose';
import { ClientEvent, IClientEvent } from '@/lib/models';

/**
 * Safely resolves a ClientEvent by either unique urlToken or MongoDB ObjectId.
 * Defends against Mongoose CastError by only querying ObjectId when the identifier
 * matches valid 24-character hexadecimal format.
 */
export async function findEventByIdOrToken(idOrToken: string): Promise<IClientEvent | null> {
  if (!idOrToken || typeof idOrToken !== 'string') return null;
  const identifier = idOrToken.trim();
  if (!identifier) return null;

  // 1. Try urlToken first (safe string query, handles custom tokens like 'rahul-priya-2025' or 'vault-bulk-...')
  let event = await ClientEvent.findOne({
    $or: [
      { urlToken: identifier },
      { urlToken: identifier.toLowerCase() }
    ]
  });
  if (event) return event;

  // 2. Query by _id only if identifier is a valid 24-character hex ObjectId
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    event = await ClientEvent.findById(identifier);
    if (event) return event;
  }

  return null;
}
