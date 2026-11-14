import Category from '../models/Category.js';

const DEFAULTS = {
  expense: ['Food & Dining', 'Transport', 'Housing', 'Utilities', 'Shopping', 'Health', 'Entertainment', 'Education', 'Other'],
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other'],
};

export async function seedDefaultCategories(userId) {
  const docs = Object.entries(DEFAULTS).flatMap(([type, names]) =>
    names.map((name) => ({ user: userId, name, type }))
  );
  await Category.insertMany(docs);
}
