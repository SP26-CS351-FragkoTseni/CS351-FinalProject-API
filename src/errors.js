function sendError(res, status, message) {
  res.status(status).json({
    error: {
      code: status,
      message,
    },
  });
}

module.exports = { sendError };
