import mongoose from 'mongoose';

// Expense model with an explicit transaction `date` field (separate from createdAt)
const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
    },
    // NEW: explicit transaction date
    // Store in UTC; default to "now" if client doesn't provide one
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    timestamps: true, // keeps createdAt / updatedAt
  }
);

// Helpful indexes for common queries/aggregations
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1, date: -1 });

// Normalize string dates like 'YYYY-MM-DD' to Date objects
expenseSchema.pre('validate', function (next) {
  if (this.date && typeof this.date === 'string') {
    this.date = new Date(this.date);
  }
  next();
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
