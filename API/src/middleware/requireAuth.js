const { verifyToken } = require("../authTokens");
const { sendError } = require("../errors");

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return sendError(res, 401, "Token missing or invalid.");
  }
  const token = h.slice(7).trim();
  const v = verifyToken(token);
  if (!v.ok) {
    return sendError(res, 401, "Token missing or invalid.");
  }
  req.userId = v.userId;
  req.tokenJti = v.jti;
  next();
}

module.exports = { requireAuth };
