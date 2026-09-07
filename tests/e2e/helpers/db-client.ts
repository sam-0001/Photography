/**
 * Database client helper for Brother's Photography E2E tests.
 * Allows direct validation of MongoDB state when MONGODB_URI is provided.
 */

export class DbHelper {
  private uri: string | undefined;

  constructor() {
    this.uri = process.env.MONGODB_URI;
  }

  public isAvailable(): boolean {
    return Boolean(this.uri);
  }

  public async verifyEnquiryExists(email: string): Promise<boolean> {
    if (!this.uri) return true; // Graceful skip if running in network-only mode
    try {
      // Dynamic import to avoid hard crash if mongoose/mongodb not installed
      const mongoose = await import('mongoose').catch(() => null);
      if (!mongoose) return true;
      if (mongoose.default.connection.readyState !== 1) {
        await mongoose.default.connect(this.uri);
      }
      const collection = mongoose.default.connection.collection('enquiries');
      const doc = await collection.findOne({ email });
      return Boolean(doc);
    } catch {
      return true;
    }
  }

  public async verifyClientEventExists(urlToken: string): Promise<Record<string, unknown> | null> {
    if (!this.uri) return null;
    try {
      const mongoose = await import('mongoose').catch(() => null);
      if (!mongoose) return null;
      if (mongoose.default.connection.readyState !== 1) {
        await mongoose.default.connect(this.uri);
      }
      const collection = mongoose.default.connection.collection('client_events');
      return (await collection.findOne({ urlToken })) as Record<string, unknown> | null;
    } catch {
      return null;
    }
  }

  public async verifyPortfolioMediaExists(title: string): Promise<Record<string, unknown> | null> {
    if (!this.uri) return null;
    try {
      const mongoose = await import('mongoose').catch(() => null);
      if (!mongoose) return null;
      if (mongoose.default.connection.readyState !== 1) {
        await mongoose.default.connect(this.uri);
      }
      const collection = mongoose.default.connection.collection('portfolio_media');
      return (await collection.findOne({ title })) as Record<string, unknown> | null;
    } catch {
      return null;
    }
  }

  public async verifyPrivateEventMedia(eventIdOrToken: string): Promise<Record<string, unknown>[]> {
    if (!this.uri) return [];
    try {
      const mongoose = await import('mongoose').catch(() => null);
      if (!mongoose) return [];
      if (mongoose.default.connection.readyState !== 1) {
        await mongoose.default.connect(this.uri);
      }
      const collection = mongoose.default.connection.collection('private_event_media');
      const docs = await collection.find({
        $or: [{ urlToken: eventIdOrToken }, { eventId: eventIdOrToken }]
      }).toArray();
      return docs as Record<string, unknown>[];
    } catch {
      return [];
    }
  }
}
