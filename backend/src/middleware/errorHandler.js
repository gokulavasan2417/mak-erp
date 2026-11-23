// MAK Tours & Travels ERP - Centralized Error Handler Middleware

export const errorHandler = (err, req, res, next) => {
  // Fix operator precedence: err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500)
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || undefined;

  // 1. Mongoose Validation Error -> 400
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    message = messages.length > 0 ? messages.join('. ') : 'Database validation failed';
    errors = err.errors;
  }

  // 2. Mongoose Cast Error (invalid ObjectId or type) -> 400
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value '${err.value}' provided for field '${err.path}'`;
  }

  // 3. MongoDB Duplicate Key Error (E11000) -> 409 Conflict
  else if (err.code === 11000) {
    statusCode = 409;
    const duplicateFields = Object.keys(err.keyPattern || err.keyValue || {}).join(', ');
    message = `A record with this ${duplicateFields || 'key'} already exists in your company.`;
  }

  // 4. Malformed JSON Body Parse Error -> 400
  else if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400) && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload received in request body';
  }

  // Sanitize message in production for internal 5xx errors to prevent information leakage
  const isProduction = process.env.NODE_ENV === 'production';
  const clientMessage = isProduction && statusCode >= 500 ? 'Internal Server Error' : message;

  // Safe server logging without leaking sensitive credentials
  console.error(`[API Error] ${req.method} ${req.url} - ${statusCode}: ${message}`);
  if (err.stack && !isProduction) {
    console.error(err.stack);
  }

  return res.status(statusCode).json({
    status: 'error',
    statusCode,
    code: err.code || undefined,
    message: clientMessage,
    ...(errors && { errors }),
    ...(!isProduction && { stack: err.stack })
  });
};

export default errorHandler;
