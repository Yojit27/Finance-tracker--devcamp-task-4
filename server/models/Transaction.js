import mongoose from 'mongoose';

export const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must be 100 characters or fewer'],
    },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be greater than 0'] },
    type: { type: String, enum: ['income', 'expense'], required: [true, 'Type is required'] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    date: { type: Date, required: [true, 'Date is required'] },

    // Recurring transactions (bonus). A "template" has isRecurring=true and a nextRunDate.
    // Copies generated from it carry recurringSource = template id.
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: [...FREQUENCIES, null], default: null },
    nextRunDate: { type: Date, default: null },
    recurringSource: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, isRecurring: 1, nextRunDate: 1 });

export default mongoose.model('Transaction', transactionSchema);
