import mongoose, { Schema, Document, Model } from 'mongoose';

export type ClientEventVisibility = 'published' | 'private' | 'hidden';

export interface IClientEvent extends Document {
  eventName: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  eventDate: Date;
  venue?: string;
  description?: string;
  urlToken: string;
  pinHash?: string | null;
  visibilityStatus: ClientEventVisibility;
  downloadsEnabled: boolean;
  sharingEnabled?: boolean;
  mediaIds: mongoose.Types.ObjectId[];
  qrCodeDataUrl?: string;
  viewCount: number;
  downloadCount?: number;
  archivalExpiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  hasPin: boolean;
  isActive: boolean;
}

const ClientEventSchema = new Schema<IClientEvent>(
  {
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [120, 'Client name cannot exceed 120 characters'],
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    clientPhone: {
      type: String,
      trim: true,
      default: '',
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    venue: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue cannot exceed 200 characters'],
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    urlToken: {
      type: String,
      required: [true, 'Unique URL token is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    pinHash: {
      type: String,
      default: null,
    },
    visibilityStatus: {
      type: String,
      enum: {
        values: ['published', 'private', 'hidden'],
        message: 'Visibility must be published, private, or hidden',
      },
      default: 'published',
      index: true,
    },
    downloadsEnabled: {
      type: Boolean,
      default: true,
    },
    sharingEnabled: {
      type: Boolean,
      default: true,
    },
    mediaIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PrivateEventMedia',
      },
    ],
    qrCodeDataUrl: {
      type: String,
      default: '',
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    archivalExpiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'client_events',
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Exclude sensitive pinHash by default when serialized to JSON
        delete ret.pinHash;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual: hasPin - returns true if a hashed PIN is set
ClientEventSchema.virtual('hasPin').get(function (this: IClientEvent) {
  return Boolean(this.pinHash && this.pinHash.length > 0);
});

// Virtual: isActive - returns true if visibility is not hidden
ClientEventSchema.virtual('isActive').get(function (this: IClientEvent) {
  return this.visibilityStatus !== 'hidden';
});

// Index specifications
ClientEventSchema.index({ visibilityStatus: 1, eventDate: -1 });
ClientEventSchema.index({ createdAt: -1 });

// Next.js hot-reloading safe compilation guard
const ClientEvent: Model<IClientEvent> =
  (mongoose.models?.ClientEvent as Model<IClientEvent>) ||
  mongoose.model<IClientEvent>('ClientEvent', ClientEventSchema);

export default ClientEvent;
export { ClientEvent };
