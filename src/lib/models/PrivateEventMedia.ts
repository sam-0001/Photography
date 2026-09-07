import mongoose, { Schema, Document, Model } from 'mongoose';

export type PrivateMediaCategory =
  | 'Ceremony'
  | 'Portraits'
  | 'Reception'
  | '35mm'
  | 'Pre-Wedding'
  | 'Details';

export interface IExifData {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  focalLength?: string;
}

export interface IPrivateEventMedia extends Document {
  eventId: mongoose.Types.ObjectId;
  urlToken: string;
  title: string;
  caption?: string;
  category: PrivateMediaCategory | string;
  mediaType: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  aspectRatio: '4:5' | '16:9' | '1:1' | '3:2' | '2:3' | '4:3' | '3:4';
  fileSize?: number;
  exif?: IExifData;
  sortOrder: number;
  isCover: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrivateExifSchema = new Schema(
  {
    camera: { type: String, trim: true },
    lens: { type: String, trim: true },
    aperture: { type: String, trim: true },
    shutter: { type: String, trim: true },
    iso: { type: String, trim: true },
    focalLength: { type: String, trim: true },
  },
  { _id: false }
);

const PrivateEventMediaSchema = new Schema<IPrivateEventMedia>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientEvent',
      required: [true, 'Associated eventId is required'],
      index: true,
    },
    urlToken: {
      type: String,
      required: [true, 'Denormalized urlToken is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Media title or filename is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [500, 'Caption cannot exceed 500 characters'],
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Gallery category is required'],
      default: 'Ceremony',
      index: true,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    url: {
      type: String,
      required: [true, 'Private asset URL is required'],
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: '',
    },
    aspectRatio: {
      type: String,
      enum: ['4:5', '16:9', '1:1', '3:2', '2:3', '4:3', '3:4'],
      default: '4:5',
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    exif: {
      type: PrivateExifSchema,
      default: {},
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isCover: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'private_event_media',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Performance queries: lookup by event, lookup by token & category
PrivateEventMediaSchema.index({ eventId: 1, sortOrder: 1 });
PrivateEventMediaSchema.index({ urlToken: 1, category: 1, sortOrder: 1 });
PrivateEventMediaSchema.index({ eventId: 1, isCover: 1 });

// Next.js hot-reloading safe compilation guard
const PrivateEventMedia: Model<IPrivateEventMedia> =
  (mongoose.models?.PrivateEventMedia as Model<IPrivateEventMedia>) ||
  mongoose.model<IPrivateEventMedia>('PrivateEventMedia', PrivateEventMediaSchema);

export default PrivateEventMedia;
export { PrivateEventMedia };
