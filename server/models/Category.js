import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [40, 'Category name must be 40 characters or fewer'],
    },
    type: { type: String, enum: ['income', 'expense'], required: true, default: 'expense' },
  },
  { timestamps: true }
);

// A user cannot have two categories with the same name (case-insensitive) of the same type.
categorySchema.index(
  { user: 1, type: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

export default mongoose.model('Category', categorySchema);
