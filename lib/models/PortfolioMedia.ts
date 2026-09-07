import mongoose, { Schema, Document, Model } from 'mongoose';

export type PortfolioCategory =
  | 'Weddings'
  | 'Wedding'
  | 'Pre-Wedding'
  | 'Pre-Weddings'
  | 'Cinematic Films'
  | 'Films'
  | 'Editorial'
  | 'Portraits'
  | 'Albums';

export interface IExifData {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  focalLength?: string;
}

/** Admin-controlled image composition for the ComposedImage component */
export interface IImageComposition {
  /** Focal point X (0 = left, 100 = right). Default: 50 */
  focalX: number;
  /** Focal point Y (0 = top, 100 = bottom). Default: 50 */
  focalY: number;
  /** Zoom multiplier 1.0–3.0. Default: 1 */
  zoom: number;
}

export interface IPortfolioMedia extends Document {
  title: string;
  subtitle?: string;
  category: string;
  mediaType: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  aspectRatio: '4:5' | '16:9' | '1:1' | '3:2' | '2:3' | '4:3' | '3:4';
  /** Admin-controlled composition: focal point + zoom */
  composition?: IImageComposition;
  exif?: IExifData;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ExifSchema = new Schema(
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

const CompositionSchema = new Schema(
  {
    focalX: { type: Number, default: 50, min: 0, max: 100 },
    focalY: { type: Number, default: 50, min: 0, max: 100 },
    zoom: { type: Number, default: 1, min: 1, max: 3 },
  },
  { _id: false }
);

const PortfolioMediaSchema = new Schema<IPortfolioMedia>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Subtitle cannot exceed 200 characters'],
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
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
      required: [true, 'Media asset URL is required'],
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
    composition: {
      type: CompositionSchema,
      default: () => ({ focalX: 50, focalY: 50, zoom: 1 }),
    },
    exif: {
      type: ExifSchema,
      default: {},
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    collection: 'portfolio_media',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for showcase queries
PortfolioMediaSchema.index({ category: 1, isPublished: 1, sortOrder: 1 });
PortfolioMediaSchema.index({ isFeatured: 1, isPublished: 1, sortOrder: 1 });
PortfolioMediaSchema.index({ createdAt: -1 });

// Next.js hot-reloading safe compilation guard
const PortfolioMedia: Model<IPortfolioMedia> =
  (mongoose.models?.PortfolioMedia as Model<IPortfolioMedia>) ||
  mongoose.model<IPortfolioMedia>('PortfolioMedia', PortfolioMediaSchema);

export default PortfolioMedia;
export { PortfolioMedia };
