const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");

const revokedJtis = new Set();

function getSecret() {
  const s = process.env.JWT_SECRET || "dev-only-change-in-production";
  return s;
}

function signToken(userId) {
  const jti = randomUUID();
  const access_token = jwt.sign({ sub: userId, jti }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  return { access_token, jti };
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, getSecret());
    if (payload.jti && revokedJtis.has(payload.jti)) {
      return { ok: false, reason: "revoked" };
    }
    return { ok: true, userId: payload.sub, jti: payload.jti };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

function revokeJti(jti) {
  if (jti) revokedJtis.add(jti);
}

module.exports = { signToken, verifyToken, revokeJti };
