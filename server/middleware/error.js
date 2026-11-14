import ApiError from '../utils/ApiError.js';

export const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';
  let errors = err.errors;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err.name === 'ValidationError') {
    status = 400;
    errors = Object.fromEntries(Object.values(err.errors).map((e) => [e.path, e.message]));
    message = Object.values(errors)[0] || 'Validation failed';
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {}).filter((k) => k !== 'user').join(', ') || 'Value'} already exists`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  }

  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
    errors,
  });
};
