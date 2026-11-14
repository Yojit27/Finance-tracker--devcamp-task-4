import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Authorization: loads :id only if it belongs to the logged-in user.
// Documents owned by someone else look exactly like missing ones (404), so nothing leaks.
export const loadOwned = (Model) =>
  asyncHandler(async (req, _res, next) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid id');
    const doc = await Model.findOne({ _id: id, user: req.user._id });
    if (!doc) throw new ApiError(404, `${Model.modelName} not found`);
    req.resource = doc;
    next();
  });
