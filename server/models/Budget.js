import mongoose from 'mongoose';

// One overall spending budget per user per month ("YYYY-MM").
const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: String, required: true, match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be YYYY-MM'] },
    amount: { type: Number, required: true, min: [0.01, 'Budget must be greater than 0'] },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, month: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
