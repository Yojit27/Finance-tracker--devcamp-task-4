import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { isEmail, throwIfErrors } from '../utils/validate.js';
import { seedDefaultCategories } from '../utils/defaultCategories.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const { password } = req.body;

  const errors = {};
  if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  if (!isEmail(email)) errors.email = 'Enter a valid email address';
  if (typeof password !== 'string' || password.length < 8) errors.password = 'Password must be at least 8 characters';
  throwIfErrors(errors);

  if (await User.findOne({ email })) throw new ApiError(409, 'An account with this email already exists', { email: 'Email already registered' });

  const user = await User.create({ name, email, password });
  await seedDefaultCategories(user._id);

  res.status(201).json({ success: true, token: signToken(user._id), user });
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const { password } = req.body;

  const errors = {};
  if (!isEmail(email)) errors.email = 'Enter a valid email address';
  if (typeof password !== 'string' || !password) errors.password = 'Password is required';
  throwIfErrors(errors);

  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password so accounts cannot be probed.
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Invalid email or password');

  res.json({ success: true, token: signToken(user._id), user });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
