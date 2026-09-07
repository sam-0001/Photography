import mongoose, { Schema, Document, Model } from 'mongoose';
import { IImageComposition } from './PortfolioMedia';

const CompositionSchema = new Schema(
  {
    focalX: { type: Number, default: 50, min: 0, max: 100 },
    focalY: { type: Number, default: 50, min: 0, max: 100 },
    zoom: { type: Number, default: 1, min: 1, max: 3 },
  },
  { _id: false }
);

const StorySlotSchema = new Schema(
  {
    url: { type: String, required: true },
    composition: { type: CompositionSchema, default: () => ({ focalX: 50, focalY: 50, zoom: 1 }) },
  },
  { _id: false }
);

export interface IStorySlot {
  url: string;
  composition: IImageComposition;
}

export interface IPortfolioStory extends Document {
  title: string;
  subtitle: string;
  category: string;
  eventDate: string;
  isPublished: boolean;
  isFeatured: boolean;
  
  // Specific grid slots
  slot1: IStorySlot;
  slot2: IStorySlot;
  slot3: IStorySlot;
  slot4: IStorySlot;
  
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioStorySchema = new Schema<IPortfolioStory>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    category: { type: String, required: true, trim: true },
    eventDate: { type: String, default: '2026' },
    isPublished: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    
    slot1: { type: StorySlotSchema, required: true },
    slot2: { type: StorySlotSchema, required: true },
    slot3: { type: StorySlotSchema, required: true },
    slot4: { type: StorySlotSchema, required: true },
    
    sortOrder: { type: Number, default: 0, index: true },
  },
  {
    timestamps: true,
    collection: 'portfolio_stories',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PortfolioStorySchema.index({ isFeatured: 1, isPublished: 1, sortOrder: 1 });
PortfolioStorySchema.index({ createdAt: -1 });

const PortfolioStory: Model<IPortfolioStory> =
  (mongoose.models?.PortfolioStory as Model<IPortfolioStory>) ||
  mongoose.model<IPortfolioStory>('PortfolioStory', PortfolioStorySchema);

export default PortfolioStory;
export { PortfolioStory };
