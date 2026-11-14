import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Authentication: verifies the JWT and attaches the user to req.user.
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authorized: token missing');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Not authorized: token invalid or expired');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'Not authorized: user no longer exists');
  req.user = user;
  next();
});
