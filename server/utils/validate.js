import ApiError from './ApiError.js';

export const isEmail = (value) =>
  typeof value === 'string' && /^\S+@\S+\.\S+$/.test(value.trim());

// Throws a 400 whose message is the first field error and whose `errors` holds all of them.
export const throwIfErrors = (errors) => {
  const keys = Object.keys(errors);
  if (keys.length) throw new ApiError(400, errors[keys[0]], errors);
};

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
