module.exports = (err, req, res, next) => {
  console.error('Error:', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message: message
  });
};