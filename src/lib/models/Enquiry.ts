import mongoose, { Schema, Document, Model } from 'mongoose';

export type EnquiryStatus = 'new' | 'contacted' | 'booked' | 'closed';

export interface IEnquiry extends Document {
  fullName: string;
  email: string;
  phone?: string;
  commissionNature: string;
  estimatedDate: Date;
  venue: string;
  visionNotes?: string;
  status: EnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiry>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [120, 'Full name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    commissionNature: {
      type: String,
      required: [true, 'Commission nature is required'],
      enum: {
        values: [
          'Multi-day Wedding Monograph',
          'Intimate Destination Pre-Wedding',
          'Bespoke Editorial Portraiture',
          'Commercial Fine-Art Campaign',
          'Other',
        ],
        message: '{VALUE} is not an accepted commission tier',
      },
      default: 'Multi-day Wedding Monograph',
    },
    estimatedDate: {
      type: Date,
      required: [true, 'Estimated date is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue and destination is required'],
      trim: true,
      maxlength: [250, 'Venue cannot exceed 250 characters'],
    },
    visionNotes: {
      type: String,
      trim: true,
      maxlength: [3000, 'Vision notes cannot exceed 3000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['new', 'contacted', 'booked', 'closed'],
        message: 'Status must be new, contacted, booked, or closed',
      },
      default: 'new',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'enquiries',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound and retrieval indexes
EnquirySchema.index({ createdAt: -1 });
EnquirySchema.index({ status: 1, createdAt: -1 });
EnquirySchema.index({ email: 1 });

// Next.js hot-reloading safe compilation guard
const Enquiry: Model<IEnquiry> =
  (mongoose.models?.Enquiry as Model<IEnquiry>) ||
  mongoose.model<IEnquiry>('Enquiry', EnquirySchema);

export default Enquiry;
export { Enquiry };
