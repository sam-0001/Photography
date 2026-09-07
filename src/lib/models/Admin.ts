import mongoose, { Schema, Document, Model } from 'mongoose';

export type AdminRole = 'superadmin' | 'editor';

export interface IAdmin extends Document {
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    name: {
      type: String,
      trim: true,
      default: "Brother's Atelier Director",
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      enum: {
        values: ['superadmin', 'editor'],
        message: 'Role must be superadmin or editor',
      },
      default: 'superadmin',
    },
  },
  {
    timestamps: true,
    collection: 'admins',
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Strip sensitive passwordHash when serialized
        delete (ret as Record<string, unknown>).passwordHash;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Helper instance method for password comparison
AdminSchema.methods.comparePassword = async function (
  this: IAdmin,
  candidatePassword: string
): Promise<boolean> {
  try {
    const bcrypt = await import('bcryptjs');
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Next.js hot-reloading safe compilation guard
const Admin: Model<IAdmin> =
  (mongoose.models?.Admin as Model<IAdmin>) ||
  mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;
export { Admin };
