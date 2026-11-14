import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { throwIfErrors } from '../utils/validate.js';

const collation = { locale: 'en', strength: 2 };

const cleanName = (value) => {
  const name = String(value ?? '').trim();
  const errors = {};
  if (!name) errors.name = 'Category name is required';
  else if (name.length > 40) errors.name = 'Category name must be 40 characters or fewer';
  throwIfErrors(errors);
  return name;
};

export const listCategories = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) {
    if (!['income', 'expense'].includes(req.query.type)) throw new ApiError(400, 'Type must be income or expense');
    filter.type = req.query.type;
  }
  const categories = await Category.find(filter).sort({ type: 1, name: 1 }).collation(collation).lean();

  const counts = await Transaction.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const data = categories.map((c) => ({ ...c, transactionCount: countMap.get(String(c._id)) || 0 }));

  res.json({ success: true, count: data.length, data });
});

export const createCategory = asyncHandler(async (req, res) => {
  const name = cleanName(req.body.name);
  const type = req.body.type ?? 'expense';
  if (!['income', 'expense'].includes(type)) throw new ApiError(400, 'Type must be income or expense', { type: 'Invalid type' });

  const exists = await Category.findOne({ user: req.user._id, type, name }).collation(collation);
  if (exists) throw new ApiError(409, `You already have an ${type} category named "${exists.name}"`, { name: 'Category already exists' });

  const category = await Category.create({ user: req.user._id, name, type });
  res.status(201).json({ success: true, message: 'Category added', data: { ...category.toObject(), transactionCount: 0 } });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const doc = req.resource;
  const name = cleanName(req.body.name);

  const clash = await Category.findOne({ user: req.user._id, type: doc.type, name, _id: { $ne: doc._id } }).collation(collation);
  if (clash) throw new ApiError(409, `You already have an ${doc.type} category named "${clash.name}"`, { name: 'Category already exists' });

  doc.name = name; // type is intentionally immutable: existing transactions depend on it
  await doc.save();
  res.json({ success: true, message: 'Category updated', data: doc });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Transaction.countDocuments({ user: req.user._id, category: req.resource._id });
  if (inUse > 0) {
    throw new ApiError(
      409,
      `This category is used by ${inUse} transaction${inUse === 1 ? '' : 's'}. Move or delete them first.`
    );
  }
  await req.resource.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});
