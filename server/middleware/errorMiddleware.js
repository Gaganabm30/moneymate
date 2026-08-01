const notFound = (req, res, next) => {
  const error = new Error(
    `Route not found: ${req.originalUrl}`
  );

  res.status(404);

  next(error);
};

const errorHandler = (
  error,
  req,
  res,
  next
) => {
  let statusCode =
    res.statusCode === 200
      ? 500
      : res.statusCode;

  // MongoDB duplicate key
  if (error.code === 11000) {
    statusCode = 409;
  }

  res.status(statusCode).json({
    success: false,

    message:
      error.code === 11000
        ? "This value already exists"
        : error.message ||
          "Internal server error",
  });
};

module.exports = {
  notFound,
  errorHandler,
};